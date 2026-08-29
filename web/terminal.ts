// terminal.ts — the daily-driver terminal column mounted inside #view-terminal.
// Sprint 035 promotes the terminal from its bottom-dock legacy shape
// (#termdock, kept one release inside #view-desktop; sprint 037c retires it)
// to a full column that talks to the piece-B session endpoints:
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

interface PendingContext {
  parent_seq_range: [number, number];
  kinds: string[];
}

interface TerminalHandle {
  el: HTMLElement;
  sessionId: string | null;
  driverName: string;
  bundleSlug: string;
  eventSource: EventSource | null;
  turnIndex: number;
  lastSeq: number;
  chatting: boolean;
  endedEmittedFor: string | null;  // session_id last emitted-ended-for; guards double-fire.
  updatePrompt: () => void;  // Set by mountTerminal; called on session-open/close (CQ-3).
  updateParamsHint: () => void;  // Sprint 035v — refresh #terminal-params from driverParams.
  // Sprint 035v: per-session driver params (think/max_tokens/timeout/num_ctx).
  // Populated on session-open from the POST /api/session ACK's echo (piece B
  // sprint 032c). Mutated by `/set` slash via PATCH /api/session/<id>
  // {driver_params}. Fires DRIVER_PARAMS_PATCHED (v0.7.2) on PATCH ACK.
  driverParams: Record<string, unknown> | null;
  // Sprint 035v: queued driver_params for the next _openSession call —
  // used when the user runs `/set` before opening a session.
  pendingDriverParams: Record<string, unknown> | null;
  // Sprint 035w: create-time controls queued via /bundle, /tools,
  // /workspace, /isolate, /name before a session opens. `_openSession`
  // reads + clears + threads into the POST /api/session body. Workspace,
  // workspace_shape, and isolate are create-only per product spec §9c
  // ("SessionStarted.workspace_path frozen at seq 1"); mid-session PATCH
  // is refused by the daemon. Name is create-only too.
  pendingCreate: {
    bundle?: string;
    workspace?: string;
    workspace_shape?: string;
    isolate?: boolean;
    tools?: string[];
    name?: string;
  };
  // Sprint 035s: /context <lo-hi> [--kind K] stashes here; the next _sendTurn
  // reads + clears + passes as the POST body's `context` field per piece B
  // sprint 217e. Mirrors the CLI's `pending_context` dict at cli.py:1114.
  pendingContext: PendingContext | null;
  // Sprint 035s: current record name for read-slashes that need it (/inspect,
  // /narrate, /tail, /cat, /diff). Updated when a session opens (record path
  // basename) so slashes without an arg default to "the current session's
  // record."
  currentRecord: string | null;
}

const CLS = {
  in: "tl-in",
  out: "tl-out",
  dim: "tl-dim",
  err: "tl-err",
  accent: "tl-accent",
};

function _mkChildren(root: HTMLElement): {
  body: HTMLDivElement;
  input: HTMLInputElement;
  prompt: HTMLSpanElement;
  header: HTMLDivElement;
  driverSelect: HTMLSelectElement;
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
  // Sprint 035t: driver picker in the terminal header. Populated from
  // GET /api/models on mount. Change fires PATCH /api/session/<id>
  // {driver} + DRIVER_PATCHED emit; same wire as the /model slash from
  // sprint 035s. Two entry points, one wire.
  const driverLabel = document.createElement("label");
  driverLabel.className = "term-hint";
  driverLabel.style.display = "flex";
  driverLabel.style.alignItems = "center";
  driverLabel.style.gap = "6px";
  driverLabel.style.marginLeft = "16px";
  driverLabel.textContent = "driver ";
  const driverSelect = document.createElement("select");
  driverSelect.id = "terminal-driver";
  driverSelect.className = "term-model";
  driverSelect.title = "the driver this session runs against; change fires PATCH /api/session/<id> {driver}";
  driverLabel.appendChild(driverSelect);
  header.appendChild(driverLabel);
  // Sprint 035v: params hint. Renders `think off · tokens ∞ · timeout 300s`
  // matching the dock's #termparams shape. Updates on session-open (read from
  // POST /api/session ACK's driver_params echo) and on /set slash PATCH ACK.
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

  return { body, input, prompt, header, driverSelect, paramsHint };
}

// Sprint 035v: format the params hint from a driver_params dict (or null).
// Unset / undefined keys render as their responder defaults.
function _formatParamsHint(params: Record<string, unknown> | null | undefined): string {
  const think = params?.think === true;
  const rawTokens = params?.max_tokens;
  const tokens = typeof rawTokens === "number" && rawTokens > 0 ? String(rawTokens) : "∞";
  const rawTimeout = params?.timeout;
  const timeout = typeof rawTimeout === "number" && rawTimeout > 0 ? rawTimeout : 300;
  return `think ${think ? "on" : "off"} · tokens ${tokens} · timeout ${timeout}s`;
}

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

function _push(body: HTMLDivElement, text: string, cls: string): void {
  const line = document.createElement("div");
  line.className = `term-line ${cls}`;
  line.textContent = text;
  body.appendChild(line);
  body.scrollTop = body.scrollHeight;
}

type FetchResult<T> = { ok: true; data: T } | { ok: false; failure_class: "network" | "http" | "parse"; detail: string };

async function _postJson<T = Record<string, unknown>>(url: string, body: unknown): Promise<FetchResult<T>> {
  // One JSON-POST helper for terminal.ts. Distinguishes network / HTTP / parse
  // failure classes so the caller can surface them separately instead of the
  // prior .catch(() => null) coerce-to-null that swallowed diagnostic info.
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, failure_class: "network", detail };
  }
  const text = await response.text();
  if (!response.ok) {
    // The daemon returns JSON error bodies (`{"error": "..."}`) on 4xx / 5xx.
    let detail = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed.error) detail = `HTTP ${response.status}: ${parsed.error}`;
    } catch { /* body was not JSON; the plain status suffices */ }
    return { ok: false, failure_class: "http", detail };
  }
  if (!text) return { ok: true, data: {} as T };
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, failure_class: "parse", detail };
  }
}

async function _openSession(h: TerminalHandle, body: HTMLDivElement): Promise<boolean> {
  const createBody: Record<string, unknown> = { driver: h.driverName };
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
  // Fire DRIVER_SESSION_STARTED on the daemon acknowledgment, not on the
  // record's SessionStarted envelope: substrate's session topology does not
  // emit a SessionStarted envelope on the record today (the SessionStarted
  // class exists in topologies/session/__init__.py but no producer emits
  // it). The daemon's POST response IS the observable "session started"
  // event from the UI's vantage. driver_context_tokens defaults to 0 until
  // the daemon returns it; bundle_slug comes from the create body (empty
  // when no bundle attached).
  // Sprint 240 + REVIEW-2026-08-28-piece-g-full SUB-1: DRIVER_SESSION_STARTED
  // fires from the SSE handler when the `SessionStarted` envelope lands on
  // the record — not here on the daemon-ack. The daemon ack tells us the
  // session_id + record path; the record's own SessionStarted carries the
  // canonical fields (driver_context_tokens, bundle, workspace_shape,
  // parent_session_id) that only the substrate side knows. One vocabulary
  // per event.
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

const _HELP_TEXT = [
  "substrate daily-driver terminal — slash inventory:",
  "  /exit                              end this session cleanly",
  "  /model <name>                      swap driver mid-session",
  "  /tools <a,b,c>                     restrict tool suite (empty for unrestricted)",
  "  /bundle <name>                     attach a bundle (queues if no session; PATCH mid-session)",
  "  /workspace <path>                  set workspace at create time (immutable per session)",
  "  /isolate on|off                    Mode 3 nested-child dirs at create time",
  "  /name <n>                          register the next session under a name",
  "  /context <lo-hi> [--kind K]        inject a record slice into the next turn",
  "  /inspect [<record>]                narrate the record's causal beats",
  "  /narrate [<record>]                same as /inspect",
  "  /tail [<record>]                   raw events for the record",
  "  /cat <seq> [<record>]              one event's full payload",
  "  /list [records|topologies|sessions|applications|bundles]",
  "  /replay <record>                   assert byte-identical replay (needs daemon endpoint — hint only)",
  "  /run <application>                 launch a topology as a delegate child",
  "  /set [think|tokens|timeout] [val]  read or change driver params (think on|off; tokens N (0=∞); timeout N)",
  "  /diff                              worktree diff for this session's workspace",
  "  /studio                            open the topology-authoring studio in a new tab",
  "  /interrupt                         cancel the current turn (Ctrl+C alt)",
  "  /help                              this list",
];

async function _slashRoute(h: TerminalHandle, body: HTMLDivElement, line: string): Promise<boolean> {
  const stripped = line.trim();
  if (!stripped.startsWith("/")) return false;
  const parts = stripped.split(/\s+/);
  const slash = parts[0];
  const args = parts.slice(1);

  // /exit — special-cased to route through the existing session-end path
  // (POST /api/session/<id>/end with source="user_exit"). The router
  // handles it here rather than the CLI's "let the model see it" trick
  // because in browser-world the daemon end IS the observable event.
  if (slash === "/exit") {
    await _endSession(h, body, "user_exit");
    return true;
  }

  if (slash === "/help") {
    for (const l of _HELP_TEXT) _push(body, l, CLS.dim);
    return true;
  }

  if (slash === "/model") {
    if (args.length !== 1) { _push(body, "/model requires exactly one driver name", CLS.err); return true; }
    if (!h.sessionId) { _push(body, "/model needs an active session — send a message first", CLS.err); return true; }
    const priorDriver = h.driverName;
    const result = await _fetch(`/api/session/${encodeURIComponent(h.sessionId)}`, "PATCH", { driver: args[0] });
    if (!result.ok) { _push(body, `/model failed [${result.failure_class}] ${result.detail}`, CLS.err); return true; }
    h.driverName = args[0];
    emit("DRIVER_PATCHED", { session_id: h.sessionId, driver: args[0], prior_driver: priorDriver });
    _push(body, `driver → ${args[0]} (next turn)`, CLS.accent);
    h.updatePrompt();
    return true;
  }

  if (slash === "/tools") {
    if (args.length === 0) { _push(body, "/tools <comma-list> — restrict tool suite (empty for unrestricted)", CLS.err); return true; }
    const toolList = args[0].split(",").map((t) => t.trim()).filter((t) => t.length > 0);
    if (!h.sessionId) {
      // Sprint 035w: queue for next session-open.
      h.pendingCreate.tools = toolList;
      _push(body, `tools → [${toolList.join(", ")}] (queued for next session)`, CLS.dim);
      return true;
    }
    const result = await _fetch(`/api/session/${encodeURIComponent(h.sessionId)}`, "PATCH", { tools: toolList });
    if (!result.ok) { _push(body, `/tools failed [${result.failure_class}] ${result.detail}`, CLS.err); return true; }
    emit("TOOLS_RESTRICTED", { session_id: h.sessionId, tools: toolList });
    _push(body, `tools → [${toolList.join(", ")}] (next turn)`, CLS.accent);
    return true;
  }

  if (slash === "/bundle") {
    if (args.length !== 1) { _push(body, "/bundle <name> — attach bundle mid-session (or before)", CLS.err); return true; }
    if (!h.sessionId) {
      // Sprint 035w: queue for next session-open. The daemon validates
      // the name via load_bundle at POST time; unknown names 400 then.
      h.pendingCreate.bundle = args[0];
      _push(body, `bundle → ${args[0]} (queued for next session)`, CLS.dim);
      return true;
    }
    const priorBundle = h.bundleSlug || null;
    const result = await _fetch<{ bundle?: string | null }>(`/api/session/${encodeURIComponent(h.sessionId)}`, "PATCH", { bundle: args[0] });
    if (!result.ok) { _push(body, `/bundle failed [${result.failure_class}] ${result.detail}`, CLS.err); return true; }
    h.bundleSlug = args[0];
    emit("BUNDLE_ATTACHED", { session_id: h.sessionId, bundle: args[0], prior_bundle: priorBundle });
    _push(body, `bundle → ${args[0]} (next turn seed re-assembles)`, CLS.accent);
    return true;
  }

  if (slash === "/workspace") {
    // Sprint 035w: queue-only. Product spec §9c: workspace_path frozen
    // at SessionStarted seq 1; the daemon refuses mid-session PATCH.
    if (args.length !== 1) { _push(body, "/workspace <path> — set workspace at create time (immutable per session)", CLS.err); return true; }
    if (h.sessionId) { _push(body, "/workspace: workspace is create-only per spec §9c; end this session (/exit) first", CLS.err); return true; }
    h.pendingCreate.workspace = args[0];
    _push(body, `workspace → ${args[0]} (queued for next session)`, CLS.dim);
    return true;
  }

  if (slash === "/isolate") {
    // Sprint 035w: queue-only. Product spec §9c Mode 3 opt-in;
    // create-time only. Grays out when workspace is a git repo per
    // 036e; here at the terminal we accept the value without validating
    // against workspace shape (daemon does that at POST time).
    if (args.length !== 1 || (args[0] !== "on" && args[0] !== "off")) {
      _push(body, "/isolate on|off — enable Mode 3 (nested-by-directory child dirs) at create time", CLS.err);
      return true;
    }
    if (h.sessionId) { _push(body, "/isolate: isolate is create-only per spec §9c; end this session (/exit) first", CLS.err); return true; }
    h.pendingCreate.isolate = args[0] === "on";
    _push(body, `isolate → ${args[0]} (queued for next session)`, CLS.dim);
    return true;
  }

  if (slash === "/name") {
    // Sprint 035w: queue-only. Register the next session under a name
    // per product spec §2 --name flag; addressable via delegate
    // {child_session_name} per §5/§6. Daemon returns 409 on collision;
    // the ACK path handles it.
    if (args.length !== 1) { _push(body, "/name <name> — register the next session under a name", CLS.err); return true; }
    if (h.sessionId) { _push(body, "/name: name registration is at create time; end this session (/exit) first", CLS.err); return true; }
    h.pendingCreate.name = args[0];
    _push(body, `name → ${args[0]} (queued for next session)`, CLS.dim);
    return true;
  }

  if (slash === "/context") {
    if (args.length === 0) { _push(body, "/context <lo-hi> [--kind K]", CLS.err); return true; }
    const range = args[0];
    if (!range.includes("-")) { _push(body, "/context: range must be <lo>-<hi>", CLS.err); return true; }
    const [loStr, hiStr] = range.split("-", 2);
    const lo = parseInt(loStr, 10); const hi = parseInt(hiStr, 10);
    if (Number.isNaN(lo) || Number.isNaN(hi)) { _push(body, "/context: <lo> and <hi> must be integers", CLS.err); return true; }
    const kinds: string[] = [];
    const kIdx = args.indexOf("--kind");
    if (kIdx >= 0 && kIdx + 1 < args.length) kinds.push(args[kIdx + 1]);
    h.pendingContext = { parent_seq_range: [lo, hi], kinds };
    _push(body, `context pending: seq ${lo}..${hi}${kinds.length ? ` kinds=${kinds.join(",")}` : ""}`, CLS.dim);
    return true;
  }

  if (slash === "/inspect" || slash === "/narrate") {
    const recordName = args[0] || h.currentRecord;
    if (!recordName) { _push(body, `${slash} needs a record name (or open a session first)`, CLS.err); return true; }
    const result = await _fetchGet<unknown[]>(`/api/records/${encodeURIComponent(recordName)}/narrate`);
    if (!result.ok) { _push(body, `${slash} failed [${result.failure_class}] ${result.detail}`, CLS.err); return true; }
    for (const l of result.data) _push(body, String(l), CLS.out);
    return true;
  }

  if (slash === "/tail") {
    const recordName = args[0] || h.currentRecord;
    if (!recordName) { _push(body, "/tail needs a record name (or open a session first)", CLS.err); return true; }
    const result = await _fetchGet<Array<{ seq: number; kind: string; t?: number }>>(`/api/records/${encodeURIComponent(recordName)}/events`);
    if (!result.ok) { _push(body, `/tail failed [${result.failure_class}] ${result.detail}`, CLS.err); return true; }
    for (const ev of result.data) _push(body, `seq ${String(ev.seq).padStart(3, "0")}  ${ev.kind}`, CLS.out);
    _push(body, `${result.data.length} event(s)`, CLS.dim);
    return true;
  }

  if (slash === "/cat") {
    if (args.length === 0) { _push(body, "/cat <seq> [<record>]", CLS.err); return true; }
    const seq = parseInt(args[0], 10);
    if (Number.isNaN(seq)) { _push(body, "/cat: <seq> must be an integer", CLS.err); return true; }
    const recordName = args[1] || h.currentRecord;
    if (!recordName) { _push(body, "/cat needs a record name (or open a session first)", CLS.err); return true; }
    const result = await _fetchGet<Array<{ seq: number; kind: string; payload: unknown }>>(`/api/records/${encodeURIComponent(recordName)}/events`);
    if (!result.ok) { _push(body, `/cat failed [${result.failure_class}] ${result.detail}`, CLS.err); return true; }
    const ev = result.data.find((e) => e.seq === seq);
    if (!ev) { _push(body, `/cat: no event at seq ${seq}`, CLS.err); return true; }
    _push(body, `# seq ${ev.seq}  ${ev.kind}`, CLS.dim);
    for (const l of JSON.stringify(ev.payload, null, 2).split("\n")) _push(body, l, CLS.out);
    return true;
  }

  if (slash === "/list") {
    const target = args[0] || "sessions";
    if (target === "sessions") {
      const result = await _fetchGet<{ live?: unknown[]; parked?: unknown[]; ended?: unknown[] }>(`/api/session`);
      if (!result.ok) { _push(body, `/list sessions failed [${result.failure_class}] ${result.detail}`, CLS.err); return true; }
      for (const [bucket, entries] of Object.entries(result.data)) {
        if (!Array.isArray(entries)) continue;
        for (const e of entries) {
          const rec = e as { session_id?: string; name?: string | null; driver?: string };
          _push(body, `[${bucket}] ${rec.name || rec.session_id} (${rec.driver ?? "?"})`, CLS.out);
        }
      }
      return true;
    }
    if (target === "records") {
      const result = await _fetchGet<Array<{ name: string; status?: string; started_at?: string }>>(`/api/records`);
      if (!result.ok) { _push(body, `/list records failed [${result.failure_class}] ${result.detail}`, CLS.err); return true; }
      for (const r of result.data) _push(body, `${r.name}${r.status ? `  (${r.status})` : ""}`, CLS.out);
      _push(body, `${result.data.length} record(s)`, CLS.dim);
      return true;
    }
    if (target === "topologies") {
      const result = await _fetchGet<string[]>(`/api/topologies`);
      if (!result.ok) { _push(body, `/list topologies failed [${result.failure_class}] ${result.detail}`, CLS.err); return true; }
      for (const n of result.data) _push(body, n, CLS.out);
      return true;
    }
    if (target === "applications") {
      const result = await _fetchGet<Array<{ name: string; description?: string }>>(`/api/applications`);
      if (!result.ok) { _push(body, `/list applications failed [${result.failure_class}] ${result.detail}`, CLS.err); return true; }
      for (const a of result.data) _push(body, `${a.name}${a.description ? `  — ${a.description}` : ""}`, CLS.out);
      return true;
    }
    if (target === "bundles") {
      _push(body, "/list bundles — GET /api/bundles is sprint 034a; not yet shipped", CLS.err);
      return true;
    }
    _push(body, `/list ${target}: unknown target (try records|topologies|sessions|applications|bundles)`, CLS.err);
    return true;
  }

  if (slash === "/replay") {
    _push(body, "/replay — replay-verification is not exposed via the daemon; run `substrate replay <record>` at the CLI", CLS.err);
    return true;
  }

  if (slash === "/run") {
    if (args.length === 0) { _push(body, "/run <application> [args...]", CLS.err); return true; }
    const app = args[0];
    // TECH-SPEC §7.6: POST /api/topology/<name>/run accepts {inputs: {...}, await_completion}.
    // A bare /run with no args passes {} — apps whose manifests have slot
    // defaults handle it; apps with required slots return 400 with the
    // list of missing keys.
    const result = await _fetch<{ run_id?: string; record_root?: string; status?: string; error?: string }>(`/api/topology/${encodeURIComponent(app)}/run`, "POST", { inputs: {}, await_completion: false });
    if (!result.ok) { _push(body, `/run ${app} failed [${result.failure_class}] ${result.detail}`, CLS.err); return true; }
    if (result.data.error) { _push(body, `/run ${app}: ${result.data.error}`, CLS.err); return true; }
    _push(body, `${app} launched → ${result.data.run_id ?? "?"} (${result.data.status ?? "?"})`, CLS.accent);
    return true;
  }

  if (slash === "/diff") {
    if (!h.sessionId) { _push(body, "/diff needs an active session", CLS.err); return true; }
    // Look up the session's workspace via GET /api/session/<id>.
    const s = await _fetchGet<{ workspace?: string }>(`/api/session/${encodeURIComponent(h.sessionId)}`);
    if (!s.ok || !s.data.workspace) { _push(body, "/diff: could not resolve session workspace", CLS.err); return true; }
    const result = await _fetchGet<{ files?: string[]; diff?: string; error?: string }>(`/api/worktree_diff?path=${encodeURIComponent(s.data.workspace)}`);
    if (!result.ok) { _push(body, `/diff failed [${result.failure_class}] ${result.detail}`, CLS.err); return true; }
    if (result.data.error) { _push(body, `/diff: ${result.data.error}`, CLS.err); return true; }
    const files = result.data.files ?? [];
    if (!files.length) { _push(body, "no changes in this session's worktree yet", CLS.dim); return true; }
    _push(body, `${files.length} file(s) changed:`, CLS.dim);
    for (const f of files) _push(body, `  ${f}`, CLS.out);
    const diff = result.data.diff ?? "";
    for (const l of diff.slice(0, 2000).split("\n")) _push(body, l, CLS.out);
    if (diff.length > 2000) _push(body, `… (truncated; ${diff.length - 2000} more bytes)`, CLS.dim);
    return true;
  }

  if (slash === "/studio") {
    window.open("/studio.html", "_blank");
    _push(body, "studio opened in a new tab", CLS.dim);
    return true;
  }

  if (slash === "/set") {
    // Sprint 035v — /set think on|off · /set tokens N · /set timeout N.
    // Reads current params, merges the change, PATCHes /api/session/<id>
    // {driver_params: <merged>}, emits DRIVER_PARAMS_PATCHED (v0.7.2).
    // With no args: print the current params. With no session: queue on
    // pendingDriverParams for the next session-open.
    if (args.length === 0) {
      _push(body, `params — ${_formatParamsHint(h.driverParams)}`, CLS.dim);
      return true;
    }
    const key = args[0];
    const val = args[1];
    if (!["think", "tokens", "timeout", "num_ctx"].includes(key)) {
      _push(body, `/set: unknown key '${key}'; try think | tokens | timeout | num_ctx`, CLS.err);
      return true;
    }
    if (val === undefined) {
      _push(body, `/set ${key} <value>`, CLS.err);
      return true;
    }
    // Map UI key → manifest key + parse value.
    const mkey = key === "tokens" ? "max_tokens" : key;
    let parsed: unknown;
    if (mkey === "think") {
      if (val !== "on" && val !== "off") { _push(body, "/set think on|off", CLS.err); return true; }
      parsed = val === "on";
    } else if (mkey === "max_tokens" || mkey === "num_ctx") {
      const n = parseInt(val, 10);
      if (!Number.isFinite(n) || n < 0 || (mkey === "num_ctx" && n < 1)) {
        _push(body, `/set ${key}: must be a non-negative integer${mkey === "num_ctx" ? " ≥ 1" : ""}`, CLS.err);
        return true;
      }
      parsed = n;
    } else {
      const f = parseFloat(val);
      if (!Number.isFinite(f) || f <= 0) { _push(body, "/set timeout: must be > 0 (seconds)", CLS.err); return true; }
      parsed = f;
    }
    const prior = h.driverParams ? { ...h.driverParams } : {};
    const next: Record<string, unknown> = { ...prior, [mkey]: parsed };
    if (!h.sessionId) {
      h.pendingDriverParams = next;
      h.driverParams = next;
      h.updateParamsHint();
      _push(body, `${key} → ${val} (queued for next session)`, CLS.dim);
      return true;
    }
    const result = await _fetch<{ driver_params?: Record<string, unknown> | null }>(`/api/session/${encodeURIComponent(h.sessionId)}`, "PATCH", { driver_params: next });
    if (!result.ok) { _push(body, `/set failed [${result.failure_class}] ${result.detail}`, CLS.err); return true; }
    h.driverParams = result.data.driver_params ?? next;
    emit("DRIVER_PARAMS_PATCHED", { session_id: h.sessionId, params: next, prior_params: prior });
    h.updateParamsHint();
    _push(body, `${key} → ${val} (next turn)`, CLS.accent);
    return true;
  }

  if (slash === "/interrupt") {
    if (!h.sessionId) { _push(body, "/interrupt needs an active session", CLS.err); return true; }
    const result = await _fetch(`/api/session/${encodeURIComponent(h.sessionId)}/interrupt`, "POST", {});
    if (!result.ok) { _push(body, `/interrupt failed [${result.failure_class}] ${result.detail}`, CLS.err); return true; }
    _push(body, "interrupt sent — current turn canceling", CLS.dim);
    return true;
  }

  _push(body, `unknown slash: ${slash}. Try /help`, CLS.err);
  return true;
}

// Two typed HTTP helpers alongside `_postJson`. `_fetch` handles POST/PATCH/
// PUT with a JSON body; `_fetchGet` handles GET. Both return the same
// FetchResult<T> discriminated union so callers can name the failure class.
async function _fetch<T = Record<string, unknown>>(url: string, method: string, body: unknown): Promise<FetchResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { ok: false, failure_class: "network", detail: err instanceof Error ? err.message : String(err) };
  }
  const text = await response.text();
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed.error) detail = `HTTP ${response.status}: ${parsed.error}`;
    } catch { /* body not JSON */ }
    return { ok: false, failure_class: "http", detail };
  }
  if (!text) return { ok: true, data: {} as T };
  try { return { ok: true, data: JSON.parse(text) as T }; }
  catch (err) { return { ok: false, failure_class: "parse", detail: err instanceof Error ? err.message : String(err) }; }
}

async function _fetchGet<T>(url: string): Promise<FetchResult<T>> {
  let response: Response;
  try { response = await fetch(url); }
  catch (err) { return { ok: false, failure_class: "network", detail: err instanceof Error ? err.message : String(err) }; }
  const text = await response.text();
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try { const parsed = JSON.parse(text) as { error?: string }; if (parsed.error) detail = `HTTP ${response.status}: ${parsed.error}`; }
    catch { /* body not JSON */ }
    return { ok: false, failure_class: "http", detail };
  }
  try { return { ok: true, data: JSON.parse(text) as T }; }
  catch (err) { return { ok: false, failure_class: "parse", detail: err instanceof Error ? err.message : String(err) }; }
}

export interface MountTerminalOptions {
  driverDefault?: string;
}

export function mountTerminal(root: HTMLElement, opts: MountTerminalOptions = {}): void {
  const { body, input, prompt, driverSelect, paramsHint } = _mkChildren(root);
  const h: TerminalHandle = {
    el: root,
    sessionId: null,
    driverName: opts.driverDefault ?? "deterministic",
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
  };
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
  // Sprint 035v: params hint stateful updater.
  const _updateParamsHint = (): void => {
    paramsHint.textContent = _formatParamsHint(h.driverParams);
  };
  _updateParamsHint();
  h.updateParamsHint = _updateParamsHint;
  // Sprint 035t: populate the driver picker + wire its change handler.
  // Runs async; the picker shows "populating…"-shape (empty select) for a
  // few ms while /api/models resolves. Change fires PATCH driver +
  // DRIVER_PATCHED emit when a session is active; otherwise updates
  // h.driverName so the next session-open uses the picked driver.
  _populateDriverPicker(driverSelect, h).then(() => {
    _updatePrompt();
  }).catch((err) => {
    _push(body, `driver picker: populate failed — ${err && err.message ? err.message : err}`, CLS.err);
  });
  driverSelect.addEventListener("change", () => {
    const next = driverSelect.value;
    if (!next) return;
    const prior = h.driverName;
    if (next === prior) return;
    if (!h.sessionId) {
      // No active session yet — update the pending default. The next
      // _openSession call POSTs this driver.
      h.driverName = next;
      _push(body, `driver → ${next} (queued for next session)`, CLS.dim);
      _updatePrompt();
      return;
    }
    _fetch(`/api/session/${encodeURIComponent(h.sessionId)}`, "PATCH", { driver: next }).then((result) => {
      if (!result.ok) {
        _push(body, `driver-picker PATCH failed [${result.failure_class}] ${result.detail}`, CLS.err);
        driverSelect.value = prior;  // revert the select on failure
        return;
      }
      h.driverName = next;
      emit("DRIVER_PATCHED", { session_id: h.sessionId ?? "", driver: next, prior_driver: prior });
      _push(body, `driver → ${next} (next turn)`, CLS.accent);
      _updatePrompt();
    });
  });
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
