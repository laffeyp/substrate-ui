---
id: 208
status: closed
phase: shell-to-react A10
pass_kind: observation
---

# Sprint 208 — a gate for meta's inspector, i/o lens and scene lens

## scope

No gate drives meta's inspector, its i/o lens or its scene lens (plan round 5, "Tests already in place"). `harness/shakeout/meta_inspector_io_scene.ts` drives them against the app launched from source after one deterministic turn, and `gates:electron` runs it. Each value on screen is held to the controller's envelopes (`window.__vm.get(1).snapshot().rawEnvelopes`). Inspector: a click on the `UserMessage` row opens INSPECT with that envelope's kind, `seq <n>`, and its payload as JSON equal to the envelope's payload; a second click closes it. i/o: one document per `UserMessage`, `ModelReply`, `FinalAnswer` and `ToolResult` envelope, in seq order, each with its seq; the first is `UserMessage · input` with the text `hello`. Scene: with no grid on the record, the lens shows its empty line.

## prerequisites

- 207 closed

## context_files

- `web/reveal.html:214–228` (inspector), `:234–240` (i/o), `:336–341` (scene)
- `web/reveal_component.ts:2304–2327`
- `harness/pixel/capture.ts:95–118` (the same steps, for pictures)
- `harness/shakeout/dialogs.ts` (a gate's form)

## signal contract

None emitted by these lenses; the gate reads the controller's envelopes as the record the screen must match.

## artifact contract

- Created: `harness/shakeout/meta_inspector_io_scene.ts`. Modified: `package.json` (`gates:electron`).
- `npx tsc -p harness` 0; `npx tsx harness/shakeout/meta_inspector_io_scene.ts` 0, its last line `meta_inspector_io_scene: ok — …`.

## observation contract

As in scope. A planted fault fails it: with the i/o lens's documents reversed, the gate fails at the seq order check.

## done criteria

The three lenses without a gate are held to the record on today's tree.

## result

Closed 2026-11-05. `harness/shakeout/meta_inspector_io_scene.ts` written; `gates:electron` runs it (48 scripts). `npx tsc -p harness` 0; the gate exit 0: "inspector UserMessage seq 17, the record's payload fields equal (added by the stream: kind, instance), closes; i/o 2 documents, seqs [17,22], first "UserMessage · input" hello; scene empty line".

The first run failed on payload equality. The stream builds each row's payload as the record's payload with the producer's `kind` and `instance` merged in (`reveal_component.ts:1566–1569`), for its lane logic, and the inspector shows that object under PAYLOAD: here `"kind": "first_message"` and `"instance": "01M6…"`, neither in the record's `UserMessage` payload. A payload with its own `kind` would show the producer's in its place. The gate now holds each field of the record's payload to its value and names the added fields; D2 shows the record's payload alone and makes the check an equality. A second failure was the gate's: dc-runtime wraps `{{ d.title }}` in a span, so the seq is read from the span floated right.

Planted fault (i/o documents reversed): exit 1, "i/o seqs [22,17]; the envelopes give [17,22]". Restored and rebuilt.

## Rubber Duck pass

No signals: these lenses emit none; the controller's envelopes are the record checked against. Observations: payload anomaly, the inspector's PAYLOAD carries two fields the record does not. Disposition: `recorded` (agent-resolved: D2 fixes it and tightens the check).
