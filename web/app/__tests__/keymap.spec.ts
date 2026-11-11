// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's keys (web/app/keymap.ts, sprint 326).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { windowKey, type KeyContext, type KeyLike } from "../keymap";
import { TurnInterruptedTier } from "../../vm/signals.gen";

const CTX: KeyContext = { typing: false, targetTyping: false, caretOnly: false, surface: null, revealed: false, editor: false, pickerFocused: false, languageTurns: false, findOpen: false, dialogOpen: false, cardOpen: false, running: false };
const key = (k: string, mods: Partial<KeyLike> = {}): KeyLike => ({ key: k, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...mods });

test("⌘C is the page's copy; Ctrl+C with a caret in a text box interrupts (F336)", () => {
  const box = { ...CTX, typing: true, caretOnly: true };
  assert.strictEqual(windowKey(key("c", { metaKey: true }), box), null);
  assert.strictEqual(windowKey(key("C", { metaKey: true }), box), null);
  assert.deepStrictEqual(windowKey(key("c", { ctrlKey: true }), box), { kind: "interrupt", tier: "hard" });
  assert.strictEqual(windowKey(key("c", { ctrlKey: true }), { ...box, caretOnly: false }), null);
  assert.strictEqual(windowKey(key("c", { ctrlKey: true }), CTX), null);
});

test("Escape closes the innermost open thing, else interrupts a running turn, ⇧ softly", () => {
  const all = { ...CTX, findOpen: true, dialogOpen: true, cardOpen: true, surface: "records" as const, running: true };
  assert.deepStrictEqual(windowKey(key("Escape"), all), { kind: "close-find" });
  assert.deepStrictEqual(windowKey(key("Escape"), { ...all, findOpen: false }), { kind: "close-dialog" });
  assert.deepStrictEqual(windowKey(key("Escape"), { ...all, findOpen: false, dialogOpen: false }), { kind: "close-cards" });
  assert.deepStrictEqual(windowKey(key("Escape"), { ...CTX, surface: "assay" }), { kind: "close-surface" });
  assert.deepStrictEqual(windowKey(key("Escape", { shiftKey: true }), { ...CTX, running: true }), { kind: "interrupt", tier: "soft" });
  assert.strictEqual(windowKey(key("Escape"), CTX), null);
});

test("the ⌘ keys", () => {
  assert.deepStrictEqual(windowKey(key("m", { metaKey: true }), CTX), { kind: "toggle-meta" });
  assert.strictEqual(windowKey(key("m", { metaKey: true, shiftKey: true }), CTX), null);
  assert.deepStrictEqual(windowKey(key("E", { metaKey: true }), CTX), { kind: "toggle-tools" });
  assert.deepStrictEqual(windowKey(key("d", { metaKey: true }), CTX), { kind: "split", dir: "right" });
  assert.deepStrictEqual(windowKey(key("D", { metaKey: true, shiftKey: true }), CTX), { kind: "split", dir: "down" });
  assert.deepStrictEqual(windowKey(key("f", { metaKey: true }), CTX), { kind: "toggle-find" });
  assert.deepStrictEqual(windowKey(key(",", { metaKey: true }), CTX), { kind: "settings" });
  assert.deepStrictEqual(windowKey(key("3", { metaKey: true }), CTX), { kind: "toggle-assays" });
});

test("the arrows go to the records list, the picker, or the language lens, by what has them", () => {
  assert.deepStrictEqual(windowKey(key("ArrowDown"), { ...CTX, surface: "records" }), { kind: "records" });
  assert.strictEqual(windowKey(key("ArrowDown"), { ...CTX, surface: "records", typing: true }), null);
  assert.strictEqual(windowKey(key("ArrowDown"), { ...CTX, surface: "records", dialogOpen: true }), null);
  assert.deepStrictEqual(windowKey(key("Escape"), { ...CTX, pickerFocused: true }), { kind: "picker" });
  assert.strictEqual(windowKey(key("ArrowUp"), { ...CTX, pickerFocused: true, revealed: true }), null);
  assert.deepStrictEqual(windowKey(key("Enter"), { ...CTX, revealed: true, languageTurns: true }), { kind: "language" });
  assert.strictEqual(windowKey(key("Enter"), { ...CTX, revealed: true, languageTurns: true, targetTyping: true }), null);
  assert.strictEqual(windowKey(key("Escape"), { ...CTX, revealed: true, languageTurns: true }), null);
});

// Sprint 406: the editor view's keys (spec r6 §4, D73 (c), frame 24a's footer).
test("⌘⇧E toggles the editor; Escape in the editor is the pane's: the cascade, then the interrupt (sprint 447)", () => {
  assert.deepStrictEqual(windowKey(key("E", { metaKey: true, shiftKey: true }), CTX), { kind: "toggle-editor" });
  assert.deepStrictEqual(windowKey(key("e", { metaKey: true, shiftKey: true }), { ...CTX, editor: true, typing: true }), { kind: "toggle-editor" });
  assert.strictEqual(windowKey(key("E", { metaKey: true, shiftKey: true, altKey: true }), CTX), null);
  assert.strictEqual(windowKey(key("E", { metaKey: true, shiftKey: true, ctrlKey: true }), CTX), null);
  assert.deepStrictEqual(windowKey(key("e", { metaKey: true }), { ...CTX, editor: true }), { kind: "toggle-tools" });
  const ed = { ...CTX, editor: true, running: true };
  assert.deepStrictEqual(windowKey(key("Escape"), ed), { kind: "interrupt", tier: TurnInterruptedTier.HARD });
  assert.deepStrictEqual(windowKey(key("Escape"), { ...ed, typing: true }), { kind: "interrupt", tier: TurnInterruptedTier.HARD });
  assert.deepStrictEqual(windowKey(key("Escape", { shiftKey: true }), ed), { kind: "interrupt", tier: TurnInterruptedTier.SOFT });
  assert.strictEqual(windowKey(key("Escape"), { ...ed, running: false }), null);
  assert.deepStrictEqual(windowKey(key("Escape"), { ...ed, findOpen: true }), { kind: "close-find" });
  assert.deepStrictEqual(windowKey(key("Escape"), { ...ed, dialogOpen: true }), { kind: "close-dialog" });
  assert.strictEqual(windowKey(key("Escape"), { ...ed, vimCode: true }), null);
  // Sprint 430: ⌘M in the editor is meta's key still; App opens the meta pane inside the editor.
  assert.deepStrictEqual(windowKey({ key: "m", code: "KeyM", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false }, ed), { kind: "toggle-meta" });
  // Sprint 428: ⌘F and ⌥⌘F find and replace in the open file; in the terminal ⌘F is the transcript's find.
  assert.deepStrictEqual(windowKey({ key: "f", code: "KeyF", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false }, ed), { kind: "editor-find", field: "query" });
  assert.deepStrictEqual(windowKey({ key: "ƒ", code: "KeyF", metaKey: true, ctrlKey: false, shiftKey: false, altKey: true }, ed), { kind: "editor-find", field: "replace" });
  assert.deepStrictEqual(windowKey({ key: "f", code: "KeyF", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false }, { ...ed, editorTerminal: true }), { kind: "toggle-find" });
  // Sprint 434: ⌘⇧F in the editor is the workspace search, from the terminal too; outside it, the find bar.
  assert.deepStrictEqual(windowKey({ key: "F", code: "KeyF", metaKey: true, ctrlKey: false, shiftKey: true, altKey: false }, ed), { kind: "editor-search" });
  assert.deepStrictEqual(windowKey({ key: "F", code: "KeyF", metaKey: true, ctrlKey: false, shiftKey: true, altKey: false }, { ...ed, editorTerminal: true }), { kind: "editor-search" });
  assert.deepStrictEqual(windowKey({ key: "F", code: "KeyF", metaKey: true, ctrlKey: false, shiftKey: true, altKey: false }, CTX), { kind: "toggle-find" });
  // Sprint 441: ⌘P in the editor is quick open; outside it the key is the page's.
  assert.deepStrictEqual(windowKey({ key: "p", code: "KeyP", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false }, ed), { kind: "quick-open" });
  assert.strictEqual(windowKey({ key: "p", code: "KeyP", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false }, CTX), null);
  // Sprint 437: ⌥⌘F in the tree finds by name; elsewhere in the editor it replaces in the file.
  assert.deepStrictEqual(windowKey({ key: "ƒ", code: "KeyF", metaKey: true, ctrlKey: false, shiftKey: false, altKey: true }, { ...ed, editorTree: true }), { kind: "tree-find" });
  // Sprint 423: with vim bound and the code focused, Escape is vim's; a find or dialog still closes first.
  assert.strictEqual(windowKey(key("Escape"), { ...ed, vimCode: true }), null);
  assert.deepStrictEqual(windowKey(key("Escape"), { ...ed, vimCode: true, findOpen: true }), { kind: "close-find" });
  assert.deepStrictEqual(windowKey(key("Escape"), { ...ed, findOpen: true }), { kind: "close-find" });
  assert.deepStrictEqual(windowKey(key("Escape"), { ...ed, dialogOpen: true }), { kind: "close-dialog" });
  assert.deepStrictEqual(windowKey(key("Escape"), { ...ed, cardOpen: true }), { kind: "close-cards" });
  assert.deepStrictEqual(windowKey(key("Escape"), { ...CTX, surface: "assay", running: true }), { kind: "close-surface" });
  assert.deepStrictEqual(windowKey(key("Escape"), { ...CTX, running: true }), { kind: "interrupt", tier: "hard" });
});

// Sprint 415: the column keys, in the editor only; ⌥ chords read the physical key.
test("⌥⌘L, ⌥⌘R and ⌘J fold the editor's columns, and do nothing outside it", () => {
  const ed = { ...CTX, editor: true };
  assert.deepStrictEqual(windowKey({ ...key("¬", { metaKey: true, altKey: true }), code: "KeyL" }, ed), { kind: "fold-editor", column: "left" });
  assert.deepStrictEqual(windowKey({ ...key("®", { metaKey: true, altKey: true }), code: "KeyR" }, ed), { kind: "fold-editor", column: "right" });
  assert.deepStrictEqual(windowKey(key("j", { metaKey: true }), ed), { kind: "fold-editor", column: "bottom" });
  assert.deepStrictEqual(windowKey(key("j", { metaKey: true }), { ...ed, typing: true }), { kind: "fold-editor", column: "bottom" });
  assert.strictEqual(windowKey({ ...key("¬", { metaKey: true, altKey: true }), code: "KeyL" }, CTX), null);
  assert.strictEqual(windowKey(key("j", { metaKey: true }), CTX), null);
});

// Sprint 417: the editor does not split (D49 (c)); ⌘D and ⌘⇧D are refused there and split elsewhere.
test("⌘D and ⌘⇧D are refused in the editor and split outside it", () => {
  const ed = { ...CTX, editor: true };
  assert.deepStrictEqual(windowKey(key("d", { metaKey: true }), ed), { kind: "refuse-split" });
  assert.deepStrictEqual(windowKey(key("D", { metaKey: true, shiftKey: true }), ed), { kind: "refuse-split" });
  assert.deepStrictEqual(windowKey(key("d", { metaKey: true }), CTX), { kind: "split", dir: "right" });
});
