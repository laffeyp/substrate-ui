import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";
import { fetchJson } from "../../lib/fetch";

export const interruptSlash: SlashCommand = {
  name: "/interrupt",
  async execute(_args, ctx) {
    const { h, body } = ctx;
    if (!h.sessionId) { push(body, "/interrupt needs an active session", CLS.err); return; }
    const result = await fetchJson(`/api/session/${encodeURIComponent(h.sessionId)}/interrupt`, "POST", {});
    if (!result.ok) { push(body, `/interrupt failed [${result.failure_class}] ${result.detail}`, CLS.err); return; }
    push(body, "interrupt sent — current turn canceling", CLS.dim);
  },
};
