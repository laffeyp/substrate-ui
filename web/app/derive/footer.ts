// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The footer's text (sprint 218; plan PLAN-2026-11-04-shell-to-react-r5.md, B2).
//
// Status reads the focused pane's controller snapshot: "● finalised" once its session has ended, "●
// live" while it is connected, "○ <state>" while connecting, reconnecting or closed, and nothing
// with no session. The dc-runtime template (`web/reveal.html` at `d4322e1`) read `ended`, which
// nothing set, so it said "● live" in every state (open item 34), and a design-tool prop drew a
// made-up rate-limit line (F356, F328).

import type { ConnectionState } from "../../vm/types";
import { PaneDrawnConnection } from "../../vm/signals.gen";

export interface FooterInput {
  /** The focused pane has no workspace yet. */
  unbound: boolean;
  /** The focused session's name, as the pane header shows it. */
  title: string | null;
  /** The records, assays or studio page is open over the panes. */
  surfaceOpen: boolean;
  /** The editor view is open (sprint 409; frame 24a's footer). */
  editorOpen?: boolean;
  /** The design tool's simulateRateLimit scenario: the template's status line, ahead of every other. */
  rateLimited?: boolean;
  /** The focused pane's controller snapshot; null before its first. */
  snapshot: { sessionId: string | null; endedReason: string | null; connection: ConnectionState } | null;
}

export interface FooterText { status: string; statusColor: string; record: string; hint: string; }

const LIVE = "#82a5c8";
const QUIET = "#62676f";

export function footerText(input: FooterInput): FooterText {
  const snap = input.snapshot;
  let status = "";
  let statusColor = QUIET;
  // An explicit end unbinds the session (session_controller.ts forceClose: sessionId null) and keeps
  // endedReason until the next session opens, so the end is read before the session id.
  if (input.rateLimited) { status = "◌ rate-limited · retry 3/6 in 14s"; statusColor = "#7fb3b8"; }
  else if (snap && snap.endedReason) status = "● finalised";
  else if (snap && snap.sessionId) {
    if (snap.connection === PaneDrawnConnection.CONNECTED) { status = "● live"; statusColor = LIVE; }
    else status = "○ " + snap.connection;
  }
  return {
    status,
    statusColor,
    record: input.unbound ? "unbound — pick a workspace" : input.title ? "session " + input.title : "",
    hint: input.surfaceOpen ? "esc back to session" : input.editorOpen ? "esc or ⌘⇧E back to the pane" : "⌘M toggles meta",
  };
}
