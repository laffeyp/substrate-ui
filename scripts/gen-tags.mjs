// scripts/gen-tags.mjs — regenerate src/observability/tags.ts from
// signals/0.1.json § layer_1_lexical.tags.
//
// The reducer emits signals as { kind: Tag.X, payload: {...} }. Tag is
// a typed const object — TypeScript sees Tag.DELEGATE_CALL_FOLDED as
// the literal string "DELEGATE_CALL_FOLDED", and a typo like Tag.FOLD
// fails the compile. The values live in Layer 1; this codegen copies
// them into a TS file at build time so a Layer 1 rename requires
// running this script and getting a fresh tags.ts diff for review.
//
// Runs as part of `npm run build` (see package.json).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");
const signals = JSON.parse(readFileSync(resolve(REPO, "signals/0.1.json"), "utf8"));
const names = signals.layer_1_lexical.tags.map((t) => t.name).sort();

const body = names.map((n) => `  ${n}: "${n}",`).join("\n");
const out = `// src/observability/tags.ts — GENERATED from signals/0.1.json §
// layer_1_lexical.tags. Do not edit by hand; run \`npm run gen:tags\`
// after a vocabulary change and review the diff.
//
// Every reducer emission goes through Tag.X — TypeScript type-checks
// each emit against Layer 1's exact tag names, and a Layer 1 rename
// forces the caller to re-run this script to compile.

export const Tag = {
${body}
} as const;

export type TagName = typeof Tag[keyof typeof Tag];

// Runtime sanity — the imported JSON's tag count must match this
// generated map. A mismatch here means the JSON has been edited
// without regenerating; fail at load rather than emit a phantom tag.
import signalsV01 from "@/../signals/0.1.json";
const layer1Count = (signalsV01 as { layer_1_lexical: { tags: unknown[] } })
  .layer_1_lexical.tags.length;
if (Object.keys(Tag).length !== layer1Count) {
  throw new Error(
    \`tags.ts drift — \${Object.keys(Tag).length} entries vs Layer 1's \${layer1Count}; \` +
    \`run npm run gen:tags\`,
  );
}
`;

writeFileSync(resolve(REPO, "src/observability/tags.ts"), out);
console.log(`gen-tags: wrote ${names.length} tags to src/observability/tags.ts`);
