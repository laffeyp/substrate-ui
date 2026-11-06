// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// A replayed envelope is skipped whole (UI sprint 102), found by its seq without a scan (sprint 338,
// plan row F3, F335).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { EnvelopeKind } from "../../vm/kinds";
import { SessionController } from "../../vm/session_controller";
import type { SubstrateClient } from "../../vm/client";

const client = { fetchJson: async () => ({ ok: true, data: null }), streamRecord: () => () => undefined, streamRecordByPath: () => () => undefined } as unknown as SubstrateClient;
type Handle = { handleEnvelope(sessionId: string, env: unknown): void };

test("a reconnect's replay appends nothing; new seqs append in order", () => {
  const ctl = new SessionController(client);
  const feed = (seq: number, text: string) => (ctl as unknown as Handle).handleEnvelope("s_1", { seq, kind: EnvelopeKind.ModelReply, payload: { text }, t: seq });
  feed(1, "a"); feed(2, "b"); feed(3, "c");
  feed(2, "b"); feed(1, "a");
  feed(4, "d");
  assert.deepStrictEqual(ctl.snapshot().rawEnvelopes.map((e) => e.seq), [1, 2, 3, 4]);
  assert.deepStrictEqual(ctl.snapshot().transcript.map((r) => r.text), ["a", "b", "c", "d"]);
});
