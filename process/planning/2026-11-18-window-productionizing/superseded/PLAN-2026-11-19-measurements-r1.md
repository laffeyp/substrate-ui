# Plan — measuring the window as it is used (round 1)

*2026-11-19. The Architect, the same day: the project is tested well for behaviour but has none of the tests that would expose memory and responsiveness problems at once, "especially long tasks and input delay in normal use"; the research is not done until these are researched, taken, and folded into it. This plan says what is researched, what is measured, how the measurements become gates, and where the results land. The research note `RESEARCH-2026-11-19-window-productionizing.md` stays as written; the results go into its second round. The roadmap's W-items wait for that round, except W1, whose gate is the first of these tests.*

## What the project has, and what it lacks

The project's checks are behavioural: 443 Python tests (sprint 519's run), 255 client specs (sprint 522's), and 166 gate scripts in `harness/shakeout/`, 134 of them named in `package.json`, that drive the window and read its trace. Each asks "did the window do the right thing". None asks "how long did it take, how much did it hold, did it hold more after an hour than after a minute". Every gate runs on a record of tens to hundreds of envelopes, so none could have seen a cost that grows with a session's length. That is the missing class: performance and resource tests, measured on sessions the size the app is used at, held to stated budgets.

## 1. Research first: the established practice for this class

Read from primary sources (the tool's own documentation, a standard, the source of an app that solves the problem, a published engineering account), each claim cited, vendor claims about their own tool taken as claims:

- **Responsiveness measures.** What the browser defines and how it is read in a page: long tasks (`PerformanceObserver` `longtask`), Long Animation Frames (`long-animation-frame`), Event Timing and Interaction to Next Paint for input delay; the thresholds the sources give (the 50 ms long task; the INP bands) and whether they are meant for a desktop app's window as for a web page.
- **Memory measures.** Chrome DevTools' memory guidance: heap snapshots and their comparison, detached elements, the allocation timeline; `performance.memory` and `measureUserAgentSpecificMemory`; how the page's JavaScript heap limit is set under Electron (V8 pointer compression and its 4 GB cap, Electron's own setting); what `render-process-gone` reports for an out-of-memory death (`oom` against `crashed`), and why ours said `crashed`.
- **Memory outside the heap.** How to account for a renderer's working set beyond V8: Chromium's memory-infra dumps (and why ours returned no renderer dump), macOS `footprint` and `vmmap` on a pid.
- **Leak and soak testing.** How comparable projects find growth: Meta's MemLab (heap snapshots around a repeated action), VS Code's own performance and leak checks in its repository, Playwright's tracing; soak tests that hold a window open for hours.
- **Budgets.** How projects state and enforce them: performance budgets, per-scenario thresholds checked in CI, and how they avoid failing on noise (repeats, medians, a margin).

Output: a section of the research's second round, "The tests the project lacks", with sources.

## 2. Measure: today's build, as it is used

Scenarios, each written as a gate-shaped script, run on source and on the packaged Substrate Next build, every number taken more than once:

1. **Open a long session** (the gate of card 523): a hand-written record the size that killed the page, opened from a link.
2. **A live turn with a long stream**: a real turn whose command prints megabytes over minutes, the window following it.
3. **Typing while a turn streams**: keystrokes into the input bar during scenario 2, the delay from each key to its paint.
4. **Hours open**: a session that takes turns on a timer for an hour or more, the window left on it.
5. **Moving about**: switching panes, opening meta and the editor, scrolling up and back, during and after scenario 2.

For each scenario, the measures from § 1: long tasks and long frames (count, total, longest); input delay; the page's heap before and after a full collection; what holds it (a heap snapshot, compared at two sizes); the working set of every process (page, main, GPU, backend) and the page's beyond its heap (`footprint`); DOM nodes and detached elements; a rendering trace's split of script, style, layout and paint; the heap limit; for a death, the crash report's stated cause. And ⌘Q, sent as a real key, timed to `APP_QUIT_REQUESTED`, during scenarios 2 and 4 (it needs the screen; run when the screen is free).

Already taken, carried into the round as measured: the replay's working set and heap over time, its CPU profile (94.7 % in the scroll anchor's `place`), main's 4 ms round trip, the envelopes in flight, and the held-or-garbage run at 11,000 envelopes now running.

Output: a section of the research's second round, "Measured as used", every number with its scenario, build and run count.

## 3. Gates: the measurements that stay

Each scenario becomes a gate in `gates:electron` with a budget set from the research's thresholds and the measured baseline: a ceiling on long-task time and on the longest frame, on input delay, on the page's heap after a collection, on the working set, on growth per hour. A gate that fails says which budget and by how much. The budgets fail today; that is how the gates are known to see the problem. Recorded as decisions: each budget's number and its ground.

Output: the research's second round names the gates and budgets; the roadmap's second round puts them first, and every W-item's check runs them.

## 4. Where it lands

- `RESEARCH-2026-11-19-window-productionizing-r2.md`: round 1's findings, corrected where the measurements correct them, with the two new sections.
- `ROADMAP-…-r2.md`: the gates first, then the W-items, each item's check a budget.
- Card 523 is rewritten against the round-2 roadmap before it runs.
- Machine data stays on the machine: every gate makes its own record by hand; numbers, not contents, go into the documents.
