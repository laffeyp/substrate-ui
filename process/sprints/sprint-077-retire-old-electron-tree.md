# Sprint 077 — retire the 2026-09-12 Electron/bridge/app trees

```yaml
---
id: 077
status: closed
opened_at: 2026-09-24
closed_at: 2026-09-24
closed_by: agent
commit: b00b63d
phase: 9
pass_kind: architecture
---
```

## scope

The 2026-09-11/12 Electron path was a parallel architecture: stdio JSON-RPC between Chromium and `bridge/main.py`, a hand-maintained `BridgeOp` vocabulary mirroring the substrate vocabulary that `signals/0.1.json` already locks, and `app/prototype-v7.html` as a 1947-line shell that only ran under the preload. Nothing in that path had a route into the reveal shell. Every file moves under `_deprecated/electron-bridge-2026-09-12/` per hard rule 12.

Files retired:
- `bridge/main.py`, `bridge/vocab.py`
- `app/prototype-v7.html`, `app/support.js`, `app/index.html`, `app/build.js`
- `src/observability/bridge-ops.ts`
- `electron/main.js`, `electron/preload.js` (the 2026-09-12 versions)

`_deprecated/electron-bridge-2026-09-12/ARCHIVED.md` names what lived there, why it retired, and what replaces it. Two patterns are called out for reuse in Phase 9: the buffered-pending dispatch (`main.js:51-72`, reused in Sprint 081) and the detached-group spawn pattern the shakeout already uses at `harness/shakeout/lib/server.ts:22-45`.

## deliverables (from the commit)

- Move the eight files above under `_deprecated/electron-bridge-2026-09-12/`.
- `_deprecated/electron-bridge-2026-09-12/ARCHIVED.md` — what/why/replacement, plus the two reuse patterns.
- `package.json` — add `electron@44.4.5` to devDependencies for the spike.
- `harness/_electron_spike.ts` + `harness/electron_spike/main.js` + `harness/electron_spike/package.json` — Playwright `_electron.launch` drives a trivial Electron app that spawns a detached `sleep 30` subprocess. Verifies R4 (Playwright + spawn-owning app compatibility). Green: window mounts, child pid visible via `ps`, clean-kill on window-close within 4s. R4 retires from the risk register.

## exit gates (verified by the commit)

- typecheck ✓
- lint ✓
- 14/14 unit ✓
- `[vm-vocab-parity] OK — vocabulary 0.1 (30 tags: 30 live + 0 retired, locked=true); code emits 30 distinct live tag(s), all locked.`
- smoke:vm 11/11 ✓

## follow-up

Sprint 078 rewrites `electron/main.js` as spawn-server + loadURL against `server.py` on port 8765; Sprint 079 replaces the hard-coded port with `--port 0` + readback.

## artifact

Commit `b00b63d` (2026-09-24 16:54:16 -0700). The commit body is the authoritative record; this card is the retro-summary Peter asked for on 2026-09-25.
