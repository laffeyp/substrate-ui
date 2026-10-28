# substrate-ui

Substrate for macOS. One pane per session; each session drives a model through the session topology. The topology ships with the kernel in the sibling repo `substrate/`.

The window shows the live transcript, the run-as-graph, the stream, the structure of the running topology, an I/O pane, and a language lens over the record's measures. Slash commands run from the input bar — `/model`, `/bundle`, `/workspace`, `/guidance`, `/length`, `/tone`, `/fold`, `/language`, `/exit`, among others. Panes split; a delegate pane attaches to a child session; `substrate://` URLs open the installed app at a record.

## Install

```
npm install
npm run pack:runtime
npm run pack:dev
ditto dist-electron/mac-arm64/Substrate.app /Applications/Substrate.app
open /Applications/Substrate.app
```

The signed, notarized path is `scripts/release.sh --notarize --install`. The runbook has every step: `process/planning/RUNBOOK-2026-10-28-project-r3.md`.

## Dev

```
npm run electron
```

Window title: "Substrate Dev". State at `~/.substrate-dev/`, separate from the installed app's `~/.substrate/`.

## Architecture

| Path | What |
|---|---|
| `electron/main.js` | Spawns the backend on `--port 0`, reads back the port, opens the window. |
| `server.py` | HTTP backend. Routes `substrate.api` reads; builds the session topology from a stored manifest. |
| `web/reveal.html`, `web/reveal.ts`, `web/reveal_component.ts` | The window. |
| `web/vm/` | Per-pane controller. Own signal vocabulary at `web/vm/signals/versions/0.1.json`. |
| `web/reveal/transcript/` | React tree. |
| `harness/shakeout/*.ts` | Playwright `_electron.launch` gates. |
| `tests/*.py` | pytest on the backend. |
| `scripts/release.sh` | The release pipeline. |
| `scripts/fetch-python-runtime.sh` | Bundles CPython and the kernel wheel. |
| `electron-builder.config.js` | macOS packaging. |

Python stdlib + `msgspec` + `substrate` as a library. React 18 UMD from the CDN, routed through `web/shims/`. Vite builds the window.

The kernel is imported through `substrate.api`, `substrate.topologies`, and the session topology's public modules. `tests/test_server.py`'s import-boundary test holds the line.

## Tests

```
npm run test:py           # pytest
npm run test:unit         # vocabulary parity + node --test
npx tsx harness/vm_smoke.ts
npm run gates:electron    # chained Playwright gates
npm test                  # all of the above
```

Gates against a built bundle set `SHAKEOUT_APP=$APP` and `*_APP=$APP`.

## Boundary

The backend binds `127.0.0.1`. A session's tools include `bash`, `edit_file`, `write_file` at the chosen workspace path. Moving off loopback with `SUBSTRATE_UI_HOST` without authentication in front gives anyone on the network a shell at that workspace.

## License

PolyForm Noncommercial 1.0.0. `LICENSE`.
