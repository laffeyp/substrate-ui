// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";
import { fetchGet } from "../../lib/fetch";

export const diffSlash: SlashCommand = {
  name: "/diff",
  async execute(_args, ctx) {
    const { h, body } = ctx;
    if (!h.sessionId) { push(body, "/diff needs an active session", CLS.err); return; }
    const s = await fetchGet<{ workspace?: string }>(`/api/session/${encodeURIComponent(h.sessionId)}`);
    if (!s.ok || !s.data.workspace) { push(body, "/diff: could not resolve session workspace", CLS.err); return; }
    const result = await fetchGet<{ files?: string[]; diff?: string; error?: string }>(
      `/api/worktree_diff?path=${encodeURIComponent(s.data.workspace)}`,
    );
    if (!result.ok) { push(body, `/diff failed [${result.failure_class}] ${result.detail}`, CLS.err); return; }
    if (result.data.error) { push(body, `/diff: ${result.data.error}`, CLS.err); return; }
    const files = result.data.files ?? [];
    if (!files.length) { push(body, "no changes in this session's worktree yet", CLS.dim); return; }
    push(body, `${files.length} file(s) changed:`, CLS.dim);
    for (const f of files) push(body, `  ${f}`, CLS.out);
    const diff = result.data.diff ?? "";
    for (const l of diff.slice(0, 2000).split("\n")) push(body, l, CLS.out);
    if (diff.length > 2000) push(body, `… (truncated; ${diff.length - 2000} more bytes)`, CLS.dim);
  },
};
