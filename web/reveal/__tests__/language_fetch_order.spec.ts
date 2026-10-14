// The language view applies only the latest fetch (UI sprint 172).
//
// The refresh queued after one turn can be in flight when the next turn's `Returned` queues
// another; if the earlier fetch resolves last, its older view must not replace the newer one.
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { SessionController } from "../../vm/session_controller";
import type { FetchResult, SubstrateClient } from "../../vm/client";
import type { LanguageView } from "../../vm/types";

function view(last_seq: number): LanguageView {
  return { lines: [], lanes: { model: {}, user: {} }, shifts: [], changes: [], last_seq };
}

test("an earlier fetch that resolves last does not replace the later view", async () => {
  const pending: ((r: FetchResult<unknown>) => void)[] = [];
  const client = {
    fetchJson: () => new Promise<FetchResult<unknown>>((resolve) => { pending.push(resolve); }),
    streamRecord: () => () => undefined,
    streamRecordByPath: () => () => undefined,
  } as unknown as SubstrateClient;
  const ctl = new SessionController(client);
  (ctl as unknown as { patch(d: { sessionId: string }): void }).patch({ sessionId: "s_test" });
  const load = (ctl as unknown as { loadLanguage(): Promise<void> }).loadLanguage.bind(ctl);
  const first = load();
  const second = load();
  pending[1]({ ok: true, data: view(52) });
  await second;
  pending[0]({ ok: true, data: view(30) });
  await first;
  assert.strictEqual(ctl.snapshot().language?.last_seq, 52);
});
