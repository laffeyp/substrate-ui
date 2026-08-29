/* Sprint 040a — console health surface, extracted from web/app.ts.

   Owns two DOM elements: `#verdict` in the head (top badge) and
   `#health` at the bottom of the desktop view (verdict + stats bar +
   application-event chips). Every field the module reads about the
   run's state comes in as a typed `HealthSnapshot`; the caller
   (`web/app.ts::render`) assembles the snapshot from STATE.

   Two entry points:
   - `mountHealth(deps) → HealthHandle` at boot, once.
   - `handle.renderVerdict(snap)` from the live-follow paths that
     refresh only the top badge (selectRecord + followLive).
   - `handle.render(snap)` from the main render() dispatcher.

   Emits HEALTH_RENDERED per full render (unchanged from prior site). */

import { emit } from "../instrumentation/sdd";

export interface HealthSummary {
  producers_started: number;
  producers_completed: number;
  producers_failed: number;
  producers_cancelled: number;
  input_build_failures: number;
  predicate_quarantines: number;
  invalid_emissions: number;
  application_events: Record<string, number>;
}

export interface HealthSnapshot {
  status: string;
  final_reason: string | null;
  paused_on: string | null;
  graphLive: boolean;
  live: string | null;
  name: string | null;
  summary: HealthSummary;
}

export interface HealthDeps {
  paneCtx: (pane_id: string, extra?: Record<string, unknown>) => Record<string, unknown>;
}

export interface HealthHandle {
  renderVerdict: (snap: HealthSnapshot) => void;
  render: (snap: HealthSnapshot) => void;
}

const _esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c] as string);

const _setVerdictVariant = (el: HTMLElement, variant: string): void => {
  // Preserve inherited classes (`desktop-only` from index.html) — sprint 037b
  // caught className-replacement wiping it. Only strip `v-*` modifiers.
  for (const c of Array.from(el.classList)) {
    if (c.startsWith("v-")) el.classList.remove(c);
  }
  el.classList.add("verdict", "v-" + variant);
};

export function mountHealth(deps: HealthDeps): HealthHandle {
  const verdictEl = document.getElementById("verdict");
  const healthEl = document.getElementById("health");
  if (!verdictEl) throw new Error("mountHealth: #verdict element missing from DOM");
  if (!healthEl) throw new Error("mountHealth: #health element missing from DOM");

  const renderVerdict = (snap: HealthSnapshot): void => {
    const st = snap.status;
    if (snap.live === snap.name && st === "incomplete" && snap.graphLive) {
      _setVerdictVariant(verdictEl, "live");
      verdictEl.textContent = "● LIVE";
      return;
    }
    const s = snap.summary;
    const fails = s.producers_failed + s.input_build_failures + s.predicate_quarantines + s.invalid_emissions;
    const notClean = st === "finalised" && fails > 0;
    _setVerdictVariant(verdictEl, notClean ? "failed" : st);
    verdictEl.textContent = st === "failed"
      ? "● FAILED · " + (snap.final_reason || "").toUpperCase().replace(/_/g, " ")
      : st === "paused" ? "● PAUSED"
      : st === "incomplete" ? "● INCOMPLETE"
      : notClean ? "● FINALISED · NOT CLEAN"
      : "● FINALISED";
  };

  const render = (snap: HealthSnapshot): void => {
    const s = snap.summary;
    const st = snap.status;
    const fails = s.producers_failed + s.input_build_failures + s.predicate_quarantines + s.invalid_emissions;
    const broken = st === "failed" || fails > 0 || st === "incomplete";
    const verdict = st === "failed"
      ? "● FAILED · " + _esc((snap.final_reason || "").toUpperCase().replace(/_/g, " "))
      : st === "paused" ? "● PAUSED"
      : st === "incomplete" ? "● INCOMPLETE (no terminal)"
      : fails > 0 ? "● FINALISED · NOT CLEAN"
      : "● FINALISED · CLEAN";
    const msg = st === "failed"
      ? "the run itself failed — finished is not worked."
      : st === "incomplete" ? "no terminal RunFinalised — torn or still being written."
      : st === "paused" ? `halted resumably — awaiting ${_esc(snap.paused_on || "input")}`
      : fails > 0 ? `reached RunFinalised — but ${fails} thing(s) inside failed. Finished is not worked.`
      : "reached RunFinalised with no failures.";
    const stat = (n: number, l: string, cls: string): string =>
      `<div class="stat ${cls}"><b>${n}</b><span class="l">${l}</span></div>`;
    const work = Object.entries(s.application_events)
      .map(([k, n]) => `<span class="chip">${n} ${_esc(k)}</span>`)
      .join("");
    healthEl.className = "health" + (broken ? " broken" : "");
    healthEl.innerHTML =
      `<span class="verdict ${broken ? "v-failed" : "v-finalised"}">${verdict}</span>
      ${stat(s.producers_started, "STARTED", "")}${stat(s.producers_completed, "COMPLETED", "grn")}
      ${stat(s.producers_failed, "FAILED", fails ? "red" : "")}${stat(s.invalid_emissions, "INVALID", "")}
      ${stat(s.producers_cancelled, "CANCELLED", "")}
      <span class="msg">${msg}</span><span class="work">${work}</span>`;
    const verdictEnum =
      st === "failed" ? "FAILED"
      : st === "paused" ? "PAUSED"
      : st === "incomplete" ? (snap.live === snap.name && snap.graphLive ? "LIVE" : "INCOMPLETE")
      : "FINALISED";
    emit("HEALTH_RENDERED", deps.paneCtx("health", { verdict: verdictEnum }));
  };

  return { renderVerdict, render };
}
