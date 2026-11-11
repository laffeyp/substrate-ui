// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A file's bytes as rows (web/app/derive/bytes.ts, sprint 463). The expected rows are what this machine's
// `hexdump -C`, `xxd -b` and `od -b` print for the same eighteen bytes, written by hand here.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { bytesRow, rowCount, ROW_BYTES } from "../derive/bytes";

const BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x01]);
const slice = (from: number, n: number) => BYTES.subarray(from, from + n);

test("hex reads as hexdump -C prints it, a short last row padded so the text lines up", () => {
  assert.strictEqual(bytesRow("hex", 0, slice(0, 16)), "00000000  89 50 4e 47 0d 0a 1a 0a  00 00 00 0d 49 48 44 52  |.PNG........IHDR|");
  assert.strictEqual(bytesRow("hex", 16, slice(16, 16)), "00000010  00 01                                             |..|");
});

test("binary reads as xxd -b prints it: six bytes of eight 0s and 1s", () => {
  assert.strictEqual(bytesRow("binary", 0, slice(0, 6)), "00000000: 10001001 01010000 01001110 01000111 00001101 00001010  .PNG..");
  assert.strictEqual(bytesRow("binary", 12, slice(12, 6)), "0000000c: 01001001 01001000 01000100 01010010 00000000 00000001  IHDR..");
});

test("octal reads as od -b prints it", () => {
  assert.strictEqual(bytesRow("octal", 0, slice(0, 16)), "0000000   211 120 116 107 015 012 032 012 000 000 000 015 111 110 104 122");
  assert.strictEqual(bytesRow("octal", 16, slice(16, 16)), "0000020   000 001");
});

test("text is the bytes as Latin-1, a control byte as a dot", () => {
  assert.strictEqual(bytesRow("text", 0, new Uint8Array([0x63, 0x61, 0x66, 0xe9, 0x0a, 0x89, 0x7f, 0xff])), "caf\u00e9...\u00ff");
});

test("rows per form, and the count of rows for a size", () => {
  assert.deepStrictEqual(ROW_BYTES, { hex: 16, binary: 6, octal: 16, text: 64 });
  assert.deepStrictEqual([rowCount("hex", 18), rowCount("binary", 18), rowCount("hex", 12 * 1024 * 1024)], [2, 3, 786432]);
});
