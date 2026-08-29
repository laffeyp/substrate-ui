# Sprint 033a — `sync-substrate-vocab.ts` reads substrate's `current.json`

```yaml
---
id: 033a
status: closed
phase: 5
pass_kind: functional
---
```

## scope

`tools/sync-substrate-vocab.ts:10-13` reads
`../substrate/process/signals/0.2.json` — pinned to the v0.2 file by
name. Substrate is now at v0.3 (the piece-B cancel_producer bump
landed 2026-08-27). The mirror at `signals/mirror/substrate-0.2.json`
is stale relative to substrate-side reality; the `SUBSTRATE_KINDS`
closed set that `web/instrumentation/sdd.ts` enforces is behind by one
vocab version.

Fix: read substrate's own version-pointer (`substrate/process/signals/`
does not yet have a `current.json` symlink parallel to substrate-ui's;
substrate-ui does — `signals/versions/current.json → 0.6.json`).
Either add the substrate-side `current.json` symlink and read it, or
read the highest-versioned `*.json` in the directory. The former is
cleaner.

**Cross-repo shape acknowledged (per REVIEW-2026-08-28 G8):** this
sprint writes one file into a sibling repo (`substrate/process/signals/current.json`).
That file becomes a lookup surface; changing or removing it later is a
contract change. The substrate-side landing gets its own sprint card
under `substrate/process/sprints/` (name TBD by the substrate side).
Do not merge the substrate change without that companion card on file.

## context_files

- `tools/sync-substrate-vocab.ts` — the syncer.
- `signals/mirror/substrate-0.2.json` — the current mirror.
- `../substrate/process/signals/` — substrate-side versioned vocab.
- `web/instrumentation/sdd.ts:6-9` — where `SUBSTRATE_KINDS` loads
  the mirror from.
- `web/instrumentation/vocabulary.ts:11` — mirror import path.

## artifact contract → Files created/modified

- Substrate side: `substrate/process/signals/current.json` (new
  symlink → the highest committed version). Written in this sprint
  (a one-line command); the substrate side does not need its own
  sprint card because the file is a lookup convenience, not a
  contract change.
- `substrate-ui/tools/sync-substrate-vocab.ts` — reads
  `../substrate/process/signals/current.json` (following the symlink)
  and writes `signals/mirror/substrate-<version>.json`. Version
  string comes from the JSON's `vocabulary_version` field, not the
  filename.
- `substrate-ui/signals/mirror/substrate-0.3.json` — new (result of
  running the updated syncer).
- `substrate-ui/web/instrumentation/vocabulary.ts` — import path
  moves from `substrate-0.2.json` to `substrate-0.3.json`, OR (if the
  syncer starts writing a canonical `substrate-current.json`) reads
  that instead. Named-version import is simpler for git diffing.
- `substrate-ui/sprints/sprint-033a-vocab-sync-substrate-current.md`
  — this file.

## signal contract → Emits

None (tooling sprint).

## observation contract

- `npm run sync:substrate-vocab` prints the fresh sha256; the mirror
  matches the substrate side's `current.json` target byte-for-byte
  when both are read.
- Parity gate green (`SUBSTRATE_KINDS` now includes the v0.3
  additions — `substrate.ProducerCancelled.cause` /
  `.caller` payload fields).
- `npm run e2e` green (no regression from the mirror bump; the
  parity check is closed-set membership, and every existing emit's
  `substrate_kind` value already resolves against the v0.2 subset
  that v0.3 is a strict superset of).

## halt conditions

- `bridge_mapping_required` if v0.3 has a schema shape the syncer's
  copy-then-hash logic cannot express.

## definition of done

Syncer reads the substrate-side pointer. Mirror bumped to 0.3.
Parity gate + e2e green.
