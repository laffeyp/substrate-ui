// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The client reads the server's error shape (web/vm/client.ts; sprint 336, plan row F1, F331).
//
// Run: `npm run test:unit`

import { test } from "node:test";
import assert from "node:assert";
import { BrowserSubstrateClient } from "../../vm/client";

const reply = (status: number, body: string) => async () => new Response(body, { status, headers: { "Content-Type": "application/json" } });

test("a refusal's message is the server's `error` field, not the raw JSON", async () => {
  const real = globalThis.fetch;
  try {
    globalThis.fetch = reply(409, JSON.stringify({ error: "session is not running" })) as typeof fetch;
    const r = await new BrowserSubstrateClient().fetchJson("/api/x");
    assert.deepStrictEqual(r, { ok: false, status: 409, failureClass: "http_error", detail: "session is not running" });
    // A body with `failure_class` and `detail` still reads as before; a body that is not JSON stays raw.
    globalThis.fetch = reply(500, JSON.stringify({ failure_class: "model_error", detail: "no model" })) as typeof fetch;
    assert.deepStrictEqual(await new BrowserSubstrateClient().fetchJson("/api/x"), { ok: false, status: 500, failureClass: "model_error", detail: "no model" });
    globalThis.fetch = reply(502, "Bad Gateway") as typeof fetch;
    assert.deepStrictEqual(await new BrowserSubstrateClient().fetchJson("/api/x"), { ok: false, status: 502, failureClass: "http_error", detail: "Bad Gateway" });
  } finally {
    globalThis.fetch = real;
  }
});
