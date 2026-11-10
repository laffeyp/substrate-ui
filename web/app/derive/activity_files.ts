// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The left column's activity tab (sprint 440; design spec r6 §5.1, "every file the session touched, newest
// first (the workspace-wide ACTIVITY)"; roadmap r10 E8): from the session's record, each workspace file a call
// touched, with the turn, seq and tool of its latest touch. Read as the inspector's ACTIVITY reads one file
// (derive/inspector.ts): the kernel's read_file, edit_file and write_file by their path, and grep by the files
// its result names; the harness drivers' file edits in the shapes derive/follow.ts reads, and Claude's Read
// {file_path}; and each FileWritten (a save by hand, or a HISTORY step). bash names no file it is sure of, so
// it is left out here. A path outside the workspace is left out. No I/O, no state.

import { EnvelopeKind } from "../../vm/envelope_kinds.gen";
import type { RecordEnvelope } from "../../vm/types";
import { relPath, resultOf, turnOf } from "./inspector";
import { harnessFiles } from "./follow";

export interface ActivityFile { path: string; seq: number; turn: number | null; tool: string; touches: number }

const FILE_TOOLS = new Set(["read_file", "edit_file", "write_file"]);
const inside = (p: string | null): p is string => !!p && !p.startsWith("/") && !p.startsWith("..");

/** Every workspace file the record's calls touched, newest touch first. */
export function activityFiles(envs: readonly RecordEnvelope[], workspace: string | null): ActivityFile[] {
  const turn = turnOf(envs);
  const by = new Map<string, ActivityFile>();
  const touch = (path: string | null, e: RecordEnvelope, tool: string) => {
    if (!inside(path)) return;
    const was = by.get(path);
    by.set(path, { path, seq: e.seq, turn: turn(e.seq), tool, touches: (was?.touches ?? 0) + 1 });
  };
  for (const e of envs) {
    const tool = String(e.payload.tool ?? "");
    if (e.kind === EnvelopeKind.ToolCall) {
      const args = (e.payload.args as unknown[]) ?? [];
      if (FILE_TOOLS.has(tool)) touch(relPath(args[0], workspace), e, tool);
      else if (tool === "grep") {
        const out = String(resultOf(envs, e)?.payload.output ?? "");
        const files = new Set(out.split("\n").filter((l) => l.includes(":")).map((l) => relPath(l.split(":")[0], workspace)));
        for (const f of files) touch(f, e, tool);
      }
    } else if (e.kind === EnvelopeKind.HarnessToolCall) {
      const args = (e.payload.args && typeof e.payload.args === "object" ? e.payload.args : {}) as Record<string, unknown>;
      const files = tool === "Read" ? [{ path: typeof args.file_path === "string" ? args.file_path : null }] : harnessFiles(tool, args) ?? [];
      for (const f of files) touch(relPath(f.path, workspace), e, tool);
    } else if (e.kind === EnvelopeKind.FileWritten) {
      touch(relPath(e.payload.path, workspace), e, e.payload.view === "history" ? "history step" : "saved by hand");
    }
  }
  return Array.from(by.values()).sort((a, b) => b.seq - a.seq);
}
