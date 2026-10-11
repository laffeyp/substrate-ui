# Sprint 123 — Driver slash commands pass through

```yaml
---
id: 123
status: closed
closed_at: 2026-10-10
phase: 1
pass_kind: functional
roadmap: substrate/process/planning/ROADMAP-2026-10-10-default-guidance.md
asked: 2026-10-10 (Architect)
---
```

## why

A `/` line in the prompt goes to Substrate's own slash table. A harness driver has slash commands of its own, such as Claude Code's `/context`, and nothing can reach them. The Architect asked for a small, general pass-through, dropped for any driver where it isn't feasible.

## found before the card (2026-10-10)

- `claude -p "/context"` runs the command locally, with no model turn and no tokens, when the prompt starts with `/`.
- `--disable-slash-commands` blocks it ("/context isn't available in this environment"). Without that flag, but with `--tools "" --strict-mcp-config --setting-sources ""`, `/context` lists only the 11-token system prompt and no skills or memory, so the other three flags keep the machine's setup out. The Claude profile (U120) drops `--disable-slash-commands`.
- `/context` through the profile is also a direct check that the driver is switched off.
- `codex exec "/status"` handled nothing locally: it sent the line to the API as a prompt, which returned 401 because Codex is not logged in on this machine. `cursor-agent -p "/help"` stopped at "Authentication required". Neither gets `slash_commands` until K279 probes them logged in.

## scope

- A prompt line starting with `//` sends the rest, with one `/` removed, to the driver as a call of its own: the driver profile's command and flags plus that text, outside the composed prompt.
- Two events record it: `DriverCommand{text}` and `DriverCommandResult{output, ok}`. Neither enters the model's history.
- Only drivers whose profile sets `slash_commands = true` take it (`claude` today). Any other driver answers with one line: "This driver has no slash commands."

## checks

- `//context` in the installed app shows Claude's context report, with the pair of events on the record and no model turn.
- `//context` on an Ollama session shows the one-line refusal.

## result

- **Built (§ P.11).** The pass-through rides the turn's `UserMessage` with `slash_source = "driver"`, for the same reason K274 and K277 did: a parked session takes only a `UserMessage`. The card's `DriverCommand` and `DriverCommandResult` were not needed.
  - **Model step:** a driver turn sends the text as written; `PromptComposed` holds exactly that, and `ModelReply` holds the answer.
  - **Composer:** it drops driver turns from history (`is_driver_turn`), and `turn_cost` prices them at 0.
  - **Daemon:** `/turn` takes `driver_command: true` only when the profile sets `slash_commands` (today `claude`), and the text must start with `/`.
  - **UI:** `submitLine` sends any `//` line that way.
- **Test.** `test_driver_slash_pass_through_123.py`, 2 tests:
  - `deterministic` refuses with "has no slash commands";
  - with a stand-in driver, `/context` goes out alone and the record holds it with empty `system`. The next turn's prompt holds neither the command nor its output.
- **Checks** (targeted): 4 passed with U122's test; `tsc` and `mypy --strict` are clean. Live `/context` through the profile is U120's gate; the installed-app check of `//context` runs on the end-of-roadmap build.

- **Installed-app check (end of roadmap, 2026-10-10).** Build from the working tree: signed, not notarized, verification build. All 11 Electron gates pass. The `session_prompt_once_across_restart` gate first failed because it read raw JSONL and `standard` makes `PromptComposed` large enough to be a blob; the gate now resolves blobs and reports 7 fragments, written once and reused after a restart. Session `s_971d2e719c47407b8d8f052a`, on the app's own daemon, in a scratch git repo: `//context` on the Claude driver recorded a `PromptComposed` of exactly `/context` with empty `system`; Claude answered with its context report (10 tokens, no system prompt, no memory or skills). A driver turn skips the change check, so the switch back to Claude is recorded on the next ordinary turn.
