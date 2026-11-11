// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The step before a turn (sprint 444; roadmap r13 E10.0; SAVE-BEFORE-SEND-2026-11-10): `sendTurn` awaits the
// registered step after its echo and before TURN_SUBMITTED and the POST; TURN_SUBMITTED counts what the step saved;
// a refusal is one warning row that stays under its message when the record's UserMessage replaces the echo.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { SessionController, setBeforeTurn } from "../../vm/session_controller";
import type { FetchResult, SubstrateClient } from "../../vm/client";
import type { RecordEnvelope } from "../../vm/types";
import { clearBuffer, snapshot } from "../../vm/instrumentation/sdd";
import { Signal } from "../../vm/signals.gen";
import { EnvelopeKind } from "../../vm/envelope_kinds.gen";

function controller(order: string[]): SessionController {
  const client = {
    fetchJson: async (url: string): Promise<FetchResult<unknown>> => {
      order.push(`post ${url} submitted=${snapshot().filter((r) => r.name === Signal.TURN_SUBMITTED).length}`);
      return { ok: true, data: {} } as FetchResult<unknown>;
    },
    streamRecord: () => () => undefined,
    streamRecordByPath: () => () => undefined,
  } as unknown as SubstrateClient;
  const ctl = new SessionController(client);
  ctl.paneId = 1;
  (ctl as unknown as { patch(d: { sessionId: string }): void }).patch({ sessionId: "s_test" });
  return ctl;
}

test("the step runs after the echo and before TURN_SUBMITTED and the POST, and the turn counts its saves", async () => {
  const order: string[] = [];
  const ctl = controller(order);
  setBeforeTurn(async (sid, pane) => {
    order.push(`save ${sid} pane=${pane} echo=${ctl.snapshot().transcript.length} submitted=${snapshot().filter((r) => r.name === Signal.TURN_SUBMITTED).length}`);
    return { saved: 2, refused: [] };
  });
  clearBuffer();
  await ctl.sendTurn("hello");
  setBeforeTurn(null);
  assert.deepStrictEqual(order, ["save s_test pane=1 echo=1 submitted=0", "post /api/session/s_test/turn submitted=1"]);
  const submitted = snapshot().filter((r) => r.name === Signal.TURN_SUBMITTED);
  assert.strictEqual(submitted.length, 1);
  assert.strictEqual(submitted[0].payload.saved, 2);
  assert.deepStrictEqual(ctl.snapshot().transcript.map((r) => r.role), ["user"]);
});

test("with no step registered the turn saved nothing", async () => {
  const ctl = controller([]);
  setBeforeTurn(null);
  clearBuffer();
  await ctl.sendTurn("hello");
  assert.strictEqual(snapshot().filter((r) => r.name === Signal.TURN_SUBMITTED)[0].payload.saved, 0);
});

test("a refused save is one warning row, and it stays under its message when the record's message arrives", async () => {
  const ctl = controller([]);
  setBeforeTurn(async () => ({ saved: 1, refused: [{ path: "src/tax.ts", why: "'src/tax.ts' changed since it was read" }] }));
  clearBuffer();
  await ctl.sendTurn("what is the rate?");
  setBeforeTurn(null);
  assert.strictEqual(snapshot().filter((r) => r.name === Signal.TURN_SUBMITTED)[0].payload.saved, 1);
  const rows = () => ctl.snapshot().transcript.map((r) => `${r.role}:${r.text}`);
  assert.deepStrictEqual(rows(), ["user:what is the rate?", "warning:not saved before sending: 'src/tax.ts' changed since it was read"]);
  // A frame of the record's backlog arrives before the message, then the message replaces the echo.
  const handle = (env: RecordEnvelope) => (ctl as unknown as { handleEnvelope(s: string, e: RecordEnvelope): void }).handleEnvelope("s_test", env);
  handle({ seq: 7, kind: EnvelopeKind.ModelReply, payload: { text: "earlier reply" } });
  handle({ seq: 8, kind: EnvelopeKind.UserMessage, payload: { text: "what is the rate?" } });
  assert.deepStrictEqual(rows(), ["model:earlier reply", "user:what is the rate?", "warning:not saved before sending: 'src/tax.ts' changed since it was read"]);
  assert.strictEqual(ctl.snapshot().transcript[1].seq, 8);
});

test("a step that throws still lets the message go, and says so under it", async () => {
  const order: string[] = [];
  const ctl = controller(order);
  setBeforeTurn(async () => { throw new Error("boom"); });
  clearBuffer();
  await ctl.sendTurn("hello");
  setBeforeTurn(null);
  assert.strictEqual(order.length, 1);
  assert.deepStrictEqual(ctl.snapshot().transcript.map((r) => `${r.role}:${r.text}`), ["user:hello", "warning:not saved before sending: the save before sending failed: Error: boom"]);
});
