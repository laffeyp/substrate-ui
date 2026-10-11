# Sprint 122 — /dellm

```yaml
---
id: 122
status: closed
closed_at: 2026-10-10
phase: 1
pass_kind: functional
roadmap: substrate/process/planning/ROADMAP-2026-10-10-default-guidance.md
asked: 2026-10-10 (Architect)
---
```

## why

The skill can be asked for only through the model; the operator needs a direct way.

## scope

- `/dellm` in the slash table injects `SkillRequested{name: "dellm"}`; the text after it becomes the turn's message.

## checks

- `/dellm <paragraph>` in the installed app returns it rewritten, with the skill fragment on the record.

## result

- **Built.**
  - `POST /api/session/<id>/turn` takes an optional `skill`. It must be a non-empty name and a single path component, or the call gets a 400. The turn's `UserMessage` carries `slash_source = "skill:<name>"`.
  - The UI's slash table has `/dellm <text>`. It sends the text with `skill: "dellm"`; bare `/dellm` sends "Apply the dellm skill to your next reply."
  - The card's injected `SkillRequested` is not built (§ P.10): the request rides the message.
- **Test.** `test_dellm_slash_122.py`, 2 tests: a `dellm` turn records `skill:dellm`, the skill fragment comes before the first `PromptComposed`, and the prompt carries the skill; `../etc` is refused.
- **Checks** (targeted): 2 passed; `tsc` is clean. The installed-app check runs on the end-of-roadmap build.

- **Installed-app check (end of roadmap, 2026-10-10).** Build from the working tree: signed, not notarized, verification build. All 11 Electron gates pass. The `session_prompt_once_across_restart` gate first failed because it read raw JSONL and `standard` makes `PromptComposed` large enough to be a blob; the gate now resolves blobs and reports 7 fragments, written once and reused after a restart. Session `s_971d2e719c47407b8d8f052a`, on the app's own daemon, in a scratch git repo: a turn with `skill: dellm` wrote the `skill` fragment (seq 42) before its prompt, the prompt carried the skill, and GLM answered "The sentence carries no fact. It names no solution, no mechanism, no outcome…".
