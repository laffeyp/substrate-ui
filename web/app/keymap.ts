// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's keys (sprint 326; plan PLAN-2026-11-04-shell-to-react-r5.md, E3, F336): which action a
// key press takes, given where the focus is and what is open. Moved from reveal_component.ts's keydown
// handler and reveal.ts's Ctrl+C listener; the caller runs the action.
//
// F336: reveal.ts read Ctrl+C and ⌘C alike, so on macOS ⌘C in an empty prompt interrupted the turn
// instead of copying; ⌘C is the system's copy and no key here. Ctrl+C in a text box with no selection
// interrupts the focused pane's turn (reveal.ts held pane 1's controller, so it interrupted pane 1's).
//
// In order: on the records page the arrows and ↵ walk the list; on a focused pane with no session they
// work its picker without a click in its path box; in the language lens they walk turns and lanes;
// then the ⌘ keys; then Escape, which closes the innermost open thing or interrupts a running turn
// (⇧Esc softly: stop after this tool); then Ctrl+C.
//
// Sprint 406 (roadmap 2026-11-09-code-editor r6, R1): ⌘⇧E goes to the editor view and back. Sprint 447 (the
// Architect, 2026-11-10: Escape "should actually interrupt the model always"): in the editor Escape is the
// pane's Escape, the close cascade and then the interrupt; it no longer leaves the editor.
//
// Sprint 457 (roadmap r13 E10.4): with the right-click menu open, Escape closes it before anything else, so it
// never interrupts a turn, and the arrows and ↵ are the menu's.

import { TurnInterruptedTier } from "../vm/signals.gen";
/** `code`, the physical key: with ⌥ held, macOS gives `key` a symbol (⌥L is "¬"), so ⌥ chords read the code. */
export interface KeyLike { key: string; code?: string; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; }

export interface KeyContext {
  /** The focused element is a text box. */
  typing: boolean;
  /** The key's target is a text box (the Enter that runs `/language` has unmounted its box by now). */
  targetTyping: boolean;
  /** The focused text box has a caret and no selection. */
  caretOnly: boolean;
  /** The records, assay or studio page is open. */
  surface: "records" | "assay" | "studio" | null;
  /** The meta view is open. */
  revealed: boolean;
  /** The editor view is open, with no page over it. */
  editor: boolean;
  /** The editor's code has the focus with vim bound: Escape is vim's (BLACKBOARD 2026-11-09, esc stays in vim). */
  vimCode?: boolean;
  /** In the editor, the focus is in the substrate terminal (its input or transcript): ⌘F is the transcript's. */
  editorTerminal?: boolean;
  /** Sprint 437: the focus is in the editor's files tree. */
  editorTree?: boolean;
  /** Sprint 454: the focus is in the editor's code (any binding). */
  editorCode?: boolean;
  /** The focused pane has no session: its picker takes the arrows. */
  pickerFocused: boolean;
  /** The meta view shows the language lens and the lens has turns. */
  languageTurns: boolean;
  findOpen: boolean;
  dialogOpen: boolean;
  /** The top bar's model or workspace card is open. */
  cardOpen: boolean;
  /** The focused pane's turn is in flight. */
  running: boolean;
  /** Sprint 457: the right-click menu is open (state/context_menu.ts). */
  menuOpen?: boolean;
}

export type KeyAction =
  | { kind: "records" } | { kind: "picker" } | { kind: "language" }
  | { kind: "toggle-meta" } | { kind: "toggle-tools" } | { kind: "split"; dir: "right" | "down" }
  | { kind: "toggle-find" } | { kind: "settings" } | { kind: "toggle-assays" }
  | { kind: "toggle-editor" } | { kind: "add-selection" }
  | { kind: "editor-find"; field: "query" | "replace" } | { kind: "editor-search" } | { kind: "tree-find" } | { kind: "quick-open" }
  | { kind: "fold-editor"; column: "left" | "right" | "bottom" }
  | { kind: "refuse-split" }
  | { kind: "menu" } | { kind: "close-menu" }
  | { kind: "close-find" } | { kind: "close-dialog" } | { kind: "close-cards" } | { kind: "close-surface" }
  | { kind: "interrupt"; tier: TurnInterruptedTier };

/** The list keys: the arrows and Enter. With Escape and the ⌘ and Ctrl chords, the keys this map reads. */
export const ARROWS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"];

/** The action a key takes, or null to leave it to the page (⌘C among them). */
export function windowKey(ev: KeyLike, ctx: KeyContext): KeyAction | null {
  if (ctx.menuOpen && !ev.metaKey && !ev.ctrlKey) {
    if (ev.key === "Escape") return { kind: "close-menu" };
    if (ev.key === "ArrowUp" || ev.key === "ArrowDown" || ev.key === "Enter") return { kind: "menu" };
  }
  const quiet = !ctx.dialogOpen && !ctx.findOpen;
  const listKey = (ARROWS.includes(ev.key) || ev.key === "Escape") && !ev.metaKey && !ev.ctrlKey;
  if (listKey && ev.key !== "Escape" && !ctx.typing && ctx.surface === "records" && quiet) return { kind: "records" };
  if (listKey && !ctx.typing && ctx.pickerFocused && !ctx.revealed && !ctx.surface && quiet) return { kind: "picker" };
  if (ARROWS.includes(ev.key) && ctx.revealed && ctx.languageTurns && !ctx.surface && !ctx.targetTyping && !ev.metaKey && !ev.ctrlKey) return { kind: "language" };

  const cmd = ev.metaKey && !ev.ctrlKey;
  const plainCmd = cmd && !ev.shiftKey && !ev.altKey;
  const key = ev.key.toLowerCase();
  // ⌘M: the menu's Minimize gives up the key (electron/menu.ts).
  if (plainCmd && key === "m") return { kind: "toggle-meta" };
  if (plainCmd && key === "e") return { kind: "toggle-tools" };
  // ⌘⇧E: the editor view, from anywhere; the same key returns to the pane (D86).
  if (cmd && ev.shiftKey && !ev.altKey && key === "e") return { kind: "toggle-editor" };
  // Sprint 415 (R6; spec r6 §5.1 (1)): in the editor, one key each folds or unfolds a column: ⌥⌘L the
  // files, ⌥⌘R the inspector, ⌘J the substrate terminal (BLACKBOARD 2026-11-09, the column keys).
  if (ctx.editor && cmd && ev.altKey && !ev.shiftKey && ev.code === "KeyL") return { kind: "fold-editor", column: "left" };
  if (ctx.editor && cmd && ev.altKey && !ev.shiftKey && ev.code === "KeyR") return { kind: "fold-editor", column: "right" };
  if (ctx.editor && plainCmd && key === "j") return { kind: "fold-editor", column: "bottom" };
  // Sprint 417 (roadmap r8, E1): the editor does not split (D49 (c), spec r6 §4); ⌘D and ⌘⇧D are refused there.
  if (ev.metaKey && key === "d") return ctx.editor ? { kind: "refuse-split" } : { kind: "split", dir: ev.shiftKey ? "down" : "right" };
  // Sprint 428 (roadmap r10 key table): in the editor, ⌘F finds in the open file and ⌥⌘F replaces there,
  // in the inspector's FIND / REPLACE; with the focus in the terminal, ⌘F is the transcript's find.
  // Sprint 437: ⌥⌘F with the tree focused finds in the tree by name; elsewhere it is replace in the file
  // (VS Code splits the key by focus the same way).
  if (ctx.editor && ctx.editorTree && cmd && ev.altKey && !ev.shiftKey && ev.code === "KeyF") return { kind: "tree-find" };
  // Sprint 441 (roadmap r10 E9): ⌘P in the editor is quick open.
  if (ctx.editor && plainCmd && key === "p") return { kind: "quick-open" };
  // Sprint 434 (roadmap r10 E8): ⌘⇧F in the editor is the workspace search in the left column.
  if (ctx.editor && cmd && ev.shiftKey && !ev.altKey && ev.code === "KeyF") return { kind: "editor-search" };
  // Sprint 454, sprint 456 (the Architect, 2026-11-10: a key under the left hand, and ⌥ as for ⌥-click; ⌘⇧ is kept for
  // switching views): ⌥A adds the code's selection to the message. The physical key, since ⌥A types "å" on macOS.
  if (ctx.editor && ctx.editorCode && ev.altKey && !ev.metaKey && !ev.ctrlKey && !ev.shiftKey && ev.code === "KeyA") return { kind: "add-selection" };
  if (ctx.editor && !ctx.editorTerminal && cmd && !ev.shiftKey && ev.code === "KeyF") return { kind: "editor-find", field: ev.altKey ? "replace" : "query" };
  if (ev.metaKey && key === "f") return { kind: "toggle-find" };
  if (ev.metaKey && ev.key === ",") return { kind: "settings" };
  // D86: ⌘3 opens the assay page, and the same key returns to the panes.
  if (plainCmd && ev.key === "3") return { kind: "toggle-assays" };

  if (ev.key === "Escape") {
    if (ctx.findOpen) return { kind: "close-find" };
    if (ctx.dialogOpen) return { kind: "close-dialog" };
    if (ctx.cardOpen) return { kind: "close-cards" };
    if (ctx.surface) return { kind: "close-surface" };
    if (ctx.editor && ctx.vimCode) return null;
    return ctx.running ? { kind: "interrupt", tier: ev.shiftKey ? TurnInterruptedTier.SOFT : TurnInterruptedTier.HARD } : null;
  }
  if (ev.ctrlKey && !ev.metaKey && key === "c" && ctx.typing && ctx.caretOnly) return { kind: "interrupt", tier: TurnInterruptedTier.HARD };
  return null;
}
