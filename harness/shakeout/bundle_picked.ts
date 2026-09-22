// Bundle picked: load the bundle roster, pick the first one, assert
// BUNDLE_PICKED fires with the slug.

import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import { BASE_URL } from "./lib/server";
import type { Flow, EmittedRecord, Defect } from "./lib/flow";

export const flow: Flow = {
  name: "bundle_picked",
  declared: ["BUNDLE_ROSTER_LOADED", "BUNDLE_PICKED"],
  async run(): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const client = new NodeSubstrateClient(BASE_URL);
    const controller = new SessionController(client);
    const emitted: EmittedRecord[] = [];
    controller.onEvent((ev) => emitted.push({ tag: ev.tag, payload: ev.payload }));

    await controller.loadBundleRoster();
    const defects: Defect[] = [];
    const roster = controller.snapshot().bundleRoster;
    if (!roster.length) {
      defects.push({
        category: "empty_bundle_roster",
        observed: "no bundles from /api/bundles",
        expected: "at least one bundle registered on the server",
        reproduces: true,
        severity: "low",
      });
      controller.disconnect();
      return { emitted, defects };
    }

    controller.pickBundle(roster[0].slug);
    controller.disconnect();
    return { emitted, defects };
  },
};
