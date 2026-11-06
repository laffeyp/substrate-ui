// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// ESLint flat config. Sprint 062 — the reveal shell lives in TypeScript
// files (web/reveal.ts, web/app/**, web/vm/*); ESLint gives us:
//   1. `id-length` — no cryptic single-letter names outside a small
//      set of idiomatic exceptions (index, coordinate).
//   2. `no-restricted-syntax` — every raw envelope-kind string must
//      go through `EnvelopeKind.*`. The enum is the source of truth;
//      an off-enum literal fails lint.
//
// Kept narrow on purpose. Not turning on `@typescript-eslint/recommended`
// yet; that pulls in a wave of style rules that fight the existing
// codebase. This config lands two rules that catch real bugs.

import tsParser from "@typescript-eslint/parser";

// Sprint 096: the banned literals are every generated envelope kind, read from the generated
// file, so the list can no longer drift from the kernel (it used to be a third hand copy).
import { readFileSync } from "node:fs";
const restrictedKindLiterals = [
  ...readFileSync(new URL("./web/vm/envelope_kinds.gen.ts", import.meta.url), "utf8")
    .matchAll(/^\s+\w+: "([^"]+)",$/gm),
].map((m) => m[1].replace(/[.]/g, "\\."));

export default [
  {
    // Sprint 330: the React areas (.tsx) are linted too; before, the glob read .ts only, so neither
    // rule had checked a component.
    files: ["web/**/*.ts", "web/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
      globals: { window: "readonly", document: "readonly", console: "readonly", performance: "readonly", setTimeout: "readonly", clearTimeout: "readonly", setInterval: "readonly", clearInterval: "readonly", requestAnimationFrame: "readonly", fetch: "readonly", URL: "readonly", URLSearchParams: "readonly", MutationObserver: "readonly", AbortController: "readonly", EventSource: "readonly", HTMLElement: "readonly", HTMLInputElement: "readonly", HTMLDivElement: "readonly", ParentNode: "readonly" },
    },
    rules: {
      "id-length": ["error", {
        min: 2,
        exceptions: ["_", "x", "y", "i", "j", "k", "n", "m", "s", "p", "e", "t", "r", "v", "c", "a", "b", "d", "f", "q", "l"],
        properties: "never",
      }],
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=/^(${restrictedKindLiterals.join("|")})$/]`,
          message: "Use EnvelopeKind.* instead of a raw envelope-kind string. See web/vm/kinds.ts.",
        },
      ],
    },
  },
  {
    ignores: ["node_modules/**", "web/dist/**", "_deprecated/**", "harness/**", "app/**"],
  },
];
