# Sprint 520 — The bundled runtime finds its compiled packages

```yaml
---
id: 520
status: closed
phase: core stalls (roadmap 2026-11-18-core-stalls r1; the build that installs C1–C3)
pass_kind: functional
depends_on: [508]
plan: process/planning/2026-11-18-core-stalls/ROADMAP-2026-11-18-core-stalls-r1.md
---
```

## scope

Sprint 508 kept `tokenizers` out of `_bundle.zip` by name and added a check that fails the build when the zip holds a compiled extension. The check fired on the next build: `hf_xet/hf_xet.abi3.so` and `yaml/_yaml.cpython-314-darwin.so`, both brought in by `huggingface-hub`, a `tokenizers` dependency. `scripts/fetch-python-runtime.sh` step 6 now finds every top-level package in `site-packages` that holds a `.so` or `.dylib` and keeps it on disk; `substrate` stays on disk for its data files, as before; step 10 precompiles whatever stayed loose. One verifiable property: `npm run pack:runtime` returns 0 and names the loose packages.

## artifact contract

### Files modified

- `scripts/fetch-python-runtime.sh`

### Command exit codes

- `npm run pack:runtime` returns 0, prints "loose on disk: substrate hf_xet msgspec tokenizers yaml" and "token count ok: hello world = 2"; chapter 5A steps 1–20 return 0.

## observation contract

The installed Substrate Next boots, and a session turn runs on it.

## close

`scripts/fetch-python-runtime.sh` step 6 builds `LOOSE`: `substrate`, then every top-level entry of `site-packages` (not a dist-info, `.pth` or `__pycache__`) holding a `.so` or `.dylib`; those stay on disk and the rest go into `_bundle.zip`; step 10 precompiles `LOOSE`.

- `npm run pack:runtime`: exit 0; "loose on disk: substrate hf_xet msgspec tokenizers yaml"; "token count ok: hello world = 2"; "precompiled: 410 .pyc files". The build before this change failed at that step with `hf_xet/hf_xet.abi3.so` and `yaml/_yaml.cpython-314-darwin.so` inside the zip, as sprint 508's check is meant to catch.
- Chapter 5A's later steps (the bundle's gates, the install) run with the core-stalls roadmap's install.

Rubber Duck Pass: no signal changed. No observations.
