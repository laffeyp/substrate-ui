/* substrate-ui live console — reads the REAL substrate read API over HTTP (server.py).
   Every surface is a projection of one record; nothing is invented (§7.1). The one seq-cursor
   drives the graph and the stream in lock-step. Failures are loud (§7.2); concurrency comes from
   the spawn structure — fired_seq + spawn cohorts — not span overlap (§7.3). The eight words only. */
"use strict";

import { emit, VOCAB_VERSION } from "./instrumentation/sdd";

emit("SESSION_INIT", { vocab_version: VOCAB_VERSION, url: window.location.href });
window.addEventListener("beforeunload", () => { emit("SESSION_ENDED", {}); });

// Monotonic paint counter that feeds view_payload_universal.frame on every pane-render emit
// (vocab § view stratum: signals a pane redraw regardless of what changed). One shared counter,
// not per-pane, so the trace preserves the paint ORDER across panes within a render() pass.
let _paintFrame = 0;
const _paneCtx = (pane_id: string, extra: Record<string, unknown> = {}) => ({
  frame: ++_paintFrame,
  visible: true,  // pane-render tags fire only when render() dispatched to the active pane
  pane_id,
  subject_record: STATE.name,
  ...extra,
});

// Sprint 040 (typing pass) — asserting getElementById. Every id in
// web/index.html the app touches is present in the DOM by the time the
// module runs (mount order). A missing element is a bug; throwing here
// is louder + typechecks each call site as non-null.
const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing from DOM`);
  return el as T;
};
// api() is the single seam every read fetches through. Non-2xx responses AND thrown network errors
// both emit FETCH_FAILED{endpoint, status_or_error} — one incident tag, one seam. Callers still
// receive the parsed body (or a rejected promise on network error), so no consumer needs to change.
const api = (p: string): Promise<any> => fetch(p).then(async (r: Response) => {
  if (!r.ok) {
    emit("FETCH_FAILED", { endpoint: p, status_or_error: String(r.status) });
  }
  return r.json();
}).catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  emit("FETCH_FAILED", { endpoint: p, status_or_error: msg });
  throw e;
});

const FAILURE = new Set([
  "substrate.ProducerFailed", "substrate.InputBuildFailed",
  "substrate.PredicateQuarantined", "substrate.ProducerEmittedInvalidEvent",
]);

function category(kind: string): string {
  if (FAILURE.has(kind)) return "failure";
  if (kind === "substrate.ProducerCancelled") return "cancelled";
  if (kind === "substrate.RunFinalised") return "finalise";
  if (kind === "substrate.TerminationMatched") return "termination";
  if (kind === "substrate.TriggerFired") return "trigger";
  if (kind === "substrate.RunStarted") return "open";
  if (kind.startsWith("substrate.")) return "lifecycle";
  return "application";
}
const shortKind = (k: string): string => (k.startsWith("substrate.") ? k.slice(10) : k);
function gist(ev: RunEvent): string {
  const p = (ev.payload || {}) as Record<string, unknown>;
  if (ev.kind === "substrate.TriggerFired") return `${p.trigger_id} → ${p.factory}`;
  if (ev.kind === "substrate.TerminationMatched") return String(p.decision || "");
  if (ev.kind === "substrate.ProducerFailed") {
    const prod = p.producer as { kind?: string } | undefined;
    return (prod?.kind ?? "") + ": " + (p.error || "");
  }
  if (ev.producer && typeof ev.producer === "object") {
    const fields = Object.entries(p).filter(([k]) => !["producer", "raw_payload"].includes(k))
      .slice(0, 3).map(([k, v]) => `${k}=${String(v).slice(0, 22)}`).join(", ");
    return fields;
  }
  if (p.run_id) return `run_id ${p.run_id}`;
  return "";
}

import { createAppState, type AppState, type RunEvent, type RunGraphInstance } from "./state";
import { mountRail, type RailHandle } from "./rail";
import type { HealthHandle as _HealthHandle, HealthSummary as _HealthSummary } from "./console/health.js";
import type { TransportHandle as _TransportHandle } from "./console/transport.js";
const STATE: AppState = createAppState();
// Sprint 040a/b: console handles bound at boot; declared here so
// hoisted delegates (renderHealth, selectRecord, ...) can reference them.
let _healthHandle: _HealthHandle | null = null;
let _transportHandle: _TransportHandle | null = null;
type HealthSummary = _HealthSummary;

// the time dimension alongside the order: seq is the order (no time), t the time (no order). Show
// t RELATIVE to the run's start (events[0] = RunStarted) — ~0 on the deterministic CI demos (they
// ARE instant), and the real per-turn gaps on a real-model run.
function relT(t: number | undefined): string {
  const t0 = STATE.events.length ? (STATE.events[0].t ?? 0) : (t ?? 0);
  const d = (t ?? 0) - t0;
  return "t+" + (d < 10 ? d.toFixed(3) : d.toFixed(1)) + "s";
}

// ---------- record rail ----------
// Sprint 034b: the rail extracted into `web/rail.ts` as a four-bucket module
// (live sessions, recent records, bundles, records-collapsed). `loadRecords`
// stays here as the app-side wrapper — it drives rail refresh + preserves the
// diff-selector + STATE.resumable + first-load auto-select behavior via the
// `onRailPopulated(records)` callback the rail module invokes after render.
let _rail: RailHandle | null = null;
const _railOnPopulated = (recs: any[]) => {
  STATE.resumable = new Set(recs.filter((r) => r.resumable).map((r) => r.name));
  const sel = $<HTMLSelectElement>("diffsel");
  if (sel) {
    sel.innerHTML = '<option value="">⇄ diff vs…</option>' +
      recs.map((r) => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)}</option>`).join("");
    sel.onchange = () => { if (sel.value) { emit("DIFF_REQUESTED", { a: STATE.name, b: sel.value }); renderDiff(sel.value); } };
  }
  if (STATE.name === null) {
    const want = new URLSearchParams(location.search).get("record");
    const runs = recs.filter((r) => r.source === "run").sort((a, b) => (b.run_id || "").localeCompare(a.run_id || ""));
    const demos = recs.filter((r) => r.source !== "run");
    const ordered = [...runs, ...demos];
    const target = (want && recs.some((r) => r.name === want)) ? want : (ordered[0] && ordered[0].name);
    if (target) selectRecord(target);
  }
};
async function loadRecords() {
  if (!_rail) {
    _rail = mountRail($("rail"), {
      api,
      escapeHtml,
      selectRecord: (name) => { STATE.delegateParent = null; selectRecord(name); },
      onRailPopulated: _railOnPopulated,
    });
  }
  await _rail.refresh();
}

// ---------- assays: many records (arms × cases × trials) read as ONE arm comparison ----------
// A different ALTITUDE than the per-run console. Read-only projection of /api/assays + /api/assay/<name>
// (the same build_report the CLI prints). The review's invariants are DISPLAY RULES here: both
// currencies always rendered (no metric-splice possible), the margin-verdict colored + distinct from
// "significantly worse", null shown as "—", provenance pinned.
async function loadAssays() {
  const assays = await api("/api/assays").catch(() => []);
  STATE.assays = assays;
  emit("ASSAYS_LOADED", { count: assays.length });
  if (!assays.length) return;
  const rail = $("rail");
  const grp = document.createElement("div");
  grp.className = "rail-group";
  grp.textContent = `assays · ${assays.length}`;
  rail.insertBefore(grp, rail.firstChild);
  (assays as AssayIndexRow[]).slice().reverse().forEach((a) => {  // newest visual position just under the group header
    const div = document.createElement("div");
    div.className = "assay";
    div.dataset.name = a.name;
    const models = a.strong_model ? `${a.strong_model} vs ${(a.weak_models || []).length} weak` : `${a.arms?.length ?? 0} arms`;
    div.innerHTML = `<span class="dot"></span><div class="nm">${escapeHtml(a.name)}</div>
      <div class="meta">${escapeHtml(models)} · ${a.n_cells} cells</div>`;
    div.onclick = () => selectAssay(a.name);
    rail.insertBefore(div, grp.nextSibling);
  });
}

// Sprint 040 (typing pass) — shapes the assay-index endpoint returns.
type AssayIndexRow = {
  name: string;
  strong_model?: string | null;
  weak_models?: string[];
  arms?: unknown[];
  n_cells: number;
};

async function selectAssay(name: string) {
  const prior_name = STATE.assay;
  emit("ASSAY_SELECTED", { name, prior_name });
  _transportHandle?.stopPlay();
  STATE.live = null; STATE.name = null; STATE.mode = "assay"; STATE.assay = name; STATE.assayReport = null;
  document.querySelectorAll<HTMLElement>(".rec").forEach((e) => e.classList.remove("sel"));
  document.querySelectorAll<HTMLElement>(".assay").forEach((e) => e.classList.toggle("sel", e.dataset.name === name));
  $("runname").textContent = name; $("runid").textContent = "";
  $("assaypane").innerHTML = `<div class="col-h">assay · arm matrix — ${escapeHtml(name)}</div><div class="am dim">reading ${escapeHtml(name)}…</div>`;
  render();  // flips the chrome to assay mode immediately
  const d = await api(`/api/assay/${encodeURIComponent(name)}`).catch(() => ({ error: "fetch failed" }));
  if (STATE.assay !== name) return;  // switched while the fetch was in flight (mirrors selectRecord's guard)
  STATE.assayReport = d;
  const arms = (d && d.arms) || [];
  const cases = (d && d.cases) || [];
  const verdict = d && d.overall_verdict;
  emit("ASSAY_REPORT_LOADED", { name, arm_count: arms.length, case_count: cases.length, ...(verdict ? { verdict } : {}) });
  render();
}

const _fmtD = (v: number | null | undefined): string => (v == null ? "—" : (v >= 0 ? "+" : "") + v.toFixed(3));
const _pct = (v: number): string => Math.round(v * 100) + "%";
const _pctD = (v: number | null | undefined): string => (v == null ? "—" : (v >= 0 ? "+" : "−") + Math.round(Math.abs(v) * 100) + " pts");
const _kfmt = (n: number | null | undefined): string => (!n ? "—" : n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n));
const _term = (word: string, def: string): string => `<span class="term" data-def="${escapeHtml(def)}">${escapeHtml(word)}</span>`;
// the four statistical verdicts, said in plain English (the stats name stays in the hover definition).
const VERDICT = {
  inferior: ["worse", "We're confident this is behind the bar by a meaningful amount. (stats: 'inferior')"],
  equivalent: ["as good as", "Enough data to actually rule out a meaningful gap — a real tie, not just 'no result'. (stats: 'equivalent')"],
  underpowered: ["can't claim a tie yet", "The gap looks small enough to be a tie, BUT there aren't enough problems to claim it at this margin — you'd need more runs. This is the honest brake on declaring 'as good as' too early. (stats: 'underpowered')"],
  inconclusive: ["can't tell yet", "Not enough data to call it either way — the result straddles the line. (stats: 'inconclusive')"],
  superior: ["better", "We're confident this is ahead of the bar. (stats: 'superior')"],
};

function renderAssayFrom(d: any) {
  if (!d) return;
  if (d.error) { $("assaypane").innerHTML = `<div class="col-h">assay · arm matrix</div><div class="am"><span class="dim">${escapeHtml(d.error)}</span></div>`; return; }
  const r = d.report, m = d.meta || {}, e = escapeHtml;
  const N = r.arms.length ? r.arms[0].n_cases : 0;
  const tries = m.trials ? `${m.trials} tries` : "every try";
  const ran = r.control_check.state === "pass";
  const prov = `<div class="am-prov">
    <span><b>${e(r.suite)}</b> — comparing ways to write code</span>
    <span>the bar to beat: <b>${e(m.strong_model || r.control_arm)}</b></span>
    ${m.weak_models ? `<span>challengers use: ${e(m.weak_models.join(", "))}</span>` : ""}
    <span>${N} problems${m.trials ? ` × ${m.trials} tries each` : ""}</span>
    ${m.config_fp ? `<span>run <span class="fp">${e(m.config_fp)}</span></span>` : ""}
    <span>provenance: <b class="${m._provenance === "tampered" ? "k-failure" : m._provenance === "verified" ? "diff-eq" : "dim"}">${_term(m._provenance || "unverified", "verified = the recorded settings (margin, models) are cryptographically tied to this run, so nobody edited them afterward. tampered = the settings were changed after the run — do NOT trust the verdict. unverified = an older run with no fingerprint to check.")}</b></span>
    <span>every approach actually ran: <b class="${ran ? "diff-eq" : "k-failure"}">${ran ? "yes" : e(r.control_check.state)}</b></span></div>`;
  const rows = (r.arms as any[]).map((a: any) => {
    const ctl = a.arm === r.control_arm;
    const incomplete = !ctl && a.complete === false;  // didn't grade every problem -> no verdict (the gate)
    const flake = a.pass_at_1 - a.pass_rate;
    let verdict = "—";
    if (a.equivalence && (VERDICT as Record<string, string[]>)[a.equivalence]) { const [w, def] = (VERDICT as Record<string, string[]>)[a.equivalence]; verdict = `<span class="v-${e(a.equivalence)}">${_term(w, def)}</span>`; }
    const gapRel = a.delta_vs_control == null ? "—"
      : `${_pctD(a.delta_vs_control)}${a.p_value != null && a.p_value < 0.05 ? ` ${_term("real", `Unlikely to be luck — the gap is statistically significant (McNemar test, p=${a.p_value.toFixed(3)}).`)}` : a.p_value != null ? ` <span class="dim">(maybe luck)</span>` : ""}`;
    const gapAtt = a.delta_pass_k == null ? "—"
      : `${_pctD(a.delta_pass_k)} ${a.ci_low != null ? _term("± range", `We're 95% sure the true gap is between ${_pctD(a.ci_low)} and ${_pctD(a.ci_high)} (the confidence interval).`) : ""} ${verdict}`;
    const stillRunning = `<span class="dim">${_term("still running — no verdict", "This approach hasn't finished every problem yet. We never show a verdict off a partial run — a half-finished sweep could look better (or worse) than it really is.")}</span>`;
    const compute = a.model_calls
      ? _term(_kfmt(a.model_calls) + " calls", `Total model calls this approach made across all problems and tries — its compute cost (${a.completion_tokens ? _kfmt(a.completion_tokens) + " output tokens" : "tokens not measured"}). Orchestration around free models usually costs MORE calls than the single strong model, so the fair question is 'as good as — at what compute?'`)
      : `<span class="dim" title="this run was not metered">not measured</span>`;
    return `<tr class="${ctl ? "control" : ""}" data-arm="${e(a.arm)}">
      <td><span class="arm-nm">${e(a.arm)}</span></td>
      <td><div class="rel"><span>${a.passes}/${a.n_cases}</span><span class="relbar"><i style="width:${Math.round(a.pass_rate * 100)}%"></i></span><span class="dim">${_pct(a.pass_rate)}</span></div></td>
      <td>${_pct(a.pass_at_1)}</td>
      <td class="flake">${flake > 0.005 ? "−" + Math.round(flake * 100) + " pts" : "—"}</td>
      <td class="dim">${compute}</td>
      ${incomplete ? `<td colspan="2">${stillRunning}</td>` : `<td>${gapRel}</td><td>${gapAtt}</td>`}</tr>`;
  }).join("");
  const table = `<table><tr>
    <th>approach</th>
    <th>solved reliably<span class="hdr-sub">${_term("every try", `Passed the problem on all ${e(tries)} — dependable, not one lucky pass. (stats name: pass^k)`)}</span></th>
    <th>solved sometimes<span class="hdr-sub">${_term("per attempt", "The share of individual tries that passed — counts a problem the approach only cracks now and then. (stats name: pass@1)")}</span></th>
    <th>${_term("flakiness", "How far the score drops when you demand it works EVERY time vs. just sometimes. High = solves it, but not dependably.")}</th>
    <th>${_term("compute", "What each approach SPENT (model calls). The honest counterweight to a near-tie: orchestration around free models can match the strong model but at several times the calls.")}</th>
    <th>gap vs the bar<span class="hdr-sub">on reliable score</span></th>
    <th>gap vs the bar<span class="hdr-sub">on per-attempt + verdict</span></th></tr>${rows}</table>`;
  const note = `<div class="am-note">
    <span class="ln"><b>How to read this.</b> Each row is one way of writing code, measured against the strong model — <b>the bar</b>. There are two honest ways to count a "win", and they mean different things, so they're shown side by side instead of blended into one flattering number:</span>
    <span class="ln">• <b>Solved reliably</b> — it passed the problem on <b>every single try</b>. The strict count.</span>
    <span class="ln">• <b>Solved sometimes</b> — the share of individual tries that passed. Looser: it counts a problem the approach only gets right occasionally.</span>
    <span class="ln">• <b>Flakiness</b> is the gap between those two — "−18 pts" means requiring it every time costs 18 points vs. just sometimes. Big = works, but not dependably.</span>
    <span class="ln">The <b>verdict</b> says whether an approach is <span class="v-inferior">worse</span>, <span class="v-equivalent">as good as</span>, or <span class="v-superior">better</span> than the bar. "As good as" is only claimed with <b>enough data to truly rule out a gap</b>; on a small or unfinished run you'll honestly see <span class="v-inconclusive">can't tell yet</span> — that's the truth, not a failure. Hover or click a <span class="term" data-def="Exactly — the dotted words have a plain definition on hover or click.">dotted word</span> for what it means.</span></div>`;
  $("assaypane").innerHTML = `<div class="col-h">assay · arm matrix — ${e(STATE.assay)}</div><div class="am">${prov}${table}${note}</div>`;
  $("assaypane").querySelectorAll<HTMLElement>(".term").forEach((t) => (t.onclick = () => t.classList.toggle("pin")));
}

// ---------- thin control: launch a bundled topology (records RunStarted, §7.7) ----------
async function loadTopologies() {
  const topos = await api("/api/topologies");
  $<HTMLSelectElement>("launchsel").innerHTML = '<option value="">+ launch a topology…</option>' +
    (topos as string[]).map((t: string) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
}
$("launchbtn").onclick = async () => {
  const t = $<HTMLSelectElement>("launchsel").value;
  if (!t) return;
  emit("TOPOLOGY_LAUNCH_REQUESTED", { topology_name: t });
  $("launchmsg").textContent = `launching ${t}…`;
  const res = await fetch(`/api/launch?topology=${encodeURIComponent(t)}`, { method: "POST" }).then((r) => r.json());
  if (res && res.error) { emit("LAUNCH_REJECTED", { kind: "topology", reason: String(res.error) }); $("launchmsg").textContent = `rejected: ${res.error}`; return; }
  if (res && res.name) emit("TOPOLOGY_LAUNCHED", { topology_name: t, run_name: res.name });
  await loadRecords();
  await selectRecord(res.name);
  if (res.status === "incomplete") { $("launchmsg").textContent = `● live: ${res.name}`; followLive(res.name); }
  else $("launchmsg").textContent = `${res.name} · ${res.status}`;
};

// ---------- thin control: resume a paused run (feed the awaited input, continue; §7.7) ----------
$("resumebtn").onclick = async () => {
  const target = STATE.name;
  emit("RESUME_REQUESTED", { record_name: target });
  $("launchmsg").textContent = `resuming ${target}…`;
  const res = await fetch(`/api/resume?record=${encodeURIComponent(target ?? "")}`, { method: "POST" }).then((r) => r.json());
  if (res && res.error) { emit("LAUNCH_REJECTED", { kind: "resume", reason: String(res.error) }); $("launchmsg").textContent = `resume rejected: ${res.error}`; return; }
  if (res && res.name) emit("RESUMED", { record_name: res.name });
  await loadRecords();
  await selectRecord(res.name);
  if (res.status === "incomplete") { $("launchmsg").textContent = `● live: ${res.name}`; followLive(res.name); }
  else $("launchmsg").textContent = `resumed ${res.resumed} → ${res.name} · ${res.status}`;
};

// STUDIO_OPENED fires from the header link. The anchor uses target="_blank" so the current page
// (and its signals buffer) survives; the emit lands in the buffer, the studio opens in a new tab.
const _studioLink = $("studiolink");
if (_studioLink) _studioLink.addEventListener("click", () => { emit("STUDIO_OPENED", { via: "header_link" }); });


// ---------- live-attach: follow a launched run AS it is written (attach/F-PERS-4, read-only) ----------
async function followLive(name: string) {
  STATE.live = name;
  renderVerdict();
  let lastSeq = -1, stalls = 0;
  // POLL_TIMEOUT ceiling: if we've polled for more than the timeout without reaching a terminal or
  // seeing a FINAL_ANSWER_RENDERED, emit the incident once and stop the poll. Ceiling reads from
  // Fixed 300s ceiling — the dock's per-user timeout knob is gone (sprint 037c),
  // and the CLI default is 300s; a hard 10 min upper bound survives to keep a
  // mis-set timeout from hanging the browser.
  const pollStart = performance.now();
  const ceilingMs = 300000;
  while (STATE.live === name && STATE.name === name) {
    await new Promise((r) => setTimeout(r, 400));
    if (STATE.name !== name || STATE.live !== name) return;  // navigated away / stopped
    const [g, full, summary] = await Promise.all([
      api(`/api/records/${name}/run_graph`), api(`/api/records/${name}`), api(`/api/records/${name}/summary`),
    ]);
    if (STATE.name !== name) return;
    STATE.graph = g; STATE.events = full.events; STATE.summary = summary; updateScene();
    const maxSeq = STATE.events.length ? STATE.events[STATE.events.length - 1].seq : 0;
    // follow the tail ONLY if the user is already at it; if they scrubbed back to inspect an earlier
    // seq during a live run, don't yank the cursor forward under them every 400ms (ui-frontend-5).
    const tailing = STATE.cursor >= lastSeq;
    $<HTMLInputElement>("seq").max = String(maxSeq); $("seqmax").textContent = String(maxSeq);
    if (tailing) {
      $<HTMLInputElement>("seq").value = String(maxSeq); $("seqnow").textContent = String(maxSeq);
      STATE.cursor = maxSeq;  // live tail — the cursor rides the latest event
    }
    // STOP only on a terminal or on server-authoritative DEATH — never on no-growth alone, so a
    // dead run can't read "● LIVE forever" (§7.2, #36) AND a slow-but-alive LLM run is never
    // abandoned (#37: live=true + no-growth is NORMAL for a long generation; server-liveness, not
    // no-growth, is the authoritative stop; a wedged model call self-ends at the adapter timeout).
    const elapsed_ms = performance.now() - pollStart;
    if (elapsed_ms > ceilingMs) {
      emit("POLL_TIMEOUT", { run_name: name, elapsed_ms: Math.round(elapsed_ms) });
      STATE.live = null; $("launchmsg").textContent = `${name} · poll timeout at ${(elapsed_ms/1000).toFixed(0)}s`;
      return;
    }
    if (g.status !== "incomplete") {
      STATE.live = null; $("launchmsg").textContent = `${name} · ${g.status}`;  // reached a terminal
    } else if (!g.live) {
      STATE.live = null; $("launchmsg").textContent = `${name} · torn (writer died, no terminal)`;  // server: writer dead
    } else if (maxSeq > lastSeq) {
      lastSeq = maxSeq; stalls = 0; $("launchmsg").textContent = `● live: ${name}`;  // growing
    } else if (++stalls >= 5) {
      $("launchmsg").textContent = `● live: ${name} · waiting (no growth ${Math.round(stalls * 0.4)}s)`;  // slow but alive — keep following
    }
    renderVerdict(); render();
  }
}

// ---------- diff: first divergence by seq (D-8), §7.1 cited ----------
async function renderDiff(other: string) {
  const name = STATE.name;  // capture: a slow diff fetch must not land in a record the user switched to
  const d = await api(`/api/diff?a=${encodeURIComponent(name ?? "")}&b=${encodeURIComponent(other)}`);
  if (STATE.name !== name) return;  // switched records while the fetch was in flight (ui-frontend-3)
  if (d.equivalent) {
    $("insp").innerHTML = `<div class="row"><span class="l">diff</span><span><b>${escapeHtml(d.a)}</b> vs <b>${escapeHtml(d.b)}</b></span></div>
      <div class="row"><span class="l">result</span><span class="diff-eq">● equivalent under D-8 (no divergence)</span></div>
      <div class="row"><span class="l">means</span><span class="dim">same kinds + decision identities + payload hashes in seq order (modulo run_id / instance / t).</span></div>`;
    emit("DIFF_RENDERED", _paneCtx("diff", { first_divergence_seq: -1 }));
  } else {
    const x = d.divergence;
    $("insp").innerHTML = `<div class="row"><span class="l">diff</span><span><b>${escapeHtml(d.a)}</b> vs <b>${escapeHtml(d.b)}</b></span></div>
      <div class="row"><span class="l">diverge</span><span class="diff-hi">● first divergence at <b>seq ${x.seq}</b> (index ${x.index})</span></div>
      <div class="row"><span class="l">${escapeHtml(d.a)}</span><span>${escapeHtml(x.kind_a)} <span class="dim">${escapeHtml((x.hash_a || "").slice(0, 24))}…</span></span></div>
      <div class="row"><span class="l">${escapeHtml(d.b)}</span><span>${escapeHtml(x.kind_b)} <span class="dim">${escapeHtml((x.hash_b || "").slice(0, 24))}…</span></span></div>`;
    emit("DIFF_RENDERED", _paneCtx("diff", { first_divergence_seq: x.seq }));
  }
}

// ---------- select + fetch a record's projections ----------
async function selectRecord(name: string) {
  const prior_name = STATE.name;
  emit("RECORD_SELECTED", { name, prior_name });
  emit("RECORD_LOAD_BEGIN", { name });
  _transportHandle?.stopPlay();  // switching records stops any in-flight replay (no loop leaking across records)
  if (STATE.live && STATE.live !== name) STATE.live = null;  // navigating away stops the follow
  STATE.name = name; STATE.sel = null;
  STATE.assay = null; if (STATE.mode === "assay") STATE.mode = "read";  // leaving the assay altitude
  document.querySelectorAll<HTMLElement>(".assay").forEach((el) => el.classList.remove("sel"));
  // clear the inspector + diff selection from the PRIOR record — else a stale provenance/diff from
  // a different record bleeds into this one (caught by the perceptual capture pass, not the DOM E2E).
  $("insp").innerHTML = `<span class="dim">Select an event or a Producer to trace its provenance.</span>`;
  const ds = $<HTMLSelectElement>("diffsel"); if (ds) ds.value = "";
  document.querySelectorAll<HTMLElement>(".rec").forEach((e) => e.classList.toggle("sel", e.dataset.name === name));
  const [full, graph, summary, topology] = await Promise.all([
    api(`/api/records/${name}`), api(`/api/records/${name}/run_graph`), api(`/api/records/${name}/summary`),
    api(`/api/records/${name}/topology_graph`),
  ]);
  // staleness guard: if a newer selectRecord started while these fetches were in flight, DROP this
  // stale result — else one record's summary lands with another's graph on shared STATE and the
  // verdict flickers a false "NOT CLEAN" (review #38, obs b; mirrors followLive's guard).
  if (STATE.name !== name) return;
  STATE.events = full.events; STATE.manifest = full.manifest; STATE.graph = graph; STATE.summary = summary; STATE.topology = topology;
  emit("RECORD_LOADED", {
    name,
    event_count: STATE.events.length,
    status: (summary && summary.status) || (graph && graph.status) || "unknown",
    producers_failed: (summary && summary.producers_failed) || 0,
    final_reason: (summary && summary.final_reason) || "",
  });
  updateScene();
  const maxSeq = STATE.events.length ? STATE.events[STATE.events.length - 1].seq : 0;
  STATE.cursor = maxSeq;
  $<HTMLInputElement>("seq").max = String(maxSeq); $<HTMLInputElement>("seq").value = String(maxSeq); $("seqmax").textContent = String(maxSeq); $("seqnow").textContent = String(maxSeq);
  $("runname").textContent = name;
  $("runid").textContent = (full.events[0]?.payload?.run_id || "").slice(0, 12);
  renderVerdict(); render();
}

// Sprint 040a — health/verdict surface extracted to web/console/health.ts.
// The bootstrap at the bottom of this file assigns _healthHandle;
// renderVerdict() is a thin snapshot builder + delegate call.
function renderVerdict() {
  _healthHandle?.renderVerdict(_healthSnapshot());
}
function _healthSnapshot() {
  const g = (STATE.graph ?? {}) as {
    status?: string;
    final_reason?: string | null;
    paused_on?: string | null;
    live?: boolean;
  };
  const s = (STATE.summary ?? {}) as Partial<HealthSummary>;
  return {
    status: g.status ?? "",
    final_reason: g.final_reason ?? null,
    paused_on: g.paused_on ?? null,
    graphLive: g.live === true,
    live: STATE.live,
    name: STATE.name,
    summary: {
      producers_started: s.producers_started ?? 0,
      producers_completed: s.producers_completed ?? 0,
      producers_failed: s.producers_failed ?? 0,
      producers_cancelled: s.producers_cancelled ?? 0,
      input_build_failures: s.input_build_failures ?? 0,
      predicate_quarantines: s.predicate_quarantines ?? 0,
      invalid_emissions: s.invalid_emissions ?? 0,
      application_events: s.application_events ?? {},
    },
  };
}

// ---------- the one cursor drives everything ----------
function render() {
  // assay altitude: the arm matrix replaces the run views; the run-scoped chrome (cursor, health,
  // health-verdict) is meaningless here, so it's hidden — not repurposed (no second meaning per element).
  const assay = STATE.mode === "assay";
  $("assaypane").style.display = assay ? "" : "none";
  document.querySelector<HTMLElement>(".cursor")!.style.display = assay ? "none" : "flex";
  $("health").style.display = assay ? "none" : "flex";
  $("verdict").style.display = assay ? "none" : "";
  if (assay) { $("readpane").style.display = "none"; $("iopane").style.display = "none"; renderAssayFrom(STATE.assayReport); return; }
  $("readpane").style.display = STATE.mode === "io" ? "none" : "";
  $("iopane").style.display = STATE.mode === "io" ? "" : "none";
  $("modeToggle").textContent = STATE.mode === "io" ? "← graph" : "I/O";
  $("resumebtn").style.display = (STATE.graph && STATE.graph.status === "paused" && STATE.resumable.has(STATE.name ?? "")) ? "" : "none";
  if (STATE.mode === "io") renderIO();
  else {
    $("gvRun").classList.toggle("active", STATE.graphView === "run");
    $("gvTopo").classList.toggle("active", STATE.graphView === "topo");
    $("gvScene").classList.toggle("active", STATE.graphView === "scene");
    if (STATE.graphView === "topo") renderTopology();
    else if (STATE.graphView === "scene") renderScene();
    else renderGraph();
    renderStream();
  }
  renderHealth();
}

// ---------- I/O surface: the seed in, the artifacts out — derived, seq-cited (§7.1) ----------
function gistPayload(p: any) {
  if (p == null || typeof p !== "object") return String(p ?? "");
  return Object.entries(p).filter(([k]) => k !== "raw_payload").slice(0, 4)
    .map(([k, v]) => `${k}=${String(v).slice(0, 26)}`).join(", ");
}
// W2.2: a delegate ToolResult carries {answer, child_root, steps} — the child ran as its OWN record.
// Return that child_root (an absolute .record path) if this output is a delegated result, else null.
function _delegateChildRoot(o: any) {
  const out = o && o.payload && o.payload.output;
  return out && typeof out === "object" && out.child_root ? String(out.child_root) : null;
}
// navigate INTO a delegated child record, remembering the parent so a breadcrumb returns.
async function openDelegateChild(childName: string, parentName: string) {
  STATE.delegateParent = parentName;
  await selectRecord(childName);
}
async function renderIO() {
  const io = await api(`/api/records/${STATE.name}/io`);
  const cur = STATE.cursor;
  const seedDoc = io.input == null
    ? `<div class="io-empty">No runtime seed — this topology is parameterized at build time (the Producers carry their own data).</div>`
    : `<div class="io-doc"><div class="t">input.json <span class="seq">the seed · resolved_input</span></div><pre>${escapeHtml(JSON.stringify(io.input, null, 1))}</pre></div>`;
  // the baseline (b.baseline): fixtures/seeds/env — "a known baseline" the run is interpretable from.
  const baselineDoc = io.baseline && Object.keys(io.baseline).length
    ? `<div class="io-doc"><div class="t">baseline <span class="seq">fixtures · seeds · env</span></div><pre>${escapeHtml(JSON.stringify(io.baseline, null, 1))}</pre></div>` : "";
  const input = seedDoc + baselineDoc;
  // outputs materialize as the cursor reaches the seq that produced them; each cites that seq.
  const outs = (io.outputs as any[]).filter((o: any) => o.seq <= cur);
  // W2.2: resolve any delegated-child branches (a ToolResult carrying child_root) to a served record
  // name — servable -> a navigable link; not servable (a real session-workspace child) -> display-only.
  const branch = {};
  for (const o of outs) {
    const cr = _delegateChildRoot(o);
    if (cr) { const r = await api(`/api/resolve_child?path=${encodeURIComponent(cr)}`); (branch as Record<number, {path: string; name?: string}>)[o.seq] = { path: cr, name: r && r.name }; }
  }
  const artOf = (o: any): string => {
    let h = `<div class="art" data-seq="${o.seq}" title="inspect this artifact"><span class="sq">seq ${String(o.seq).padStart(3, "0")}</span><span class="kd">${escapeHtml(o.kind)}</span><span class="pl">${escapeHtml(gistPayload(o.payload))}</span></div>`;
    const b = (branch as Record<number, {path?: string; name?: string}>)[o.seq];
    if (b) h += b.name
      ? `<div class="branch" data-child="${escapeHtml(b.name)}" title="open the delegated child record">↳ delegated child: <span class="lk">${escapeHtml(b.name)}</span></div>`
      : `<div class="branch off" title="the child ran in a session workspace not served here">↳ delegated child recorded at ${escapeHtml(b.path)}</div>`;
    return h;
  };
  const arts = outs.length ? outs.map(artOf).join("") : `<div class="io-empty">No application output yet at seq ${cur}.</div>`;
  const fin = io.finalisation && Object.keys(io.finalisation).length
    ? `<div class="io-doc"><div class="t">finalisation_payload</div><pre>${escapeHtml(JSON.stringify(io.finalisation, null, 1))}</pre></div>` : "";
  // a breadcrumb back to the delegating parent, when we navigated in via a child branch.
  const crumb = STATE.delegateParent
    ? `<div class="crumb" data-parent="${escapeHtml(STATE.delegateParent)}" title="back to the delegating parent">◂ parent: <span class="lk">${escapeHtml(STATE.delegateParent)}</span></div>` : "";
  $("iopane").innerHTML = `${crumb}<div class="io-h">input · fed to the run</div>${input}
    <div class="io-h">output · artifacts <span class="r">${outs.length}/${io.outputs.length} produced</span></div>${arts}${fin}`;
  // an output artifact is an application event — clicking it inspects its full content (BACKLOG).
  $("iopane").querySelectorAll<HTMLElement>(".art[data-seq]").forEach((el) => (el.onclick = () => inspectEvent(+(el.dataset.seq ?? "0"))));
  // W2.2: a delegated-child branch navigates INTO the child record; the crumb returns to the parent.
  $("iopane").querySelectorAll<HTMLElement>(".branch[data-child]").forEach((el) => (el.onclick = () => openDelegateChild(el.dataset.child ?? "", STATE.name ?? "")));
  const cb = $("iopane").querySelector<HTMLElement>(".crumb[data-parent]");
  if (cb) cb.onclick = () => { const p = cb.dataset.parent ?? ""; STATE.delegateParent = null; selectRecord(p); };
  emit("IO_RENDERED", _paneCtx("io", {
    input_kind: io.input == null ? "none" : "seed",
    artifact_count: outs.length,
  }));
}

// ---------- run-as-graph: firing-anchored lifespans + spawn cohorts (§7.3) ----------
function renderGraph() {
  const g = STATE.graph, maxSeq = Math.max(1, +$<HTMLInputElement>("seq").max), cur = STATE.cursor;
  const insts = (g.instances ?? []).filter((i) => i.fired_seq != null && i.fired_seq <= cur);
  const x = (s: number): number => (Math.min(s, maxSeq) / maxSeq) * 100;
  let html = `<div class="legend">
    <span><i class="leg-q"></i>scheduled (queued)</span><span><i style="background:var(--green)"></i>ran → completed</span>
    <span><i style="background:var(--blue)"></i>running</span><span><i style="background:var(--red)"></i>failed</span>
    <span><i style="background:var(--slate)"></i>cancelled</span>
    <span><i style="background:var(--amber);border-radius:50%"></i>started</span><span style="color:var(--cyan)">∥ spawn cohort = concurrent</span></div>`;
  // spawn cohorts: consecutive instances sharing a PARENT = siblings spawned by one event = concurrent
  // (§7.3). NOT trigger_id — one event fires several triggers (natural_conversation's per-Turn
  // common-ground/repair/grader/next-speaker share a parent but have 4 trigger_ids); NOT span-overlap
  // (serializes in fast runs). Parent + consecutive-fired_seq bands every shape; initials share parent
  // null (the run's opening cohort). (review #32 finding 1.)
  const cohorts: RunGraphInstance[][] = []; let run: RunGraphInstance[] = [];
  insts.forEach((i, k) => {
    if (run.length && i.parent === run[0].parent) run.push(i);
    else { if (run.length > 1) cohorts.push([...run]); run = [i]; }
    if (k === insts.length - 1 && run.length > 1) cohorts.push([...run]);
  });
  html += `<div style="position:relative">`;
  // cohort bands (drawn behind the lanes)
  cohorts.forEach((c) => {
    const top = insts.indexOf(c[0]) * 30, h = c.length * 30;
    html += `<div class="cohort" style="left:170px;right:0;top:${top}px;height:${h}px"><span class="ct">∥ ${c.length} concurrent</span></div>`;
  });
  insts.forEach((i) => {
    const left = x(i.fired_seq!);
    const startedShown = i.started_seq != null && i.started_seq <= cur;
    // QUEUED segment: fired_seq -> started_seq — the Producer is scheduled but WAITING (in the
    // single-writer admission queue) while other Producers' events land. Faint + hatched.
    const qEnd = startedShown ? i.started_seq! : cur;
    const qbar = `<div class="qbar" style="left:${left}%;width:${Math.max(0.6, x(qEnd) - left)}%" title="${escapeHtml(i.kind)} scheduled (queued) ${i.fired_seq!}→${startedShown ? i.started_seq! : "…"}"></div>`;
    // RUNNING segment: started_seq -> ended_seq — the actual run, solid status colour. The dot marks
    // the START (the boundary between waiting and running), not "spawned at the end".
    let runbar = "", dot = "";
    if (startedShown) {
      const rEnd = i.ended_seq == null ? cur : Math.min(i.ended_seq, cur);
      const rLeft = x(i.started_seq!), rW = Math.max(1.2, x(rEnd) - rLeft);
      runbar = `<div class="bar ${i.status}" style="left:${rLeft}%;width:${rW}%" title="${escapeHtml(i.kind)} ran ${i.started_seq}→${i.ended_seq ?? "…"} ${i.status}"></div>`;
      dot = `<span class="spawn" style="left:${rLeft}%"></span>`;
    }
    html += `<div class="lane" data-inst="${escapeHtml(i.instance)}">
      <div class="lbl">${escapeHtml(i.kind)} <span class="inst">${escapeHtml(i.instance.slice(-4))}</span></div>
      <div class="track">${qbar}${runbar}${dot}</div></div>`;
  });
  html += `</div>`;
  $("graph").innerHTML = html;
  $("graph").querySelectorAll<HTMLElement>(".lane").forEach((l) => (l.onclick = () => inspectProducer(l.dataset.inst ?? "")));
  emit("GRAPH_RENDERED", _paneCtx("graph_run", {
    instance_count: insts.length,
    cohort_count: cohorts.length,
    cancelled_count: insts.filter((i) => i.status === "cancelled").length,
  }));
}

// ---------- static topology-structure view: the topology AS AUTHORED (design §6) ----------
// Seq-independent — the structure (Producers / Triggers / Views / Routes / TerminationPolicy) is
// the same at every cursor position; the run-as-graph is the dynamic counterpart. Reads the
// /topology_graph projection cached on STATE.topology (fetched in selectRecord). The eight words only.
function renderTopology() {
  const t = STATE.topology as any;
  if (!t) { $("graph").innerHTML = `<div class="topo dim">No topology manifest for this record.</div>`; return; }
  const e = escapeHtml;
  const prod = (t.producers as any[]).map((p: any) =>
    `<div class="pr"><span class="k">${e(p.kind)}${p.is_initial ? ' <span class="ini">▸ initial</span>' : ""}</span>` +
    `<span class="em">emits ${p.emits.map(e).join(", ")}</span></div>`).join("");
  const trig = t.triggers.length ? (t.triggers as any[]).map((tr: any) =>
    `<div class="tg"><span class="id">${e(tr.id)}</span> <span class="ar">on</span> <span class="on">${tr.on.map(e).join(", ")}</span>` +
    ` <span class="ar">→ starts</span> <span class="st">${e(tr.starts)}</span> <span class="dim">(${e(tr.policy)})</span></div>`).join("")
    : `<div class="dim">none</div>`;
  const views = t.views.length ? (t.views as any[]).map((v: any) => `<div class="vw"><span class="n">${e(v)}</span></div>`).join("") : `<div class="dim">none</div>`;
  const routes = t.routes.length ? (t.routes as any[]).map((r: any) =>
    `<div class="rt"><span class="id">${e(r.id)}</span> <span class="ar">→ slot</span> <span class="sl">${e(r.slot)}</span></div>`).join("")
    : `<div class="dim">none (no Routes authored)</div>`;
  const term = (t.termination || []).length ? (t.termination as any[]).map((s: any) => `<div class="tm">${e(s)}</div>`).join("") : `<div class="dim">none</div>`;
  $("graph").innerHTML = `<div class="topo">
    <div class="grp">producers (${t.producers.length}) · ▸ initial = on the run's opening cohort</div>${prod}
    <div class="grp">triggers</div>${trig}
    <div class="grp">views</div>${views}
    <div class="grp">routes</div>${routes}
    <div class="grp">termination policy</div>${term}</div>`;
  emit("TOPOLOGY_RENDERED", _paneCtx("topology", {
    producer_count: t.producers.length,
    trigger_count: t.triggers.length,
  }));
}

// ---------- scene: a domain-visual view of a renderable payload shape (§7.1, read-only) ----------
// Opt-in by SHAPE, not by app code: the first event-payload field that is a 2-D numeric array
// (e.g. game_of_life's Generation.grid) becomes the scene. Cursor-driven — the latest frame at or
// before the cursor — so scrubbing animates the generations in lock-step. A lens, never run-state.
// requires RECTANGULAR rows (every row the same length) so a ragged matrix can't slip in and
// misrender, and a stricter shape lowers the chance an incidental 2-D numeric payload hijacks the tab.
const isGrid = (v: unknown): boolean => Array.isArray(v) && v.length > 0 && Array.isArray((v as unknown[])[0]) && ((v as unknown[][])[0]).length > 0 &&
  v.every((r) => Array.isArray(r) && r.length === v[0].length && r.every((c) => typeof c === "number"));

function findGrids(events: RunEvent[]) {
  let field = null, kind = null;
  for (const e of events) {
    for (const [k, v] of Object.entries(e.payload || {})) { if (isGrid(v)) { field = k; kind = e.kind; break; } }
    if (field) break;
  }
  if (!field) return null;
  const frames = events.filter((e) => e.kind === kind && isGrid((e.payload || {})[field]))
    .map((e: RunEvent) => ({
      seq: e.seq, grid: e.payload[field],
      scalars: Object.entries(e.payload).filter(([k, v]) => k !== field &&
        (typeof v === "number" || typeof v === "string" || typeof v === "boolean")),
    }));
  return { field, kind, frames };
}

// recomputed per record (selectRecord) and per live poll (followLive); shows/hides the scene tab.
function updateScene() {
  STATE.scene = findGrids(STATE.events);
  const tab = $("gvScene");
  if (tab) tab.style.display = STATE.scene ? "" : "none";
  if (!STATE.scene && STATE.graphView === "scene") STATE.graphView = "run";
}

function renderScene() {
  const sc = STATE.scene as any;
  if (!sc) { $("graph").innerHTML = `<div class="scene-cap dim">No renderable shape in this record.</div>`; emit("SCENE_RENDERED", _paneCtx("scene", { generation_seq: -1 })); return; }
  const cur = STATE.cursor;
  const shown = (sc.frames as any[]).filter((f: any) => f.seq <= cur);
  const frame = shown.length ? shown[shown.length - 1] : null;
  if (!frame) { $("graph").innerHTML = `<div class="scene-cap dim">No <b>${escapeHtml(sc.kind)}</b> yet at seq ${cur} — scrub forward.</div>`; emit("SCENE_RENDERED", _paneCtx("scene", { generation_seq: -1 })); return; }
  const rows = frame.grid.length, cols = frame.grid[0].length;
  const cells = (frame.grid as unknown[][]).map((row: unknown[]) => row.map((c: unknown) => `<div class="cell ${c ? "on" : ""}"></div>`).join("")).join("");
  const scalars = (frame.scalars as [string, unknown][]).map(([k, v]) => `<span class="sv">${escapeHtml(k)}=<b>${escapeHtml(v)}</b></span>`).join("");
  $("graph").innerHTML = `
    <div class="scene-cap">scene · <b>${escapeHtml(sc.kind)}.${escapeHtml(sc.field)}</b>
      <span class="dim">seq ${frame.seq} · ${rows}×${cols} · frame ${sc.frames.indexOf(frame) + 1}/${sc.frames.length}</span> ${scalars}</div>
    <div class="scene-grid" style="grid-template-columns:repeat(${cols},1fr)">${cells}</div>
    <div class="scene-hint dim">the shared world-state at this seq — scrub the cursor to move through the run</div>`;
  emit("SCENE_RENDERED", _paneCtx("scene", { generation_seq: frame.seq }));
}

// ---------- event stream: seq-cited, colored, cursor-truncated ----------
function renderStream() {
  const cur = STATE.cursor;
  $("stream").innerHTML = STATE.events.map((e) => {
    const cat = category(e.kind), future = e.seq > cur;
    const prod = e.producer && e.producer.kind ? e.producer.kind : "runtime";
    return `<div class="ev ${future ? "future" : ""} ${STATE.sel === e.seq ? "sel" : ""}" data-seq="${e.seq}">
      <span class="sq">seq ${String(e.seq).padStart(3, "0")}</span>
      <span class="tt">${escapeHtml(relT(e.t))}</span>
      <span class="kd k-${cat}">${escapeHtml(shortKind(e.kind))}</span>
      <span class="pl">${escapeHtml(prod)} · ${escapeHtml(gist(e))}</span></div>`;
  }).join("");
  $("stream").querySelectorAll<HTMLElement>(".ev").forEach((el) => (el.onclick = () => inspectEvent(+(el.dataset.seq ?? "0"))));
  emit("STREAM_RENDERED", _paneCtx("stream", { line_count: STATE.events.length }));
}

// Sprint 040a — full health render extracted; app.ts delegates.
function renderHealth() {
  _healthHandle?.render(_healthSnapshot());
}

// ---------- inspector: raw event (§7.1) / producer provenance ----------
function inspectEvent(seq: number) {
  STATE.sel = seq; renderStream();
  const e = STATE.events.find((x) => x.seq === seq); if (!e) return;
  emit("EVENT_INSPECTED", { seq, kind: e.kind, subject_record: STATE.name });
  const cat = category(e.kind);
  // CONTENT blocks: string payload fields that are code / prose / model output — rendered readable
  // (real newlines, monospace), not buried in escaped JSON. The "see the code" view in the GUI.
  const content = Object.entries(e.payload || {})
    .filter(([, v]) => typeof v === "string" && (v.includes("\n") || v.length >= 40))
    .map(([k, v]) => `<div class="row"><span class="l">${escapeHtml(k)}</span></div><pre class="content">${escapeHtml(v)}</pre>`)
    .join("");
  $("insp").innerHTML = `<div class="row"><span class="l">event</span><span><span class="badge k-${cat}">${escapeHtml(shortKind(e.kind))}</span> <span class="dim">seq ${e.seq}</span></span></div>
    <div class="row"><span class="l">schema</span><span>${escapeHtml(e.schema || "")}</span></div>
    <div class="row"><span class="l">time</span><span>${escapeHtml(relT(e.t))} <span class="dim">${e.t}</span></span></div>
    <div class="row"><span class="l">producer</span><span>${e.producer && e.producer.kind ? escapeHtml(e.producer.kind) + " <span class='dim'>" + escapeHtml(e.producer.instance) + "</span>" : "— runtime"}</span></div>
    ${content}
    <div class="row"><span class="l">payload</span></div><pre>${escapeHtml(JSON.stringify(e.payload, null, 1))}</pre>`;
}

async function inspectProducer(instance: string) {
  const name = STATE.name;  // capture for the same staleness guard as renderDiff (ui-frontend-3)
  const laneInst = (STATE.graph && STATE.graph.instances || []).find((i) => i.instance === instance);
  // Sprint 030: PRODUCER_INSPECTED.kind is typed as substrate_producer_kind — do not lie with
  // "unknown". Sprint 033 (v0.5): when the click races the graph mutation, emit
  // PRODUCER_INSPECTION_RACED so the race stays visible on the record instead of dropping into
  // silence. The inspector still opens the /explain/<instance> chain either way.
  if (laneInst && laneInst.kind) {
    emit("PRODUCER_INSPECTED", { instance, kind: laneInst.kind, subject_record: name });
  } else {
    emit("PRODUCER_INSPECTION_RACED", { instance, subject_record: name });
  }
  const data = await api(`/api/records/${name}/explain/${instance}`).catch(() => null);
  if (STATE.name !== name) return;  // switched records mid-fetch — don't overwrite the new inspector
  if (!data || data.error) { $("insp").innerHTML = `<span class="dim">No provenance for ${escapeHtml(instance)}.</span>`; return; }
  const x = data.explanation;
  const chain = (data.ancestry as any[]).map((a: any) => `${escapeHtml(a.kind)}[${escapeHtml(a.instance.slice(-4))}]`).join(" → ");
  $("insp").innerHTML = `<div class="row"><span class="l">producer</span><span><b>${escapeHtml(x.kind)}</b> <span class="dim">${escapeHtml(x.instance.slice(-6))}</span></span></div>
    <div class="row"><span class="l">cause</span><span>${escapeHtml(x.cause)}${x.trigger_id ? ` <span class="k-trigger">${escapeHtml(x.trigger_id)}</span>` : ""}</span></div>
    <div class="row"><span class="l">at seq</span><span>${x.at_seq}</span></div>
    <div class="row"><span class="l">input</span><span class="dim">${escapeHtml(x.input_sha256 || "—")}</span></div>
    <div class="row"><span class="l">ancestry</span><span>${chain}</span></div>`;
}

// escape ALL of & < > " ' (quotes too — used in attribute contexts) and coerce to string, so any
// record-derived identifier (topology / event / producer / trigger name, run id) is inert in the DOM.
const escapeHtml = (s: unknown): string =>
  String(s).replace(/[&<>"']/g, (c: string): string => (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]));

// ---------- cursor wiring ----------
// The five view slots the vocab names: run (graph_run), topology, scene, io, read.
// PANE_SWITCHED fires only on an actual slot change (idempotent clicks are silent by design).
// Renamed from v0.1 VIEW_SWITCHED to free the word 'View' for substrate's runtime primitive.
const _currentPane = () => STATE.mode === "io" ? "io" : STATE.graphView === "topo" ? "topology" : STATE.graphView;
function _switchView(to_pane: string) {
  const prior_pane = _currentPane();
  if (prior_pane === to_pane) return false;
  emit("PANE_SWITCHED", { to_pane, prior_pane, subject_record: STATE.name });
  return true;
}
$("modeToggle").onclick = () => {
  // Leaving io does NOT re-select "run" — it returns to whatever graphView the user last picked
  // (run | topology | scene). Emitting to_view: run when graphView is scene would lie in the trace.
  const goingToIo = STATE.mode !== "io";
  const to = goingToIo ? "io" : (STATE.graphView === "topo" ? "topology" : STATE.graphView);
  if (_switchView(to)) { STATE.mode = goingToIo ? "io" : "read"; render(); }
};
$("gvRun").onclick = () => { if (_switchView("run")) { STATE.graphView = "run"; render(); } };
$("gvTopo").onclick = () => { if (_switchView("topology")) { STATE.graphView = "topo"; render(); } };
$("gvScene").onclick = () => { if (_switchView("scene")) { STATE.graphView = "scene"; render(); } };

// ---------- two-view scaffold (sprint 033, v0.7.1 refactor) ----------
// The header toggle + Ctrl+` flip between #view-desktop and #view-terminal.
// VIEW_SWITCHED{to_view, prior_view, subject_record} carries the flip
// (v0.7.1 TAG_SPLIT — was PANE_SWITCHED under v0.7).
//
// Snapshot keys scrolls and focus by stable element id only (AP2 fix: no
// DOM-index-keyed keys, which drifted under live stream inserts). Focus is
// captured on the mousedown / keydown path BEFORE the browser moves it to
// the toggle button (AP3 fix: no global focusin listener, no module-level
// mutable state, no fabricated fallback).
import { VIEW_IDS, type ViewId } from "./view-ids.js";
interface FocusSnap { id: string; start: number | null; end: number | null }
interface ViewSnapshot { scrolls: [string, number, number][]; focus: FocusSnap | null }
function _snapshotView(viewId: string, preClickFocus: Element | null): ViewSnapshot | null {
  const root = document.getElementById(viewId);
  if (!root) return null;
  const scrolls: [string, number, number][] = [];
  root.querySelectorAll("[id]").forEach((el: Element) => {
    const e = el as HTMLElement;
    if (!e.id) return;
    if (e.scrollTop || e.scrollLeft) scrolls.push([e.id, e.scrollTop, e.scrollLeft]);
  });
  let focus: FocusSnap | null = null;
  const target = preClickFocus as HTMLInputElement | null;
  if (target && target.id && target.id !== "view-toggle" && root.contains(target)) {
    focus = {
      id: target.id,
      start: typeof target.selectionStart === "number" ? target.selectionStart : null,
      end: typeof target.selectionEnd === "number" ? target.selectionEnd : null,
    };
  }
  return { scrolls, focus };
}
function _restoreView(viewId: string, snap: ViewSnapshot | null): void {
  if (!snap) return;
  const root = document.getElementById(viewId);
  if (!root) return;
  for (const [id, top, left] of snap.scrolls) {
    const el = document.getElementById(id);
    if (el && root.contains(el)) { el.scrollTop = top; el.scrollLeft = left; }
  }
  if (snap.focus) {
    const el = document.getElementById(snap.focus.id) as HTMLInputElement | null;
    if (el && root.contains(el)) {
      // preventScroll: the snapshot/restore primitive owns scroll state
      // exactly. Letting focus() call scrollIntoView on the ancestor would
      // silently override the just-restored scroll positions above.
      el.focus({ preventScroll: true });
      if (snap.focus.start !== null && typeof el.setSelectionRange === "function") {
        try { el.setSelectionRange(snap.focus.start, snap.focus.end); }
        catch (err) { if (!(err instanceof DOMException)) console.warn("focus-restore selectionRange failed:", err); }
      }
    }
  }
}
function _toggleView(source: string, preClickFocus: Element | null): void {
  const prior = STATE.view as ViewId;
  const next: ViewId = prior === VIEW_IDS.DESKTOP ? VIEW_IDS.TERMINAL : VIEW_IDS.DESKTOP;
  STATE.viewSnap[prior] = _snapshotView(`view-${prior}`, preClickFocus);
  document.getElementById(`view-${prior}`)?.classList.remove("active");
  document.getElementById(`view-${next}`)?.classList.add("active");
  const toggle = document.getElementById("view-toggle");
  if (toggle) toggle.classList.toggle("on-terminal", next === VIEW_IDS.TERMINAL);
  STATE.view = next;
  emit("VIEW_SWITCHED", { to_view: next, prior_view: prior, subject_record: STATE.name });
  requestAnimationFrame(() => _restoreView(`view-${next}`, STATE.viewSnap[next] as any));
  // On flip-in to desktop, repaint the active pane so the grader's
  // checkViewSwitched invariant sees a matching {GRAPH,TOPOLOGY,SCENE,IO}_RENDERED
  // within 500ms (the desktop container remounts its inner pane on flip-in per
  // the invariant docstring). No paint if no record selected — the invariant's
  // required-pane set only covers desktop.
  if (next === VIEW_IDS.DESKTOP && STATE.name) render();
}
// mousedown fires BEFORE focus moves to the button — reads the real
// pre-click focus target from document.activeElement at handler entry.
document.getElementById("view-toggle")?.addEventListener("mousedown", (e) => {
  e.preventDefault();  // keep the button from stealing focus at all
  _toggleView("toggle_button", document.activeElement);
});
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && (e.key === "`" || e.key === "Dead")) {
    e.preventDefault();
    _toggleView("ctrl_backtick", document.activeElement);
  }
});

loadTopologies();
loadRecords().then(() => loadAssays());  // assays prepend to the rail AFTER the records fill it

// Harness compatibility shim (Sprint 008 — TypeScript conversion, behavior-preserving).
// Vite compiles this file as an ES module; top-level `let STATE`, `function loadRecords`, etc.
// become module-scoped. The parent Playwright harness (`harness/*.js`) predates the module
// boundary and calls these as if they were globals via `page.evaluate(() => loadRecords())`
// and `page.evaluate(() => STATE.events)`. Rebind on window so the harness keeps working
// unchanged; a future sprint can migrate the harness to explicit imports.
import { installObservabilitySurface } from "./observability.js";
import { mountTerminal } from "./terminal.js";
import { mountDriverPicker } from "./controls/driver_picker.js";
import { mountHealth } from "./console/health.js";
import { mountTransport } from "./console/transport.js";
_healthHandle = mountHealth({ paneCtx: _paneCtx });
_transportHandle = mountTransport({ state: STATE as unknown as { cursor: number; playing: boolean; speed: number; name: string | null }, render });
import { mountNewSessionDialog, workspacePickerField, workspaceShapeField, mountWorkspaceShapeBadge } from "./controls/workspace_picker.js";
import { mountToolsDrawer, toolsField } from "./controls/tools_drawer.js";
import { isolateField } from "./controls/isolate_toggle.js";
installObservabilitySurface({ STATE, loadRecords, selectRecord: selectRecord as (...a: unknown[]) => unknown, loadAssays });
const _viewTerminalRoot = document.getElementById("view-terminal");
// No driverDefault: mountTerminal falls through to the server's /api/models
// default (server.py:_agent_models prefers the verified agentic cloud models
// — kimi-k2.7-code, glm-5.2, nemotron-3-super, deepseek-v4-pro — in order).
// The picker still lists every driver; the user changes it live via the
// header <select> or /model <name>.
if (_viewTerminalRoot) mountTerminal(_viewTerminalRoot as HTMLElement);
// Sprint 045: if state.ts read `terminal` as the initial view (either the
// default or ?view=terminal), swap the DOM's `.active` class off the
// hardcoded #view-desktop and onto #view-terminal so the first paint
// matches state. Without this, STATE.view is "terminal" but the DOM
// still shows the desktop view — every subsequent toggle flips the
// wrong way.
if (STATE.view === "terminal") {
  document.getElementById("view-desktop")?.classList.remove("active");
  document.getElementById("view-terminal")?.classList.add("active");
  document.getElementById("view-toggle")?.classList.add("on-terminal");
}
// Sprint 041: session-control mounts are inside the terminal view now
// (terminal.ts::_mkChildren renders the mount spans in its header).
// Bundle picker is DELIBERATELY NOT MOUNTED: the terminal session's
// bundle is `session` by contract — bundle selection is a launcher
// concern (choosing an application to run), not a session concern.
const _driverPickerRoot = document.getElementById("driver-picker");
const _driverPickerHandle = _driverPickerRoot
  ? mountDriverPicker(_driverPickerRoot as HTMLElement)
  : null;
// New-session dialog: trigger button lives inside the terminal header;
// modal itself is a fixed-position overlay outside both views.
const _newSessionTrigger = document.getElementById("new-session-trigger");
const _newSessionDialog = document.getElementById("new-session-dialog");
const _newSessionHandle = (_newSessionTrigger && _newSessionDialog)
  ? mountNewSessionDialog(_newSessionTrigger as HTMLElement, _newSessionDialog as HTMLElement)
  : null;
if (_newSessionHandle) {
  _newSessionHandle.registerField(workspacePickerField(""));
  _newSessionHandle.registerField(workspaceShapeField());
  _newSessionHandle.registerField(isolateField());
  _newSessionHandle.registerField(toolsField());
}
const _workspaceBadgeRoot = document.getElementById("workspace-shape-badge-mount");
const _workspaceBadgeHandle = _workspaceBadgeRoot
  ? mountWorkspaceShapeBadge(_workspaceBadgeRoot as HTMLElement)
  : null;
const _toolsDrawerRoot = document.getElementById("tools-drawer");
const _toolsDrawerHandle = _toolsDrawerRoot
  ? mountToolsDrawer(_toolsDrawerRoot as HTMLElement)
  : null;
window.addEventListener("substrate:session-changed", (ev: Event) => {
  const detail = (ev as CustomEvent).detail as { session_id?: string } | undefined;
  const sid = detail?.session_id ?? null;
  if (_driverPickerHandle) void _driverPickerHandle.refresh(sid);
  if (_workspaceBadgeHandle) void _workspaceBadgeHandle.refresh(sid);
  if (_toolsDrawerHandle) void _toolsDrawerHandle.refresh(sid);
});
if (_driverPickerHandle) (window as any).driverPicker = _driverPickerHandle;
if (_newSessionHandle) (window as any).newSessionDialog = _newSessionHandle;
if (_workspaceBadgeHandle) (window as any).workspaceBadge = _workspaceBadgeHandle;
if (_toolsDrawerHandle) (window as any).toolsDrawer = _toolsDrawerHandle;
(window as any).api = api;  // Sprint 028: harness routes through the wrapped seam to trigger FETCH_FAILED
