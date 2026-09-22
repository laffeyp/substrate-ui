/* app.js — terminal-v1 tab-switch mechanics.
   One delegated click handler on .tabbar. Toggles aria-selected on tab buttons and .active on the
   matching anchor in the anchor strip. No frameworks, no build step. */
"use strict";
(function () {
  const tabbar = document.querySelector(".tabbar");
  const strip = document.querySelector('[data-testid="anchor-strip"]');
  const paneRegion = document.querySelector('[data-testid="pane-region"]');
  if (!tabbar || !strip || !paneRegion) return;

  // ---------- STATE ----------
  // Exposed on window for the harness (B3 — PATH assertion: the harness proves the intended
  // handler ran by observing STATE mutation, not just DOM). Read-only-ish; the harness inspects.
  const STATE = {
    term: { lines: [], history: [], hi: -1, model: null, runName: null, agentSeq: -1, polling: false },
    activeTab: "tab-agent-terminal",
    modelsLoaded: false,
    records: [],
    _currentRecord: null,  // subject rule: what the read tabs read from
    recordsLoaded: false,
    events: [],
    selectedEvent: null,
  };
  window.__TERMINAL_V1_STATE = STATE;
  const LAST_MODEL_KEY = "terminal-v1.lastModel";

  // ---------- agent terminal (extracted from ../web/app.js renderTerm/termPush/input handler) ----------
  const termbody = document.getElementById("termbody");
  const termprompt = document.getElementById("termprompt");
  const terminput = document.getElementById("terminput");
  const modelpicker = document.getElementById("modelpicker");
  const modelhint = document.querySelector('[data-testid="modelhint"]');

  // Sprint 007 — model picker: shows every launch (Architect ruling), remembers last selection via
  // localStorage but does not skip the picker. Populated by GET /api/models (same endpoint the
  // parent uses at ../web/app.js:320). Terminput stays disabled until a model is selected.
  function updatePromptForModel() {
    if (STATE.term.model) {
      termprompt.textContent = STATE.term.model + " ›";
      terminput.disabled = false;
      terminput.placeholder = "";
      if (modelhint) modelhint.textContent = "";
    } else {
      termprompt.textContent = "substrate$";
      terminput.disabled = true;
      terminput.placeholder = "pick a model above";
    }
  }

  async function loadModels() {
    if (!modelpicker) return;
    try {
      const r = await fetch("/api/models");
      const data = await r.json();
      const models = Array.isArray(data.models) ? data.models : [];
      const last = localStorage.getItem(LAST_MODEL_KEY);
      modelpicker.innerHTML =
        `<option value="" disabled ${last ? "" : "selected"}>pick a model…</option>` +
        models.map((m) => `<option value="${m}"${m === last ? " selected" : ""}>${m}</option>`).join("");
      STATE.modelsLoaded = true;
      // NOTE: even if `last` is set, we do NOT auto-apply STATE.term.model — the Architect ruling
      // says the picker shows every launch and the user must click through. Pre-selecting is a hint
      // toward the last choice; STATE.term.model updates only on the user's `change` event.
    } catch (e) {
      modelpicker.innerHTML = `<option value="" disabled selected>load failed</option>`;
      STATE.modelsLoaded = false;
    }
  }

  if (modelpicker) {
    modelpicker.addEventListener("change", (ev) => {
      const v = ev.target.value;
      if (!v) return;
      STATE.term.model = v;
      try { localStorage.setItem(LAST_MODEL_KEY, v); } catch (_) {}
      updatePromptForModel();
      terminput.focus();
    });
    loadModels();
  }
  updatePromptForModel();  // set initial disabled state before models load

  function renderTerm() {
    if (!termbody) return;
    termbody.innerHTML = STATE.term.lines
      .map((l) => `<div class="term-line tl-${l.cls || "out"}">${escapeHtml(l.text)}</div>`)
      .join("");
    termbody.scrollTop = termbody.scrollHeight;
  }
  function termPush(lines) { STATE.term.lines.push(...lines); renderTerm(); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

  // Sprint 008 — /api/agent wiring. Copied from parent ../web/app.js:246 for line rendering.
  function _agentLine(e) {
    const pl = e.payload || {};
    if (e.kind === "ToolCall") return { cls: "accent", text: `→ ${pl.tool}(${JSON.stringify(pl.args)})` };
    if (e.kind === "ToolResult") return { cls: pl.ok ? "out" : "err", text: "  " + (pl.ok ? String(pl.output).slice(0, 200) : pl.error) };
    if (e.kind === "FinalAnswer") return { cls: "accent", text: `✓ ${pl.text}` };
    return null;
  }

  async function pollRun(name) {
    STATE.term.polling = true;
    STATE.term.runName = name;
    STATE.term.agentSeq = -1;
    while (STATE.term.polling) {
      try {
        const rec = await fetch(`/api/records/${encodeURIComponent(name)}`).then((r) => r.json());
        const evs = (rec && rec.events) || [];
        const fresh = evs.filter(
          (e) => e.seq > STATE.term.agentSeq &&
                 (e.kind === "ToolCall" || e.kind === "ToolResult" || e.kind === "FinalAnswer"),
        );
        if (fresh.length) {
          STATE.term.agentSeq = fresh[fresh.length - 1].seq;
          termPush(fresh.map(_agentLine).filter(Boolean));
        }
        // stop on FinalAnswer or substrate.RunFinalised
        const done = evs.some((e) => e.kind === "FinalAnswer" || e.kind === "substrate.RunFinalised");
        if (done) break;
      } catch (_) { /* ignore transient — the record may be mid-write */ }
      await new Promise((r) => setTimeout(r, 500));
    }
    STATE.term.polling = false;
    terminput.disabled = false;
    updatePromptForModel();  // re-enables if a model still picked
    terminput.focus();
  }

  async function sendChat(task) {
    const model = STATE.term.model;
    if (!model) return;
    // Same query shape as parent ../web/app.js:281–305, minus the multi-turn convo (Sprint 009):
    const cli = new Set(["claude", "gemini"]);
    const qs =
      model === "deterministic"
        ? "model=deterministic"
        : cli.has(model)
          ? `model=${model}&task=${encodeURIComponent(task)}`
          : `model=ollama&name=${encodeURIComponent(model)}&task=${encodeURIComponent(task)}`;
    terminput.disabled = true;
    termPush([{ cls: "dim", text: `· ${model} is working…` }]);
    try {
      const res = await fetch(`/api/agent?${qs}`, { method: "POST" }).then((r) => r.json());
      if (!res || res.error || !res.name) {
        termPush([{ cls: "err", text: "agent: launch failed" }]);
        terminput.disabled = false;
        return;
      }
      await pollRun(res.name);
    } catch (e) {
      termPush([{ cls: "err", text: "agent: " + (e && e.message || String(e)) }]);
      terminput.disabled = false;
    }
  }

  if (terminput) {
    terminput.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter") return;
      const line = terminput.value;
      terminput.value = "";
      if (!line) return;
      STATE.term.history.push(line);
      STATE.term.hi = STATE.term.history.length;
      termPush([{ cls: "in", text: (termprompt?.textContent || "$") + " " + line }]);
      if (STATE.term.model) sendChat(line);
    });
  }


  function activate(testid) {
    for (const btn of tabbar.querySelectorAll(".tab")) {
      btn.setAttribute("aria-selected", btn.dataset.testid === testid ? "true" : "false");
    }
    for (const a of strip.querySelectorAll(".anchor")) {
      a.classList.toggle("active", a.dataset.anchor === testid);
    }
    for (const sec of paneRegion.querySelectorAll(".pane")) {
      sec.classList.toggle("pane-active", sec.dataset.paneFor === testid);
    }
    STATE.activeTab = testid;
    // lazy-load Records rail on first activation
    if (testid === "tab-records" && !STATE.recordsLoaded) loadRecords();
    // lazy-fetch topology_graph when Topology structure opens with a record selected
    if (testid === "tab-topology-structure" && STATE._currentRecord && !STATE.topology) loadTopology();
    // lazy-fetch run_graph when Run-as-graph opens
    if (testid === "tab-run-as-graph" && STATE._currentRecord && !STATE.runGraph) loadRunGraph();
    if (testid === "tab-assays" && !STATE.assaysLoaded) loadAssays();
  }

  // ---------- Assays (Sprint 014) ----------
  const assaysPickerEl = document.getElementById("assayspicker");
  const assaysBodyEl = document.getElementById("assaysbody");
  async function loadAssays() {
    if (!assaysPickerEl) return;
    try {
      const list = await fetch("/api/assays").then((r) => r.json());
      STATE.assays = Array.isArray(list) ? list : [];
      STATE.assaysLoaded = true;
      if (!STATE.assays.length) { assaysPickerEl.innerHTML = `<div class="empty">no assays</div>`; return; }
      assaysPickerEl.innerHTML = STATE.assays.map((a) =>
        `<div class="assay-item" data-name="${escapeHtml(a.name)}" data-testid="assay-${escapeHtml(a.name)}">` +
          `<div>${escapeHtml(a.name)}</div>` +
          `<div class="meta">${a.n_cells || 0} cells · ${(a.arms || []).length} arms</div>` +
        `</div>`).join("");
    } catch (_) { assaysPickerEl.innerHTML = `<div class="empty">assays failed to load</div>`; }
  }
  async function selectAssay(name) {
    STATE.selectedAssay = name;
    for (const el of assaysPickerEl.querySelectorAll(".assay-item")) el.classList.toggle("sel", el.dataset.name === name);
    assaysBodyEl.innerHTML = `<div class="empty">loading…</div>`;
    try {
      const rep = await fetch(`/api/assay/${encodeURIComponent(name)}`).then((r) => r.json());
      STATE.assayReport = rep;
      const meta = STATE.assays.find((a) => a.name === name) || {};
      const rows = [
        ["name", name],
        ["fingerprint", meta.fingerprint || "—"],
        ["strong model", meta.strong_model || "—"],
        ["weak models", (meta.weak_models || []).join(", ") || "—"],
        ["arms", (meta.arms || []).join(", ") || "—"],
        ["cells", String(meta.n_cells || 0)],
        ["trials", meta.trials != null ? String(meta.trials) : "—"],
        ["margin", meta.margin != null ? String(meta.margin) : "—"],
      ];
      assaysBodyEl.innerHTML = rows.map(([l, v]) =>
        `<div class="field"><span class="lbl">${escapeHtml(l)}</span><span class="val">${escapeHtml(v)}</span></div>`).join("");
    } catch (_) { assaysBodyEl.innerHTML = `<div class="empty">assay load failed</div>`; }
  }
  if (assaysPickerEl) {
    assaysPickerEl.addEventListener("click", (ev) => {
      const it = ev.target.closest(".assay-item");
      if (it) selectAssay(it.dataset.name);
    });
  }

  async function loadRunGraph() {
    const name = STATE._currentRecord;
    if (!name) return;
    try {
      const g = await fetch(`/api/records/${encodeURIComponent(name)}/run_graph`).then((r) => r.json());
      STATE.runGraph = g;
      renderGraph();
    } catch (_) { STATE.runGraph = null; renderGraph(); }
  }

  async function loadTopology() {
    const name = STATE._currentRecord;
    if (!name) return;
    try {
      const t = await fetch(`/api/records/${encodeURIComponent(name)}/topology_graph`).then((r) => r.json());
      STATE.topology = t;
      renderTopology();
    } catch (_) { STATE.topology = null; renderTopology(); }
  }

  // ---------- records rail (ported from ../web/app.js:48-102) ----------
  const rail = document.getElementById("recordsrail");
  const recordsTop = document.getElementById("recordstopbar");
  const recordsBottom = document.getElementById("recordsbottombar");

  const dotColorFor = (r) => {
    const broken = r.status === "failed" || r.producers_failed > 0;
    if (r.status === "failed") return "#e5484d";
    if (r.status === "paused") return "#3fb9c7";
    if (r.status === "incomplete") return "#e6a23c";
    if (broken) return "#e5484d";
    return "#3fb950";
  };

  async function selectRecord(name) {
    STATE._currentRecord = name;
    STATE.selectedEvent = null;
    const rec = STATE.records.find((r) => r.name === name);
    if (recordsTop) recordsTop.textContent = rec ? rec.name : "no record selected";
    if (recordsBottom) recordsBottom.textContent = rec ? `${rec.status} · ${rec.total_events} events` : "";
    for (const el of rail.querySelectorAll(".rec")) el.classList.toggle("sel", el.dataset.name === name);
    // Sprint 010: fetch the record's events so read tabs can render them
    try {
      const data = await fetch(`/api/records/${encodeURIComponent(name)}`).then((r) => r.json());
      STATE.events = Array.isArray(data?.events) ? data.events : [];
    } catch (_) { STATE.events = []; }
    renderStream();
    renderInspector();
    renderEventTransport();
    renderIO();
    // fetch topology_graph lazily on tab activation, not here — see activate()
    STATE.topology = null;
    renderTopology();
    STATE.runGraph = null;
    renderGraph();
  }

  // ---------- I/O tab (Sprint 011) ----------
  const ioInputEl = document.getElementById("io-input");
  const ioArtifactsEl = document.getElementById("io-artifacts");
  const ARTIFACT_KINDS = new Set([
    "FinalAnswer", "SelectedPatch", "RepairSummary", "Verdict", "Solved", "Exhausted",
    "Synthesis", "CritiquePosted", "BasketVerdict", "Answer", "Result",
  ]);

  function renderIO() {
    if (!ioInputEl || !ioArtifactsEl) return;
    if (!STATE._currentRecord) {
      ioInputEl.innerHTML = `<div class="empty">no record selected</div>`;
      ioArtifactsEl.innerHTML = `<div class="empty">no record selected</div>`;
      return;
    }
    const started = STATE.events.find((e) => e.kind === "substrate.RunStarted");
    if (started && started.payload) {
      const p = started.payload;
      const input = p.resolved_input || p.initial_producers || p;
      ioInputEl.innerHTML = `<pre>${escapeHtml(JSON.stringify(input, null, 2))}</pre>`;
    } else {
      ioInputEl.innerHTML = `<div class="empty">no input recorded</div>`;
    }
    const artifacts = STATE.events.filter((e) => ARTIFACT_KINDS.has(e.kind));
    if (!artifacts.length) {
      ioArtifactsEl.innerHTML = `<div class="empty">no artifacts</div>`;
      return;
    }
    ioArtifactsEl.innerHTML = artifacts.map((ev) =>
      `<div class="io-artifact" data-testid="io-artifact-${ev.seq}">` +
        `<span class="kind">${escapeHtml(ev.kind)}</span><span class="seq">seq ${ev.seq}</span>` +
        `<div class="gist">${escapeHtml(_gist(ev) || "—")}</div>` +
      `</div>`
    ).join("");
  }

  // ---------- Run-as-graph text summary (Sprint 013) ----------
  const graphpaneEl = document.getElementById("graphpane");
  function renderGraph() {
    if (!graphpaneEl) return;
    if (!STATE._currentRecord) { graphpaneEl.innerHTML = `<div class="empty">no record selected</div>`; return; }
    const g = STATE.runGraph;
    if (!g) { graphpaneEl.innerHTML = `<div class="empty">loading…</div>`; return; }
    const inst = Array.isArray(g.instances) ? g.instances : [];
    if (!inst.length) { graphpaneEl.innerHTML = `<div class="empty">no producer instances</div>`; return; }
    graphpaneEl.innerHTML = inst.map((r, i) => {
      const rng = `${r.fired_seq ?? "—"}→${r.started_seq ?? "—"}→${r.ended_seq ?? "—"}`;
      const status = r.status || "queued";
      return `<div class="row" data-testid="graph-row-${i}">` +
        `<span class="idx">${i}</span>` +
        `<span class="k">${escapeHtml(r.kind)}</span>` +
        `<span class="rng">${rng}</span>` +
        `<span class="st ${status}">${escapeHtml(status)}</span>` +
      `</div>`;
    }).join("");
  }

  // ---------- Topology structure (Sprint 012, ported from parent renderTopology at web/app.js:579) ----------
  const topopaneEl = document.getElementById("topopane");
  function renderTopology() {
    if (!topopaneEl) return;
    if (!STATE._currentRecord) { topopaneEl.innerHTML = `<div class="empty">no record selected</div>`; return; }
    const t = STATE.topology;
    if (!t) { topopaneEl.innerHTML = `<div class="empty">loading…</div>`; return; }
    const e = escapeHtml;
    const prod = (t.producers || []).map((p) =>
      `<div class="pr"><span class="k">${e(p.kind)}${p.is_initial ? ' <span class="ini">▸ initial</span>' : ""}</span>` +
      `<span class="em">emits ${(p.emits || []).map(e).join(", ")}</span></div>`).join("");
    const trig = (t.triggers || []).length ? (t.triggers).map((tr) =>
      `<div class="tg"><span class="id">${e(tr.id)}</span> <span class="ar">on</span> <span class="on">${(tr.on || []).map(e).join(", ")}</span>` +
      ` <span class="ar">→ starts</span> <span class="st">${e(tr.starts)}</span> <span class="dim">(${e(tr.policy)})</span></div>`).join("")
      : `<div class="dim">none</div>`;
    const views = (t.views || []).length ? (t.views).map((v) => `<div class="vw"><span class="n">${e(v)}</span></div>`).join("") : `<div class="dim">none</div>`;
    const routes = (t.routes || []).length ? (t.routes).map((r) =>
      `<div class="rt"><span class="id">${e(r.id)}</span> <span class="ar">→ slot</span> <span class="sl">${e(r.slot)}</span></div>`).join("")
      : `<div class="dim">none</div>`;
    const term = (t.termination || []).length ? (t.termination).map((s) => `<div class="tm">${e(s)}</div>`).join("") : `<div class="dim">none</div>`;
    topopaneEl.innerHTML =
      `<div class="grp" data-testid="grp-producers">producers (${(t.producers || []).length})</div>${prod}` +
      `<div class="grp" data-testid="grp-triggers">triggers</div>${trig}` +
      `<div class="grp" data-testid="grp-views">views</div>${views}` +
      `<div class="grp" data-testid="grp-routes">routes</div>${routes}` +
      `<div class="grp" data-testid="grp-termination">termination policy</div>${term}`;
  }

  // ---------- event stream + inspector (Sprint 010) ----------
  const eventStreamEl = document.getElementById("eventstream");
  const inspectorEl = document.getElementById("inspector");
  const eventTransportEl = document.getElementById("eventtransport");

  function _shortKind(k) { return k && k.startsWith("substrate.") ? k.slice(10) : k; }
  function _gist(ev) {
    const p = ev.payload || {};
    const keys = Object.keys(p).slice(0, 2);
    return keys.map((k) => `${k}=${String(p[k]).slice(0, 30)}`).join(" ");
  }

  function renderStream() {
    if (!eventStreamEl) return;
    if (!STATE.events.length) {
      eventStreamEl.innerHTML = `<div class="empty" style="color:var(--muted);padding:14px;font-size:12px;">no events</div>`;
      return;
    }
    eventStreamEl.innerHTML = STATE.events.map((ev) =>
      `<div class="stream-line" data-seq="${ev.seq}" data-testid="stream-line-${ev.seq}">` +
        `<span class="seq">${ev.seq.toString().padStart(4, "0")}</span> · ` +
        `<span class="kind">${escapeHtml(_shortKind(ev.kind))}</span>` +
        (ev.payload ? ` · ${escapeHtml(_gist(ev))}` : "") +
      `</div>`
    ).join("");
  }

  function inspectEvent(seq) {
    const ev = STATE.events.find((e) => e.seq === seq);
    STATE.selectedEvent = ev || null;
    for (const el of eventStreamEl.querySelectorAll(".stream-line")) {
      el.classList.toggle("sel", Number(el.dataset.seq) === seq);
    }
    renderInspector();
  }

  function renderInspector() {
    if (!inspectorEl) return;
    const ev = STATE.selectedEvent;
    if (!ev) {
      inspectorEl.innerHTML = `<div class="empty">click an event on the left</div>`;
      return;
    }
    inspectorEl.innerHTML =
      `<div style="color:var(--active);font-size:11px;margin-bottom:8px;">seq ${ev.seq} · ${escapeHtml(ev.kind)}</div>` +
      `<pre>${escapeHtml(JSON.stringify(ev.payload || {}, null, 2))}</pre>`;
  }

  function renderEventTransport() {
    if (!eventTransportEl) return;
    if (!STATE._currentRecord) {
      eventTransportEl.textContent = "no record selected — pick one in Records";
    } else {
      eventTransportEl.textContent = `${STATE._currentRecord} · ${STATE.events.length} events`;
    }
  }

  if (eventStreamEl) {
    eventStreamEl.addEventListener("click", (ev) => {
      const line = ev.target.closest(".stream-line");
      if (!line) return;
      inspectEvent(Number(line.dataset.seq));
    });
  }

  async function loadRecords() {
    if (!rail) return;
    try {
      const recs = await fetch("/api/records").then((r) => r.json());
      STATE.records = Array.isArray(recs) ? recs : [];
      const runs = STATE.records.filter((r) => r.source === "run").sort((a, b) => (b.run_id || "").localeCompare(a.run_id || ""));
      const demos = STATE.records.filter((r) => r.source !== "run");
      rail.innerHTML = "";
      const mkRec = (r) => {
        const meta = r.status === "failed" ? `FAILED · ${r.final_reason || ""}`
          : r.status === "paused" ? `paused · awaiting ${r.paused_on || "input"}`
          : (r.producers_failed > 0) ? `${r.producers_failed} failures · finalised`
          : `${r.status} · ${r.total_events} events`;
        const div = document.createElement("div");
        div.className = "rec";
        div.dataset.name = r.name;
        div.dataset.testid = "rec-" + r.name;
        div.innerHTML =
          `<span class="dot" style="background:${dotColorFor(r)}"></span>` +
          `<div><div class="nm">${escapeHtml(r.name)}</div><div class="meta">${escapeHtml(meta)}</div></div>`;
        div.addEventListener("click", () => selectRecord(r.name));
        return div;
      };
      const addGroup = (label) => {
        const h = document.createElement("div");
        h.className = "rail-group";
        h.textContent = label;
        rail.appendChild(h);
      };
      if (runs.length) { addGroup(`your runs · ${runs.length}`); runs.forEach((r) => rail.appendChild(mkRec(r))); }
      if (demos.length) { addGroup("demos"); demos.forEach((r) => rail.appendChild(mkRec(r))); }
      STATE.recordsLoaded = true;
    } catch (e) {
      rail.innerHTML = `<div class="placeholder">records failed to load</div>`;
    }
  }

  tabbar.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".tab");
    if (!btn || !btn.dataset.testid) return;
    activate(btn.dataset.testid);
  });
})();
