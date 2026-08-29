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

const $ = (id) => document.getElementById(id);
// api() is the single seam every read fetches through. Non-2xx responses AND thrown network errors
// both emit FETCH_FAILED{endpoint, status_or_error} — one incident tag, one seam. Callers still
// receive the parsed body (or a rejected promise on network error), so no consumer needs to change.
const api = (p) => fetch(p).then(async (r) => {
  if (!r.ok) {
    emit("FETCH_FAILED", { endpoint: p, status_or_error: String(r.status) });
  }
  return r.json();
}).catch((e) => {
  emit("FETCH_FAILED", { endpoint: p, status_or_error: String((e && e.message) || e) });
  throw e;
});

const FAILURE = new Set([
  "substrate.ProducerFailed", "substrate.InputBuildFailed",
  "substrate.PredicateQuarantined", "substrate.ProducerEmittedInvalidEvent",
]);

function category(kind) {
  if (FAILURE.has(kind)) return "failure";
  if (kind === "substrate.ProducerCancelled") return "cancelled";
  if (kind === "substrate.RunFinalised") return "finalise";
  if (kind === "substrate.TerminationMatched") return "termination";
  if (kind === "substrate.TriggerFired") return "trigger";
  if (kind === "substrate.RunStarted") return "open";
  if (kind.startsWith("substrate.")) return "lifecycle";
  return "application";
}
const shortKind = (k) => (k.startsWith("substrate.") ? k.slice(10) : k);
function gist(ev) {
  const p = ev.payload || {};
  if (ev.kind === "substrate.TriggerFired") return `${p.trigger_id} → ${p.factory}`;
  if (ev.kind === "substrate.TerminationMatched") return p.decision || "";
  if (ev.kind === "substrate.ProducerFailed") return (p.producer && p.producer.kind) + ": " + (p.error || "");
  if (ev.producer && typeof ev.producer === "object") {
    const fields = Object.entries(p).filter(([k]) => !["producer", "raw_payload"].includes(k))
      .slice(0, 3).map(([k, v]) => `${k}=${String(v).slice(0, 22)}`).join(", ");
    return fields;
  }
  if (p.run_id) return `run_id ${p.run_id}`;
  return "";
}

let STATE = { name: null, events: [], graph: null, summary: null, manifest: null, topology: null, scene: null, cursor: 0, playing: false, speed: 30, term: { open: false, lines: [], history: [], hi: -1, params: { think: false, tokens: 0, timeout: 300 } }, sel: null, mode: "read", graphView: "run", live: null, resumable: new Set(), assay: null, assays: [], assayReport: null, view: "desktop", viewSnap: { desktop: null, terminal: null } };

// the time dimension alongside the order: seq is the order (no time), t the time (no order). Show
// t RELATIVE to the run's start (events[0] = RunStarted) — ~0 on the deterministic CI demos (they
// ARE instant), and the real per-turn gaps on a real-model run.
function relT(t) { const t0 = STATE.events.length ? STATE.events[0].t : (t || 0); const d = (t || 0) - t0; return "t+" + (d < 10 ? d.toFixed(3) : d.toFixed(1)) + "s"; }

// ---------- record rail ----------
async function loadRecords() {
  const recs = await api("/api/records");
  emit("RECORDS_LOADED", {
    count: recs.length,
    run_count: recs.filter((r) => r.source === "run").length,
    demo_count: recs.filter((r) => r.source !== "run").length,
  });
  $("rail").innerHTML = "";
  const mkRec = (r) => {
    const div = document.createElement("div");
    div.className = "rec";
    div.dataset.name = r.name;
    const broken = r.status === "failed" || r.producers_failed > 0;
    const color = r.status === "failed" ? "var(--red)" : r.status === "paused" ? "var(--cyan)"
      : r.status === "incomplete" ? "var(--amber)" : broken ? "var(--red)" : "var(--green)";
    const meta = r.status === "failed" ? `FAILED · ${r.final_reason || ""}`
      : r.status === "paused" ? `paused · awaiting ${r.paused_on || "input"}`
      : broken ? `${r.producers_failed} failures · finalised` : `${r.status} · ${r.total_events} events`;
    div.innerHTML = `<span class="dot" style="background:${color}"></span>
      <div class="nm">${escapeHtml(r.name)}</div><div class="meta ${broken ? "broken" : ""}">${escapeHtml(r.run_id.slice(0, 8))}… · ${escapeHtml(meta)}</div>`;
    div.onclick = () => { STATE.delegateParent = null; selectRecord(r.name); };  // rail pick clears the delegate crumb; RECORD_SELECTED fires from selectRecord (covers deep-link + delegate paths too)
    return div;
  };
  const groupHdr = (label) => { const h = document.createElement("div"); h.className = "rail-group"; h.textContent = label; $("rail").appendChild(h); };
  // group "your runs" (the runs/ session records, newest-first by ULID run_id) ABOVE the stable
  // "demos" fixtures, so accumulating session runs stay corralled + scannable (Drift watchlist fold).
  const runs = recs.filter((r) => r.source === "run").sort((a, b) => (b.run_id || "").localeCompare(a.run_id || ""));
  const demos = recs.filter((r) => r.source !== "run");
  if (runs.length) {
    const h = document.createElement("div");
    h.className = "rail-group";
    h.innerHTML = `your runs · ${runs.length} <span class="rail-clear" title="delete all your session runs — the demos are kept">clear</span>`;
    h.querySelector(".rail-clear").onclick = async (ev) => {
      ev.stopPropagation();
      if (!window.confirm(`Delete all ${runs.length} session runs? (the demos are kept)`)) return;
      const cleared_count = runs.length;
      await fetch("/api/runs/clear", { method: "POST" }).then((x) => x.json());
      emit("RECORDS_PRUNED", { cleared_count });
      STATE.name = null;  // the selected run may be gone -> re-land on a demo
      await loadRecords();
    };
    $("rail").appendChild(h);
    runs.forEach((r) => $("rail").appendChild(mkRec(r)));
  }
  groupHdr("demos"); demos.forEach((r) => $("rail").appendChild(mkRec(r)));
  const ordered = [...runs, ...demos];  // visual order: newest run first, else first demo
  STATE.resumable = new Set(recs.filter((r) => r.resumable).map((r) => r.name));  // paused + has a continuation
  // populate the diff selector (compare this record against another — first divergence by seq)
  const sel = $("diffsel");
  sel.innerHTML = '<option value="">⇄ diff vs…</option>' +
    recs.map((r) => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)}</option>`).join("");
  sel.onchange = () => { if (sel.value) { emit("DIFF_REQUESTED", { a: STATE.name, b: sel.value }); renderDiff(sel.value); } };
  // auto-select only on FIRST load (else a refresh after launch/resume yanks selection to the top
  // record with a dangling fetch — the race behind the verdict flicker. review #38, obs b).
  if (STATE.name === null) {
    // honor a ?record=<name> deep-link (the Studio's "view the run in the console" lands here);
    // fall back to the first record. Only if the named record actually exists.
    const want = new URLSearchParams(location.search).get("record");
    const target = (want && recs.some((r) => r.name === want)) ? want : (ordered[0] && ordered[0].name);
    if (target) selectRecord(target);
  }
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
  assays.slice().reverse().forEach((a) => {  // newest visual position just under the group header
    const div = document.createElement("div");
    div.className = "assay";
    div.dataset.name = a.name;
    const models = a.strong_model ? `${a.strong_model} vs ${(a.weak_models || []).length} weak` : `${a.arms.length} arms`;
    div.innerHTML = `<span class="dot"></span><div class="nm">${escapeHtml(a.name)}</div>
      <div class="meta">${escapeHtml(models)} · ${a.n_cells} cells</div>`;
    div.onclick = () => selectAssay(a.name);
    rail.insertBefore(div, grp.nextSibling);
  });
}

async function selectAssay(name) {
  const prior_name = STATE.assay;
  emit("ASSAY_SELECTED", { name, prior_name });
  stopPlay();
  STATE.live = null; STATE.name = null; STATE.mode = "assay"; STATE.assay = name; STATE.assayReport = null;
  document.querySelectorAll(".rec").forEach((e) => e.classList.remove("sel"));
  document.querySelectorAll(".assay").forEach((e) => e.classList.toggle("sel", e.dataset.name === name));
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

const _fmtD = (v) => (v == null ? "—" : (v >= 0 ? "+" : "") + v.toFixed(3));
const _pct = (v) => Math.round(v * 100) + "%";
const _pctD = (v) => (v == null ? "—" : (v >= 0 ? "+" : "−") + Math.round(Math.abs(v) * 100) + " pts");
const _kfmt = (n) => (!n ? "—" : n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n));
// a plain word with the precise term tucked behind a hover/click definition (dotted underline = ask me).
const _term = (word, def) => `<span class="term" data-def="${escapeHtml(def)}">${escapeHtml(word)}</span>`;
// the four statistical verdicts, said in plain English (the stats name stays in the hover definition).
const VERDICT = {
  inferior: ["worse", "We're confident this is behind the bar by a meaningful amount. (stats: 'inferior')"],
  equivalent: ["as good as", "Enough data to actually rule out a meaningful gap — a real tie, not just 'no result'. (stats: 'equivalent')"],
  underpowered: ["can't claim a tie yet", "The gap looks small enough to be a tie, BUT there aren't enough problems to claim it at this margin — you'd need more runs. This is the honest brake on declaring 'as good as' too early. (stats: 'underpowered')"],
  inconclusive: ["can't tell yet", "Not enough data to call it either way — the result straddles the line. (stats: 'inconclusive')"],
  superior: ["better", "We're confident this is ahead of the bar. (stats: 'superior')"],
};

function renderAssayFrom(d) {
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
  const rows = r.arms.map((a) => {
    const ctl = a.arm === r.control_arm;
    const incomplete = !ctl && a.complete === false;  // didn't grade every problem -> no verdict (the gate)
    const flake = a.pass_at_1 - a.pass_rate;
    let verdict = "—";
    if (a.equivalence && VERDICT[a.equivalence]) { const [w, def] = VERDICT[a.equivalence]; verdict = `<span class="v-${e(a.equivalence)}">${_term(w, def)}</span>`; }
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
  $("assaypane").querySelectorAll(".term").forEach((t) => (t.onclick = () => t.classList.toggle("pin")));
}

// ---------- thin control: launch a bundled topology (records RunStarted, §7.7) ----------
async function loadTopologies() {
  const topos = await api("/api/topologies");
  $("launchsel").innerHTML = '<option value="">+ launch a topology…</option>' +
    topos.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
}
$("launchbtn").onclick = async () => {
  const t = $("launchsel").value;
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
  const res = await fetch(`/api/resume?record=${encodeURIComponent(target)}`, { method: "POST" }).then((r) => r.json());
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

// ---------- interactive agent: stream the tool-loop conversation into the terminal as it runs ----------
// The terminal drives a live agent (POST /api/agent) and followLive polls the record; each poll, the
// NEW conversation events (ToolCall / ToolResult / FinalAnswer) are appended to the terminal dock — so
// you talk to a tool-using LLM in the terminal AND watch it run in the graph, the same record, two views.
function _agentLine(e) {
  const p = e.payload || {};
  if (e.kind === "ToolCall") return { cls: "accent", text: `→ ${p.tool}(${JSON.stringify(p.args)})` };
  if (e.kind === "ToolResult")
    return { cls: p.ok ? "out" : "err", text: "  " + (p.ok ? String(p.output).slice(0, 120) : p.error) };
  if (e.kind === "FinalAnswer") return { cls: "accent", text: `✓ ${p.text}` };
  return null;
}
function streamAgentTurns() {
  const fresh = STATE.events.filter(
    (e) => e.seq > STATE.term.agentSeq &&
      (e.kind === "ToolCall" || e.kind === "ToolResult" || e.kind === "FinalAnswer"),
  );
  if (!fresh.length) return;
  STATE.term.agentSeq = fresh[fresh.length - 1].seq;
  termPush(fresh.map(_agentLine).filter(Boolean));
  if (STATE.term.agent) emit("AGENT_TURN_STREAMED", { run_name: STATE.term.agent, new_events: fresh.length, up_to_seq: STATE.term.agentSeq });
  // record the model's final reply into the CONVERSATION so the next turn carries it (multi-turn).
  const fa = fresh.filter((e) => e.kind === "FinalAnswer").pop();
  if (fa && STATE.term.chat && STATE.term.chat.active) {
    STATE.term.chat.convo.push({ role: "assistant", content: fa.payload.text });
    termPush([{ cls: "dim", text: "· your turn — type to continue, `exit` to leave" }]);
  }
  if (fa && STATE.term.agent) emit("FINAL_ANSWER_RENDERED", { run_name: STATE.term.agent, answer_length: String((fa.payload && fa.payload.text) || "").length });
}

// A conversation is a transcript carried across turns: each message you send re-runs the agent seeded
// with the whole conversation, so the model RESPONDS to you and you keep talking (like Claude Code),
// while each turn animates in the graph. The driver is any model — an Ollama model, a CLI agent
// (claude/gemini), or the CI stand-in — chosen in the model picker.
function renderConvo(convo) {
  const lines = convo.map((m) => (m.role === "user" ? "User: " : "Assistant: ") + m.content);
  return (
    "You are a helpful assistant with tools. Hold a conversation and respond to the LAST user message.\n\n" +
    lines.join("\n")
  );
}
async function sendChatMessage(text) {
  if (!text) return;
  if (!STATE.term.chat) STATE.term.chat = { active: true, convo: [] };
  STATE.term.chat.convo.push({ role: "user", content: text });
  const model = STATE.term.model || "deterministic";
  const transcript = renderConvo(STATE.term.chat.convo);
  const turn_index = Math.floor(STATE.term.chat.convo.length / 2);
  emit("TURN_SUBMITTED", { model, task_length: transcript.length, turn_index });
  const cli = new Set(["claude", "gemini"]);
  // default to a DEDICATED per-conversation workspace (a session name -> ~/.substrate/sessions/<id>),
  // never the repo the server launched in. Set once, then every turn shares it. `cwd <path>` overrides
  // with a real project. The server resolves the bare name and echoes back the absolute path.
  if (!STATE.term.workspace) STATE.term.workspace = "sess-" + Math.random().toString(36).slice(2, 10);
  const ws = `&workspace=${encodeURIComponent(STATE.term.workspace)}`;
  // worktree mode (`worktree <repo>`): the session runs in its own git worktree on a branch, adjacent
  // to the repo. `workspace` stays the stable SESSION ID (do NOT adopt the resolved path, or the next
  // turn spawns a new worktree); the server echoes the worktree path + branch, shown once.
  const wt = STATE.term.worktree ? `&worktree=${encodeURIComponent(STATE.term.worktree)}` : "";
  const pp = STATE.term.params;
  const pq = `&think=${pp.think}&max_tokens=${pp.tokens}&timeout=${pp.timeout}`;
  const qs =
    (model === "deterministic"
      ? "model=deterministic"
      : cli.has(model)
        ? `model=${model}&task=${encodeURIComponent(transcript)}${pq}`
        : `model=ollama&name=${encodeURIComponent(model)}&task=${encodeURIComponent(transcript)}${pq}`) + ws + wt;
  termPush([{ cls: "dim", text: `· ${model} is working…` }]);
  const pparams = STATE.term.params;
  emit("AGENT_LAUNCH_REQUESTED", { model, params: { think: pparams.think, tokens: pparams.tokens, timeout: pparams.timeout } });
  const res = await fetch(`/api/agent?${qs}`, { method: "POST" }).then((r) => r.json()).catch(() => null);
  if (!res || res.error || !res.name) {
    emit("LAUNCH_REJECTED", { kind: "agent", reason: String((res && res.error) || "launch failed") });
    termPush([{ cls: "err", text: "agent: launch failed" }]); return;
  }
  emit("AGENT_LAUNCHED", { run_name: res.name, model, workspace: res.workspace || STATE.term.workspace || "", ...(res.branch ? { branch: res.branch } : {}) });
  // show the resolved workspace (+ branch, in worktree mode) once. Only adopt the resolved path as the
  // session key when NOT in worktree mode — worktree needs the stable session id across turns.
  if (res.workspace && STATE.term.workspacePath !== res.workspace) {
    STATE.term.workspacePath = res.workspace;
    const br = res.branch ? `  (branch ${res.branch})` : "";
    termPush([{ cls: "dim", text: `· workspace: ${res.workspace}${br}` }]);
    if (!STATE.term.worktree) STATE.term.workspace = res.workspace;
  }
  STATE.term.agent = res.name; STATE.term.agentSeq = -1;
  await selectRecord(res.name);
  followLive(res.name); // streams the model's turns into the dock; streamAgentTurns records the reply
}
async function loadModels() {
  const el = $("agentmodel");
  if (!el) return;
  const d = await api("/api/models").catch(() => ({ models: ["deterministic"], default: "deterministic" }));
  el.innerHTML = (d.models || ["deterministic"]).map((m) => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
  el.value = d.default || "deterministic";
  STATE.term.model = el.value; // default to the biggest OSS model the server picked
  el.onchange = () => { _selectModel(el.value); };
}

// ---------- live-attach: follow a launched run AS it is written (attach/F-PERS-4, read-only) ----------
async function followLive(name) {
  STATE.live = name;
  renderVerdict();
  let lastSeq = -1, stalls = 0;
  // POLL_TIMEOUT ceiling: if we've polled for more than the timeout without reaching a terminal or
  // seeing a FINAL_ANSWER_RENDERED, emit the incident once and stop the poll. Ceiling reads from
  // STATE.term.params.timeout in seconds (default 300 for the CLI, mirrored here); safely bounded
  // by a hard 10 min so a mis-set timeout can't hang the browser indefinitely.
  const pollStart = performance.now();
  const ceilingMs = Math.min(600000, Math.max(30000, (STATE.term.params.timeout || 300) * 1000));
  while (STATE.live === name && STATE.name === name) {
    await new Promise((r) => setTimeout(r, 400));
    if (STATE.name !== name || STATE.live !== name) return;  // navigated away / stopped
    const [g, full, summary] = await Promise.all([
      api(`/api/records/${name}/run_graph`), api(`/api/records/${name}`), api(`/api/records/${name}/summary`),
    ]);
    if (STATE.name !== name) return;
    STATE.graph = g; STATE.events = full.events; STATE.summary = summary; updateScene();
    if (STATE.term.agent === name) streamAgentTurns();  // stream the agent's turns into the terminal
    const maxSeq = STATE.events.length ? STATE.events[STATE.events.length - 1].seq : 0;
    // follow the tail ONLY if the user is already at it; if they scrubbed back to inspect an earlier
    // seq during a live run, don't yank the cursor forward under them every 400ms (ui-frontend-5).
    const tailing = STATE.cursor >= lastSeq;
    $("seq").max = maxSeq; $("seqmax").textContent = maxSeq;
    if (tailing) {
      $("seq").value = maxSeq; $("seqnow").textContent = maxSeq;
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
async function renderDiff(other) {
  const name = STATE.name;  // capture: a slow diff fetch must not land in a record the user switched to
  const d = await api(`/api/diff?a=${encodeURIComponent(name)}&b=${encodeURIComponent(other)}`);
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
async function selectRecord(name) {
  const prior_name = STATE.name;
  emit("RECORD_SELECTED", { name, prior_name });
  emit("RECORD_LOAD_BEGIN", { name });
  stopPlay();  // switching records stops any in-flight replay (no loop leaking across records)
  if (STATE.live && STATE.live !== name) STATE.live = null;  // navigating away stops the follow
  STATE.name = name; STATE.sel = null;
  STATE.assay = null; if (STATE.mode === "assay") STATE.mode = "read";  // leaving the assay altitude
  document.querySelectorAll(".assay").forEach((el) => el.classList.remove("sel"));
  // clear the inspector + diff selection from the PRIOR record — else a stale provenance/diff from
  // a different record bleeds into this one (caught by the perceptual capture pass, not the DOM E2E).
  $("insp").innerHTML = `<span class="dim">Select an event or a Producer to trace its provenance.</span>`;
  const ds = $("diffsel"); if (ds) ds.value = "";
  document.querySelectorAll(".rec").forEach((e) => e.classList.toggle("sel", e.dataset.name === name));
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
  $("seq").max = maxSeq; $("seq").value = maxSeq; $("seqmax").textContent = maxSeq; $("seqnow").textContent = maxSeq;
  $("runname").textContent = name;
  $("runid").textContent = (full.events[0]?.payload?.run_id || "").slice(0, 12);
  renderVerdict(); render();
}

function renderVerdict() {
  const st = STATE.graph.status, s = STATE.summary, el = $("verdict");
  // a LIVE-followed run with no terminal yet is still being WRITTEN -> "LIVE", not torn/broken.
  // The follow context is the out-of-band signal that distinguishes incomplete-live from
  // incomplete-torn — resolving the #33 residual at exactly the layer that knows.
  if (STATE.live === STATE.name && st === "incomplete" && STATE.graph.live) {
    el.className = "verdict v-live"; el.textContent = "● LIVE"; return;
  }
  // a clean finalise with Producer failures INSIDE it is finished-!=-worked — the top badge must
  // say NOT CLEAN, not read green (§7.2; matches the health bar + the engine.js this replaces). #32.
  const fails = s.producers_failed + s.input_build_failures + s.predicate_quarantines + s.invalid_emissions;
  const notClean = st === "finalised" && fails > 0;
  el.className = "verdict v-" + (notClean ? "failed" : st);
  el.textContent = st === "failed" ? "● FAILED · " + (STATE.graph.final_reason || "").toUpperCase().replace(/_/g, " ")
    : st === "paused" ? "● PAUSED" : st === "incomplete" ? "● INCOMPLETE"
    : notClean ? "● FINALISED · NOT CLEAN" : "● FINALISED";
}

// ---------- the one cursor drives everything ----------
function render() {
  // assay altitude: the arm matrix replaces the run views; the run-scoped chrome (cursor, health,
  // health-verdict) is meaningless here, so it's hidden — not repurposed (no second meaning per element).
  const assay = STATE.mode === "assay";
  $("assaypane").style.display = assay ? "" : "none";
  document.querySelector(".cursor").style.display = assay ? "none" : "flex";
  $("health").style.display = assay ? "none" : "flex";
  $("verdict").style.display = assay ? "none" : "";
  if (assay) { $("readpane").style.display = "none"; $("iopane").style.display = "none"; renderAssayFrom(STATE.assayReport); return; }
  $("readpane").style.display = STATE.mode === "io" ? "none" : "";
  $("iopane").style.display = STATE.mode === "io" ? "" : "none";
  $("modeToggle").textContent = STATE.mode === "io" ? "← graph" : "I/O";
  $("resumebtn").style.display = (STATE.graph && STATE.graph.status === "paused" && STATE.resumable.has(STATE.name)) ? "" : "none";
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
function gistPayload(p) {
  if (p == null || typeof p !== "object") return String(p ?? "");
  return Object.entries(p).filter(([k]) => k !== "raw_payload").slice(0, 4)
    .map(([k, v]) => `${k}=${String(v).slice(0, 26)}`).join(", ");
}
// W2.2: a delegate ToolResult carries {answer, child_root, steps} — the child ran as its OWN record.
// Return that child_root (an absolute .record path) if this output is a delegated result, else null.
function _delegateChildRoot(o) {
  const out = o && o.payload && o.payload.output;
  return out && typeof out === "object" && out.child_root ? String(out.child_root) : null;
}
// navigate INTO a delegated child record, remembering the parent so a breadcrumb returns.
async function openDelegateChild(childName, parentName) {
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
  const outs = io.outputs.filter((o) => o.seq <= cur);
  // W2.2: resolve any delegated-child branches (a ToolResult carrying child_root) to a served record
  // name — servable -> a navigable link; not servable (a real session-workspace child) -> display-only.
  const branch = {};
  for (const o of outs) {
    const cr = _delegateChildRoot(o);
    if (cr) { const r = await api(`/api/resolve_child?path=${encodeURIComponent(cr)}`); branch[o.seq] = { path: cr, name: r && r.name }; }
  }
  const artOf = (o) => {
    let h = `<div class="art" data-seq="${o.seq}" title="inspect this artifact"><span class="sq">seq ${String(o.seq).padStart(3, "0")}</span><span class="kd">${escapeHtml(o.kind)}</span><span class="pl">${escapeHtml(gistPayload(o.payload))}</span></div>`;
    const b = branch[o.seq];
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
  $("iopane").querySelectorAll(".art[data-seq]").forEach((el) => (el.onclick = () => inspectEvent(+el.dataset.seq)));
  // W2.2: a delegated-child branch navigates INTO the child record; the crumb returns to the parent.
  $("iopane").querySelectorAll(".branch[data-child]").forEach((el) => (el.onclick = () => openDelegateChild(el.dataset.child, STATE.name)));
  const cb = $("iopane").querySelector(".crumb[data-parent]");
  if (cb) cb.onclick = () => { const p = cb.dataset.parent; STATE.delegateParent = null; selectRecord(p); };
  emit("IO_RENDERED", _paneCtx("io", {
    input_kind: io.input == null ? "none" : "seed",
    artifact_count: outs.length,
  }));
}

// ---------- run-as-graph: firing-anchored lifespans + spawn cohorts (§7.3) ----------
function renderGraph() {
  const g = STATE.graph, maxSeq = Math.max(1, +$("seq").max), cur = STATE.cursor;
  const insts = g.instances.filter((i) => i.fired_seq != null && i.fired_seq <= cur);
  const x = (s) => (Math.min(s, maxSeq) / maxSeq) * 100;
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
  const cohorts = []; let run = [];
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
    const left = x(i.fired_seq);
    const startedShown = i.started_seq != null && i.started_seq <= cur;
    // QUEUED segment: fired_seq -> started_seq — the Producer is scheduled but WAITING (in the
    // single-writer admission queue) while other Producers' events land. Faint + hatched.
    const qEnd = startedShown ? i.started_seq : cur;
    const qbar = `<div class="qbar" style="left:${left}%;width:${Math.max(0.6, x(qEnd) - left)}%" title="${escapeHtml(i.kind)} scheduled (queued) ${i.fired_seq}→${startedShown ? i.started_seq : "…"}"></div>`;
    // RUNNING segment: started_seq -> ended_seq — the actual run, solid status colour. The dot marks
    // the START (the boundary between waiting and running), not "spawned at the end".
    let runbar = "", dot = "";
    if (startedShown) {
      const rEnd = i.ended_seq == null ? cur : Math.min(i.ended_seq, cur);
      const rLeft = x(i.started_seq), rW = Math.max(1.2, x(rEnd) - rLeft);
      runbar = `<div class="bar ${i.status}" style="left:${rLeft}%;width:${rW}%" title="${escapeHtml(i.kind)} ran ${i.started_seq}→${i.ended_seq ?? "…"} ${i.status}"></div>`;
      dot = `<span class="spawn" style="left:${rLeft}%"></span>`;
    }
    html += `<div class="lane" data-inst="${escapeHtml(i.instance)}">
      <div class="lbl">${escapeHtml(i.kind)} <span class="inst">${escapeHtml(i.instance.slice(-4))}</span></div>
      <div class="track">${qbar}${runbar}${dot}</div></div>`;
  });
  html += `</div>`;
  $("graph").innerHTML = html;
  $("graph").querySelectorAll(".lane").forEach((l) => (l.onclick = () => inspectProducer(l.dataset.inst)));
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
  const t = STATE.topology;
  if (!t) { $("graph").innerHTML = `<div class="topo dim">No topology manifest for this record.</div>`; return; }
  const e = escapeHtml;
  const prod = t.producers.map((p) =>
    `<div class="pr"><span class="k">${e(p.kind)}${p.is_initial ? ' <span class="ini">▸ initial</span>' : ""}</span>` +
    `<span class="em">emits ${p.emits.map(e).join(", ")}</span></div>`).join("");
  const trig = t.triggers.length ? t.triggers.map((tr) =>
    `<div class="tg"><span class="id">${e(tr.id)}</span> <span class="ar">on</span> <span class="on">${tr.on.map(e).join(", ")}</span>` +
    ` <span class="ar">→ starts</span> <span class="st">${e(tr.starts)}</span> <span class="dim">(${e(tr.policy)})</span></div>`).join("")
    : `<div class="dim">none</div>`;
  const views = t.views.length ? t.views.map((v) => `<div class="vw"><span class="n">${e(v)}</span></div>`).join("") : `<div class="dim">none</div>`;
  const routes = t.routes.length ? t.routes.map((r) =>
    `<div class="rt"><span class="id">${e(r.id)}</span> <span class="ar">→ slot</span> <span class="sl">${e(r.slot)}</span></div>`).join("")
    : `<div class="dim">none (no Routes authored)</div>`;
  const term = (t.termination || []).length ? t.termination.map((s) => `<div class="tm">${e(s)}</div>`).join("") : `<div class="dim">none</div>`;
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
const isGrid = (v) => Array.isArray(v) && v.length > 0 && Array.isArray(v[0]) && v[0].length > 0 &&
  v.every((r) => Array.isArray(r) && r.length === v[0].length && r.every((c) => typeof c === "number"));

function findGrids(events) {
  let field = null, kind = null;
  for (const e of events) {
    for (const [k, v] of Object.entries(e.payload || {})) { if (isGrid(v)) { field = k; kind = e.kind; break; } }
    if (field) break;
  }
  if (!field) return null;
  const frames = events.filter((e) => e.kind === kind && isGrid((e.payload || {})[field]))
    .map((e) => ({
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
  const sc = STATE.scene;
  if (!sc) { $("graph").innerHTML = `<div class="scene-cap dim">No renderable shape in this record.</div>`; emit("SCENE_RENDERED", _paneCtx("scene", { generation_seq: -1 })); return; }
  const cur = STATE.cursor;
  const shown = sc.frames.filter((f) => f.seq <= cur);
  const frame = shown.length ? shown[shown.length - 1] : null;
  if (!frame) { $("graph").innerHTML = `<div class="scene-cap dim">No <b>${escapeHtml(sc.kind)}</b> yet at seq ${cur} — scrub forward.</div>`; emit("SCENE_RENDERED", _paneCtx("scene", { generation_seq: -1 })); return; }
  const rows = frame.grid.length, cols = frame.grid[0].length;
  const cells = frame.grid.map((row) => row.map((c) => `<div class="cell ${c ? "on" : ""}"></div>`).join("")).join("");
  const scalars = frame.scalars.map(([k, v]) => `<span class="sv">${escapeHtml(k)}=<b>${escapeHtml(v)}</b></span>`).join("");
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
  $("stream").querySelectorAll(".ev").forEach((el) => (el.onclick = () => inspectEvent(+el.dataset.seq)));
  emit("STREAM_RENDERED", _paneCtx("stream", { line_count: STATE.events.length }));
}

// ---------- health: verdict keyed on the run-level STATUS (§7.2) ----------
function renderHealth() {
  const s = STATE.summary, st = STATE.graph.status;
  const fails = s.producers_failed + s.input_build_failures + s.predicate_quarantines + s.invalid_emissions;
  const broken = st === "failed" || fails > 0 || st === "incomplete";
  const verdict = st === "failed" ? "● FAILED · " + escapeHtml((STATE.graph.final_reason || "").toUpperCase().replace(/_/g, " "))
    : st === "paused" ? "● PAUSED" : st === "incomplete" ? "● INCOMPLETE (no terminal)"
    : fails > 0 ? "● FINALISED · NOT CLEAN" : "● FINALISED · CLEAN";
  const msg = st === "failed" ? "the run itself failed — finished is not worked."
    : st === "incomplete" ? "no terminal RunFinalised — torn or still being written."
    : st === "paused" ? `halted resumably — awaiting ${escapeHtml(STATE.graph.paused_on || "input")}`
    : fails > 0 ? `reached RunFinalised — but ${fails} thing(s) inside failed. Finished is not worked.`
    : "reached RunFinalised with no failures.";
  const stat = (n, l, cls) => `<div class="stat ${cls}"><b>${n}</b><span class="l">${l}</span></div>`;
  const work = Object.entries(s.application_events).map(([k, n]) => `<span class="chip">${n} ${escapeHtml(k)}</span>`).join("");
  $("health").className = "health" + (broken ? " broken" : "");
  $("health").innerHTML = `<span class="verdict ${broken ? "v-failed" : "v-finalised"}">${verdict}</span>
    ${stat(s.producers_started, "STARTED", "")}${stat(s.producers_completed, "COMPLETED", "grn")}
    ${stat(s.producers_failed, "FAILED", fails ? "red" : "")}${stat(s.invalid_emissions, "INVALID", "")}
    ${stat(s.producers_cancelled, "CANCELLED", "")}
    <span class="msg">${msg}</span><span class="work">${work}</span>`;
  // vocab verdict enum: FINALISED | FAILED | PAUSED | INCOMPLETE | LIVE. LIVE is derived in
  // renderVerdict from STATE.live + graph.live; renderHealth is called AFTER renderVerdict inside
  // render() so the top badge's live-follow state is reflected here as the same categorical outcome.
  const verdictEnum = st === "failed" ? "FAILED"
    : st === "paused" ? "PAUSED"
    : st === "incomplete" ? (STATE.live === STATE.name && STATE.graph.live ? "LIVE" : "INCOMPLETE")
    : "FINALISED";
  emit("HEALTH_RENDERED", _paneCtx("health", { verdict: verdictEnum }));
}

// ---------- inspector: raw event (§7.1) / producer provenance ----------
function inspectEvent(seq) {
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

async function inspectProducer(instance) {
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
  const chain = data.ancestry.map((a) => `${escapeHtml(a.kind)}[${escapeHtml(a.instance.slice(-4))}]`).join(" → ");
  $("insp").innerHTML = `<div class="row"><span class="l">producer</span><span><b>${escapeHtml(x.kind)}</b> <span class="dim">${escapeHtml(x.instance.slice(-6))}</span></span></div>
    <div class="row"><span class="l">cause</span><span>${escapeHtml(x.cause)}${x.trigger_id ? ` <span class="k-trigger">${escapeHtml(x.trigger_id)}</span>` : ""}</span></div>
    <div class="row"><span class="l">at seq</span><span>${x.at_seq}</span></div>
    <div class="row"><span class="l">input</span><span class="dim">${escapeHtml(x.input_sha256 || "—")}</span></div>
    <div class="row"><span class="l">ancestry</span><span>${chain}</span></div>`;
}

// escape ALL of & < > " ' (quotes too — used in attribute contexts) and coerce to string, so any
// record-derived identifier (topology / event / producer / trigger name, run id) is inert in the DOM.
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- cursor wiring ----------
// The five view slots the vocab names: run (graph_run), topology, scene, io, read.
// PANE_SWITCHED fires only on an actual slot change (idempotent clicks are silent by design).
// Renamed from v0.1 VIEW_SWITCHED to free the word 'View' for substrate's runtime primitive.
const _currentPane = () => STATE.mode === "io" ? "io" : STATE.graphView === "topo" ? "topology" : STATE.graphView;
function _switchView(to_pane) {
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
// _cursorSource lets the cursor emitter tag which surface moved the cursor (drag | button | play_frame).
// Default drag; the button + play helpers override right before calling _setSeq / oninput.
let _cursorSource = "drag";
$("seq").oninput = (e) => {
  const prior_seq = STATE.cursor;
  STATE.cursor = +e.target.value;
  if (STATE.cursor !== prior_seq) {
    emit("CURSOR_MOVED", { seq: STATE.cursor, prior_seq, subject_record: STATE.name, source: _cursorSource });
  }
  _cursorSource = "drag";  // reset — the next input is drag unless a helper re-tags first
  $("seqnow").textContent = STATE.cursor; render();
};
$("toStart").onclick = () => { _cursorSource = "button"; $("seq").value = 0; $("seq").oninput({ target: $("seq") }); };
$("toEnd").onclick = () => { _cursorSource = "button"; $("seq").value = $("seq").max; $("seq").oninput({ target: $("seq") }); };

// ---------- replay Transport: play/pause/speed advance the ONE seq-cursor over time ----------
// No new time axis — the play loop just steps the same cursor the graph/stream/scene read in
// lock-step, so replay animates every surface at once. Fixed-rate (seq/sec); original-timing via
// the events' `t` is a later add (near-instant on the deterministic CI records).
let _raf = null, _playLast = 0, _playAccum = 0;
function _setSeq(v) { _cursorSource = "play_frame"; $("seq").value = v; $("seq").oninput({ target: $("seq") }); }
function _updatePlayBtn() { $("play").textContent = STATE.playing ? "⏸" : "▶"; $("play").classList.toggle("playing", STATE.playing); }
// stopReason lets startPlay's end-reached path and the seq-drag interrupt handler pass distinct
// reasons through the same stopPlay entrypoint. Default user_pause when a user click flips it off.
let _stopReason = "user_pause";
function stopPlay() {
  if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
  if (STATE.playing) {
    const at_seq = STATE.cursor;
    STATE.playing = false;
    _updatePlayBtn();
    emit("PLAY_STOPPED", { at_seq, reason: _stopReason, subject_record: STATE.name });
    _stopReason = "user_pause";
  }
}
// rAF loop: each frame advance the cursor by (elapsed * speed) seqs and render ONCE, so the replay
// RATE (seq/sec) is decoupled from the render rate (~60 fps). High speeds advance several seqs per
// frame instead of forcing a full render per seq — no longer render-bound (Drift watchlist fold).
function _frame(ts) {
  if (!STATE.playing) return;
  const max = +$("seq").max;
  if (!_playLast) _playLast = ts;
  _playAccum += ((ts - _playLast) / 1000) * STATE.speed;  // seqs owed at the current rate
  _playLast = ts;
  if (_playAccum >= 1) {
    const step = Math.floor(_playAccum);
    _playAccum -= step;
    const next = Math.min(max, STATE.cursor + step);
    _setSeq(next);                                          // one render per frame, any step size
    if (next >= max) { _stopReason = "end_reached"; stopPlay(); return; }                // reached the end -> stop here
  }
  _raf = requestAnimationFrame(_frame);
}
function startPlay() {
  if (STATE.cursor >= +$("seq").max) _setSeq(0);   // at the end -> replay from the start (rewind)
  const from_seq = STATE.cursor;
  STATE.playing = true; _updatePlayBtn();
  _playLast = 0; _playAccum = 0;
  emit("PLAY_STARTED", { from_seq, speed: STATE.speed, subject_record: STATE.name });
  _raf = requestAnimationFrame(_frame);
}
$("play").onclick = () => (STATE.playing ? stopPlay() : startPlay());
$("speedsel").onchange = () => {
  const prior_speed = STATE.speed;
  STATE.speed = +$("speedsel").value;
  if (STATE.speed !== prior_speed) emit("SPEED_CHANGED", { speed: STATE.speed, prior_speed });
};
$("seq").addEventListener("pointerdown", () => { _stopReason = "scrub_interrupt"; stopPlay(); });  // grabbing the slider pauses (don't fight the user)

// ---------- integrated terminal: a read interface over the same record the GUI shows ----------
function _narrateLine(e) { const g = gist(e); return shortKind(e.kind) + (g ? " — " + g : ""); }
function renderTerm() {
  const body = $("termbody");
  body.innerHTML = STATE.term.lines.map((l) => `<div class="term-line tl-${l.cls}">${escapeHtml(l.text)}</div>`).join("");
  body.scrollTop = body.scrollHeight;
  const chatting = STATE.term.chat && STATE.term.chat.active;
  $("termprompt").textContent = chatting ? `${STATE.term.model || "deterministic"} ›` : (STATE.name || "substrate") + "$";
  // the header hint + placeholder tell you the mode: how to talk (idle) vs how to leave (chatting).
  const hint = $("termhint");
  if (hint) hint.innerHTML = chatting ? "just type to talk · <b>/exit</b> to leave" : "<b>chat</b> to talk · <b>help</b>";
  const pv = $("termparams"), pp = STATE.term.params;
  if (pv) pv.textContent = `think ${pp.think ? "on" : "off"} · tokens ${pp.tokens > 0 ? pp.tokens : "∞"} · timeout ${pp.timeout}s`;
  const inp = $("terminput");
  if (inp) inp.placeholder = chatting
    ? "type your message to the model — /exit to leave"
    : "type 'chat' to talk to the model — or a command (help)";
}
function termPush(lines) { STATE.term.lines.push(...lines); renderTerm(); }
function termSetOpen(v, trigger) {
  const wasOpen = STATE.term.open;
  STATE.term.open = v;
  $("termdock").style.display = v ? "" : "none";
  $("termOpen").style.display = v ? "none" : "";
  $("termToggle").classList.toggle("on", v);
  if (v) {
    if (!STATE.term.lines.length) STATE.term.lines.push({ cls: "dim", text: "substrate read interface · reads the same record the GUI shows · type `help`" });
    renderTerm(); $("terminput").focus();
  }
  if (v && !wasOpen) emit("TERMINAL_OPENED", trigger ? { trigger } : {});
  else if (!v && wasOpen) emit("TERMINAL_CLOSED", {});
}
// One helper so the model picker and the `model` command both funnel through a single MODEL_SELECTED
// emit with prior_model correctly threaded. Returns the effective model (unchanged if next was equal).
function _selectModel(next) {
  const prior_model = STATE.term.model || "deterministic";
  if (next === prior_model) return prior_model;
  STATE.term.model = next;
  const el = $("agentmodel"); if (el && el.value !== next) el.value = next;
  emit("MODEL_SELECTED", { model: next, prior_model });
  return next;
}
// One helper for the three `think`/`tokens`/`timeout` params so PARAMS_CHANGED fires exactly once
// per real change with prior_value + value + field enum.
function _setParam(field, value) {
  const pp = STATE.term.params;
  const prior_value = pp[field];
  if (prior_value === value) return;
  pp[field] = value;
  emit("PARAMS_CHANGED", { field, value, prior_value });
}
async function runTerm(line) {
  const out = []; const say = (text, cls) => out.push({ text, cls: cls || "out" });
  let l = line.trim();
  // In a CONVERSATION, you just TYPE to talk (no `chat` prefix, like Claude Code): plain text is a
  // message to the model; a /slash prefix runs a command (e.g. /exit, /tail). Outside chat, bare.
  if (STATE.term.chat && STATE.term.chat.active) {
    if (l.startsWith("/")) { l = l.slice(1).trim(); }
    else { if (l) await sendChatMessage(l); return out; }
  }
  const parts = l.split(/\s+/), cmd = parts[0];
  if (!cmd) return out;
  if (cmd === "clear") { STATE.term.lines = []; return null; }
  if (cmd === "help" || cmd === "?") {
    say("substrate — read interface (the same record the GUI shows, typeable)", "dim");
    [["chat", "start/reconnect a conversation — then just TYPE to talk (watch it run in the graph)"],
     ["think on|off · tokens N · timeout N", "call parameters for the driver (shown in the head; 0 tokens = uncapped)"],
     ["/exit", "while chatting: leave (the conversation is kept; `chat` reconnects). /cmd runs a command"],
     ["model <name>", "pick the driver (or use the picker): an Ollama model, claude, gemini, deterministic"],
     ["cwd [<path>]", "the working directory the agent operates in (unset = a dedicated session dir)"],
     ["worktree <repo>", "isolate this session in its own git worktree of a repo (a branch, adjacent)"],
     ["tail [--kind K] [--producer P] [--all]", "events up to the cursor (seq + t)"],
     ["cat <seq>", "the full payload of the event at <seq> — the content"],
     ["ls", "the application output events + their seqs"],
     ["input", "the run's resolved seed"],
     ["narrate", "the legible story (causal beats + work)"],
     ["inspect <kind|instance>", "provenance: cause + ancestry"],
     ["clear", "clear the terminal"]].forEach(([c, d]) => say("  " + c.padEnd(42) + d));
    return out;
  }
  if (cmd === "model") {
    if (parts[1]) {
      _selectModel(parts[1]);
      say("driver model = " + parts[1], "dim");
    } else say("driver model = " + (STATE.term.model || "deterministic") + "   (or use the picker)", "dim");
    return out;
  }
  if (cmd === "cwd" || cmd === "workspace") {
    // the working directory the agent's tools operate in (relative paths + bash resolve there). Set it
    // BEFORE you talk to pick where the agent works; unset = a dedicated session dir under
    // ~/.substrate/sessions/ (review C-16: NOT the server's launch dir). Absolute paths still go where named.
    if (parts[1]) { STATE.term.workspace = parts.slice(1).join(" "); STATE.term.worktree = null; say("workspace = " + STATE.term.workspace, "dim"); }
    else say("workspace = " + (STATE.term.workspace || "(a dedicated per-session dir)"), "dim");
    return out;
  }
  if (cmd === "worktree" || cmd === "wt") {
    // git-worktree-per-session: run this session in its OWN worktree of a repo — a branch adjacent to
    // it, so the agent works isolated from your working tree and its changes are a diffable branch.
    if (parts[1]) {
      STATE.term.worktree = parts.slice(1).join(" ");
      STATE.term.workspacePath = null;  // force the new worktree path/branch to be shown next turn
      if (!STATE.term.workspace || STATE.term.workspace.startsWith("/")) STATE.term.workspace = "sess-" + Math.random().toString(36).slice(2, 10);
      say("worktree of " + STATE.term.worktree + " — this session runs on branch substrate/" + STATE.term.workspace, "dim");
    } else say("worktree = " + (STATE.term.worktree || "(none — `worktree <repo>` to isolate on a branch)"), "dim");
    return out;
  }
  if (cmd === "diff") {
    // show what the agent changed in this session's worktree (the "show me what it did" half of B).
    const p = STATE.term.workspacePath || STATE.term.workspace;
    if (!p || !p.startsWith("/")) { say("no worktree yet — `worktree <repo>`, then talk to the agent", "dim"); return out; }
    const d = await api(`/api/worktree_diff?path=${encodeURIComponent(p)}`).catch(() => null);
    if (!d || d.error) { say("diff: " + ((d && d.error) || "unavailable — not a git worktree?"), "err"); return out; }
    if (!d.files.length) { say("no changes in this session's worktree yet", "dim"); return out; }
    say(d.files.length + " file(s) changed on branch substrate/" + STATE.term.workspace + ":", "dim");
    d.files.forEach((f) => say("  " + f));
    say((d.diff.slice(0, 2000) + (d.diff.length > 2000 ? "\n… (truncated — see the branch)" : "")));
    return out;
  }
  if (cmd === "think") {
    const v = (parts[1] || "").toLowerCase();
    if (v === "on" || v === "off") { _setParam("think", v === "on"); say(`think = ${v}`, "dim"); }
    else say("usage: think on|off", "dim");
    renderTerm(); return;
  }
  if (cmd === "tokens") {
    const n = parseInt(parts[1], 10);
    if (Number.isFinite(n) && n >= 0) { _setParam("tokens", n); say(`tokens = ${n > 0 ? n : "uncapped"}`, "dim"); }
    else say("usage: tokens N   (0 = uncapped)", "dim");
    renderTerm(); return;
  }
  if (cmd === "timeout") {
    const n = parseFloat(parts[1]);
    if (Number.isFinite(n) && n > 0) { _setParam("timeout", n); say(`timeout = ${n}s`, "dim"); }
    else say("usage: timeout SECONDS", "dim");
    renderTerm(); return;
  }
  if (cmd === "params") {
    const pp = STATE.term.params;
    say(`think ${pp.think ? "on" : "off"} · tokens ${pp.tokens > 0 ? pp.tokens : "uncapped"} · timeout ${pp.timeout}s`, "dim");
    return;
  }
  if (cmd === "chat" || cmd === "agent") {
    // enter (or RECONNECT to) the conversation — like opening a terminal session. The conversation
    // persists across /exit, so `chat` picks up where you left off; then you just TYPE to talk.
    if (!STATE.term.chat) STATE.term.chat = { active: false, convo: [] };
    const turns = STATE.term.chat.convo.length;
    const wasActive = STATE.term.chat.active;
    STATE.term.chat.active = true;
    if (!wasActive) emit("CHAT_ENTERED", turns > 0 ? { reconnect: true } : {});
    const model = STATE.term.model || "deterministic";
    say(
      turns
        ? `reconnected to your conversation with ${model} (${turns} turns) — type to talk · /exit to leave`
        : `chat with ${model} — just type to talk · /exit to leave · switch model with the picker`,
      "dim",
    );
    return out;
  }
  if (cmd === "exit") {
    if (STATE.term.chat && STATE.term.chat.active) {
      const turns_in_conversation = STATE.term.chat.convo.length;
      STATE.term.chat.active = false;
      emit("CHAT_EXITED", { turns_in_conversation });
      say("left chat — your conversation is kept; type `chat` to reconnect", "dim");
    } else say("(not in a conversation — type `chat` to start one)", "dim");
    return out;
  }
  if (!STATE.name) { say("no record selected", "err"); return out; }
  if (cmd === "tail") {
    const all = parts.includes("--all");
    const ki = parts.indexOf("--kind"), pr = parts.indexOf("--producer");
    const kf = ki >= 0 ? parts[ki + 1] : null, pf = pr >= 0 ? parts[pr + 1] : null;
    let evs = STATE.events.filter((e) => all || e.seq <= STATE.cursor);
    if (kf) evs = evs.filter((e) => e.kind === kf || shortKind(e.kind) === kf);
    if (pf) evs = evs.filter((e) => e.producer && e.producer.kind === pf);
    if (!evs.length) { say("(no matching events" + (all ? "" : " at or before seq " + STATE.cursor) + ")", "dim"); return out; }
    evs.forEach((e) => { const cat = category(e.kind); say("seq " + String(e.seq).padStart(3, "0") + "  " + relT(e.t).padEnd(11) + "  " + shortKind(e.kind).padEnd(28) + " " + (e.producer && e.producer.kind ? e.producer.kind : "·"), cat === "failure" ? "err" : cat === "application" ? "accent" : "out"); });
    say(evs.length + " event(s)" + (all ? "" : " · cursor seq " + STATE.cursor), "dim");
    return out;
  }
  if (cmd === "cat") {
    const seq = parseInt(parts[1], 10);
    if (isNaN(seq)) { say("usage: cat <seq>   (see `tail` / `ls`)", "err"); return out; }
    const e = STATE.events.find((x) => x.seq === seq);
    if (!e) { say("cat: no event at seq " + seq, "err"); return out; }
    say("# seq " + e.seq + "  " + relT(e.t) + "  " + shortKind(e.kind) + (e.producer && e.producer.kind ? "  (" + e.producer.kind + ")" : ""), "dim");
    JSON.stringify(e.payload, null, 2).split("\n").forEach((l) => say(l, category(e.kind) === "failure" ? "err" : "out"));
    return out;
  }
  if (cmd === "ls") {
    const io = await api(`/api/records/${STATE.name}/io`);
    const outs = io.outputs || [];
    if (!outs.length) { say("(no application outputs)", "dim"); return out; }
    outs.forEach((o) => say("  seq " + String(o.seq).padStart(3, "0") + "  " + o.kind, o.seq <= STATE.cursor ? "out" : "dim"));
    return out;
  }
  if (cmd === "input") {
    const io = await api(`/api/records/${STATE.name}/io`);
    if (io.input == null) { say("(no declared seed — this topology is parameterized at build time)", "dim"); return out; }
    JSON.stringify(io.input, null, 2).split("\n").forEach((l) => say(l, "out"));
    return out;
  }
  if (cmd === "narrate") {
    const KEEP = new Set(["substrate.RunStarted", "substrate.TriggerFired", "substrate.TerminationMatched", "substrate.RunFinalised"]);
    const beats = STATE.events.filter((e) => e.seq <= STATE.cursor && (category(e.kind) === "application" || category(e.kind) === "failure" || KEEP.has(e.kind)));
    if (!beats.length) { say("(nothing at or before seq " + STATE.cursor + ")", "dim"); return out; }
    beats.forEach((e) => { const cat = category(e.kind); say("seq " + String(e.seq).padStart(3, "0") + "  " + relT(e.t).padEnd(11) + "  " + _narrateLine(e), cat === "failure" ? "err" : cat === "application" ? "accent" : "out"); });
    return out;
  }
  if (cmd === "inspect") {
    const ref = parts[1];
    if (!ref) { say("usage: inspect <producer-kind|instance>", "err"); return out; }
    let instance = ref;
    const inst = (STATE.graph.instances || []).find((i) => i.instance === ref || i.instance.endsWith(ref) || i.kind === ref);
    if (inst) instance = inst.instance;
    const data = await api(`/api/records/${STATE.name}/explain/${instance}`).catch(() => null);
    if (!data || data.error) { say("inspect: no provenance for '" + ref + "'", "err"); return out; }
    const x = data.explanation;
    say(x.kind + "  (" + x.instance + ")", "accent");
    say("  cause: " + x.cause + (x.trigger_id ? " [" + x.trigger_id + "]" : ""));
    say("  at seq: " + x.at_seq);
    say("  ancestry: " + (data.ancestry || []).map((a) => a.kind).join(" → "));
    return out;
  }
  say(cmd + ": command not found — try `help`", "err");
  return out;
}
async function termSubmit() {
  const line = $("terminput").value;
  termPush([{ cls: "in", text: $("termprompt").textContent + " " + line }]);
  if (line.trim()) STATE.term.history.unshift(line);
  STATE.term.hi = -1; $("terminput").value = "";
  const res = await runTerm(line);
  if (res === null) { renderTerm(); return; }
  if (res && res.length) termPush(res);
}
$("terminput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); termSubmit(); }
  else if (e.key === "ArrowUp") { e.preventDefault(); const n = Math.min(STATE.term.history.length - 1, STATE.term.hi + 1); if (n >= 0) { STATE.term.hi = n; $("terminput").value = STATE.term.history[n]; } }
  else if (e.key === "ArrowDown") { e.preventDefault(); const n = STATE.term.hi - 1; if (n < 0) { STATE.term.hi = -1; $("terminput").value = ""; } else { STATE.term.hi = n; $("terminput").value = STATE.term.history[n]; } }
});
$("termOpen").onclick = () => termSetOpen(true, "toggle_button");
$("termClose").onclick = () => termSetOpen(false);
$("termToggle").onclick = () => termSetOpen(!STATE.term.open, "toggle_button");

// ---------- two-view scaffold (sprint 033) ----------
// The header toggle + Ctrl+` flip between #view-desktop and #view-terminal.
// Snapshot: on flip-out we record the leaving view's scroll positions across
// its scrollable children plus which element held focus + its selection range;
// on flip-in we restore. PANE_SWITCHED carries the same shape the vocab already
// has (to_pane, prior_pane, subject_record); the two new to_pane values are
// "terminal" and "desktop".
// Focus tracking: mouse-clicking the toggle steals focus, so activeElement at
// handler entry names the button, not the field the user was in. Track the
// last "real" focus via focusin — excluding the toggle button — so the snapshot
// sees the pre-click focus target.
let _lastRealFocus: { id: string; start: number | null; end: number | null } | null = null;
document.addEventListener("focusin", (e: any) => {
  const el = e.target;
  if (!el || !el.id || el.id === "view-toggle") return;
  _lastRealFocus = {
    id: el.id,
    start: typeof el.selectionStart === "number" ? el.selectionStart : null,
    end: typeof el.selectionEnd === "number" ? el.selectionEnd : null,
  };
});
function _snapshotView(viewId: string): any {
  const root = document.getElementById(viewId);
  if (!root) return null;
  const scrolls: [string, number, number][] = [];
  root.querySelectorAll("*").forEach((el: any, idx: number) => {
    if (el.scrollTop || el.scrollLeft) scrolls.push([`${el.tagName}#${el.id || ''}.${idx}`, el.scrollTop, el.scrollLeft]);
  });
  // Prefer the tracked pre-click focus (see _lastRealFocus above); fall back
  // to activeElement for the keyboard path where no focus theft happened.
  let focus: any = null;
  const tracked = _lastRealFocus;
  if (tracked) {
    const el = document.getElementById(tracked.id);
    if (el && root.contains(el)) focus = tracked;
  }
  if (!focus) {
    const active = document.activeElement as any;
    if (active && root.contains(active) && active.id && active.id !== "view-toggle") {
      focus = { id: active.id, start: active.selectionStart ?? null, end: active.selectionEnd ?? null };
    }
  }
  return { scrolls, focus };
}
function _restoreView(viewId: string, snap: any) {
  if (!snap) return;
  const root = document.getElementById(viewId);
  if (!root) return;
  const nodes = Array.from(root.querySelectorAll("*"));
  snap.scrolls.forEach(([key, top, left]: [string, number, number]) => {
    const [tag, rest] = key.split("#");
    const [_id, idxStr] = rest.split(".");
    const idx = parseInt(idxStr, 10);
    const el: any = nodes[idx];
    if (el && el.tagName === tag) { el.scrollTop = top; el.scrollLeft = left; }
  });
  if (snap.focus) {
    const el: any = document.getElementById(snap.focus.id);
    if (el && root.contains(el)) {
      el.focus();
      if (snap.focus.start !== null && typeof el.setSelectionRange === "function") {
        try { el.setSelectionRange(snap.focus.start, snap.focus.end); } catch (_) { /* non-text input */ }
      }
    }
  }
}
function _toggleView(source: string = "toggle_button") {
  const prior = STATE.view;
  const next = prior === "desktop" ? "terminal" : "desktop";
  STATE.viewSnap[prior] = _snapshotView(`view-${prior}`);
  document.getElementById(`view-${prior}`)?.classList.remove("active");
  document.getElementById(`view-${next}`)?.classList.add("active");
  const toggle = document.getElementById("view-toggle");
  if (toggle) toggle.classList.toggle("on-terminal", next === "terminal");
  STATE.view = next;
  emit("PANE_SWITCHED", { to_pane: next, prior_pane: prior, subject_record: STATE.name });
  requestAnimationFrame(() => _restoreView(`view-${next}`, STATE.viewSnap[next]));
}
document.getElementById("view-toggle")?.addEventListener("click", () => _toggleView("toggle_button"));
window.addEventListener("keydown", (e) => { if (e.ctrlKey && (e.key === "`" || e.key === "Dead")) { e.preventDefault(); _toggleView("ctrl_backtick"); } });

loadTopologies();
loadModels();  // populate the terminal's model picker (defaults to the biggest OSS model)
loadRecords().then(() => loadAssays());  // assays prepend to the rail AFTER the records fill it

// Harness compatibility shim (Sprint 008 — TypeScript conversion, behavior-preserving).
// Vite compiles this file as an ES module; top-level `let STATE`, `function loadRecords`, etc.
// become module-scoped. The parent Playwright harness (`harness/*.js`) predates the module
// boundary and calls these as if they were globals via `page.evaluate(() => loadRecords())`
// and `page.evaluate(() => STATE.events)`. Rebind on window so the harness keeps working
// unchanged; a future sprint can migrate the harness to explicit imports.
(window as any).STATE = STATE;
(window as any).loadRecords = loadRecords;
(window as any).selectRecord = selectRecord;
(window as any).loadAssays = loadAssays;
(window as any).loadModels = loadModels;
(window as any).api = api;  // Sprint 028: harness routes through the wrapped seam to trigger FETCH_FAILED
