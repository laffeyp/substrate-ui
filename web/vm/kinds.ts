// Shared enum constants for the reveal shell + the SessionController.
// Sprint 059 (types) + 062 (lint) — one source of truth for every
// envelope kind, transcript role, surface, mode, level, and direction
// the shell reads. A raw literal outside this file trips the ESLint
// `no-restricted-syntax` rule.
//
// `as const` gives each object a narrow string-literal type. Consumers
// spell the strings once at declaration; every reference elsewhere is
// `EnvelopeKind.UserMessage`, greppable and refactor-safe.

// Envelope kinds are GENERATED from the kernel (Sprint 096, scripts/gen_kinds.py): the
// hand-kept copy that used to live here drifted (`"RunFinalised"` vs the kernel's
// `"substrate.RunFinalised"`, Sep 23 to Oct 1). Edit the kernel, then regenerate.
export { EnvelopeKind } from "./envelope_kinds.gen";
export type { EnvelopeKindValue } from "./envelope_kinds.gen";

export const TranscriptRole = {
  User: "user",
  Model: "model",
  Tool: "tool",
  Park: "park",
  Ended: "ended",
  Warning: "warning",
} as const;

export type TranscriptRoleValue = typeof TranscriptRole[keyof typeof TranscriptRole];

export const Surface = {
  Records: "records",
  Assay: "assay",
  Studio: "studio",
} as const;

export const GraphMode = {
  Stream: "stream",
  Scene: "scene",
  Structure: "structure",
  IO: "io",
} as const;

export const RevealLevel = {
  All: "all",
  App: "app",
} as const;

export const GraphDirection = {
  Down: "down",
  Side: "side",
} as const;
