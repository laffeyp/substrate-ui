// Shared enum constants for the reveal shell + the SessionController.
// Sprint 059 (types) + 062 (lint) — one source of truth for every
// envelope kind, transcript role, surface, mode, level, and direction
// the shell reads. A raw literal outside this file trips the ESLint
// `no-restricted-syntax` rule.
//
// `as const` gives each object a narrow string-literal type. Consumers
// spell the strings once at declaration; every reference elsewhere is
// `EnvelopeKind.UserMessage`, greppable and refactor-safe.

/* eslint-disable no-restricted-syntax */

export const EnvelopeKind = {
  UserMessage: "UserMessage",
  ModelReply: "ModelReply",
  ToolCall: "ToolCall",
  ToolResult: "ToolResult",
  Park: "Park",
  SessionStarted: "SessionStarted",
  SessionEnded: "SessionEnded",
  ProducerFailed: "ProducerFailed",
  PromptFragment: "PromptFragment",
  RunFinalised: "RunFinalised",
} as const;

export type EnvelopeKindValue = typeof EnvelopeKind[keyof typeof EnvelopeKind];

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
