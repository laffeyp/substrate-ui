# Sprint 508 — The bundled runtime keeps compiled packages out of its zip

```yaml
---
id: 508
status: closed
phase: continuing a session (roadmap 2026-11-12-continue-a-session r4, E12)
pass_kind: functional
depends_on: [kernel 352, kernel 353]
plan: process/planning/2026-11-12-continue-a-session/ROADMAP-2026-11-14-continue-a-session-r4.md
---
```

## scope

Kernel sprint 352 added `tokenizers`, which ships a compiled extension (`tokenizers.abi3.so`). `scripts/fetch-python-runtime.sh` step 6 zips every installed package but `msgspec` and `substrate` into `_bundle.zip`, and Python cannot load a compiled extension from a zip: in the packaged Substrate Next, `from tokenizers import Tokenizer` fails with `ModuleNotFoundError: No module named 'tokenizers.tokenizers'`, and the session package with it. `tokenizers` stays on disk beside `msgspec`; after zipping, the script fails if `_bundle.zip` holds any `.so`; the import smoke imports `tokenizers` and counts with the kernel's tokenizer. One verifiable property: the packaged runtime counts "hello world" as 2 tokens.

## context_files

- `scripts/fetch-python-runtime.sh` (steps 6, 7, 10)
- `RUNBOOK-2026-11-12-project-r10.md` (chapter 5A)

## signal contract

### Emits

- No signal changes. The packaged server's `SERVER_STARTED` and a session's `PromptComposed` are the evidence.

### Invariants

- Every package with a compiled extension is on disk, not in `_bundle.zip`.

## artifact contract

### Files modified

- `scripts/fetch-python-runtime.sh`

### Command exit codes

- `npm run pack:runtime` returns 0 and prints the count smoke; chapter 5A steps 1–20 return 0.

## observation contract

The installed Substrate Next opens `s_52bd6e73d1224d5cb6d04830`, which answers a message; its record holds a `PromptComposed` and a `TranscriptCompacted` with `token_scale` 1.5.

## close

`scripts/fetch-python-runtime.sh`: `tokenizers` and its dist-info stay on disk beside `msgspec` (step 6) and are precompiled with them (step 10); after zipping, the script exits 1 if `_bundle.zip` lists a `.so` or `.dylib`; the import smoke counts "hello world" with the kernel's tokenizer and asserts 2.

- `npm run pack:runtime`: exit 0, "token count ok: hello world = 2".
- Chapter 5A, steps 1–16 (`runs/packaged/sprint-351-20261114-223015/summary.txt`) and 17–20 with 17a: all 0. Installed Substrate Next build 1794724726, kernel `6b92f483`; server up on its new port; Substrate's own pid unchanged (17a: working sessions 130, changed 0).
- The link `substrate-next://session/s_52bd6e73d1224d5cb6d04830` opened the session in the new build: `SESSION_ATTACH_STARTED`, `STREAM_ATTACHED`, `TRANSCRIPT_ROW_DRAWN`, then `STREAM_CLOSED` and `PANE_DRAWN` `connection` `closed`, the session being ended; the next message resumes it (gate 16 passed on this bundle).
- The observation contract's reply is the session's next message, which the Architect sends; the same kernel, resumed on a copy of the record with a stand-in Claude Code, planned 518,602 tokens and answered (kernel 353).

Rubber Duck Pass: no signal changed; the trace's attach sequence for the session is the one chapter 5B names. No observations.
