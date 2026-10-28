# ROADMAP: SPDX headers on every source file

*2026-10-28. Followup to the `9cb897d` LICENSE copy from `../substrate/`.*

Substrate carries `# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0` plus a copyright line on every source file in its tree. substrate-ui carries zero. 217 files need the header: 71 `.py`, 117 `.ts`, 6 `.tsx`, 6 `.js`, 2 `.mjs`, 3 `.sh`, 12 `.html`.

| Card | Delivers | Done when |
|---|---|---|
| U191 | `scripts/add_spdx_headers.py` applies the two-line header to every source file in scope; `.py`/`.sh` use `#`; `.ts`/`.tsx`/`.js`/`.mjs` use `//`; `.html` uses `<!-- ... -->`. Shebangs stay on line 1; `<!DOCTYPE html>` stays on line 1; the header lands on line 2. The script is idempotent on files that already carry the SPDX line. | A fresh `grep -L "SPDX-License-Identifier" <in-scope files>` is empty. `npm run build` passes. The pre-commit hook passes. |

Scope excludes `node_modules/`, `_deprecated/`, `dist-electron/`, `build/python*/`, `web/dist/`, `.pytest_cache/`, `runs/packaged/`, and `captures/`.
