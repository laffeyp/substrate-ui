# Post-mortem — Sprint 057 tool-panel formatting, reverted 2026-09-23

## What happened

Sprint 057 was booked and executed in one sitting: added `ansi_up`,
`highlight.js`, `diff2html`; wrote `web/vm/tool_panel/{ansi,line_gutter,
hljs_lazy,diff_lazy,render}.ts`; wired a `data-panel-key` registry
into the reveal template so the tool cards' streaming and output
panels, plus every model-reply fenced code block, would render
through content-typed renderers instead of a single `pre-wrap`
`<div>`. Smoke green. Bundle grew 32 KB → 51 KB gzipped. Chrome
reload showed the tool-card headers, the wrap toggle, the `args`
list, the `streaming · eof` and `output` labels — and empty
boxes underneath. Zero rendered bytes in the panels that were the
whole point of the sprint.

Sprint reverted to `HEAD` on `main` (commit `e2a04ee`). Kept: the
harness port-guard from `ServerHandle.start()`, the caret three-
state fix in the card header, this sprint card, and this file.

## Why it did not work

The chosen wiring was a runtime post-render walk keyed by
`data-panel-key`. The row provider stashed `{ toolName, role,
text, wrap }` under a stable key in `window.__panelData`; the
template rendered an empty `<div data-panel-key="{{ row.streamingKey }}">`;
a `MutationObserver` on `#dc-root` plus a per-`subscribe`
`requestAnimationFrame` fired `renderPanels(document)` after each
React commit; `renderPanels` walked `[data-panel-key]` and stuffed
`innerHTML` from the registry.

The panels stayed empty. Three plausible failure paths, none
verified against the browser:

1. **Interpolation on `data-*` attributes.** `support.js`
   compiles every attribute value with `compileAttr` and pushes
   `[key, compileAttr(value)]` into `propGetters`, which React
   sets as props. React does preserve `data-*` on HTML elements,
   so this should have worked. It may not have. I did not confirm
   the rendered attribute value in the browser.
2. **Timing.** The row provider writes to `window.__panelData`
   during dc-runtime's evaluation of the template; the
   `MutationObserver` fires after React commits; the observer
   handler `requestAnimationFrame`s the paint. If dc-runtime does
   any speculative render that clears the registry between the
   write and the observer's read, the lookup misses. I did not
   trace this.
3. **The dataset accessor.** First cut used `el.dataset.panelKey`;
   the revert-in-flight switched to `el.getAttribute("data-panel-key")`
   without a test between them.

The common cause under all three is the same: I did not run the
change in a browser before declaring it done. I ran `npm run
smoke:vm`, which drives the controller through the `NodeSubstrateClient`
and validates signals — a controller-level smoke, not a DOM-level
one. The panels never render in `vm_smoke`. The observation
contract for a DOM change is a Chrome load; I skipped it.

## What went right

- The port-squatter that corrupted the 2026-09-22 shakeout got
  caught, named, and fenced in `ServerHandle.start()`. That
  guard survives the revert.
- The caret three-state fix on `bindToggleTool` survives too:
  a click on a visibly-open card now sets `false` explicitly
  instead of clearing the flag and letting auto reopen it. The
  bug the user found in the bash tool card is closed.
- The `hasAnsi` + `stripAnsi` regex is trivial and, alone, would
  have solved the visible-tonight problem for bash output. That
  path was there for one commit, then discarded when I chose to
  ship the whole sprint.

## What this cost

- ~40 minutes of implementation and revert.
- One user-visible regression (empty panels) reloaded into the
  live browser during the session.
- Trust in the harness's smoke-only signal. The smoke passed;
  the shell was broken.

## Rules that would have caught this

1. **The observation contract for a DOM change is a real
   render, not a controller smoke.** If a sprint touches the
   template, the observation is a Playwright drive with an
   assertion on the rendered content — the shakeout has the
   plumbing for this already (`harness/shakeout/`). Adopt as a
   hard rule: every sprint that edits `web/reveal.html` closes
   only after one shakeout flow renders the panel and reads a
   non-empty inner element.

2. **A cheap fix first, always.** ANSI stripping is one regex.
   It solved the reported bug. Shipping the regex first, then
   returning to the bigger sprint against a green shell,
   separates "the bug is fixed" from "the ambitious rework is
   right." I collapsed them and both failed together.

3. **Investigate dc-runtime interpolation on `data-*` before
   depending on it.** Ten seconds in the browser
   (`document.querySelector('[data-panel-key]').outerHTML`)
   would have told me whether the attribute rendered with the
   interpolated value or with the literal `{{ ... }}`. The next
   attempt at this sprint begins there.

## Follow-up

- Sprint 057 stays booked in `process/sprints/`, marked here as
  attempted+reverted. Next attempt: verify `data-*` interpolation
  in a running browser first; if it works, keep the current
  architecture; if not, use React refs via a dc-runtime
  `sc-mount` extension or drop dc-runtime for the tool card
  subtree.
- Add a Playwright flow `harness/shakeout/tool_bash_render.ts`
  that opens the reveal shell, sends a bash turn that produces
  ANSI output, opens the tool card, and asserts the streaming
  panel's `innerHTML` contains at least one `<span style="color:`.
  Book this as a prerequisite for the next Sprint 057 attempt.

## Retirement provenance

- Revert commit: on `main`, following `e2a04ee`. Files restored:
  `web/reveal.html`, `web/reveal.ts`, `package.json`,
  `package-lock.json`. Directory removed: `web/vm/tool_panel/`.
- The port-guard change to `harness/shakeout/lib/server.ts`
  stays: unrelated to the panel work, catches a distinct class
  of test corruption.
- The caret three-state fix in `web/reveal.html:1055-1068`
  stays: closes the "bash card cannot be minimized" bug the
  user reported earlier this session.
