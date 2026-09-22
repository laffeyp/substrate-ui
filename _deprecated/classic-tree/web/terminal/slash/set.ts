import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push, formatParamsHint } from "../helpers";
import { emit } from "../../instrumentation/sdd";
import { fetchJson } from "../../lib/fetch";

const KEYS = ["think", "tokens", "timeout", "num_ctx"];

export const setSlash: SlashCommand = {
  name: "/set",
  async execute(args, ctx) {
    const { h, body } = ctx;
    if (args.length === 0) {
      push(body, `params — ${formatParamsHint(h.driverParams)}`, CLS.dim);
      return;
    }
    const key = args[0];
    const val = args[1];
    if (!KEYS.includes(key)) {
      push(body, `/set: unknown key '${key}'; try think | tokens | timeout | num_ctx`, CLS.err);
      return;
    }
    if (val === undefined) { push(body, `/set ${key} <value>`, CLS.err); return; }
    const mkey = key === "tokens" ? "max_tokens" : key;
    let parsed: unknown;
    if (mkey === "think") {
      if (val !== "on" && val !== "off") { push(body, "/set think on|off", CLS.err); return; }
      parsed = val === "on";
    } else if (mkey === "max_tokens" || mkey === "num_ctx") {
      const n = parseInt(val, 10);
      if (!Number.isFinite(n) || n < 0 || (mkey === "num_ctx" && n < 1)) {
        push(body, `/set ${key}: must be a non-negative integer${mkey === "num_ctx" ? " ≥ 1" : ""}`, CLS.err);
        return;
      }
      parsed = n;
    } else {
      const f = parseFloat(val);
      if (!Number.isFinite(f) || f <= 0) { push(body, "/set timeout: must be > 0 (seconds)", CLS.err); return; }
      parsed = f;
    }
    const prior = h.driverParams ? { ...h.driverParams } : {};
    const next: Record<string, unknown> = { ...prior, [mkey]: parsed };
    if (!h.sessionId) {
      h.pendingDriverParams = next;
      h.driverParams = next;
      h.updateParamsHint();
      push(body, `${key} → ${val} (queued for next session)`, CLS.dim);
      return;
    }
    const result = await fetchJson<{ driver_params?: Record<string, unknown> | null }>(
      `/api/session/${encodeURIComponent(h.sessionId)}`,
      "PATCH",
      { driver_params: next },
    );
    if (!result.ok) { push(body, `/set failed [${result.failure_class}] ${result.detail}`, CLS.err); return; }
    h.driverParams = result.data.driver_params ?? next;
    emit("DRIVER_PARAMS_PATCHED", { session_id: h.sessionId, params: next, prior_params: prior });
    h.updateParamsHint();
    push(body, `${key} → ${val} (next turn)`, CLS.accent);
  },
};
