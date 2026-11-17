# Sprint 513 — Strip Substrate launch variables from the bash tool's environment

```yaml
---
id: 513
status: closed
phase: editor features (roadmap 2026-11-14 r5, follow-up to sprint 507)
pass_kind: functional
---
```

## scope

The `bash` tool in `substrate/src/substrate/topologies/tool_loop/tools.py` inherits the server's launch environment, including `SUBSTRATE_PYTHONHOME`, `SUBSTRATE_HOME`, `SUBSTRATE_TRACE_DIR`, `SUBSTRATE_BOOT_ID`, and `SUBSTRATE_PARENT_PID`. When a session's shell runs `uv run python -m pytest` in `../substrate`, `uv`'s Python reads `SUBSTRATE_PYTHONHOME` as `PYTHONHOME` and fails to import the encodings module. This sprint strips those five variables from the environment passed to `subprocess.Popen` in `_bash`, and adds a test that proves the strip.

## prerequisites

- Sprint 507 (the editor features' close) is active; this is a blocker found during its full-suite run.

## context_files

- `sdd-kit-3/AGENTS.md`
- `substrate-ui/WORKING_AGREEMENT.md`
- `substrate-ui/BLACKBOARD.md` (decision entries and tail)
- `substrate/src/substrate/interpreter.py`
- `substrate/src/substrate/topologies/tool_loop/tools.py`
- `substrate/tests/test_interpreter_home_177.py`
- `substrate-ui/process/sprints/sprint-507-editor-features-close.md`

## signal contract

### Emits

- No new tags. The fix is internal to the tool's environment.

### Consumes

- The five launch-variable names from `interpreter.py` and the server's environment setup.

### Invariants

- `own_interpreter_env` in `interpreter.py` is unchanged; processes that explicitly need the bundled interpreter still get `PYTHONHOME` restored.
- No out-of-vocabulary tags are emitted.

## artifact contract

### Files created

- `substrate/tests/test_bash_env_strip_513.py`

### Files modified

- `substrate/src/substrate/topologies/tool_loop/tools.py`

### Content assertions

- `_bash` in `tools.py` builds a `dict` copy of `os.environ`, removes `SUBSTRATE_PYTHONHOME`, `SUBSTRATE_HOME`, `SUBSTRATE_TRACE_DIR`, `SUBSTRATE_BOOT_ID`, and `SUBSTRATE_PARENT_PID`, and passes it as `env=` to `subprocess.Popen`.
- `test_bash_env_strip_513.py` runs the `bash` tool with the five variables set in the environment, calls a shell that prints the variables it sees, and asserts none of the five are present.

### Command exit codes

- `uv run --project ../substrate pytest substrate/tests/test_bash_env_strip_513.py -q` returns 0.
- `uv run --project ../substrate ruff check substrate/src/substrate/topologies/tool_loop/tools.py substrate/tests/test_bash_env_strip_513.py` returns 0.

## observation contract

- Not required: the change is in the kernel's tool environment, verified by a unit test.

## done criteria

The `bash` tool no longer passes Substrate's launch variables to the shell it starts, and a test proves the strip.

## notes

The blackboard surfaced this on 2026-11-15: 77 kernel tests failed with "Failed to import encodings module" until the five variables were cleared. The same cause as the 2026-11-14 `SUBSTRATE_HOME` leak.

## self-review checklist

- [x] Scope is concrete and bounded.
- [x] `context_files` covers the files to modify and the kit.
- [x] Signal contract's `Emits` list references only existing tags.
- [x] Artifact contract is gradable.
- [x] Observation contract not required for a functional tool fix.
- [x] Sprint sweet spot honored: one file modified, one test file created, one concept.
