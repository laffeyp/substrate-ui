// terminal.ts — the daily-driver terminal column mounted inside #view-terminal.
// Sprint 035 promoted the terminal from its bottom-dock legacy shape (which
// sprint 037c retired outright — the dock DOM and its eleven vocab tags are
// gone) to a full column that talks to the piece-B session endpoints:
//
//   POST /api/session               — open a session (deterministic driver)
//   POST /api/session/<id>/turn     — send one turn's user text
//   POST /api/session/<id>/end      — end the session cleanly
//   GET  /api/session/<id>/events   — Server-Sent Events over the record
//
// Four driver-session tags fire at real code paths:
//   DRIVER_SESSION_STARTED   on session open
//   USER_MESSAGE_INJECTED    on Enter
//   PARK_LANDED              on a Park envelope from the SSE stream
//   DRIVER_SESSION_ENDED     on /exit (or SessionEnded envelope from server)
//
// TRANSCRIPT_COMPACTED_LANDED and DRIVER_SESSION_WARNING_EMITTED are
// ambient — they fire when the record carries the corresponding envelope,
// but a small fixture may not exercise them.

import { emit } from "./instrumentation/sdd";

// Envelope shapes we consume from the SSE stream. The substrate side defines
// them in substrate/src/substrate/topologies/session/__init__.py; we mirror
// only the fields we read. Any envelope not listed here is rendered as a
// short label.
interface RecordEnvelope {
  seq: number;
  kind: string;
  payload: Record<string, unknown>;
  t?: number;
}

// Sprint 035x — TerminalHandle, PendingContext, CLS, HELP_TEXT extracted
// to web/terminal/types.ts so slash handlers under web/terminal/slash/
// can depend on the shared interface without pulling in the whole
// session machinery. push + formatParamsHint moved to helpers.ts.
// The 306-line chain-of-`if` _slashRoute became a 3-line delegate to
// route() (one class per slash under web/terminal/slash/{name}.ts).
import type { TerminalHandle, PendingContext } from "./terminal/types";
import { CLS } from "./terminal/types";
import { push as _push, formatParamsHint as _formatParamsHint } from "./terminal/helpers";
import { route as _slashRouteImpl } from "./terminal/slash";

function _mkChildren(root: HTMLElement): {
  body: HTMLDivElement;
  input: HTMLInputElement;
  prompt: HTMLSpanElement;
  header: HTMLDivElement;
  driverSelect: HTMLSelectElement | null;
  paramsHint: HTMLSpanElement;
} {
  root.innerHTML = "";
  root.classList.add("terminal-column");
  const header = document.createElement("div");
  header.id = "terminal-header";
  header.className = "term-head";
  const title = document.createElement("span");
  title.className = "term-title";
  title.textContent = "▌ substrate — daily-driver terminal";
  header.appendChild(title);
  // Sprint 041: the session-control chrome lives here now. Five mount
  // points app.ts's mountX(root) calls populate: driver + bundle +
  // workspace-shape badge + tools drawer + new-session button. The
  // desktop view (record browser) no longer carries session controls —
  // session controls belong with the session, and the session lives in
  // the terminal (Architect ratification 2026-08-29). Sprint 035t's
  // inline driver picker retired: 036a's mountDriverPicker on the same
  // #driver-picker span replaces it.
  const controls = document.createElement("span");
  controls.className = "term-controls";
  controls.style.marginLeft = "16px";
  controls.style.display = "flex";
  controls.style.alignItems = "center";
  controls.style.gap = "10px";
  controls.style.flexWrap = "wrap";
  // Bundle picker deliberately omitted: the terminal session's bundle is
  // `session` by contract (the daily-driver's own methodology + role +
  // per_turn slots). Bundle SELECTION is a launcher concern (choosing an
  // application to run), not a session concern.
  for (const id of ["new-session-trigger", "driver-picker", "workspace-shape-badge-mount", "tools-drawer"]) {
    const span = document.createElement("span");
    span.id = id;
    controls.appendChild(span);
  }
  header.appendChild(controls);
  // Sprint 035v: params hint. Renders `think off · tokens ∞ · timeout 300s`.
  // Updates on session-open (read from POST /api/session ACK's driver_params
  // echo) and on /set slash PATCH ACK.
  const paramsHint = document.createElement("span");
  paramsHint.id = "terminal-params";
  paramsHint.className = "term-hint";
  paramsHint.style.marginLeft = "12px";
  paramsHint.title = "call parameters — set with /set think on|off · /set tokens N (0 = uncapped) · /set timeout N (seconds)";
  paramsHint.textContent = "think off · tokens ∞ · timeout 300s";
  header.appendChild(paramsHint);
  const hint = document.createElement("span");
  hint.id = "terminal-hint";
  hint.className = "term-hint";
  hint.style.marginLeft = "auto";
  hint.innerHTML = "type to talk · <b>/exit</b> to leave · <b>/help</b>";
  header.appendChild(hint);
  root.appendChild(header);

  const body = document.createElement("div");
  body.id = "terminal-body";
  body.className = "term-body";
  root.appendChild(body);

  const inputRow = document.createElement("div");
  inputRow.className = "term-input-row";
  const prompt = document.createElement("span");
  prompt.id = "terminal-prompt";
  prompt.className = "term-prompt";
  prompt.textContent = "substrate$";
  const input = document.createElement("input");
  input.id = "terminal-input";
  input.className = "term-input";
  input.spellcheck = false;
  input.autocomplete = "off";
  input.placeholder = "type to talk to the model — /exit to leave";
  inputRow.appendChild(prompt);
  inputRow.appendChild(input);
  root.appendChild(inputRow);

  return { body, input, prompt, header, driverSelect: null, paramsHint };
}

// _formatParamsHint moved to web/terminal/helpers.ts (sprint 035x).
// The local `_formatParamsHint` name still resolves via the import at
// the top of the file, so every call site (mountTerminal +
// updateParamsHint) stays unchanged.

async function _populateDriverPicker(select: HTMLSelectElement, h: TerminalHandle): Promise<void> {
  // Fetch the driver list once at mount. Populate the select; if
  // `h.driverName` matches an option, mark it selected; else fall back
  // to the API's `default` field. Sprint 035t.
  const result = await _fetchGet<{ models?: string[]; cli?: string[]; default?: string }>("/api/models");
  if (!result.ok) {
    // Populate with the caller's default only — the picker still works
    // for that one driver. Print a dim hint into the terminal body.
    const opt = document.createElement("option");
    opt.value = h.driverName; opt.textContent = h.driverName;
    select.appendChild(opt);
    return;
  }
  const models = result.data.models || [];
  const cli = result.data.cli || [];
  const all = [...models, ...cli, "deterministic"];
  // De-duplicate while preserving order (deterministic always last so it's
  // not the visual default for a live-model workflow).
  const seen = new Set<string>();
  const unique = all.filter((m) => (seen.has(m) ? false : (seen.add(m), true)));
  for (const model of unique) {
    const opt = document.createElement("option");
    opt.value = model; opt.textContent = model;
    select.appendChild(opt);
  }
  // Pick the initial value: caller's opts.driverDefault if it exists in
  // the list; else the API default; else the first entry.
  const apiDefault = result.data.default;
  let initial = h.driverName;
  if (!unique.includes(initial)) initial = apiDefault && unique.includes(apiDefault) ? apiDefault : unique[0];
  select.value = initial;
  h.driverName = initial;
}

// _push moved to web/terminal/helpers.ts (sprint 035x); imported at top.

// Sprint 036a: FetchResult + the three helpers extracted to web/lib/fetch.ts
// so the desktop-view controls share the wire (SPEC-3 from
// REVIEW-2026-08-28-piece-g-eod). Local aliases keep call sites unchanged.
import { postJson as _postJson, fetchJson as _fetch, fetchGet as _fetchGet, type FetchResult } from "./lib/fetch";

async function _openSession(h: TerminalHandle, body: HTMLDivElement): Promise<boolean> {
  // Sprint 041: seed the create body's driver from the mounted
  // #driver-picker-select (036a) if the picker is visibly bound to a
  // session. Pre-first-session the picker is hidden AND its select's
  // first option is "deterministic" (driver_picker.ts:52), so reading
  // `.value` there would seed deterministic every time and bypass the
  // server's real default. Sprint 044 (piece G): pre-session, resolve
  // via `/api/models` default (the verified agentic cloud model).
  // h.driverName (caller's driverDefault, or the current session's
  // driver once one is open) always wins when set.
  const pickerSelect = document.getElementById("driver-picker-select") as HTMLSelectElement | null;
  const pickerBound = pickerSelect
    && pickerSelect.parentElement
    && (pickerSelect.parentElement as HTMLElement).offsetParent !== null;
  let seededDriver = h.driverName || (pickerBound ? pickerSelect?.value : "") || "";
  if (!seededDriver) {
    const modelsResult = await _fetchGet<{ default?: string }>("/api/models");
    seededDriver = (modelsResult.ok && modelsResult.data.default) || "deterministic";
  }
  h.driverName = seededDriver;
  const createBody: Record<string, unknown> = { driver: seededDriver };
  // Sprint 035v: if the user ran `/set` before opening a session, the
  // queued driver_params ride the create request. Cleared after — the
  // manifest carries them from here.
  if (h.pendingDriverParams) {
    createBody.driver_params = h.pendingDriverParams;
    h.pendingDriverParams = null;
  }
  // Sprint 035w: queued create-time controls (/bundle, /tools,
  // /workspace, /isolate, /name) thread into the POST body.
  const pending = h.pendingCreate;
  if (pending.bundle !== undefined) createBody.bundle = pending.bundle;
  if (pending.tools !== undefined) createBody.tools = pending.tools;
  if (pending.workspace !== undefined) createBody.workspace = pending.workspace;
  if (pending.workspace_shape !== undefined) createBody.workspace_shape = pending.workspace_shape;
  if (pending.isolate !== undefined) createBody.isolate = pending.isolate;
  if (pending.name !== undefined) createBody.name = pending.name;
  h.pendingCreate = {};
  const result = await _postJson<{
    session_id: string;
    name?: string | null;
    bundle?: string | null;
    workspace?: string | null;
    workspace_shape?: string | null;
    driver_params?: Record<string, unknown> | null;
  }>("/api/session", createBody);
  if (!result.ok) {
    _push(body, `session: open failed [${result.failure_class}] ${result.detail}`, CLS.err);
    return false;
  }
  const res = result.data;
  if (!res.session_id) {
    _push(body, "session: open returned no session_id", CLS.err);
    return false;
  }
  h.sessionId = String(res.session_id);
  // Sprint 035v: adopt the daemon's driver_params echo (POST /api/session
  // returns the manifest slice; sprint 032c added `driver_params` to it).
  h.driverParams = res.driver_params ?? null;
  h.updateParamsHint();
  // Sprint 035w: fire the four v0.7 session-control tags on ACK, one per
  // queued create-time field. BUNDLE_ATTACHED (bundle attached at create;
  // prior_bundle null); WORKSPACE_SELECTED (workspace + workspace_shape);
  // TOOLS_RESTRICTED (tool suite pinned); ISOLATE_TOGGLED (isolate on).
  // Each only fires when the user set the corresponding field.
  const bundleEchoed = res.bundle ?? undefined;
  if (bundleEchoed) {
    h.bundleSlug = String(bundleEchoed);
    emit("BUNDLE_ATTACHED", { session_id: h.sessionId, bundle: String(bundleEchoed), prior_bundle: null });
  }
  if (res.workspace && res.workspace_shape) {
    emit("WORKSPACE_SELECTED", { session_id: h.sessionId, workspace: String(res.workspace), workspace_shape: String(res.workspace_shape) });
  }
  if (pending.tools !== undefined) {
    emit("TOOLS_RESTRICTED", { session_id: h.sessionId, tools: pending.tools });
  }
  if (pending.isolate === true) {
    emit("ISOLATE_TOGGLED", { session_id: h.sessionId, isolate: true });
  }
  // Sprint 035s: remember the record basename so read-slashes (/inspect,
  // /narrate, /tail, /cat, /diff) default to "the current session's record"
  // when called without an arg. The daemon returns the record path;
  // basename is the session_id (records live under sessions/<sid>/record).
  h.currentRecord = h.sessionId;
  // DRIVER_SESSION_STARTED fires from the SSE handler on the `SessionStarted`
  // envelope (substrate sprint 240 wires the RunStarted→SessionStarted
  // instrument on the session topology). The daemon-ack here only tells the
  // UI the session_id + record path; the record's own SessionStarted carries
  // the canonical fields (driver_context_tokens, bundle, workspace_shape,
  // parent_session_id).
  _push(body, `session ${h.sessionId} opening…`, CLS.dim);
  h.updatePrompt();
  _openStream(h, body);
  return true;
}

function _openStream(h: TerminalHandle, body: HTMLDivElement): void {
  if (!h.sessionId) return;
  const url = `/api/session/${encodeURIComponent(h.sessionId)}/events?since_seq=-1`;
  const es = new EventSource(url);
  h.eventSource = es;
  es.onmessage = (ev) => {
    let env: RecordEnvelope;
    try { env = JSON.parse(ev.data) as RecordEnvelope; }
    catch { return; }
    if (typeof env.seq === "number" && env.seq > h.lastSeq) h.lastSeq = env.seq;
    _handleEnvelope(h, body, env);
  };
  es.onerror = () => {
    // The daemon closes the stream on RunFinalised; the browser treats that
    // as an error. Distinguish a graceful close (readyState CLOSED) from a
    // network error (retry-able).
    if (es.readyState === EventSource.CLOSED) {
      h.eventSource = null;
    }
  };
}

function _handleEnvelope(h: TerminalHandle, body: HTMLDivElement, env: RecordEnvelope): void {
  const kind = env.kind;
  const payload = env.payload || {};
  if (kind === "SessionStarted" && h.sessionId) {
    // Sprint 240 (substrate side) + SUB-1 (this side): the canonical
    // session-started signal lives on the record. UI fires
    // DRIVER_SESSION_STARTED here so the payload carries the fields only
    // the substrate side knows at boot (driver_context_tokens, bundle,
    // workspace_shape via SessionStarted's own schema).
    const driverName = String(payload.driver_model ?? h.driverName);
    const driverContextTokens = Number(payload.driver_context_tokens ?? 0);
    const bundleSlug = payload.bundle == null ? "" : String(payload.bundle);
    const parentSessionId = payload.parent_session_id == null ? null : String(payload.parent_session_id);
    h.driverName = driverName;
    h.bundleSlug = bundleSlug;
    emit("DRIVER_SESSION_STARTED", {
      session_id: h.sessionId,
      driver_name: driverName,
      driver_context_tokens: driverContextTokens,
      bundle_slug: bundleSlug,
      ...(parentSessionId ? { parent_session_id: parentSessionId } : {}),
    });
    window.dispatchEvent(new CustomEvent("substrate:session-changed", { detail: { session_id: h.sessionId } }));
    _push(body, `session ${h.sessionId} started · driver ${driverName}`, CLS.dim);
    h.updatePrompt();
    return;
  }
  if (kind === "UserMessage") {
    const text = String(payload.text ?? "");
    _push(body, `> ${text}`, CLS.in);
    return;
  }
  if (kind === "ModelReply") {
    const text = String(payload.text ?? "");
    _push(body, text, CLS.accent);
    return;
  }
  if (kind === "Park" && h.sessionId) {
    const reason = String(payload.reason ?? "");
    const turnIndex = Number(payload.turn_index ?? h.turnIndex);
    emit("PARK_LANDED", { session_id: h.sessionId, turn_index: turnIndex, reason });
    _push(body, `· parked (${reason}) — your turn`, CLS.dim);
    return;
  }
  if (kind === "SessionEnded") {
    const reason = String(payload.reason ?? "server_end");
    const totalTurns = Number(payload.total_turns ?? 0);
    // The /exit path may have already emitted for this session_id (fires
    // synchronously on POST /end success). Guard against double-fire.
    if (h.sessionId && h.endedEmittedFor !== h.sessionId) {
      emit("DRIVER_SESSION_ENDED", {
        session_id: h.sessionId,
        reason,
        turns_completed: totalTurns,
      });
      h.endedEmittedFor = h.sessionId;
    }
    window.dispatchEvent(new CustomEvent("substrate:session-changed", { detail: { session_id: h.sessionId } }));
    _push(body, `session ended (${reason}, ${totalTurns} turns)`, CLS.dim);
    _closeStream(h);
    return;
  }
  if (kind === "TranscriptCompacted" && h.sessionId) {
    const droppedStart = Number(payload.dropped_seq_start ?? 0);
    const droppedEnd = Number(payload.dropped_seq_end ?? 0);
    const keptStart = Number(payload.kept_seq_start ?? 0);
    emit("TRANSCRIPT_COMPACTED_LANDED", {
      session_id: h.sessionId,
      dropped_seq_start: droppedStart,
      dropped_seq_end: droppedEnd,
      kept_seq_start: keptStart,
    });
    return;
  }
  if (kind === "SessionWarning" && h.sessionId) {
    const conditionKind = String(payload.condition_kind ?? "unknown");
    const seedTokens = payload.seed_tokens;
    const driverTokens = payload.driver_context_tokens;
    emit("DRIVER_SESSION_WARNING_EMITTED", {
      session_id: h.sessionId,
      condition_kind: conditionKind,
      ...(typeof seedTokens === "number" ? { seed_tokens: seedTokens } : {}),
      ...(typeof driverTokens === "number" ? { driver_context_tokens: driverTokens } : {}),
    });
    _push(body, `warning: ${conditionKind}`, CLS.err);
    return;
  }
}

function _closeStream(h: TerminalHandle): void {
  if (h.eventSource) {
    h.eventSource.close();
    h.eventSource = null;
  }
  h.sessionId = null;
  h.turnIndex = 0;
  h.driverParams = null;
  h.updatePrompt();
  h.updateParamsHint();
}

async function _sendTurn(h: TerminalHandle, body: HTMLDivElement, text: string): Promise<void> {
  if (!h.sessionId) {
    const opened = await _openSession(h, body);
    if (!opened) return;
  }
  const turnIndex = h.turnIndex;
  emit("USER_MESSAGE_INJECTED", {
    session_id: h.sessionId ?? "",
    turn_index: turnIndex,
    text_length: text.length,
  });
  h.turnIndex += 1;
  // Sprint 035s: if a /context slash stashed a pending slice, thread it
  // into the POST body's `context` field per piece B sprint 217e. Clear
  // after — /context is single-use, matching the CLI's semantics.
  const bodyForPost: Record<string, unknown> = { text };
  if (h.pendingContext) {
    bodyForPost.context = { parent_seq_range: h.pendingContext.parent_seq_range, kinds: h.pendingContext.kinds };
    h.pendingContext = null;
  }
  const result = await _postJson(`/api/session/${encodeURIComponent(h.sessionId ?? "")}/turn`, bodyForPost);
  if (!result.ok) {
    _push(body, `turn failed [${result.failure_class}] ${result.detail}`, CLS.err);
  }
}

async function _endSession(h: TerminalHandle, body: HTMLDivElement, reason: string): Promise<void> {
  if (!h.sessionId) {
    _push(body, "(no active session)", CLS.dim);
    return;
  }
  const sid = h.sessionId;
  const result = await _postJson<{ status: string }>(`/api/session/${encodeURIComponent(sid)}/end`, { source: reason });
  // Fire DRIVER_SESSION_ENDED synchronously on daemon acknowledgment. The
  // SSE stream will also deliver a SessionEnded envelope moments later; the
  // handler guards on endedEmittedFor to avoid double-fire.
  if (result.ok && result.data.status === "ended") {
    emit("DRIVER_SESSION_ENDED", { session_id: sid, reason });
    h.endedEmittedFor = sid;
    window.dispatchEvent(new CustomEvent("substrate:session-changed", { detail: { session_id: h.sessionId } }));
    _push(body, `session ended (${reason})`, CLS.dim);
    // Sprint 035v: close the stream synchronously so the params hint,
    // prompt, and other per-session UI reset immediately — not
    // whenever SSE delivers SessionEnded moments later. The endedEmittedFor
    // guard set above prevents the SSE handler from re-emitting.
    _closeStream(h);
  } else if (result.ok) {
    _push(body, `end: unexpected status ${result.data.status}`, CLS.err);
  } else {
    _push(body, `end failed [${result.failure_class}] ${result.detail}`, CLS.err);
  }
}

// ── slash router (sprint 035s) ────────────────────────────────────────────
// Ports substrate/src/substrate/cli.py::_slash_route (line 1053) into the
// browser terminal. Every slash the CLI ships gets a JS handler that hits
// the same daemon endpoint. Product spec §2a lists the nine required
// slashes: /exit /model /tools /context /inspect /list /replay /run /help.
// Feature-map adds /narrate /tail /cat /diff /studio /bundle /interrupt.
//
// Return value:
//   true  → the line was a slash the router handled; caller skips /turn.
//   false → the line was not a slash; caller treats it as user text.
//
// Every handler that mutates session state emits the paired v0.7 signal
// on ACK (DRIVER_PATCHED / TOOLS_RESTRICTED / BUNDLE_ATTACHED). Read
// slashes print result lines only.

// Sprint 035x — thin delegate to the extracted slash router. Every
// slash's implementation lives under web/terminal/slash/{name}.ts as
// its own SlashCommand; ./terminal/slash/index.ts assembles them.
async function _slashRoute(h: TerminalHandle, body: HTMLDivElement, line: string): Promise<boolean> {
  return _slashRouteImpl(line, { h, body });
}

// _fetch + _fetchGet retired from terminal.ts (sprint 036a); the imports at
// the top of this file provide them via ./lib/fetch.

export interface MountTerminalOptions {
  driverDefault?: string;
}

export function mountTerminal(root: HTMLElement, opts: MountTerminalOptions = {}): void {
  const { body, input, prompt, paramsHint } = _mkChildren(root);
  const h: TerminalHandle = {
    el: root,
    sessionId: null,
    // Empty sentinel means "no caller default". _openSession sees "" and
    // falls through to /api/models default (the server's verified agentic
    // cloud model). A caller who wants a specific driver still passes
    // { driverDefault: "..." }; a harness that must not pay cloud tokens
    // can also pin it via the URL, e.g. ?driver=deterministic — which
    // wins over both opts and the API default.
    driverName: new URLSearchParams(window.location.search).get("driver") ?? opts.driverDefault ?? "",
    bundleSlug: "",
    eventSource: null,
    turnIndex: 0,
    lastSeq: -1,
    chatting: true,
    endedEmittedFor: null,
    updatePrompt: () => undefined,  // real updater installed below by mountTerminal.
    updateParamsHint: () => undefined,  // real updater installed below.
    driverParams: null,
    pendingDriverParams: null,
    pendingCreate: {},
    pendingContext: null,
    currentRecord: null,
    // Sprint 035x: slash handlers (extracted to web/terminal/slash/)
    // call h.endSession(reason). Bound below once mountTerminal has
    // captured `body` in its closure.
    endSession: async () => undefined,
  };
  h.endSession = (reason: string) => _endSession(h, body, reason);
  _push(body, "substrate daily-driver terminal · type to talk to the model · /exit to leave", CLS.dim);
  // Stateful prompt updater. Replaces the prior recursive rAF loop (60Hz
  // DOM writes for two events per session lifetime) — CQ-3. Callers invoke
  // _updatePrompt() after any state change that shifts the prompt.
  const _updatePrompt = (): void => {
    prompt.textContent = h.sessionId ? `${h.driverName} ›` : "substrate$";
  };
  _updatePrompt();
  // Expose the updater on the handle so _openSession / _closeStream can
  // trigger a refresh without threading the closure through every helper.
  h.updatePrompt = _updatePrompt;
  // Sprint 035v: params hint stateful updater. Sprint 041: hide when
  // no session — the params only matter for the live one; pre-session
  // the `+ new session` dialog owns the defaults.
  const _updateParamsHint = (): void => {
    if (h.sessionId) {
      paramsHint.style.display = "";
      paramsHint.textContent = _formatParamsHint(h.driverParams);
    } else {
      paramsHint.style.display = "none";
    }
  };
  _updateParamsHint();
  h.updateParamsHint = _updateParamsHint;
  // Sprint 041: 035t's inline driver picker retired — the mount point
  // #driver-picker now lives inside the terminal header (see _mkChildren)
  // and app.ts's mountDriverPicker (036a) populates it. That picker
  // fires DRIVER_PATCHED on change + updates the manifest via PATCH.
  // Terminal.ts reads its select's value at _openSession-time to seed
  // the POST body's `driver` field.
  // Sprint 035u — Ctrl+C interrupts the current turn (product spec §2).
  // Intercepts only when the terminal input has focus AND the input has
  // no selection, so a user who selected text in the input to copy still
  // gets browser-native copy behavior. Ctrl+C over the terminal body
  // (selecting transcript text) is not intercepted here; the browser's
  // default copy fires.
  input.addEventListener("keydown", (e) => {
    if (e.key !== "c" || !(e.ctrlKey || e.metaKey)) return;
    const inp = input;
    const hasSelection = typeof inp.selectionStart === "number"
      && typeof inp.selectionEnd === "number"
      && inp.selectionStart !== inp.selectionEnd;
    if (hasSelection) return;  // let the browser copy the selection
    e.preventDefault();
    if (!h.sessionId) {
      _push(body, "(no session in flight; type /exit to close or open one with a message)", CLS.dim);
      return;
    }
    const sid = h.sessionId;
    _fetch<{ interrupted?: boolean; landed?: boolean }>(`/api/session/${encodeURIComponent(sid)}/interrupt`, "POST", {}).then((result) => {
      if (!result.ok) {
        _push(body, `interrupt failed [${result.failure_class}] ${result.detail}`, CLS.err);
        return;
      }
      // Per piece B sprint 217d: an interrupt on an idle session returns
      // {interrupted: false, landed: false}; on a live turn returns
      // {interrupted: true, landed: bool} where `landed` reflects whether
      // the ProducerCancelled envelope reached the record in time.
      if (result.data.interrupted) {
        const lands = result.data.landed ? "landed" : "dispatched — envelope arriving on /events";
        _push(body, `^C interrupt (${lands})`, CLS.dim);
      } else {
        _push(body, "^C — no turn in flight; type /exit to end session", CLS.dim);
      }
    });
  });
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const line = input.value;
    input.value = "";
    const trimmed = line.trim();
    if (!trimmed) return;
    // Sprint 035s: route through _slashRoute if the line starts with /.
    // Handler returns true when it consumed the line; false when the
    // line is not a slash. The router covers /exit, /help, /model,
    // /tools, /bundle, /context, /inspect, /narrate, /tail, /cat,
    // /list, /replay, /run, /diff, /studio, /interrupt.
    _slashRoute(h, body, trimmed).then((handled) => {
      if (handled) return;
      _sendTurn(h, body, trimmed).catch((err) => {
        _push(body, `send failed: ${err && err.message ? err.message : err}`, CLS.err);
      });
    }).catch((err) => {
      _push(body, `slash handler failed: ${err && err.message ? err.message : err}`, CLS.err);
    });
  });
}
