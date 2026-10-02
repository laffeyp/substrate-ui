# Postmortem — the transcript stopped following the bottom (2026-09-24 → today)

## What the Architect sees

In the installed app (build 1790925851, substrate-ui `52320ae`), new transcript rows arrive below the fold and the view does not follow them. There is no "sticky at the bottom, free when scrolled up" behaviour.

## It was built once, and three records say it still works

- **2026-09-15, `83b20bd`.** The Architect asked for two behaviours; both shipped. On transcript growth, `reveal.ts` scrolled to the new tail only if the user was already at the bottom, and left them alone if they had scrolled up. Each pane also saved `{scrollTop, atBottom}` per view (`_scrolls`, `termScrollRef`, `revScrollRef`), so switching terminal ↔ reveal kept the position.
- **Sprint 075 (closed 2026-09-24)** planned to carry this into the React transcript. Its invariant: "With `anchorSeq === null`, the transcript auto-scrolls to bottom on new envelopes as it did in `reveal.ts:117-138`." Its done criterion: "Sticky-bottom behaviour survives when the user has not scrolled up."
- **Sprint 076 (closed 2026-09-24, `4deccee`)** deleted the `reveal.ts` sticky-bottom block "superseded by `useScrollAnchor`", and the per-view scroll save with it.
- **Sprint 092 (2026-10-01)** wired `useScrollAnchor` into `Transcript.tsx` and `Row.tsx` and recorded "Sticky-bottom terminal pinning" as done.

## What the code does

Nothing in the web code has scrolled a transcript to the bottom since `4deccee`. `grep` for `scrollTop`, `scrollHeight` and `scrollIntoView` across `web/` finds three uses, none on a transcript: the session-list load-more handler, the prompt textarea's auto-grow, and the stream↔graph scroll sync in side mode (`reveal_component.ts:2165-2177`).

`useScrollAnchor.ts` cannot provide follow-bottom as written:

- `updateAnchor` runs on every scroll event and once at mount, sets `stickyRef.current = false`, and always picks the topmost visible row as the anchor. Nothing reads `stickyRef`.
- `restoreAnchor` does nothing when the anchor is null. The anchor is seeded at mount and never cleared, so the hook holds the topmost row in place forever. New rows land below it and the view stays put.
- Its comments hand the job back: "Sticky-bottom is dc-runtime's job (reveal.ts:135-155)" and "The dc-runtime sticky-bottom autoscroll in reveal.ts:117-138 handles the 'keep at bottom on new envelopes' case." Sprint 076 deleted that code the same day. `Transcript.tsx`'s header says the same thing ("stays sticky-bottom via reveal.ts's existing autoscroll"). `reveal_component.ts:2159-2163` points the other way: "The atom transcript React tree at web/reveal/transcript/ owns scroll position now."

The per-view scroll save of 2026-09-15 has no replacement either.

## Why it happened

1. **Each side handed the job to the other.** The hook's author left follow-bottom to `reveal.ts`. Sprint 076's author deleted `reveal.ts`'s code because the hook supersedes it. Both read the other side's intent, not its code. One `grep` for a remaining `scrollTop` write would have shown that no code was left.
2. **Sprint 075 changed shape and dropped an invariant without saying so.** The caret-pin problem was solved with native `<details>`. The closing note says the hook "sits on disk unimported" and lists the defects fixed instead; it never mentions the follow-bottom invariant or the done criterion again. Neither was ever checked. The observation contract drove only `caret_pin` (scroll to the middle, click, measure).
3. **Sprint 076 cited a superseding component that its predecessor had just declared unused.** The contradiction sat in two adjacent cards closed the same day.
4. **No gate measures follow-bottom.** No shakeout flow, pixel state or unit test asserts where the scroller sits after a row arrives. "17/17 flows, 81 tags green, 0 bugs" is true and says nothing about scrolling. Every gate since 2026-09-24 passed over this regression.
5. **Sprint 092 recorded behaviour it had not observed.** "Sticky-bottom terminal pinning" went into the board on 2026-10-01. Card 092c says the same day: "No observation contract ran."
6. **The 093–099 review did not catch it.** The review re-filed the 086b–092 bug list by practice class and checked each fix. Sprint 092's polish items, sticky-bottom among them, never got their own check, and the roadmap does not mention scrolling. I read "exists (uncommitted)" as a fact about behaviour; it was a fact about files.

## The classes

- **Dangling responsibility.** A duty assigned by comment to a component that no longer exists. This is the same shape as `delegate.py` catching an exception class the daemon never raised (Sprint 099), and as the two BLACKBOARDs.
- **Done criterion with no check.** SDD's dual contract requires every invariant to have an observation. 075's sticky invariant had none, so closing the sprint could not fail on it.
- **Removal justified by intent, not behaviour.** A safe deletion first proves the replacement does the job: run the check against the replacement, then delete.

## What a fix needs

- One owner for transcript scroll: the React transcript. A row arrival scrolls to the tail when the user was within a few pixels of the bottom just before it; otherwise the anchor holds the row being read. The caret-pin guarantee stays.
- The per-pane, per-view scroll save from `83b20bd`, restored in the React tree.
- A shakeout flow that measures it against a real session:
  - at the bottom, new rows keep the tail in view;
  - scrolled up, `scrollTop` does not move when rows arrive;
  - scrolling back to the bottom resumes following;
  - a view switch returns to the same place.

  The flow should run against the packaged app, like the rest of Axis A.
- The stale comments in `useScrollAnchor.ts` and `Transcript.tsx` corrected, and the dead `stickyRef` removed or made real.
