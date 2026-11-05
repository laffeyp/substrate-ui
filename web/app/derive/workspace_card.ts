// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The top bar's workspace card (sprint 232; plan PLAN-2026-11-04-shell-to-react-r5.md, B3, F328).
//
// The template's card fell back to `~/.substrate/sandbox` and `sandbox` for any pane without a
// folder: an unbound pane, and a pane on the default per-session sandbox, whose folder the server
// mints. Its branch line showed the folder's path, or for a git folder `substrate/<pane name>`, a
// branch no session has (F339: sessions get no worktree, UI sprint 154). The card names the folder the
// server reports for the session, else the folder the pane was bound to; a pane with neither says so;
// a git folder's shape reads "git"; there is no branch line, since nothing reports a branch.

import { shapeLabel } from "./picker";

export interface WorkspaceCardInput {
  unbound: boolean;
  /** The folder the pane was bound to; empty for the default per-session sandbox. */
  ws: string;
  /** The pane's shape: isolated, sandbox or flat until a session reports one (picker.ts). */
  shape: string;
  name: string;
  /** The session's folder as the server reports it; null before a session opens. */
  workspacePath: string | null;
}

export interface WorkspaceCardText { workspace: string; shape: string; }

const home = (path: string) => path.replace(/^\/Users\/[^/]+/, "~");

export function workspaceCard(input: WorkspaceCardInput): WorkspaceCardText {
  if (input.unbound) return { workspace: "none yet — pick one in the pane", shape: "—" };
  const workspace = input.workspacePath ? home(input.workspacePath)
    : input.ws ? input.ws
      : input.shape === "isolated" ? "fresh per-session sandbox" : "—";
  return { workspace, shape: input.shape ? shapeLabel(input.shape) : "—" };
}
