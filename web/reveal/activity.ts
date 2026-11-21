// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The activity strip above the prompt: what the current turn is doing, or how the last one
// ended. Moved out of reveal_component.ts (UI sprint 101) so it can be tested alone;
// web/app/ActivityLine.tsx and App call it.
//
// Sprint 530: reads from the snapshot's indexed fields (lastUserMessage, lastTurnEnd,
// turnToolCount, turnLiveToolName) instead of scanning rawEnvelopes.

import { EnvelopeKind } from "../vm/kinds";
import { formatClock, formatDuration } from "./timeline";

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

// F350: the scan over the record's envelopes depends on the snapshot alone, and the clock only
// moves a live turn's seconds. So the scan runs once per snapshot (snapshots are replaced, never
// changed, on every controller patch) and the 500 ms tick only formats the seconds again.
type Scan =
  | { kind: "done"; activity: Activity }
  | { kind: "live"; turnWord: string; umT: number | null; tools: number; liveToolName: string };
const scans = new WeakMap<object, Scan | null>();

/** What the strip shows at `nowSec` (unix seconds), from a pane's snapshot. The parameter is untyped,
 *  as it was when the dc-runtime component passed it. */
export function liveActivity(snap: any, nowSec: number = Date.now() / 1000): Activity | null {
  if (!snap || typeof snap !== "object") return null;
  let scan = scans.get(snap);
  if (scan === undefined) { scan = scanActivity(snap); scans.set(snap, scan); }
  if (!scan) return null;
  if (scan.kind === "done") return scan.activity;
  const secs = scan.umT === null ? 0 : Math.max(0, Math.floor(nowSec - scan.umT));
  // "turn N" is the head word and pulses. The tail always names the same three fields — seconds,
  // tool count, running tool (if any) — so the strip never gains or loses columns as a turn
  // progresses. Zero tools reads "no tools"; the field is always present.
  const restParts = [formatClock(secs)];
  restParts.push(scan.tools === 0 ? "no tools" : `${scan.tools} tool${scan.tools === 1 ? "" : "s"}`);
  if (scan.liveToolName) restParts.push(scan.liveToolName);
  restParts.push("ctrl+c to stop");
  const restText = restParts.join(" · ");
  return {
    kind: "live", verb: scan.liveToolName, seconds: secs,
    turnWord: scan.turnWord, turnColor: "#82a5c8",
    restText, hasRest: restText.length > 0,
    color: "#9aa0a8",
    pulseOn: true,
  };
}

function scanActivity(snap: any): Scan | null {
  const lastUM = snap.lastUserMessage;
  const lastPark = snap.lastTurnEnd;
  if (!lastUM) return null;
  const umSeq = typeof lastUM.seq === "number" ? lastUM.seq : -1;
  const parkSeq = lastPark && typeof lastPark.seq === "number" ? lastPark.seq : -1;
  const turnIsLive = !lastPark || umSeq > parkSeq;
  const turnIdx = lastUM.payload && typeof lastUM.payload.turn_index === "number" ? lastUM.payload.turn_index : null;
  const lastParkKind = lastPark ? lastPark.kind : "";
  const fail = snap.turnFailure;
  const umTime: number | null = typeof lastUM.t === "number" ? lastUM.t : null;
  if (turnIsLive && fail && umTime !== null && umTime <= fail.atT) {
    const failTools = typeof snap.turnToolCount === "number" ? snap.turnToolCount : 0;
    const ran = Math.max(0, fail.atT - umTime);
    const ranTxt = formatDuration(ran);
    const toolTxt = failTools === 0 ? "no tools" : `${failTools} tool${failTools === 1 ? "" : "s"}`;
    const detail = String(fail.detail).slice(0, 140);
    return { kind: "done", activity: {
      kind: "failed",
      turnWord: turnIdx !== null ? `turn ${turnIdx}` : "turn", turnColor: "#c86464",
      restText: `${ranTxt} · ${toolTxt} · ended: ${detail}`, hasRest: true,
      color: "#c86464",
      pulseOn: false,
    } };
  }
  if (turnIsLive) {
    const tools = typeof snap.turnToolCount === "number" ? snap.turnToolCount : 0;
    const liveToolName = typeof snap.turnLiveToolName === "string" ? snap.turnLiveToolName : "";
    return { kind: "live", turnWord: turnIdx !== null ? `turn ${turnIdx}` : "turn", umT: umTime, tools, liveToolName };
  }
  // Recap for the completed turn between lastUM and lastPark.
  const tools = typeof snap.turnToolCount === "number" ? snap.turnToolCount : 0;
  const startT = typeof lastUM.t === "number" ? lastUM.t : 0;
  const endT = typeof lastPark.t === "number" ? lastPark.t : 0;
  const elapsed = Math.max(0, endT - startT);
  const elapsedTxt = formatDuration(elapsed);
  const parkReason = (lastPark.payload && lastPark.payload.reason) || "";
  const parkLabel = lastParkKind === EnvelopeKind.SessionEnded
    ? "session ended"
    : `${lastParkKind === EnvelopeKind.Returned ? "returned" : "parked"}${parkReason ? " (" + parkReason + ")" : ""}`;
  const toolLabel = tools === 0 ? "no tools" : `${tools} tool${tools === 1 ? "" : "s"}`;
  const turnWord = turnIdx !== null ? `turn ${turnIdx}` : "turn";
  const restText = `${elapsedTxt} · ${toolLabel} · ${parkLabel}`;
  return { kind: "done", activity: {
    kind: "recap",
    turnWord, turnColor: "#62676f",
    restText, hasRest: true,
    color: "#62676f",
    pulseOn: false,
  } };
}
