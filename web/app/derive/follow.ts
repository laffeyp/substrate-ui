// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The session's edits the editor follows (sprint 431; roadmap 2026-11-09-code-editor r10, E7; D93): the
// kernel's file-editing calls on the record after a given seq, each with its result when it has come.
// No I/O, no state. Harness drivers' calls (HarnessToolCall) come with the next card.

import { EnvelopeKind } from "../../vm/envelope_kinds.gen";
import type { RecordEnvelope } from "../../vm/types";
import { relPath, resultOf } from "./inspector";

/** The kernel tools that change a file (substrate topologies/tool_loop/tools.py `_edit_file`, `_write_file`). */
export const EDIT_TOOLS = new Set(["edit_file", "write_file"]);

export interface FollowItem {
  /** The ToolCall's seq: EDITOR_FOLLOW_MARKED's, and its resolution's (S10). */
  callSeq: number;
  path: string;
  tool: string;
  /** edit_file's search text: the lines the call replaces; null for write_file (the whole file). */
  search: string | null;
  /** The ToolResult's seq and whether it is ok; null until it lands. */
  resultSeq: number | null;
  ok: boolean | null;
}

export function followItems(envs: readonly RecordEnvelope[], workspace: string | null, afterSeq: number): FollowItem[] {
  const out: FollowItem[] = [];
  for (const e of envs) {
    if (e.seq <= afterSeq || e.kind !== EnvelopeKind.ToolCall) continue;
    const tool = String(e.payload.tool);
    if (!EDIT_TOOLS.has(tool)) continue;
    const args = (e.payload.args as unknown[]) ?? [];
    const path = relPath(args[0], workspace);
    if (!path || path.startsWith("/") || path.startsWith("..")) continue; // outside the workspace
    const res = resultOf(envs, e);
    out.push({
      callSeq: e.seq, path, tool,
      search: tool === "edit_file" ? String(args[1] ?? "") : null,
      resultSeq: res ? res.seq : null,
      ok: res ? res.payload.ok !== false : null,
    });
  }
  return out;
}
