// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// PNG reading and writing for the pixel gate (sprint 193), with Node's zlib and nothing else, as the
// kit's Addendum A2 decodes PNGs. Reads what Playwright's screenshots write: 8-bit, non-interlaced,
// colour type 6 (RGBA) or 2 (RGB), scanline filters 0-4 (PNG spec, ISO/IEC 15948, sections 9 and 11).
// Anything else throws, naming the field.

import { Buffer } from "node:buffer";
import { crc32, deflateSync, inflateSync } from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface Image {
  width: number;
  height: number;
  /** 8-bit RGBA, row by row, `width * height * 4` bytes. */
  data: Uint8Array;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

export function decodePng(buf: Buffer): Image {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(SIGNATURE)) throw new Error("png: not a PNG (bad signature)");
  let width = 0, height = 0, colourType = -1;
  const idat: Buffer[] = [];
  for (let at = 8; at < buf.length;) {
    const length = buf.readUInt32BE(at);
    const type = buf.toString("ascii", at + 4, at + 8);
    const body = buf.subarray(at + 8, at + 8 + length);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      const bitDepth = body[8], interlace = body[12];
      colourType = body[9];
      if (bitDepth !== 8) throw new Error(`png: bit depth ${bitDepth} is not supported (8 only)`);
      if (colourType !== 6 && colourType !== 2) throw new Error(`png: colour type ${colourType} is not supported (2 or 6 only)`);
      if (interlace !== 0) throw new Error(`png: interlace method ${interlace} is not supported (0 only)`);
    } else if (type === "IDAT") {
      idat.push(body);
    } else if (type === "IEND") {
      break;
    }
    at += 12 + length;
  }
  if (!width || !height) throw new Error("png: no IHDR chunk");
  const channels = colourType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  if (raw.length !== height * (stride + 1)) throw new Error(`png: ${raw.length} bytes of image data, expected ${height * (stride + 1)}`);
  const lines = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? lines[dst + x - channels] : 0;
      const b = y > 0 ? lines[dst - stride + x] : 0;
      const c = x >= channels && y > 0 ? lines[dst - stride + x - channels] : 0;
      const v = raw[src + x];
      let out: number;
      if (filter === 0) out = v;
      else if (filter === 1) out = v + a;
      else if (filter === 2) out = v + b;
      else if (filter === 3) out = v + ((a + b) >> 1);
      else if (filter === 4) out = v + paeth(a, b, c);
      else throw new Error(`png: filter type ${filter} on row ${y} is not one of 0-4`);
      lines[dst + x] = out & 0xff;
    }
  }
  if (channels === 4) return { width, height, data: lines };
  const data = new Uint8Array(width * height * 4);
  for (let i = 0, j = 0; i < lines.length; i += 3, j += 4) {
    data[j] = lines[i]; data[j + 1] = lines[i + 1]; data[j + 2] = lines[i + 2]; data[j + 3] = 255;
  }
  return { width, height, data };
}

function chunk(type: string, body: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])) >>> 0, 0);
  return Buffer.concat([head, body, crc]);
}

/** An 8-bit RGBA PNG, every row with filter 0. */
export function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  if (rgba.length !== width * height * 4) throw new Error(`png: ${rgba.length} bytes of RGBA, expected ${width * height * 4}`);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  return Buffer.concat([SIGNATURE, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
