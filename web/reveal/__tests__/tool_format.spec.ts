// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// How a tool card draws its text (sprint 505).

import { test } from "node:test";
import assert from "node:assert/strict";
import { argFormat, jsonText, outputFormat, pathOf, splitArg, splitNumbered, needsTerminal, shellResult, summaryOf, commandFormat, shellWords, isDiff, grepLines } from "../tool_format";

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

test("a closed card's summary: a command, a path, a first arg, never a key", () => {
  assert.deepEqual(summaryOf("bash", ["ls -la"]), { text: "ls -la", format: "shell" });
  assert.deepEqual(summaryOf("Bash", ["command=grep -rn \"x\" src", "description=Find x"]), { text: "grep -rn \"x\" src", format: "shell" });
  assert.deepEqual(summaryOf("Read", ["file_path=/w/src/models.py", "limit=40"]), { text: "/w/src/models.py", format: "path" });
  assert.deepEqual(summaryOf("read_file", ["alpha/a/b/models.py"]), { text: "alpha/a/b/models.py", format: "path" });
  assert.deepEqual(summaryOf("Grep", ["path=src", "pattern=class Cart"]), { text: "class Cart", format: "text" });
  assert.deepEqual(summaryOf("Glob", ["pattern=**/*.ts"]), { text: "**/*.ts", format: "text" });
  assert.deepEqual(summaryOf("delegate", []), { text: "", format: "text" });
});

test("sprint 510: shell words", () => {
  assert.deepEqual(shellWords(`sed -n '1,40p' "src/a b.py"`), ["sed", "-n", "1,40p", "src/a b.py"]);
  assert.deepEqual(shellWords("grep -rn x\\ y src"), ["grep", "-rn", "x y", "src"]);
});

test("sprint 510: a command's output format", () => {
  assert.deepEqual(commandFormat("cat alpha/a/b/c/memchr.rs"), { kind: "code", path: "alpha/a/b/c/memchr.rs" });
  assert.deepEqual(commandFormat("head -n 40 src/models.py"), { kind: "code", path: "src/models.py" });
  assert.deepEqual(commandFormat("sed -n '1,40p' src/models.py"), { kind: "code", path: "src/models.py" });
  assert.deepEqual(commandFormat("cd alpha && cat d/e/strings.go | head -n 30"), { kind: "code", path: "d/e/strings.go" });
  assert.deepEqual(commandFormat("LANG=C cat a.ts"), { kind: "code", path: "a.ts" });
  assert.equal(commandFormat("cat a.ts b.ts"), null, "two files are not one file's code");
  assert.deepEqual(commandFormat("cat a.ts | grep x"), { kind: "grep" }, "grep's own output has no path; grepLines finds none and it stays text");
  assert.deepEqual(commandFormat("git diff HEAD~1"), { kind: "diff" });
  assert.deepEqual(commandFormat("git -C x status && git show HEAD"), { kind: "diff" });
  assert.deepEqual(commandFormat("diff -u a b"), { kind: "diff" });
  assert.deepEqual(commandFormat("grep -rn 'class Cart' src"), { kind: "grep" });
  assert.deepEqual(commandFormat("git grep -n foo"), { kind: "grep" });
  assert.equal(commandFormat("ls -la"), null);
  assert.equal(commandFormat("npm test"), null);
});

test("sprint 510: diffs and grep hits are read by their shape", () => {
  assert.equal(isDiff("diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -1 +1 @@\n-a\n+b"), true);
  assert.equal(isDiff("no changes"), false);
  const hits = grepLines("src/a.py:12:class Cart:\nsrc/b.py-13-    pass\n--\nsrc/c.py:40:x = Cart()")!;
  assert.deepEqual(hits[0], { path: "src/a.py", line: "12", sep: ":", text: "class Cart:", file: "src/a.py" });
  assert.deepEqual(hits[1], { path: "src/b.py", line: "13", sep: "-", text: "    pass", file: "src/b.py" });
  assert.equal(hits[2].path, null);
  assert.deepEqual(grepLines("a.ts:const x = 1")![0], { path: "a.ts", line: null, sep: ":", text: "const x = 1", file: "a.ts" });
  assert.equal(grepLines("Usage: grep [OPTION]... PATTERNS [FILE]..."), null);
});

test("sprint 511: grep of one file, as Claude Code's Bash ran it", () => {
  assert.deepEqual(commandFormat('grep -n "class " /w/src/models.py'), { kind: "grep", file: "/w/src/models.py" });
  assert.deepEqual(commandFormat("grep -rn x src"), { kind: "grep" });
  assert.deepEqual(commandFormat("grep -n -e x a.py b.py"), { kind: "grep" });
  assert.deepEqual(commandFormat("rg -n x a.py"), { kind: "grep" }, "rg searches recursively; its hits carry a path");
  const rows = grepLines("59:class A(Exception):\n69-    pass", "/w/m.py")!;
  assert.deepEqual(rows[0], { path: null, line: "59", sep: ":", text: "class A(Exception):", file: "/w/m.py" });
  assert.equal(rows[1].sep, "-");
  assert.equal(grepLines("59:class A"), null, "without the file, a bare line:text is not a hit");
  assert.deepEqual(outputFormat("Bash", ['command=grep -n "class " /w/m.py', "description=Find"], "59:class A:\n69:class B:"), { kind: "grep", file: "/w/m.py" });
});

test("sprint 511: a shell's error is not a grep hit", () => {
  assert.equal(grepLines("(eval):1: no matches found: --include=*.go"), null);
});
