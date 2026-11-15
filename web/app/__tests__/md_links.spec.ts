// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Links in a Markdown file (sprint 503).

import { test } from "node:test";
import assert from "node:assert/strict";
import { headingLine, headingSlug, linkAt, linkKind, resolveLink } from "../derive/md_links";

const LINE = "See [the runbook](../RUNBOOK.md#build-and-install) and <https://example.org/a> or https://github.com/x/y.";

test("the link under a column", () => {
  assert.equal(linkAt(LINE, 6), "../RUNBOOK.md#build-and-install");
  assert.equal(linkAt(LINE, LINE.indexOf("RUNBOOK")), "../RUNBOOK.md#build-and-install");
  assert.equal(linkAt(LINE, LINE.indexOf("example")), "https://example.org/a");
  assert.equal(linkAt(LINE, LINE.indexOf("github")), "https://github.com/x/y");
  assert.equal(linkAt(LINE, 1), null);
  assert.equal(linkAt(LINE, LINE.length - 1), null, "the sentence's full stop is not the address's");
  assert.equal(linkAt("[a](b.md)", 2, false), null, "inline links only in Markdown");
  assert.equal(linkAt('[t](docs/a%20b.md "title")', 1), "docs/a%20b.md");
});

test("kinds", () => {
  assert.equal(linkKind("https://x.org"), "external");
  assert.equal(linkKind("mailto:a@b.c"), "external");
  assert.equal(linkKind("#install"), "heading");
  assert.equal(linkKind("docs/a.md#x"), "file");
  assert.equal(linkKind("./a.md"), "file");
});

test("relative paths resolve inside the workspace", () => {
  assert.deepEqual(resolveLink("docs/guide/intro.md", "../RUNBOOK.md#build"), { path: "docs/RUNBOOK.md", anchor: "build" });
  assert.deepEqual(resolveLink("docs/guide/intro.md", "./a%20b.md"), { path: "docs/guide/a b.md", anchor: null });
  assert.deepEqual(resolveLink("docs/intro.md", "/src/app.ts"), { path: "src/app.ts", anchor: null });
  assert.equal(resolveLink("README.md", "../outside.md"), null);
});

test("heading anchors as GitHub writes them", () => {
  assert.equal(headingSlug("Build and install — no Apple"), "build-and-install--no-apple");
  assert.equal(headingSlug("`npm run` *quickly*"), "npm-run-quickly");
  const text = "# Title\n\n## Install\n```\n## Install\n```\n## Install\ntext";
  assert.equal(headingLine(text, "install"), 3);
  assert.equal(headingLine(text, "install-1"), 7, "a heading in fenced code is not one; a repeat takes -1");
  assert.equal(headingLine(text, "missing"), null);
});
