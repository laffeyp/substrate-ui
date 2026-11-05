// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Text that differs from one run of the app to the next, and the fixed stand-in the pixel capture
// writes in its place before each screenshot (sprints 192, 198, 199; plan PLAN-2026-11-04-shell-to-react-r4.md).
//
// Sprints 192-199 masked these values with boxes drawn over them. Each fix to the boxes (clip to scroll
// areas, cover only the characters, skip text under an opaque layer, keep text under a dialog's
// backdrop, fix the box's width) left a case where the box still moved with the value: a value that
// changes length changes its box, and a `t+` time overflows its 50px column. The capture now replaces
// each value in the page's text with a stand-in of fixed text, so the screen draws the same characters
// in the same place on every run, and the layout around them is compared as drawn. React leaves a text
// node alone while its computed value is unchanged, so a redraw keeps the stand-in until the value
// itself changes.

export interface VolatileText {
  name: string;
  /** A regular expression source, passed into the page as a string; matched globally. */
  source: string;
  /** The fixed text written in place of each match. */
  stand: string;
}

// Order matters: a value is replaced by the first pattern that matches it.
export const VOLATILE_TEXT: readonly VolatileText[] = [
  // The stream's time column and the inspector's time line: `t+143ms`, `t+2.31s`, `t+2m05s`.
  { name: "elapsed", source: String.raw`\bt\+\d+(\.\d+)?(ms|s|m\d{2}s|h\d{2}m|d\d{2}h|mo\d{2}d)?`, stand: "t+··" },
  // The records page's relative times: `0.5s ago`, `12s ago`, `3d ago`.
  { name: "relative time", source: String.raw`\b\d+(\.\d+)?(s|m|h|d|w) ago\b`, stand: "·· ago" },
  // The deterministic driver's reply digest: 12 hex digits of a SHA-256 over the seed and the whole
  // prompt (substrate adapters/models.py:113-117); the prompt carries the session's environment.
  { name: "reply digest", source: String.raw`(?<=stub\[\d+\]:)[0-9a-f]{12}\b`, stand: "············" },
  // Session ids: `s_` and hex, whole or cut to 8-12 characters.
  { name: "session id", source: String.raw`\bs_[0-9a-f]{4,}`, stand: "s_····" },
  // Record instance ids: 26-character ULIDs, in the inspector's payload.
  { name: "ulid", source: String.raw`\b[0-9A-HJKMNP-TV-Z]{26}\b`, stand: "ULID" },
  // Per-launch temp folders.
  { name: "temp path", source: String.raw`(/private)?/var/folders/\S+|/tmp/\S+|electron-shakeout-[A-Za-z0-9]+`, stand: "/tmp/·" },
  // The activity line's durations and ticking seconds: `3s`, `1.38s`, `2m05s`, `143ms`.
  { name: "duration", source: String.raw`\b\d+(\.\d+)?(ms|s)\b|\b\d+m\d{2}s\b`, stand: "·s" },
];

/** Run in the page: replace every match of each pattern in the page's text nodes with its stand-in.
 * Returns how many values were replaced. */
export function normalizeVolatileText(patterns: readonly { source: string; stand: string }[]): number {
  let replaced = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node as Text);
  for (const node of nodes) {
    let text = node.data;
    for (const p of patterns) {
      text = text.replace(new RegExp(p.source, "g"), () => { replaced += 1; return p.stand; });
    }
    if (text !== node.data) node.data = text;
  }
  return replaced;
}
