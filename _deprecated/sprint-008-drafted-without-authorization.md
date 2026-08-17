# Sprint 008 — vocabulary lock + SDD scaffold for substrate-ui

```yaml
---
id: 008
status: pending
phase: 2
pass_kind: architecture
---
```

## scope

Land the SDD instrumentation scaffold for substrate-ui and lock the initial signal vocabulary. This is the founding act of substrate-ui-as-signal-emitter per hard rule 12 (Sprint-0 vocabulary materialization). Two files scaffold the emitter; a third holds the locked vocabulary produced by the Vocabulary Session with the Architect. A fourth is the parity gate that keeps `emit()` call sites and the lock in sync.

## prerequisites

- Vocabulary Session with the Architect per `../../../sdd-kit-2/grammar/BOOTSTRAP.md` § 12 steps. Output populates `signals/versions/0.1.json`.

## context_files

- `../../../sdd-kit-2/AGENTS.md`
- `../../../sdd-kit-2/grammar/PRINCIPLES.md`, `grammar/BOOTSTRAP.md`
- `../../../sdd-kit-2/templates/VOCABULARY.json`
- `../../../sdd-kit-2/lib/sdd.py` — the surface to port to JS
- `/Users/peterlaffey/Documents/Claude/Projects/Katybird/src/instrumentation/sdd.ts` — the JS-port reference (85 lines)
- `/Users/peterlaffey/Documents/Claude/Projects/Katybird/tools/check-vocabulary-parity.ts` — the parity gate reference (191 lines)
- `/Users/peterlaffey/Documents/Claude/Projects/Katybird/signals/versions/0.1.json` — locked-file shape reference
- `../BLACKBOARD.md`, `../WORKING_AGREEMENT.md`

## artifact contract

### Files created

- `substrate-ui/signals/versions/0.1.json` — locked vocabulary (Vocabulary Session output)
- `substrate-ui/signals/versions/0.1-rationale.md` — rationale doc, Architect signed
- `substrate-ui/web/sdd.js` — the JS emitter (port of Katybird's sdd.ts to plain JS)
- `substrate-ui/web/vocabulary.js` — loads the JSON at page load, builds the typed dict
- `substrate-ui/tools/check-vocabulary-parity.js` — the parity gate

### Files modified

- `substrate-ui/web/index.html` — one `<script src="sdd.js" defer>` before `app.js`
- `substrate-ui/web/app.js` — no emit calls yet (that's Sprint 009); this sprint just wires the emitter as a global for later use
- `substrate-ui/process/WORKING_AGREEMENT.md` — canonical home registry gains rows for `SignalVocabulary`, `emit`, `snapshot`, `signals/versions/0.1.json`; § Vocabulary discipline overrides gains the validator-extras posture
- `substrate-ui/process/BLACKBOARD.md` — `## Decisions` gains the vocabulary lock decision

### Content assertions

- `signals/versions/0.1.json` validates as JSON.
- `signals/versions/0.1.json` `locked: true`, `locked_at` set, `locked_by` names the Architect.
- Every tag has `name`, `category`, `stratum`, `payload`, `optional_payload`, `note`.
- Every referenced category exists in the `categories` array; every referenced stratum in the `strata` array.
- `web/sdd.js` exports `emit(name, payload)` that throws on unknown tag and on missing required payload field.
- Running `node tools/check-vocabulary-parity.js` returns 0 with `0 emits, all locked` (no emit calls yet).

### Command exit codes

- `python -c "import json; json.load(open('substrate-ui/signals/versions/0.1.json'))"` returns 0
- `cd substrate-ui && node tools/check-vocabulary-parity.js` returns 0
- Parent `cd substrate-ui && npm run e2e` still returns 0 (no functional change)

## observation contract

`pass_kind: architecture` — no runtime behavior added, no observation contract.

## done criteria

The vocabulary is locked. The emitter is importable in the browser. The parity gate runs green. No emit calls exist yet; Sprint 009 adds the first ones per subsystem.

## notes

The Vocabulary Session is the load-bearing step; the scaffold is mechanical afterwards. Follow BOOTSTRAP.md § Steps 1–11 with the Architect present. The rationale doc is the artifact future sessions read to defend tag choices.
