# Sprint 112 — Retire dc-runtime

```yaml
---
id: 112
status: open
opened_at: 2026-10-08
pass_kind: remediation
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-08-lens-audit-remediation.md
ledger_rows: 37
---
```

## why

The shell runs through a vendored, unrebuildable runtime that evals it with new Function, forces @ts-nocheck on 2,407 lines and fiber walks, and loads React from a CDN; the UI renders fabricated data (findings §1, §5, §8). The user approved retiring it on condition nothing breaks.

## sources

- Electron security checklist, items 1 and 7.
- User, 2026-10-08: "only if you don't break anything."

## scope (ledger rows)

Each row closes as named; a row the sprint cannot close halts the sprint.

| id | close | finding |
|---|---|---|
| F320 | fix | web/reveal.html:9-10 (and web/dist/reveal.html) — the packaged desktop app loads React 18.3.1 and ReactDOM from `https://cdnjs.cloudflare.com` at every launch, no `integrity=` (SRI). No Content-Security-Policy anywher… |
| F321 | fix | web/shims/react.ts, react-dom-client.ts, react-jsx-runtime.ts (+ vite.config.ts:80-86, file comments "React shim", "JSX-runtime shim"). What they are: Vite module aliases that re-export the `window.React` / `window.Re… |
| F322 | fix | web/shims/react.ts:12-30 — React and every hook typed `any` (`ReactElement = any`, `ReactNode = any`); `tsc --noEmit` passing proves nothing about React usage in reveal_component.ts (2,407 lines). |
| F327 | fix | web/reveal_component.ts:1 — `// @ts-nocheck` over 2,407 lines (the shell). l.15-18: "Sprint 059 adds the enums … and drops the pragma"; the pragma remains. `npm run build`'s `tsc --noEmit` says nothing about this file… |
| F328 | fix | reveal_component.ts renders prototype fixtures as live data: |
| F329 | fix | transcript/ToolCard.tsx:69-80,121-126 renders "· descend ⏎" on every delegate result; Row.tsx:85-91 never passes `onDescend`; no caller anywhere (grep). The click does nothing. reveal_component.ts:180-382 `_liveBindin… |
| F330 | fix | session_controller.ts:627-630 `endSession` posts `{reason}`; server.py:2606 reads `body["source"]`. Every client end (/exit "user_end", Cmd-W "user_close") lands as source "user_end" on the record. |
| F331 | fix | vm/client.ts:61-69 parses error bodies for `failure_class` and `detail`; server.py `_error` sends `{"error": …}` only. Every refusal reaches the UI as `failureClass: "http_error"` with the raw JSON text as detail ("tu… |
| F332 | fix | session_controller.ts:403-406 — `openSession` falls back to `"deterministic"` when no driver is known; the comment at l.396-399 says "Never open a session with a made-up driver". |
| F333 | fix | eslint.config.js:16-22,38-43 bans the exact generated kind values ("substrate.TriggerFired"); reveal_component.ts strips the prefix (l.1374) then compares bare 'TriggerFired', 'ProducerStarted', 'ProducerCompleted', '… |
| F334 | fix | reveal.ts:21-54 reaches the dc-runtime component through React's private fiber internals (`__reactContainer*` key, `stateNode.current`, `.logic`). reveal.ts:177-225: dc-runtime clears the transcript mount divs on its … |
| F335 | fix | session_controller.ts:971-975,1238-1240 — every envelope copies `rawEnvelopes` and `transcript` arrays and scans `rawEnvelopes` for a duplicate seq: O(n) per envelope, O(n²) per session; ToolCard.tsx:33 `openByCallId`… |
| F336 | fix | reveal.ts:164-175 — "Ctrl+C over a prompt input interrupts"; the handler also takes metaKey, so Cmd+C with no selection interrupts the turn on macOS. |
| F337 | fix | reveal.ts:258, reveal_component.ts:54,1024,1266,2268 — the literal `~/.substrate/sandbox` (tilde form) is what the UI binds and sends; this is the origin of the carried-in "`~/.substrate/sandbox` stored literally, res… |
| F338 | fix | reveal_component.ts:80 cites `web/studio.ts` (does not exist); the Studio form lives inside reveal_component and posts /api/validate + /api/build (builder.py). |
| F339 | fix | reveal_component.ts:454 — pane shape 'isolated' \| 'sandbox' \| 'flat' (UI-local; never sent — openSession sends `isolate`/`workspace_shape` only when passed); l.461,1148,1265,2267 test `shape === 'worktree'`, which `… |
| F340 | fix | session_controller.ts:1266 — "provider timed out — no response after 3 attempts": the attempt count is OllamaResponder's configurable `max_retries`. |
| F343 | fix | web/public/support.js:1 — "GENERATED from dc-runtime/src/*.ts — do not edit. Rebuild with `cd dc-runtime && bun run build`". No dc-runtime source in either repo (find); one commit (ba6ceb7); no version, no license hea… |
| F344 | fix | support.js:842-851,1701-1724 — the shell's `class Component` source (reveal_component.ts, injected into a script tag by vite) is evaluated with `new Function(...)`; l.1210-1223 x-import modules too. Any Content-Securi… |
| F345 | fix | support.js:1143-1148,1838-1847 — the runtime's own React loader pins unpkg URLs WITH SRI hashes; it runs only if `window.React` is absent; reveal.html:9-10 loads cdnjs React first WITHOUT `integrity`, so the SRI path … |
| F346 | fix | support.js:158-164 — boot re-fetches `location.href` to re-parse the template (a second request for the page on every load); l.1642-1685 any `<dc-import>` fetches `./<name>.dc.html`. |
| F347 | fix | vm/instrumentation/sdd.ts:20,50-53 — every signal is pushed onto a module buffer exposed as `window.__vmSignals`, never trimmed; session_controller emits STREAM_ENVELOPE_APPENDED per envelope (l.974). Memory grows wit… |
| F348 | fix | sdd.ts:6-8, vocabulary.ts:3-4, types.ts:3-4 — refer to "the classic shell's web/instrumentation/…" and "the classic shell today"; web/instrumentation does not exist (the classic tree moved to _deprecated). |
| F349 | fix | reveal/activity.ts:63 — strips `{"error":` from the turn-failure detail with a regex: the UI compensating for client.ts mis-parsing the server's error shape (finding above). |
| F350 | fix | reveal/activity.ts:20-136 — `liveActivity(snap: any)` scans all envelopes on each call; called per render with the 500 ms forceUpdate tick (O(n) every 500 ms per pane). |
| F351 | fix | reveal.html:499-505 export dialog: "EXPORT RECORD · 01M1684 · fix-race-in-metering · 244 ev", target "~/exports/fix-race-in-metering.record" (export does nothing — reveal_component.ts:2343). reveal.html:512-513 end di… |
| F352 | fix | reveal.html:380-381 Assay empty state: "no assays on record. /api/assays returned an empty list." The web client never calls /api/assays (grep: no caller); the message reports a request that was not made. `arms` is al… |
| F353 | delete | reveal.html:399-409 Studio: header says "coming soon…", the form is `opacity:.4; pointer-events:none` ("inert until the topology-picker rewrite"). The live endpoints behind it (server /api/validate, /api/build, builde… |
| F354 | fix | reveal.html:51 — pane name: "double-click to rename (needs a rename endpoint daemon-side — FD-1)". PATCH /api/session/<id> {name} exists (used by `/name`); the double-click edit (reveal_component.ts:1325 `nameKey`) ch… |
| F355 | fix | reveal.html:398 comment "parity with web/studio.html" — no such file. |
| F356 | fix | reveal.html:541 data-props carries the design tool's "tweak" editor metadata (firstRun, simulateRateLimit "Scenarios"); `simulateRateLimit` drives a fake status string (reveal_component.ts:2311). |
| F357 | fix | reveal/transcript/ansi.ts:167-168 — 256-colour SGR (`38;5;n`) maps n ≥ 16 to undefined (keeps the prior colour); truecolor `38;2;r;g;b` falls through the loop and reads `2` as "dim". Login TUIs that use either render … |
| F358 | fix | reveal/markdown.ts:82 — fence language `\w*`: "```c++", "```objective-c", "```shell-session" fail the fence match and render as paragraphs containing the backticks. |
| F359 | fix | vm/tools/check-vocabulary-parity.ts:10-12 cites "the classic shell's tools/check-vocabulary-parity.ts" (gone with the classic shell); SCAN_PATHS (l.47-55) omit web/reveal/** (the .tsx tree). |
| F360 | fix | reveal/__tests__/turn_state.spec.ts:62 — the fake client returns `failureClass: "http_error", detail: '{"error":"TimeoutError"}'`; l.40 asserts activity strips `{"error":`: the test pins the client/server error-shape … |
| F361 | fix | nothing beyond the remount dependence noted above (l.18-20 confirms "the root remounting when dc-runtime clears its mount div"). |
| F471 | closes with the finding it resolves | l.427 transcript re-mount — PROBED LIVE (scratchpad/probe_remount.ts: `electron .` from source, scratch SUBSTRATE_HOME and user-data-dir, deterministic driver, one turn, then 6 s idle). "[reveal] transcript root mount… |

## checks

- The U108 baseline gates pass again on the ported shell, unchanged.
- No `@ts-nocheck`; `tsc --noEmit` and eslint (including .tsx) pass.
- React is bundled; the CSP has no `unsafe-eval` and no remote origin; support.js is deleted.
- No `__reactContainer` access anywhere.
- No fixture text renders as live data; assays, rename and new-session are wired; controls without an endpoint are removed.
- `npm run smoke:packaged` passes on a fresh bundle.

## result

(filled at close)
