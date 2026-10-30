# Sprint 037c — legacy docked terminal deletion

```yaml
---
id: 037c
status: closed-2026-08-28
phase: 5
pass_kind: functional
---
```

## scope

Delete the legacy docked terminal DOM + handlers from `web/app.ts`
and `web/index.html`. Sprint 035 kept them one release inside
`#view-desktop` for backwards compat; 037c retires them now that
`web/terminal.ts` (035) and the full session harness (037a+037b)
prove the replacement.

Two files. One concept: cleanup.

## prerequisites

- 037a and 037b closed (the harness proves the replacement path).
- 035 closed (`web/terminal.ts` exists and handles turns).

## context_files

- `substrate-ui/web/app.ts` — `#termdock`, `#termOpen`, `runTerm`,
  `sendChatMessage` legacy paths.
- `substrate-ui/web/index.html` — `#termdock` DOM.
- Any harness or capture that still references `#termdock`
  (identified by grep in the closeout).

## artifact contract → Files created/modified

- `substrate-ui/web/app.ts` — delete legacy dock code paths;
  `POST /api/agent` bridge call site deleted from `sendChatMessage`
  (the bridge stays server-side for other consumers, if any; sprint
  037c only removes the UI's dependency).
- `substrate-ui/web/index.html` — delete `#termdock` DOM.
- Any harness with a `#termdock` selector — remove the selector line
  (identify via grep).

## signal contract → Emits

No new emits. Loses no emit sites (035 already moved emission to
`web/terminal.ts`).

## observation contract

- `grep -r '#termdock\|termOpen\|runTerm' substrate-ui/web substrate-ui/harness`
  returns no hits (bounded per REVIEW-2026-08-28 G6).
- `grep -r '#termdock\|termOpen\|runTerm' substrate-ui/tests` returns
  no hits — any test that still asserts on the dock DOM is a
  regression the deletion would break. If the grep hits, the test
  needs update inside this sprint before the deletion lands.
- `npm run e2e && npm run e2e:studio && npm run e2e:assay && npm run
  e2e:delegate && npm run e2e:session` green.
- `npm run signals` green across all fixtures.

## halt conditions

- `dual_contract_fail` if any e2e regresses after the deletion.

## definition of done

Legacy dock gone; grep clean; full e2e + signals green.
