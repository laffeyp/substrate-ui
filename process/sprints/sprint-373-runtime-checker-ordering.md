# Sprint 373 — the runtime checker: the ordering rules within main and each window (INVARIANT_BROKEN)

```yaml
---
id: 373
status: closed
phase: SDD re-centre
pass_kind: architecture
---
```

## scope

Plan r3 item 5, first link of three. `electron/invariants.ts` is the runtime checker: main hands it every record it writes, its own and each window's, in the order it writes them, and a record that breaks a rule is followed in `main.jsonl` by `INVARIANT_BROKEN`. The payload is `{ rule, context: { state, recent } }`: the rule's id, the state the rule read, and the last 20 records, the breaking one last (foundation 01, assertion failures with context). This link checks the rules that need neither a clock nor another process:
- **S1:** main's first record is APP_BOOTED; each window's first is WINDOW_BOOTED.
- **S3:** a picker line comes after a folder armed.
- **S4:** a commit comes after the tone line, and the pane's next PANE_BOUND says how `picker`. A pane that closes, or commits again, before that bind breaks it too.
- **S5** (v0.21): a pane holds one session at a time. Its last ack or attach names that session, replacing any before it, and the pane's later row records name that session.
- **S6:** an open ack comes after its request.
- **S8:** a pane's turn names the session the pane last opened or attached.
- **E8:** a transcript that follows the bottom is at it.

Sprint 374 fixes a fault this checker found. Link 2 (sprint 375) adds the timing rules T1 and T3–T6. Link 3 (sprint 376) adds the rules across processes: T2, S7, S8's server half, S9, and the server's S1.

Readings of the rules, from the code:
- **S5:** v0.20 forbade a second ack or attach before SESSION_ENDED_LOCAL or PANE_CLOSED. The records page attaches another session into a pane that holds one (`attachExisting`), by design, and the first run of all source gates broke that statement three times: `view_signals`, `tool_output_toggle` and `both_session_shapes`. v0.21 (`P-0.21-S5-REPLACES`, `INVARIANT_PROPOSED`) states what the pane's records can show instead.
- **A pane's session lasts until its PANE_CLOSED; PANE_OPENED clears only the picker.** S3 says "since its last PANE_OPENED"; S5 and S8 say nothing of it. On a reload, `web/reveal.ts` writes pane 1's SESSION_ATTACH_STARTED before the App's mount writes pane 1's PANE_OPENED. The first gate run broke S8 twice on that order, in `graph_model_lane_on_resume` and `resume_after_two_ends`, because the checker cleared the session on PANE_OPENED. That was the checker's error. The order itself sets a session tag outside its pane's frame (Layer 3), and is logged as a fault.
- **S8:** a turn that resumes an ended session reopens the stream and writes no new attach (`session_controller.ts` `sendTurn`). So S8 reads the pane's last acked or attached session, not whether one is open.
- **S4:** `commitPane` binds the pane in the same handler, and the next React commit writes PANE_BOUND (`notePanes`). The session opens later, with the first message. So every commit is followed by its bind, and an open refused later does not touch S4. A first reading of this card held the opposite; the code settled it before the gate's last run.

Vocabulary v0.20 (`P-0.20-INVARIANT-RULE-IDS`): `INVARIANT_BROKEN.rule` also names an evidence constraint, because E8 names this checker as its enforcer.

## context_files

- `../sdd-kit-3/AGENTS.md`; `web/vm/signals/versions/0.19.json` (`state_transitions`, `temporal_invariants`, `evidence_constraints`, `INVARIANT_BROKEN`, `record_context`)
- `electron/main.ts` (`traceWrite`, `mainRecord`, `traceEmit`, `native:signal`); `web/vm/instrumentation/sdd.ts`
- `web/app/App.tsx` (the picker's emit sites), `web/vm/session_controller.ts` (open, attach, turn, end)
- `web/app/__tests__/build_commits.spec.ts` (how an electron module is unit-tested)

## signal contract

### Emits

- `INVARIANT_BROKEN` (`rule`, `context`)

### Invariants

- The checker changes no record and no behaviour; it adds records after the one that broke a rule.
- A record is checked whether or not its write succeeded.

## artifact contract

### Files created

- `electron/invariants.ts`; `web/app/__tests__/invariants.spec.ts`; `harness/shakeout/invariant_signals.ts`
- `web/vm/signals/versions/0.20.json`, `0.20-rationale.md`, `0.21.json`, `0.21-rationale.md`

### Files modified

- `electron/main.ts`; `web/vm/signals/unemitted.json` (empty); `web/vm/signals/proposals.json`; `versions/current.json` → `0.21.json`; the generated `signals.gen.ts` files and `signals_gen.py`; `package.json` (`gates:electron`)

### Command exit codes

`npx tsc -p electron --noEmit` 0; `npm run build` 0; `npm run test:unit` 0; `npm run signals` 0 (87 live tags named, 0 left); `gen_signals.py --check` 0.

## observation contract

`harness/shakeout/invariant_signals.ts`, from source and packaged:
1. Pane 1 picks the sandbox and the deterministic model, opens its session and sends one turn. `main.jsonl` holds no INVARIANT_BROKEN.
2. The gate plants, through `window.native.signal`, one sequence per rule on panes 903–924: S3, S4 (length line), S4 (bound how attach), S4 (closed before its bind), S5 (a row of the old session after a switch), S6, S8, E8.
3. `main.jsonl` then holds exactly eight INVARIANT_BROKEN, in that order, each for window 1 and its planted pane, its recent records ending with the planted record.

S1 is planted in the spec, because a window's first record is written before a gate can send one.

Every source gate is also a normal run. The run of all of them must leave no INVARIANT_BROKEN in any launch's `main.jsonl`; a temporary copy step in the harness's cleanup collects them, and it is reverted after the run.

Plants:
- the spec fails when S5 is not checked;
- the gate fails when main's window channel skips the checker.

## done criteria

A record from main or a window that breaks an ordering rule is followed in the trace by an incident naming the rule, with the state and the recent records; the app's normal runs break none.
