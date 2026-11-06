// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// 256-colour and truecolor SGR in the login card's terminal (web/reveal/transcript/ansi.ts; sprint 342,
// plan row F7, F357).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { AnsiTerminal, color256 } from "../transcript/ansi";

const ESC = "\u001b";
const sgrOf = (text: string) => { const t = new AnsiTerminal(); t.write(text); return t.snapshot().rows[0].runs[0].sgr; };

test("the 256-colour palette: the theme's 16, the cube, the grey ramp", () => {
  assert.strictEqual(color256(1), "#c26058");
  assert.strictEqual(color256(16), "#000000");
  assert.strictEqual(color256(196), "#ff0000");
  assert.strictEqual(color256(231), "#ffffff");
  assert.strictEqual(color256(232), "#080808");
  assert.strictEqual(color256(255), "#eeeeee");
  assert.strictEqual(color256(256), undefined);
});

test("38;5;n and 38;2;r;g;b set the colour; 2 inside a truecolor is not dim", () => {
  assert.deepStrictEqual(sgrOf(`${ESC}[38;5;208mX`).fg, "#ff8700");
  const tc = sgrOf(`${ESC}[38;2;10;20;30;48;2;200;100;50mX`);
  assert.deepStrictEqual([tc.fg, tc.bg, tc.dim], ["#0a141e", "#c86432", undefined]);
});
