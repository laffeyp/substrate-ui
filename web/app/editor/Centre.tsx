// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's centre (sprint 419; roadmap 2026-11-09-code-editor r8, E3): the open files' tab row and the
// active file in CodeMirror 6, as sheet frame 24a draws them. The text comes from the server's file API
// (GET /api/session/<id>/file, which writes FILE_READ); the lines changed against main come from the
// per-file hunk read (GET /api/session/<id>/diff?path=, sprint 418) and are drawn inline: an added line in
// teal with + in its gutter, a removed one as a red line with − above where it stood. CodeMirror is
// mounted in a shadow root: its style loader (style-mod 4.1.4) writes <style> tags into a document, which
// the page's `style-src 'self'` refuses, and uses constructable stylesheets in a shadow root, which the
// policy does not cover. Sprint 423 (E4): the buffer edits under the binding chosen in settings (vim or
// nano, editor/bindings.ts), read-only for an ended session or a view-only pane. A buffer with unsaved
// changes is kept: a write landing on the record reads the file's facts and hunks again for the inspector
// but leaves the buffer as typed, and a buffer whose tab is left or closed is kept until it is saved.

import * as React from "react";
import { Compartment, EditorState, RangeSetBuilder, StateEffect, StateField, Transaction, type Extension } from "@codemirror/state";
import { Decoration, EditorView, GutterMarker, ViewPlugin, WidgetType, gutter, lineNumbers, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { SearchQuery, getSearchQuery, replaceAll, replaceNext, search, setSearchQuery } from "@codemirror/search";
import { HighlightStyle, StreamLanguage, ensureSyntaxTree, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { json } from "@codemirror/lang-json";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { markdown } from "@codemirror/lang-markdown";
import { shell as shellMode } from "@codemirror/legacy-modes/mode/shell";
import { preserveCase } from "../derive/preserve_case";
import { editor } from "../state/editor";
import { emit as emitSignal } from "../../vm/instrumentation/sdd";
import { EditorConflictResolvedChoice, EditorFileOpenedHow, EditorFileSavedCommand, EditorKeyRefusedReason, EditorReplacedScope, Signal, UndoRoutedTo } from "../../vm/signals.gen";
import { redo, redoDepth, undo, undoDepth } from "@codemirror/commands";
import { EnvelopeKind } from "../../vm/envelope_kinds.gen";
import { sendCommand, shell } from "../state/shell";
import { settings, type Binding } from "../state/settings";
import { bindingExtension, type BindingHooks } from "./bindings";
import { baseText, vsBase } from "../derive/status_line";
import { HISTORY_VIEW, lineHunks } from "../derive/inspector";
import { StatusLine } from "./StatusLine";

const SUNK = "#1a1c20";
const GROUND = "#212327";
const ACCENT = "#82a5c8";
const ADDED = "#7fb3b8";
const REMOVED = "#c26058";
const CHOICE: React.CSSProperties = { background: "#2e3138", color: "#d7dade", border: "none", borderRadius: 4, padding: "2px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" };

interface Hunk { old_start: number; old_count: number; new_start: number; new_count: number; lines: string[] }
interface FileFacts { text: string | null; encoding: string | null; too_large: boolean; size: number; modified: number; line_endings: string | null; sha256?: string }

/** The first languages (BLACKBOARD 2026-11-09, the first grammars), by file extension. */
function language(path: string): Extension {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  if (["ts", "tsx", "mts", "cts"].includes(ext)) return javascript({ typescript: true, jsx: ext === "tsx" });
  if (["js", "jsx", "mjs", "cjs"].includes(ext)) return javascript({ jsx: ext === "jsx" });
  if (["py", "pyi"].includes(ext)) return python();
  if (ext === "json") return json();
  if (["html", "htm"].includes(ext)) return html();
  if (ext === "css") return css();
  if (["md", "markdown"].includes(ext)) return markdown();
  if (["sh", "bash", "zsh"].includes(ext)) return StreamLanguage.define(shellMode);
  return [];
}

/** 24a's code: near-monochrome, comments dim (D7: no yellow, no green; colour carries data only). */
const HIGHLIGHT = HighlightStyle.define([
  { tag: t.comment, color: "#62676f", fontStyle: "italic" },
  { tag: [t.string, t.special(t.string)], color: "#9aa0a8" },
  { tag: [t.keyword, t.definitionKeyword, t.modifier], color: "#d7dade" },
  { tag: [t.number, t.bool, t.null], color: "#b9bec5" },
]);

const THEME = EditorView.theme({
  "&": { height: "100%", backgroundColor: GROUND, color: "#d7dade", fontSize: "13px" },
  ".cm-scroller": { fontFamily: "ui-monospace,'SF Mono',Menlo,Consolas,monospace", lineHeight: "23px", paddingTop: "12px" },
  ".cm-gutters": { backgroundColor: GROUND, border: "none", color: "#62676f" },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 12px 0 20px", minWidth: "28px" },
  ".cm-content": { caretColor: ACCENT },
  // 24a draws a whole added line in teal: the hunk's colour wins over the syntax colours.
  ".cm-added, .cm-added span": { color: `${ADDED} !important` },
  ".cm-change-gutter .cm-gutterElement": { width: "14px", textAlign: "center" },
  ".cm-removed": { color: REMOVED, paddingLeft: "6px", whiteSpace: "pre" },
  "&.cm-focused": { outline: "none" },
  // Sprint 428: find matches in the accent, the current one stronger (D7: the one UI accent).
  ".cm-find-match": { backgroundColor: "rgba(130,165,200,.22)", borderRadius: "2px" },
  ".cm-find-scope": { backgroundColor: "rgba(130,165,200,.07)" },
  ".cm-find-current": { backgroundColor: "rgba(130,165,200,.5)" },
  // Sprint 431: a session edit in flight, its lines edged in the accent.
  ".cm-follow": { boxShadow: `inset 2px 0 0 ${ACCENT}`, backgroundColor: "rgba(130,165,200,.08)" },
  // vim's block cursor in the one UI accent (D7); the package draws it pink, which here reads as a removal.
  ".cm-fat-cursor": { background: `${ACCENT} !important`, color: `${GROUND} !important` },
  "&:not(.cm-focused) .cm-fat-cursor": { background: "none !important", outline: `solid 1px ${ACCENT} !important`, color: "transparent !important" },
}, { dark: true });

class Mark extends GutterMarker { constructor(readonly sign: string, readonly colour: string) { super(); } override toDOM() { const s = document.createElement("span"); s.textContent = this.sign; s.style.color = this.colour; return s; } }
class Removed extends WidgetType {
  constructor(readonly lines: string[]) { super(); }
  override toDOM() {
    const box = document.createElement("div");
    for (const l of this.lines) { const d = document.createElement("div"); d.className = "cm-removed"; d.setAttribute("data-removed-line", "1"); d.textContent = "−  " + l.slice(1); box.appendChild(d); }
    return box;
  }
}

/** The hunks as decorations: added lines marked and lit; removed lines as a block before where they stood. */
function marks(state: EditorState, hunks: readonly Hunk[]): DecorationSet {
  const found: { from: number; deco: Decoration }[] = [];
  for (const hunk of hunks) {
    const removed = hunk.lines.filter((l) => l.startsWith("-"));
    if (removed.length) {
      // git's new_start: the first new line, or for a pure removal the line it follows (0: the top).
      const at = hunk.new_count > 0 ? state.doc.line(Math.min(hunk.new_start, state.doc.lines)).from : hunk.new_start >= state.doc.lines ? state.doc.length : state.doc.line(hunk.new_start + 1).from;
      found.push({ from: at, deco: Decoration.widget({ widget: new Removed(removed), block: true, side: -1 }) });
    }
    for (let n = hunk.new_start; n < hunk.new_start + hunk.new_count && n <= state.doc.lines; n++) found.push({ from: state.doc.line(n).from, deco: Decoration.line({ class: "cm-added", attributes: { "data-added-line": "1" } }) });
  }
  found.sort((x, y) => x.from - y.from);
  const b = new RangeSetBuilder<Decoration>();
  for (const m of found) b.add(m.from, m.from, m.deco);
  return b.finish();
}
/** The buffer's hunks against the base, recounted when typing pauses (sprint 424). */
const setHunks = StateEffect.define<readonly Hunk[]>();

/** The marks of the file as read; between recounts they move with the buffer's edits; the + gutter reads
 *  them, not the line numbers they began at. */
function hunkExtension(hunks: Hunk[]): Extension {
  const field = StateField.define<DecorationSet>({
    create: (state) => marks(state, hunks),
    update(v, tr) {
      for (const e of tr.effects) if (e.is(setHunks)) return marks(tr.state, e.value);
      return v.map(tr.changes);
    },
    provide: (f) => EditorView.decorations.from(f),
  });
  const plus = new Mark("+", ADDED);
  const lit = (view: EditorView, from: number) => {
    let hit = false;
    view.state.field(field).between(from, from, (_a, _b, deco) => { if (deco.spec.class === "cm-added") { hit = true; return false; } return undefined; });
    return hit;
  };
  return [field, gutter({ class: "cm-change-gutter", lineMarker: (view, line) => (lit(view, line.from) ? plus : null) })];
}

/** FIND / REPLACE (sprint 428; roadmap r10 E6; 24a): the query is @codemirror/search's, in each buffer's
 *  state; its panel is not used (the inspector draws the fields). Every match is marked, the one the
 *  selection is on more strongly; at most FIND_CAP are marked and counted. */
const FIND_CAP = 5000;
function findMatches(state: EditorState): { from: number; to: number }[] {
  const query = getSearchQuery(state);
  if (!query.valid) return [];
  const out: { from: number; to: number }[] = [];
  const cursor = query.getCursor(state);
  for (let r = cursor.next(); !r.done && out.length < FIND_CAP; r = cursor.next()) if (r.value.to > r.value.from) out.push({ from: r.value.from, to: r.value.to });
  return out;
}
const MATCH = Decoration.mark({ class: "cm-find-match", attributes: { "data-find-match": "1" } });
const CURRENT = Decoration.mark({ class: "cm-find-match cm-find-current", attributes: { "data-find-match": "1", "data-find-current": "1" } });
const findMarks = ViewPlugin.fromClass(class {
  decorations: DecorationSet;
  constructor(view: EditorView) { this.decorations = this.build(view.state); }
  update(up: ViewUpdate) {
    if (up.docChanged || up.selectionSet || up.transactions.some((tr) => tr.effects.some((e) => e.is(setSearchQuery)))) this.decorations = this.build(up.state);
  }
  build(state: EditorState): DecorationSet {
    const b = new RangeSetBuilder<Decoration>();
    const sel = state.selection.main;
    for (const m of findMatches(state)) b.add(m.from, m.to, m.from === sel.from && m.to === sel.to ? CURRENT : MATCH);
    return b.finish();
  }
}, { decorations: (v) => v.decorations });
/** The counts the section draws, for a state. */
function findCount(state: EditorState): { total: number; current: number } {
  const ms = findMatches(state), sel = state.selection.main;
  return { total: ms.length, current: ms.findIndex((m) => m.from === sel.from && m.to === sel.to) + 1 };
}
export interface FindSpec { search: string; caseSensitive: boolean; regexp: boolean; replace: string; wholeWord: boolean; preserveCase: boolean; inSelection: boolean }

/** Sprint 438 (research RESEARCH-2026-11-10-editor-search-r2; VS Code's Find in Selection): the range the find
 *  is held to, taken from the selection when `sel` is switched on (the caret's line when nothing is
 *  selected), moved with each edit, and drawn faintly. The query's `test` reads it, so CodeMirror's counts,
 *  steps and replaces all keep to it. */
const setFindScope = StateEffect.define<{ from: number; to: number } | null>();
const SCOPE = Decoration.mark({ class: "cm-find-scope", attributes: { "data-find-scope": "1" } });
const scopeField = StateField.define<{ from: number; to: number } | null>({
  create: () => null,
  update(v, tr) {
    for (const e of tr.effects) if (e.is(setFindScope)) return e.value;
    return v && tr.docChanged ? { from: tr.changes.mapPos(v.from, 1), to: tr.changes.mapPos(v.to, -1) } : v;
  },
  provide: (f) => EditorView.decorations.from(f, (sc) => (sc && sc.to > sc.from ? Decoration.set([SCOPE.range(sc.from, sc.to)]) : Decoration.none)),
});
/** The find spec as CodeMirror's query: whole word, and the scope as its test. */
function queryOf(spec: FindSpec): SearchQuery {
  return new SearchQuery({
    search: spec.search, caseSensitive: spec.caseSensitive, regexp: spec.regexp, wholeWord: spec.wholeWord, replace: spec.replace,
    test: (_m, st, from, to) => { const sc = st.field(scopeField, false); return !sc || (from >= sc.from && to <= sc.to); },
  });
}
/** A match's replacement as CodeMirror writes it (`\n`, `\t`, `\\` read; with .*, `$&`, `$1`, `$$`), then
 *  in the match's case (VS Code's preserve-case rule, derive/preserve_case.ts). */
function caseReplacement(spec: FindSpec, matched: string, match: RegExpExecArray | undefined): string {
  let text = spec.replace.replace(/\\([nrt\\])/g, (_a, c: string) => (c === "n" ? "\n" : c === "r" ? "\r" : c === "t" ? "\t" : "\\"));
  if (spec.regexp && match) text = text.replace(/\$([$&]|\d+)/g, (all, i: string) => (i === "$" ? "$" : i === "&" ? match[0] : match[Number(i)] ?? all));
  return preserveCase(matched, text);
}
/** The mounted centre's find, for the inspector's section. */
/** How the spec changed: the query typed, Aa or .* switched, or the replacement typed (not a new find). */
export type FindChange = "typed" | "toggle" | "replace";
let activeFind: { set(spec: FindSpec, how: FindChange): void; step(back: boolean): void; replace(all: boolean): void; focusCode(): void } | null = null;
export const find = {
  set: (spec: FindSpec, how: FindChange) => { editor.set({ find: spec }); activeFind?.set(spec, how); },
  step: (back: boolean) => activeFind?.step(back),
  replace: (all: boolean) => activeFind?.replace(all),
  focusCode: () => activeFind?.focusCode(),
};

/** Following the session (sprint 431; D93): the lines an edit in flight will replace, edged in the accent;
 *  a write_file call marks the whole file. Set from the editor store's marks for the file shown. */
const setFollowMarks = StateEffect.define<{ from: number; to: number }[]>();
const FOLLOW_LINE = Decoration.line({ class: "cm-follow", attributes: { "data-follow-line": "1" } });
const followField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(v, tr) {
    for (const e of tr.effects) if (e.is(setFollowMarks)) {
      const b = new RangeSetBuilder<Decoration>();
      for (const r of e.value) for (let n = tr.state.doc.lineAt(r.from).number; n <= tr.state.doc.lineAt(r.to).number; n++) b.add(tr.state.doc.line(n).from, tr.state.doc.line(n).from, FOLLOW_LINE);
      return b.finish();
    }
    return v.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});
/** The ranges a file's marks cover in a buffer: edit_file's search text where it stands, write_file all. */
function followRanges(doc: { toString(): string; length: number }, marks: readonly { search: string | null }[]): { from: number; to: number }[] {
  const text = doc.toString(), out: { from: number; to: number }[] = [];
  for (const m of marks) {
    if (m.search === null) { out.push({ from: 0, to: doc.length }); continue; }
    const at = m.search ? text.indexOf(m.search) : -1;
    if (at >= 0) out.push({ from: at, to: at + m.search.length });
  }
  return out;
}
/** The first line two texts differ at, 1-based; null when they are the same. */
function firstChange(a: string, b: string): number | null {
  if (a === b) return null;
  const x = a.split("\n"), y = b.split("\n");
  let i = 0;
  while (i < x.length && i < y.length && x[i] === y[i]) i++;
  return i + 1;
}

/** CodeMirror keeps "\n" in its buffer; the file's own line ends come back on save. */
const normal = (text: string) => text.replace(/\r\n?/g, "\n");

/** The outline 24a's inspector draws: classes and functions (TypeScript, JavaScript, Python), top-level
 *  keys (JSON), headings (Markdown), selectors (CSS), each with its 1-based line; nested ones one deeper. */
const OUTLINE_NODES: Record<string, string> = {
  ClassDeclaration: "class", FunctionDeclaration: "fn", MethodDeclaration: "fn", ClassDefinition: "class", FunctionDefinition: "fn",
  ATXHeading1: "h1", ATXHeading2: "h2", ATXHeading3: "h3", SetextHeading1: "h1", SetextHeading2: "h2", RuleSet: "rule",
};
const NAME_NODES = new Set(["VariableDefinition", "PropertyDefinition", "VariableName", "TypeDefinition"]);
export function outlineOf(state: EditorState): { kind: string; name: string; line: number; end: number; depth: number }[] {
  const tree = ensureSyntaxTree(state, state.doc.length, 500);
  if (!tree) return [];
  const out: { kind: string; name: string; line: number; end: number; depth: number }[] = [];
  let depth = 0;
  const isJson = tree.type.name === "JsonText";
  tree.iterate({
    enter: (node) => {
      const kind = OUTLINE_NODES[node.name];
      if (isJson && node.name === "Property" && node.node.parent?.parent?.name === "JsonText") {
        const key = node.node.getChild("PropertyName");
        if (key) out.push({ kind: "key", name: state.doc.sliceString(key.from, key.to).replace(/^"|"$/g, ""), line: state.doc.lineAt(node.from).number, end: state.doc.lineAt(node.to).number, depth: 0 });
        return false;
      }
      if (!kind) return undefined;
      let name = "";
      if (kind.startsWith("h")) name = state.doc.sliceString(node.from, node.to).replace(/^#+\s*/, "").split("\n")[0];
      else if (kind === "rule") name = state.doc.sliceString(node.from, node.to).split("{")[0].trim();
      else { let c = node.node.firstChild; while (c && !NAME_NODES.has(c.name)) c = c.nextSibling; name = c ? state.doc.sliceString(c.from, c.to) : ""; }
      out.push({ kind, name, line: state.doc.lineAt(node.from).number, end: state.doc.lineAt(node.to).number, depth });
      if (kind === "class") { depth++; return undefined; }
      return kind === "fn" ? false : undefined;
    },
    leave: (node) => { if (OUTLINE_NODES[node.name] === "class") depth--; },
  });
  return out;
}

/** Open a file in a tab, or show its tab (sprint 419); with `line` (sprint 434, a search result), the caret
 *  goes to that line once the file is shown. Sprint 441: `show` false adds the tab and keeps the shown one
 *  (quick open's ⌘↵); every open goes to the front of the recent list. */
export function openFile(rel: string, paneId: number, how: EditorFileOpenedHow = EditorFileOpenedHow.TREE, line?: number, show = true): void {
  const st = editor.getSnapshot();
  const tabs = st.tabs.includes(rel) ? st.tabs : [...st.tabs, rel];
  const recent = [rel, ...st.recent.filter((p) => p !== rel)].slice(0, 20);
  editor.set({ tabs, recent, active: show || !st.active ? rel : st.active, ...(line && show ? { jump: { path: rel, line, n: (st.jump?.n ?? 0) + 1 } } : {}) });
  if (!st.tabs.includes(rel)) emitSignal(Signal.EDITOR_FILE_OPENED, { how, tab_count: tabs.length }, { pane_id: paneId });
}

export function closeFile(rel: string, paneId: number): void {
  const st = editor.getSnapshot();
  const at = st.tabs.indexOf(rel);
  if (at < 0) return;
  const tabs = st.tabs.filter((x) => x !== rel);
  editor.set({ tabs, active: st.active === rel ? tabs[Math.min(at, tabs.length - 1)] ?? null : st.active });
  emitSignal(Signal.EDITOR_FILE_CLOSED, { tab_count: tabs.length }, { pane_id: paneId });
}

function Tab({ rel, active, paneId }: { rel: string; active: boolean; paneId: number }): React.ReactElement {
  const [hover, setHover] = React.useState(false);
  const name = rel.slice(rel.lastIndexOf("/") + 1);
  return (
    <div data-editor-tab={rel} data-active={active ? "1" : "0"} title={rel} onClick={() => editor.set({ active: rel })} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", height: "100%", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap", flex: "none",
        background: active ? GROUND : "transparent", color: active ? "#d7dade" : "#9aa0a8", boxShadow: active ? `inset 0 2px 0 ${ACCENT}` : undefined }}>
      {name}
      <span data-editor-tab-close={rel} onClick={(e) => { e.stopPropagation(); closeFile(rel, paneId); }} style={{ color: "#62676f", fontSize: 10, visibility: hover ? "visible" : "hidden" }}>×</span>
    </div>
  );
}

/** The buffers with unsaved changes not on screen, and the text each file had when read, by session and
 *  path: kept for the window, so leaving the editor (which unmounts the centre) loses no typing. */
const BUFFERS = new Map<string, EditorState>();
const DISK = new Map<string, string>();
/** The binding part of every buffer: module-wide, so a kept buffer reconfigures in a new centre. */
const CONF = { binding: new Compartment() };
/** Each file's base text (sprint 424, the status line's `vs main`), by session and path; absent outside git. */
const BASES = new Map<string, { name: string; text: string }>();
/** The SHA-256 each file had when its buffer read it (sprint 425): a save sends it, and a file changed on
 *  disk since is refused as stale (409). */
const SHAS = new Map<string, string>();
/** Each file's writes from this window, started or finished (sprint 438): a read of the file applies only if
 *  none began or ended while it was out. A read answered before a save and landing after it would put back
 *  the text and hash the save replaced, and the next save would be refused as stale (BLACKBOARD 2026-11-10,
 *  the full gate run: save C refused against save A's hash). The write's own FileWritten brings a new read. */
const WRITES = new Map<string, number>();
const wrote = (k: string) => WRITES.set(k, (WRITES.get(k) ?? 0) + 1);
/** The mounted centre's save, for the menu's ⌘S and the bindings' `:w` and ⌃O. */
let activeSave: ((command: EditorFileSavedCommand) => void) | null = null;
const HOOKS: BindingHooks = {
  leave: () => sendCommand("leave-editor"),
  mode: (mode) => { if (editor.getSnapshot().mode !== mode) editor.set({ mode }); },
  help: () => editor.set({ nanoHelp: !editor.getSnapshot().nanoHelp }),
  save: (command) => activeSave?.(command === "vim_w" ? EditorFileSavedCommand.VIM_W : EditorFileSavedCommand.NANO_SAVE),
};
/** The key a refusal names, by the command that asked (EDITOR_KEY_REFUSED.key). */
const SAVE_KEY: Record<EditorFileSavedCommand, string> = { [EditorFileSavedCommand.MENU_S]: "Meta+s", [EditorFileSavedCommand.VIM_W]: ":w", [EditorFileSavedCommand.NANO_SAVE]: "Control+o" };

/** File ▸ Save in the editor (sprint 425): the shown buffer, or refused when no file is open. */
export function requestSave(paneId: number): void {
  if (activeSave) activeSave(EditorFileSavedCommand.MENU_S);
  else emitSignal(Signal.EDITOR_KEY_REFUSED, { key: SAVE_KEY[EditorFileSavedCommand.MENU_S], reason: EditorKeyRefusedReason.NO_FILE }, { pane_id: paneId });
}

/** HISTORY's step text (sprint 429): the inspector, which holds the rows, answers what a step back or
 *  forward writes, or null when there is no step that way. */
let historyStep: ((back: boolean) => string | null) | null = null;
export function setHistoryStep(fn: ((back: boolean) => string | null) | null): void { historyStep = fn; }
/** The mounted centre's undo and redo (sprint 426). */
let activeUndo: ((direction: "undo" | "redo") => UndoRoutedTo) | null = null;
/** Edit ▸ Undo or Redo in the editor: where it went (BLACKBOARD 2026-11-09, the undo boundary). */
export function routeUndo(direction: "undo" | "redo"): UndoRoutedTo {
  return activeUndo ? activeUndo(direction) : UndoRoutedTo.NONE;
}

/** The line end a save writes: the file's own; a mixed file takes the one it uses more (as VS Code's
 *  `files.eol: auto` does), a file with no line break LF. */
function lineEnd(text: string): "\n" | "\r\n" {
  const crlf = (text.match(/\r\n/g) ?? []).length, lf = (text.match(/\n/g) ?? []).length - crlf;
  return crlf > lf ? "\r\n" : "\n";
}
const ENDS = new Map<string, "\n" | "\r\n">();

/** Told, once the update is done, that the shown buffer changed (sprint 436): the workspace search runs again
 *  over the new text. Not the editor store: a store change renders App at once (flushSync), and a render inside
 *  CodeMirror's update broke HISTORY's steps. */
const EDIT_LISTENERS = new Set<() => void>();
let editNoted = false;
export function onBufferEdit(fn: () => void): () => void {
  EDIT_LISTENERS.add(fn);
  return () => { EDIT_LISTENERS.delete(fn); };
}

/** The mounted centre's shown buffer (sprint 436), for the workspace search: its path, its text, and a change
 *  of its whole text as one edit, so its own undo can take a replace back. */
let activeBuffer: { path(): string | null; text(): string | null; put(text: string): void } | null = null;
const bufferKey = (sessionId: string, rel: string) => `${sessionId}\n${rel}`;
/** The one change that turns `from` into `to`: the span between their shared head and tail, so the caret and
 *  the marks outside it stay where they were. */
function changeTo(from: string, to: string): { from: number; to: number; insert: string } {
  let head = 0;
  while (head < from.length && head < to.length && from[head] === to[head]) head++;
  let tail = 0;
  while (tail < from.length - head && tail < to.length - head && from[from.length - 1 - tail] === to[to.length - 1 - tail]) tail++;
  return { from: head, to: from.length - tail, insert: to.slice(head, to.length - tail) };
}
const setUnsaved = (rel: string, on: boolean) => {
  const list = editor.getSnapshot().unsaved;
  if (on !== list.includes(rel)) editor.set({ unsaved: on ? [...list, rel] : list.filter((x) => x !== rel) });
};

/** The editor's unsaved text by workspace path (sprint 436): the buffer shown and the buffers kept. The
 *  workspace search reads these in place of the files on disk, as VS Code searches an open editor's text. */
export function unsavedBuffers(sessionId: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rel of editor.getSnapshot().unsaved) {
    const text = activeBuffer?.path() === rel ? activeBuffer.text() : BUFFERS.get(bufferKey(sessionId, rel))?.doc.toString();
    if (typeof text === "string") out[rel] = text;
  }
  return out;
}

/** A new text into the buffer of `rel`, left unsaved (sprint 436): the buffer shown takes it as one edit; a
 *  kept buffer likewise. False when the file has no buffer. */
export function putBuffer(sessionId: string, rel: string, text: string): boolean {
  const k = bufferKey(sessionId, rel);
  if (activeBuffer?.path() === rel) { activeBuffer.put(text); return true; }
  const kept = BUFFERS.get(k);
  if (!kept) return false;
  BUFFERS.set(k, kept.update({ changes: changeTo(kept.doc.toString(), text) }).state);
  setUnsaved(rel, text !== DISK.get(k));
  return true;
}

/** A replace's new text into the buffer of `rel`, then saved from it (sprint 436; VS Code's replaceService.ts
 *  edits the open text and saves it): PUT …/file with the file's own line ends and the hash the buffer read.
 *  The HTTP status, 0 when the request failed. */
export async function writeBuffer(sessionId: string, rel: string, text: string): Promise<number> {
  const k = bufferKey(sessionId, rel);
  putBuffer(sessionId, rel, text);
  const end = ENDS.get(k) ?? "\n";
  wrote(k);
  const r = await fetch(`/api/session/${encodeURIComponent(sessionId)}/file?path=${encodeURIComponent(rel)}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: end === "\n" ? text : text.replace(/\n/g, end), view: "editor", base_sha256: SHAS.get(k) }),
  }).catch(() => null);
  wrote(k);
  if (r?.ok) {
    DISK.set(k, text);
    SHAS.set(k, ((await r.json()) as { sha256: string }).sha256);
    const now = activeBuffer?.path() === rel ? activeBuffer.text() : BUFFERS.get(k)?.doc.toString();
    setUnsaved(rel, now !== text);
  }
  return r?.status ?? 0;
}

export function Centre({ paneId, sessionId, tabRow }: { paneId: number; sessionId: string; tabRow: number }): React.ReactElement {
  const st = React.useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);
  const binding = React.useSyncExternalStore(settings.subscribe, settings.getSnapshot, settings.getSnapshot).binding;
  const host = React.useRef<HTMLDivElement>(null);
  const view = React.useRef<EditorView | null>(null);
  /** The path the view shows, so a read again of the same file keeps the caret. */
  const shown = React.useRef<string | null>(null);
  const key = (rel: string) => `${sessionId}\n${rel}`;
  const now = React.useRef<{ binding: Binding }>({ binding });
  now.current = { binding };
  const outlineTimer = React.useRef<number | null>(null);
  const recount = React.useRef(false);
  /** The followed edit whose landing the view last brought into view (sprint 431). */
  const shownLanded = React.useRef<number | null>(null);
  /** The command whose save met the stale file, for an overwrite; a reload reads the file again. */
  const conflictCommand = React.useRef<EditorFileSavedCommand>(EditorFileSavedCommand.MENU_S);
  const [reloads, setReloads] = React.useState(0);
  /** The last jump the view took (sprint 434), so a read again of the file does not take it twice. */
  const jumped = React.useRef(0);
  const takeJump = () => {
    const j = editor.getSnapshot().jump, v = view.current;
    if (!j || j.n === jumped.current || !v || shown.current !== j.path) return;
    jumped.current = j.n;
    const at = v.state.doc.line(Math.min(j.line, v.state.doc.lines)).from;
    v.dispatch({ selection: { anchor: at }, effects: EditorView.scrollIntoView(at, { y: "center" }) });
  };
  const [facts, setFacts] = React.useState<{ path: string; file: FileFacts } | null>(null);
  // The record's tool results and hand writes: when one lands, the open file is read again (sprint 422),
  // so the centre and the inspector never describe a file the session has since changed.
  const writes = React.useSyncExternalStore(shell.subscribe, shell.getSnapshot, shell.getSnapshot).snapshots[paneId]?.rawEnvelopes
    ?.filter((e) => e.kind === EnvelopeKind.ToolResult || e.kind === EnvelopeKind.FileWritten).length ?? 0;

  const unsaved = (rel: string | null) => !!rel && editor.getSnapshot().unsaved.includes(rel);
  const markUnsaved = (rel: string, on: boolean) => {
    const list = editor.getSnapshot().unsaved;
    if (on === list.includes(rel)) return;
    editor.set({ unsaved: on ? [...list, rel] : list.filter((x) => x !== rel) });
  };
  const configured = (): Extension[] => [
    CONF.binding.of(bindingExtension(now.current.binding, HOOKS)),
  ];
  /** The buffer against the file's base, or null outside git. */
  const against = (rel: string, text: string) => { const b = BASES.get(key(rel)); return b ? { base: b.name, ...vsBase(b.text, text) } : null; };
  const listener = EditorView.updateListener.of((up) => {
    // The caret's line, for OUTLINE's current symbol (sprint 422; 24a).
    if (up.selectionSet) { const head = up.state.selection.main.head, line = up.state.doc.lineAt(head); editor.set({ caretLine: line.number, caretCol: head - line.from + 1 }); }
    // Sprint 428: the find's counts follow the buffer, the selection and the query.
    if (up.docChanged || up.selectionSet || up.transactions.some((tr) => tr.effects.some((e) => e.is(setSearchQuery)))) {
      const fc = findCount(up.state), was = editor.getSnapshot().findCount;
      if (fc.total !== was.total || fc.current !== was.current) editor.set({ findCount: fc });
    }
    // nano's key list closes on the next action.
    if (up.transactions.length && editor.getSnapshot().nanoHelp && !up.transactions.some((tr) => tr.isUserEvent("help.nano"))) editor.set({ nanoHelp: false });
    if (!up.docChanged || !shown.current) return;
    const rel = shown.current, base = DISK.get(key(rel)) ?? "";
    markUnsaved(rel, up.state.doc.length !== base.length || up.state.doc.toString() !== base);
    if (!editNoted) { editNoted = true; queueMicrotask(() => { editNoted = false; for (const fn of EDIT_LISTENERS) fn(); }); }
    // The marks and the status line's count follow the buffer against the base before the next paint: once
    // the update is done (a dispatch inside an update is refused), in one microtask per run of changes. The
    // diff skips the shared head and tail, so it costs a pass over the text.
    if (!recount.current) {
      recount.current = true;
      queueMicrotask(() => {
        recount.current = false;
        const v = view.current;
        if (!v || shown.current !== rel) return;
        const text = v.state.doc.toString(), b = BASES.get(key(rel));
        if (b) v.dispatch({ effects: setHunks.of(lineHunks(b.text, text)) });
        editor.set({ vsBase: against(rel, text) });
      });
    }
    // The outline needs the syntax tree: it follows once typing pauses.
    if (outlineTimer.current !== null) window.clearTimeout(outlineTimer.current);
    outlineTimer.current = window.setTimeout(() => {
      outlineTimer.current = null;
      if (view.current && shown.current === rel) editor.set({ outline: outlineOf(view.current.state) });
    }, 150);
  });

  React.useEffect(() => {
    const rel = st.active;
    if (!rel) { setFacts(null); return; }
    let live = true;
    const q = encodeURIComponent(rel), sid = encodeURIComponent(sessionId);
    const writesAtRead = WRITES.get(key(rel)) ?? 0;
    Promise.all([
      fetch(`/api/session/${sid}/file?path=${q}`).then((r) => r.json() as Promise<FileFacts>),
      fetch(`/api/session/${sid}/diff?path=${q}`).then((r) => (r.ok ? (r.json() as Promise<{ hunks: Hunk[]; base: string }>) : { hunks: [], base: "none" })),
    ]).then(([file, diff]) => {
      if (!live || (WRITES.get(key(rel)) ?? 0) !== writesAtRead) return;
      setFacts({ path: rel, file });
      editor.set({ file: { path: rel, size: file.size, modified: file.modified, encoding: file.encoding, lineEndings: file.line_endings, text: file.text }, hunks: diff.hunks });
      if (file.text === null || !host.current) return;
      const root = host.current.shadowRoot ?? host.current.attachShadow({ mode: "open" });
      // The buffer shown is the same file with unsaved changes: it stays as typed.
      if (shown.current === rel && view.current && unsaved(rel)) return;
      // Another file: a buffer with unsaved changes is kept for its tab.
      if (shown.current && shown.current !== rel && view.current && unsaved(shown.current)) BUFFERS.set(key(shown.current), view.current.state);
      const record = () => {
        DISK.set(key(rel), normal(file.text!));
        if (file.sha256) SHAS.set(key(rel), file.sha256);
        ENDS.set(key(rel), lineEnd(file.text!));
        if (diff.base && diff.base !== "none") BASES.set(key(rel), { name: diff.base, text: baseText(normal(file.text!), diff.hunks) });
        else BASES.delete(key(rel));
      };
      // The file on disk is the buffer shown (the centre's own save, landing on the record): the buffer, its
      // caret and its undo history stay; the read's facts and the marks are taken.
      if (shown.current === rel && view.current && normal(file.text) === view.current.state.doc.toString()) {
        record();
        markUnsaved(rel, false);
        view.current.dispatch({ effects: setHunks.of(diff.hunks) });
        editor.set({ outline: outlineOf(view.current.state), vsBase: against(rel, view.current.state.doc.toString()) });
        return;
      }
      const kept = shown.current !== rel && unsaved(rel) ? BUFFERS.get(key(rel)) : undefined;
      let placed: EditorState;
      let landedLine: number | null = null;
      if (kept) {
        BUFFERS.delete(key(rel));
        placed = kept;
      } else {
        record();
        // A read again of the file already shown keeps the caret's line (clamped to the new length): a write
        // landing on the record does not move the reader's place. Another file opens at its first line.
        const prev = shown.current === rel && view.current ? view.current.state : null;
        const keep = prev ? Math.min(prev.doc.lineAt(prev.selection.main.head).number, file.text.split("\n").length) : 1;
        // Sprint 431: a followed edit that just landed on this file brings its first changed line into view.
        const landed = editor.getSnapshot().followLanded;
        if (prev && landed && landed.path === rel && landed.seq !== shownLanded.current) {
          shownLanded.current = landed.seq;
          landedLine = firstChange(prev.doc.toString(), normal(file.text));
        }
        const state = EditorState.create({ doc: file.text, extensions: [...configured(), lineNumbers(), hunkExtension(diff.hunks), language(rel), syntaxHighlighting(HIGHLIGHT), THEME, search(), findMarks, scopeField, followField, listener] });
        placed = keep > 1 ? state.update({ selection: { anchor: state.doc.line(keep).from } }).state : state;
        markUnsaved(rel, false);
      }
      shown.current = rel;
      if (!view.current) view.current = new EditorView({ state: placed, parent: root, root });
      else view.current.setState(placed);
      // A kept buffer takes the binding of now; every buffer takes the find's query (sprint 428).
      view.current.dispatch({ effects: [CONF.binding.reconfigure(bindingExtension(now.current.binding, HOOKS)), setSearchQuery.of(queryOf(editor.getSnapshot().find))] });
      editor.set({ findCount: findCount(view.current.state) });
      if (landedLine !== null) view.current.dispatch({ effects: EditorView.scrollIntoView(view.current.state.doc.line(Math.min(landedLine, view.current.state.doc.lines)).from, { y: "center" }) });
      const head = placed.selection.main.head, line = placed.doc.lineAt(head);
      editor.set({ outline: outlineOf(placed), caretLine: line.number, caretCol: head - line.from + 1, vsBase: against(rel, placed.doc.toString()) });
      takeJump();
      // Sprint 441: quick open's ↵ gives the code the focus once the file is placed.
      if (editor.getSnapshot().focusOnOpen === rel) { editor.set({ focusOnOpen: null }); view.current.focus(); }
    }).catch(() => undefined);
    return () => { live = false; };
  }, [st.active, sessionId, writes, reloads]);
  // Sprint 431 (E7; D93): the session's edits in flight on the file shown, marked where they will land and
  // brought into view; the marks go when the edit resolves.
  const followHere = st.follow.filter((f) => f.path === st.active);
  const followKey = JSON.stringify(followHere.map((f) => f.seq));
  React.useEffect(() => {
    const v = view.current;
    if (!v || shown.current !== st.active) return;
    const ranges = followRanges(v.state.doc, followHere);
    v.dispatch({ effects: [setFollowMarks.of(ranges), ...(ranges.length ? [EditorView.scrollIntoView(ranges[0].from, { y: "center" })] : [])] });
  }, [followKey, st.active]);
  // Sprint 434: a search result on the file already shown moves the caret at once.
  React.useEffect(takeJump, [st.jump?.n]);
  // The binding chosen in settings applies to the buffer shown at once.
  React.useEffect(() => {
    view.current?.dispatch({ effects: CONF.binding.reconfigure(bindingExtension(binding, HOOKS)) });
  }, [binding]);
  // Saving (sprint 425; roadmap r8 E4; BLACKBOARD 2026-11-09, the save policy): on command only, one
  // FileWritten per save, through PUT …/file with the SHA-256 the buffer read; a file changed on disk since
  // is refused (409) and the offer to reload or overwrite is drawn.
  // `step` (sprint 429): a HISTORY step, saved with view "history" and no EDITOR_FILE_SAVED (not a save command).
  const save = async (command: EditorFileSavedCommand, overwrite = false, step = false): Promise<void> => {
    const rel = shown.current, v = view.current;
    if (!rel || !v || editor.getSnapshot().active !== rel) { emitSignal(Signal.EDITOR_KEY_REFUSED, { key: SAVE_KEY[command], reason: EditorKeyRefusedReason.NO_FILE }, { pane_id: paneId }); return; }
    const sent = v.state.doc.toString();
    const end = ENDS.get(key(rel)) ?? "\n";
    const body = { text: end === "\n" ? sent : sent.replace(/\n/g, end), view: step ? HISTORY_VIEW : "editor", ...(overwrite ? {} : { base_sha256: SHAS.get(key(rel)) }) };
    wrote(key(rel));
    const r = await fetch(`/api/session/${encodeURIComponent(sessionId)}/file?path=${encodeURIComponent(rel)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).finally(() => wrote(key(rel)));
    if (r.ok) {
      const out = (await r.json()) as { sha256: string };
      DISK.set(key(rel), sent);
      SHAS.set(key(rel), out.sha256);
      // The file is the saved text now, for the inspector, even when no record entry lands to read it again.
      const facts = editor.getSnapshot().file;
      if (facts && facts.path === rel) editor.set({ file: { ...facts, text: sent } });
      // Typing during the save stays unsaved.
      if (view.current && shown.current === rel) markUnsaved(rel, view.current.state.doc.toString() !== sent);
      if (editor.getSnapshot().conflict === rel) editor.set({ conflict: null });
      if (!step) emitSignal(Signal.EDITOR_FILE_SAVED, { command }, { pane_id: paneId });
    } else if (r.status === 409) {
      conflictCommand.current = command;
      editor.set({ conflict: rel });
      emitSignal(Signal.EDITOR_SAVE_CONFLICTED, {}, { pane_id: paneId });
    }
  };
  const resolve = (choice: EditorConflictResolvedChoice) => {
    const rel = editor.getSnapshot().conflict;
    if (!rel) return;
    emitSignal(Signal.EDITOR_CONFLICT_RESOLVED, { choice }, { pane_id: paneId });
    if (choice === EditorConflictResolvedChoice.OVERWRITE) { void save(conflictCommand.current, true); return; }
    // Reload: the buffer is dropped and the file read again.
    BUFFERS.delete(key(rel));
    markUnsaved(rel, false);
    editor.set({ conflict: null });
    setReloads((n) => n + 1);
  };
  // The undo boundary (BLACKBOARD 2026-11-09): the buffer's undo while it has unsaved changes, its redo while
  // its redo stack has steps; after that, HISTORY's steps (sprint 429): the step's text goes into the
  // buffer outside its own undo history and is saved with view "history".
  const undoRedo = (direction: "undo" | "redo"): UndoRoutedTo => {
    const v = view.current, rel = shown.current;
    if (!v || !rel || editor.getSnapshot().active !== rel) return UndoRoutedTo.NONE;
    if (direction === "undo" && unsaved(rel) && undoDepth(v.state) > 0 && undo(v)) return UndoRoutedTo.BUFFER;
    if (direction === "redo" && redoDepth(v.state) > 0 && redo(v)) return UndoRoutedTo.BUFFER;
    if (unsaved(rel)) return UndoRoutedTo.NONE;
    const text = historyStep?.(direction === "undo") ?? null;
    if (text === null) return UndoRoutedTo.NONE;
    v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: normal(text) }, annotations: Transaction.addToHistory.of(false) });
    void save(EditorFileSavedCommand.MENU_S, false, true);
    return UndoRoutedTo.HISTORY;
  };
  // FIND / REPLACE (sprint 428). A new query selects the first match at or after the caret, as editors find
  // while typing. The record gets one EDITOR_FIND_QUERIED per find: when the person acts on it (↵, ⇧↵, a
  // replace, Aa or .* switched) or when typing pauses, whichever comes first; the replacement is not a find.
  const findTimer = React.useRef<number | null>(null);
  const pendingFind = React.useRef<FindSpec | null>(null);
  const flushFind = () => {
    if (findTimer.current !== null) { window.clearTimeout(findTimer.current); findTimer.current = null; }
    const spec = pendingFind.current;
    pendingFind.current = null;
    if (!spec || !spec.search || !view.current) return;
    emitSignal(Signal.EDITOR_FIND_QUERIED, { regex: spec.regexp, case_sensitive: spec.caseSensitive, whole_word: spec.wholeWord, in_selection: spec.inSelection, match_count: findMatches(view.current.state).length }, { pane_id: paneId });
  };
  const findImpl = {
    set(spec: FindSpec, how: FindChange) {
      const v = view.current;
      if (!v) return;
      if (how === "toggle") flushFind();
      // sel switched on takes the selection as the scope (the caret's line when it is empty); off drops it.
      const has = !!v.state.field(scopeField, false);
      if (spec.inSelection && !has) {
        const sel = v.state.selection.main, line = v.state.doc.lineAt(sel.head);
        v.dispatch({ effects: setFindScope.of(sel.empty ? { from: line.from, to: line.to } : { from: sel.from, to: sel.to }) });
      } else if (!spec.inSelection && has) v.dispatch({ effects: setFindScope.of(null) });
      v.dispatch({ effects: setSearchQuery.of(queryOf(spec)) });
      if (how === "replace") return;
      const ms = findMatches(v.state), at = v.state.selection.main.from;
      const first = ms.find((m) => m.from >= at) ?? ms[0];
      if (first) v.dispatch({ selection: { anchor: first.from, head: first.to }, scrollIntoView: true });
      pendingFind.current = spec;
      if (findTimer.current !== null) window.clearTimeout(findTimer.current);
      findTimer.current = window.setTimeout(flushFind, 300);
    },
    step(back: boolean) {
      flushFind();
      const v = view.current;
      if (!v) return;
      const ms = findMatches(v.state);
      if (!ms.length) return;
      const sel = v.state.selection.main;
      const next = back ? [...ms].reverse().find((m) => m.to <= sel.from) ?? ms[ms.length - 1] : ms.find((m) => m.from >= sel.to) ?? ms[0];
      v.dispatch({ selection: { anchor: next.from, head: next.to }, scrollIntoView: true });
    },
    replace(all: boolean) {
      flushFind();
      const v = view.current;
      if (!v) return;
      const before = findMatches(v.state).length, doc = v.state.doc;
      const sel = v.state.selection.main;
      const onMatch = findMatches(v.state).some((m) => m.from === sel.from && m.to === sel.to);
      // replaceNext replaces the selected match, or selects the next one first.
      if (!all && !onMatch) { this.step(false); return; }
      // Sprint 438, preserve case: the centre writes each replacement in its match's case.
      const spec = editor.getSnapshot().find;
      if (spec.preserveCase) {
        const q = getSearchQuery(v.state), found: { from: number; to: number; match?: RegExpExecArray }[] = [];
        const cursor = q.getCursor(v.state);
        for (let r = cursor.next(); !r.done; r = cursor.next()) if (r.value.to > r.value.from) found.push(r.value as { from: number; to: number; match?: RegExpExecArray });
        const pick = all ? found : found.filter((m) => m.from === sel.from && m.to === sel.to);
        if (!pick.length) return;
        v.dispatch({ changes: pick.map((m) => ({ from: m.from, to: m.to, insert: caseReplacement(spec, v.state.sliceDoc(m.from, m.to), m.match) })), userEvent: all ? "input.replace.all" : "input.replace" });
        if (!all) this.step(false);
        emitSignal(Signal.EDITOR_REPLACED, { scope: all ? EditorReplacedScope.ALL : EditorReplacedScope.ONE, count: pick.length, preserve_case: true }, { pane_id: paneId });
        return;
      }
      if (all ? replaceAll(v) : replaceNext(v)) {
        const count = all ? before : 1;
        if (v.state.doc !== doc) emitSignal(Signal.EDITOR_REPLACED, { scope: all ? EditorReplacedScope.ALL : EditorReplacedScope.ONE, count, preserve_case: false }, { pane_id: paneId });
      }
    },
    focusCode() { view.current?.focus(); },
  };
  React.useEffect(() => {
    activeSave = (command) => { void save(command); };
    activeUndo = undoRedo;
    activeFind = findImpl;
    activeBuffer = {
      path: () => shown.current,
      text: () => view.current?.state.doc.toString() ?? null,
      put: (text) => { const v = view.current; if (v && v.state.doc.toString() !== text) v.dispatch({ changes: changeTo(v.state.doc.toString(), text) }); },
    };
    return () => { activeSave = null; activeUndo = null; activeFind = null; activeBuffer = null; };
  });
  React.useEffect(() => () => {
    // Leaving the editor: the buffer on screen, if unsaved, is kept for its tab.
    if (view.current && shown.current && unsaved(shown.current)) BUFFERS.set(key(shown.current), view.current.state);
    view.current?.destroy(); view.current = null;
  }, []); // the centre's own lifetime

  const showing = facts && facts.path === st.active ? facts.file : null;
  const unreadable = showing && showing.text === null ? (showing.too_large ? `over the read limit · ${Math.round(showing.size / 1024)} KB` : `binary file · ${Math.round(showing.size / 1024)} KB`) : null;
  return (
    <div data-editor-area="centre" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: GROUND }}>
      <div data-editor-tabs={String(st.tabs.length)} style={{ height: tabRow, flex: "none", background: SUNK, display: "flex", overflowX: "auto", overflowY: "hidden" }}>
        {st.tabs.map((rel) => <Tab key={rel} rel={rel} active={rel === st.active} paneId={paneId} />)}
      </div>
      {st.conflict && st.conflict === st.active && (
        <div data-save-conflict={st.conflict} style={{ display: "flex", gap: 14, alignItems: "center", padding: "6px 14px", background: SUNK, borderBottom: "1px solid rgba(255,255,255,.055)", fontSize: 11, color: "#b9bec5", flex: "none" }}>
          <span>{st.conflict.slice(st.conflict.lastIndexOf("/") + 1)} changed on disk since it was read; the save was not written</span>
          <span style={{ marginLeft: "auto" }} />
          <button data-conflict-choice="reload" onClick={() => resolve(EditorConflictResolvedChoice.RELOAD)} style={CHOICE}>reload</button>
          <button data-conflict-choice="overwrite" onClick={() => resolve(EditorConflictResolvedChoice.OVERWRITE)} style={CHOICE}>overwrite</button>
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <div ref={host} data-editor-code={st.active ?? ""} data-binding={binding} style={{ position: "absolute", inset: 0, display: st.active && !unreadable ? "block" : "none" }} />
        {unreadable && <div data-editor-unreadable="1" style={{ padding: "20px 24px", color: "#62676f", fontSize: 12 }}>{st.active} · {unreadable}</div>}
      </div>
      <StatusLine />
    </div>
  );
}
