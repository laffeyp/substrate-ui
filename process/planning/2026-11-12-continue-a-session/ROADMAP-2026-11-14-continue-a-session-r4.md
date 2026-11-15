# Roadmap — continuing an agent's session in Substrate (round 4)

*2026-11-14. Supersedes `superseded/ROADMAP-2026-11-14-continue-a-session-r3.md`. Its E9 is built (kernel 351). Its E8 is built (kernel 350) but answered the wrong question: it kept the four-characters-a-token count and corrected it with Claude Code's reported figure, and a session whose next call is refused never gets a reported figure. The continued session `s_52bd6e73d1224d5cb6d04830` still fails on its next message. The Architect, 2026-11-14: "We're not keeping any sort of guessing … We're counting it. We're keeping it somewhere"; and on bringing a session in, "It simply needs to go in as the actual session history itself. Then it can be compacted normally too."*

## What the code does now

Every size the history window plans with is `len(text) // 4` (`transcript.py`, `_CHARS_PER_TOKEN`, `_est_tokens`): each turn's cost, each tool result's saving, the head. A measured scale multiplies the history but not the head (`_prompt_input`), and is clamped to 1.0–4.0 (§ S.5). The drivers' exact counts reach the record after each call: Claude Code's first call (`first_call_prompt_tokens`, K350), Ollama's `prompt_eval_count`; Codex and Cursor report one total per turn. The opening text (session-open fragments) is in every prompt and is never compacted.

## Items

**E10 — Substrate counts Claude's tokens (kernel sprint 352).** Research: `RESEARCH-2026-11-14-token-counting.md`. Anthropic's earlier tokenizer (`claude-tokenizer`, MIT) counts every piece of text the window plans with, each turn, each tool result's saving and the head; a `claude` session multiplies it by 1.50, measured against Claude Code's exact counts on code and prose. The count replaces `len(text) // 4` everywhere. The tokenizer file ships inside the kernel; no network at run time. Each `PromptComposed` records its count; Claude Code's exact count stays on `ModelReply.usage`, so the record shows both for every call. The other drivers count with the same tokenizer and keep their measured correction (§ S.5) until each family's own tokenizer is built, as the research names them. Session vocabulary v0.22.

**E11 — A conversation brought in before v0.21 becomes the session's history (kernel sprint 353).** The record of a session continued under v0.19–v0.20 holds the conversation as one `continued_session` fragment. Its turns are in the session's `continued_session.json`. The history reads them from there as the session's earliest turns, oldest first, and the fragment leaves the opening text, so compaction drops those turns as it drops any.

**E12 — The continued session answers.** Substrate Next is rebuilt and reinstalled; `s_52bd6e73d1224d5cb6d04830` receives a message and answers, its `PromptComposed` count under the window and its `TranscriptCompacted` dropping its oldest turns.

## Order

E10, E11, then E12.
