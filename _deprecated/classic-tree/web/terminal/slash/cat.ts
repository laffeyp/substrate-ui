import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";
import { fetchGet } from "../../lib/fetch";

export const catSlash: SlashCommand = {
  name: "/cat",
  async execute(args, ctx) {
    const { h, body } = ctx;
    if (args.length === 0) { push(body, "/cat <seq> [<record>]", CLS.err); return; }
    const seq = parseInt(args[0], 10);
    if (Number.isNaN(seq)) { push(body, "/cat: <seq> must be an integer", CLS.err); return; }
    const recordName = args[1] || h.currentRecord;
    if (!recordName) { push(body, "/cat needs a record name (or open a session first)", CLS.err); return; }
    const result = await fetchGet<Array<{ seq: number; kind: string; payload: unknown }>>(
      `/api/records/${encodeURIComponent(recordName)}/events`,
    );
    if (!result.ok) { push(body, `/cat failed [${result.failure_class}] ${result.detail}`, CLS.err); return; }
    const ev = result.data.find((e) => e.seq === seq);
    if (!ev) { push(body, `/cat: no event at seq ${seq}`, CLS.err); return; }
    push(body, `# seq ${ev.seq}  ${ev.kind}`, CLS.dim);
    for (const l of JSON.stringify(ev.payload, null, 2).split("\n")) push(body, l, CLS.out);
  },
};
