// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Preserve case (sprint 438): VS Code's rule.

import { test } from "node:test";
import assert from "node:assert/strict";
import { preserveCase } from "../derive/preserve_case";

test("capitals, lower case, a capital first letter, a lower first letter", () => {
  assert.equal(preserveCase("PRICE", "cost"), "COST");
  assert.equal(preserveCase("price", "Cost"), "cost");
  assert.equal(preserveCase("Price", "cost"), "Cost");
  assert.equal(preserveCase("priceCents", "CostCents"), "costCents");
});

test("hyphen and underscore parts are cased one by one", () => {
  assert.equal(preserveCase("Foo-BAR", "baz-qux"), "Baz-QUX");
  assert.equal(preserveCase("FOO_bar", "baz_qux"), "BAZ_qux");
  assert.equal(preserveCase("a-b", "c"), "c");
});
