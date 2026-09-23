// Sprint 073 — markdown parser unit tests. Behaviour-preserving.
// Every case below mirrors a real transcript the reveal shell has
// rendered without the extraction.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { mdBlocks, mdInlines, renderBlock, renderInline } from "../markdown";

test("mdBlocks: empty string yields no blocks", () => {
  assert.deepStrictEqual(mdBlocks(""), []);
});

test("mdBlocks: single paragraph", () => {
  const out = mdBlocks("hello world");
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].kind, "p");
});

test("mdBlocks: fenced code block with lang", () => {
  const out = mdBlocks("```typescript\nconst x = 1;\nconst y = 2;\n```");
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].kind, "code_block");
  if (out[0].kind === "code_block") {
    assert.strictEqual(out[0].lang, "typescript");
    assert.strictEqual(out[0].text, "const x = 1;\nconst y = 2;");
  }
});

test("mdBlocks: fenced code block without lang", () => {
  const out = mdBlocks("```\nplain code\n```");
  assert.strictEqual(out[0].kind, "code_block");
  if (out[0].kind === "code_block") {
    assert.strictEqual(out[0].lang, "");
    assert.strictEqual(out[0].text, "plain code");
  }
});

test("mdBlocks: unordered list with three items", () => {
  const out = mdBlocks("- one\n- two\n- three");
  assert.strictEqual(out[0].kind, "ul");
  if (out[0].kind === "ul") assert.strictEqual(out[0].items.length, 3);
});

test("mdBlocks: ordered list", () => {
  const out = mdBlocks("1. first\n2. second");
  assert.strictEqual(out[0].kind, "ol");
  if (out[0].kind === "ol") assert.strictEqual(out[0].items.length, 2);
});

test("mdBlocks: heading levels 1-4", () => {
  for (let level = 1; level <= 4; level++) {
    const out = mdBlocks("#".repeat(level) + " title");
    assert.strictEqual(out[0].kind, "heading");
    if (out[0].kind === "heading") assert.strictEqual(out[0].level, level);
  }
});

test("mdBlocks: paragraph then fence then paragraph", () => {
  const out = mdBlocks("intro line\n\n```js\ncode\n```\n\ntrailing");
  assert.strictEqual(out.length, 3);
  assert.strictEqual(out[0].kind, "p");
  assert.strictEqual(out[1].kind, "code_block");
  assert.strictEqual(out[2].kind, "p");
});

test("mdInlines: plain text yields one segment", () => {
  const out = mdInlines("hello");
  assert.deepStrictEqual(out, [{ t: "hello" }]);
});

test("mdInlines: inline code, bold, italic", () => {
  const out = mdInlines("try `foo()` then **bold** and *italic*");
  assert.strictEqual(out.length, 6);
  assert.strictEqual(out[1].t, "foo()");
  assert.strictEqual(out[1].code, true);
  assert.strictEqual(out[3].t, "bold");
  assert.strictEqual(out[3].bold, true);
  assert.strictEqual(out[5].t, "italic");
  assert.strictEqual(out[5].italic, true);
});

test("renderInline: code segment applies mono font + dark bg", () => {
  const styled = renderInline({ t: "x", code: true });
  assert.match(styled.font, /ui-monospace/);
  assert.strictEqual(styled.bg, "#1a1c20");
  assert.strictEqual(styled.br, "3px");
});

test("renderBlock: heading level 1 → 17px", () => {
  const styled = renderBlock({ kind: "heading", level: 1, inlines: [{ t: "H" }] });
  assert.strictEqual(styled.isH, true);
  assert.strictEqual(styled.hSize, "17px");
});

test("renderBlock: heading level 2 → 15px, level 3+ → 13px", () => {
  assert.strictEqual(renderBlock({ kind: "heading", level: 2, inlines: [{ t: "H" }] }).hSize, "15px");
  assert.strictEqual(renderBlock({ kind: "heading", level: 3, inlines: [{ t: "H" }] }).hSize, "13px");
  assert.strictEqual(renderBlock({ kind: "heading", level: 4, inlines: [{ t: "H" }] }).hSize, "13px");
});

test("renderBlock: code block carries lang + text + hasLang", () => {
  const styled = renderBlock({ kind: "code_block", lang: "js", text: "let x = 1" });
  assert.strictEqual(styled.isCode, true);
  assert.strictEqual(styled.lang, "js");
  assert.strictEqual(styled.text, "let x = 1");
  assert.strictEqual(styled.hasLang, true);
});
