// Bundle picked: load the bundle roster, pick the first one, assert
// BUNDLE_PICKED fires with that bundle's name and the controller holds it.
// UI sprint 107: the flow picked `roster[0].slug`, a field BundleRow does not have, so it picked
// `undefined` and passed on the tag alone; no gate type-checked harness/ until this sprint.

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

    const name = roster[0].name;
    controller.pickBundle(name);
    const picked = emitted.find((e) => e.tag === "BUNDLE_PICKED")?.payload as { bundle?: unknown } | undefined;
    const held = controller.snapshot().bundleSlug;
    if (picked?.bundle !== name || held !== name) {
      defects.push({
        category: "bundle_not_picked",
        observed: `BUNDLE_PICKED.bundle=${JSON.stringify(picked?.bundle)}, snapshot.bundleSlug=${JSON.stringify(held)}`,
        expected: `both ${JSON.stringify(name)}`,
        reproduces: true,
        severity: "high",
      });
    }
    controller.disconnect();
    return { emitted, defects };
  },
};
