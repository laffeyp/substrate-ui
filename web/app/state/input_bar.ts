// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The input bar's state and keys, per pane (sprint 259; plan PLAN-2026-11-04-shell-to-react-r5.md,
// C1). Moved from reveal_component.ts (`_barKey`, the pane's `pv`, `slashSel`, `hist`, `histAt`,
// `histDraft`; UI sprints 141, 164, 165).
//
// Each pane keeps its own draft, so a keystroke in one pane never shows in another. The bar is keyed
// by its pane, not by where the template puts it (design D90: the prompt is in every view), so the
// panes view, the meta view and later the editor view can each mount one for any pane.
//
// ↵ sends; ⇧↵ and ⌥↵ make a new line; ↵ while an input method composes finishes the composition;
// ↑ on the first line and ↓ on the last walk the pane's sent lines, back to the draft; Tab completes
// a command name; with a command's choices open, ↑ enters the menu at the row nearest the bar, ↑ ↓
// move, ↓ off the bottom returns to the bar, ↵ picks, Escape returns.

import type { SlashCatalogEntry } from "../../vm/session_controller";
import { createStore } from "../store";
import { CHOICE_NOTES } from "../derive/control_notes";
import { slashRows, tabComplete, type SlashRow } from "../derive/slash";
import { openEndSession } from "./dialogs";

export interface PaneInput {
  /** The draft in the bar. */
  text: string;
  /** The lit row among a command's choices; null while the caret is in the bar. */
  slashSel: number | null;
  /** The lines sent from this pane, oldest first, at most 200. */
  hist: string[];
  /** Where ↑ ↓ are in `hist`; null on the draft. */
  histAt: number | null;
  /** The draft kept while ↑ ↓ show sent lines. */
  histDraft: string;
}

export const EMPTY_INPUT: PaneInput = { text: "", slashSel: null, hist: [], histAt: null, histDraft: "" };
const HIST_MAX = 200;

interface Controller { slashCatalog?(): SlashCatalogEntry[]; submitLine?(line: string): unknown; }
interface Vm { get?(paneId: number): Controller | null; setActive?(paneId: number): void; submitLine?(line: string): unknown; }
const vm = () => (window as unknown as { __vm?: Vm }).__vm;

// One instance per window, as in shell.ts (sprint 212).
interface Shared { store: ReturnType<typeof createStore<{ panes: Record<number, PaneInput> }>>; titleOf: { current: (paneId: number) => string } }
const KEY = "__substrateInputBar";
const scope = globalThis as unknown as Record<string, Shared | undefined>;
const shared: Shared = scope[KEY] ?? (scope[KEY] = {
  store: createStore<{ panes: Record<number, PaneInput> }>({ panes: {} }),
  titleOf: { current: (paneId) => "pane-" + paneId },
});

export const inputBar = shared.store;

/** DCLogic, which names the panes until plan group E, registers how a pane's title reads. */
export function setTitleOf(fn: (paneId: number) => string): () => void {
  shared.titleOf.current = fn;
  return () => { if (shared.titleOf.current === fn) shared.titleOf.current = (paneId) => "pane-" + paneId; };
}

export function paneInput(paneId: number): PaneInput {
  return inputBar.getSnapshot().panes[paneId] ?? EMPTY_INPUT;
}

function patch(paneId: number, p: Partial<PaneInput>): void {
  inputBar.set((s) => ({ panes: { ...s.panes, [paneId]: { ...(s.panes[paneId] ?? EMPTY_INPUT), ...p } } }));
}

export function catalogFor(paneId: number): SlashCatalogEntry[] {
  const ctl = vm()?.get?.(paneId);
  return ctl && typeof ctl.slashCatalog === "function" ? ctl.slashCatalog() : [];
}

export function rowsFor(paneId: number): SlashRow[] {
  return slashRows(paneInput(paneId).text, catalogFor(paneId), CHOICE_NOTES);
}

/** Typing: the draft changes, and the history walk and the menu selection end. */
export function setText(paneId: number, text: string): void {
  patch(paneId, { text, histAt: null, slashSel: null });
}

function submit(paneId: number, line: string): void {
  const v = vm();
  if (!v) return;
  if (typeof v.setActive === "function") v.setActive(paneId);
  const ctl = typeof v.get === "function" ? v.get(paneId) : null;
  if (ctl && typeof ctl.submitLine === "function") ctl.submitLine(line);
  else if (typeof v.submitLine === "function") v.submitLine(line);
}

/** A slash row picked: its line is sent, or fills the bar; `/exit` asks first (D40h). */
export function pickRow(paneId: number, row: SlashRow): void {
  if ("fill" in row.action) { patch(paneId, { text: row.action.fill, slashSel: null }); return; }
  patch(paneId, { text: "", slashSel: null });
  if (row.action.send === "/exit") { openEndSession(shared.titleOf.current(paneId)); return; }
  submit(paneId, row.action.send);
}

interface KeyEventLike {
  key: string; shiftKey: boolean; altKey: boolean; metaKey: boolean; ctrlKey: boolean; keyCode?: number;
  nativeEvent?: { isComposing?: boolean }; isComposing?: boolean;
  preventDefault(): void;
  target: EventTarget | null;
}

export function barKey(paneId: number, ev: KeyEventLike): void {
  if (ev.isComposing || ev.nativeEvent?.isComposing || ev.keyCode === 229) return;
  const pane = paneInput(paneId);
  const plain = !ev.shiftKey && !ev.altKey && !ev.metaKey && !ev.ctrlKey;
  if (ev.key === "Tab" && plain && /^\/\S*$/.test(pane.text)) {
    ev.preventDefault();
    const done = tabComplete(pane.text, catalogFor(paneId));
    if (done !== null) patch(paneId, { text: done, slashSel: null });
    return;
  }
  const choices = rowsFor(paneId).filter((r) => r.choice);
  if (choices.length && plain && ["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(ev.key)) {
    const sel = pane.slashSel !== null && pane.slashSel < choices.length ? pane.slashSel : null;
    if (ev.key === "ArrowUp") { ev.preventDefault(); patch(paneId, { slashSel: sel === null ? choices.length - 1 : Math.max(0, sel - 1) }); return; }
    if (ev.key === "ArrowDown") { ev.preventDefault(); patch(paneId, { slashSel: sel === null || sel + 1 >= choices.length ? null : sel + 1 }); return; }
    if (ev.key === "Enter" && sel !== null) { ev.preventDefault(); patch(paneId, { slashSel: null }); pickRow(paneId, choices[sel]); return; }
    if (ev.key === "Escape" && sel !== null) { ev.preventDefault(); patch(paneId, { slashSel: null }); return; }
  }
  if (ev.key === "Enter" && plain) {
    ev.preventDefault();
    const line = pane.text.trim();
    if (!line) return;
    patch(paneId, { text: "", hist: [...pane.hist, line].slice(-HIST_MAX), histAt: null, histDraft: "" });
    submit(paneId, line);
    return;
  }
  const el = ev.target as HTMLTextAreaElement | null;
  if (!plain || !el || typeof el.selectionStart !== "number" || el.selectionStart !== el.selectionEnd) return;
  const text = String(el.value || "");
  if (ev.key === "ArrowUp" && !text.slice(0, el.selectionStart).includes("\n") && pane.hist.length) {
    const at = pane.histAt === null ? pane.hist.length : pane.histAt;
    if (at === 0) return;
    ev.preventDefault();
    patch(paneId, { text: pane.hist[at - 1], histAt: at - 1, histDraft: pane.histAt === null ? pane.text : pane.histDraft });
    return;
  }
  if (ev.key === "ArrowDown" && pane.histAt !== null && !text.slice(el.selectionEnd).includes("\n")) {
    ev.preventDefault();
    const next = pane.histAt + 1;
    if (next >= pane.hist.length) patch(paneId, { text: pane.histDraft, histAt: null, histDraft: "" });
    else patch(paneId, { text: pane.hist[next], histAt: next });
  }
}
