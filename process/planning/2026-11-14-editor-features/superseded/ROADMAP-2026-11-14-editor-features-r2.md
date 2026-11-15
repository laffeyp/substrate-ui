# Roadmap — the editor's missing features (round 2)

*2026-11-14. Supersedes `superseded/ROADMAP-2026-11-14-editor-features-r1.md`. Round 2 adds E2, the editor's multi-pane scenarios tested end to end (the Architect, 2026-11-14: "those end-to-end tests have probably never been run, and we can run them SDD style and make it like totally legible"); round 1's E2–E6 become E3–E7, cards 501–505. Each card is built, checked on its bundle and installed into Substrate (runbook r10 chapter 5); this session runs in Substrate Next, so installing Substrate leaves it running. When E7 closes, the roadmap's work rolls up to Substrate Next (runbook r10 5A: steps 1–16 from here, 17–20 from a terminal or from Substrate).*

| # | Item | Card |
|---|---|---|
| E1 | Each pane's editor keeps its own tabs (bug) | 499, closed |
| E2 | The editor's multi-pane scenarios tested end to end; editor gates in the chained suite | 500 |
| E3 | A tab's menu; Markdown rendered from it; ⌘-click opens a link | 501 |
| E4 | Splitting the editor: ⌘D, ⌘⇧D, the tab menu, drag across, up to 3 × 3 | 502 |
| E5 | Tool output formatted | 503 |
| E6 | A tool's summary shows two or three lines | 504 |
| E7 | Close: what is still missing, read again; gates on the bundle | 505 |

Order: E2 before E4, since splits put several editors in one pane and the scenarios then extend to groups.
