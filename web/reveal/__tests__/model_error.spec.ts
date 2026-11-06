// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The timeout line names the responder's own retry count (sprint 339, plan row F4, F340).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { summariseModelError } from "../../vm/session_controller";

test("a timeout names the attempts the responder made; with no count it reads as before", () => {
  assert.strictEqual(summariseModelError("RuntimeError('OllamaResponder(llama3.2) failed after 5 attempts: ReadTimeout: timed out')"), "provider timed out — no response after 5 attempts");
  assert.strictEqual(summariseModelError("RuntimeError('OllamaResponder(llama3.2) failed after 1 attempts: ReadTimeout: timed out')"), "provider timed out — no response after 1 attempts");
  assert.strictEqual(summariseModelError("deadline exceeded"), "provider timed out — no response after 3 attempts");
});
