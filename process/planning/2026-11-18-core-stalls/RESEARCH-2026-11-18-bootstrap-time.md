# Research — why a turn's bootstrap takes seconds (roadmap C4)

*2026-11-18. For `ROADMAP-2026-11-18-core-stalls-r1.md`, C4. Measured, then read.*

## Where the time goes

A copy of `s_7c1dab4e`'s record (11,882 envelopes), resumed with one message on a deterministic stand-in model in one thread under `cProfile`: 8.84 s for the bootstrap and the turn. 5.35 s of it is `tokenizers.Tokenizer.encode`, 1,174 calls, all from the session's history view. Reading the record and decoding its frames (`record/framing.py`, `record/record.py`) takes most of the rest, about 2 s.

## The cause

`TurnHistory.update` (`topologies/session/views.py`) runs for every event of a turn as the record is folded. Each call re-renders the turn so far and counts all of it: `self._turns[-1][2] = turn_cost(self._current)` and `self._turns[-1][3] = output_savings(self._current)`. A turn of n events is rendered and counted n times, so its cost grows with the square of its length. Before kernel K352 the count was `len(text) // 4`, which cost nothing; since K352 it is a tokenizer pass over the whole turn, every event. The bootstrap of every resumed turn pays it, and the longer the bootstrap, the wider the window in which an Esc stranded the turn before kernel K354 (research `RESEARCH-2026-11-18-core-stalls.md`).

## The fix

Count each event once, when it arrives: the view keeps the turn's running cost and its savings and adds the new event's rendered lines and its result's saving. The history renderer's per-event step becomes its own function, which `_render_turns` and the view both use, so the count is of the same lines the prompt holds. The counts can differ from a whole-turn count by the few tokens a tokenizer merges across a line break; the plan stays a function of the record, the same live and on replay.

## Not measured

The 4 min 1 s acceptance and 104 s bootstrap of `s_cd9b4cbe`'s turn 45 on a fresh boot (review § 2.1). That record is 5,033 envelopes in 46 turns, so its turns are long; the quadratic cost above grows with turn length. It was not profiled.
