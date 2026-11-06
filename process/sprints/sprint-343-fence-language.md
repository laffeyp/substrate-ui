---
id: 343
status: closed
phase: shell-to-react F8
pass_kind: functional
---

# Sprint 343 — code fences with `c++`, `objective-c`, `shell-session`; a hang in the parser (F358)

## scope

Two fixes in `web/reveal/markdown.ts`. The fence's language accepts any run of characters but spaces and backticks, where `\w*` refused `c++`, `objective-c` and `shell-session`. Found with it: a line that starts with ``` and matches no fence (`` ```c++ `` before this sprint, `` ```js title=x `` still) made the paragraph loop stop on it without taking it, push an empty paragraph, and run again on the same line for ever, so the parser hung. F358 said such a block rendered as a paragraph with its backticks; it hung. Such a line is now the paragraph's first line, which is the rendering F358 described.

## artifact contract

- Modified: `web/reveal/markdown.ts`, `web/reveal/__tests__/markdown.spec.ts`. `npm run test:unit` 0.

## result

Closed 2026-11-05. The pushed parser, guarded at 1,000 blocks, threw on the three-line input "```c++ / int x; / ```". The first draft of the spec hung the spec file (5.4 s, the whole file failed), which is how the hang was found.

## Rubber Duck pass

No signals.
