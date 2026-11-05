// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The input bar's slash menu, hint and Tab completion (web/app/derive/slash.ts, sprint 258).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import type { SlashCatalogEntry } from "../../vm/session_controller";
import { CHOICE_NOTES } from "../derive/control_notes";
import { slashHint, slashRows, tabComplete } from "../derive/slash";

const CATALOG: SlashCatalogEntry[] = [
  { name: "help", aliases: [], usage: "/help", about: "list the commands", choices: null, current: null },
  { name: "length", aliases: ["len"], usage: "/length <terse|normal|full>", about: "set the reply length", choices: ["terse", "normal", "full"], current: "normal" },
  { name: "name", aliases: [], usage: "/name <text>", about: "name the session", choices: null, current: null },
  { name: "exit", aliases: [], usage: "/exit", about: "end the session", choices: null, current: null },
];

test("a slash lists the commands; a command that takes text fills the bar", () => {
  const rows = slashRows("/", CATALOG, CHOICE_NOTES);
  assert.deepStrictEqual(rows.map((r) => [r.cmd, r.desc, r.action]), [
    ["/help", "list the commands", { send: "/help" }],
    ["/length", "<terse|normal|full> · set the reply length", { fill: "/length " }],
    ["/name", "<text> · name the session", { fill: "/name " }],
    ["/exit", "end the session", { send: "/exit" }],
  ]);
});

test("one match closes the menu; its hint sits in the column", () => {
  assert.deepStrictEqual(slashRows("/he", CATALOG, CHOICE_NOTES), []);
  assert.deepStrictEqual(slashHint("/he", CATALOG), { text: "list the commands", left: "17ch" });
  assert.strictEqual(slashHint("/xyz", CATALOG), null);
  assert.strictEqual(slashHint("hello", CATALOG), null);
});

test("a command's choices, with their notes and the current one, by name or alias", () => {
  const rows = slashRows("/len ", CATALOG, CHOICE_NOTES);
  assert.deepStrictEqual(rows.map((r) => [r.cmd, r.desc, r.current, r.choice]), [
    ["/length terse", "the answer and its facts", false, true],
    ["/length normal", "as the guidance has it · current", true, true],
    ["/length full", "complete, not padded", false, true],
  ]);
  assert.deepStrictEqual(slashRows("/length f", CATALOG, CHOICE_NOTES).map((r) => r.action), [{ send: "/length full" }]);
});

test("Tab completes one match, or the longest common prefix", () => {
  assert.strictEqual(tabComplete("/he", CATALOG), "/help ");
  assert.strictEqual(tabComplete("/n", CATALOG), "/name ");
  assert.strictEqual(tabComplete("/", CATALOG), null);
  assert.strictEqual(tabComplete("/le", CATALOG), "/length ");
  assert.strictEqual(tabComplete("hi", CATALOG), null);
});
