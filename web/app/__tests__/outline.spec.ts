// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The outline (sprint 476): C and C++ name a function through its declarator; structs and classes with a body are
// listed; the languages outlined before keep their rows. Each file's parser is the package `@codemirror/language-data`
// loads for it; imported here directly, since its `load()` reaches the ES-module copy of `@codemirror/state` while this
// spec runs the CommonJS one, and an extension from one fails the other's instance check.

import { test } from "node:test";
import assert from "node:assert/strict";
import { EditorState, type Extension } from "@codemirror/state";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { outlineOf } from "../derive/outline";

const LANG: Record<string, Extension> = { c: cpp(), cpp: cpp(), py: python(), ts: javascript({ typescript: true }), md: markdown() };

async function rows(file: string, doc: string): Promise<string[]> {
  const state = EditorState.create({ doc, extensions: [LANG[file.split(".").pop()!]] });
  return outlineOf(state).map((r) => `${"  ".repeat(r.depth)}${r.kind} ${r.name} ${r.line}-${r.end}`);
}

test("C: functions by their declarator's name, a pointer return, structs with a body only", async () => {
  const c = "struct point { int x; };\nstruct point p;\nstatic int *make(int n) { return 0; }\nint main(void) {\n  return 0;\n}\n";
  assert.deepEqual(await rows("main.c", c), ["struct point 1-1", "fn make 3-3", "fn main 4-6"]);
});

test("C++: a class's methods one deeper, a scoped definition named in full", async () => {
  const cpp = "namespace ns {\nclass A {\n  void m() {}\n  ~A() {}\n};\n}\nint A::f() { return 1; }\nint &ref() { static int r; return r; }\n";
  assert.deepEqual(await rows("a.cpp", cpp), ["class A 2-5", "  fn m 3-3", "  fn ~A 4-4", "fn A::f 7-7", "fn ref 8-8"]);
});

test("Python, TypeScript and Markdown keep their rows", async () => {
  assert.deepEqual(await rows("a.py", "class K:\n    def run(self):\n        pass\n\ndef top():\n    pass\n"), ["class K 1-4", "  fn run 2-4", "fn top 5-7"]);
  assert.deepEqual(await rows("a.ts", "class K {\n  run() {}\n}\nfunction top() {}\n"), ["class K 1-3", "  fn run 2-2", "fn top 4-4"]);
  assert.deepEqual(await rows("a.md", "# Title\n\n## Part\n"), ["h1 Title 1-1", "h2 Part 3-3"]);
});
