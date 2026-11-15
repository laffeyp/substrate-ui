# Roadmap — continuing an agent's session in Substrate (round 3)

*2026-11-14. Supersedes `superseded/ROADMAP-2026-11-12-continue-a-session-r2.md`, whose E1–E7 are built (kernel 345–349, app 494–497). Round 3 adds two bugs found in use: the continued session `s_52bd6e73d1224d5cb6d04830` stopped at its turn 24, when Claude Code refused a prompt of about 1,028,535 tokens (limit 1,000,000) that Substrate had counted as 585,096, and it had never compacted. The Architect, 2026-11-14: "This is not a limitation. This is a bug … We either get it from Claude or we make our own count"; on the opening text, "It should have come in as literally part of the fucking conversation."*

## Items

**E8 — A harness driver's prompt is counted by what the model reports (kernel sprint 350).** Substrate counts a prompt at four characters per token; this conversation runs about 2.27. For a harness driver the history window's correction is fixed at 1.0 (`session/__init__.py` line 1119), because Claude Code reports one total for all its calls in a turn (19,274,765 tokens on turn 23). Each call in its stream reports that call's whole input (measured 2026-11-14: the first call 17,679 tokens, the closing total 35,439 for two calls). The first call's input becomes the turn's measured prompt size, and the window's correction comes from it.

**E9 — The continued conversation enters as history (kernel sprint 351).** It entered as opening prompt text (`continued_session`, § AD), which every prompt carries and compaction never touches: 1,422,933 characters on every turn. It enters instead as the session's earliest turns in its record (`UserMessage`, `ModelReply`, `HarnessToolCall`, `HarnessToolResult`), which compaction clears and drops as new turns come; writing them starts no model call.

## Order

E8, then E9. Then Substrate Next is rebuilt and this conversation continued again.
