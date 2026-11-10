// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's keys (web/app/keymap.ts, sprint 326).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { windowKey, type KeyContext, type KeyLike } from "../keymap";

const CTX: KeyContext = { typing: false, targetTyping: false, caretOnly: false, surface: null, revealed: false, pickerFocused: false, languageTurns: false, findOpen: false, dialogOpen: false, cardOpen: false, running: false, editorOpen: false };
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

test("editor column toggles fire only when editorOpen is true", () => {
  const edCtx = { ...CTX, editorOpen: true };
  assert.deepStrictEqual(windowKey(key("l", { metaKey: true, altKey: true }), edCtx), { kind: "toggle-editor-left" });
  assert.deepStrictEqual(windowKey(key("r", { metaKey: true, altKey: true }), edCtx), { kind: "toggle-editor-right" });
  assert.deepStrictEqual(windowKey(key("j", { metaKey: true }), edCtx), { kind: "toggle-editor-bottom" });
  assert.strictEqual(windowKey(key("l", { metaKey: true, altKey: true }), CTX), null);
  assert.strictEqual(windowKey(key("r", { metaKey: true, altKey: true }), CTX), null);
  assert.strictEqual(windowKey(key("j", { metaKey: true }), CTX), null);
});

test("existing ⌘ keys fire regardless of editorOpen", () => {
  const edCtx = { ...CTX, editorOpen: true };
  assert.deepStrictEqual(windowKey(key("m", { metaKey: true }), edCtx), { kind: "toggle-meta" });
  assert.deepStrictEqual(windowKey(key("E", { metaKey: true }), edCtx), { kind: "toggle-tools" });
  assert.deepStrictEqual(windowKey(key("d", { metaKey: true }), edCtx), { kind: "split", dir: "right" });
  assert.deepStrictEqual(windowKey(key(",", { metaKey: true }), edCtx), { kind: "settings" });
  assert.deepStrictEqual(windowKey(key("3", { metaKey: true }), edCtx), { kind: "toggle-assays" });
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
