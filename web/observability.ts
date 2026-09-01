// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// observability.ts — the harness-facing observability seam. Every function
// the Playwright harness reaches through `page.evaluate(() => window.X)`
// lives here. Previously scattered as `(window as any).STATE = STATE;` in
// app.ts; consolidated per REVIEW-2026-08-28 AP6 so the boundary is one
// named surface, not an implicit global bag.
//
// The type declaration doubles as the harness contract: any Playwright
// script may safely read the shape below and no other.
export interface ObservabilitySurface {
  STATE: unknown;
  loadRecords: (...args: unknown[]) => unknown;
  selectRecord: (...args: unknown[]) => unknown;
  loadAssays: (...args: unknown[]) => unknown;
}
export function installObservabilitySurface(surface: ObservabilitySurface): void {
  const w = window as unknown as Record<string, unknown>;
  w.STATE = surface.STATE;
  w.loadRecords = surface.loadRecords;
  w.selectRecord = surface.selectRecord;
  w.loadAssays = surface.loadAssays;
}
