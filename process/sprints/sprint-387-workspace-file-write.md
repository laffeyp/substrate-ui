# Sprint 387 — the workspace file API writes through the record, and every call has a tag (vocabulary v0.26)

```yaml
---
id: 387
status: closed
phase: editor shared work 0(c)
pass_kind: functional
---
```

## scope

Editor plan round 2, item 0(c).

**The write.** `PUT /api/session/<id>/file?path=<rel>`, body `{text, base_sha256?, view?}`, works in three steps:

1. Write the text to a temporary file beside the target.
2. Record `FileWritten(path, old_text, new_text, view)` through `SessionRegistry.append_event` (kernel K340).
3. Rename the temporary file into place.

The refusals:

- A record that refuses the edit leaves the file untouched, with 409: a session with no record yet, or an ended one.
- A `base_sha256` that no longer matches the file is 409. The read now returns `sha256`.
- A path outside the workspace is 400; a missing folder is 404.

**The tags.** v0.26 adds FILES_LISTED, FILE_READ, FILE_WRITTEN, FILES_WATCH_OPENED and FILES_WATCH_CLOSED (`P-0.26-WORKSPACE-FILES`).

**The watch.** It now sees a client's hang-up at its next poll, from the socket, instead of at the second write after it.

**Gate helper.** `lib/scratch.ts` keeps a folder that `cleanup` marks to keep. Before this, the exit handler deleted it, so the keep-on-failure of sprint 386 kept nothing.

## context_files

- `server.py` (`_workspace_target`, `_workspace_read`, `_session_files`, `_session_files_watch`, `_refuse_foreign_host`, `_read_json_body`)
- `../substrate/src/substrate/topologies/session_registry.py` (`append_event`), `../substrate/src/substrate/topologies/session/__init__.py` (`FileWritten`)
- `harness/shakeout/lib/electron.ts`, `harness/shakeout/lib/scratch.ts`

## signal contract

### Emits

- FILES_LISTED, FILE_READ, FILE_WRITTEN and FILES_WATCH_OPENED, in the server process.
- FILES_WATCH_CLOSED, when the client hangs up.
- API_REFUSED, area `files`, for each refusal.

### Invariants

- No path or text in any of them (E1).
- FILE_WRITTEN's `seq` is the FileWritten entry's seq on the kernel record.

## artifact contract

- **Created:**
  - `tests/test_workspace_write_387.py`;
  - `harness/shakeout/workspace_files_signals.ts`;
  - `web/vm/signals/versions/0.26.json`, `0.26-rationale.md`.
- **Modified:**
  - `server.py`;
  - `harness/shakeout/lib/electron.ts`, `lib/scratch.ts`;
  - the generated files, `proposals.json`, `current.json`;
  - `package.json` (`gates:electron`);
  - `WORKING_AGREEMENT.md`.

## observation contract

**`tests/test_workspace_write_387.py`:**

1. A write, then a new file, each on the record at the returned seq, with the trace's tags in order.
2. Every refusal leaves the file and the folder as they were: no record yet, a stale hash, an escape, a missing folder, an ended session.
3. The watch writes its open and its close.

**`harness/shakeout/workspace_files_signals.ts`, from source and packaged.** After one turn, the window drives:

1. list;
2. read;
3. write with the read's hash;
4. a stale write;
5. open and close the watch.

`server.jsonl` must hold the tags in order, and the kernel record must hold FileWritten at FILE_WRITTEN's seq.

**Plant:** with FILE_WRITTEN's emit replaced, the gate fails, and its state folder is kept.

## result

- **Checks:**
  - `mypy server.py` clean;
  - ruff check and format 0;
  - build 0;
  - unit 161;
  - Python 307 passed, 5 skipped (the new file 3);
  - `npm run signals` 0 (113 live tags emitted).
- **Gate:** `workspace_files_signals` 0 from source, FileWritten at seq 37 on the record.
- **Plant:** exit 1, its folder kept.
- **Packaged:** in the BLACKBOARD's `built` entry.
- **Rubber Duck Pass**, on `server.jsonl`, all for one session:
  - FILES_LISTED, 1 entry;
  - FILE_READ, utf8;
  - FILE_WRITTEN at_rest at seq 37;
  - API_REFUSED, area files, 409;
  - FILES_WATCH_OPENED;
  - FILES_WATCH_CLOSED.

  Observations, both `resolved-here`:
  - the watch saw a hang-up only at its second write after it;
  - the keep-on-failure of sprint 386 kept nothing.
