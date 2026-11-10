// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What the editor's status line says (sprint 424; roadmap 2026-11-09-code-editor r8, E4; spec r6 §5
// "Code": "-- NORMAL -- · file · line:col · +2 −1 vs main"; frame 24a). No I/O, no state.
// - the mode, under vim only: `-- NORMAL --`, `-- INSERT --`, `-- VISUAL --` (`-- VISUAL LINE --`,
//   `-- VISUAL BLOCK --` as vim names them), `-- REPLACE --`;
// - `+N −M vs <base>`: the buffer as typed against the base. The base's text is the file as read with
//   its hunks (git diff -U0 against the base, sprint 418) undone, so no second read is needed.

import { lineDelta, type Hunk } from "./inspector";

export type VimMode = "normal" | "insert" | "visual" | "visual line" | "visual block" | "replace";

export function modeLabel(mode: VimMode | null): string | null {
  return mode ? `-- ${mode.toUpperCase()} --` : null;
}

/** The base's text: `text` (the file as read) with each -U0 hunk undone. */
export function baseText(text: string, hunks: readonly Hunk[]): string {
  const out = text === "" ? [] : text.replace(/\n$/, "").split("\n");
  for (const hunk of [...hunks].sort((x, y) => y.new_start - x.new_start)) {
    const removed = hunk.lines.filter((l) => l.startsWith("-")).map((l) => l.slice(1));
    // git's new_start: the first new line; for a pure removal, the line the removed ones followed.
    const at = hunk.new_count > 0 ? hunk.new_start - 1 : hunk.new_start;
    out.splice(at, hunk.new_count, ...removed);
  }
  return out.length ? out.join("\n") + "\n" : "";
}

/** The buffer's lines added and removed against the base. */
export function vsBase(base: string, buffer: string): { plus: number; minus: number } {
  return lineDelta(base, buffer);
}
