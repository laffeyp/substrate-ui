# Sprint 057 — tool-panel formatting (ANSI, line-gutter, wrap, lazy hilighter)

Opened 2026-09-23.

## Why

The tool-card panels in the reveal shell render every panel as raw
`pre-wrap` monospace on `#7fb3b8`. Three concrete failure modes,
visible in a real session tonight (bash + read_file):

1. Bash's streaming pane shows ANSI escape codes literally
   (`[36m`, `[32m`, `[2m`) instead of colour. Vite build output
   was unreadable.
2. `read_file` output arrives as `line_no<TAB>content` per line;
   the panel glues them into one flow with no gutter. The user
   cannot follow which line is which without counting.
3. Long lines wrap arbitrarily; there is no per-panel wrap
   toggle, so the user cannot force horizontal scroll for code.

None of this is novel. GitHub Actions, VS Code, Jupyter, GitLab
and Sourcegraph all solved it with the same three moves:

- ANSI escape codes → HTML `<span style="color:...">` via
  `ansi_up` or `anser`.
- Per-tool renderer (bash / read_file / edit_file / everything
  else) rather than a single `pre` block.
- Wrap-vs-scroll toggle in the card header.

## Scope

Five changes, one file (`web/reveal.html`) plus a new
`web/vm/tool_panel/` folder:

1. **ANSI.** Add `ansi_up` as a dev dep. On any streaming or
   output text containing `\x1b`, run it through `AnsiUp.ansi_to_html`
   and render the result as `innerHTML` inside the panel. Everything
   else stays plain text.

2. **Line gutter for `read_file`.** When `row.toolName ===
   "read_file"`, split the output on `\n`, split each line on the
   first tab into `[lineNo, content]`, render a two-column flex:
   right-aligned dim `#4a4e55` gutter, monospace content column
   with `white-space: pre`. Horizontal scroll on the content
   column only.

3. **Wrap toggle.** Add a `⇥ wrap` / `⤶ nowrap` button in the
   card header (next to the caret). Toggles the panel's
   `white-space` between `pre` and `pre-wrap`. Default: `pre-wrap`
   for prose tools, `pre` for `read_file`, `bash`, `edit_file`.

4. **Lazy `highlight.js`.** When the tool is `write_file` or
   `edit_file`, or the output starts with a fenced code block, use
   `import("highlight.js/lib/core")` + the language modules for
   ts, js, py, json, html, css, md, sh, yaml. Fires on first card
   open, cached after. Bundle stays 50 KB gzipped; opens grow it.

5. **Lazy `diff2html`.** When the tool is `edit_file` or
   `apply_patch` and the output looks like a unified diff (starts
   with `--- ` / `+++ `), use `import("diff2html")` to render
   side-by-side or unified, matching the current wrap toggle.

## Contract

- `web/vm/tool_panel/render.ts` exports one function:
  `renderToolPanel({ toolName, text, kind }): HTMLElement`
  where `kind` is `"args" | "streaming" | "output"`.
- Every case-branch is a switch on `toolName` with a `default`
  that returns a `<pre>` matching today's rendering. New tools
  never regress; they just do not get the fancy path.
- Rendering never runs SDD emits or fetches. Pure text-to-DOM.
- No global state; the wrap toggle is a per-card React-ish state
  entry keyed by `callId`.

## Observation contract

- `harness/vm_smoke.ts` gains one step: build a fake
  `bash` ToolResult with an ANSI-coloured payload, pass it
  through `renderToolPanel`, assert the returned element has
  no literal `\x1b` byte and at least one `<span style=`.
- `harness/shakeout/tool_bash.ts` asserts the same on the live
  card.
- Signal vocabulary unchanged.

## Bundle budget

- `ansi_up` in the base bundle: current 50 KB → target ≤ 55 KB
  gzipped.
- `highlight.js` and `diff2html` lazy-loaded; a card open of the
  right type triggers the fetch; both cached.

## Out of scope

- Search inside a panel. Cmd+F on the DOM is fine.
- Terminal-emulator features (cursor addressing, clear-screen).
  `bash` output is a log stream, not a live terminal.
- Server-side rendering. Every renderer runs in the browser.

## Risk

- `ansi_up` writes `innerHTML`. The source is a tool's stdout, not
  a user's text; a hostile bash output could theoretically inject
  HTML. Mitigate by calling `AnsiUp.escape_for_html` before
  colour substitution (it is on by default in v6).

## Cards this closes

None open yet. This is the first sprint on formatting.

## Files touched

- `web/reveal.html` (panel rendering call site)
- `web/vm/tool_panel/render.ts` (new)
- `web/vm/tool_panel/ansi.ts` (new; wraps `ansi_up`)
- `web/vm/tool_panel/line_gutter.ts` (new)
- `web/vm/tool_panel/hljs_lazy.ts` (new)
- `web/vm/tool_panel/diff_lazy.ts` (new)
- `package.json` (add `ansi_up`, `highlight.js`, `diff2html`)
- `harness/vm_smoke.ts` (assertion)
- `harness/shakeout/tool_bash.ts` (assertion)
