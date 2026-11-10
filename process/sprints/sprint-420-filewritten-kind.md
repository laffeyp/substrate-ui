# Sprint 420 — the window can name FileWritten

```yaml
---
id: 420
status: closed
phase: code editor, the rest (roadmap r8), E6
pass_kind: architecture
---
```

## scope

`scripts/gen_kinds.py` adds the kernel's `FILE_WRITTEN` (`substrate.topologies.session.vocabulary`, line 99) to the kinds it writes, as it adds `TOPOLOGY_RUN_STARTED`: SessionRegistry.append_event writes it and nothing registers it, so the topology walk misses it. `web/vm/envelope_kinds.gen.ts` is regenerated and names `FileWritten`; HISTORY reads hand edits by that name, never a hand-typed string. `uv run --project ../substrate python scripts/gen_kinds.py --check` 0; `tests/test_envelope_kinds_generated_096.py` passes.
