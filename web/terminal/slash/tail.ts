import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";
import { fetchGet } from "../../lib/fetch";

export const tailSlash: SlashCommand = {
  name: "/tail",
  async execute(args, ctx) {
    const { h, body } = ctx;
    const recordName = args[0] || h.currentRecord;
    if (!recordName) { push(body, "/tail needs a record name (or open a session first)", CLS.err); return; }
    const result = await fetchGet<Array<{ seq: number; kind: string; t?: number }>>(
      `/api/records/${encodeURIComponent(recordName)}/events`,
    );
    if (!result.ok) { push(body, `/tail failed [${result.failure_class}] ${result.detail}`, CLS.err); return; }
    for (const ev of result.data) push(body, `seq ${String(ev.seq).padStart(3, "0")}  ${ev.kind}`, CLS.out);
    push(body, `${result.data.length} event(s)`, CLS.dim);
  },
};
