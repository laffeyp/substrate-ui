// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Build the fixtures for the long-session gate (sprint 523): a hand-written Claude Code session
// file and a deterministic tool-call script that together produce a record of 20,000+ envelopes,
// one call streaming 10,000+ ToolProgress chunks totalling at least 2 MB.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const WORDS = (
  "the window counts each turn before it sends the prompt and the record holds every event " +
  "a session writes while the model reads files runs commands and replies to the person"
).split(" ");

function text(i: number, n: number): string {
  return Array.from({ length: n }, (_, k) => `${WORDS[(i + k) % WORDS.length]}${(i * 7 + k) % 101}`).join(" ");
}

/** Write a Claude Code session file (JSONL) with `turns` exchanges.  Each exchange: a user
 *  message, an assistant reply containing a Bash tool_use, its tool_result, and a closing
 *  reply.  The shape matches `tests/test_esc_while_a_long_session_loads.py`'s `_session_file`. */
export function writeSessionFile(path: string, turns: number): void {
  const lines: string[] = [];
  lines.push(JSON.stringify({ type: "system", subtype: "compact_boundary", content: "Conversation compacted" }));
  lines.push(JSON.stringify({
    type: "user",
    isCompactSummary: true,
    message: { role: "user", content: "SUMMARY: a long piece of work so far." },
  }));
  for (let i = 0; i < turns; i++) {
    lines.push(JSON.stringify({
      type: "user",
      message: { role: "user", content: `message ${i}: ${text(i, 30)}` },
    }));
    lines.push(JSON.stringify({
      type: "assistant",
      message: {
        role: "assistant",
        content: [
          { type: "text", text: `Looking. ${text(i + 1, 10)}` },
          { type: "tool_use", id: `toolu_${i}`, name: "Bash", input: { command: `grep -rn term${i} src` } },
        ],
      },
    }));
    lines.push(JSON.stringify({
      type: "user",
      message: {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: `toolu_${i}`, content: text(i + 2, 60) }],
      },
    }));
    lines.push(JSON.stringify({
      type: "assistant",
      message: { role: "assistant", content: [{ type: "text", text: `reply ${i}` }] },
    }));
  }
  writeFileSync(path, lines.join("\n") + "\n");
}

/** Build a workspace and a tool-call script for the deterministic driver.
 *
 *  The script has several short tool calls (a read, a write, a short bash) and one bash command
 *  that streams tens of thousands of lines — each line ~200 bytes of random-looking text so the
 *  total exceeds 2 MB.  The kernel's bash tool emits one ToolProgress envelope per stdout line,
 *  so this produces 10,000+ ToolProgress chunks.
 *
 *  Returns `{ workspace, script }` for `POST /api/session`. */
export function buildToolScript(stateDir: string): { workspace: string; script: [string, string[]][] } {
  const ws = join(stateDir, "gate-ws");
  mkdirSync(ws, { recursive: true });
  writeFileSync(join(ws, "sample.py"), "def hello():\n    return 'world'\n");
  writeFileSync(join(ws, "data.json"), JSON.stringify({ gate: true, n: 523 }));

  // The streaming command must stream OVER TIME, not dump and exit.  The kernel bash tool
  // (../substrate/.../tool_loop/tools.py `_pump`) reads stdout and emits one per-line ToolProgress
  // every 50 ms only WHILE the process is alive, with a single 1 MiB pump after it exits.  A command
  // that writes all its output and exits at once yields only ~1 MiB of per-line ToolProgress (≈7,900
  // lines); the rest lands in the final result, under the 10,000-chunk / 2 MB minimum.  So awk
  // flushes and sleeps every 200 lines: 25,000 lines x ~133 bytes = ~3.3 MB streamed over ~4 s, which
  // the kernel pumps into ~25,000 ToolProgress chunks.  This also matches the real hazard — the
  // 2.65 MB bash on 2026-11-18 streamed over time, the only way the kernel emits tens of thousands of
  // per-line ToolProgress envelopes.
  const streamCmd = "seq 1 25000 | awk '{ printf \"line %05d: \", $1; for (i=0;i<12;i++) printf \"abcdefghij\"; print \"\"; if ($1 % 200 == 0) { fflush(); system(\"sleep 0.03\") } }'";

  const script: [string, string[]][] = [
    ["read_file", ["sample.py"]],
    ["write_file", ["output.txt", "gate 523 wrote this file\n"]],
    ["bash", ["cat data.json"]],
    ["bash", [streamCmd]],
    ["bash", ["echo done"]],
  ];

  return { workspace: ws, script };
}
