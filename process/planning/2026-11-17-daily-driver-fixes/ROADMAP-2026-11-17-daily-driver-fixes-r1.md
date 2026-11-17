# Roadmap — the daily-driver fixes (round 1)

*2026-11-17. The Architect, from the first days of Substrate Next as the working install (BLACKBOARD, the 2026-11-17 `user` entry; `process/BACKLOG.md`, "Daily-driver fixes (2026-11-17)"). Standing rule: an appearance change lands as an option beside the default, never an overwrite — "this will always be like default substrate and then we just be making like different versions different skins." The mechanism is the `LOOK` table (`web/app/derive/look.ts`, sprints 478 and 485) and the viewer settings (`web/app/state/settings.ts`). Each card installs into Substrate (runbook r10 chapter 5); Substrate Next takes the roadmap at its close.*

| # | Item | Card |
|---|---|---|
| E1 | The editor's ground takes the inset's colour. Today `#212327` (`Centre.tsx`, `EditorView.tsx`, `GROUND`); the panes' tool-output inset is `#1a1c20` (`ToolCard.tsx` lines 199, 212), the app's darkest background. | 516 |
| E2 | The text sits more compactly. Research first: terminal line-spacing theory and practice, measured from the real apps' own windows as each draws the same file (the Architect, 2026-11-11: "The measurements come from the real apps' windows"), Ghostty among them. Lands as new `LOOK` values, the old kept. Current values (`LOOK.new`): pane transcript 1.54, code 20 px on 13 px. | research, then a card |
| E3 | Tool output as plain text, the Claude Code shape: the command, then its text below on the dark ground; no args box; a streaming output and its result one text, drawn once. The formatting of sprints 505–512 stays. Lands as a Settings option beside the boxed card, which stays the default until the Architect judges the new shape in the installed build: "if it looks good, then it will become the default. If it doesn't, it will just become another option that we'll work off of again" (2026-11-17). | 517 |
| E4 | Streaming, and where the reader sits. Research first: how the CLI drivers stream (`claude --include-partial-messages`, Ollama's `stream`, Codex), extending the backlog's 2026-11-15 streaming entry. Two presentation asks on top of real streaming: text that arrives whole is drawn as if being written, at a settable speed; and the view holds the reader at the top of new text instead of flipping to the bottom (`web/reveal/transcript/useScrollAnchor.ts`; `process/planning/POSTMORTEM-2026-10-02-transcript-follow-bottom-regression.md`). | research, then cards |

Order: E1, E3, then the E2 and E4 research. E2 and E4 carry no cards until their research lands.

The close: E1–E4 done, the full suites once, the roll-up to Substrate Next by runbook r10 chapter 5A. Card 507 (the editor-features close) is its own roadmap's card and does not gate this one.
