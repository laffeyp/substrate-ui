# Sprint 014 — Assays tab port

```yaml
---
id: 014
status: closed
phase: 2
pass_kind: functional
---
```

## scope
Assays tab has its own picker (list of assays from `/api/assays`, click one) and a report body that fetches `/api/assay/<name>`. Text-only rendering of the arms + fingerprints + trial counts. Does NOT read `STATE._currentRecord` — picks its own subject inside the tab per Architect ruling.

Prereq: 013. Six discipline items. Capture 15 (capture-only).
