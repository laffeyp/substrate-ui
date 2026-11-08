# Sprint 376 — the runtime checker reads the server's signals: the pairings with the window and main

```yaml
---
id: 376
status: closed
phase: SDD re-centre
pass_kind: architecture
---
```

## scope

Plan r3 item 5, third link. The Python server writes its own signals to `server.jsonl`. Main now reads that file as it grows: before each record it checks, on its 250 ms timer, and at quit. Main hands each server signal to the checker, so the app writes INVARIANT_BROKEN when a rule pairing a server signal with a window or main signal fails:
- **S1:** the server's first signal is SERVER_STARTED.
- **T2:** main's SERVER_BOUND, then the server's SERVER_STARTED on the same port within 15 s. `server.py` prints its port at line 5001 and writes SERVER_STARTED at line 5006, so main's record can come first. A SERVER_STARTED already read answers at once.
- **S7 (v0.22):** each window SESSION_OPEN_ACKED has exactly one server SESSION_CREATED of that session before it.
- **S8's server half (v0.22):** a session's window TURN_ACKs never outnumber its server TURN_ACCEPTEDs.
- **S9:** each window SESSION_OPEN_REFUSED or TURN_REFUSED that the server caused has an API_REFUSED of its area before it. The server caused it unless `failure_class` is `network` or `json_parse` (`web/vm/client.ts` `fetchJson`).

The server writes each of these before it answers: API_REFUSED in `_send` before `send_response`, SESSION_CREATED before `_json`, TURN_ACCEPTED before the kernel takes the turn. So the window's record is checked the moment it arrives.

Vocabulary v0.22 restates two rules to match the code:
- **`P-0.22-S7-WINDOW-SIDE`:** the server opens sessions for clients other than the window (its `mcp` and `agent` routes, or a plain `POST /api/session`), which no window acks.
- **`P-0.22-S8-SESSION-COUNT`:** TURN_ACK carries no `turn_index` to pair on.

## artifact contract

### Files modified

- `electron/invariants.ts`, `electron/main.ts` (`readServerRecords`); `web/app/__tests__/invariants.spec.ts`; `harness/shakeout/invariant_signals.ts`
- `web/vm/signals/versions/0.22.json`, `0.22-rationale.md`, `proposals.json`, `current.json`; the generated files

### Command exit codes

`npm run build` 0; `npm run test:unit` 0 (the spec: 11 cases); `npm run signals` 0.

## observation contract

`harness/shakeout/invariant_signals.ts`:
- **The normal run.** The window's real session ack and its real message ack are checked against the real server's SESSION_CREATED and TURN_ACCEPTED, and must break nothing.
- **The plants**, sent through the window channel:
  - an ack for a session the server never created (S7);
  - an ack for a message the server never accepted (S8);
  - a server-caused refusal the server never made (S9).
- **Extra breaks the gate expects.** The S6 plant also acks an uncreated session, so S7 fires for it as well. The first S8 plant acks a message the server never accepted, so S8's server half fires for it too. The gate expects sixteen INVARIANT_BROKEN.

S1 and T2 are planted in the spec.

Plant: with main not reading `server.jsonl`, the normal run's real acks break S7 and S8, and the gate fails.

## result

- **Gate:** `invariant_signals` 0 from source: 14 plants, 16 INVARIANT_BROKEN in order. The plant fails it.
