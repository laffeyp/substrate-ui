// Sprint 087c smoke — proves the version picker actually pins the
// model. For each installed CLI the server reports, this flow picks
// ONE non-default pin, opens a session with driver_version = that
// pin, sends "in five words, what model are you?", and asserts a
// non-empty ModelReply. Not the full matrix — just enough to catch
// the class of defect where openSession refuses driver_version at
// validation and the picker silently does nothing (Sprint 087c
// bug, session_registry allowlist).
//
// Deliberately minimal: one CLI × one pin per run. A full matrix
// would spin dozens of live turns per pass. No tags are declared: a box
// with no authenticated CLI has nothing to drive, and every check on a
// present CLI is a defect.

import { NodeSubstrateClient } from "./lib/client";
import { BASE_URL } from "./lib/server";
import type { Flow, EmittedRecord, Defect } from "./lib/flow";

const PARK_TIMEOUT_MS = 90_000;

interface Pin { id: string; label: string }
interface Family { id: string; label: string; default_pin: string | null; pins: Pin[] }
interface CliVersionsEntry { families: Family[]; default_family: string | null; source: string }

export const flow: Flow = {
  name: "cli_version_picker",
  declared: [],
  async run(): Promise<{ emitted: EmittedRecord[]; defects: Defect[] }> {
    const emitted: EmittedRecord[] = [];
    const defects: Defect[] = [];

    const res = await fetch(`${BASE_URL}/api/models`);
    const roster = (await res.json()) as { cli?: string[]; cli_versions?: Record<string, CliVersionsEntry> };
    const cli = Array.isArray(roster.cli) ? roster.cli : [];
    const versions = roster.cli_versions || {};

    for (const driver of cli) {
      const tree = versions[driver];
      if (!tree || !tree.families?.length) continue;

      // Auth check — cli_discovery skips unauthed CLIs. Same rule here.
      try {
        const statusRes = await fetch(`${BASE_URL}/api/cli/${driver}/status`);
        const status = (await statusRes.json()) as { authed: boolean | null };
        if (status.authed === false) {
          console.log(`    cli_version_picker: ${driver} is not authenticated; skipped`);
          continue;
        }
      } catch { /* fall through */ }

      // Pick the first non-default pin from the first family with more
      // than one pin. If none, fall back to the family's default pin.
      let pickId: string | null = null;
      let pickLabel = "";
      for (const fam of tree.families) {
        const alt = (fam.pins || []).find((p) => p.id !== fam.default_pin);
        if (alt) { pickId = alt.id; pickLabel = `${fam.label} ${alt.label}`; break; }
      }
      if (!pickId) {
        const fam = tree.families[0];
        const p = fam.pins?.[0];
        if (!p) continue;
        pickId = p.id; pickLabel = `${fam.label} ${p.label}`;
      }

      // Open the session directly against the HTTP API — this is what
      // the client does and it is what broke pre-fix. No SessionController
      // here so we exercise the raw shape.
      const client = new NodeSubstrateClient(BASE_URL);
      try {
        emitted.push({ tag: "SESSION_OPEN_REQUESTED", payload: { driver, pick: pickId } });
        const create = await client.fetchJson<{ session_id: string }>("/api/session", {
          method: "POST",
          body: {
            driver,
            driver_params: { driver_version: pickId },
          },
        });
        if (!create.ok) {
          defects.push({
            category: "cli_version_open_failed",
            observed: `openSession refused driver=${driver} driver_version=${pickId}: ${create.detail}`,
            expected: `driver_params.driver_version is accepted for every installed CLI`,
            reproduces: true,
            severity: "high",
          });
          continue;
        }
        const sid = create.data.session_id;
        emitted.push({ tag: "SESSION_OPEN_ACKED", payload: { session_id: sid, driver, pick: pickId } });

        const turnRes = await client.fetchJson<unknown>(
          `/api/session/${encodeURIComponent(sid)}/turn`,
          { method: "POST", body: { text: "in five words, what model are you?" }, timeoutMs: PARK_TIMEOUT_MS },
        );
        if (!turnRes.ok) {
          defects.push({
            category: "cli_version_turn_failed",
            observed: `POST /turn refused driver=${driver} pick=${pickId}: ${turnRes.detail}`,
            expected: `every picked pin accepts a turn`,
            reproduces: true,
            severity: "high",
          });
        } else {
          emitted.push({ tag: "TURN_SUBMITTED", payload: { session_id: sid, pick: pickId } });
        }

        // Read the session's SSE stream (the endpoint IS a stream; UI sprint 097 — the flow used
        // to fetch it as a JSON page, with a max_wait_ms the endpoint does not have, and hung)
        // until it parks, or the deadline passes.
        let sawModelReply = false;
        let sawPark = false;
        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => { stop(); resolve(); }, PARK_TIMEOUT_MS);
          const stop = client.streamRecord(sid, -1, {
            onEnvelope: (env: { kind?: string; payload?: Record<string, unknown> }) => {
              emitted.push({ tag: "STREAM_ENVELOPE_APPENDED", payload: { kind: env.kind } });
              if (env.kind === "ModelReply") {
                const text = typeof env.payload?.text === "string" ? env.payload.text : "";
                if (text.trim().length > 0) sawModelReply = true;
              }
              if (env.kind === "Returned" || env.kind === "Park" || env.kind === "SessionEnded") {
                sawPark = true;
                clearTimeout(timer); stop(); resolve();
              }
            },
            onError: () => { /* keep waiting until the deadline */ },
          });
        });
        if (sawPark) emitted.push({ tag: "TURN_PARKED", payload: { session_id: sid, pick: pickId } });
        if (!sawModelReply) {
          defects.push({
            category: "cli_version_no_reply",
            observed: `driver=${driver} pick=${pickId} (${pickLabel}) produced no ModelReply text`,
            expected: `the picked pin runs and emits a non-empty ModelReply`,
            reproduces: false,
            severity: "high",
          });
        }

        // Clean up.
        await client.fetchJson<unknown>(
          `/api/session/${encodeURIComponent(sid)}/end`,
          { method: "POST", body: { source: "smoke_done" } },
        );
      } catch (err) {
        defects.push({
          category: "cli_version_probe_crashed",
          observed: `driver=${driver} pick=${pickId}: ${err instanceof Error ? err.message : String(err)}`,
          expected: `openSession + turn + park end-to-end for the picked pin`,
          reproduces: true,
          severity: "high",
        });
      }

      // One CLI × one pin per pass is enough — bail after the first
      // authed CLI so the pass stays under ~90s.
      break;
    }

    return { emitted, defects };
  },
};
