/* substrate-ui live console — reads the REAL substrate read API over HTTP (server.py).
   Every surface is a projection of one record; nothing is invented (§7.1). The one seq-cursor
   drives the graph and the stream in lock-step. Failures are loud (§7.2); concurrency comes from
   the spawn structure — fired_seq + spawn cohorts — not span overlap (§7.3). The eight words only. */
"use strict";

const $ = (id) => document.getElementById(id);
const api = (p) => fetch(p).then((r) => r.json());

const FAILURE = new Set([
  "substrate.ProducerFailed", "substrate.InputBuildFailed",
  "substrate.PredicateQuarantined", "substrate.ProducerEmittedInvalidEvent",
]);
const BOOKKEEPING = new Set(["substrate.ProducerStarted", "substrate.ProducerCompleted", "substrate.InjectionApplied"]);

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

let STATE = { name: null, events: [], graph: null, summary: null, manifest: null, cursor: 0, sel: null, mode: "read", live: null, resumable: new Set() };

// ---------- record rail ----------
async function loadRecords() {
  const recs = await api("/api/records");
  $("rail").innerHTML = "";
  for (const r of recs) {
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
      <div class="nm">${r.name}</div><div class="meta ${broken ? "broken" : ""}">${r.run_id.slice(0, 8)}… · ${meta}</div>`;
    div.onclick = () => selectRecord(r.name);
    $("rail").appendChild(div);
  }
  STATE.resumable = new Set(recs.filter((r) => r.resumable).map((r) => r.name));  // paused + has a continuation
  // populate the diff selector (compare this record against another — first divergence by seq)
  const sel = $("diffsel");
  sel.innerHTML = '<option value="">⇄ diff vs…</option>' +
    recs.map((r) => `<option value="${r.name}">${r.name}</option>`).join("");
  sel.onchange = () => { if (sel.value) renderDiff(sel.value); };
  // auto-select only on FIRST load (else a refresh after launch/resume yanks selection to the top
  // record with a dangling fetch — the race behind the verdict flicker. review #38, obs b).
  if (recs[0] && STATE.name === null) selectRecord(recs[0].name);
}

// ---------- thin control: launch a bundled topology (records RunStarted, §7.7) ----------
async function loadTopologies() {
  const topos = await api("/api/topologies");
  $("launchsel").innerHTML = '<option value="">+ launch a topology…</option>' +
    topos.map((t) => `<option value="${t}">${t}</option>`).join("");
}
$("launchbtn").onclick = async () => {
  const t = $("launchsel").value;
  if (!t) return;
  $("launchmsg").textContent = `launching ${t}…`;
  const res = await fetch(`/api/launch?topology=${encodeURIComponent(t)}`, { method: "POST" }).then((r) => r.json());
  await loadRecords();
  await selectRecord(res.name);
  if (res.status === "incomplete") { $("launchmsg").textContent = `● live: ${res.name}`; followLive(res.name); }
  else $("launchmsg").textContent = `${res.name} · ${res.status}`;
};

// ---------- thin control: resume a paused run (feed the awaited input, continue; §7.7) ----------
$("resumebtn").onclick = async () => {
  const target = STATE.name;
  $("launchmsg").textContent = `resuming ${target}…`;
  const res = await fetch(`/api/resume?record=${encodeURIComponent(target)}`, { method: "POST" }).then((r) => r.json());
  await loadRecords();
  await selectRecord(res.name);
  if (res.status === "incomplete") { $("launchmsg").textContent = `● live: ${res.name}`; followLive(res.name); }
  else $("launchmsg").textContent = `resumed ${res.resumed} → ${res.name} · ${res.status}`;
};

// ---------- live-attach: follow a launched run AS it is written (attach/F-PERS-4, read-only) ----------
async function followLive(name) {
  STATE.live = name;
  renderVerdict();
  let lastSeq = -1, stalls = 0;
  while (STATE.live === name && STATE.name === name) {
    await new Promise((r) => setTimeout(r, 400));
    if (STATE.name !== name || STATE.live !== name) return;  // navigated away / stopped
    const [g, full, summary] = await Promise.all([
      api(`/api/records/${name}/run_graph`), api(`/api/records/${name}`), api(`/api/records/${name}/summary`),
    ]);
    if (STATE.name !== name) return;
    STATE.graph = g; STATE.events = full.events; STATE.summary = summary;
    const maxSeq = STATE.events.length ? STATE.events[STATE.events.length - 1].seq : 0;
    $("seq").max = maxSeq; $("seq").value = maxSeq; $("seqmax").textContent = maxSeq; $("seqnow").textContent = maxSeq;
    STATE.cursor = maxSeq;  // live tail — the cursor rides the latest event
    // STOP only on a terminal or on server-authoritative DEATH — never on no-growth alone, so a
    // dead run can't read "● LIVE forever" (§7.2, #36) AND a slow-but-alive LLM run is never
    // abandoned (#37: live=true + no-growth is NORMAL for a long generation; server-liveness, not
    // no-growth, is the authoritative stop; a wedged model call self-ends at the adapter timeout).
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
  const d = await api(`/api/diff?a=${encodeURIComponent(STATE.name)}&b=${encodeURIComponent(other)}`);
  if (d.equivalent) {
    $("insp").innerHTML = `<div class="row"><span class="l">diff</span><span><b>${d.a}</b> vs <b>${d.b}</b></span></div>
      <div class="row"><span class="l">result</span><span class="diff-eq">● equivalent under D-8 (no divergence)</span></div>
      <div class="row"><span class="l">means</span><span class="dim">same kinds + decision identities + payload hashes in seq order (modulo run_id / instance / t).</span></div>`;
  } else {
    const x = d.divergence;
    $("insp").innerHTML = `<div class="row"><span class="l">diff</span><span><b>${d.a}</b> vs <b>${d.b}</b></span></div>
      <div class="row"><span class="l">diverge</span><span class="diff-hi">● first divergence at <b>seq ${x.seq}</b> (index ${x.index})</span></div>
      <div class="row"><span class="l">${d.a}</span><span>${x.kind_a} <span class="dim">${(x.hash_a || "").slice(0, 24)}…</span></span></div>
      <div class="row"><span class="l">${d.b}</span><span>${x.kind_b} <span class="dim">${(x.hash_b || "").slice(0, 24)}…</span></span></div>`;
  }
}

// ---------- select + fetch a record's projections ----------
async function selectRecord(name) {
  if (STATE.live && STATE.live !== name) STATE.live = null;  // navigating away stops the follow
  STATE.name = name; STATE.sel = null;
  document.querySelectorAll(".rec").forEach((e) => e.classList.toggle("sel", e.dataset.name === name));
  const [full, graph, summary] = await Promise.all([
    api(`/api/records/${name}`), api(`/api/records/${name}/run_graph`), api(`/api/records/${name}/summary`),
  ]);
  // staleness guard: if a newer selectRecord started while these fetches were in flight, DROP this
  // stale result — else one record's summary lands with another's graph on shared STATE and the
  // verdict flickers a false "NOT CLEAN" (review #38, obs b; mirrors followLive's guard).
  if (STATE.name !== name) return;
  STATE.events = full.events; STATE.manifest = full.manifest; STATE.graph = graph; STATE.summary = summary;
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
  $("readpane").style.display = STATE.mode === "io" ? "none" : "";
  $("iopane").style.display = STATE.mode === "io" ? "" : "none";
  $("modeToggle").textContent = STATE.mode === "io" ? "← graph" : "I/O";
  $("resumebtn").style.display = (STATE.graph && STATE.graph.status === "paused" && STATE.resumable.has(STATE.name)) ? "" : "none";
  if (STATE.mode === "io") renderIO();
  else { renderGraph(); renderStream(); }
  renderHealth();
}

// ---------- I/O surface: the seed in, the artifacts out — derived, seq-cited (§7.1) ----------
function gistPayload(p) {
  if (p == null || typeof p !== "object") return String(p ?? "");
  return Object.entries(p).filter(([k]) => k !== "raw_payload").slice(0, 4)
    .map(([k, v]) => `${k}=${String(v).slice(0, 26)}`).join(", ");
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
  const arts = outs.length
    ? outs.map((o) => `<div class="art"><span class="sq">seq ${String(o.seq).padStart(3, "0")}</span><span class="kd">${o.kind}</span><span class="pl">${escapeHtml(gistPayload(o.payload))}</span></div>`).join("")
    : `<div class="io-empty">No application output yet at seq ${cur}.</div>`;
  const fin = io.finalisation && Object.keys(io.finalisation).length
    ? `<div class="io-doc"><div class="t">finalisation_payload</div><pre>${escapeHtml(JSON.stringify(io.finalisation, null, 1))}</pre></div>` : "";
  $("iopane").innerHTML = `<div class="io-h">input · fed to the run</div>${input}
    <div class="io-h">output · artifacts <span class="r">${outs.length}/${io.outputs.length} produced</span></div>${arts}${fin}`;
}

// ---------- run-as-graph: firing-anchored lifespans + spawn cohorts (§7.3) ----------
function renderGraph() {
  const g = STATE.graph, maxSeq = Math.max(1, +$("seq").max), cur = STATE.cursor;
  const insts = g.instances.filter((i) => i.fired_seq != null && i.fired_seq <= cur);
  const x = (s) => (Math.min(s, maxSeq) / maxSeq) * 100;
  let html = `<div class="legend">
    <span><i style="background:var(--green)"></i>completed</span><span><i style="background:var(--blue)"></i>running</span>
    <span><i style="background:var(--red)"></i>failed</span><span><i style="background:var(--slate)"></i>cancelled</span>
    <span><i style="background:var(--amber);border-radius:50%"></i>spawn</span><span style="color:var(--cyan)">∥ spawn cohort = concurrent</span></div>`;
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
    const end = i.ended_seq == null ? cur : Math.min(i.ended_seq, cur);
    const left = x(i.fired_seq), w = Math.max(1.2, x(end) - left);
    const startMark = i.started_seq != null && i.started_seq <= cur ? `<span class="spawn" style="left:${x(i.started_seq)}%"></span>` : "";
    html += `<div class="lane" data-inst="${i.instance}">
      <div class="lbl">${i.kind} <span class="inst">${i.instance.slice(-4)}</span></div>
      <div class="track">${startMark}
        <div class="bar ${i.status}" style="left:${left}%;width:${w}%" title="${i.kind} ${i.fired_seq}→${i.ended_seq ?? "…"} ${i.status}"></div>
      </div></div>`;
  });
  html += `</div>`;
  $("graph").innerHTML = html;
  $("graph").querySelectorAll(".lane").forEach((l) => (l.onclick = () => inspectProducer(l.dataset.inst)));
}

// ---------- event stream: seq-cited, colored, cursor-truncated ----------
function renderStream() {
  const cur = STATE.cursor;
  $("stream").innerHTML = STATE.events.map((e) => {
    const cat = category(e.kind), future = e.seq > cur;
    const prod = e.producer && e.producer.kind ? e.producer.kind : "runtime";
    return `<div class="ev ${future ? "future" : ""} ${STATE.sel === e.seq ? "sel" : ""}" data-seq="${e.seq}">
      <span class="sq">seq ${String(e.seq).padStart(3, "0")}</span>
      <span class="kd k-${cat}">${shortKind(e.kind)}</span>
      <span class="pl">${prod} · ${gist(e)}</span></div>`;
  }).join("");
  $("stream").querySelectorAll(".ev").forEach((el) => (el.onclick = () => inspectEvent(+el.dataset.seq)));
}

// ---------- health: verdict keyed on the run-level STATUS (§7.2) ----------
function renderHealth() {
  const s = STATE.summary, st = STATE.graph.status;
  const fails = s.producers_failed + s.input_build_failures + s.predicate_quarantines + s.invalid_emissions;
  const broken = st === "failed" || fails > 0 || st === "incomplete";
  const verdict = st === "failed" ? "● FAILED · " + (STATE.graph.final_reason || "").toUpperCase().replace(/_/g, " ")
    : st === "paused" ? "● PAUSED" : st === "incomplete" ? "● INCOMPLETE (no terminal)"
    : fails > 0 ? "● FINALISED · NOT CLEAN" : "● FINALISED · CLEAN";
  const msg = st === "failed" ? "the run itself failed — finished is not worked."
    : st === "incomplete" ? "no terminal RunFinalised — torn or still being written."
    : st === "paused" ? `halted resumably — awaiting ${STATE.graph.paused_on || "input"}`
    : fails > 0 ? `reached RunFinalised — but ${fails} thing(s) inside failed. Finished is not worked.`
    : "reached RunFinalised with no failures.";
  const stat = (n, l, cls) => `<div class="stat ${cls}"><b>${n}</b><span class="l">${l}</span></div>`;
  const work = Object.entries(s.application_events).map(([k, n]) => `<span class="chip">${n} ${k}</span>`).join("");
  $("health").className = "health" + (broken ? " broken" : "");
  $("health").innerHTML = `<span class="verdict ${broken ? "v-failed" : "v-finalised"}">${verdict}</span>
    ${stat(s.producers_started, "STARTED", "")}${stat(s.producers_completed, "COMPLETED", "grn")}
    ${stat(s.producers_failed, "FAILED", fails ? "red" : "")}${stat(s.invalid_emissions, "INVALID", "")}
    ${stat(s.producers_cancelled, "CANCELLED", "")}
    <span class="msg">${msg}</span><span class="work">${work}</span>`;
}

// ---------- inspector: raw event (§7.1) / producer provenance ----------
function inspectEvent(seq) {
  STATE.sel = seq; renderStream();
  const e = STATE.events.find((x) => x.seq === seq); if (!e) return;
  const cat = category(e.kind);
  $("insp").innerHTML = `<div class="row"><span class="l">event</span><span><span class="badge k-${cat}">${shortKind(e.kind)}</span> <span class="dim">seq ${e.seq}</span></span></div>
    <div class="row"><span class="l">schema</span><span>${e.schema || ""}</span></div>
    <div class="row"><span class="l">producer</span><span>${e.producer && e.producer.kind ? e.producer.kind + " <span class='dim'>" + e.producer.instance + "</span>" : "— runtime"}</span></div>
    <div class="row"><span class="l">payload</span></div><pre>${escapeHtml(JSON.stringify(e.payload, null, 1))}</pre>`;
}

async function inspectProducer(instance) {
  const data = await api(`/api/records/${STATE.name}/explain/${instance}`).catch(() => null);
  if (!data || data.error) { $("insp").innerHTML = `<span class="dim">No provenance for ${instance}.</span>`; return; }
  const x = data.explanation;
  const chain = data.ancestry.map((a) => `${a.kind}[${a.instance.slice(-4)}]`).join(" → ");
  $("insp").innerHTML = `<div class="row"><span class="l">producer</span><span><b>${x.kind}</b> <span class="dim">${x.instance.slice(-6)}</span></span></div>
    <div class="row"><span class="l">cause</span><span>${x.cause}${x.trigger_id ? ` <span class="k-trigger">${x.trigger_id}</span>` : ""}</span></div>
    <div class="row"><span class="l">at seq</span><span>${x.at_seq}</span></div>
    <div class="row"><span class="l">input</span><span class="dim">${x.input_sha256 || "—"}</span></div>
    <div class="row"><span class="l">ancestry</span><span>${chain}</span></div>`;
}

const escapeHtml = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

// ---------- cursor wiring ----------
$("modeToggle").onclick = () => { STATE.mode = STATE.mode === "io" ? "read" : "io"; render(); };
$("seq").oninput = (e) => { STATE.cursor = +e.target.value; $("seqnow").textContent = STATE.cursor; render(); };
$("toStart").onclick = () => { $("seq").value = 0; $("seq").oninput({ target: $("seq") }); };
$("toEnd").onclick = () => { $("seq").value = $("seq").max; $("seq").oninput({ target: $("seq") }); };

loadTopologies();
loadRecords();
