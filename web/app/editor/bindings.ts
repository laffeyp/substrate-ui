// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor's key bindings (sprint 423; roadmap 2026-11-09-code-editor r8, E4; D53; spec r6 §5 "Code"):
// standard (the default since sprint 427: CodeMirror's own keys), vim or nano, chosen in settings. Under
// each, the buffer's undo history and CodeMirror's standard keys.
// - vim: @replit/codemirror-vim 6.4.0, placed before every other keymap (its README); drawSelection draws
//   its visual-mode selection. `u` and ⌃R are the buffer's undo and redo only (BLACKBOARD 2026-11-09).
// - nano: ⌃K cuts the line (consecutive cuts join one buffer, as nano does), ⌃U pastes the buffer above
//   the caret's line, ⌃X leaves the editor, ⌃G shows the keys; at the highest precedence, over CodeMirror's macOS keymap,
//   which gives ⌃K to deleteToLineEnd and ⌃O to splitLine (@codemirror/commands emacsStyleKeymap).
// Sprint 424: vim's mode goes to the status line (the package's `vim-mode-change`); nano's ⌃G shows its keys
// there. Sprint 425: `:w` and ⌃O save. ⌃W comes with FIND.

import { Prec, type Extension } from "@codemirror/state";
import { EditorView, ViewPlugin, drawSelection, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { Vim, getCM, vim } from "@replit/codemirror-vim";
import type { Binding } from "../state/settings";
import type { VimMode } from "../derive/status_line";

export interface BindingHooks {
  /** Leave the editor for the pane (nano ⌃X). */
  leave: () => void;
  /** vim's mode, on each change and when the buffer is shown; null under nano. */
  mode: (mode: VimMode | null) => void;
  /** nano ⌃G: show or hide the key list. */
  help: () => void;
  /** Save the buffer (sprint 425): vim `:w`, nano ⌃O. */
  save: (command: "vim_w" | "nano_save") => void;
}

/** vim's `:w`: ex commands are the package's, one set for the window, so `write` is defined once and calls
 *  the buffer shown now (sprint 425). */
let vimWrite: (() => void) | null = null;
let writeDefined = false;
function defineWrite(): void {
  if (writeDefined) return;
  writeDefined = true;
  Vim.defineEx("write", "w", () => { vimWrite?.(); });
}

/** After vim's own plugin, which sets `view.cm`: its mode changes, as vim names them. */
function modeWatch(report: (mode: VimMode) => void): Extension {
  return ViewPlugin.define((view) => {
    report("normal");
    getCM(view)?.on("vim-mode-change", (ev: { mode: string; subMode?: string }) => {
      const sub = ev.subMode === "linewise" ? " line" : ev.subMode === "blockwise" ? " block" : "";
      report((ev.mode === "visual" ? `visual${sub}` : ev.mode) as VimMode);
    });
    return {};
  });
}

const CUT = "delete.cut.nano";

/** Nano's cut buffer: one per window, as nano keeps one per session. */
let cutBuffer = "";
let cutChain = false;

/** ⌃K: the caret's line, newline included, into the cut buffer (appended while the cuts run on). */
export function nanoCut(view: EditorView): boolean {
  const { state } = view;
  const line = state.doc.lineAt(state.selection.main.head);
  const to = Math.min(line.to + 1, state.doc.length);
  const from = line.to + 1 > state.doc.length && line.from > 0 ? line.from - 1 : line.from;
  const text = state.doc.sliceString(line.from, line.to) + "\n";
  cutBuffer = cutChain ? cutBuffer + text : text;
  // The caret: the start of the line that moved up into the cut one's place, or the end of the text.
  view.dispatch({ changes: { from, to }, selection: { anchor: Math.min(line.from, state.doc.length - (to - from)) }, userEvent: CUT });
  cutChain = true;
  return true;
}

/** ⌃U: the cut buffer, inserted at the start of the caret's line. */
export function nanoPaste(view: EditorView): boolean {
  if (!cutBuffer) return true;
  const line = view.state.doc.lineAt(view.state.selection.main.head);
  view.dispatch({ changes: { from: line.from, insert: cutBuffer }, selection: { anchor: line.from + cutBuffer.length }, userEvent: "input.paste.nano" });
  return true;
}

/** Any change or move that is not a cut ends the run of cuts; a transaction carrying only effects (the
 *  centre's recount of the change marks) is neither. */
const chainWatch = EditorView.updateListener.of((up) => {
  const acts = up.transactions.filter((tr) => tr.docChanged || tr.selection);
  if (acts.length && !acts.some((tr) => tr.isUserEvent(CUT))) cutChain = false;
});

export function bindingExtension(binding: Binding, hooks: BindingHooks): Extension {
  const base = [history(), drawSelection(), keymap.of([...defaultKeymap, ...historyKeymap])];
  // The default (sprint 427): CodeMirror's own keys, click and type; no mode.
  if (binding === "standard") { hooks.mode(null); return base; }
  if (binding === "vim") {
    defineWrite();
    vimWrite = () => hooks.save("vim_w");
    return [vim(), modeWatch(hooks.mode), ...base];
  }
  hooks.mode(null);
  return [
    Prec.highest(keymap.of([
      { key: "Ctrl-o", run: () => { hooks.save("nano_save"); return true; }, preventDefault: true },
      { key: "Ctrl-k", run: nanoCut, preventDefault: true },
      { key: "Ctrl-u", run: nanoPaste, preventDefault: true },
      { key: "Ctrl-x", run: () => { hooks.leave(); return true; }, preventDefault: true },
      // A no-op transaction marked as help, so the centre's listener knows this action opened the list.
      { key: "Ctrl-g", run: (view) => { hooks.help(); view.dispatch({ userEvent: "help.nano" }); return true; }, preventDefault: true },
    ])),
    chainWatch,
    ...base,
  ];
}
