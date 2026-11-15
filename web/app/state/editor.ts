// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What the editor view's areas report for App's EDITOR_DRAWN (sprint 410): the files tree writes how
// many rows it draws; App reads it after each commit. One instance per pane (sprint 499).

import { createStore } from "../store";
import type { Store } from "../store";
import type { Anchor, Anchor2, Anchor3 } from "../derive/anchor";
import type { VimMode } from "../derive/status_line";

export interface EditorState {
  /** Rows the files tree draws: the entries of the top folder and of every open folder. */
  treeRows: number;
  /** Files the tree draws with the changed-vs-main dot (sprint 413). */
  modifiedDots: number;
  /** Each column folded to its rail, the terminal to its sill (sprint 415). */
  folded: { left: boolean; right: boolean; bottom: boolean };
  /** Sprint 416: the terminal docked below the centre or as a column right of it; the side columns swapped
   *  (files right, inspector left); focus on, with the folds it found so it can restore them. */
  /** The open files, by workspace path, in tab order, and the one shown (sprint 419). */
  tabs: string[];
  active: string | null;
  /** What the centre read for the active file, for the inspector (sprint 422): its facts, its hunks
   *  against the base, and its outline from the syntax tree; null before the read lands. */
  file: { path: string; size: number; modified: number; encoding: string | null; lineEndings: string | null; text: string | null } | null;
  /** Sprint 463 (roadmap r13 E14): the bytes view's form for each file that is not text, hex until one is picked. */
  bytesForm: Record<string, string>;
  /** Sprint 468: the byte under the caret in hex, binary or octal, for the status line; null in any other view. */
  bytesCaret: number | null;
  /** Sprint 472: the shown file's language, as `@codemirror/language-data` names it; null for plain text. */
  language: string | null;
  hunks: { old_start: number; old_count: number; new_start: number; new_count: number; lines: string[] }[];
  /** Sprint 455: the buffer's hunks against the base while the shown file has unsaved edits (what the centre marks and
   *  the status line counts); null when the buffer is the saved file. */
  bufferHunks: { old_start: number; old_count: number; new_start: number; new_count: number; lines: string[] }[] | null;
  outline: { kind: string; name: string; line: number; end: number; depth: number }[];
  /** The open files whose buffers differ from the file as read (sprint 423), by path. */
  unsaved: string[];
  /** Sprint 424, the status line: vim's mode (null under standard and nano); the caret's column; the
   *  buffer against the base (null outside git); nano's ⌃G key list shown. */
  mode: VimMode | null;
  caretCol: number;
  vsBase: { base: string; plus: number; minus: number } | null;
  nanoHelp: boolean;
  anchor3: Anchor3 | null;
  /** Sprint 425: the file whose save was refused as stale, with the reload-or-overwrite offer drawn. */
  conflict: string | null;
  /** Sprint 428, FIND / REPLACE: the query as typed, kept across files; the buffer's matches and the
   *  one the selection is on (1-based; 0 when it is on none). */
  find: { search: string; caseSensitive: boolean; regexp: boolean; replace: string; wholeWord: boolean; preserveCase: boolean; inSelection: boolean };
  findCount: { total: number; current: number };
  /** Bumped by ⌘F and ⌥⌘F: the FIND / REPLACE section opens if folded. */
  findFocus: number;
  /** Sprint 434 (roadmap r10 E8; 24j): the left column's tab; the workspace search's query as typed, kept
   *  while the editor is open (sprint 435: whole word, the include and exclude globs, the globs shown); bumped by ⌘⇧F to focus the query; a line to bring the caret to when its
   *  file is shown (n tells one jump from the next to the same line). */
  leftTab: "files" | "search" | "open" | "activity";
  search: { query: string; replace: string; caseSensitive: boolean; regexp: boolean; word: boolean; include: string; exclude: string; details: boolean };
  searchFocus: number;
  /** Sprint 441, quick open: bumped by ⌘P and Go ▸ Quick Open to open the box; the files opened in the editor,
   *  newest first, for its RECENT section. */
  quickOpen: number;
  recent: string[];
  /** The file whose code takes the focus once the centre has placed it (quick open's ↵), then null. */
  focusOnOpen: string | null;
  /** Sprint 442: a folder the search bar asks the files tab to open the tree to (n tells one ask from the next). */
  reveal: { path: string; n: number } | null;
  /** Bumped by ⌥⌘F in the tree (sprint 437): the tree's find by name opens, its field focused. */
  treeFindFocus: number;
  jump: { path: string; line: number; n: number } | null;
  /** Sprint 430: the right column shows the inspector, or the meta pane opened in the editor with ⌘M. */
  showing: "inspector" | "meta";
  /** Sprint 431 (E7; D93): the session's edits marked and not yet resolved (their calls' seqs, files and
   *  the text each replaces), and the last that landed ok, for the centre to bring into view. */
  follow: { seq: number; path: string; search: string | null }[];
  followLanded: { path: string; seq: number } | null;
  /** The centre's caret line, 1-based (sprint 422): OUTLINE lights the symbol around it. */
  caretLine: number;
  /** What the inspector draws (sprint 422): its outline, hunk, activity and history rows. */
  inspector: { outlineRows: number; hunks: number; activityRows: number; historyRows: number };
  /** The anchor's second row as last painted; null before one. */
  anchor2: Anchor2 | null;
  dock: "bottom" | "right";
  swapped: boolean;
  focus: { on: boolean; before: { left: boolean; right: boolean; bottom: boolean } | null };
  /** The last EDITOR_DRAWN record, as the view's pixel anchor paints it (sprint 411); null before one. */
  anchor: Anchor | null;
}

// Sprint 499: one editor per pane. Before, one store per window held every pane's tabs, active file,
// unsaved paths, recent files, find and search, so a second pane's editor drew the first pane's tabs
// (files of another session's workspace, which do not open). A pane's editor reads and writes
// `editorFor(paneId)`. `editor` is the store of the pane whose editor is shown, for callers that act on
// the shown editor and hold no pane (the bindings' hooks, quick open, the footer).
const initial = (): EditorState => ({ treeRows: 0, modifiedDots: 0, folded: { left: false, right: false, bottom: false }, tabs: [], active: null, file: null, bytesForm: {}, bytesCaret: null, language: null, hunks: [], bufferHunks: null, outline: [], caretLine: 1, unsaved: [], mode: null, caretCol: 1, vsBase: null, nanoHelp: false, anchor3: null, conflict: null, find: { search: "", caseSensitive: false, regexp: false, replace: "", wholeWord: false, preserveCase: false, inSelection: false }, findCount: { total: 0, current: 0 }, findFocus: 0, showing: "inspector", leftTab: "files", search: { query: "", replace: "", caseSensitive: false, regexp: false, word: false, include: "", exclude: "", details: false }, searchFocus: 0, quickOpen: 0, recent: [], focusOnOpen: null, reveal: null, treeFindFocus: 0, jump: null, follow: [], followLanded: null, inspector: { outlineRows: 0, hunks: 0, activityRows: 0, historyRows: 0 }, anchor2: null, dock: "bottom", swapped: false, focus: { on: false, before: null }, anchor: null });

const KEY = "__substrateEditors";
type Stores = { byPane: Map<number, Store<EditorState>>; shown: number; listeners: Set<() => void> };
const scope = globalThis as unknown as Record<string, Stores | undefined>;
const stores: Stores = scope[KEY] ?? (scope[KEY] = { byPane: new Map(), shown: 0, listeners: new Set() });

/** The editor state of pane `paneId`, made on first use. */
export function editorFor(paneId: number): Store<EditorState> {
  let st = stores.byPane.get(paneId);
  if (!st) {
    st = createStore<EditorState>(initial());
    const own = st;
    own.subscribe(() => { if (stores.byPane.get(stores.shown) === own) for (const l of [...stores.listeners]) l(); });
    stores.byPane.set(paneId, own);
  }
  return st;
}

/** The pane whose editor is shown (EditorView, when it renders). Listeners of `editor` hear the switch. */
export function showEditorFor(paneId: number): void {
  if (stores.shown === paneId) return;
  stores.shown = paneId;
  editorFor(paneId);
  // After the render that asked: a store notified during render would update other components mid-render.
  queueMicrotask(() => { for (const l of [...stores.listeners]) l(); });
}

/** A pane gone: its editor state goes with it. */
export function dropEditor(paneId: number): void { stores.byPane.delete(paneId); }

/** The shown pane's editor. */
export const editor: Store<EditorState> = {
  getSnapshot: () => editorFor(stores.shown).getSnapshot(),
  set: (patch) => editorFor(stores.shown).set(patch),
  subscribe: (listener) => { stores.listeners.add(listener); return () => { stores.listeners.delete(listener); }; },
};

// The gates read the editor on screen as `globalThis.__substrateEditor` (sprints 436–447); since sprint 499
// that is the shown pane's store.
(globalThis as unknown as Record<string, Store<EditorState>>).__substrateEditor = editor;
