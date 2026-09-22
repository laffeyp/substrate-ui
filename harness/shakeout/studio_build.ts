// Studio build with a valid fixture (per builder.py's docstring
// spec shape). One deterministic Producer emitting one kind, no
// views/triggers/routes, termination by all_completed. The Producer
// is deterministic; the model behind the responder does not matter
// here — this flow tests the studio path, not the model path.

import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import { BASE_URL } from "./lib/server";
import type { Flow, EmittedRecord, Defect } from "./lib/flow";

const FIXTURE_SPEC = {
  name: "shakeout_spec",
  producers: [
    { kind: "reviewer", emits: ["Critique"], initial: true, deterministic: true },
  ],
  views: [],
  triggers: [],
  routes: [],
  termination: { kind: "all_completed" },
};

const BAD_SPEC = {
  name: "shakeout_bad_spec",
  producers: [],
  views: [],
  triggers: [],
  routes: [],
  termination: { kind: "all_completed" },
};

export const flow: Flow = {
  name: "studio_build",
  declared: [
    "SPEC_VALIDATE_REQUESTED",
    "SPEC_VALIDATED",
    "SPEC_BUILD_REQUESTED",
    "SPEC_BUILT",
    "SPEC_BUILD_REJECTED",
  ],
  async run(): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const client = new NodeSubstrateClient(BASE_URL);
    const controller = new SessionController(client);
    const emitted: EmittedRecord[] = [];
    controller.onEvent((ev) => emitted.push({ tag: ev.tag, payload: ev.payload }));

    const defects: Defect[] = [];

    // Happy path: valid spec, expect SPEC_BUILT.
    await controller.validateSpec(FIXTURE_SPEC);
    await controller.buildSpec(FIXTURE_SPEC);
    const built = emitted.find((e) => e.tag === "SPEC_BUILT");
    if (!built) {
      defects.push({
        category: "spec_built_not_emitted",
        observed: "valid fixture spec did not fire SPEC_BUILT",
        expected: "SPEC_BUILT with run_name and status",
        reproduces: true,
        severity: "high",
      });
    } else {
      if (!built.payload.run_name || String(built.payload.run_name).length === 0) {
        defects.push({
          category: "spec_built_empty_run_name",
          observed: "SPEC_BUILT.run_name is empty",
          expected: "a real run identifier",
          reproduces: true,
          severity: "medium",
        });
      }
    }

    // Sad path: producer-less spec, expect SPEC_BUILD_REJECTED.
    await controller.validateSpec(BAD_SPEC);
    await controller.buildSpec(BAD_SPEC);
    const rejected = emitted.filter((e) => e.tag === "SPEC_BUILD_REJECTED");
    if (rejected.length === 0) {
      defects.push({
        category: "bad_spec_not_rejected",
        observed: "producer-less spec did not fire SPEC_BUILD_REJECTED",
        expected: "server or validator refuses; SPEC_BUILD_REJECTED with reason",
        reproduces: true,
        severity: "high",
      });
    }

    controller.disconnect();
    return { emitted, defects };
  },
};
