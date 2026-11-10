// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor view's pixel anchor (sprint 411; sdd-kit-3 TECHNIQUES §2 "deterministic pixel anchors",
// Addendum A2, B1). The view paints its last EDITOR_DRAWN record into a strip of cells at its
// bottom-left corner: the record's proc_seq and its fields, in colours a step off the column's surface.
// A gate decodes the strip from a screenshot of the running window and checks three readings of one
// moment against each other: the pixels (what the screen shows), the record in window-1.jsonl with that
// proc_seq (what the app says it drew), and the folder on disk (what is true).
//
// Cells, in order, each one bit: two calibration cells (0 then 1), then each field least significant
// bit first. A 0 is the sunk surface #1a1c20; a 1 is four steps bluer, #1a1c24.

export const ANCHOR_CELL = 3;
export const ANCHOR_ZERO = "#1a1c20";
export const ANCHOR_ONE = "#1a1c24";
export const ANCHOR_MAGIC = 0xb4;

export interface Anchor {
  /** The proc_seq of the EDITOR_DRAWN record the strip paints. */
  seq: number;
  tree_rows: number;
  modified_dots: number;
  left_folded: boolean;
  right_folded: boolean;
  bottom_folded: boolean;
  dock_right: boolean;
  sides_swapped: boolean;
  focus: boolean;
}

const FIELDS: [keyof Anchor | "magic" | "check", number][] = [
  ["magic", 8], ["seq", 20], ["tree_rows", 16], ["modified_dots", 12],
  ["left_folded", 1], ["right_folded", 1], ["bottom_folded", 1], ["dock_right", 1], ["sides_swapped", 1], ["focus", 1],
  ["check", 8],
];

/** Cells in the strip, calibration included. */
export const ANCHOR_CELLS = 2 + FIELDS.reduce((n, [, width]) => n + width, 0);

const num = (v: number | boolean): number => (typeof v === "boolean" ? (v ? 1 : 0) : v);

/** CRC-8, polynomial 0x07, over the payload's bits in strip order: any one flipped cell changes it
 *  (a summed checksum did not: bit 10 of seq adds 1024, which is 0 mod 256). */
function checksum(a: Anchor): number {
  let crc = 0;
  for (const [k, width] of FIELDS) {
    if (k === "magic" || k === "check") continue;
    const v = num(a[k as keyof Anchor]);
    for (let i = 0; i < width; i++) {
      const bit = (v >> i) & 1;
      const top = (crc >> 7) & 1;
      crc = (crc << 1) & 0xff;
      if (top ^ bit) crc ^= 0x07;
    }
  }
  return crc;
}

/** The strip's bits, calibration first. */
export function encodeAnchor(a: Anchor): number[] {
  const bits = [0, 1];
  for (const [k, width] of FIELDS) {
    const v = k === "magic" ? ANCHOR_MAGIC : k === "check" ? checksum(a) : num(a[k as keyof Anchor]);
    if (v < 0 || v >= 2 ** width) throw new Error(`anchor: ${k}=${v} does not fit ${width} bits`);
    for (let i = 0; i < width; i++) bits.push((v >> i) & 1);
  }
  return bits;
}

/** The anchor the bits carry, or the reason they carry none: the magic or the checksum does not match. */
export function decodeAnchor(bits: readonly number[]): Anchor | { error: string } {
  if (bits.length !== ANCHOR_CELLS) return { error: `${bits.length} cells, expected ${ANCHOR_CELLS}` };
  let at = 2;
  const out: Record<string, number> = {};
  for (const [k, width] of FIELDS) {
    let v = 0;
    for (let i = 0; i < width; i++) v |= bits[at + i] << i;
    out[k] = v;
    at += width;
  }
  if (out.magic !== ANCHOR_MAGIC) return { error: `magic ${out.magic}, expected ${ANCHOR_MAGIC}` };
  const a: Anchor = {
    seq: out.seq, tree_rows: out.tree_rows, modified_dots: out.modified_dots,
    left_folded: !!out.left_folded, right_folded: !!out.right_folded, bottom_folded: !!out.bottom_folded,
    dock_right: !!out.dock_right, sides_swapped: !!out.sides_swapped, focus: !!out.focus,
  };
  if (out.check !== checksum(a)) return { error: `checksum ${out.check}, expected ${checksum(a)}` };
  return a;
}

// Sprint 422: the anchor's second row (roadmap r8, "the anchor's room"), stacked above the first, carrying
// what the centre and the inspector draw: the tab count and the inspector sections' rows (vocabulary v0.32).
// Its own magic; the same proc_seq as the first row, naming the same EDITOR_DRAWN.
export const ANCHOR2_MAGIC = 0xb5;
export interface Anchor2 { seq: number; tab_count: number; outline_rows: number; hunks: number; activity_rows: number; history_rows: number }
const FIELDS2: [keyof Anchor2 | "magic" | "check", number][] = [
  ["magic", 8], ["seq", 20], ["tab_count", 8], ["outline_rows", 12], ["hunks", 10], ["activity_rows", 12], ["history_rows", 12], ["check", 8],
];
export const ANCHOR2_CELLS = 2 + FIELDS2.reduce((n, [, width]) => n + width, 0);

function crc2(a: Anchor2): number {
  let crc = 0;
  for (const [k, width] of FIELDS2) {
    if (k === "magic" || k === "check") continue;
    const v = a[k as keyof Anchor2];
    for (let i = 0; i < width; i++) { const top = (crc >> 7) & 1; crc = (crc << 1) & 0xff; if (top ^ ((v >> i) & 1)) crc ^= 0x07; }
  }
  return crc;
}

export function encodeAnchor2(a: Anchor2): number[] {
  const bits = [0, 1];
  for (const [k, width] of FIELDS2) {
    const v = k === "magic" ? ANCHOR2_MAGIC : k === "check" ? crc2(a) : a[k as keyof Anchor2];
    if (v < 0 || v >= 2 ** width) throw new Error(`anchor row 2: ${k}=${v} does not fit ${width} bits`);
    for (let i = 0; i < width; i++) bits.push((v >> i) & 1);
  }
  return bits;
}

export function decodeAnchor2(bits: readonly number[]): Anchor2 | { error: string } {
  if (bits.length !== ANCHOR2_CELLS) return { error: `${bits.length} cells, expected ${ANCHOR2_CELLS}` };
  let at = 2;
  const out: Record<string, number> = {};
  for (const [k, width] of FIELDS2) { let v = 0; for (let i = 0; i < width; i++) v |= bits[at + i] << i; out[k] = v; at += width; }
  if (out.magic !== ANCHOR2_MAGIC) return { error: `magic ${out.magic}, expected ${ANCHOR2_MAGIC}` };
  const a: Anchor2 = { seq: out.seq, tab_count: out.tab_count, outline_rows: out.outline_rows, hunks: out.hunks, activity_rows: out.activity_rows, history_rows: out.history_rows };
  if (out.check !== crc2(a)) return { error: `checksum ${out.check}, expected ${crc2(a)}` };
  return a;
}

// Sprint 424: the third row, above the second: the buffer's state the status line and the centre draw
// (vocabulary v0.33): the vim mode, the binding, read-only, and the count of unsaved buffers. Sprint 425
// (v0.34) adds the stale-save offer's bit; the layout changed, so the magic did (0xB6 to 0xB7). Sprint 427
// (v0.36): the binding takes two bits (standard, vim, nano) and the read-only bit goes (0xB8). Sprint 430
// (v0.38): the meta pane open in the editor's right column takes a bit (0xB9). Sprint 431 (v0.40): the
// session's edits marked and not yet resolved take four bits, 15 meaning 15 or more (0xBA).
export const ANCHOR3_MAGIC = 0xba;
export const ANCHOR3_BINDINGS = ["standard", "vim", "nano"] as const;
export const ANCHOR3_MODES = ["none", "normal", "insert", "visual", "replace"] as const;
export interface Anchor3 { seq: number; mode: typeof ANCHOR3_MODES[number]; binding: typeof ANCHOR3_BINDINGS[number]; unsaved: number; conflict: boolean; meta: boolean; follow_marks: number }
const FIELDS3: [string, number][] = [["magic", 8], ["seq", 20], ["mode", 3], ["binding", 2], ["unsaved", 8], ["conflict", 1], ["meta", 1], ["follow_marks", 4], ["check", 8]];
export const ANCHOR3_CELLS = 2 + FIELDS3.reduce((n, [, width]) => n + width, 0);

function values3(a: Anchor3): Record<string, number> {
  return { seq: a.seq, mode: ANCHOR3_MODES.indexOf(a.mode), binding: ANCHOR3_BINDINGS.indexOf(a.binding), unsaved: a.unsaved, conflict: a.conflict ? 1 : 0, meta: a.meta ? 1 : 0, follow_marks: a.follow_marks };
}
function crc3(v: Record<string, number>): number {
  let crc = 0;
  for (const [k, width] of FIELDS3) {
    if (k === "magic" || k === "check") continue;
    for (let i = 0; i < width; i++) { const top = (crc >> 7) & 1; crc = (crc << 1) & 0xff; if (top ^ ((v[k] >> i) & 1)) crc ^= 0x07; }
  }
  return crc;
}

export function encodeAnchor3(a: Anchor3): number[] {
  const v = values3(a);
  const bits = [0, 1];
  for (const [k, width] of FIELDS3) {
    const x = k === "magic" ? ANCHOR3_MAGIC : k === "check" ? crc3(v) : v[k];
    if (x < 0 || x >= 2 ** width) throw new Error(`anchor row 3: ${k}=${x} does not fit ${width} bits`);
    for (let i = 0; i < width; i++) bits.push((x >> i) & 1);
  }
  return bits;
}

export function decodeAnchor3(bits: readonly number[]): Anchor3 | { error: string } {
  if (bits.length !== ANCHOR3_CELLS) return { error: `${bits.length} cells, expected ${ANCHOR3_CELLS}` };
  let at = 2;
  const v: Record<string, number> = {};
  for (const [k, width] of FIELDS3) { let x = 0; for (let i = 0; i < width; i++) x |= bits[at + i] << i; v[k] = x; at += width; }
  if (v.magic !== ANCHOR3_MAGIC) return { error: `magic ${v.magic}, expected ${ANCHOR3_MAGIC}` };
  if (v.check !== crc3(v)) return { error: `checksum ${v.check}, expected ${crc3(v)}` };
  if (v.mode >= ANCHOR3_MODES.length) return { error: `mode ${v.mode} names no mode` };
  if (v.binding >= ANCHOR3_BINDINGS.length) return { error: `binding ${v.binding} names no binding` };
  return { seq: v.seq, mode: ANCHOR3_MODES[v.mode], binding: ANCHOR3_BINDINGS[v.binding], unsaved: v.unsaved, conflict: !!v.conflict, meta: !!v.meta, follow_marks: v.follow_marks };
}
