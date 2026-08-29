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
  const hint = document.createElement("span");
  hint.id = "terminal-hint";
  hint.className = "term-hint";
  hint.style.marginLeft = "auto";
  hint.innerHTML = "type to talk · <b>/exit</b> to leave";
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

  return { body, input, prompt, header };
}

function _push(body: HTMLDivElement, text: string, cls: string): void {
  const line = document.createElement("div");
  line.className = `term-line ${cls}`;
  line.textContent = text;
  body.appendChild(line);
  body.scrollTop = body.scrollHeight;
}

async function _openSession(h: TerminalHandle, body: HTMLDivElement): Promise<boolean> {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driver: h.driverName }),
  }).then((r) => r.json()).catch(() => null);
  if (!res || !res.session_id) {
    _push(body, `session: open failed — ${res && res.error ? res.error : "no response"}`, CLS.err);
    return false;
  }
  h.sessionId = String(res.session_id);
  // Fire DRIVER_SESSION_STARTED on the daemon acknowledgment, not on the
  // record's SessionStarted envelope: substrate's session topology does not
  // emit a SessionStarted envelope on the record today (the SessionStarted
  // class exists in topologies/session/__init__.py but no producer emits
  // it). The daemon's POST response IS the observable "session started"
  // event from the UI's vantage. driver_context_tokens defaults to 0 until
  // the daemon returns it; bundle_slug comes from the create body (empty
  // when no bundle attached).
  emit("DRIVER_SESSION_STARTED", {
    session_id: h.sessionId,
    driver_name: h.driverName,
    driver_context_tokens: 0,
    bundle_slug: h.bundleSlug,
  });
  _push(body, `session ${h.sessionId} started · driver ${h.driverName}`, CLS.dim);
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
  const res = await fetch(`/api/session/${encodeURIComponent(h.sessionId ?? "")}/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).then((r) => r.json()).catch(() => null);
  if (!res || res.ok === false || res.error) {
    _push(body, `turn: ${res && res.error ? res.error : "failed"}`, CLS.err);
  }
}

async function _endSession(h: TerminalHandle, body: HTMLDivElement, reason: string): Promise<void> {
  if (!h.sessionId) {
    _push(body, "(no active session)", CLS.dim);
    return;
  }
  const sid = h.sessionId;
  const res = await fetch(`/api/session/${encodeURIComponent(sid)}/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: reason }),
  }).then((r) => r.json()).catch(() => null);
  // Fire DRIVER_SESSION_ENDED synchronously on daemon acknowledgment. The
  // SSE stream will also deliver a SessionEnded envelope moments later; the
  // handler guards on endedEmittedFor to avoid double-fire.
  if (res && res.status === "ended") {
    emit("DRIVER_SESSION_ENDED", { session_id: sid, reason });
    h.endedEmittedFor = sid;
    _push(body, `session ended (${reason})`, CLS.dim);
  } else {
    _push(body, `end: ${res && res.error ? res.error : "failed"}`, CLS.err);
  }
  // Keep sessionId set until the SSE stream drains and closes; the handler
  // needs it to guard the double-fire. It clears in _closeStream.
}

export interface MountTerminalOptions {
  driverDefault?: string;
}

export function mountTerminal(root: HTMLElement, opts: MountTerminalOptions = {}): void {
  const { body, input, prompt } = _mkChildren(root);
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
  };
  _push(body, "substrate daily-driver terminal · type to talk to the model · /exit to leave", CLS.dim);
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const line = input.value;
    input.value = "";
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("/")) {
      const cmd = trimmed.slice(1).trim();
      if (cmd === "exit") {
        _endSession(h, body, "user_exit").catch(() => undefined);
        return;
      }
      _push(body, `unknown slash: /${cmd}`, CLS.err);
      return;
    }
    _sendTurn(h, body, trimmed).catch((err) => {
      _push(body, `send failed: ${err && err.message ? err.message : err}`, CLS.err);
    });
  });
  // Update the prompt when a session is active vs idle.
  const promptTick = (): void => {
    prompt.textContent = h.sessionId ? `${h.driverName} ›` : "substrate$";
    requestAnimationFrame(promptTick);
  };
  promptTick();
}
