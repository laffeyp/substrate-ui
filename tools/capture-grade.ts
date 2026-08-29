#!/usr/bin/env npx tsx
/**
 * tools/capture-grade.ts
 *
 * Reads a JSONL signal capture (produced by a Playwright harness that reads
 * window.__signals at run end) and grades it against invariants declared per sprint.
 *
 * Two check families:
 *   1. Contains-in-order — every tag in EXPECTED_ORDER appears in the capture in that order.
 *      Extra tags are allowed; the capture must be a supersequence of EXPECTED_ORDER.
 *   2. Pairing invariants — declared per (name, followed-by, window_ms) triples.
 *
 * Both come from substrate-ui/signals/versions/0.1.json's `invariants` narrative,
 * translated here into runnable checks.
 *
 * Usage: node tools/capture-grade.js <path-to-capture.jsonl>
 * Exit:  0 on all checks green, 1 on any fail, 2 on file / parse error.
 */

import { readFileSync } from "node:fs";

type SignalRecord = {
  ts: number;
  name: string;
  category: string;
  stratum: string;
  payload: Record<string, unknown>;
  subject_record?: string;
};

// Sprint 032: EXPECTED_ORDER is now per-fixture-kind. --kind console (default) grades the console
// fixture; --kind studio grades the studio fixture written by capture_studio_signals.js.
// Sprint 035: session fixture — a narrow session-flow capture written by
// harness/capture_terminal_session.js. The four driver_session tags in the
// order they must fire, plus the two view-scope framers.
const EXPECTED_ORDER_SESSION: string[] = [
  "SESSION_INIT",
  "VIEW_SWITCHED",
  "DRIVER_SESSION_STARTED",
  "USER_MESSAGE_INJECTED",
  "PARK_LANDED",
  "DRIVER_SESSION_ENDED",
];

const EXPECTED_ORDER_STUDIO: string[] = [
  "SESSION_INIT",
  "CANVAS_TOGGLED",
  "SPEC_ROW_ADDED",
  "SPEC_ROW_REMOVED",
  "SPEC_VALIDATE_REQUESTED",
  "SPEC_VALIDATED",
  "SPEC_BUILD_REQUESTED",
  "SPEC_BUILT",
  "CONSOLE_LINK_FOLLOWED",
  "SESSION_ENDED",
];

// Minimum contains-in-order for a boot-and-first-render capture. Extended per sprint.
// Sprint 021 extension: after boot, a record-selection round-trip and a prune fire before unload.
const EXPECTED_ORDER: string[] = [
  "SESSION_INIT",
  "RECORDS_LOADED",
  "RECORD_SELECTED",
  "RECORD_LOAD_BEGIN",
  "RECORD_LOADED",
  "ASSAYS_LOADED",     // Sprint 027: loadAssays() runs after loadRecords in boot
  "GRAPH_RENDERED",    // Sprint 022: first paint after auto-select
  "STREAM_RENDERED",   // Sprint 023: stream repaints on every non-io render()
  "HEALTH_RENDERED",   // Sprint 022: paired with each render()
  "DIFF_REQUESTED",    // Sprint 027: harness picks a diff target right after boot
  "DIFF_RENDERED",     // Sprint 027
  "PANE_SWITCHED",     // Sprint 022: harness toggles topology
  "TOPOLOGY_RENDERED",
  "SPEED_CHANGED",
  "PLAY_STARTED",
  "PLAY_STOPPED",
  "CURSOR_MOVED",
  "EVENT_INSPECTED",   // Sprint 023: harness clicks an event row
  "PRODUCER_INSPECTED", // Sprint 023: harness clicks a producer lane
  "TERMINAL_OPENED",   // Sprint 024: harness opens terminal
  "MODEL_SELECTED",    // Sprint 024: harness changes picker
  "PARAMS_CHANGED",    // Sprint 024: think + tokens + timeout
  "CHAT_ENTERED",      // Sprint 024: harness types `chat`
  "TURN_SUBMITTED",    // Sprint 025: harness sends one message inside chat
  "AGENT_LAUNCH_REQUESTED",  // Sprint 025
  "AGENT_LAUNCHED",    // Sprint 025
  "AGENT_TURN_STREAMED", // Sprint 025 (deterministic driver returns immediately)
  "FINAL_ANSWER_RENDERED", // Sprint 025
  "CHAT_EXITED",       // Sprint 024: harness types `/exit`
  "TERMINAL_CLOSED",   // Sprint 024: harness closes terminal
  "TOPOLOGY_LAUNCH_REQUESTED", // Sprint 026
  "TOPOLOGY_LAUNCHED",  // Sprint 026
  "STUDIO_OPENED",      // Sprint 026
  "LAUNCH_REJECTED",    // Sprint 028: harness attempts a bogus topology launch
  "FETCH_FAILED",       // Sprint 028: harness triggers a bad-name fetch
  "RECORDS_PRUNED",
  "SESSION_ENDED",
];

// Vocab invariant #7 verbatim: TURN_SUBMITTED only fires inside a CHAT_ENTERED → CHAT_EXITED
// window; any TURN_SUBMITTED outside any open window is a fail. Vacuous pass when the capture
// carries no TURN_SUBMITTED events yet (Sprint 024 lands the check; Sprint 025 exercises it).
function checkTurnInsideChatWindow(capture: SignalRecord[]): boolean {
  let inChat = false;
  let checked = 0;
  let ok = true;
  for (const s of capture) {
    if (s.name === "CHAT_ENTERED") inChat = true;
    else if (s.name === "CHAT_EXITED") inChat = false;
    else if (s.name === "TURN_SUBMITTED") {
      checked += 1;
      if (!inChat) {
        console.error(`[grade] TURN_SUBMITTED FAIL: fired outside a CHAT_ENTERED → CHAT_EXITED window at ts=${s.ts}.`);
        ok = false;
      }
    }
  }
  console.log(`[grade] TURN_SUBMITTED inside CHAT_ENTERED→CHAT_EXITED: ${checked === 0 ? "VACUOUS PASS" : ok ? `PASS (${checked} checked)` : "FAIL"}.`);
  return ok;
}

// Payload-content checks for inspector tags (vocab § invariant #9: inspector references match state).
function checkInspectorPayloads(capture: SignalRecord[]): boolean {
  let ok = true;
  for (const s of capture) {
    if (s.name === "EVENT_INSPECTED") {
      if (typeof s.payload.seq !== "number" || (s.payload.seq as number) < 0) {
        console.error(`[grade] EVENT_INSPECTED payload FAIL: seq=${JSON.stringify(s.payload.seq)} (must be non-negative number).`); ok = false;
      }
      if (typeof s.payload.kind !== "string" || !(s.payload.kind as string).length) {
        console.error(`[grade] EVENT_INSPECTED payload FAIL: kind empty.`); ok = false;
      }
    }
    if (s.name === "PRODUCER_INSPECTED") {
      if (typeof s.payload.instance !== "string" || !(s.payload.instance as string).length) {
        console.error(`[grade] PRODUCER_INSPECTED payload FAIL: instance empty.`); ok = false;
      }
      if (typeof s.payload.kind !== "string" || !(s.payload.kind as string).length) {
        console.error(`[grade] PRODUCER_INSPECTED payload FAIL: kind empty.`); ok = false;
      }
    }
  }
  console.log(`[grade] inspector payload contents: ${ok ? "PASS" : "FAIL"}.`);
  return ok;
}

type Pairing = {
  when: string;
  then: string;
  within_ms: number;
  match?: (a: SignalRecord, b: SignalRecord) => boolean;
  note: string;
};

// Vocab invariant #5: AGENT_LAUNCH_REQUESTED is followed within 1 s by AGENT_LAUNCHED OR
// LAUNCH_REJECTED{kind: agent}. Sprint 025 wires launches; Sprint 028 wires rejections.
// Vocab invariant #6: every AGENT_LAUNCHED terminated by EXACTLY ONE FINAL_ANSWER_RENDERED OR
// POLL_TIMEOUT with matching run_name.
function checkAgentLaunchTerminate(capture: SignalRecord[]): boolean {
  let ok = true;
  // #5: within 1 s of each AGENT_LAUNCH_REQUESTED, one of {AGENT_LAUNCHED, LAUNCH_REJECTED[agent]}.
  let reqCount = 0;
  for (let i = 0; i < capture.length; i += 1) {
    const s = capture[i];
    if (s.name !== "AGENT_LAUNCH_REQUESTED") continue;
    reqCount += 1;
    const limit = s.ts + 1000;
    let hit = false;
    for (let j = i + 1; j < capture.length; j += 1) {
      const b = capture[j];
      if (b.ts > limit) break;
      if (b.name === "AGENT_LAUNCHED") { hit = true; break; }
      if (b.name === "LAUNCH_REJECTED" && b.payload.kind === "agent") { hit = true; break; }
    }
    if (!hit) {
      console.error(`[grade] AGENT_LAUNCH_REQUESTED FAIL: at ts=${s.ts}, no AGENT_LAUNCHED or LAUNCH_REJECTED{kind:agent} within 1000 ms.`);
      ok = false;
    }
  }
  if (ok && reqCount > 0) console.log(`[grade] pairing (AGENT_LAUNCH_REQUESTED → AGENT_LAUNCHED|LAUNCH_REJECTED): PASS (${reqCount} checked).`);
  // #6: each AGENT_LAUNCHED terminated by exactly one FINAL_ANSWER_RENDERED or POLL_TIMEOUT with
  // matching run_name; more than one termination is a fail.
  let launchCount = 0;
  for (let i = 0; i < capture.length; i += 1) {
    const s = capture[i];
    if (s.name !== "AGENT_LAUNCHED") continue;
    launchCount += 1;
    const runName = s.payload.run_name as string;
    let terms = 0;
    for (let j = i + 1; j < capture.length; j += 1) {
      const b = capture[j];
      if ((b.name === "FINAL_ANSWER_RENDERED" || b.name === "POLL_TIMEOUT") && b.payload.run_name === runName) terms += 1;
    }
    if (terms !== 1) {
      console.error(`[grade] AGENT_LAUNCHED termination FAIL: run_name=${runName}, expected exactly one FINAL_ANSWER_RENDERED or POLL_TIMEOUT termination, saw ${terms}.`);
      ok = false;
    }
  }
  if (ok && launchCount > 0) console.log(`[grade] pairing (AGENT_LAUNCHED → exactly-one FINAL_ANSWER_RENDERED|POLL_TIMEOUT, matching run_name): PASS (${launchCount} checked).`);
  return ok;
}

// Sprint 025 strengthens Sprint 024's chat-window check: CHAT_EXITED.turns_in_conversation must
// equal the count of TURN_SUBMITTED events inside the CHAT_ENTERED → CHAT_EXITED window that
// preceded it. Assistant replies double the convo length inside the app, so the app halves the
// count in its turn_index math; the invariant reads TURN_SUBMITTED count directly.
function checkChatTurnCount(capture: SignalRecord[]): boolean {
  let ok = true;
  let enteredIdx = -1;
  let turnsInWindow = 0;
  for (let i = 0; i < capture.length; i += 1) {
    const s = capture[i];
    if (s.name === "CHAT_ENTERED") { enteredIdx = i; turnsInWindow = 0; continue; }
    if (s.name === "TURN_SUBMITTED" && enteredIdx >= 0) turnsInWindow += 1;
    if (s.name === "CHAT_EXITED" && enteredIdx >= 0) {
      const declared = s.payload.turns_in_conversation as number;
      // convo carries {user, assistant, user, assistant, ...} per app.ts sendChatMessage.
      // TURN_SUBMITTED fires per user turn; CHAT_EXITED.turns_in_conversation is convo.length.
      // Normal case: user + assistant landed → declared = 2 * turnsInWindow.
      // In-flight case: user just sent, assistant not landed → declared = 2 * turnsInWindow - 1.
      // Any other value is drift.
      const expectNormal = turnsInWindow * 2;
      const expectInflight = Math.max(0, turnsInWindow * 2 - 1);
      if (declared !== expectNormal && declared !== expectInflight) {
        console.error(`[grade] CHAT_EXITED.turns_in_conversation FAIL: declared=${declared}, TURN_SUBMITTED count=${turnsInWindow} (expected ${expectNormal} normal or ${expectInflight} in-flight).`);
        ok = false;
      }
      enteredIdx = -1;
    }
  }
  console.log(`[grade] CHAT_EXITED.turns_in_conversation matches TURN_SUBMITTED count: ${ok ? "PASS" : "FAIL"}.`);
  return ok;
}

// Vocab invariant #11 (payload-content, per Layer 7): every incident emits a well-formed payload.
// FETCH_FAILED needs endpoint + status_or_error (both non-empty strings). LAUNCH_REJECTED needs
// kind ∈ {agent, topology, resume} and non-empty reason. POLL_TIMEOUT needs non-empty run_name and
// elapsed_ms > 0. A single check reports all failures; vacuous pass when no incidents fired.
function checkIncidentPayloads(capture: SignalRecord[]): boolean {
  let ok = true;
  const kinds = new Set(["agent", "topology", "resume"]);
  let f = 0, l = 0, t = 0;
  for (const s of capture) {
    if (s.name === "FETCH_FAILED") {
      f += 1;
      if (typeof s.payload.endpoint !== "string" || !s.payload.endpoint.length) { console.error(`[grade] FETCH_FAILED payload FAIL: endpoint empty at ts=${s.ts}.`); ok = false; }
      if (s.payload.status_or_error == null || String(s.payload.status_or_error) === "") { console.error(`[grade] FETCH_FAILED payload FAIL: status_or_error empty at ts=${s.ts}.`); ok = false; }
    }
    if (s.name === "LAUNCH_REJECTED") {
      l += 1;
      if (!kinds.has(s.payload.kind as string)) { console.error(`[grade] LAUNCH_REJECTED payload FAIL: kind=${s.payload.kind} not in {agent, topology, resume}.`); ok = false; }
      if (typeof s.payload.reason !== "string" || !s.payload.reason.length) { console.error(`[grade] LAUNCH_REJECTED payload FAIL: reason empty at ts=${s.ts}.`); ok = false; }
    }
    if (s.name === "POLL_TIMEOUT") {
      t += 1;
      if (typeof s.payload.run_name !== "string" || !s.payload.run_name.length) { console.error(`[grade] POLL_TIMEOUT payload FAIL: run_name empty at ts=${s.ts}.`); ok = false; }
      if (typeof s.payload.elapsed_ms !== "number" || (s.payload.elapsed_ms as number) <= 0) { console.error(`[grade] POLL_TIMEOUT payload FAIL: elapsed_ms=${s.payload.elapsed_ms} must be > 0.`); ok = false; }
    }
  }
  console.log(`[grade] incident payloads (FETCH_FAILED=${f}, LAUNCH_REJECTED=${l}, POLL_TIMEOUT=${t}): ${ok ? "PASS" : "FAIL"}.`);
  return ok;
}

// Vocab invariant #10: TOPOLOGY_LAUNCH_REQUESTED{topology_name: T} is followed within 5 s by
// exactly one TOPOLOGY_LAUNCHED{topology_name: T} OR one LAUNCH_REJECTED{kind: topology}.
function checkTopologyLaunch(capture: SignalRecord[]): boolean {
  let ok = true;
  let checked = 0;
  for (let i = 0; i < capture.length; i += 1) {
    const s = capture[i];
    if (s.name !== "TOPOLOGY_LAUNCH_REQUESTED") continue;
    checked += 1;
    const topo = s.payload.topology_name as string;
    const limit = s.ts + 5000;
    // Bound the search window at the NEXT TOPOLOGY_LAUNCH_REQUESTED so each request binds only
    // to its own resolution — else a later bogus launch's rejection double-counts against the
    // prior success.
    let nextReqTs: number | null = null;
    for (let j = i + 1; j < capture.length; j += 1) {
      if (capture[j].name === "TOPOLOGY_LAUNCH_REQUESTED") { nextReqTs = capture[j].ts; break; }
    }
    const windowEnd = nextReqTs === null ? limit : Math.min(limit, nextReqTs);
    let hits = 0;
    for (let j = i + 1; j < capture.length; j += 1) {
      const b = capture[j];
      if (b.ts > windowEnd) break;
      if (b.name === "TOPOLOGY_LAUNCHED" && b.payload.topology_name === topo) hits += 1;
      else if (b.name === "LAUNCH_REJECTED" && b.payload.kind === "topology") hits += 1;
    }
    if (hits !== 1) {
      console.error(`[grade] TOPOLOGY_LAUNCH_REQUESTED FAIL: topology_name=${topo}, expected exactly one TOPOLOGY_LAUNCHED or LAUNCH_REJECTED{topology} within 5000 ms (or before the next request), saw ${hits}.`);
      ok = false;
    }
  }
  if (ok && checked > 0) console.log(`[grade] pairing (TOPOLOGY_LAUNCH_REQUESTED → TOPOLOGY_LAUNCHED|LAUNCH_REJECTED, exactly-one, matching topology_name): PASS (${checked} checked).`);
  return ok;
}

// Note: agent-launch pairings (invariants #5 and #6) live in checkAgentLaunchTerminate — they
// need exactly-one + LAUNCH_REJECTED-branch semantics that the generic Pairing struct doesn't cover.
const PAIRINGS: Pairing[] = [
  {
    when: "DIFF_REQUESTED",
    then: "DIFF_RENDERED",
    within_ms: 5000,
    match: (a, b) => a.payload.a === b.payload.subject_record,
    note: "DIFF_REQUESTED{a,b} followed within 5s by DIFF_RENDERED whose subject_record matches the a-side.",
  },
  {
    when: "ASSAY_SELECTED",
    then: "ASSAY_REPORT_LOADED",
    within_ms: 5000,
    match: (a, b) => a.payload.name === b.payload.name,
    note: "ASSAY_SELECTED followed within 5s by ASSAY_REPORT_LOADED with matching name.",
  },
];

function loadJsonl(path: string): SignalRecord[] {
  let raw: string;
  try { raw = readFileSync(path, "utf8"); }
  catch (e) { console.error(`[grade] cannot read ${path}: ${(e as Error).message}`); process.exit(2); }
  const out: SignalRecord[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line) as SignalRecord); }
    catch (e) { console.error(`[grade] malformed JSONL line: ${line.slice(0, 80)}...`); process.exit(2); }
  }
  return out;
}

function containsInOrder(capture: SignalRecord[], expected: string[]): boolean {
  let i = 0;
  for (const sig of capture) {
    if (i < expected.length && sig.name === expected[i]) i += 1;
  }
  if (i < expected.length) {
    console.error(`[grade] CONTAINS-IN-ORDER FAIL: missing tags after index ${i}: ${expected.slice(i).join(", ")}`);
    return false;
  }
  console.log(`[grade] contains-in-order: PASS (all ${expected.length} expected tags in sequence).`);
  return true;
}

function checkPairing(capture: SignalRecord[], p: Pairing): boolean {
  let ok = true;
  let checked = 0;
  for (let i = 0; i < capture.length; i += 1) {
    const a = capture[i];
    if (a.name !== p.when) continue;
    checked += 1;
    const limitTs = a.ts + p.within_ms;
    let matched = false;
    for (let j = i + 1; j < capture.length; j += 1) {
      const b = capture[j];
      if (b.ts > limitTs) break;
      if (b.name === p.then && (!p.match || p.match(a, b))) { matched = true; break; }
    }
    if (!matched) {
      console.error(`[grade] PAIRING FAIL (${p.when} → ${p.then}): at index ${i} (ts=${a.ts}), no matching ${p.then} within ${p.within_ms}ms.`);
      console.error(`  ${p.note}`);
      ok = false;
    }
  }
  if (ok && checked > 0) console.log(`[grade] pairing (${p.when} → ${p.then}): PASS (${checked} checked).`);
  return ok;
}

// Vocab invariant #3 verbatim: every PANE_SWITCHED{to_pane: V} is followed within one repaint
// cycle (~1 s) by exactly one pane-render tag whose pane_id matches V and whose subject_record
// matches STATE.name at the time of the switch. Also assert `frame` is monotonic across the
// capture — the paint counter never decreases (view stratum § note).
const VIEW_TO_PANE_TAG: Record<string, string> = {
  run: "GRAPH_RENDERED",
  topology: "TOPOLOGY_RENDERED",
  scene: "SCENE_RENDERED",
  io: "IO_RENDERED",
};
const VIEW_TO_PANE_ID: Record<string, string> = {
  run: "graph_run",
  topology: "topology",
  scene: "scene",
  io: "io",
};
// Sprint 033 / v0.7.1 TAG_SPLIT: view-scope container flips fire VIEW_SWITCHED,
// not PANE_SWITCHED. Their closed set — the two piece-G view containers.
const VIEW_SWITCHED_VIEWS = new Set(["desktop", "terminal"]);
// Desktop side re-mounts an inner pane on flip-in; the terminal side is
// empty until sprint 035 lands `web/terminal.ts` and its own render tag.
const VIEW_SWITCHED_PAIRING_REQUIRED = new Set(["desktop"]);

function checkViewSwitchedRender(capture: SignalRecord[]): boolean {
  const paneTags = new Set(Object.values(VIEW_TO_PANE_TAG));
  let ok = true;
  let checked = 0;
  for (let i = 0; i < capture.length; i += 1) {
    const sw = capture[i];
    if (sw.name !== "PANE_SWITCHED") continue;
    checked += 1;
    const toPane = sw.payload.to_pane as string;
    const subject = sw.payload.subject_record as string;
    const expectedTag = VIEW_TO_PANE_TAG[toPane];
    const expectedPaneId = VIEW_TO_PANE_ID[toPane];
    if (!expectedTag) {
      console.error(`[grade] PANE_SWITCHED FAIL: to_pane=${toPane} at index ${i} — no pane-render tag defined for this view.`);
      ok = false; continue;
    }
    // Vocab invariant: the switch is honored by the NEXT paint (one paint cycle). Find the first
    // pane-render tag with matching subject_record that appears after the switch; that render must
    // be the expected pane and must arrive within 500 ms (a generous paint cycle for a live browser).
    // Subsequent renders (from unrelated repaints, transport, etc.) are not part of this contract.
    let firstMatch: SignalRecord | null = null;
    let firstMatchIdx = -1;
    for (let j = i + 1; j < capture.length; j += 1) {
      const b = capture[j];
      if (!paneTags.has(b.name)) continue;
      if (b.payload.subject_record !== subject) continue;
      firstMatch = b; firstMatchIdx = j; break;
    }
    if (!firstMatch) {
      console.error(`[grade] PANE_SWITCHED FAIL: at index ${i} (to_pane=${toPane}), no pane-render with matching subject_record ever fires afterward.`);
      ok = false; continue;
    }
    if (firstMatch.ts - sw.ts > 500) {
      console.error(`[grade] PANE_SWITCHED FAIL: at index ${i} (to_pane=${toPane}), first pane-render (${firstMatch.name}) arrived ${(firstMatch.ts - sw.ts).toFixed(1)}ms later (limit 500ms).`);
      ok = false; continue;
    }
    if (firstMatch.name !== expectedTag || firstMatch.payload.pane_id !== expectedPaneId) {
      console.error(`[grade] PANE_SWITCHED FAIL: at index ${i} (to_pane=${toPane}), first pane-render was ${firstMatch.name}{pane_id=${firstMatch.payload.pane_id}} at idx ${firstMatchIdx}; expected ${expectedTag}{pane_id=${expectedPaneId}}.`);
      ok = false;
    }
  }
  if (ok && checked > 0) console.log(`[grade] pairing (PANE_SWITCHED → next pane-render matches to_pane): PASS (${checked} checked).`);
  return ok;
}

// Sprint 035: driver-session bookend pairing. Every DRIVER_SESSION_STARTED
// with session_id S is followed by exactly one DRIVER_SESSION_ENDED with the
// same session_id within the capture; every USER_MESSAGE_INJECTED{session_id
// S, turn_index N} is followed by exactly one PARK_LANDED with the same
// {S, N}. If DRIVER_SESSION_STARTED never fires, the check is vacuously PASS
// (a small fixture may not open a session).
function checkDriverSessionBookends(capture: SignalRecord[]): boolean {
  let ok = true;
  const starts = capture.filter((s) => s.name === "DRIVER_SESSION_STARTED");
  for (const start of starts) {
    const sid = start.payload.session_id as string;
    const ended = capture.find((s) => s.name === "DRIVER_SESSION_ENDED" && s.payload.session_id === sid && s.ts >= start.ts);
    if (!ended) {
      console.error(`[grade] DRIVER_SESSION_BOOKEND FAIL: DRIVER_SESSION_STARTED{session_id=${sid}} has no matching DRIVER_SESSION_ENDED in the capture.`);
      ok = false;
    }
  }
  const injects = capture.filter((s) => s.name === "USER_MESSAGE_INJECTED");
  for (const inj of injects) {
    const sid = inj.payload.session_id as string;
    const turnIdx = inj.payload.turn_index as number;
    const parked = capture.find((s) => s.name === "PARK_LANDED"
      && s.payload.session_id === sid
      && s.payload.turn_index === turnIdx
      && s.ts >= inj.ts);
    if (!parked) {
      console.error(`[grade] DRIVER_SESSION_BOOKEND FAIL: USER_MESSAGE_INJECTED{session_id=${sid}, turn_index=${turnIdx}} has no matching PARK_LANDED.`);
      ok = false;
    }
  }
  if (ok) {
    const label = starts.length ? `${starts.length} session(s), ${injects.length} turn(s)` : "no sessions in fixture (vacuous)";
    console.log(`[grade] driver-session bookends: PASS (${label}).`);
  }
  return ok;
}

// v0.7.1 TAG_SPLIT: VIEW_SWITCHED{to_view, prior_view, subject_record} carries
// view-scope container flips (desktop ⇄ terminal). Closed set enforced against
// VIEW_SWITCHED_VIEWS. Desktop side re-mounts an inner pane on flip-in and the
// existing pane-render pairing (checkViewSwitchedRender's family) must fire;
// terminal side is empty until sprint 035 and pairs with nothing.
function checkViewSwitched(capture: SignalRecord[]): boolean {
  let ok = true;
  let checked = 0;
  const paneTags = new Set(Object.values(VIEW_TO_PANE_TAG));
  for (let i = 0; i < capture.length; i += 1) {
    const sw = capture[i];
    if (sw.name !== "VIEW_SWITCHED") continue;
    checked += 1;
    const toView = sw.payload.to_view as string;
    const priorView = sw.payload.prior_view as string;
    if (!VIEW_SWITCHED_VIEWS.has(toView)) {
      console.error(`[grade] VIEW_SWITCHED FAIL: to_view=${toView} at index ${i} — outside closed set {desktop, terminal}.`);
      ok = false; continue;
    }
    if (!VIEW_SWITCHED_VIEWS.has(priorView)) {
      console.error(`[grade] VIEW_SWITCHED FAIL: prior_view=${priorView} at index ${i} — outside closed set {desktop, terminal}.`);
      ok = false; continue;
    }
    if (toView === priorView) {
      console.error(`[grade] VIEW_SWITCHED FAIL: to_view === prior_view === ${toView} at index ${i} — a flip is a state change.`);
      ok = false; continue;
    }
    if (!VIEW_SWITCHED_PAIRING_REQUIRED.has(toView)) continue;
    // Desktop-side pairing: within 500ms, one of the four *_RENDERED tags must
    // fire with matching subject_record (the desktop container remounts its
    // inner pane on flip-in).
    const subject = sw.payload.subject_record as string | null;
    let matched = false;
    for (let j = i + 1; j < capture.length; j += 1) {
      const b = capture[j];
      if (!paneTags.has(b.name)) continue;
      if (b.payload.subject_record !== subject) continue;
      if (b.ts - sw.ts > 500) break;
      matched = true; break;
    }
    if (!matched) {
      console.error(`[grade] VIEW_SWITCHED FAIL: to_view=desktop at index ${i} — no {${[...paneTags].join(",")}} with matching subject_record fired within 500ms.`);
      ok = false;
    }
  }
  if (ok) console.log(`[grade] VIEW_SWITCHED (closed set + desktop pairing): PASS (${checked} checked).`);
  return ok;
}

// Vocab invariants #1 + #2 (v0.4): SESSION_INIT is the absolute first signal; SESSION_ENDED,
// when present, is the absolute last. containsInOrder only checks position within EXPECTED_ORDER;
// this enforces position within the whole capture.
function checkSessionBookends(capture: SignalRecord[]): boolean {
  let ok = true;
  if (capture.length && capture[0].name !== "SESSION_INIT") {
    console.error(`[grade] SESSION_INIT FAIL: first signal is ${capture[0].name}, not SESSION_INIT.`);
    ok = false;
  }
  const endedIdx = capture.findIndex((s) => s.name === "SESSION_ENDED");
  if (endedIdx >= 0 && endedIdx !== capture.length - 1) {
    console.error(`[grade] SESSION_ENDED FAIL: fires at index ${endedIdx} of ${capture.length}, must be the absolute last signal.`);
    ok = false;
  }
  if (ok) console.log(`[grade] session bookends (SESSION_INIT first, SESSION_ENDED last): PASS.`);
  return ok;
}

function checkFrameMonotonic(capture: SignalRecord[]): boolean {
  const paneTags = new Set(["GRAPH_RENDERED", "TOPOLOGY_RENDERED", "SCENE_RENDERED", "IO_RENDERED", "HEALTH_RENDERED", "STREAM_RENDERED", "DIFF_RENDERED"]);
  let last = 0;
  let seen = 0;
  for (const sig of capture) {
    if (!paneTags.has(sig.name)) continue;
    const f = sig.payload.frame as number;
    seen += 1;
    if (typeof f !== "number" || f <= last) {
      console.error(`[grade] FRAME MONOTONIC FAIL: ${sig.name} frame=${f} after ${last}.`);
      return false;
    }
    last = f;
  }
  console.log(`[grade] frame monotonic across pane-render tags: PASS (${seen} paints, ${last} peak).`);
  return true;
}

// Vocab invariant #4 verbatim: every RECORD_SELECTED is followed within 5 s by EXACTLY ONE
// matching-name RECORD_LOADED; if a superseding RECORD_SELECTED (a different name) fires first,
// no RECORD_LOADED for the first name may appear afterward — the staleness guard dropped it.
function checkRecordSelectedLoaded(capture: SignalRecord[]): boolean {
  let ok = true;
  let checked = 0;
  for (let i = 0; i < capture.length; i += 1) {
    const sel = capture[i];
    if (sel.name !== "RECORD_SELECTED") continue;
    checked += 1;
    const selName = sel.payload.name as string;
    const limitTs = sel.ts + 5000;
    // Find the next RECORD_SELECTED (with a different name) — that's the supersede boundary.
    let supersedeTs: number | null = null;
    for (let j = i + 1; j < capture.length; j += 1) {
      const b = capture[j];
      if (b.name === "RECORD_SELECTED" && b.payload.name !== selName) { supersedeTs = b.ts; break; }
    }
    const windowEnd = supersedeTs === null ? limitTs : Math.min(limitTs, supersedeTs);
    // Count matching-name RECORD_LOADED in [sel.ts, windowEnd].
    let loadedInWindow = 0;
    for (let j = i + 1; j < capture.length; j += 1) {
      const b = capture[j];
      if (b.ts > windowEnd) break;
      if (b.name === "RECORD_LOADED" && b.payload.name === selName) loadedInWindow += 1;
    }
    // Count matching-name RECORD_LOADED AFTER the supersede (staleness-drop must hold).
    let loadedAfterSupersede = 0;
    if (supersedeTs !== null) {
      for (let j = i + 1; j < capture.length; j += 1) {
        const b = capture[j];
        if (b.ts <= supersedeTs) continue;
        if (b.name === "RECORD_LOADED" && b.payload.name === selName) loadedAfterSupersede += 1;
      }
    }
    if (supersedeTs === null) {
      if (loadedInWindow !== 1) {
        console.error(`[grade] PAIRING FAIL (RECORD_SELECTED → RECORD_LOADED): at index ${i} (name=${selName}), expected exactly one matching-name RECORD_LOADED within 5000ms, saw ${loadedInWindow}.`);
        ok = false;
      }
    } else {
      // Superseded: either the first-load-then-supersede case (exactly one before supersede, none after)
      // OR the staleness-drop case (zero before supersede, zero after).
      if (!((loadedInWindow === 1 && loadedAfterSupersede === 0) || (loadedInWindow === 0 && loadedAfterSupersede === 0))) {
        console.error(`[grade] PAIRING FAIL (RECORD_SELECTED → RECORD_LOADED, superseded): at index ${i} (name=${selName}), pre-supersede matches=${loadedInWindow}, post-supersede matches=${loadedAfterSupersede}. Staleness guard requires post-supersede count=0; pre-supersede count must be 0 (staleness-drop) or 1 (in-time load).`);
        ok = false;
      }
    }
  }
  if (ok && checked > 0) console.log(`[grade] pairing (RECORD_SELECTED → RECORD_LOADED, exactly-one + staleness-drop): PASS (${checked} checked).`);
  return ok;
}

// Sprint 032: studio-specific pairings (SPEC_VALIDATE_REQUESTED → SPEC_VALIDATED, SPEC_BUILD_REQUESTED
// → SPEC_BUILT | SPEC_BUILD_REJECTED). Kept as a distinct function so the console grader stays lean.
function checkStudioPairings(capture: SignalRecord[]): boolean {
  let ok = true;
  let vChecked = 0, bChecked = 0;
  for (let i = 0; i < capture.length; i += 1) {
    const s = capture[i];
    if (s.name === "SPEC_VALIDATE_REQUESTED") {
      vChecked += 1;
      const limit = s.ts + 5000;
      let hits = 0;
      for (let j = i + 1; j < capture.length; j += 1) {
        const b = capture[j];
        if (b.ts > limit) break;
        if (b.name === "SPEC_VALIDATED") hits += 1;
      }
      if (hits !== 1) { console.error(`[grade] SPEC_VALIDATE_REQUESTED FAIL: at ts=${s.ts}, expected exactly one SPEC_VALIDATED within 5000ms, saw ${hits}.`); ok = false; }
    }
    if (s.name === "SPEC_BUILD_REQUESTED") {
      bChecked += 1;
      const limit = s.ts + 30000;
      let hits = 0;
      for (let j = i + 1; j < capture.length; j += 1) {
        const b = capture[j];
        if (b.ts > limit) break;
        if (b.name === "SPEC_BUILT" || b.name === "SPEC_BUILD_REJECTED") hits += 1;
      }
      if (hits !== 1) { console.error(`[grade] SPEC_BUILD_REQUESTED FAIL: at ts=${s.ts}, expected exactly one SPEC_BUILT or SPEC_BUILD_REJECTED within 30000ms, saw ${hits}.`); ok = false; }
    }
  }
  if (ok && vChecked > 0) console.log(`[grade] pairing (SPEC_VALIDATE_REQUESTED → SPEC_VALIDATED): PASS (${vChecked} checked).`);
  if (ok && bChecked > 0) console.log(`[grade] pairing (SPEC_BUILD_REQUESTED → SPEC_BUILT|SPEC_BUILD_REJECTED): PASS (${bChecked} checked).`);
  return ok;
}

type FixtureKind = "console" | "studio" | "session";

function main(): void {
  // Args: capture-grade.ts <path> [--kind console|studio|session]. Default console.
  const args = process.argv.slice(2);
  let path: string | null = null;
  let kind: FixtureKind = "console";
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--kind" && args[i + 1]) { kind = args[i + 1] as FixtureKind; i += 1; }
    else if (!path) path = args[i];
  }
  if (!path) { console.error("[grade] usage: capture-grade.ts <path-to-capture.jsonl> [--kind console|studio|session]"); process.exit(2); }

  const capture = loadJsonl(path);
  console.log(`[grade] loaded ${capture.length} signals from ${path} (kind=${kind})`);

  let ok = true;
  // Vocab invariants #1 + #2 apply to both kinds.
  ok = checkSessionBookends(capture) && ok;
  if (kind === "studio") {
    ok = containsInOrder(capture, EXPECTED_ORDER_STUDIO) && ok;
    ok = checkStudioPairings(capture) && ok;
  } else if (kind === "session") {
    // Sprint 035: session fixture is a narrow driver-session flow. Grade the
    // bookend pairing, the closed-set + view-scope invariants that framed
    // the flow, and the driver-session expected order. Skip the console-flow
    // checks (record-select round-trip, agent-launch, inspector) — a
    // session fixture never exercises them.
    ok = containsInOrder(capture, EXPECTED_ORDER_SESSION) && ok;
    ok = checkViewSwitched(capture) && ok;
    ok = checkDriverSessionBookends(capture) && ok;
  } else {
    ok = containsInOrder(capture, EXPECTED_ORDER) && ok;
    ok = checkRecordSelectedLoaded(capture) && ok;
    ok = checkViewSwitchedRender(capture) && ok;
    ok = checkViewSwitched(capture) && ok;
    ok = checkDriverSessionBookends(capture) && ok;
    ok = checkFrameMonotonic(capture) && ok;
    ok = checkInspectorPayloads(capture) && ok;
    ok = checkTurnInsideChatWindow(capture) && ok;
    ok = checkAgentLaunchTerminate(capture) && ok;
    ok = checkTopologyLaunch(capture) && ok;
    ok = checkIncidentPayloads(capture) && ok;
    ok = checkChatTurnCount(capture) && ok;
    for (const p of PAIRINGS) ok = checkPairing(capture, p) && ok;
  }

  if (!ok) { console.error("[grade] FAIL"); process.exit(1); }
  console.log("[grade] PASS");
}

main();
