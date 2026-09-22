/* Sprint 034b — rail module: four buckets over the daemon's read surface.
   Extracted from web/app.ts's inline loadRecords. Consumes 034a's two
   endpoints (/api/records?exclude_sessions=true + /api/bundles) plus the
   pre-existing /api/session (for live) and /api/records (for the "recent
   records" bucket's freshest session-shaped entries).

   Four buckets, in visual order:
   - live sessions     (running-status manifests from /api/session)
   - recent records    (newest ~10 session-shaped records from /api/records)
   - bundles           (bundle catalog from /api/bundles)
   - records           (collapsed; every non-session record)

   Fires RECORDS_LOADED{bucket, count} once per bucket per refresh (piece G
   payload field is v0.7-locked). */

import { emit } from "./instrumentation/sdd";

type RailDeps = {
  api: (path: string) => Promise<any>;
  escapeHtml: (s: string) => string;
  selectRecord: (name: string) => void;
  onRailPopulated?: (records: any[]) => void;
};

type Bucket = "sessions" | "recent" | "bundles" | "records";

const RECENT_RECORDS_MAX = 10;

const _mkHdr = (label: string, count: number, extra?: string) => {
  const h = document.createElement("div");
  h.className = "rail-group";
  h.innerHTML = `${label} · ${count}${extra ?? ""}`;
  return h;
};

const _mkRec = (r: any, esc: (s: string) => string, onClick: () => void) => {
  const div = document.createElement("div");
  div.className = "rec";
  div.dataset.name = r.name;
  const broken = r.status === "failed" || r.producers_failed > 0;
  const color =
    r.status === "failed" ? "var(--red)" :
    r.status === "paused" ? "var(--cyan)" :
    r.status === "incomplete" ? "var(--amber)" :
    broken ? "var(--red)" : "var(--green)";
  const meta =
    r.status === "failed" ? `FAILED · ${r.final_reason || ""}` :
    r.status === "paused" ? `paused · awaiting ${r.paused_on || "input"}` :
    broken ? `${r.producers_failed} failures · finalised` :
    `${r.status} · ${r.total_events} events`;
  div.innerHTML = `<span class="dot" style="background:${color}"></span>
    <div class="nm">${esc(r.name)}</div><div class="meta ${broken ? "broken" : ""}">${esc(String(r.run_id || "").slice(0, 8))}… · ${esc(meta)}</div>`;
  div.onclick = onClick;
  return div;
};

const _mkSession = (
  s: any,
  esc: (s: string) => string,
  status: string,
  selectRecord: (name: string) => void,
) => {
  const div = document.createElement("div");
  div.className = "rec session";
  div.dataset.sessionId = s.session_id;
  const color =
    status === "live" ? "var(--green)" :
    status === "parked" ? "var(--cyan)" :
    status === "interrupted" ? "var(--amber)" :
    "var(--dim)";
  const label = s.name || s.session_id.slice(0, 12) + "…";
  div.innerHTML = `<span class="dot" style="background:${color}"></span>
    <div class="nm">${esc(label)}</div><div class="meta">${esc(status)} · ${esc(s.driver || "?")}</div>`;
  // Sprint 045: session rows are clickable and resolve to the session's
  // record. server.py _record_path routes `s_<id>` names to
  // ~/.substrate/sessions/<id>/record — so selectRecord(session_id)
  // loads the live session's graph/events/summary just like a regular
  // record. Before, the row rendered with no onclick and looked dead.
  div.style.cursor = "pointer";
  div.onclick = () => selectRecord(s.session_id);
  return div;
};

const _mkBundle = (b: any, esc: (s: string) => string) => {
  const div = document.createElement("div");
  div.className = "rec bundle";
  div.dataset.bundleName = b.name;
  div.innerHTML = `<span class="dot" style="background:var(--purple, #a78bfa)"></span>
    <div class="nm">${esc(b.name)}</div><div class="meta">${esc(b.description || "")}</div>`;
  return div;
};

const _fireBucket = (bucket: Bucket, count: number, extra: Record<string, unknown> = {}) => {
  emit("RECORDS_LOADED", { bucket, count, ...extra });
};

export type RailHandle = {
  refresh: () => Promise<void>;
  el: HTMLElement;
};

export function mountRail(el: HTMLElement, deps: RailDeps): RailHandle {
  const { api, escapeHtml: esc, selectRecord, onRailPopulated } = deps;

  async function refresh(): Promise<void> {
    const [sessBuckets, allRecords, bundles] = await Promise.all([
      api("/api/session").catch(() => ({ live: [], parked: [], ended: [], interrupted: [] })),
      api("/api/records").catch(() => []),
      api("/api/bundles").catch(() => []),
    ]);

    el.innerHTML = "";

    // Bucket 1: live sessions (running + parked + interrupted grouped as "live-ish").
    const live: any[] = sessBuckets.live || [];
    const parked: any[] = sessBuckets.parked || [];
    const interrupted: any[] = sessBuckets.interrupted || [];
    const sessionsAll = [
      ...live.map((s) => ({ ...s, _status: "live" })),
      ...parked.map((s) => ({ ...s, _status: "parked" })),
      ...interrupted.map((s) => ({ ...s, _status: "interrupted" })),
    ];
    el.appendChild(_mkHdr("live sessions", sessionsAll.length));
    sessionsAll.forEach((s) => el.appendChild(_mkSession(s, esc, s._status, selectRecord)));
    _fireBucket("sessions", sessionsAll.length, {
      run_count: live.length,
      demo_count: 0,
    });

    // Bucket 2: recent records — newest N runs by ULID (source==="run").
    const runs = (allRecords as any[])
      .filter((r) => r.source === "run")
      .sort((a, b) => (b.run_id || "").localeCompare(a.run_id || ""));
    const recent = runs.slice(0, RECENT_RECORDS_MAX);
    const hdr = _mkHdr(
      "recent records",
      recent.length,
      runs.length ? ` <span class="rail-clear" title="delete all your session runs — the demos are kept">clear</span>` : "",
    );
    if (runs.length) {
      const clear = hdr.querySelector(".rail-clear") as HTMLElement | null;
      if (clear) {
        clear.onclick = async (ev) => {
          ev.stopPropagation();
          if (!window.confirm(`Delete all ${runs.length} session runs? (the demos are kept)`)) return;
          const cleared_count = runs.length;
          await fetch("/api/runs/clear", { method: "POST" }).then((x) => x.json());
          emit("RECORDS_PRUNED", { cleared_count });
          await refresh();
        };
      }
    }
    el.appendChild(hdr);
    recent.forEach((r) =>
      el.appendChild(_mkRec(r, esc, () => selectRecord(r.name))),
    );
    _fireBucket("recent", recent.length, {
      run_count: recent.length,
      demo_count: 0,
    });

    // Bucket 3: bundles catalog.
    el.appendChild(_mkHdr("bundles", (bundles as any[]).length));
    (bundles as any[]).forEach((b) => el.appendChild(_mkBundle(b, esc)));
    _fireBucket("bundles", (bundles as any[]).length, {
      run_count: 0,
      demo_count: 0,
    });

    // Bucket 4: records (collapsed) — the demos and any non-session, non-recent record.
    const demos = (allRecords as any[]).filter((r) => r.source !== "run");
    el.appendChild(_mkHdr("records", demos.length));
    demos.forEach((r) =>
      el.appendChild(_mkRec(r, esc, () => selectRecord(r.name))),
    );
    _fireBucket("records", demos.length, {
      run_count: 0,
      demo_count: demos.length,
    });

    if (onRailPopulated) onRailPopulated(allRecords as any[]);
  }

  return { refresh, el };
}
