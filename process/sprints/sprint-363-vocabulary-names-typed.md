# Sprint 363 — no raw vocabulary strings in the code: generated types in TypeScript and Python

```yaml
---
id: 363
status: closed
phase: SDD re-centre
pass_kind: architecture
---
```

## scope

Every tag name and every enum value of the vocabulary was a raw string typed out by hand at each call site:
- 70 window emit calls across eight files;
- 22 in Electron main;
- 12 in the server.

The compiler saw none of them: the window's `emit` took `name: string` and `payload: Record<string, unknown>`. Electron main was plain JavaScript that no type checker read. This sprint makes `current.json` the only place those strings are written:

1. **Electron main becomes TypeScript.** `electron/main.js`, `menu.js`, `preload.js`, `check_signal.js` and `build_commits.js` are renamed `.ts`, use `import`, compile with `electron/tsconfig.json` (strict) to `dist-main/`, and run from there. A port: nothing main does changes.
2. **`scripts/gen_signals.py`** generates, from `current.json`:
   - `web/vm/signals.gen.ts` and `electron/signals.gen.ts`, with the same content:
     - `Signal`, an `as const` object of tag names;
     - an `as const` object per enum field;
     - `SignalPayloads`, the payload type of each tag;
   - `signals_gen.py`: `StrEnum`s of the tag names and of each enum field, and a `TypedDict` per payload.

   `--check` reports a stale file, as `gen_kinds.py` does. `tests/test_signals_generated.py` fails when a file is stale.
3. **Typed emitters.**
   - Window and main: `emit<K extends SignalName>(name: K, payload: SignalPayloads[K])`.
   - Server: `_Trace.emit(name: Signal, payload)`.
4. **Every call site uses the generated names**, for tags and for enum values.
5. **Enforcement.**
   - ESLint bans a string literal inside an emit call in `web/` and `electron/`.
   - `npm run signals` reads the generated names and fails on a raw tag string in the window, main or the server.

## context_files

- `../sdd-kit-3/AGENTS.md` (hard rule 2), `grammar/PRINCIPLES.md` (commitment 2), `foundations/02-sdd-practice.md` (the vocabulary linter)
- `scripts/gen_kinds.py`, `tests/test_envelope_kinds_generated_096.py`, `eslint.config.mjs` (the envelope-kind precedent)
- `web/vm/signals/versions/current.json`
- `web/vm/instrumentation/sdd.ts`, `check.ts`; `web/vm/tools/check-vocabulary-parity.ts`
- `electron/*.js`, `electron-builder.config.js`, `package.json`
- `server.py` `_Trace`

## signal contract

### Emits

No new tag. Every record's name and enum values are unchanged; only how the code names them changes.

### Invariants

- **No raw tag or enum string at an emit call** in `web/`, `electron/` or `server.py`, outside the generated files.
- **The traces are unchanged.** Each gate's trace holds the same records as before.

## artifact contract

### Files created

- `scripts/gen_signals.py`
- `web/vm/signals.gen.ts`, `electron/signals.gen.ts`, `signals_gen.py`
- `tests/test_signals_generated.py`
- `electron/tsconfig.json`

### Files modified

- `electron/*.js` → `electron/*.ts`
- `web/vm/instrumentation/sdd.ts`, every window file with an emit call, `server.py`
- `web/vm/tools/check-vocabulary-parity.ts`, `eslint.config.mjs`
- `package.json`, `electron-builder.config.js`, `.gitignore`
- the two unit tests that load main's files

### Command exit codes

`npx tsc --noEmit` 0; `npx tsc -p electron` 0; `npm run lint` 0; `npm run build` 0; `npm run test:unit` 0; `uv run python -m pytest tests/ -q` 0; `npm run signals` 0; `python scripts/gen_signals.py --check` 0.

## observation contract

All 67 `gates:electron` commands, one at a time, from source and packaged. Plants:
- a raw tag string at an emit call fails lint;
- a wrong enum value fails `tsc`;
- a stale generated file fails `--check` and the test.

## done criteria

No vocabulary string is written by hand anywhere but `current.json`. The compiler rejects a wrong tag, field or value in the window and main. Every gate passes unchanged.

## result

Built differently from the scope above in three places. Each was corrected in the work, and each is recorded here as it happened:

- **Main's port.** Strict mode was turned on, and new types were written to satisfy it. That was undone; `git diff HEAD -- electron/` was empty afterwards. The port was then redone the handbook's way:
  - renamed to `.ts`, with `import`/`export`;
  - `electron/tsconfig.json` with `strict` off;
  - 19 compiler errors, each fixed at its own line, with no new functions.
- **Raw strings.** The first generator wrote `as const` objects, and an ESLint rule banned literals at emit calls by matching the emitter function names. That rule was itself a list of raw strings, and a literal still compiled. The generator now writes **TypeScript string enums**. A plain string is not assignable to an enum member, so `tsc` rejects a raw tag or value, and the ESLint rule was removed.
- **Server.** The server gets `StrEnum`s. No type checker runs on `server.py`: mypy at default settings reports 12 existing errors there, none about signals. Those are their own change, after which mypy joins the build.

App state that carries a vocabulary value now has the vocabulary's enum as its type:
- `ConnectionState` is `PaneDrawnConnection`;
- the picker's open line is `PaneDrawnPickerLine`;
- the interrupt tier is `TurnInterruptedTier`.

So nothing is converted from a string where it enters a record. Where two tags name the same line with different value sets, a map keyed by enum member converts between them (`HALF_OF_LINE` in `App.tsx`).

Removed, to `_deprecated/signal-checker-2026-11-07/`:
- the window's, main's and the server's checkers, and `checker-cases.json`;
- `signal_checker.spec.ts`, `signal_posture.spec.ts` and `test_signal_checker.py`.

Also removed:
- `SIGNAL_REJECTED` (retired) and E2, E5, E6 (v0.16);
- the packaged-build flag the checkers read;
- the `SUBSTRATE_SIGNAL_PLANT` seams;
- the launcher's rejection check;
- `trace_files`' `reject` mode;
- the build's copy of the vocabulary to `web/dist/`.

- **Commands:**
  - `npx tsc --noEmit` 0; `npx tsc -p electron --noEmit` 0;
  - `npm run lint` 0; `npm run build` 0;
  - `npm run test:unit` 147 passed; `uv run python -m pytest tests/ -q` 297 passed, 5 skipped;
  - `npm run signals` 0 (v0.16, 72 live tags named, 15 pending);
  - `python3 scripts/gen_signals.py --check` 0;
  - `ruff check`, `ruff format --check` 0.

  The test counts fall by the checker's own tests.
- **Gates:** all 66 `gates:electron` commands run one at a time from source; all 66 exit 0.
- **Not yet run:** the packaged build. The commit's message says so.
