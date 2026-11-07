# Sprint 358 — each received record entry drawn or skipped, with why (plan item 4, transcript)

```yaml
---
id: 358
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan item 4, the transcript area, first part: `TRANSCRIPT_ROW_DRAWN` and `TRANSCRIPT_ROW_SKIPPED`, so T4 can be checked. T4 says each `STREAM_ENVELOPE_APPENDED` is drawn or skipped on the same pane and seq within 1 s.

Files:
- `web/vm/session_controller.ts`: the envelope switch moved, unchanged, into `envelopeToRows`; skips noted after it;
- `web/reveal/transcript/Row.tsx`: drawn on mount;
- `web/reveal/transcript/Transcript.tsx`: tool results folded, and the pane and session passed to rows.

That is three files against hard rule 6's two. They are one concept and land together: a skip without its draw, or a draw without its fold, leaves T4 unanswerable. The scroll tag is split off to sprint 359. Vocabulary v0.12.

Design context (hard rule 8): no drawn output changes. Emits only, in effects after commit.

## signal contract

### Emits

`TRANSCRIPT_ROW_DRAWN`, `TRANSCRIPT_ROW_SKIPPED`.

### Invariants

T4.

## observation contract

`harness/shakeout/trace_files.ts`, normal run: the picker, "hello", the reply's row drawn; every `STREAM_ENVELOPE_APPENDED` met by a draw or skip on its pane and seq within 1 s; the reply drawn with the session's id.

Planted: rows of role model never drawn → T4 names `seq 22 ModelReply`.

## result

- **Built** as scoped; `unemitted.json` 24 → 22.
- **Commands.** `npx tsc --noEmit` 0; `npm run lint` 0; `npm run build` 0; `npm run test:unit` 194 passed; `npm run signals` 0 (v0.12; 66 emitted, 22 pending).
- **Gates from source**, each launched with the rejection check: `trace_files`, `transcript_follow`, `stream_follows_bottom`, `transcript_root_kept`, `resume_ended_session`, `both_session_shapes`, `tool_output_toggle`, `run_panes`, `delegate_pane`, `find_counts_transcript`, `app_view_delegate_lane`, `records_keys` 0.
- **Plant.** Model rows not drawn: exit 1, "T4: 1 of 41 received entries neither drawn nor skipped within 1 s: seq 22 ModelReply".

  The first attempt at the plant passed. It broke a lint rule (a raw kind string), `npm run build` failed with its output hidden, and the gate ran the previous bundle. It was rerun with a lint-clean plant and the build's exit code read.

  The gate's wait for the drawn reply no longer throws on its own, so a missing draw is reported by T4 with the entry named, not by a timeout.
- **Rubber Duck Pass** (the hello run, the window's file):
  - The local echo is drawn first (seq null, `local:UserMessage`).
  - The 41 received entries: drawn are `UserMessage` 17 (the echo remounted with its record seq), `ModelReply` 22, `Returned` 33 and `SessionEnded` 38.
  - Skipped `hidden_kind`: 34 bookkeeping entries (trigger firings, producer starts and ends, prompt fragments, `PromptComposed`, language profiles, termination matches, `SessionEndRequested`).
  - Skipped `other`: `SessionStarted` (4, shown in the header) and `RunFinalised` (40, no orphaned call).
  - Every one is settled within 3 ms of its arrival.
  - Observations: none in pairing, order, payload, timing or tone.
