// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The session's edits the editor follows (sprints 431, 432; roadmap 2026-11-09-code-editor r10, E7; D93):
// the file-editing calls on the record after a given seq, each with the files it changes and its result
// when it has come. No I/O, no state.
//
// The calls, as the kernel writes them (substrate adapters/harness_streams.py; session vocabulary § Q):
//   - kernel ToolCall: edit_file [path, search, replace], write_file [path, text];
//   - HarnessToolCall, args by name:
//       Substrate's own tools through MCP: edit_file {path, search, replace}, write_file {path, text};
//         an MCP name may carry its server (`<server>-<tool>`, `<server>.<tool>`, `mcp__<server>__<tool>`);
//       Claude (ClaudeStreamParser passes its tool_use through): Write {file_path, content},
//         Edit {file_path, old_string, new_string}, MultiEdit {file_path, edits}, NotebookEdit {notebook_path};
//       Cursor (CursorStreamParser names a call by its `<name>ToolCall`): edit {path, streamContent};
//       Codex (CodexJsonParser): file_change {changes: [{kind, path}]}, which may arrive only completed
//         (its call and result together) and names no text.
// The text a call replaces is kept where the call names it (search, old_string); else the whole file.

import { EnvelopeKind } from "../../vm/envelope_kinds.gen";
import type { RecordEnvelope } from "../../vm/types";
import { relPath } from "./inspector";

/** The kernel tools that change a file (substrate topologies/tool_loop/tools.py `_edit_file`, `_write_file`). */
export const EDIT_TOOLS = new Set(["edit_file", "write_file"]);

export interface FollowFile { path: string; search: string | null }
export interface FollowItem {
  /** The call's seq: EDITOR_FOLLOW_MARKED's, and its resolution's (S10). */
  callSeq: number;
  tool: string;
  files: FollowFile[];
  resultSeq: number | null;
  ok: boolean | null;
}

type Args = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

/** The files a harness call changes, or null when it is not a file edit. */
export function harnessFiles(tool: string, args: Args): { path: string | null; search: string | null }[] | null {
  const name = tool.replace(/^.*(?:__|-|\.)(?=(edit_file|write_file)$)/, "");
  if (name === "edit_file") return [{ path: str(args.path), search: str(args.search) }];
  if (name === "write_file") return [{ path: str(args.path), search: null }];
  if (tool === "Edit") return [{ path: str(args.file_path), search: str(args.old_string) }];
  if (tool === "MultiEdit") {
    const first = Array.isArray(args.edits) ? (args.edits[0] as Args | undefined) : undefined;
    return [{ path: str(args.file_path), search: first ? str(first.old_string) : null }];
  }
  if (tool === "Write") return [{ path: str(args.file_path), search: null }];
  if (tool === "NotebookEdit") return [{ path: str(args.notebook_path), search: null }];
  if (tool === "edit") return [{ path: str(args.path), search: null }];
  if (tool === "file_change") return (Array.isArray(args.changes) ? args.changes : []).map((c) => ({ path: str((c as Args)?.path), search: null }));
  return null;
}

/** A call's result: the first result of its kind after it with its call_id (ids repeat per turn). */
function resultFor(envs: readonly RecordEnvelope[], call: RecordEnvelope, kind: string): RecordEnvelope | undefined {
  return envs.find((e) => e.kind === kind && e.seq > call.seq && e.payload.call_id === call.payload.call_id);
}

export function followItems(envs: readonly RecordEnvelope[], workspace: string | null, afterSeq: number): FollowItem[] {
  const out: FollowItem[] = [];
  const inside = (p: string | null): p is string => !!p && !p.startsWith("/") && !p.startsWith("..");
  for (const e of envs) {
    if (e.seq <= afterSeq) continue;
    let files: { path: string | null; search: string | null }[] | null;
    let resultKind: string;
    const tool = String(e.payload.tool);
    if (e.kind === EnvelopeKind.ToolCall) {
      if (!EDIT_TOOLS.has(tool)) continue;
      const args = (e.payload.args as unknown[]) ?? [];
      files = [{ path: relPath(args[0], workspace), search: tool === "edit_file" ? String(args[1] ?? "") : null }];
      resultKind = EnvelopeKind.ToolResult;
    } else if (e.kind === EnvelopeKind.HarnessToolCall) {
      const args = (e.payload.args && typeof e.payload.args === "object" ? e.payload.args : {}) as Args;
      files = harnessFiles(tool, args)?.map((f) => ({ path: relPath(f.path, workspace), search: f.search })) ?? null;
      resultKind = EnvelopeKind.HarnessToolResult;
    } else continue;
    const kept = (files ?? []).filter((f): f is FollowFile => inside(f.path));
    if (!kept.length) continue; // not a file edit, or outside the workspace
    const res = resultFor(envs, e, resultKind);
    out.push({ callSeq: e.seq, tool, files: kept, resultSeq: res ? res.seq : null, ok: res ? res.payload.ok !== false : null });
  }
  return out;
}
