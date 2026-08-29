import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";
import { fetchJson } from "../../lib/fetch";

export const runSlash: SlashCommand = {
  name: "/run",
  async execute(args, ctx) {
    const { body } = ctx;
    if (args.length === 0) { push(body, "/run <application> [args...]", CLS.err); return; }
    const app = args[0];
    const result = await fetchJson<{ run_id?: string; record_root?: string; status?: string; error?: string }>(
      `/api/topology/${encodeURIComponent(app)}/run`,
      "POST",
      { inputs: {}, await_completion: false },
    );
    if (!result.ok) { push(body, `/run ${app} failed [${result.failure_class}] ${result.detail}`, CLS.err); return; }
    if (result.data.error) { push(body, `/run ${app}: ${result.data.error}`, CLS.err); return; }
    push(body, `${app} launched → ${result.data.run_id ?? "?"} (${result.data.status ?? "?"})`, CLS.accent);
  },
};
