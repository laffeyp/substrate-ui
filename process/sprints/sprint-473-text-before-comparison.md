# Sprint 473 — a tab's text shows at once, and a file's when it is read, not when its comparison lands

```yaml
---
id: 473
status: closed
phase: code editor (roadmap r13), found in use 2026-11-11
pass_kind: functional
---
```

## scope

BLACKBOARD 2026-11-11 `user` and `surfaced` entries: after a click the new tab is drawn while the code keeps the previous file's text and the status line and INFO go blank, for as long as the base comparison takes (1.0–2.3 s per open and per tab switch in the Architect's session). `Centre.tsx` reads the file and its comparison together (`Promise.all`) and places nothing until both land. This sprint places the file's text, the status line and INFO as soon as the file read lands, with the hunks last known for that file (none for a file not yet compared); the comparison applies when it lands: the base, the marks, the status line's `vs` count and CHANGES. A read that a write or a newer click has overtaken applies neither half, as before (sprint 438). The Architect's bar, given during the sprint (BLACKBOARD 2026-11-11 `user`): "the text shows immediately whenever you click on a tab … There should be no lag." So every open tab keeps its editor state and the facts it was read with (`SHOWN`); a click on its tab places that state in a layout effect, before the browser paints the click, with no read first; the read from disk runs after it, to take in a change made outside the editor, and the comparison after that. The window gains EDITOR_FILE_SHOWN (vocabulary v0.65): `ms`, from the request to the file's text placed, once each time a different file is shown, so the trace and the gates measure the time to show a file.

## prerequisites

- 472.

## context_files

- `../sdd-kit-3/AGENTS.md`; `../sdd-kit-3/templates/SPRINT_CARD.md`; `../sdd-kit-3/foundations/01-signal-driven-development.md` (performance timelines); `../sdd-kit-3/ADDENDUMS.md` A1, A4
- `BLACKBOARD.md`: the three entries of 2026-11-11 on the editor broken in use
- `web/app/editor/Centre.tsx` (the read effect, `record`, `BASES`, `setHunks`, `against`, `lineHunks`, `WRITES`); `web/app/editor/StatusLine.tsx`; `web/app/editor/Inspector.tsx`
- `harness/shakeout/editor_open_frames.ts` (the capture that showed the fault)
- Vocabulary 0.64; `../sdd-kit-3/grammar/PRINCIPLES.md` (NEW_TAG_PROPOSED)

## signal contract

### Emits

Vocabulary v0.65 (P-0.65-FILE-SHOWN): `EDITOR_FILE_SHOWN` (window): `ms` — once each time the centre places a different file's text, the milliseconds from its read being asked to the text placed.

### Consumes

- FILE_READ, DIFF_READ (server), as before.

### Invariants

- The text placed is the file's on disk at the read, as before; a stale read applies nothing.
- The comparison never replaces the text or moves the caret; it sets the base and the marks only.
- No path or text in any payload (E1).

## artifact contract

### Files created

- `harness/shakeout/editor_open_speed.ts`; `harness/shakeout/editor_open_frames.ts` (the capture that showed the fault: frames every 100 ms after each click; reports, asserts nothing)
- `web/vm/signals/versions/0.65.json`, `0.65-rationale.md`

### Files modified

- `web/app/editor/Centre.tsx`; the vocabulary files

### Content assertions

- `Centre.tsx` places the text on the file read alone (no `Promise.all` over the file and its diff) and applies the diff in a second step; it emits EDITOR_FILE_SHOWN with `ms`.

### Command exit codes

- `npm run signals`, `npm run test:unit`, `npm run build` return 0

## observation contract

### UI driving steps

Gate `editor_open_speed.ts`, from source and on the bundle. A repository written by the gate holds a.ts (changed since its commit), b.toml, and 20,000 untracked files, so the comparison is slow, as in the Architect's workspace. The deterministic driver; in the editor:

1. Open a.ts, then b.toml from the tree: 100 ms after each click the active tab's file is the one whose first line the code shows, and the status line is drawn.
2. Switch to a.ts's tab, then b.toml's: at once, with no wait after the click, the same holds.
3. a.ts's hunk card appears in CHANGES once its comparison lands.

### Expected runtime signals

- window-1.jsonl: EDITOR_FILE_SHOWN ×4, the opens under 100 ms and the tab switches under 5 ms; server.jsonl: each per-file DIFF_READ later than its FILE_READ by more than the shown time (the gate prints both).

### Expected screenshot / visual state

- The frame taken at once after switching to b.toml: b.toml's text under b.toml's tab, the status line drawn.

## done criteria

A tab's text appears the moment its tab is clicked; a file opened for the first time appears when it is read; a slow comparison delays only the change marks.

## notes

Sprint 474 makes the comparison itself fast; this sprint makes its speed not matter to showing a file.

## self-review checklist

Run 2026-11-11, before the work began.

- [x] Scope is concrete and bounded: one verifiable property (the text does not wait for the comparison).
- [x] context_files cover the effect, the status line, INFO, the capture, the kit's timing guidance.
- [x] Emits names EDITOR_FILE_SHOWN in v0.65, ratified in this sprint.
- [x] Artifact contract is gradable.
- [x] Observation contract present.
- [x] ≤2 files: `Centre.tsx` and the gate, with the vocabulary bump.

## close

`Centre.tsx`: the read effect is a layout effect. A tab already read places its kept state (`SHOWN`, with the facts it was read with) at once, before the browser paints the click; the file shown is kept for its tab when another is shown or the editor is left (`park`, unsaved edits still in BUFFERS); a closed tab's state goes with it. A file not yet read places its text when the file read lands, with its last known comparison (`DIFFS`); the comparison applies when both reads have landed: the base, the marks, the status line's count, CHANGES. The placement is one function (`placeView`) for both paths. EDITOR_FILE_SHOWN (v0.65) gives `ms` from the read asked to the text placed.

Gate `editor_open_speed` from source and on the bundle (build 1794446186, packaged true): with 60,000 untracked files the per-file comparisons landed 1,023–3,805 ms after their reads; EDITOR_FILE_SHOWN 25 and 14 ms for the two first opens (source: 19, 10) and 1 ms for each tab switch; 100 ms after an open and at once after a tab click, the active tab's file is the one whose first line the code shows, the status line drawn; a.ts's hunk card appears once its comparison lands. Mutants: the text waiting on the comparison fails it (100 ms after opening a.ts: no text, no status line, the Architect's report); tabs keeping no state fails it (at once after clicking a.ts's tab: b.toml's text under a.ts's tab, no status line).

`editor_follow` failed once from source, before the tab change: in its third turn the live model made no tool call and answered in text that it had run `bash` and `edit_file` (stop reason `end_turn`, no ToolCall in the record); the next run passed with every edit marked and resolved.

Command exit codes: `npm run signals` 0 (v0.65, 157 tags); unit specs 231/231; build 0. Gates from source: `editor_centre`, `editor_status`, `editor_inspector`, `editor_save`, `editor_save_on_send`, `editor_history`, `editor_follow`, `editor_undo`, `editor_search`, `editor_edit_any_file`, `editor_type_digits`, `editor_highlight`, `editor_any_size`, `editor_bytes`, `editor_encodings` 0; on the bundle `editor_open_speed`, `editor_save`, `editor_status`, `editor_history`, `editor_centre`, `editor_type_digits`, `editor_save_on_send` 0.

Rubber Duck Pass (the gate's trace, as it reports it). EDITOR_FILE_SHOWN 25 (a.ts opened), 14 (b.toml opened), 1 (a.ts's tab), 1 (b.toml's tab), 1 (a.ts's tab, for the CHANGES check); FILE_READ then DIFF_READ for each, DIFF_READ 2,084–3,805 ms later, applied after the text. Observations: one, timing surprise, recorded: the comparison itself still takes seconds in a large workspace; it no longer delays the text, and sprint 474 makes it fast.
