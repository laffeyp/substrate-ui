// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// How a tool card draws its text (sprint 505).

import { test } from "node:test";
import assert from "node:assert/strict";
import { argFormat, jsonText, outputFormat, pathOf, splitArg, splitNumbered, needsTerminal, shellResult } from "../tool_format";

test("a call's file, from a harness call and a kernel call", () => {
  assert.deepEqual(splitArg("file_path=/x/a.py"), { key: "file_path", value: "/x/a.py" });
  assert.deepEqual(splitArg("src/a=b.py"), { key: null, value: "src/a=b.py" }, "a path with = is not a key");
  assert.equal(pathOf("Read", ["file_path=/x/models.py", "limit=40"]), "/x/models.py");
  assert.equal(pathOf("read_file", ["src/models.py", "1"]), "src/models.py");
  assert.equal(pathOf("bash", ["ls"]), null);
});

test("formats by tool", () => {
  assert.deepEqual(outputFormat("Read", ["file_path=/x/a.rs"], "1→fn main() {}"), { kind: "code", path: "/x/a.rs" });
  assert.deepEqual(outputFormat("read_file", ["a.go"], "x"), { kind: "code", path: "a.go" });
  assert.deepEqual(outputFormat("bash", ["echo"], '{"ok": true}'), { kind: "json" });
  assert.deepEqual(outputFormat("bash", ["ls"], "a.txt\nb.txt"), { kind: "text" });
  assert.deepEqual(argFormat("Bash", ["command=ls -la", "description=List"], 0), { kind: "shell" });
  assert.deepEqual(argFormat("Bash", ["command=ls -la", "description=List"], 1), { kind: "text" });
  assert.deepEqual(argFormat("Edit", ["file_path=/x/a.py", "old_string=a = 1", "new_string=a = 2"], 2), { kind: "code", path: "/x/a.py" });
  assert.deepEqual(argFormat("Edit", ["file_path=/x/a.py", "old_string=a"], 0), { kind: "text" }, "the path itself is text");
  assert.deepEqual(argFormat("write_file", ["a.ts", "export const a = 1;"], 1), { kind: "code", path: "a.ts" });
});

test("line-number prefixes become a gutter", () => {
  assert.deepEqual(splitNumbered("     1→import os\n     2→\n     3→x = 1"), { numbers: ["1", "2", "3"], code: "import os\n\nx = 1" });
  assert.deepEqual(splitNumbered("1\tdef f():\n2\t    return 1"), { numbers: ["1", "2"], code: "def f():\n    return 1" });
  assert.equal(splitNumbered("a.txt\nb.txt\n3 files"), null);
});

test("JSON is pretty-printed when on one line, kept when laid out", () => {
  assert.equal(jsonText('{"a":1,"b":[2]}'), '{\n  "a": 1,\n  "b": [\n    2\n  ]\n}');
  assert.equal(jsonText('{\n "a": 1\n}'), '{\n "a": 1\n}');
  assert.equal(jsonText("{not json}"), null);
  assert.equal(jsonText("42"), null);
});

test("which text the terminal draws", () => {
  assert.equal(needsTerminal("\x1b[31merror\x1b[0m"), true);
  assert.equal(needsTerminal("50%\r100%"), true);
  assert.equal(needsTerminal("a.txt\nb.txt\tc"), false);
});

test("a kernel bash result is read apart; other output is not", () => {
  assert.deepEqual(shellResult("bash", '{"exit": 1, "stdout": "\\u001b[31mx\\u001b[0m", "stderr": "warn"}'), { exit: 1, stdout: "\x1b[31mx\x1b[0m", stderr: "warn" });
  assert.equal(shellResult("Bash", "plain printed text"), null);
  assert.equal(shellResult("read_file", '{"stdout": "a"}'), null);
  assert.equal(shellResult("bash", '{"ok": true}'), null);
});
