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

let STATE = { name: null, events: [], graph: null, summary: null, manifest: null, topology: null, scene: null, cursor: 0, playing: false, speed: 30, term: { open: false, lines: [], history: [], hi: -1 }, sel: null, mode: "read", graphView: "run", live: null, resumable: new Set() };

// the time dimension alongside the order: seq is the order (no time), t the time (no order). Show
// t RELATIVE to the run's start (events[0] = RunStarted) — ~0 on the deterministic CI demos (they
// ARE instant), and the real per-turn gaps on a real-model run.
function relT(t) { const t0 = STATE.events.length ? STATE.events[0].t : (t || 0); const d = (t || 0) - t0; return "t+" + (d < 10 ? d.toFixed(3) : d.toFixed(1)) + "s"; }

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
      <div class="nm">${escapeHtml(r.name)}</div><div class="meta ${broken ? "broken" : ""}">${escapeHtml(r.run_id.slice(0, 8))}… · ${escapeHtml(meta)}</div>`;
    div.onclick = () => selectRecord(r.name);
    $("rail").appendChild(div);
  }
  STATE.resumable = new Set(recs.filter((r) => r.resumable).map((r) => r.name));  // paused + has a continuation
  // populate the diff selector (compare this record against another — first divergence by seq)
  const sel = $("diffsel");
  sel.innerHTML = '<option value="">⇄ diff vs…</option>' +
    recs.map((r) => `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)}</option>`).join("");
  sel.onchange = () => { if (sel.value) renderDiff(sel.value); };
  // auto-select only on FIRST load (else a refresh after launch/resume yanks selection to the top
  // record with a dangling fetch — the race behind the verdict flicker. review #38, obs b).
  if (STATE.name === null) {
    // honor a ?record=<name> deep-link (the Studio's "view the run in the console" lands here);
    // fall back to the first record. Only if the named record actually exists.
    const want = new URLSearchParams(location.search).get("record");
    const target = (want && recs.some((r) => r.name === want)) ? want : (recs[0] && recs[0].name);
    if (target) selectRecord(target);
  }
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
    STATE.graph = g; STATE.events = full.events; STATE.summary = summary; updateScene();
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
  } else {
    const x = d.divergence;
    $("insp").innerHTML = `<div class="row"><span class="l">diff</span><span><b>${escapeHtml(d.a)}</b> vs <b>${escapeHtml(d.b)}</b></span></div>
      <div class="row"><span class="l">diverge</span><span class="diff-hi">● first divergence at <b>seq ${x.seq}</b> (index ${x.index})</span></div>
      <div class="row"><span class="l">${escapeHtml(d.a)}</span><span>${escapeHtml(x.kind_a)} <span class="dim">${escapeHtml((x.hash_a || "").slice(0, 24))}…</span></span></div>
      <div class="row"><span class="l">${escapeHtml(d.b)}</span><span>${escapeHtml(x.kind_b)} <span class="dim">${escapeHtml((x.hash_b || "").slice(0, 24))}…</span></span></div>`;
  }
}

// ---------- select + fetch a record's projections ----------
async function selectRecord(name) {
  stopPlay();  // switching records stops any in-flight replay (no loop leaking across records)
  if (STATE.live && STATE.live !== name) STATE.live = null;  // navigating away stops the follow
  STATE.name = name; STATE.sel = null;
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
    ? outs.map((o) => `<div class="art"><span class="sq">seq ${String(o.seq).padStart(3, "0")}</span><span class="kd">${escapeHtml(o.kind)}</span><span class="pl">${escapeHtml(gistPayload(o.payload))}</span></div>`).join("")
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
    html += `<div class="lane" data-inst="${escapeHtml(i.instance)}">
      <div class="lbl">${escapeHtml(i.kind)} <span class="inst">${escapeHtml(i.instance.slice(-4))}</span></div>
      <div class="track">${startMark}
        <div class="bar ${i.status}" style="left:${left}%;width:${w}%" title="${escapeHtml(i.kind)} ${i.fired_seq}→${i.ended_seq ?? "…"} ${i.status}"></div>
      </div></div>`;
  });
  html += `</div>`;
  $("graph").innerHTML = html;
  $("graph").querySelectorAll(".lane").forEach((l) => (l.onclick = () => inspectProducer(l.dataset.inst)));
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
  if (!sc) { $("graph").innerHTML = `<div class="scene-cap dim">No renderable shape in this record.</div>`; return; }
  const cur = STATE.cursor;
  const shown = sc.frames.filter((f) => f.seq <= cur);
  const frame = shown.length ? shown[shown.length - 1] : null;
  if (!frame) { $("graph").innerHTML = `<div class="scene-cap dim">No <b>${escapeHtml(sc.kind)}</b> yet at seq ${cur} — scrub forward.</div>`; return; }
  const rows = frame.grid.length, cols = frame.grid[0].length;
  const cells = frame.grid.map((row) => row.map((c) => `<div class="cell ${c ? "on" : ""}"></div>`).join("")).join("");
  const scalars = frame.scalars.map(([k, v]) => `<span class="sv">${escapeHtml(k)}=<b>${escapeHtml(v)}</b></span>`).join("");
  $("graph").innerHTML = `
    <div class="scene-cap">scene · <b>${escapeHtml(sc.kind)}.${escapeHtml(sc.field)}</b>
      <span class="dim">seq ${frame.seq} · ${rows}×${cols} · frame ${sc.frames.indexOf(frame) + 1}/${sc.frames.length}</span> ${scalars}</div>
    <div class="scene-grid" style="grid-template-columns:repeat(${cols},1fr)">${cells}</div>
    <div class="scene-hint dim">the shared world-state at this seq — scrub the cursor to move through the run</div>`;
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
}

// ---------- inspector: raw event (§7.1) / producer provenance ----------
function inspectEvent(seq) {
  STATE.sel = seq; renderStream();
  const e = STATE.events.find((x) => x.seq === seq); if (!e) return;
  const cat = category(e.kind);
  $("insp").innerHTML = `<div class="row"><span class="l">event</span><span><span class="badge k-${cat}">${escapeHtml(shortKind(e.kind))}</span> <span class="dim">seq ${e.seq}</span></span></div>
    <div class="row"><span class="l">schema</span><span>${escapeHtml(e.schema || "")}</span></div>
    <div class="row"><span class="l">time</span><span>${escapeHtml(relT(e.t))} <span class="dim">· order by seq, time by t (epoch ${e.t})</span></span></div>
    <div class="row"><span class="l">producer</span><span>${e.producer && e.producer.kind ? escapeHtml(e.producer.kind) + " <span class='dim'>" + escapeHtml(e.producer.instance) + "</span>" : "— runtime"}</span></div>
    <div class="row"><span class="l">payload</span></div><pre>${escapeHtml(JSON.stringify(e.payload, null, 1))}</pre>`;
}

async function inspectProducer(instance) {
  const name = STATE.name;  // capture for the same staleness guard as renderDiff (ui-frontend-3)
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
$("modeToggle").onclick = () => { STATE.mode = STATE.mode === "io" ? "read" : "io"; render(); };
$("gvRun").onclick = () => { if (STATE.graphView !== "run") { STATE.graphView = "run"; render(); } };
$("gvTopo").onclick = () => { if (STATE.graphView !== "topo") { STATE.graphView = "topo"; render(); } };
$("gvScene").onclick = () => { if (STATE.graphView !== "scene") { STATE.graphView = "scene"; render(); } };
$("seq").oninput = (e) => { STATE.cursor = +e.target.value; $("seqnow").textContent = STATE.cursor; render(); };
$("toStart").onclick = () => { $("seq").value = 0; $("seq").oninput({ target: $("seq") }); };
$("toEnd").onclick = () => { $("seq").value = $("seq").max; $("seq").oninput({ target: $("seq") }); };

// ---------- replay Transport: play/pause/speed advance the ONE seq-cursor over time ----------
// No new time axis — the play loop just steps the same cursor the graph/stream/scene read in
// lock-step, so replay animates every surface at once. Fixed-rate (seq/sec); original-timing via
// the events' `t` is a later add (near-instant on the deterministic CI records).
let _playTimer = null;
function _setSeq(v) { $("seq").value = v; $("seq").oninput({ target: $("seq") }); }
function _updatePlayBtn() { $("play").textContent = STATE.playing ? "⏸" : "▶"; $("play").classList.toggle("playing", STATE.playing); }
function stopPlay() { if (_playTimer) { clearInterval(_playTimer); _playTimer = null; } if (STATE.playing) { STATE.playing = false; _updatePlayBtn(); } }
function _tick() {
  const max = +$("seq").max, next = STATE.cursor + 1;
  if (next > max) { stopPlay(); return; }  // reached the end -> stop here
  _setSeq(next);
}
function startPlay() {
  if (STATE.cursor >= +$("seq").max) _setSeq(0);  // at the end -> replay from the start (rewind)
  STATE.playing = true; _updatePlayBtn();
  _playTimer = setInterval(_tick, Math.max(16, 1000 / STATE.speed));
}
$("play").onclick = () => (STATE.playing ? stopPlay() : startPlay());
$("speedsel").onchange = () => {
  STATE.speed = +$("speedsel").value;
  if (_playTimer) { clearInterval(_playTimer); _playTimer = setInterval(_tick, Math.max(16, 1000 / STATE.speed)); }
};
$("seq").addEventListener("pointerdown", stopPlay);  // grabbing the slider pauses (don't fight the user)

// ---------- integrated terminal: a read interface over the same record the GUI shows ----------
function _narrateLine(e) { const g = gist(e); return shortKind(e.kind) + (g ? " — " + g : ""); }
function renderTerm() {
  const body = $("termbody");
  body.innerHTML = STATE.term.lines.map((l) => `<div class="term-line tl-${l.cls}">${escapeHtml(l.text)}</div>`).join("");
  body.scrollTop = body.scrollHeight;
  $("termprompt").textContent = (STATE.name || "substrate") + "$";
}
function termPush(lines) { STATE.term.lines.push(...lines); renderTerm(); }
function termSetOpen(v) {
  STATE.term.open = v;
  $("termdock").style.display = v ? "" : "none";
  $("termOpen").style.display = v ? "none" : "";
  if (v) {
    if (!STATE.term.lines.length) STATE.term.lines.push({ cls: "dim", text: "substrate read interface · reads the same record the GUI shows · type `help`" });
    renderTerm(); $("terminput").focus();
  }
}
async function runTerm(line) {
  const parts = line.trim().split(/\s+/), cmd = parts[0];
  const out = []; const say = (text, cls) => out.push({ text, cls: cls || "out" });
  if (!cmd) return out;
  if (cmd === "clear") { STATE.term.lines = []; return null; }
  if (cmd === "help" || cmd === "?") {
    say("substrate — read interface (the same record the GUI shows, typeable)", "dim");
    [["tail [--kind K] [--producer P] [--all]", "events up to the cursor (seq + t)"],
     ["cat <seq>", "the full payload of the event at <seq> — the content"],
     ["ls", "the application output events + their seqs"],
     ["input", "the run's resolved seed"],
     ["narrate", "the legible story (causal beats + work)"],
     ["inspect <kind|instance>", "provenance: cause + ancestry"],
     ["clear", "clear the terminal"]].forEach(([c, d]) => say("  " + c.padEnd(42) + d));
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
$("termOpen").onclick = () => termSetOpen(true);
$("termClose").onclick = () => termSetOpen(false);
window.addEventListener("keydown", (e) => { if (e.ctrlKey && (e.key === "`" || e.key === "Dead")) { e.preventDefault(); termSetOpen(!STATE.term.open); } });

loadTopologies();
loadRecords();
