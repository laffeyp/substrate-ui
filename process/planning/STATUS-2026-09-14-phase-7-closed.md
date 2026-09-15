# STATUS · Phase 7 closed · 2026-09-14

Supersedes `STATUS-2026-09-14-phase-7-progress.md`.

## What landed

### Transcript prose formatting

Markdown blocks — paragraphs, fenced code, unordered/ordered lists,
h1–h3 headings — with inline segments for `` `code` ``, `**bold**`,
`*italic*`. User turns render verbatim. No `dangerouslySetInnerHTML`;
every segment is a plain span.

### Turn 19 frames

| Frame | Landing |
|---|---|
| 19a workspace picker | server sandbox filter drops 206 rows to 2; inherit-from-split preselected; `choose folder…` with `⌘O`; `↑↓` picks, `⇥` completes, `↵` binds |
| 19b blank window | `?blank=1` boots pane 1 unbound → picker full-screen; `⇧⌘N` is browser-reserved, the URL is the entry point |
| 19c settings persist | `localStorage['substrate-ui.settings']` carries theme, fontOverride, nestedDescent; whole-state restore stays SQLite per D68 |
| 19g end-session interrupt-first | live session interrupts the running turn before ending; tape shows `TURN_INTERRUPTED → SESSION_END_REQUESTED → STREAM_CLOSED` |
| 19h / 19k / 19l find dims | matches keep opacity 1, non-matches drop to .35; `⌘F` toggles the bar |
| 19i status-dot hollows | header dot reads its own pane's snapshot; goes transparent when the last row is `RateLimitedWaiting` |
| 19j failed-tool row reads red | `role='tool'` with `toolOk=false` renders `⚠` in `#c26058` — depth-cap refusal reaches the surface in place |
| 19m first-run driver probe | `?firstrun=1` shows `/api/models` grouped: local ollama · ollama·cloud · CLIs · deterministic; server default preselected |

### Turn 20 frames

| Frame | Landing |
|---|---|
| 20f depth ramp | `DEPTHC = ['#82a5c8','#93a0cb','#9a9bce','#a096d0','#ac92d4','#b88fd9']` — D70 blue→violet, six steps |

### End-to-end delegate + depth cap

`harness/e2e_delegate_depth.py` — `npm run e2e:delegate-depth`. Runs
substrate's real delegate machinery 10 times with the deterministic
calculator child, asserts each trial answers 20 with a distinct child
record, asserts the D41 depth cap (`max_delegation depth`) refuses
when constructed at the limit, and reads back a session record
through the ui-server's `/api/records/<name>` to prove the surface
carries what the shell reads. Green:

```
  all 10 trials · answer=20 · distinct child records
  depth-cap refusal fires with 'max delegation depth' — D41 holds
  /api/records/s_033673342a2643fe8620a4c8 · 24 events · status finalised
PASS · 10 delegate trials + depth-cap refusal + ui-server surface check
```

## What is deliberately out of scope for this phase

- **20a–20e in-place descent onto a live child record stream.** The
  reveal-view template branches (`isMain` / `descended` / `nested`)
  exist; the click-target on a real delegate `ToolCall` and a stream
  swap that attaches the same pane's controller to `payload.child_root`
  do not. Doing that in a way that reads a filesystem child record
  through the ui-server needs a new server endpoint that takes a
  record PATH, not a NAME (per-session sandboxes derive names from
  the manifest; delegate children live at
  `<parent>/delegate-runs/d1-c0/record` and have no `s_`-name). Moves
  to Phase 8.
- **19f Export Record.** Same reason — needs a server endpoint that
  streams the `.record` directory as a zip or an `events.jsonl` file.
  Phase 8.
- **`⇧⌘N` blank-window shortcut.** Chrome reserves it for incognito;
  cannot be intercepted from JS. `?blank=1` is the working entry
  point; a native shell would add the key binding.

## Test-plan status

- `npm run smoke:vm` — 11/11 pass.
- `npm run parity` — reveal and classic emit identical tag sets.
- `npm run e2e:delegate-depth` — green (this phase's closing test).
- `npm run see` — pixel captures for 19a, 19b, 19m, find-dim,
  transcript Markdown, two-pane multi-session, reveal-on-pane-2.

## What comes next

Phase 8 owns the in-place child-record streaming (20a–20e proper),
the `.record` export path, and any server-side additions those need.
The client-side Phase 7 surface is otherwise at parity with the
ratified flat designs.
