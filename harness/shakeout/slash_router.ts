// Slash router. Opens one session, then drives every slash command the controller has
// (session_controller.ts slashCommands: help, model, name, list, interrupt, clear, exit) and checks
// what each one did, not only that it was routed: SLASH_ROUTED fires before the lookup, so it alone
// would pass for a command that does not exist. Unknown commands must fire SLASH_UNKNOWN; known
// ones must not.

import { SessionController } from "../../web/vm/session_controller";
import { NodeSubstrateClient } from "./lib/client";
import { BASE_URL } from "./lib/server";
import { sessionDriver } from "./lib/driver";
import type { Flow, EmittedRecord, Defect } from "./lib/flow";

const UNKNOWN = ["/unknownslashfoobar", "/tools", "/workspace", "/isolate"];

export const flow: Flow = {
  name: "slash_router",
  declared: ["SLASH_ROUTED", "SLASH_UNKNOWN"],
  async run(): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const client = new NodeSubstrateClient(BASE_URL);
    const controller = new SessionController(client);
    const emitted: EmittedRecord[] = [];
    controller.onEvent((ev) => emitted.push({ tag: ev.tag, payload: ev.payload }));
    const defects: Defect[] = [];
    const fail = (category: string, observed: string, expected: string) =>
      defects.push({ category, observed, expected, reproduces: true, severity: "high" });

    const driver = await sessionDriver(BASE_URL);
    await controller.loadDriverRoster();
    controller.pickDriver(driver);
    await controller.openSession({ driver });
    const sid = controller.snapshot().sessionId;
    if (!sid) {
      fail("no_session", "openSession left no session id", "a session to drive the slashes against");
      controller.disconnect();
      return { emitted, defects };
    }
    const rows = () => controller.snapshot().transcript;

    await controller.submitLine("/help");
    if (!rows().some((r) => r.text.startsWith("slash commands:"))) fail("help_no_listing", "no 'slash commands:' row", "/help lists the commands");

    await controller.submitLine("/model deterministic");
    if (controller.snapshot().driver !== "deterministic") fail("model_not_set", `driver ${controller.snapshot().driver}`, "/model sets the driver");

    await controller.submitLine("/name shakeout-slash");
    const named = await client.fetchJson<{ name?: string | null }>(`/api/session/${encodeURIComponent(sid)}`, { method: "GET" });
    if (!named.ok || named.data.name !== "shakeout-slash") fail("name_not_persisted", JSON.stringify(named), "/name renames the session on the server");

    await controller.submitLine("/list");
    if (!rows().some((r) => r.kind === "SlashListed")) fail("list_no_row", "no SlashListed row", "/list appends the session list");

    await controller.submitLine("/interrupt");

    await controller.submitLine("/clear");
    if (rows().length !== 0) fail("clear_left_rows", `${rows().length} rows after /clear`, "/clear empties the transcript");

    for (const line of UNKNOWN) await controller.submitLine(line);
    const unknown = new Set(emitted.filter((e) => e.tag === "SLASH_UNKNOWN").map((e) => String(e.payload.cmd)));
    for (const line of UNKNOWN) {
      if (!unknown.has(line.slice(1))) fail("unknown_not_flagged", `${line} fired no SLASH_UNKNOWN`, "every unknown command is flagged");
    }
    for (const known of ["help", "model", "name", "list", "interrupt", "clear"]) {
      if (unknown.has(known)) fail("known_flagged_unknown", `/${known} fired SLASH_UNKNOWN`, "known commands are dispatched");
    }

    await controller.submitLine("/exit");
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline && controller.snapshot().sessionId !== null) await new Promise((r) => setTimeout(r, 100));
    const ended = await client.fetchJson<{ status?: string }>(`/api/session/${encodeURIComponent(sid)}`, { method: "GET" });
    const endedStatus = ended.ok ? ended.data.status : `HTTP ${ended.status}`;
    if (endedStatus !== "ended") fail("exit_not_ended", `server status ${endedStatus}`, "/exit ends the session on the server");

    controller.disconnect();
    return { emitted, defects };
  },
};
