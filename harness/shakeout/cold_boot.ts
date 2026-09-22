// Cold boot flow: build a controller, run the four bootloaders, read
// the tag trace. No session opened. No turn submitted.

import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import { BASE_URL } from "./lib/server";
import type { Flow, EmittedRecord, Defect } from "./lib/flow";

export const flow: Flow = {
  name: "cold_boot",
  declared: [
    "DRIVER_ROSTER_LOADED",
    "SESSIONS_LOADED",
    "WORKSPACES_LOADED",
    "BUNDLE_ROSTER_LOADED",
  ],
  async run(): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const client = new NodeSubstrateClient(BASE_URL);
    const controller = new SessionController(client);
    const emitted: EmittedRecord[] = [];
    controller.onEvent((ev) => emitted.push({ tag: ev.tag, payload: ev.payload }));

    await Promise.all([
      controller.loadDriverRoster(),
      controller.loadLiveSessions(),
      controller.loadRecentWorkspaces(),
      controller.loadBundleRoster(),
    ]);

    const defects: Defect[] = [];
    const snap = controller.snapshot();
    if (snap.driverRoster.length === 0) {
      defects.push({
        category: "empty_roster",
        observed: "driverRoster is empty after loadDriverRoster",
        expected: "driverRoster has at least one entry from /api/models",
        reproduces: true,
        severity: "high",
      });
    }
    if (snap.driverDefault === null && snap.driverRoster.length > 0) {
      defects.push({
        category: "no_default_driver",
        observed: "driverRoster non-empty but driverDefault is null",
        expected: "driverDefault names the server's chosen default",
        reproduces: true,
        severity: "medium",
      });
    }

    controller.disconnect();
    return { emitted, defects };
  },
};
