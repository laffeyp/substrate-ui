import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";
import { emit } from "../../instrumentation/sdd";
import { fetchJson } from "../../lib/fetch";

export const toolsSlash: SlashCommand = {
  name: "/tools",
  async execute(args, ctx) {
    const { h, body } = ctx;
    if (args.length === 0) {
      push(body, "/tools <comma-list> — restrict tool suite (empty for unrestricted)", CLS.err);
      return;
    }
    const toolList = args[0].split(",").map((t) => t.trim()).filter((t) => t.length > 0);
    if (!h.sessionId) {
      h.pendingCreate.tools = toolList;
      push(body, `tools → [${toolList.join(", ")}] (queued for next session)`, CLS.dim);
      return;
    }
    const result = await fetchJson(`/api/session/${encodeURIComponent(h.sessionId)}`, "PATCH", { tools: toolList });
    if (!result.ok) { push(body, `/tools failed [${result.failure_class}] ${result.detail}`, CLS.err); return; }
    emit("TOOLS_RESTRICTED", { session_id: h.sessionId, tools: toolList });
    push(body, `tools → [${toolList.join(", ")}] (next turn)`, CLS.accent);
  },
};
