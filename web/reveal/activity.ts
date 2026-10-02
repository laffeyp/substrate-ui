// The activity strip above the prompt: what the current turn is doing, or how the last one
// ended. Moved out of reveal_component.ts (UI sprint 101) so it can be tested without the
// template runtime; Component._liveActivity delegates here.

import { EnvelopeKind } from "../vm/kinds";

export interface Activity {
  kind: "live" | "recap" | "failed";
  verb?: string;
  seconds?: number;
  turnWord: string;
  turnColor: string;
  restText: string;
  hasRest: boolean;
  color: string;
  pulseOn: boolean;
}

// The snapshot arrives untyped from the dc-runtime component.
export function liveActivity(snap: any): Activity | null {
  // The activity strip above the prompt has three states.
  // Live: the most recent UserMessage has no Park after it — a turn
  //   is running. The verb names what is happening RIGHT NOW: the
  //   name of the currently-open ToolCall if one is unpaired, else
  //   "thinking". Seconds count up from the UserMessage; the tool
  //   counter grows as ToolCalls in this turn accumulate. A CSS
  //   pulse on the glyph and a shimmer bar under the row read as
  //   "something is happening" between envelopes.
  // Recap: the last Park landed after the last UserMessage. Turn is
  //   done. Report turn index, elapsed, tools, park reason.
  // Empty: no session or no envelopes.
  if (!snap || !Array.isArray(snap.rawEnvelopes) || !snap.rawEnvelopes.length) return null;
  const envs = snap.rawEnvelopes;
  const nowSec = Date.now() / 1000;
  // Find the last UserMessage and last Park/SessionEnded by seq.
  let lastUM = null, lastPark = null, lastParkKind = '';
  for (let i = envs.length - 1; i >= 0; i--) {
    const e = envs[i];
    if (!lastPark && (e.kind === EnvelopeKind.Park || e.kind === EnvelopeKind.SessionEnded)) { lastPark = e; lastParkKind = e.kind; }
    if (!lastUM && e.kind === EnvelopeKind.UserMessage) lastUM = e;
    if (lastUM && lastPark) break;
  }
  if (!lastUM) return null;
  const umSeq = typeof lastUM.seq === 'number' ? lastUM.seq : -1;
  const parkSeq = lastPark && typeof lastPark.seq === 'number' ? lastPark.seq : -1;
  const turnIsLive = !lastPark || umSeq > parkSeq;
  const turnIdx = lastUM.payload && typeof lastUM.payload.turn_index === 'number' ? lastUM.payload.turn_index : null;
  // UI sprint 101: a turn with no Park after it is not necessarily running. When the turn
  // request failed (timeout, server error) or the server said at attach that the session was
  // not running, the turn is over: show it ended, in red, without the pulse or a clock that
  // keeps counting. Statecharts: every state needs its exits, failure included.
  const fail = snap.turnFailure;
  const umTime = typeof lastUM.t === 'number' ? lastUM.t : nowSec;
  if (turnIsLive && fail && umTime <= fail.atT) {
    let failTools = 0;
    for (const e of envs) {
      if (typeof e.seq === 'number' && e.seq >= umSeq && e.kind === EnvelopeKind.ToolCall) failTools++;
    }
    const lastT = envs.reduce((m: number, e: any) => (typeof e.t === 'number' && e.t > m ? e.t : m), umTime);
    const ran = Math.max(0, Math.min(fail.atT, Math.max(lastT, umTime)) - umTime);
    const ranTxt = ran >= 60 ? `${(ran / 60).toFixed(1)}m` : `${ran.toFixed(1)}s`;
    const toolTxt = failTools === 0 ? 'no tools' : `${failTools} tool${failTools === 1 ? '' : 's'}`;
    const detail = String(fail.detail).replace(/^\{"error":"?|"?\}$/g, '').slice(0, 140);
    return {
      kind: 'failed',
      turnWord: turnIdx !== null ? `turn ${turnIdx}` : 'turn', turnColor: '#c86464',
      restText: `${ranTxt} · ${toolTxt} · ended: ${detail}`, hasRest: true,
      color: '#c86464',
      pulseOn: false,
    };
  }
  if (turnIsLive) {
    // Count tools started in this turn.
    let tools = 0;
    const outstanding = new Map();
    for (const e of envs) {
      if (typeof e.seq !== 'number' || e.seq < umSeq) continue;
      const p = e.payload || {};
      if (e.kind === EnvelopeKind.ToolCall && typeof p.call_id === 'string') {
        tools++;
        outstanding.set(p.call_id, typeof p.tool === 'string' ? p.tool : 'tool');
      } else if (e.kind === EnvelopeKind.ToolResult && typeof p.call_id === 'string') {
        outstanding.delete(p.call_id);
      }
    }
    const liveToolName = outstanding.size ? Array.from(outstanding.values()).pop() : '';
    const umT = typeof lastUM.t === 'number' ? lastUM.t : nowSec;
    const secs = Math.max(0, Math.floor(nowSec - umT));
    // "turn N" is the head word and pulses. The tail always names
    // the same three fields — seconds, tool count, running tool
    // (if any) — so the strip never gains or loses columns as a
    // turn progresses. Zero tools reads "no tools"; the field is
    // always present.
    const turnWord = turnIdx !== null ? `turn ${turnIdx}` : 'turn';
    const restParts = [`${secs}s`];
    restParts.push(tools === 0 ? 'no tools' : `${tools} tool${tools === 1 ? '' : 's'}`);
    if (liveToolName) restParts.push(liveToolName);
    restParts.push('ctrl+c to stop');
    const restText = restParts.join(' · ');
    return {
      kind: 'live', verb: liveToolName || '', seconds: secs,
      turnWord, turnColor: '#82a5c8',
      restText, hasRest: restText.length > 0,
      color: '#9aa0a8',
      pulseOn: true,
    };
  }
  // Recap for the completed turn between lastUM and lastPark.
  const tools = [];
  for (const e of envs) {
    if (typeof e.seq !== 'number') continue;
    if (e.seq < umSeq || e.seq > parkSeq) continue;
    if (e.kind === EnvelopeKind.ToolCall) {
      const p = e.payload || {};
      if (typeof p.tool === 'string') tools.push(p.tool);
    }
  }
  const startT = typeof lastUM.t === 'number' ? lastUM.t : 0;
  const endT = typeof lastPark.t === 'number' ? lastPark.t : 0;
  const elapsed = Math.max(0, endT - startT);
  const elapsedTxt = elapsed >= 60 ? `${(elapsed / 60).toFixed(1)}m` : `${elapsed.toFixed(1)}s`;
  const parkReason = (lastPark.payload && lastPark.payload.reason) || '';
  const parkLabel = lastParkKind === EnvelopeKind.SessionEnded ? 'session ended' : `parked${parkReason ? ' (' + parkReason + ')' : ''}`;
  const toolLabel = tools.length === 0 ? 'no tools' : `${tools.length} tool${tools.length === 1 ? '' : 's'}`;
  // Recap keeps the same head/tail split so the strip layout does
  // not change between states — only the pulse stops.
  const turnWord = turnIdx !== null ? `turn ${turnIdx}` : 'turn';
  const restText = `${elapsedTxt} · ${toolLabel} · ${parkLabel}`;
  return {
    kind: 'recap',
    turnWord, turnColor: '#62676f',
    restText, hasRest: true,
    color: '#62676f',
    pulseOn: false,
  };
}
