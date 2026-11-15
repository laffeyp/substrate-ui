// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What the editor view's areas report for App's EDITOR_DRAWN (sprint 410): the files tree writes how
// many rows it draws; App reads it after each commit. One instance per pane (sprint 499).

import { createStore } from "../store";
import type { Store } from "../store";
import { SINGLE, type Cell, type Grid } from "../derive/panes";
import { closeGroup, splitGroup as splitLayout } from "../derive/editor_groups";
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
  /** Sprint 503: the Markdown tabs shown rendered, switched from the tab's menu; a file opens as source. */
  rendered: string[];
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
const initial = (): EditorState => ({ treeRows: 0, modifiedDots: 0, folded: { left: false, right: false, bottom: false }, tabs: [], active: null, rendered: [], file: null, bytesForm: {}, bytesCaret: null, language: null, hunks: [], bufferHunks: null, outline: [], caretLine: 1, unsaved: [], mode: null, caretCol: 1, vsBase: null, nanoHelp: false, anchor3: null, conflict: null, find: { search: "", caseSensitive: false, regexp: false, replace: "", wholeWord: false, preserveCase: false, inSelection: false }, findCount: { total: 0, current: 0 }, findFocus: 0, showing: "inspector", leftTab: "files", search: { query: "", replace: "", caseSensitive: false, regexp: false, word: false, include: "", exclude: "", details: false }, searchFocus: 0, quickOpen: 0, recent: [], focusOnOpen: null, reveal: null, treeFindFocus: 0, jump: null, follow: [], followLanded: null, inspector: { outlineRows: 0, hunks: 0, activityRows: 0, historyRows: 0 }, anchor2: null, dock: "bottom", swapped: false, focus: { on: false, before: null }, anchor: null });

const KEY = "__substrateEditors";
type Stores = { byPane: Map<number, Store<EditorState>>; sessionOf: Map<number, string>; shown: number; listeners: Set<() => void>; groups?: Map<number, PaneGroups> };
const scope = globalThis as unknown as Record<string, Stores | undefined>;
const stores: Stores = scope[KEY] ?? (scope[KEY] = { byPane: new Map(), sessionOf: new Map(), shown: 0, listeners: new Set() });

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

/** The pane whose editor is shown, and the session it shows (EditorView, when it renders, before its
 *  children read the store). A pane bound to another session gets a fresh editor (sprint 500, scenario
 *  S9: a rebound pane kept the old session's tabs, files of another workspace). Listeners of `editor`
 *  hear the switch. */
export function showEditorFor(paneId: number, sessionId: string): void {
  const was = stores.sessionOf.get(paneId);
  stores.sessionOf.set(paneId, sessionId);
  const rebound = was !== undefined && was !== sessionId;
  if (rebound) { stores.byPane.delete(paneId); groupMap().delete(paneId); }
  if (stores.shown === paneId && !rebound) return;
  stores.shown = paneId;
  editorFor(paneId);
  // After the render that asked: a store notified during render would update other components mid-render.
  queueMicrotask(() => { for (const l of [...stores.listeners]) l(); });
}

/** A pane gone: its editor state goes with it. */
export function dropEditor(paneId: number): void { stores.byPane.delete(paneId); stores.sessionOf.delete(paneId); groupMap().delete(paneId); }

/** The shown pane's editor. */
export const editor: Store<EditorState> = {
  getSnapshot: () => editorFor(stores.shown).getSnapshot(),
  set: (patch) => editorFor(stores.shown).set(patch),
  subscribe: (listener) => { stores.listeners.add(listener); return () => { stores.listeners.delete(listener); }; },
};

// The gates read the editor on screen as `globalThis.__substrateEditor` (sprints 436–447); since sprint 499
// that is the shown pane's store.
(globalThis as unknown as Record<string, Store<EditorState>>).__substrateEditor = editor;

// Sprint 504: the editor's groups. A pane's editor holds one group or more, laid out as the pane grid lays out
// panes (derive/editor_groups.ts). The fields in GROUP_FIELDS belong to a group; every other field to the pane.
// `editorFor(paneId)` is the pane's store, and its group fields are the focused group's, so the tree, quick open,
// the inspector, search and save-before-send act on the focused group as they acted on the one editor before. Each
// other group keeps its own fields in its own store; `groupEditor(paneId, group)` is a store for one group (its own
// fields over the pane's), stable for the group's life, so a closure kept by a group's code view writes to that
// group whether or not it has the focus. `focusGroup` swaps the fields.

export const GROUP_FIELDS = ["tabs", "active", "rendered", "file", "bytesCaret", "language", "hunks", "bufferHunks", "outline", "caretLine", "caretCol", "mode", "vsBase", "conflict", "findCount", "jump", "focusOnOpen"] as const;
type GroupKey = (typeof GROUP_FIELDS)[number];
type GroupFields = Pick<EditorState, GroupKey>;
const pickGroup = (st: EditorState): GroupFields => Object.fromEntries(GROUP_FIELDS.map((k) => [k, st[k]])) as unknown as GroupFields;
const isGroupKey = (k: string) => (GROUP_FIELDS as readonly string[]).includes(k);

export interface GroupLayout { grid: Grid; cells: Cell[]; focused: number; nextId: number }
type PaneGroups = { layout: Store<GroupLayout>; own: Map<number, Store<GroupFields>>; facades: Map<number, Store<EditorState>> };

function groupMap(): Map<number, PaneGroups> { return (stores.groups ??= new Map()); }

function groupsOf(paneId: number): PaneGroups {
  let pg = groupMap().get(paneId);
  if (!pg) {
    pg = { layout: createStore<GroupLayout>({ grid: SINGLE, cells: [{ id: 1, col: 1, row: 1, cw: 1, rh: 1 }], focused: 1, nextId: 2 }), own: new Map(), facades: new Map() };
    // Listeners of `editor` (App's EDITOR_DRAWN) hear the shown pane's groups change.
    pg.layout.subscribe(() => { if (stores.shown === paneId) for (const l of [...stores.listeners]) l(); });
    groupMap().set(paneId, pg);
  }
  return pg;
}

function ownOf(pg: PaneGroups, group: number): Store<GroupFields> {
  let made = pg.own.get(group);
  if (!made) { made = createStore<GroupFields>(pickGroup(initial())); pg.own.set(group, made); }
  return made;
}

/** The pane's group layout, for drawing it. */
export function groupLayout(paneId: number): Store<GroupLayout> { return groupsOf(paneId).layout; }

/** One group's editor: its own fields over the pane's; the pane's store itself while the group has the focus. */
export function groupEditor(paneId: number, group: number): Store<EditorState> {
  const pg = groupsOf(paneId);
  const had = pg.facades.get(group);
  if (had) return had;
  const focused = () => pg.layout.getSnapshot().focused === group;
  let cache: { p: EditorState; own: GroupFields; v: EditorState } | null = null;
  const facade: Store<EditorState> = {
    getSnapshot: () => {
      const p = editorFor(paneId).getSnapshot();
      if (focused()) return p;
      const own = ownOf(pg, group).getSnapshot();
      if (cache && cache.p === p && cache.own === own) return cache.v;
      cache = { p, own, v: { ...p, ...own } };
      return cache.v;
    },
    set: (patch) => {
      if (focused()) { editorFor(paneId).set(patch); return; }
      const next = typeof patch === "function" ? patch(facade.getSnapshot()) : patch;
      const mine: Record<string, unknown> = {}, rest: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(next)) (isGroupKey(k) ? mine : rest)[k] = v;
      if (Object.keys(mine).length) ownOf(pg, group).set(mine as Partial<GroupFields>);
      if (Object.keys(rest).length) editorFor(paneId).set(rest as Partial<EditorState>);
    },
    subscribe: (listener) => {
      const offs = [editorFor(paneId).subscribe(listener), ownOf(pg, group).subscribe(listener), pg.layout.subscribe(listener)];
      return () => { for (const off of offs) off(); };
    },
  };
  pg.facades.set(group, facade);
  return facade;
}

/** Gives `group` the focus: the focused group's fields go to its own store, and `group`'s come into the pane's. */
export function focusGroup(paneId: number, group: number): void {
  const pg = groupsOf(paneId), lay = pg.layout.getSnapshot();
  if (lay.focused === group || !lay.cells.some((c) => c.id === group)) return;
  const pane = editorFor(paneId);
  ownOf(pg, lay.focused).set(pickGroup(pane.getSnapshot()));
  pg.layout.set({ focused: group });
  pane.set(ownOf(pg, group).getSnapshot());
}

/** Splits the focused group; the new group opens empty and takes the focus. Null past three across or down. */
export function splitEditorGroup(paneId: number, dir: "right" | "down"): { group: number; groups: number } | null {
  const pg = groupsOf(paneId), lay = pg.layout.getSnapshot();
  const out = splitLayout(lay.grid, lay.cells, lay.focused, dir, lay.nextId);
  if (!out) return null;
  const group = lay.nextId;
  pg.own.set(group, createStore<GroupFields>(pickGroup(initial())));
  pg.layout.set({ grid: out.grid, cells: out.cells, nextId: group + 1 });
  focusGroup(paneId, group);
  return { group, groups: out.cells.length };
}

/** Closes `group`; its space goes to a neighbour. False for the last group. */
export function closeEditorGroup(paneId: number, group: number): boolean {
  const pg = groupsOf(paneId), lay = pg.layout.getSnapshot();
  const out = closeGroup(lay.grid, lay.cells, group);
  if (!out) return false;
  if (lay.focused === group) {
    pg.layout.set({ grid: out.grid, cells: out.cells, focused: out.focused });
    editorFor(paneId).set(ownOf(pg, out.focused).getSnapshot());
  } else {
    pg.layout.set({ grid: out.grid, cells: out.cells });
  }
  pg.own.delete(group);
  pg.facades.delete(group);
  return true;
}

/** The group whose tabs hold `rel`, or null. */
export function groupHolding(paneId: number, rel: string): number | null {
  const pg = groupsOf(paneId), lay = pg.layout.getSnapshot();
  for (const c of lay.cells) {
    const tabs = c.id === lay.focused ? editorFor(paneId).getSnapshot().tabs : ownOf(pg, c.id).getSnapshot().tabs;
    if (tabs.includes(rel)) return c.id;
  }
  return null;
}
