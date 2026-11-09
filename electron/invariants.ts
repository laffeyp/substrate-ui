// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The runtime checker (plan process/planning/2026-11-05-sdd-signals, item 5; vocabulary v0.22,
// sprints 373, 375 and 376). Main hands it every record it writes, its own and each window's, in the order it
// writes them. A record that breaks one of the vocabulary's rules comes back as an INVARIANT_BROKEN
// payload: the rule's id, the state the rule read, and the last RECENT records, this one last
// (foundation 01: an assertion failure carries the recent history and the state involved).
//
// Rules checked here, by their ids in the vocabulary:
//   S1  main's first record is APP_BOOTED; each window's first is WINDOW_BOOTED.
//   S2  main's last record is APP_QUIT_COMPLETED: checked by the next boot in electron/main.ts
//       (checkLastBoot), since a boot that ends without it cannot report it (v0.24).
//   S3  a pane's PICKER_LINE_ENTERED comes after a PICKER_FOLDER_ARMED, since the pane last opened
//       or disarmed its folder.
//   S4  PICKER_COMMITTED comes after the pane's tone line, and the pane's next PANE_BOUND says how
//       picker. A commit binds the pane in the same handler (App.tsx commitPane), before any session
//       opens, so a pane that closes or commits again before that bind breaks S4 too.
//   S5  a pane holds one session at a time (v0.21): its last ack or attach names it, replacing any
//       before it (the records page attaches another session into a pane that holds one); every
//       later transcript row record of the pane that names a session names that one.
//   S6  SESSION_OPEN_ACKED comes after the pane's SESSION_OPEN_REQUESTED.
//   S8  a pane's TURN_SUBMITTED names the session its last ack or attach named (a turn that
//       resumes an ended session reopens the stream and writes no new attach).
//   E8  a TRANSCRIPT_SCROLLED that follows the bottom, unpinned, is at the bottom.
//   T1  SERVER_SPAWNED, then SERVER_BOUND within its window (main); a SERVER_EXITED first ends the
//       wait, as it ends T2's (v0.24).
//   T3  APP_QUIT_REQUESTED, then APP_QUIT_COMPLETED within its window (main).
//   T4  a pane's STREAM_ENVELOPE_APPENDED, then its TRANSCRIPT_ROW_DRAWN or _SKIPPED (same pane, same
//       seq) within its window.
//   T5  a pane's SESSION_OPEN_REQUESTED, then its SESSION_OPEN_ACKED or _REFUSED within its window.
//   T6  a pane's TURN_SUBMITTED, then its TURN_ACK, TURN_REFUSED or TURN_REFUSED_VIEW_ONLY within it.
// A pane's session lasts until its PANE_CLOSED. PANE_OPENED clears only the picker (S3 reads "since
// its last PANE_OPENED"): on a reload, pane 1's attach (web/reveal.ts) is written before the App's
// mount writes pane 1's PANE_OPENED.
// A timing rule's window is the vocabulary's (TEMPORAL_WITHIN_MS, generated), measured on main's
// clock as the records reach the checker; wall time is never read. A rule breaks when its window
// passes with no answer, found by the next record or by tick(), which main calls on a timer and before
// its closing record. A pane's waits end with its PANE_CLOSED, a window's with that window's reload
// (WINDOW_BOOTED again) or its WINDOW_CLOSED: what is gone can draw nothing. From main's
// APP_QUIT_REQUESTED every wait but T3's ends and none opens: a quitting app's window stops drawing
// (the packaged key_signals gate, 2026-11-08: the server's SessionEnded at quit drew no row before the
// window closed), and its server is being stopped. A wait already late before the quit still breaks.
// A wait still open when the boot ends is not reported: its window had not passed.
// The rules that pair the Python server's records (server.jsonl, which main reads as it grows and
// hands here before each of its own and each window's records; sprint 376, vocabulary v0.22):
//   S1  the server's first record is SERVER_STARTED, or the SERVER_UNCAUGHT of a server that dies
//       before it binds (v0.24).
//   T2  main's SERVER_BOUND, then the server's SERVER_STARTED on that port within its window (the
//       server prints its port before it writes SERVER_STARTED; one already seen answers at once).
//   S7  each window SESSION_OPEN_ACKED has exactly one server SESSION_CREATED of that session before
//       it (the server writes it before it answers; sessions other clients open have no window ack).
//   S8  a session's window TURN_ACKs never outnumber its server TURN_ACCEPTEDs.
//   S9  each window SESSION_OPEN_REFUSED or TURN_REFUSED the server caused has an API_REFUSED of its
//       area before it: refusals of one area in the window never outnumber the server's.

import { PaneBoundHow, PickerLineEnteredLine, Signal, TEMPORAL_WITHIN_MS } from "./signals.gen";

export interface CheckedRecord {
  process: string;
  window_id: number | null;
  pane_id?: number | null;
  name: string;
  payload?: Record<string, unknown>;
}

export interface Broken {
  rule: string;
  context: Record<string, unknown>;
  /** The window the broken rule is about, for the record context; null for main's rules. */
  window_id: number | null;
}

interface Wait {
  rule: keyof typeof TEMPORAL_WITHIN_MS;
  from: CheckedRecord;
  at: number;
  window_id: number | null;
  pane_id: number | null;
  answers: (r: CheckedRecord) => boolean;
}

/** How many records an INVARIANT_BROKEN carries. */
export const RECENT = 20;

interface PaneState {
  armed: boolean;
  lastLine: unknown;
  awaitingBind: boolean;
  openRequested: boolean;
  session: unknown;
}

/** The window's failure classes for a refusal the server did not make: no answer, or an answer it
 *  could not read (web/vm/client.ts fetchJson). Every other class is the server's refusal (S9). */
const NOT_THE_SERVERS = new Set(["network", "json_parse"]);
const REFUSAL_AREA: Partial<Record<string, string>> = { [Signal.SESSION_OPEN_REFUSED]: "session", [Signal.TURN_REFUSED]: "turn" };
const bump = (m: Map<string, number>, k: string) => { const n = (m.get(k) ?? 0) + 1; m.set(k, n); return n; };

const isWindow = (r: CheckedRecord, w: Wait) => r.process === "window" && r.window_id === w.window_id;
const paneOf = (r: CheckedRecord) => r.pane_id ?? (typeof r.payload?.pane_id === "number" ? r.payload.pane_id : null);

export function createChecker(now: () => number = () => performance.now()): { see: (r: CheckedRecord) => Broken[]; tick: () => Broken[] } {
  const recent: CheckedRecord[] = [];
  const started = new Set<string>();
  const panes = new Map<string, PaneState>();
  let waits: Wait[] = [];
  let quitting = false;
  // Counts across the boot, by session_id or area: what the server wrote, what the windows wrote.
  const serverPorts = new Set<unknown>();
  const created = new Map<string, number>(), acked = new Map<string, number>();
  const accepted = new Map<string, number>(), turnAcks = new Map<string, number>();
  const serverRefused = new Map<string, number>(), windowRefused = new Map<string, number>();

  function expire(out: Broken[]): void {
    const t = now();
    const kept: Wait[] = [];
    for (const w of waits) {
      const within = TEMPORAL_WITHIN_MS[w.rule];
      if (t - w.at <= within) { kept.push(w); continue; }
      out.push({ rule: w.rule, window_id: w.window_id, context: { state: { from: w.from, pane_id: w.pane_id, within_ms: within, waited_ms: Math.round(t - w.at) }, recent: recent.slice() } });
    }
    waits = kept;
  }

  function tick(): Broken[] {
    const out: Broken[] = [];
    expire(out);
    return out;
  }

  function wait(rule: Wait["rule"], r: CheckedRecord, answers: Wait["answers"]): void {
    if (quitting && rule !== "T3") return;
    waits.push({ rule, from: r, at: now(), window_id: r.process === "window" ? r.window_id : null, pane_id: paneOf(r), answers });
  }

  function see(r: CheckedRecord): Broken[] {
    recent.push(r);
    if (recent.length > RECENT) recent.shift();
    const out: Broken[] = [];
    expire(out);
    const p = r.payload ?? {};
    const broke = (rule: string, state: Record<string, unknown>) => out.push({ rule, window_id: r.window_id, context: { state, recent: recent.slice() } });

    // Answers, and the waits that end because their pane or window is gone.
    const gone = (w: Wait) =>
      (r.name === Signal.PANE_CLOSED && isWindow(r, w) && w.pane_id !== null && paneOf(r) === w.pane_id)
      || (r.name === Signal.WINDOW_BOOTED && isWindow(r, w))
      || (r.name === Signal.WINDOW_CLOSED && r.process === "main" && w.window_id !== null && r.window_id === w.window_id)
      || (r.name === Signal.APP_QUIT_REQUESTED && r.process === "main" && w.rule !== "T3")
      // A server that exits binds and starts nothing; SERVER_EXITED is its incident (v0.24, P-0.24-T1-T2-END-AT-EXIT).
      || (r.name === Signal.SERVER_EXITED && r.process === "main" && (w.rule === "T1" || w.rule === "T2"));
    waits = waits.filter((w) => !w.answers(r) && !gone(w));

    // New waits.
    switch (r.process === "main" ? r.name : "") {
      case Signal.SERVER_SPAWNED: wait("T1", r, (x) => x.process === "main" && x.name === Signal.SERVER_BOUND); break;
      case Signal.APP_QUIT_REQUESTED: quitting = true; wait("T3", r, (x) => x.process === "main" && x.name === Signal.APP_QUIT_COMPLETED); break;
      case Signal.SERVER_BOUND:
        if (!serverPorts.has(p.port)) wait("T2", r, (x) => x.process === "server" && x.name === Signal.SERVER_STARTED && x.payload?.port === p.port);
        break;
    }
    if (r.process === "window" && paneOf(r) !== null) {
      const on = (x: CheckedRecord) => x.process === "window" && x.window_id === r.window_id && paneOf(x) === paneOf(r);
      switch (r.name) {
        case Signal.STREAM_ENVELOPE_APPENDED:
          wait("T4", r, (x) => on(x) && (x.name === Signal.TRANSCRIPT_ROW_DRAWN || x.name === Signal.TRANSCRIPT_ROW_SKIPPED) && x.payload?.seq === p.seq); break;
        case Signal.SESSION_OPEN_REQUESTED:
          wait("T5", r, (x) => on(x) && (x.name === Signal.SESSION_OPEN_ACKED || x.name === Signal.SESSION_OPEN_REFUSED)); break;
        case Signal.TURN_SUBMITTED:
          wait("T6", r, (x) => on(x) && (x.name === Signal.TURN_ACK || x.name === Signal.TURN_REFUSED || x.name === Signal.TURN_REFUSED_VIEW_ONLY)); break;
      }
    }

    const stream = r.process === "window" ? `window-${r.window_id}` : r.process;
    if (!started.has(stream)) {
      started.add(stream);
      const first = r.process === "main" ? Signal.APP_BOOTED : r.process === "server" ? Signal.SERVER_STARTED : Signal.WINDOW_BOOTED;
      // A server that dies before it binds writes the SERVER_UNCAUGHT it dies of first (v0.24, P-0.24-S1-SERVER-CRASH).
      const crashed = r.process === "server" && r.name === Signal.SERVER_UNCAUGHT;
      if (r.name !== first && !crashed) broke("S1", { process: r.process, window_id: r.window_id, first: r.name, expected: first });
    }

    // The server's records, counted; each window record checked against them.
    const sid = String(p.session_id);
    if (r.process === "server") {
      if (r.name === Signal.SERVER_STARTED) serverPorts.add(p.port);
      if (r.name === Signal.SESSION_CREATED) bump(created, sid);
      if (r.name === Signal.TURN_ACCEPTED) bump(accepted, sid);
      if (r.name === Signal.API_REFUSED) bump(serverRefused, String(p.area));
      return out;
    }
    if (r.process === "window") {
      if (r.name === Signal.SESSION_OPEN_ACKED) {
        const n = bump(acked, sid);
        if (n > 1 || created.get(sid) !== 1) broke("S7", { pane_id: paneOf(r), session_id: p.session_id, window_acks: n, server_created: created.get(sid) ?? 0 });
      }
      if (r.name === Signal.TURN_ACK) {
        const n = bump(turnAcks, sid);
        if (n > (accepted.get(sid) ?? 0)) broke("S8", { pane_id: paneOf(r), session_id: p.session_id, window_acks: n, server_accepted: accepted.get(sid) ?? 0 });
      }
      const area = REFUSAL_AREA[r.name];
      if (area && !NOT_THE_SERVERS.has(String(p.failure_class))) {
        const n = bump(windowRefused, area);
        if (n > (serverRefused.get(area) ?? 0)) broke("S9", { pane_id: paneOf(r), area, failure_class: p.failure_class, window_refusals: n, server_refusals: serverRefused.get(area) ?? 0 });
      }
    }

    const paneId = paneOf(r);
    if (r.process !== "window" || paneId === null) return out;
    const key = `${r.window_id}:${paneId}`;
    if (r.name === Signal.PANE_CLOSED) {
      if (panes.get(key)?.awaitingBind) broke("S4", { pane_id: paneId, committed: true, bound: false, by: r.name });
      panes.delete(key);
      return out;
    }
    let st = panes.get(key);
    if (!st) {
      st = { armed: false, lastLine: null, awaitingBind: false, openRequested: false, session: null };
      panes.set(key, st);
    }

    switch (r.name) {
      case Signal.PANE_OPENED:
        st.armed = false; st.lastLine = null; break;
      case Signal.PICKER_FOLDER_ARMED:
        st.armed = true; st.lastLine = null; break;
      case Signal.PICKER_FOLDER_DISARMED:
        st.armed = false; st.lastLine = null; break;
      case Signal.PICKER_LINE_ENTERED:
        if (!st.armed) broke("S3", { pane_id: paneId, armed: false, line: p.line });
        st.lastLine = p.line; break;
      case Signal.PICKER_COMMITTED:
        if (st.lastLine !== PickerLineEnteredLine.TONE) broke("S4", { pane_id: paneId, last_line: st.lastLine });
        if (st.awaitingBind) broke("S4", { pane_id: paneId, committed: true, bound: false, by: r.name });
        st.awaitingBind = true; break;
      case Signal.PANE_BOUND:
        if (st.awaitingBind && p.how !== PaneBoundHow.PICKER) broke("S4", { pane_id: paneId, committed: true, how: p.how });
        st.awaitingBind = false; break;
      case Signal.SESSION_OPEN_REQUESTED:
        st.openRequested = true; break;
      case Signal.SESSION_OPEN_REFUSED:
        st.openRequested = false; break;
      case Signal.SESSION_OPEN_ACKED:
      case Signal.SESSION_ATTACH_STARTED:
        if (r.name === Signal.SESSION_OPEN_ACKED) {
          if (!st.openRequested) broke("S6", { pane_id: paneId, open_requested: false });
          st.openRequested = false;
        }
        st.session = p.session_id; break;
      case Signal.TRANSCRIPT_ROW_DRAWN:
      case Signal.TRANSCRIPT_ROW_SKIPPED:
        if (st.session !== null && p.session_id != null && p.session_id !== st.session) {
          broke("S5", { pane_id: paneId, pane_session: st.session, row_session: p.session_id, seq: p.seq });
        }
        break;
      case Signal.TURN_SUBMITTED:
        if (p.session_id !== st.session) broke("S8", { pane_id: paneId, turn_session: p.session_id, pane_session: st.session });
        break;
      case Signal.TRANSCRIPT_SCROLLED:
        if (p.following === true && p.pinned === false && p.at_bottom !== true) {
          broke("E8", { pane_id: paneId, following: p.following, pinned: p.pinned, at_bottom: p.at_bottom });
        }
        break;
    }
    return out;
  }

  return { see, tick };
}
