// view-ids.ts — the closed set of view identifiers for the piece-G two-view
// scaffold. One source of truth for app.ts, capture-grade.ts, and every
// harness that asserts on VIEW_SWITCHED payloads. Import here; do not
// duplicate literals. Companion to web/instrumentation/vocabulary.ts (which
// carries the same discipline for signal tag names).
export const VIEW_IDS = {
  DESKTOP: "desktop",
  TERMINAL: "terminal",
} as const;
export type ViewId = typeof VIEW_IDS[keyof typeof VIEW_IDS];
export const ALL_VIEW_IDS: readonly ViewId[] = [VIEW_IDS.DESKTOP, VIEW_IDS.TERMINAL];
