// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";
import { fetchGet } from "../../lib/fetch";

// /inspect and /narrate share a single implementation — both read the
// record's narration lines. The router aliases them to the same
// SlashCommand instance via two SLASH_COMMANDS entries.
export const inspectSlash: SlashCommand = {
  name: "/inspect",
  async execute(args, ctx) {
    const { h, body } = ctx;
    const recordName = args[0] || h.currentRecord;
    if (!recordName) { push(body, `/inspect needs a record name (or open a session first)`, CLS.err); return; }
    const result = await fetchGet<unknown[]>(`/api/records/${encodeURIComponent(recordName)}/narrate`);
    if (!result.ok) { push(body, `/inspect failed [${result.failure_class}] ${result.detail}`, CLS.err); return; }
    for (const l of result.data) push(body, String(l), CLS.out);
  },
};

export const narrateSlash: SlashCommand = {
  name: "/narrate",
  async execute(args, ctx) {
    // Same wire; different label in the help text.
    await inspectSlash.execute(args, ctx);
  },
};
