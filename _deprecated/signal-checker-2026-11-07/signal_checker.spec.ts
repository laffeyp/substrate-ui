// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window's (web/vm/instrumentation/check.ts) and main's (electron/check_signal.js) signal checkers
// against the shared cases in web/vm/signals/checker-cases.json; the server's runs them in
// tests/test_signal_checker.py (sprint 355).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { checkSignal, type CheckTag } from "../../vm/instrumentation/check";

type Repeat = { field: string; char: string; times: number; suffix?: string };
type Case = { why: string; tag: string; payload?: Record<string, unknown>; payload_repeat?: Repeat; ok: boolean; out?: Record<string, unknown>; out_repeat?: Repeat; problem?: string; field?: string | null };
const spec = JSON.parse(readFileSync(join(__dirname, "..", "..", "vm", "signals", "checker-cases.json"), "utf8")) as { vocabulary: { tags: (CheckTag & { name: string })[] }; cases: Case[] };
const tags = Object.fromEntries(spec.vocabulary.tags.map((t) => [t.name, t]));
const repeat = (r: Repeat) => ({ [r.field]: r.char.repeat(r.times) + (r.suffix ?? "") });

const mainChecker = createRequire(__filename)("../../../electron/check_signal.ts") as {
  checkSignal: typeof checkSignal; tagsOf: (v: { tags: (CheckTag & { name: string })[] }) => Record<string, CheckTag>;
};
const checkers: [string, typeof checkSignal, Record<string, CheckTag>][] = [
  ["window", checkSignal, tags],
  ["main", mainChecker.checkSignal, mainChecker.tagsOf(spec.vocabulary)],
];

for (const [who, check, t] of checkers) {
  for (const c of spec.cases) {
    test(`${who}: ${c.why}`, () => {
      const v = check(t, c.tag, c.payload ?? repeat(c.payload_repeat!));
      if (c.ok) assert.deepStrictEqual({ ...v }, { ok: true, payload: c.out ?? repeat(c.out_repeat!) });
      else assert.deepStrictEqual({ ...v }, { ok: false, problem: c.problem, field: c.field });
    });
  }
}
