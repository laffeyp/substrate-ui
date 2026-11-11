// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A message's echo is replaced by its own message on the record (sprint 451; roadmap r13 E10.2;
// ADD-TO-MESSAGE-2026-11-10-r3, the prototype's faults): a refused echo waits for nothing, so a later message with
// the same words never takes it, and its warning stays under it; a message with no waiting echo is added.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { SessionController } from "../../vm/session_controller";
import type { FetchResult, SubstrateClient } from "../../vm/client";
import type { RecordEnvelope } from "../../vm/types";
import { EnvelopeKind } from "../../vm/envelope_kinds.gen";
import { clearBuffer, snapshot } from "../../vm/instrumentation/sdd";
import { Signal } from "../../vm/signals.gen";

function controller(answers: boolean[]): SessionController {
  const client = {
    fetchJson: async (): Promise<FetchResult<unknown>> => (answers.shift() ?? true)
      ? ({ ok: true, data: {} } as FetchResult<unknown>)
      : ({ ok: false, detail: "attachments[0]: outside the workspace", failureClass: "client_error" } as unknown as FetchResult<unknown>),
    streamRecord: () => () => undefined,
    streamRecordByPath: () => () => undefined,
  } as unknown as SubstrateClient;
  const ctl = new SessionController(client);
  ctl.paneId = 1;
  (ctl as unknown as { patch(d: { sessionId: string }): void }).patch({ sessionId: "s_test" });
  return ctl;
}
const handle = (ctl: SessionController, env: RecordEnvelope) => (ctl as unknown as { handleEnvelope(s: string, e: RecordEnvelope): void }).handleEnvelope("s_test", env);
const rows = (ctl: SessionController) => ctl.snapshot().transcript.map((r) => `${r.role}:${r.seq > 0 ? "rec" : "echo"}:${r.text}`);

test("a refused echo is not taken by a later message with the same words, and its warning stays under it", async () => {
  const ctl = controller([false, true]);
  let refused = 0;
  await ctl.submitLine("what is this", [], () => { refused++; });
  await ctl.submitLine("what is this", [], () => { refused++; });
  assert.strictEqual(refused, 1);
  handle(ctl, { seq: 9, kind: EnvelopeKind.UserMessage, payload: { text: "what is this" } });
  assert.deepStrictEqual(rows(ctl), [
    "user:echo:what is this",
    "warning:echo:turn refused: attachments[0]: outside the workspace",
    "user:rec:what is this",
  ]);
});

test("the record's message replaces its own echo, oldest first", async () => {
  const ctl = controller([true, true]);
  await ctl.submitLine("again");
  await ctl.submitLine("again");
  handle(ctl, { seq: 5, kind: EnvelopeKind.UserMessage, payload: { text: "again" } });
  handle(ctl, { seq: 6, kind: EnvelopeKind.UserMessage, payload: { text: "again" } });
  assert.deepStrictEqual(rows(ctl), ["user:rec:again", "user:rec:again"]);
  assert.deepStrictEqual(ctl.snapshot().transcript.map((r) => r.seq), [5, 6]);
});

test("a message with no waiting echo (another client's, or a replay) is added as its own row", async () => {
  const ctl = controller([false]);
  await ctl.submitLine("mine");
  handle(ctl, { seq: 3, kind: EnvelopeKind.UserMessage, payload: { text: "mine" } });
  assert.deepStrictEqual(rows(ctl), ["user:echo:mine", "warning:echo:turn refused: attachments[0]: outside the workspace", "user:rec:mine"]);
});

test("a refused turn is not counted: the next message has the turn index the refused one had", async () => {
  const ctl = controller([true, false, true]);
  clearBuffer();
  await ctl.submitLine("one");
  await ctl.submitLine("refused");
  await ctl.submitLine("two");
  assert.deepStrictEqual(snapshot().filter((r) => r.name === Signal.TURN_SUBMITTED).map((r) => r.payload.turn_index), [0, 1, 1]);
});
