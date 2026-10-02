---
id: 092b
status: superseded by 095 (closed 2026-10-01)
repo: substrate-ui
class: F (Claim Check); F-API-6 boundary
---

# Sprint 092b — SSE stream inlines blob payloads

*Placeholder filed 2026-10-01 for work done on 2026-10-01 without a card (Sprint 092 "Sprint B").*

**What exists.** `server.py` `_deref_blob_payload` reads blobs in both SSE handlers.

**Open defect.** Imports `substrate.record.blobstore` and `substrate.types`, kernel internals outside the F-API-6 boundary.

**Disposition.** Superseded by sprint 095: the SSE path calls the kernel's public resolver on `substrate.api`.
