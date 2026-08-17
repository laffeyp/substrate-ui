# Sprint 009 — Records tab: rail port

```yaml
---
id: 009
status: closed
phase: 2
pass_kind: functional
---
```

## scope

Port the record rail from parent `web/app.js:48–102` into the Records tab. Fetches `/api/records`, renders records grouped `your runs` (source=run, newest-first by run_id) above `demos` (source!=run). Each record is a `.rec` div with a status dot (green/red/amber/cyan per parent color rules), name, and one meta line. Clicking a record sets `STATE._currentRecord` (the subject-rule state per the Architect ruling) and marks the row `.sel`. This is the selection surface every other read tab will read from in later sprints. Top/bottom bars per the Architect ruling render only when Records is active — added in this sprint as a header showing the selected record's name (top bar) and a footer showing its status (bottom bar).

## prerequisites

- Sprint 008 closed.

## context_files

- `../web/app.js` (parent — `loadRecords()` at 48; `.rec` styling)
- `../web/index.html` (parent — `.rec`, `.rail-group`, `.dot`, `.nm`, `.meta` CSS)
- `web/index.html`, `web/app.js`
- `WORKING_AGREEMENT.md § The six discipline items`
- both harness files

## artifact contract

### Files modified

- `substrate-ui/terminal-v1/web/index.html` (Records pane holds `#recordstopbar`, `#recordsrail`, `#recordsbottombar`; add `.rec`/`.rail-group`/`.dot`/`.nm`/`.meta`/`.rec.sel` CSS)
- `substrate-ui/terminal-v1/web/app.js` (add `loadRecords()` async, `selectRecord(name)` sync, `STATE.records`, `STATE._currentRecord`; load on first Records-tab activation)

### Content assertions

- Records pane contains `#recordsrail`, `#recordstopbar`, `#recordsbottombar`.
- `loadRecords()` renders `.rec` elements — one per record from `/api/records`.
- Groups render as `.rail-group` headers with visible labels: `your runs · N` and `demos`.
- Clicking a `.rec` sets `STATE._currentRecord` to the record's name AND applies `.sel` to only that row.

### Command exit codes

- `npm run e2e:terminal-v1` returns 0.
- `npm run capture:terminal-v1` returns 0. New fixtures: `08-records-rail.png`, `09-records-selected.png`.
- Parent `npm run e2e` still returns 0.

## observation contract

### The six discipline items

1. **Diary (#34).** KIT_DIARY gets Sprint 009 entry.
2. **Three lenses (A1).** Structural: rail renders, groups render, clicking selects. Perceptual: capture rail — decode status dot colors (asymmetric across records: green, red, amber all present in the demo set). Adversarial: paragraph at close.
3. **Pixel anchor + asymmetric (A2 + A3).** Status dot colors are the pixel anchor. Asymmetric because different records have different colors — a CSS bug that made all dots one color would fail the diversity check.
4. **Canonical home (rule 7).** Register `loadRecords`, `selectRecord`, `STATE.records`, `STATE._currentRecord`, rail DOM.
5. **N+V+P (B3).** Every assertion carries all three.
6. **Fixtures (#38).** Two new fixtures.

### UI driving steps

- Boot, click Records tab, wait for rail populate.
- Assert rail has > 0 `.rec` elements.
- Assert both `your runs · N` (if runs exist) and `demos` groups render.
- Click the first `.rec`, assert `STATE._currentRecord` matches, assert `.sel` moves.
- Capture rail (08) and rail-with-selection (09).

## done criteria

Records tab shows the record rail, clicking selects, subject-rule state is set for future tabs to read. All six discipline items honored.
