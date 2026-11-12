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
  /** The code's syntax colours (`editor/Centre.tsx` builds its HighlightStyle from them). */
  syntax: Syntax;
}

/** The colour of each class of token the code draws (sprint 475's classes). */
export interface Syntax {
  comment: string; keyword: string; string: string; number: string; type: string; name: string; property: string; meta: string; punctuation: string;
}

/** Sprint 475's palette, as drawn before sprint 481. */
const SYNTAX_475: Syntax = { comment: "#62676f", keyword: "#82a5c8", string: "#b7a4d8", number: "#cc8fb8", type: "#a9c0d8", name: "#e8eaee", property: "#b9bec5", meta: "#9c8fc4", punctuation: "#8a9099" };
/** Sprint 481 (E20; RESEARCH-2026-11-11-colour-spacing-wrap-r2): the same notes, each moved 1.2–4.6 ΔE2000 so every pair of
 *  coloured classes is at least 10.7 apart (string and meta were 7.0, keyword and type 8.8), hues 263°–335° in the key, each
 *  colour's chroma kept within 3, keyword, number and string on lightness steps (L* 65.6, 69.3, 74.7). */
const SYNTAX_481: Syntax = { ...SYNTAX_475, keyword: "#7da3ca", type: "#b0bbd2", string: "#c7ade6", number: "#d496c3", meta: "#948dc5" };

/** The transcript's colours as CSS variables, set on each transcript container; the rows read them (the transcript does
 *  not import the app). */
export function transcriptVars(v: LookValues): Record<string, string> {
  return { "--transcript-reply": v.replyColor, "--transcript-message": v.messageColor };
}

/** The code's colour scheme (sprint 485): `colour`, the look's palette; `ghost`, the same notes in whites and greys
 *  (the Architect, 2026-11-11: "all whites and grays"). */
export type Scheme = "colour" | "ghost";
export const SCHEMES: readonly Scheme[] = ["colour", "ghost"];
/** Sprint 485 (E24; RESEARCH-2026-11-11-colour-spacing-wrap-r2): the key with the colour taken out. Each class a grey
 *  tinted to the palette's blue (LCh hue 263–272°, chroma 2.4–2.9, as the existing greys' 2.2–2.3), told apart by
 *  lightness alone, 5 L* apart in the notes' order: name 92.7, text 86.9, property 82, type 77, string 72, number 67,
 *  keyword 62, meta 57, punctuation 52; comments stay at 43.4, italic. */
export const SYNTAX_GHOST: Syntax = { comment: "#62676f", keyword: "#93969a", string: "#aeb1b5", number: "#a0a3a7", type: "#bbbec3", name: "#e8eaee", property: "#c9ccd0", meta: "#86898d", punctuation: "#7a7c80" };

export const LOOK: Record<Look, LookValues> = {
  // As drawn before sprint 477 (git e804ee3^).
  original: { paneLineHeight: 2, metaLineHeight: 1.95, terminalLineHeight: 1.7, codeLineHeight: 23, replyColor: "#b9bec5", messageColor: "#e2e5e9", syntax: SYNTAX_475 },
  // Sprint 477 (E16): the transcript at 20 px on 13 px; sprint 479 (E18): the code at 20 px (RESEARCH-2026-11-11-colour-spacing-wrap).
  // The reply's and message's colours stay as they were: sprint 479 made the reply brighter, and the Architect reverted it
  // ("this is actually too bright … everything was perfect", 2026-11-11).
  new: { paneLineHeight: 1.54, metaLineHeight: 1.54, terminalLineHeight: 1.54, codeLineHeight: 20, replyColor: "#b9bec5", messageColor: "#e2e5e9", syntax: SYNTAX_481 },
};
