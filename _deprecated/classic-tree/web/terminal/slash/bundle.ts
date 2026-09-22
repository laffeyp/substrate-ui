import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";
import { emit } from "../../instrumentation/sdd";
import { fetchJson } from "../../lib/fetch";

export const bundleSlash: SlashCommand = {
  name: "/bundle",
  async execute(args, ctx) {
    const { h, body } = ctx;
    if (args.length !== 1) { push(body, "/bundle <name> — attach bundle mid-session (or before)", CLS.err); return; }
    if (!h.sessionId) {
      h.pendingCreate.bundle = args[0];
      push(body, `bundle → ${args[0]} (queued for next session)`, CLS.dim);
      return;
    }
    const priorBundle = h.bundleSlug || null;
    const result = await fetchJson<{ bundle?: string | null }>(`/api/session/${encodeURIComponent(h.sessionId)}`, "PATCH", { bundle: args[0] });
    if (!result.ok) { push(body, `/bundle failed [${result.failure_class}] ${result.detail}`, CLS.err); return; }
    h.bundleSlug = args[0];
    emit("BUNDLE_ATTACHED", { session_id: h.sessionId, bundle: args[0], prior_bundle: priorBundle });
    push(body, `bundle → ${args[0]} (next turn seed re-assembles)`, CLS.accent);
  },
};
