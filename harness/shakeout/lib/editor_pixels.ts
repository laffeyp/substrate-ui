// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor view read from a screenshot of the running window (sprints 411, 413; Addendum A2): the
// pixel anchor the view paints (web/app/derive/anchor.ts), and per 16 px row band of the files tree
// inside its visible box, whether the band holds ink and whether it holds the accent dot (#82a5c8).

import { readFileSync } from "node:fs";
import type { Page } from "playwright";
import { decodePng } from "../../pixel/png";
import { ANCHOR2_CELLS, ANCHOR3_CELLS, ANCHOR_CELL, ANCHOR_CELLS, decodeAnchor, decodeAnchor2, decodeAnchor3, type Anchor, type Anchor2, type Anchor3 } from "../../../web/app/derive/anchor";

const ROW = 16;

/** `anchor2`: the second row, one cell above the first (sprint 422); an error when it is not painted. */
/** `anchor3`: the third row, above the second (sprint 424). */
export interface Pixels { anchor: Anchor | { error: string }; anchor2: Anchor2 | { error: string }; anchor3: Anchor3 | { error: string }; inked: number; fit: number; dotted: number }

export async function readPixels(win: Page, file: string, rows: number): Promise<Pixels> {
  const layout = () => win.evaluate(() => {
    const v = document.querySelector("[data-editor-view]")!.getBoundingClientRect();
    // A folded files column has no tree: its box reads empty and no row band is checked.
    const t = document.querySelector("[data-editor-tree]")?.getBoundingClientRect() ?? { left: 0, top: 0, width: 0, height: 0 };
    const first = document.querySelector("[data-tree-row]")?.getBoundingClientRect() ?? null;
    return { dpr: window.devicePixelRatio, v: { left: v.left, bottom: v.bottom }, t: { left: t.left, top: t.top, width: t.width, height: t.height }, firstTop: first ? first.top : null };
  });
  // The layout read before and after the screenshot must agree, or the picture is of another frame.
  let geo = await layout();
  for (;;) {
    await win.screenshot({ path: file });
    const after = await layout();
    if (JSON.stringify(after) === JSON.stringify(geo)) break;
    geo = after;
  }
  const img = decodePng(readFileSync(file));
  const px = (x: number, y: number) => { const i = (Math.round(y) * img.width + Math.round(x)) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2]]; };
  // The anchor: cell centres along the view's bottom-left edge; the two calibration cells say what 0 and 1 look like.
  const y = (geo.v.bottom - ANCHOR_CELL / 2) * geo.dpr;
  const blue = Array.from({ length: ANCHOR_CELLS }, (_, i) => px((geo.v.left + (i + 0.5) * ANCHOR_CELL) * geo.dpr, y)[2]);
  let anchor: Anchor | { error: string };
  if (blue[1] - blue[0] < 2) anchor = { error: `calibration cells read blue ${blue[0]} and ${blue[1]}: the strip is not legible` };
  else { const mid = (blue[0] + blue[1]) / 2; anchor = decodeAnchor(blue.map((b) => (b > mid ? 1 : 0))); }
  const y2 = (geo.v.bottom - ANCHOR_CELL * 1.5) * geo.dpr;
  const blue2 = Array.from({ length: ANCHOR2_CELLS }, (_, i) => px((geo.v.left + (i + 0.5) * ANCHOR_CELL) * geo.dpr, y2)[2]);
  let anchor2: Anchor2 | { error: string };
  if (blue2[1] - blue2[0] < 2) anchor2 = { error: `second row's calibration cells read blue ${blue2[0]} and ${blue2[1]}` };
  else { const mid = (blue2[0] + blue2[1]) / 2; anchor2 = decodeAnchor2(blue2.map((b) => (b > mid ? 1 : 0))); }
  const y3 = (geo.v.bottom - ANCHOR_CELL * 2.5) * geo.dpr;
  const blue3 = Array.from({ length: ANCHOR3_CELLS }, (_, i) => px((geo.v.left + (i + 0.5) * ANCHOR_CELL) * geo.dpr, y3)[2]);
  let anchor3: Anchor3 | { error: string };
  if (blue3[1] - blue3[0] < 2) anchor3 = { error: `third row's calibration cells read blue ${blue3[0]} and ${blue3[1]}` };
  else { const mid = (blue3[0] + blue3[1]) / 2; anchor3 = decodeAnchor3(blue3.map((b) => (b > mid ? 1 : 0))); }
  // The tree: each 16 px row band wholly inside the tree's visible box that a row occupies (row index
  // below `rows`), inked if any pixel is far brighter than the surface.
  let inked = 0, fit = 0, dotted = 0;
  if (geo.firstTop !== null) {
    for (let i = 0; i < rows; i++) {
      const top = geo.firstTop + i * ROW;
      if (top < geo.t.top || top + ROW > geo.t.top + geo.t.height) continue;
      fit++;
      let ink = false;
      for (let yy = top + 3; yy < top + ROW - 3 && !ink; yy++) for (let xx = geo.t.left + 4; xx < geo.t.left + geo.t.width - 4; xx += 0.5) {
        const [r, g, b] = px(xx * geo.dpr, yy * geo.dpr);
        if ((r + g + b) / 3 > 90) { ink = true; break; }
      }
      if (ink) inked++;
      // The dot: an accent pixel in the band (D7's one UI accent; nothing else in the tree draws it).
      let dot = false;
      for (let yy = top + 4; yy < top + ROW - 4 && !dot; yy++) for (let xx = geo.t.left + 4; xx < geo.t.left + geo.t.width - 4; xx += 0.5) {
        const [r, g, b] = px(xx * geo.dpr, yy * geo.dpr);
        if (Math.abs(r - 0x82) < 14 && Math.abs(g - 0xa5) < 14 && Math.abs(b - 0xc8) < 14) { dot = true; break; }
      }
      if (dot) dotted++;
    }
  }
  return { anchor, anchor2, anchor3, inked, fit, dotted };
}

