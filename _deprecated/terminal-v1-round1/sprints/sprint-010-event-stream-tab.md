# Sprint 010 — event stream tab + subject-rule wiring

```yaml
---
id: 010
status: closed
phase: 2
pass_kind: functional
---
```

## scope

Two paired moves in one concept: (1) extend `selectRecord(name)` to fetch `/api/records/<name>` and store the record's events into `STATE.events`. (2) Port the event stream renderer into the Event stream + Inspector tab. Each event becomes a `.stream-line` row with `seq · <kind> · <short gist>`. Clicking a row selects it into `STATE.selectedEvent` and populates the inspector (right panel) with the event's full JSON. Transport bar row at top of the tab shows `no record` when nothing selected, or the record name + event count. This is the first read tab that reads from `STATE._currentRecord` — the subject rule works end-to-end here.

## prerequisites

- Sprint 009 closed.

## context_files

- `../web/app.js` (parent — `selectRecord()` at line 389; `renderStream()` at line 654; `inspectEvent()` at 692)
- `web/index.html`, `web/app.js`
- `WORKING_AGREEMENT.md § The six discipline items`
- both harnesses

## artifact contract

### Files modified

- `substrate-ui/terminal-v1/web/index.html` (Event stream pane holds a two-column layout: `#eventtransport` header, `#eventstream` left, `#inspector` right; `.stream-line`, `.stream-line.sel`, `.inspector-body` CSS)
- `substrate-ui/terminal-v1/web/app.js` (extend `selectRecord` to fetch record + populate `STATE.events`, add `renderStream()` and `inspectEvent(seq)`, wire the Event stream tab to render on `_currentRecord` change)

### Content assertions

- After `selectRecord(name)`, `STATE.events` is an array with the record's events.
- Event stream tab shows `.stream-line` rows equal to `STATE.events.length` after selection.
- Clicking a `.stream-line` sets `STATE.selectedEvent` and shows the event's kind + payload in `#inspector`.
- Top transport shows `no record selected — pick one in Records` when nothing selected; shows `<name> · N events` after selection.

### Command exit codes

- `npm run e2e:terminal-v1` returns 0.
- `npm run capture:terminal-v1` returns 0. New fixtures capture-only: `10-event-stream-empty.png`, `11-event-stream-populated.png`.
- Parent `npm run e2e` still returns 0.

## observation contract

### The six discipline items

1. Diary: KIT_DIARY gets Sprint 010 entry.
2. Three lenses: structural (rows count matches events length, click populates inspector); perceptual (capture stream + inspector); adversarial pass at close.
3. A2 + A3: stream lines are asymmetric per event (different kind text per row); a bug that rendered all lines the same would fail on any deterministic record.
4. Canonical home: register `renderStream`, `inspectEvent`, `STATE.events`, `STATE.selectedEvent`.
5. N+V+P: assertions carry all three.
6. Fixtures: 10 + 11 captured but not hashed (records vary per run per Sprint 009 note).

### UI driving steps

- Boot; Event stream tab opens cold, shows empty-state text.
- Click Event stream tab, capture 10 (empty).
- Click Records tab, click first `.rec`, wait for `STATE.events.length > 0`.
- Click Event stream tab, wait for `.stream-line` count to match `STATE.events.length`.
- Click first `.stream-line`, wait for `STATE.selectedEvent`, capture 11.

## done criteria

Event stream tab reads from Records selection, renders all events, inspector shows selected event. Subject rule works end-to-end (Records selection → read tab shows the right record). All six discipline items honored.
