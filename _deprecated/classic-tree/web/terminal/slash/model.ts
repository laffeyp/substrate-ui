import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";
import { emit } from "../../instrumentation/sdd";
import { fetchJson } from "../../lib/fetch";

export const modelSlash: SlashCommand = {
  name: "/model",
  async execute(args, ctx) {
    const { h, body } = ctx;
    if (args.length !== 1) { push(body, "/model requires exactly one driver name", CLS.err); return; }
    if (!h.sessionId) { push(body, "/model needs an active session — send a message first", CLS.err); return; }
    const priorDriver = h.driverName;
    const result = await fetchJson(`/api/session/${encodeURIComponent(h.sessionId)}`, "PATCH", { driver: args[0] });
    if (!result.ok) { push(body, `/model failed [${result.failure_class}] ${result.detail}`, CLS.err); return; }
    h.driverName = args[0];
    emit("DRIVER_PATCHED", { session_id: h.sessionId, driver: args[0], prior_driver: priorDriver });
    push(body, `driver → ${args[0]} (next turn)`, CLS.accent);
    h.updatePrompt();
  },
};
