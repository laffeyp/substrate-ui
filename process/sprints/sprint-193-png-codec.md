---
id: 193
status: closed
phase: shell-to-react A1 (comparison, part 1)
pass_kind: functional
---

# Sprint 193 — PNG reading and writing for the pixel gate

## scope

Author `harness/pixel/png.ts`: `decodePng(buf)` returns `{ width, height, data }` with `data` as 8-bit RGBA, and `encodePng(width, height, rgba)` returns a PNG buffer. It uses only Node's `zlib` (inflate, deflate, `crc32`), as Addendum A2 of the kit decodes PNGs. It reads what Playwright's screenshots write: 8-bit, non-interlaced, colour type 6 (RGBA) or 2 (RGB), filters 0–4. Anything else throws, naming the field. The comparison script that uses it is sprint 194.

## prerequisites

- 192 closed

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/ADDENDUMS.md`, Addendum A2
- `process/planning/2026-11-04-shell-to-react/PLAN-2026-11-04-shell-to-react-r4.md` (Gates)
- `captures/pixel/sprint-192-check/` (real input)

## signal contract

### Emits

- None. A harness library; the app does not run.

### Invariants

- No new dependency.
- No file under `web/` changes.

## artifact contract

### Files created

- `harness/pixel/png.ts`

### Content assertions

- Exports `decodePng` and `encodePng`.
- Imports only `node:zlib` and `node:buffer`.

### Command exit codes

- `npx tsc -p harness` returns 0.
- A check run (below) returns 0.

## observation contract

### Driving steps

- For every PNG in `captures/pixel/sprint-192-check/`: decode it with `decodePng`; compare its RGBA bytes with Pillow's decode of the same file; encode it with `encodePng`, decode the result, and compare again.

### Expected results

- All 28 files: width and height match the PNG header; RGBA bytes equal Pillow's, byte for byte; the round trip returns the same bytes.
- A file with an unsupported field (a 16-bit PNG made with Pillow) throws an error naming the bit depth.

## done criteria

The gate can read every capture exactly as Pillow reads it, and write a PNG that reads back the same, with no new dependency.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] `context_files` covered.
- [x] No tags emitted; none declared.
- [x] Artifact contract gradable.
- [x] Observation contract present.
- [x] One file, one concept.

## result

Closed 2026-11-04. `harness/pixel/png.ts` written; it imports only `node:buffer` and `node:zlib`. `npx tsc -p harness` exit 0. The check (a scratch script; Pillow wrote the reference bytes) exit 0: all 28 captures in `captures/pixel/sprint-192-check/` decode to the same RGBA bytes as Pillow's and round-trip through `encodePng`; a 16-bit PNG throws "png: bit depth 16 is not supported (8 only)".

## Rubber Duck pass

No signals: the app does not run. Observations: none in the six categories. Disposition: none needed.
