// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";

export const contextSlash: SlashCommand = {
  name: "/context",
  async execute(args, ctx) {
    const { h, body } = ctx;
    if (args.length === 0) { push(body, "/context <lo-hi> [--kind K]", CLS.err); return; }
    const range = args[0];
    if (!range.includes("-")) { push(body, "/context: range must be <lo>-<hi>", CLS.err); return; }
    const [loStr, hiStr] = range.split("-", 2);
    const lo = parseInt(loStr, 10);
    const hi = parseInt(hiStr, 10);
    if (Number.isNaN(lo) || Number.isNaN(hi)) { push(body, "/context: <lo> and <hi> must be integers", CLS.err); return; }
    const kinds: string[] = [];
    const kIdx = args.indexOf("--kind");
    if (kIdx >= 0 && kIdx + 1 < args.length) kinds.push(args[kIdx + 1]);
    h.pendingContext = { parent_seq_range: [lo, hi], kinds };
    push(body, `context pending: seq ${lo}..${hi}${kinds.length ? ` kinds=${kinds.join(",")}` : ""}`, CLS.dim);
  },
};
