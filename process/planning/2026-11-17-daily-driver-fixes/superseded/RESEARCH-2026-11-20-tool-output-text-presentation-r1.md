# Research — tool-output text presentation (round 1)

*2026-11-20. Scope: how the panes draw a tool call and its result today, what the well-known agent terminals draw instead, and what the gap is. Carries roadmap `2026-11-17-daily-driver-fixes` E3 forward. Written during the 2026-11-18 freeze on new development (`BLACKBOARD` 2026-11-18 user); research and documentation, not a build.*

---

## 1. What the pane draws now

A tool call is one transcript row. `Row.tsx` dispatches `role=tool` to `ToolCard` (`web/reveal/transcript/Row.tsx:107`), which draws a `<details>/<summary>` disclosure: a caret, the tool name, a preview, a status word, and a body that opens and closes (`web/reveal/transcript/ToolCard.tsx:162`). The card opens while its tool runs and closes when the result lands, unless clicked (`defaultOpen`, `web/vm/tool_output_mode.ts:76`).

Two presentations exist, picked in Settings › tool output (`web/app/Dialogs.tsx:80`), stored on `web/vm/tool_view.ts`:

- **`cards`** — the default (`web/app/state/settings.ts:47`). The open body is an `args` label, then one boxed inset per argument, then a `streaming` box, then an `output` box, then a footer line reading `call_id … · step … · ok · N bytes` (`ToolCard.tsx:240`–`296`). Each inset is `background: #1a1c20`, `borderRadius: 5`, `maxHeight: 220`, `overflow: "auto"` — a scroll pane inside the scroll pane (`ToolCard.tsx:262`, `:274`; `ProgressStream.tsx:31`).
- **`text`** — sprint 517, the daily-driver E3 build. The summary line, then one `data-tool-plain` block: a write or edit's body first, then the stream while the tool runs and the result when it lands, one element across the boundary (`ToolCard.tsx:219`–`238`). No args box, no footer. But the block is still `background: #1a1c20`, `borderRadius: 5`, `maxHeight: 220`, `overflow: "auto"` (`ToolCard.tsx:220`–`233`), and the summary above it still clamps to three lines (`WebkitLineClamp: SUMMARY_LINES`, `ToolCard.tsx:35`, `:194`).

Both modes format the text well — sprints 505–512 parse code in the editor's languages and palette, lay out JSON, draw diffs by file, grep hits by run, a read's line numbers in a gutter, and ANSI through the login card's terminal model (`web/reveal/transcript/ToolText.tsx`; `web/reveal/tool_format.ts`). The formatting is not the question; the container is.

**The "little windows" are the boxed insets.** A `cards` call draws up to four of them stacked under the row: one per arg, one for the stream, one for the output, each a rounded dark box that scrolls its own contents inside a 220-pixel cap. The `text` mode drops the args and footer but keeps one such box. Model replies draw their own boxed insets too — a fenced code block is `background: #1a1c20`, `borderRadius: 6` (`web/reveal/transcript/ModelReply.tsx:46`).

## 2. What the comparison products draw

The request names Ghostty, iTerm, "any terminal," and Claude Code together. They are two different things, and the distinction decides the target.

**Ghostty and iTerm2 are terminal emulators.** They render a PTY byte stream into one character grid. There is no per-command box and no structure; a program prints bytes, the emulator paints cells, old lines scroll off. Both bound the scrollback: iTerm2 keeps a set number of lines above the screen and warns that the unlimited option can grow "possibly using all available memory" ([iTerm2 docs](https://iterm2.com/documentation-preferences-profiles-terminal.html)); Ghostty bounds by a byte budget, default about 10 MB, and declined to raise it ([Ghostty #8593](https://github.com/ghostty-org/ghostty/discussions/8593), [#12357](https://github.com/ghostty-org/ghostty/discussions/12357)). Neither keeps everything.

**Claude Code in the terminal is not the emulator — it is a TUI painting its own cells inside one.** Its tool output is structured, not a raw dump: a result collapses to a preview with a `+N lines (ctrl+o to expand)` carve-out, the threshold hardcoded, `ctrl+o` switching to a detailed transcript ([claudeissues 12589](https://claudeissues.com/issue/12589-feature-configurable-output-collapse-threshold-number-of-visible-lines-before-n), [25776](https://claudeissues.com/issue/25776-feature-request-setting-to-auto-expand-tool-output-default-verbose-mode)). A maintainer's stated reason for the collapse: rendering a large amount of output at once tears and stutters on slow terminals ([claudeissues 17092](https://claudeissues.com/issue/17092-bug-bring-back-the-ctrl-s-to-minimize-or-expand-command-and-tool-output)). So Claude Code truncates long output by design, the same way the emulators cap scrollback.

**The target is Claude Code's shape, not a terminal.** Substrate reads a session record — typed `ToolCall` and `ToolResult` envelopes — not a PTY stream (`Transcript.tsx:112`, the call and result folded by `callId`). It can never be a terminal emulator and does not want to be: the command and its output arrive already separated and typed, which is the thing a terminal has to parse back out of a byte grid. Matching Claude Code is therefore easier for Substrate than for a terminal, not harder. "Exactly like a terminal" is the wrong frame; "the command, then its output below in one scroll, collapsible, with a carve-out for long output" is the right one, and it is what Claude Code does.

## 3. The gap, as a design judgment

The pane's job, from `README.md`, is to make a stochastic run visible and legible. A boxed inset with its own 220-pixel scroll works against that in three specific ways:

- **It fragments one stream into many frames.** A reader following a run reads down a single column in Claude Code and in a terminal. In `cards` the eye crosses four box edges per tool call and meets a scrollbar that is not the pane's. Output longer than 220 pixels is hidden behind an inner scroll the reader must find and drive, inside a page that already scrolls.
- **It hides the output the run turns on.** A bash result taller than 220 pixels shows a dozen lines and traps the rest. The run's actual work — what the command printed — is the thing least visible.
- **It reads as chrome, not as a log.** The rounded dark box, the `args`/`output`/`streaming` labels, and the `call_id … · N bytes` footer are a widget around the text. A terminal and Claude Code show the text itself.

The correct shape is one continuous column: the command on its line, its output directly below on the pane's ground, no box and no inner scroll, each call collapsible from its summary, and — for output past a bound — a preview with a `+N lines` control that expands in place. This is the Claude Code shape, Substrate's envelope structure makes it the natural one, and the roadmap's standing rule keeps it an option beside `cards`, never an overwrite (`BLACKBOARD` 2026-11-17 user: "this will always be like default substrate … different skins").

## 4. This is already specified, as `raw`

The loop the request describes has run once already. Sprint 517 shipped `text`; the Architect judged it in the installed build on 2026-11-17 and rejected it as not minimal enough (`BLACKBOARD` 2026-11-17 user, line 1929):

> "its not as good as i thought. Cards is better … we didn't go minimal enough." The second presentation becomes `raw`: the command's full line, then its output as bare text one line down — no box, no background, no scroll cap, no footer, and no three-line clamp ("Nothing gets truncated … it's still truncated in three lines when I expand it").

That is the request, in the Architect's own words, written three days before it was asked again. It was earmarked as a sprint, then displaced: on 2026-11-18 the Architect froze new development to chase the core session stalls (`BLACKBOARD` 2026-11-18 user), and sprint 518 went to the interrupt-pending bug (`process/sprints/sprint-518-interrupt-pending.md`) instead of the `raw` view. `raw` is specified and unbuilt. `TOOL_VIEWS` today is `["cards", "text"]` (`web/vm/tool_view.ts`); `raw` is not yet a value.

Building it is three edits against what sprint 517 already laid down: add `raw` to `ToolView`; in the `raw` branch of `ToolCard`, drop the `#1a1c20` background, the `maxHeight`/`overflow` cap, and the footer, and remove the `WebkitLineClamp` from the summary so the command line shows whole; add the chip to Settings. The sprint-505–512 formatting stays, as E3 requires.

## 5. One correction to the spec: a carve-out, not "nothing truncated"

The `raw` spec says nothing gets truncated. Every product in the comparison truncates: Claude Code collapses to `+N lines`, iTerm2 and Ghostty cap scrollback, and iTerm2's own docs name unbounded scrollback as the path that uses all available memory. Keeping everything is the one thing none of them do.

And keeping everything is the current core bug, not a style preference. The window-productionizing research of this week (`process/planning/2026-11-18-window-productionizing/RESEARCH-2026-11-20-window-productionizing-r3.md`) finds the grey screen and a V8 out-of-memory flattening the stream's text when the window holds and redraws a 20,000-line stream (its F2), and the kernel posting one writer cycle per stdout line onto the run's single inbox (its F1). An uncapped `raw` block draws every line of a 20,000-line output into the DOM at once — the exact load that research names as the freeze. The transcript already windows its rows (`Transcript.tsx:46`–`99`, only rows near the viewport hold DOM nodes), but a single tool call's body is one row; an uncapped body defeats the windowing from inside.

So `raw` should carry a bounded preview with a `+N more lines` control — the Claude Code carve-out — rather than no cap. This satisfies the request's own second instinct ("some carve-outs for extremely long output"), matches every comparison product, and keeps the minimal view off the OOM path. The bound is a measurement to set from the real apps' windows, as E2 sets line-spacing; Claude Code's collapse threshold and a terminal's lines-per-screen are the anchors. "No box, no background, no footer, no three-line clamp on the command" all hold; only "no cap" changes, to "a cap that expands in place."

## 6. Status and what a card would need

- E3's `text` option is built and installed (sprint 517, build 1794976292). `cards` is the default.
- The `raw` view is specified (`BLACKBOARD` 2026-11-17) and unbuilt; it carries no sprint since the 2026-11-18 freeze.
- New development is frozen until the core stalls in `process/reviews/REVIEW-2026-11-18-esc-interrupts-and-session-stalls.md` are tracked down. The `raw` view touches the same unbounded-output path as those stalls (§5), so it is not independent of the freeze — the carve-out is part of the same question as F1/F2, not a feature to add around them.
- When the freeze lifts, the card is `ToolCard.tsx` and `web/vm/tool_view.ts` and `Dialogs.tsx`, two files of substance plus the setting, under the sprint sweet spot. The observation contract is the one `tool_output_text` already runs (`harness/shakeout/`): a `raw` call draws zero boxes, the command line whole, the output on the pane's ground, and a long output showing its preview and its `+N` control.

---

*Round 1. The current draw, the products' draw, the gap as one continuous column, the already-written `raw` spec, and the one correction the products and the core-stall research force: a bounded carve-out in place of "nothing truncated."*
