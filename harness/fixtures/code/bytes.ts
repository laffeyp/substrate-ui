// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A file's bytes as rows, in four forms (sprint 463; roadmap r13 E14; RESEARCH-2026-11-11-binary-files-and-highlighting).
// Each form follows the tool people read bytes with, as this machine prints the same bytes:
//   hex     `hexdump -C`: "00000000  89 50 4e 47 0d 0a 1a 0a  00 00 00 0d 49 48 44 52  |.PNG........IHDR|"
//   binary  `xxd -b`:     "00000000: 10001001 01010000 01001110 01000111 00001101 00001010  .PNG.."
//   octal   `od -b`:      "0000000   211 120 116 107 015 012 032 012 000 000 000 015 111 110 104 122"
//   text    the bytes as Latin-1, sixty-four a row, a dot for each control byte.
// Pure: no I/O, no state.

export const BYTES_FORMS = ["hex", "binary", "octal", "text"] as const;
export type BytesForm = (typeof BYTES_FORMS)[number];

/** Bytes in one row of each form: hexdump -C's sixteen, xxd -b's six, od -b's sixteen, and sixty-four of text. */
export const ROW_BYTES: Record<BytesForm, number> = { hex: 16, binary: 6, octal: 16, text: 64 };

/** A byte as hexdump -C and xxd show it in their text column: printable ASCII, else a dot. */
const shown = (b: number): string => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : ".");
/** A byte as Latin-1, every byte one character; a control byte (below 0x20, 0x7f to 0x9f) as a dot. */
const latin1 = (b: number): string => (b < 0x20 || (b >= 0x7f && b <= 0x9f) ? "." : String.fromCharCode(b));
const hex2 = (b: number): string => b.toString(16).padStart(2, "0");

/** One row of `form` for the bytes at `offset` (at most ROW_BYTES[form] of them; a short last row is padded as the
 *  tools pad it, so the text column lines up). */
export function bytesRow(form: BytesForm, offset: number, bytes: Uint8Array): string {
  const all = Array.from(bytes);
  if (form === "hex") {
    const cells = Array.from({ length: 16 }, (_, k) => (k < all.length ? hex2(all[k]) : "  "));
    const body = `${cells.slice(0, 8).join(" ")}  ${cells.slice(8).join(" ")}`;
    return `${offset.toString(16).padStart(8, "0")}  ${body}  |${all.map(shown).join("")}|`;
  }
  if (form === "binary") {
    const cells = Array.from({ length: 6 }, (_, k) => (k < all.length ? all[k].toString(2).padStart(8, "0") : "        "));
    return `${offset.toString(16).padStart(8, "0")}: ${cells.join(" ")}  ${all.map(shown).join("")}`;
  }
  if (form === "octal") return `${offset.toString(8).padStart(7, "0")}   ${all.map((b) => b.toString(8).padStart(3, "0")).join(" ")}`;
  return all.map(latin1).join("");
}

/** How many rows `size` bytes make in `form`. */
export const rowCount = (form: BytesForm, size: number): number => Math.ceil(size / ROW_BYTES[form]);

/** Sprint 468 (roadmap r13 E14; the Architect, 2026-11-11: every file editable by hand): the forms whose digits are
 *  typed over, and each byte's digits there (two hex, eight binary, three octal). */
export const DIGIT_FORMS = ["hex", "binary", "octal"] as const;
export type DigitForm = (typeof DIGIT_FORMS)[number];
export const DIGITS: Record<DigitForm, number> = { hex: 2, binary: 8, octal: 3 };
const RADIX: Record<DigitForm, number> = { hex: 16, binary: 2, octal: 8 };
export const isDigitForm = (form: string): form is DigitForm => (DIGIT_FORMS as readonly string[]).includes(form);

/** Where digit `d` of the row's byte `k` sits in `bytesRow`'s text: every form's first cell starts at column 10
 *  (hexdump -C's eight-digit offset and two spaces, xxd -b's offset, colon and space, od -b's seven digits and three
 *  spaces); a hex cell takes three columns, with one more after the eighth byte, a binary nine, an octal four. */
export function digitColumn(form: DigitForm, k: number, d: number): number {
  if (form === "hex") return 10 + k * 3 + (k >= 8 ? 1 : 0) + d;
  return 10 + k * (form === "binary" ? 9 : 4) + d;
}

/** The byte after `ch` is typed over its digit `d` in `form`, or null when `ch` is no digit of the form or the
 *  result is over 255 (an octal byte's first digit is 0 to 3). */
export function typeDigit(form: DigitForm, byte: number, d: number, ch: string): number | null {
  const radix = RADIX[form];
  if (ch.length !== 1 || Number.isNaN(parseInt(ch, radix))) return null;
  const digits = byte.toString(radix).padStart(DIGITS[form], "0").split("");
  digits[d] = ch.toLowerCase();
  const out = parseInt(digits.join(""), radix);
  return out > 255 ? null : out;
}
