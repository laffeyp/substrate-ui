/* substrate studio — author a Topology from structured form input, validate + build it through the
   REAL seam (/api/validate static TopologyBuilder.build(); /api/build runs a real api.Runtime). The
   spec shape mirrors builder.py EXACTLY. Reads substrate.api only (over HTTP). The eight words only. */
"use strict";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------- row templates (class names are read back by buildSpec) ----------
const PRODUCER_ROW = `<div class="row">
  <input class="pkind k" placeholder="kind (e.g. reviewer)" />
  <span class="lbl">emits</span><input class="pemits med" placeholder="KindA, KindB" />
  <label class="lbl"><input type="checkbox" class="pinit" /> initial</label>
  <span class="rm" title="remove">✕</span></div>`;
const VIEW_ROW = `<div class="row">
  <input class="vname med" placeholder="name" />
  <select class="vkind"><option>KindCount</option><option>KindBuffer</option><option>PerKindLatest</option></select>
  <span class="lbl">of</span><input class="vof med" placeholder="Kind" />
  <span class="rm" title="remove">✕</span></div>`;
const TRIGGER_ROW = `<div class="row">
  <input class="tid med" placeholder="id" />
  <span class="lbl">on</span><input class="ton med" placeholder="Kind" />
  <span class="lbl">when</span><input class="tview med" placeholder="view (blank = always)" />
  <select class="top"><option value=">=">&ge;</option><option value=">">&gt;</option><option value="==">==</option><option value="<=">&le;</option><option value="<">&lt;</option></select>
  <input class="tn sm" placeholder="n" />
  <span class="lbl">starts</span><input class="tstarts med" placeholder="kind" />
  <select class="tpolicy"><option>Once</option><option>PerEvent</option><option>PerKey</option><option>WhileTrue</option></select>
  <span class="rm" title="remove">✕</span></div>`;

const ROUTE_ROW = `<div class="row">
  <input class="rid med" placeholder="id" />
  <span class="lbl">of</span><input class="rof med" placeholder="Kind" />
  <span class="lbl">→ slot</span><input class="rslot med" placeholder="slot" />
  <span class="rm" title="remove">✕</span></div>`;
const MEMBER_ROW = `<div class="row member">
  <select class="mkind"><option>all_completed</option><option>quiescence_with_watchdog</option><option>threshold_count</option><option>cancel_all_others</option></select>
  <span class="mparams"></span>
  <span class="rm" title="remove">✕</span></div>`;

function addRow(containerId, html, fill) {
  const wrap = document.createElement("div");
  wrap.innerHTML = html.trim();
  const row = wrap.firstChild;
  $(containerId).appendChild(row);
  if (fill) fill(row);
  return row;
}

// ---------- assemble the authored spec (matches builder.py) ----------
function buildSpec() {
  const producers = [...$("producers").querySelectorAll(".row")].map((r) => ({
    kind: r.querySelector(".pkind").value.trim(),
    emits: r.querySelector(".pemits").value.split(",").map((s) => s.trim()).filter(Boolean),
    initial: r.querySelector(".pinit").checked,
  })).filter((p) => p.kind);
  const views = [...$("views").querySelectorAll(".row")].map((r) => ({
    name: r.querySelector(".vname").value.trim(),
    kind: r.querySelector(".vkind").value,
    of: r.querySelector(".vof").value.trim(),
  })).filter((v) => v.name && v.of);
  const triggers = [...$("triggers").querySelectorAll(".row")].map((r) => {
    const view = r.querySelector(".tview").value.trim();
    const predicate = view ? { view, op: r.querySelector(".top").value, n: Number(r.querySelector(".tn").value) || 0 } : null;
    return {
      id: r.querySelector(".tid").value.trim(), on: r.querySelector(".ton").value.trim(),
      predicate, starts: r.querySelector(".tstarts").value.trim(), policy: r.querySelector(".tpolicy").value,
    };
  }).filter((t) => t.id && t.on && t.starts);
  const routes = [...$("routes").querySelectorAll(".row")].map((r) => ({
    id: r.querySelector(".rid").value.trim(), of: r.querySelector(".rof").value.trim(), slot: r.querySelector(".rslot").value.trim(),
  })).filter((r) => r.id && r.of && r.slot);
  return { name: $("topoName").value.trim() || "authored", producers, views, triggers, routes, termination: buildTermination() };
}

function buildMember(row) {
  const k = row.querySelector(".mkind").value;
  if (k === "quiescence_with_watchdog") return { kind: k, seconds: Number((row.querySelector(".mseconds") || {}).value) || 1 };
  if (k === "threshold_count") return { kind: k, of: (row.querySelector(".mof") || {}).value || "", n: Number((row.querySelector(".mn") || {}).value) || 1 };
  return { kind: k };
}

function buildTermination() {
  const k = $("termKind").value;
  if (k === "all_completed") return { kind: "all_completed" };
  if (k === "cancel_all_others") return { kind: "cancel_all_others" };
  if (k === "threshold_count") return { kind: "threshold_count", of: ($("termOf") || {}).value || "", n: Number(($("termN") || {}).value) || 1 };
  if (k === "any_of" || k === "all_of") {
    const members = [...$("termMembers").querySelectorAll(".member")].map(buildMember);
    return { kind: k, members: members.length ? members : [{ kind: "all_completed" }, { kind: "quiescence_with_watchdog", seconds: 1 }] };
  }
  return { kind: "quiescence_with_watchdog", seconds: Number(($("termSeconds") || {}).value) || 1 };
}

function renderMemberParams(row) {
  const k = row.querySelector(".mkind").value, el = row.querySelector(".mparams");
  if (k === "quiescence_with_watchdog") el.innerHTML = `<span class="lbl">seconds</span><input class="sm mseconds" value="1" />`;
  else if (k === "threshold_count") el.innerHTML = `<span class="lbl">of</span><input class="med mof" placeholder="Kind" /><span class="lbl">n</span><input class="sm mn" value="1" />`;
  else el.innerHTML = "";
}
function addMember(kind) {
  const row = addRow("termMembers", MEMBER_ROW);
  if (kind) row.querySelector(".mkind").value = kind;
  renderMemberParams(row);
  return row;
}

function renderTermParams() {
  const k = $("termKind").value, composite = (k === "any_of" || k === "all_of");
  if (k === "quiescence_with_watchdog") $("termParams").innerHTML = `<span class="lbl">seconds</span><input class="sm" id="termSeconds" value="1" />`;
  else if (k === "threshold_count") $("termParams").innerHTML = `<span class="lbl">of</span><input class="med" id="termOf" placeholder="Kind" /><span class="lbl">n</span><input class="sm" id="termN" value="1" />`;
  else if (composite) $("termParams").innerHTML = `<span class="add" id="addMember">+ member</span>`;
  else $("termParams").innerHTML = "";
  if (composite) {
    $("addMember").onclick = () => addMember();
    if (!$("termMembers").children.length) { addMember("all_completed"); addMember("quiescence_with_watchdog"); }
  } else {
    $("termMembers").innerHTML = "";
  }
}

// ---------- the real seam ----------
async function postJSON(path, body) {
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const text = await r.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
  if (!r.ok && !data.error) data.error = text || ("HTTP " + r.status);
  return data;
}
const out = (html) => { $("out").innerHTML = `<span class="l">output</span>${html}`; };

async function doValidate() {
  const r = await postJSON("/api/validate", buildSpec());
  if (r.valid) out(`<span class="ok">● valid</span> <span class="dim">— builds through the real TopologyBuilder.</span>`);
  else out(`<span class="err">● invalid</span> <span class="dim">${esc(r.error || "")}</span>`);
}

async function doBuild() {
  const spec = buildSpec();
  const v = await postJSON("/api/validate", spec);
  if (!v.valid) { out(`<span class="err">● invalid — fix before building</span> <span class="dim">${esc(v.error || "")}</span>`); return; }
  out(`<span class="dim">building &amp; launching…</span>`);
  const r = await postJSON("/api/build", spec);
  if (r.error) { out(`<span class="err">● build rejected</span> <span class="dim">${esc(r.error)}</span>`); return; }
  const unfired = r.unfired_triggers && r.unfired_triggers.length
    ? `<div class="warn">⚠ Trigger(s) that never fired (Predicate unreachable with the deterministic stub): ${esc(r.unfired_triggers.join(", "))}</div>` : "";
  out(`<div><span class="ok">● built · ${esc(r.status)}</span> <span class="l">record</span>${esc(r.name)}</div>${unfired}
    <div style="margin-top:8px"><a class="consolelink" href="/?record=${encodeURIComponent(r.name)}">view the run in the console →</a></div>`);
}

// ---------- drag-canvas: a node-graph VIEW of the authored spec (buildSpec) ----------
const CARD_W = 130, CARD_H = 48;
let CANVAS_POS = {};  // kind -> {x,y}; persists across re-renders + drags
const MARKER = `<defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#5e6573"/></marker></defs>`;

function layoutCanvas(spec, W) {
  const initials = spec.producers.filter((p) => p.initial), others = spec.producers.filter((p) => !p.initial);
  const place = (list, y) => list.forEach((p, i) => {
    if (!CANVAS_POS[p.kind]) {
      const gap = Math.min(195, Math.max(150, (W - 60) / Math.max(1, list.length)));
      CANVAS_POS[p.kind] = { x: 24 + i * gap, y };
    }
  });
  place(initials, 36); place(others, 250);
  const kinds = new Set(spec.producers.map((p) => p.kind));
  Object.keys(CANVAS_POS).forEach((k) => { if (!kinds.has(k)) delete CANVAS_POS[k]; });
}

function renderCanvas() {
  const spec = buildSpec(), canvas = $("canvas"), W = canvas.clientWidth || 820;
  layoutCanvas(spec, W);
  const bottom = (k) => ({ x: CANVAS_POS[k].x + CARD_W / 2, y: CANVAS_POS[k].y + CARD_H });
  const top = (k) => ({ x: CANVAS_POS[k].x + CARD_W / 2, y: CANVAS_POS[k].y });
  const emittersOf = (kind) => spec.producers.filter((p) => p.emits.includes(kind)).map((p) => p.kind);
  const edge = (a, b, cls) => `<path class="edge ${cls}" d="M${a.x},${a.y} C${a.x},${(a.y + b.y) / 2} ${b.x},${(a.y + b.y) / 2} ${b.x},${b.y}" marker-end="url(#arrow)" />`;
  const label = (a, b, t, cls) => `<text class="edge-lbl ${cls}" x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2}" text-anchor="middle">${esc(t)}</text>`;
  let edges = "";
  spec.triggers.forEach((t) => { if (CANVAS_POS[t.starts]) emittersOf(t.on).forEach((src) => { if (CANVAS_POS[src] && src !== t.starts) { edges += edge(bottom(src), top(t.starts), "") + label(bottom(src), top(t.starts), t.id, ""); } }); });
  spec.routes.forEach((r) => { const dsts = [...new Set(spec.triggers.map((t) => t.starts))]; emittersOf(r.of).forEach((src) => dsts.forEach((dst) => { if (CANVAS_POS[src] && CANVAS_POS[dst] && src !== dst) edges += edge(bottom(src), top(dst), "route") + label(bottom(src), top(dst), r.slot, "route"); })); });
  const cards = spec.producers.map((p) => {
    const pp = CANVAS_POS[p.kind];
    return `<div class="card ${p.initial ? "initial" : ""}" data-kind="${esc(p.kind)}" style="left:${pp.x}px;top:${pp.y}px">
      <div class="ck">${esc(p.kind)}</div><div class="ce">emits ${p.emits.map(esc).join(", ") || "—"}</div>${p.initial ? '<div class="cb">▸ initial</div>' : ""}</div>`;
  }).join("");
  canvas.innerHTML = `<svg>${MARKER}${edges}</svg>${cards}`;
  canvas.querySelectorAll(".card").forEach((card) => { card.onmousedown = (e) => startDrag(e, card.dataset.kind); });
}

function startDrag(e, kind) {
  e.preventDefault();
  const sx = e.clientX, sy = e.clientY, orig = { ...CANVAS_POS[kind] };
  const move = (ev) => { CANVAS_POS[kind] = { x: Math.max(0, orig.x + ev.clientX - sx), y: Math.max(0, orig.y + ev.clientY - sy) }; renderCanvas(); };
  const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
  document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
}

function setView(v) {
  $("vForm").classList.toggle("active", v === "form");
  $("vCanvas").classList.toggle("active", v === "canvas");
  $("formView").style.display = v === "form" ? "" : "none";
  $("canvasView").style.display = v === "canvas" ? "" : "none";
  if (v === "canvas") renderCanvas();
}

// ---------- wire ----------
$("addProducer").onclick = () => addRow("producers", PRODUCER_ROW);
$("addView").onclick = () => addRow("views", VIEW_ROW);
$("addTrigger").onclick = () => addRow("triggers", TRIGGER_ROW);
$("addRoute").onclick = () => addRow("routes", ROUTE_ROW);
document.body.addEventListener("click", (e) => { if (e.target.classList.contains("rm")) e.target.closest(".row").remove(); });
document.body.addEventListener("change", (e) => { if (e.target.classList.contains("mkind")) renderMemberParams(e.target.closest(".row")); });
$("termKind").onchange = renderTermParams;
$("validateBtn").onclick = doValidate;
$("buildBtn").onclick = doBuild;
$("vForm").onclick = () => setView("form");
$("vCanvas").onclick = () => setView("canvas");

// ---------- pre-fill the known-good reviewer/judge example (immediately buildable) ----------
renderTermParams();
addRow("producers", PRODUCER_ROW, (r) => { r.querySelector(".pkind").value = "reviewer-a"; r.querySelector(".pemits").value = "Critique"; r.querySelector(".pinit").checked = true; });
addRow("producers", PRODUCER_ROW, (r) => { r.querySelector(".pkind").value = "reviewer-b"; r.querySelector(".pemits").value = "Critique"; r.querySelector(".pinit").checked = true; });
addRow("producers", PRODUCER_ROW, (r) => { r.querySelector(".pkind").value = "judge"; r.querySelector(".pemits").value = "Verdict"; });
addRow("views", VIEW_ROW, (r) => { r.querySelector(".vname").value = "crits"; r.querySelector(".vkind").value = "KindCount"; r.querySelector(".vof").value = "Critique"; });
addRow("triggers", TRIGGER_ROW, (r) => {
  r.querySelector(".tid").value = "adjudicate"; r.querySelector(".ton").value = "Critique";
  r.querySelector(".tview").value = "crits"; r.querySelector(".top").value = ">="; r.querySelector(".tn").value = "2";
  r.querySelector(".tstarts").value = "judge"; r.querySelector(".tpolicy").value = "Once";
});
$("termKind").value = "any_of"; renderTermParams();
