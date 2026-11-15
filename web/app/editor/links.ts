// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Following a link from the editor (sprint 503; roadmap 2026-11-14-editor-features r4 E5). ⌘-click in the code and a
// click in a rendered Markdown view both come here. An external link opens in the browser: the window asks for it and
// main hands it to the system (electron/main.ts setWindowOpenHandler, NAVIGATION_BLOCKED external). A path opens that
// workspace file in this pane, at its heading when it names one. `#heading` moves to that heading in this file. Each
// writes EDITOR_LINK_FOLLOWED with its kind, the view and whether the target was found; no address (E1).

import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import { EditorFileOpenedHow, EditorLinkFollowedKind, EditorLinkFollowedView, Signal } from "../../vm/signals.gen";
import { headingLine, linkKind, resolveLink } from "../derive/md_links";
import { editorFor } from "../state/editor";
import { openFile } from "./Centre";

export interface FollowFrom {
  paneId: number;
  sessionId: string;
  /** The workspace path of the file the link is in. */
  file: string;
  /** That file's text as shown, for a `#heading` in it. */
  text: string;
  view: EditorLinkFollowedView;
  /** A rendered view brings its own heading into view; the source view moves its caret to the heading's line. */
  showHeading?: (slug: string) => boolean;
}

function done(from: FollowFrom, kind: EditorLinkFollowedKind, found: boolean): void {
  emitSignal(Signal.EDITOR_LINK_FOLLOWED, { kind, view: from.view, found }, { pane_id: from.paneId });
}

/** Moves the pane's editor to `line` of `rel`, as a search result does (`jump`). */
function jumpTo(paneId: number, rel: string, line: number): void {
  const editor = editorFor(paneId);
  editor.set({ jump: { path: rel, line, n: (editor.getSnapshot().jump?.n ?? 0) + 1 } });
}

export async function followLink(target: string, from: FollowFrom): Promise<void> {
  const kind = linkKind(target);
  if (kind === "external") {
    const web = /^https?:\/\//i.test(target);
    if (web) window.open(target, "_blank");
    done(from, EditorLinkFollowedKind.EXTERNAL, web);
    return;
  }
  if (kind === "heading") {
    const slug = decodeURIComponent(target.slice(1));
    if (from.showHeading) { done(from, EditorLinkFollowedKind.HEADING, from.showHeading(slug)); return; }
    const line = headingLine(from.text, slug);
    if (line !== null) jumpTo(from.paneId, from.file, line);
    done(from, EditorLinkFollowedKind.HEADING, line !== null);
    return;
  }
  const to = resolveLink(from.file, target);
  if (!to) { done(from, EditorLinkFollowedKind.FILE, false); return; }
  const r = await fetch(`/api/session/${encodeURIComponent(from.sessionId)}/file?path=${encodeURIComponent(to.path)}`).catch(() => null);
  const facts = r?.ok ? ((await r.json().catch(() => null)) as { text?: string | null } | null) : null;
  if (!facts) { done(from, EditorLinkFollowedKind.FILE, false); return; }
  const line = to.anchor && typeof facts.text === "string" ? headingLine(facts.text, to.anchor) : null;
  openFile(to.path, from.paneId, EditorFileOpenedHow.LINK, line ?? undefined);
  // The editor shows a file as source; a link into a rendered tab moves its jump there too.
  done(from, EditorLinkFollowedKind.FILE, !to.anchor || line !== null);
}
