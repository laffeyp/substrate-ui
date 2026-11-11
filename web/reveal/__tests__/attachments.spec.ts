// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Which sent attachments are marked as sent by reference (web/reveal/transcript/attachments.ts, sprint 452). The texts are
// the server's forms (server.py `_attachment_text`), written here by hand.

import { test } from "node:test";
import assert from "node:assert";
import { byReference, chipTitle } from "../transcript/attachments";

test("the reference lines are by reference; content and listings are not", () => {
  assert.strictEqual(byReference({ kind: "file", label: "big.log", ref: "big.log", text: "(not inlined: 3.1 MB, 300,000 lines, over the 64 KB a file goes inline; big.log; read it with your file tools)" }), true);
  assert.strictEqual(byReference({ kind: "file", label: "gone.ts", ref: "gone.ts", text: "(not found when the message was sent: gone.ts)" }), true);
  assert.strictEqual(byReference({ kind: "file", label: "cart.ts", ref: "src/cart.ts", text: "(src/cart.ts)\none\n" }), false);
  assert.strictEqual(byReference({ kind: "folder", label: "src/", ref: "src", text: "(src/, 1 file)\nsrc/cart.ts" }), false);
  assert.strictEqual(byReference({ kind: "file", label: "cart.ts", ref: "src/cart.ts" }), false);
});

test("the hover is the path, and for a reference the reason under it", () => {
  assert.strictEqual(chipTitle({ kind: "file", label: "cart.ts", ref: "src/cart.ts", text: "(src/cart.ts)\none\n" }), "src/cart.ts");
  assert.strictEqual(chipTitle({ kind: "file", label: "gone.ts", ref: "gone.ts", text: "(not found when the message was sent: gone.ts)" }), "gone.ts\n(not found when the message was sent: gone.ts)");
});
