# Sprint 490 — the boot record names the install

```yaml
---
id: 490
status: pending
phase: second build (roadmap r1), E4
pass_kind: functional
---
```

## scope

`APP_BOOTED` says which build, vocabulary and store kind is running (`app_version`, `app_commit`, `kernel_commit`, `vocab_version`, `packaged`, `home_kind`, `gate_isolated`), but two packaged installs agree on all but the version fields. A `PAYLOAD_FIELD_PROPOSED`, `APP_BOOTED.app_name` (string: the name the app runs under, from its record, or "Substrate Dev"), ratified as vocabulary v0.68. `main.ts` writes it. One verifiable property: the working install's boot reads `app_name` "Substrate", the Next bundle's "Substrate Next", a gate's "Substrate Dev".

## prerequisites

- 489.

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/grammar/PRINCIPLES.md` (the proposal kinds)
- `web/vm/signals/versions/current.json`, `web/vm/signals/proposals.json`, `scripts/gen_signals.py`
- `electron/main.ts` (the `APP_BOOTED` write, line 193)

## signal contract

### Emits

- `APP_BOOTED` (`app_name` added to its payload).

### Consumes

- The identity record.

### Invariants

- Every other `APP_BOOTED` field unchanged.
- Vocabulary parity (`npm run signals`) passes.

## artifact contract

### Files created

- `web/vm/signals/versions/0.68.json` and `0.68-rationale.md` (as 0.67 has)

### Files modified

- `electron/main.ts`
- `web/vm/signals/proposals.json` (P-0.68-APP-NAME)
- `web/vm/signals/versions/current.json` (the link, to 0.68)

### Content assertions

- `0.68.json` lists `app_name` in `APP_BOOTED`'s payload; `0.68-rationale.md` and `proposals.json` hold P-0.68-APP-NAME with its citation and grounds.

### Command exit codes

- `npm run signals`, `npm run build`, `npm run test:unit` return 0.

## observation contract

### UI driving steps

Open the working install, the Next bundle, and run `editor_view` from source.

### Expected runtime signals

- `APP_BOOTED` `app_name` "Substrate", "Substrate Next" and "Substrate Dev" in the three traces.

### Expected screenshot / visual state

- None.

## done criteria

A reader of any trace can tell which install wrote it.

## notes

The generated files beside `0.68.json` follow the vocabulary tool; the two hand-edited files are `main.ts` and `proposals.json`. Mutant: `app_name` fixed to "Substrate" fails the Next trace's check.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] context_files cover the vocabulary, its tool and the writer.
- [x] Tag change by proposal and version bump.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] Two hand-edited files.
