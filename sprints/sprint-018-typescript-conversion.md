# Sprint 008 — TypeScript + Vite conversion (behavior-preserving)

```yaml
---
id: 008
status: closed
phase: 2
pass_kind: architecture
---
```

## scope

Behavior-preserving refactor: convert `web/*.js` to `web/*.ts`, add Vite as the build pipeline, add TypeScript with strict mode. No new features, no signal instrumentation (that starts Sprint 010 after the Vocabulary Session). The parent server `server.py` serves from `web/dist/` after `npm run build`. Existing Playwright harness (`npm run e2e`) still passes end-to-end unchanged.

## prerequisites — none (this is the foundation for the SDD arc).

## context_files

- `../../../sdd-kit-2/TECHNIQUES.md` (#43 refactor as chain of behavior-preserving sprints)
- `/Users/peterlaffey/Documents/Claude/Projects/Katybird/vite.config.ts`, `tsconfig.json` — reference shape
- `../web/app.js`, `../web/studio.js`, `../web/index.html`, `../web/studio.html`
- `../server.py` (the `WEB` static-path constant)
- `../package.json`

## artifact contract

### Files created

- `substrate-ui/tsconfig.json` — strict TS config (copy Katybird's, adjust `include`)
- `substrate-ui/vite.config.ts` — root `web/`, build outDir `web/dist/`, target `es2020`
- `substrate-ui/web/app.ts` — renamed from `app.js` with type annotations (`any` acceptable as starting placeholder)
- `substrate-ui/web/studio.ts` — renamed from `studio.js`

### Files modified

- `substrate-ui/package.json` — add `typescript@^5`, `vite@^5`, `@types/node`; add scripts `build` (`vite build`) and `dev` (`vite`)
- `substrate-ui/web/index.html` — reference `<script type="module" src="./app.ts">` (Vite rewrites at build)
- `substrate-ui/web/studio.html` — same for `studio.ts`
- `substrate-ui/server.py` — `WEB` points at `Path(...).parent / "web" / "dist"` after build; if `dist/` missing, fall back to `web/` with a startup warning
- `substrate-ui/.gitignore` — add `web/dist/`, `node_modules/`

### Files retired

- `substrate-ui/web/app.js` (superseded by `.ts` — moved to `_deprecated/web-round1/`)
- `substrate-ui/web/studio.js` (same)

### Content assertions

- `substrate-ui/tsconfig.json` has `strict: true`, `noImplicitAny: true` (or default under strict).
- `npm install` completes without error.
- `npm run build` produces `substrate-ui/web/dist/index.html` and `dist/studio.html`.
- `curl -sf http://127.0.0.1:8765/` returns 200 after build.
- `curl -sf http://127.0.0.1:8765/studio.html` returns 200 after build.

### Command exit codes

- `cd substrate-ui && npm install` returns 0
- `cd substrate-ui && npm run build` returns 0
- `cd substrate-ui && npm run e2e` returns 0 (parent E2E unchanged, still green)

## observation contract

`pass_kind: architecture` — behavior-preserving refactor, no new behavior added. The parent E2E is the observation.

## done criteria

`web/*.ts` builds via Vite to `web/dist/`. The parent server serves the built output. All existing Playwright harnesses pass unchanged. No signals yet; the surface is ready for Sprint 010's SDD scaffold to import `emit` from a real TypeScript module.
