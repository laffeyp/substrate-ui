# Sprint 002 — harness stubs + placeholder page + server route

---

## Frontmatter

```yaml
---
id: 002
status: closed
phase: 0
pass_kind: observation
---
```

## scope

Land the founding harness pair for terminal-v1 and the minimum surface it grades against: a placeholder `web/index.html` for the tab-bar shell to be built on; a static server route `/terminal-v1/` in `substrate-ui/server.py` so the parent server serves the new folder; two Playwright scripts (`harness/e2e_terminal_v1.js` for structural DOM assertion, `harness/capture_terminal_v1.js` for perceptual screenshot); two `npm run` entries in the parent `substrate-ui/package.json`. The stubs assert only that the placeholder loads and screenshots without error — no tab logic yet. This sprint proves the harness plumbing before any real assertion depends on it (Addendum A5 — repo-scoped, not `/tmp`; A4 — verify the observer).

## prerequisites

- Sprint 001 (founding artifacts) closed.

## context_files

- `../../sdd-kit-2/AGENTS.md`
- `../../sdd-kit-2/ADDENDUMS.md` (Addendum A1, A4, A5, A6, A7)
- `../../sdd-kit-2/TECHNIQUES.md` (§ Visual/UI + § Web/frontend)
- `../../design/terminal-v1/visual-redesign.md`
- `../../design/terminal-v1/sprint-plan.md`
- `WORKING_AGREEMENT.md`, `BLACKBOARD.md` (this project)
- `../harness/capture_scene.js` (source of the 30-line zero-dep PNG decoder to be copied)
- `../harness/e2e_console.js` (reference for Playwright boot + assertion shape)
- `../server.py` (the `_static` method + `WEB` constant at line 157 + `do_GET` routing at line 806)
- `../package.json` (the `scripts` block to extend)

## signal contract

### Emits

None from terminal-v1 (A9 — reader UI, no vocabulary). The harness scripts write to stdout via `console.log`; the placeholder page emits nothing.

### Consumes

- Parent substrate-ui's pinned `playwright` devDep (`../package.json` + `../package-lock.json`).

### Invariants

- The parent server continues to serve `/` (the existing console) unchanged.
- `substrate-ui/web/` is not edited.
- No file under `terminal-v1/signals/` (A9).
- Every screenshot the capture harness writes is under 2000 px in every dimension (A6).
- The harness never waits on `sleep` — it waits on real conditions (A4).
- The placeholder page has an accessibility identifier on its root element for the harness to gate on (leaves not containers per the propagation hazard).

## artifact contract

### Files created

- `substrate-ui/terminal-v1/web/index.html`
- `substrate-ui/terminal-v1/harness/e2e_terminal_v1.js`
- `substrate-ui/terminal-v1/harness/capture_terminal_v1.js`

### Files modified

- `substrate-ui/server.py` — add a `TERMINAL_V1` constant and a `/terminal-v1/` route branch in `do_GET` above the fallthrough to `_static`.
- `substrate-ui/package.json` — add two entries to `scripts`: `e2e:terminal-v1` and `capture:terminal-v1`.

### Content assertions

- `web/index.html` contains an element with `data-testid="terminal-v1-root"`.
- `harness/e2e_terminal_v1.js` boots via `chromium.launch({ channel: "chrome" })` and asserts a `data-testid="terminal-v1-root"` element is present.
- `harness/capture_terminal_v1.js` writes at least one PNG to `substrate-ui/terminal-v1/screenshots/` (created if missing) whose file size is > 0 and whose decoded dimensions are ≤ 2000 × 2000.
- `server.py` contains `TERMINAL_V1 = Path(__file__).resolve().parent / "terminal-v1" / "web"` and a `path.startswith("/terminal-v1/")` branch.
- `package.json` `scripts` object contains keys `e2e:terminal-v1` and `capture:terminal-v1`.

### Command exit codes

- `cd substrate && uv run python ../substrate-ui/server.py` boots without error (existing behaviour preserved).
- `curl -sf http://127.0.0.1:8765/terminal-v1/` returns HTTP 200.
- `cd substrate-ui && npm run e2e:terminal-v1` returns 0.
- `cd substrate-ui && npm run capture:terminal-v1` returns 0.

## observation contract

### UI driving steps

- Boot the parent server.
- `page.goto("http://127.0.0.1:8765/terminal-v1/")`.
- `page.waitForSelector('[data-testid="terminal-v1-root"]')`.
- `page.screenshot({ path: "screenshots/00-boot.png" })` — element-shot of the root, not full-page (A2 + A6).

### Expected screenshot / visual state

- One PNG in `substrate-ui/terminal-v1/screenshots/` (git-ignored via parent's `.gitignore` pattern on `screenshots/`), openable at ≤ 2000 × 2000 px.
- Placeholder page renders the string `terminal-v1` in the body — the smallest possible perceptual anchor.

### Adversarial-review question (A1 third lens)

Could this sprint pass while the harness silently accepts a page that failed to load? No — the harness `waitForSelector` on `data-testid="terminal-v1-root"` fails loudly if the placeholder never renders, and the capture script errors out if the element isn't visible.

## done criteria

The parent server serves the placeholder page at `/terminal-v1/`; both harness scripts run against it end-to-end from `substrate-ui/`; one screenshot lands and opens; existing E2E harnesses (`npm run e2e`, `npm run e2e:studio`, `npm run e2e:assay`, `npm run e2e:delegate`) still pass unchanged.

## notes

Copy the `decodePNG` and `aliveAt` helpers verbatim from `harness/capture_scene.js` into `capture_terminal_v1.js`, unchanged — battle-tested from the prior build (Addendum A2). Sprint 002 does not yet exercise the decoder because the placeholder has no pixel anchors; the decoder ships in Sprint 002 to be ready for Sprint 003 (tab bar shell) which adds the first anchor strip.
