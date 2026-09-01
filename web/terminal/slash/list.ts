// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
import type { SlashCommand } from "../types";
import { CLS } from "../types";
import { push } from "../helpers";
import { fetchGet } from "../../lib/fetch";

export const listSlash: SlashCommand = {
  name: "/list",
  async execute(args, ctx) {
    const { body } = ctx;
    const target = args[0] || "sessions";
    if (target === "sessions") {
      const result = await fetchGet<{ live?: unknown[]; parked?: unknown[]; ended?: unknown[] }>(`/api/session`);
      if (!result.ok) { push(body, `/list sessions failed [${result.failure_class}] ${result.detail}`, CLS.err); return; }
      for (const [bucket, entries] of Object.entries(result.data)) {
        if (!Array.isArray(entries)) continue;
        for (const e of entries) {
          const rec = e as { session_id?: string; name?: string | null; driver?: string };
          push(body, `[${bucket}] ${rec.name || rec.session_id} (${rec.driver ?? "?"})`, CLS.out);
        }
      }
      return;
    }
    if (target === "records") {
      const result = await fetchGet<Array<{ name: string; status?: string; started_at?: string }>>(`/api/records`);
      if (!result.ok) { push(body, `/list records failed [${result.failure_class}] ${result.detail}`, CLS.err); return; }
      for (const r of result.data) push(body, `${r.name}${r.status ? `  (${r.status})` : ""}`, CLS.out);
      push(body, `${result.data.length} record(s)`, CLS.dim);
      return;
    }
    if (target === "topologies") {
      const result = await fetchGet<string[]>(`/api/topologies`);
      if (!result.ok) { push(body, `/list topologies failed [${result.failure_class}] ${result.detail}`, CLS.err); return; }
      for (const n of result.data) push(body, n, CLS.out);
      return;
    }
    if (target === "applications") {
      const result = await fetchGet<Array<{ name: string; description?: string }>>(`/api/applications`);
      if (!result.ok) { push(body, `/list applications failed [${result.failure_class}] ${result.detail}`, CLS.err); return; }
      for (const a of result.data) push(body, `${a.name}${a.description ? `  — ${a.description}` : ""}`, CLS.out);
      return;
    }
    if (target === "bundles") {
      push(body, "/list bundles — GET /api/bundles is sprint 034a; not yet shipped", CLS.err);
      return;
    }
    push(body, `/list ${target}: unknown target (try records|topologies|sessions|applications|bundles)`, CLS.err);
  },
};
