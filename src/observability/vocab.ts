// Emitter guard: the set of tag names ratified in signals/0.1.json v0.1.
//
// V0_1_TAGS is derived from the vocabulary JSON at build time (esbuild
// inlines the imported JSON). The vocabulary lives in one place —
// signals/0.1.json § layer_1_lexical.tags[].name — and this module is a
// mechanical projection. Any tag added or removed there flows through
// automatically at the next build. No hand-maintained mirror. That closes
// the drift class the last review named (feedback-read-the-code-grep-
// repeated-literals): vocabulary as contract, single-sourced.

import signalsV01 from "@/../signals/0.1.json";

interface Layer1Tag { name: string; }
interface SignalsV01 { layer_1_lexical: { tags: Layer1Tag[] }; }

const layer1 = (signalsV01 as unknown as SignalsV01).layer_1_lexical;

export const V0_1_TAGS: ReadonlySet<string> = new Set(layer1.tags.map((t) => t.name));

export function isRatifiedTag(kind: string): boolean {
  return V0_1_TAGS.has(kind);
}
