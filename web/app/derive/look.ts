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
}

export const LOOK: Record<Look, LookValues> = {
  // As drawn before sprint 477 (git e804ee3^).
  original: { paneLineHeight: 2, metaLineHeight: 1.95, terminalLineHeight: 1.7 },
  // Sprint 477 (E16): 20 px at 13 px, RESEARCH-2026-11-11-colour-spacing-wrap.
  new: { paneLineHeight: 1.54, metaLineHeight: 1.54, terminalLineHeight: 1.54 },
};
