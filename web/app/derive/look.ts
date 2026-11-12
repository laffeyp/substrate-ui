// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The two looks (sprint 478, roadmap r16 E17; the Architect, 2026-11-11: the look before these changes kept "so we can
// judge these things against each other"). `original` holds every appearance value as it was drawn before sprint 477;
// `new` holds the values the appearance work sets. Each appearance change adds its value here, the original beside it,
// and its component reads the table for the look the viewer picked in Settings.

export type Look = "new" | "original";
export const LOOKS: readonly Look[] = ["new", "original"];

export interface LookValues {
  /** The transcript's line height in the pane (`PanesView.tsx`). */
  paneLineHeight: number;
  /** The transcript's line height in meta (`App.tsx`). */
  metaLineHeight: number;
  /** The transcript's line height in the editor's terminal (`editor/EditorView.tsx`). */
  terminalLineHeight: number;
  /** The code editor's line height in px (`editor/Centre.tsx`, `.cm-scroller`). */
  codeLineHeight: number;
  /** The model's reply in the transcript (`--transcript-reply`, read by `reveal/transcript/Row.tsx`). */
  replyColor: string;
  /** The person's message in the transcript (`--transcript-message`). */
  messageColor: string;
}

/** The transcript's colours as CSS variables, set on each transcript container; the rows read them (the transcript does
 *  not import the app). */
export function transcriptVars(v: LookValues): Record<string, string> {
  return { "--transcript-reply": v.replyColor, "--transcript-message": v.messageColor };
}

export const LOOK: Record<Look, LookValues> = {
  // As drawn before sprint 477 (git e804ee3^).
  original: { paneLineHeight: 2, metaLineHeight: 1.95, terminalLineHeight: 1.7, codeLineHeight: 23, replyColor: "#b9bec5", messageColor: "#e2e5e9" },
  // Sprint 477 (E16): the transcript at 20 px on 13 px; sprint 479 (E18): the code at 20 px (RESEARCH-2026-11-11-colour-spacing-wrap).
  // The reply's and message's colours stay as they were: sprint 479 made the reply brighter, and the Architect reverted it
  // ("this is actually too bright … everything was perfect", 2026-11-11).
  new: { paneLineHeight: 1.54, metaLineHeight: 1.54, terminalLineHeight: 1.54, codeLineHeight: 20, replyColor: "#b9bec5", messageColor: "#e2e5e9" },
};
