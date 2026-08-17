# signals/mirror/

Bundled snapshots of external vocabularies substrate-ui reads at runtime. Kept under source control so the Vite bundler can `import` them and so the parity gate can run offline. Refreshed by hand via a scripted copy + sha256 verify — never edited in place.

## substrate-0.2.json

- **Source:** `../../../substrate/process/signals/0.2.json`
- **First mirrored:** 2026-08-16 (Sprint 030)
- **Sha256 as mirrored:** `9c1c97f7852ab8e01f54208273be64fa84861b4ebe458371ca28e5bacb726168`

The consumer set: `web/instrumentation/vocabulary.ts` exposes `SUBSTRATE_KINDS: Set<string>` (populated from `tags[].name`); `web/instrumentation/sdd.ts` uses that set to enforce `payload_types: { kind: substrate_kind }` at emit time.

## Refresh

```
npm run sync:substrate-vocab
```

The script re-copies from the source path, then prints the new sha256. If the sha256 changes, update the "as mirrored" line above and re-run `npm run signals` to confirm no consumer breaks.
