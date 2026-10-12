# Sprint 134 — The login card's last line; the folder input's false hints

```yaml
---
id: 134
status: closed
closed_at: 2026-10-11
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 3; open item 10)
asked: 2026-10-11 (Architect)
---
```

## scope

- `AuthPromptCard.tsx:213`: remove "ready to pick a session"; check the layout of that bottom row.
- The folder input's placeholder (`reveal_component.ts:1320-1323`, `wsPlaceholder`): remove "type a path", "type a path to change folder" and "⇥ fills nearest recent", which are not true. The other key hints stay.
- The gates and `reveal_component.ts:438` find that input by `placeholder^="type a path"`; they move to its `data-ws-input` attribute.

## checks

- The three placeholders read without the false parts; the login card's bottom row shows no "ready to pick a session"; the Electron gates pass.

## result

- **Placeholders** (`reveal_component.ts`, `wsPlaceholder`): the folder step reads `↑↓ moves · ⇧↵ opens · ↵ picks the folder`; the model step `↑↓ moves · ⇧↵ opens · ↵ picks the model · esc back`; the guidance step `← → moves · ↵ picks the guidance and starts · esc back to models`. "type a path", "type a path to change folder" and "⇥ fills nearest recent" are gone.
- **Selectors.** `reveal_component.ts:438`, the gates' `bindPaneAsUser` (`harness/shakeout/lib/electron.ts`) and `harness/startup_timing.ts` find the folder input by `input[data-ws-input]`, not by its placeholder text; the comment in `packaged_app_smoke.ts` follows.
- **Login card** (`AuthPromptCard.tsx:213`): once signed in, the bottom row's text is empty; "not authenticated yet" stays for the other case, and the retry button keeps its place on the right. The row's layout was not checked in a running app: reaching this card needs a real CLI sign-in.
- **Checks.** No source file holds the old texts. `tsc` clean; unit specs 32 of 32; the 11 Electron gates pass on the source build.

