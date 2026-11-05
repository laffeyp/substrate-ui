// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The top bar's workspace card (sprint 232; plan PLAN-2026-11-04-shell-to-react-r5.md, B3, F328).
//
// The template's card fell back to `~/.substrate/sandbox` and `sandbox` for any pane without a
// folder: an unbound pane, and a pane on the default per-session sandbox, whose folder the server
// mints. Its branch line showed the folder's path for every shape but a worktree. The card now names
// the folder the server reports for the session, else the folder the pane was bound to; a pane with
// neither says so, and the branch line names a branch only for a worktree.

export interface WorkspaceCardInput {
  unbound: boolean;
  /** The folder the pane was bound to; empty for the default per-session sandbox. */
  ws: string;
  /** isolated (per-session sandbox), sandbox (the shared one), flat (a picked folder), worktree. */
  shape: string;
  name: string;
  /** The session's folder as the server reports it; null before a session opens. */
  workspacePath: string | null;
}

export interface WorkspaceCardText { workspace: string; shape: string; branch: string; }

const home = (path: string) => path.replace(/^\/Users\/[^/]+/, "~");

export function workspaceCard(input: WorkspaceCardInput): WorkspaceCardText {
  if (input.unbound) return { workspace: "none yet — pick one in the pane", shape: "—", branch: "—" };
  const workspace = input.workspacePath ? home(input.workspacePath)
    : input.ws ? input.ws
      : input.shape === "isolated" ? "fresh per-session sandbox" : "—";
  return {
    workspace,
    shape: input.shape || "—",
    branch: input.shape === "worktree" ? "substrate/" + (input.name || "main") : "—",
  };
}
