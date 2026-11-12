# Sprint 482 — an added line keeps its syntax colours

```yaml
---
id: 482
status: closed
phase: code editor (roadmap r18), E21
pass_kind: functional
---
```

## scope

The Architect saw Python files "all blue" in build 1794456520. Measured on real files: a file never committed drew 71% of its letters in one teal, #7fb3b8. Frame 24a and roadmap E3 paint every line the comparison calls added in that teal, `!important`, over the syntax colours. In a file never committed, every line is added. The Architect: "Syntax highlighting is way more important than everything looking blue because it's not committed … It's like a nice like little embellishment. It's not covering up all the code … We gotta maybe just remove this if we can't think of a better way."

The `.cm-added` colour rule goes. An added line keeps its syntax colours, and the change gutter's teal `+`, already drawn beside each added line, carries the mark. Nothing else that shows a change moves:

- the removed lines;
- the follow marks (the live edits);
- the status line's `+N −M`;
- CHANGES in the inspector;
- the tree's dots.

One verifiable property: no added line's text is drawn teal, and every added line has the gutter's teal `+`.

## prerequisites

- 481.

## context_files

- `../sdd-kit-3/AGENTS.md`, `../sdd-kit-3/ADDENDUMS.md` A1, A2
- `process/planning/2026-11-09-code-editor/ROADMAP-2026-11-09-code-editor-r18.md` E21
- `web/app/editor/Centre.tsx` (`THEME`, `hunkExtension`, `Mark`, `.cm-follow`)
- `harness/shakeout/editor_centre.ts`, `harness/shakeout/editor_base_colours.ts`, `harness/shakeout/editor_follow.ts`
- `harness/fixtures/code/` (real files) and `harness/shakeout/editor_colours_seen.ts`

## signal contract

### Emits

No new tag. DIFF_READ and EDITOR_DRAWN `hunks` are unchanged.

### Consumes

- The comparison's hunks.

### Invariants

- `.cm-added` and `data-added-line` stay on added lines, for the gates and the follow.
- The live follow is unchanged: EDITOR_FOLLOW_MARKED, then CONFIRMED or WITHDRAWN, per edit.

## artifact contract

### Files created

- `harness/fixtures/code/` (14 real files and their README: sources and licences)
- `harness/shakeout/editor_colours_seen.ts` (a capture: the colours real files draw in)

### Files modified

- `web/app/editor/Centre.tsx`: the `.cm-added` colour rule removed
- `harness/shakeout/editor_centre.ts`: added lines' gutter holds teal, their text none (within 10, as the keyword blue #7da3ca lies within 20 of teal)
- `harness/shakeout/editor_base_colours.ts`: every line in the text colour, the added one too; it waits for the file's own comparison, not the workspace's

### Content assertions

- `Centre.tsx` has no `.cm-added, .cm-added span` colour rule.

### Command exit codes

- `npm run build` returns 0
- `npm run test:unit` returns 0

## observation contract

### UI driving steps

From source and on the bundle:

- `editor_centre`: 3 added lines marked in the gutter, none with teal text.
- `editor_base_colours`: case (b) has one added line, drawn in the text colour.
- `editor_follow` with `kimi-k2.7-code:cloud`: the live edits are marked and resolved.
- `editor_colours_seen`: on the real files, a file never committed draws its syntax colours.

### Expected screenshot / visual state

- An uncommitted Python file in its syntax colours, a teal `+` beside each line.

## done criteria

Code reads in its syntax colours whatever git says about it; the change shows as a mark on the side.

## notes

Found in use, not by a gate. The gates had opened only small hand-written files that were committed. None opened a real file, or one git calls new. `harness/fixtures/code/` now holds real files in 12 languages for the gates (the Architect: "the test examples have to be real files").

`editor_base_colours` had a race since sprint 473. It read the lines when the workspace's comparison filled the header, before the file's own comparison marked the line. It failed the same way on the installed build from before this sprint. Its wait now names the line it expects.

## self-review checklist

Run 2026-11-11, written with the work (found in use, fixed in the same turn); hand-author log.

- [x] Scope is concrete and bounded.
- [x] context_files cover the rule, the gutter, the follow and the gates.
- [x] No tag needed.
- [x] Artifact contract is gradable.
- [x] Observation contract present, on real files.
- [x] One product file.

## close

Recorded in the BLACKBOARD's built entry of this date, with the bundle's results.
