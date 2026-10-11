# Sprint 133 — `electron_smoke` on the first launch after an install

```yaml
---
id: 133
status: open
phase: 1
pass_kind: functional
roadmap: substrate-ui/process/planning/ROADMAP-2026-10-11-before-distribution.md (step 1; open item 5)
asked: 2026-10-11 (Architect)
---
```

## scope

- Find the root cause of `electron_smoke` failing on the first gate run after an install, and fix it. It failed on the first run after the U131 install (1 bug, 0 signals) and after the activity-strip install (2 bugs); it passed on every rerun (kit diary 66; sprint 131 result).
- Reproduce first: install, run the gate once, and keep its full output and the app's logs from that launch.
- Unit specs for any changed code; the Electron gates on the installed app.

## checks

- The cause is named with the evidence from a reproduced failing first launch.
- After the fix, three fresh installs each pass `electron_smoke` on their first gate run, and the 11 Electron gates pass on `/Applications/Substrate.app`.

## result

