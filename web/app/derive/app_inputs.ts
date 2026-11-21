// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// What the window's React root draws from the pane snapshots (sprint 531; roadmap
// 2026-11-18-window-productionizing r1, W9). App (web/app/App.tsx) subscribes to the shell store and
// today re-renders and re-runs publish() on every pane's every snapshot. From the snapshots App draws
// only a thin projection: for each pane whether it shows a session (showsBinding) and its
// driver/name/connection/turn state, and for the focused pane the stream inputs computeViews reads
// (rawEnvelopes, topologyGraph, language) and the roster/top-bar fields the picker and top bar read.
// A non-focused pane that streams thousands of ToolProgress envelopes changes none of that.
//
// appInputs names exactly those fields; sameAppInputs compares them so App renders only when one
// changed. The batch-fresh arrays (rawEnvelopes per sprint 524's one-array-per-batch) compare by
// reference, so the focused pane still renders per batch; the scalar binding fields compare by value.
// No React import; no side effects.

import type { Snapshot, RecordEnvelope, TopologyGraph, LanguageView, WorkspaceRow, ConnectionState } from "../../vm/types";

type Snapshots = Record<number, Snapshot>;

/** The fields appInputs reads from a pane for showsBinding and paneDriver (App.tsx holds the rest of a
 *  pane's state — its picker typing, its armed folder — which changes through setState, not a snapshot). */
export interface PaneRef {
  id: number;
  unbound: boolean;
  driver: string | null;
}

/** One pane's drawn projection: the snapshot-derived fields App draws for the pane. */
export interface PaneInput {
  id: number;
  /** showsBinding: the pane no longer shows its picker (App.tsx `showsBinding`). */
  showsSession: boolean;
  sessionId: string | null;
  /** paneDriver: a bound session's own driver, else the pane's picked driver. */
  driver: string | null;
  sessionName: string | null;
  connection: ConnectionState | null;
  endedReason: string | null;
  /** The top bar's `running` flag reads `!parkReason` (App.tsx topBarView): a parked focused session
   *  must drop the render even when connection stays CONNECTED and no turn-end lands in the snapshot. */
  parkReason: string | null;
  /** The turn/activity state PANE_DRAWN reads through liveActivity, from sprint 530's indexed fields —
   *  the seqs and kind that set the turn's kind (running / parked / failed), not the live seconds. */
  umSeq: number;
  turnEndSeq: number;
  turnEndKind: string;
  turnFailAtT: number | null;
  turnToolCount: number;
  turnLiveToolName: string;
  /** `/language open` bumps this; App opens the meta lens when it rises for the focused pane. */
  languageOpenTick: number;
}

/** The focused pane's fields the stream view, the picker and the top bar read; the arrays and maps are
 *  replaced on the controller patch that changes them, so they compare by reference. */
export interface FocusedInput {
  rawEnvelopes: RecordEnvelope[] | null;
  topologyGraph: TopologyGraph | null;
  language: LanguageView | null;
  recentWorkspaces: WorkspaceRow[] | null;
  driverGroups: Snapshot["driverGroups"] | null;
  driverRoster: Snapshot["driverRoster"] | null;
  cliVersions: Snapshot["cliVersions"];
  driverVersion: Snapshot["driverVersion"] | null;
  bundleSlug: string | null;
  length: string | null;
  tone: string | null;
  workspacePath: string | null;
}

export interface AppInputs {
  focused: number;
  panes: PaneInput[];
  focusedInput: FocusedInput;
}

/** The driver App shows for a pane: a bound session's own driver, else the pane's picked one. */
function paneDriverOf(pane: PaneRef, snap: Snapshot | undefined): string | null {
  if (snap && snap.sessionId && snap.driver) return snap.driver;
  return pane.driver || null;
}

/** The projection of what App draws, from the pane snapshots, the focused pane id and the pane list. */
export function appInputs(snapshots: Snapshots, focused: number, panes: readonly PaneRef[]): AppInputs {
  const paneInputs = panes.map((p): PaneInput => {
    const snap = snapshots[p.id];
    return {
      id: p.id,
      showsSession: !p.unbound || !!snap?.sessionId,
      sessionId: snap?.sessionId ?? null,
      driver: paneDriverOf(p, snap),
      sessionName: snap?.sessionName ?? null,
      connection: snap?.connection ?? null,
      endedReason: snap?.endedReason ?? null,
      parkReason: snap?.parkReason ?? null,
      umSeq: typeof snap?.lastUserMessage?.seq === "number" ? snap.lastUserMessage.seq : -1,
      turnEndSeq: typeof snap?.lastTurnEnd?.seq === "number" ? snap.lastTurnEnd.seq : -1,
      turnEndKind: snap?.lastTurnEnd?.kind ?? "",
      turnFailAtT: snap?.turnFailure?.atT ?? null,
      turnToolCount: typeof snap?.turnToolCount === "number" ? snap.turnToolCount : 0,
      turnLiveToolName: snap?.turnLiveToolName ?? "",
      languageOpenTick: snap?.languageOpenTick ?? 0,
    };
  });
  const fsnap = snapshots[focused];
  const focusedInput: FocusedInput = {
    rawEnvelopes: fsnap?.rawEnvelopes ?? null,
    topologyGraph: fsnap?.topologyGraph ?? null,
    language: fsnap?.language ?? null,
    recentWorkspaces: fsnap?.recentWorkspaces ?? null,
    driverGroups: fsnap?.driverGroups ?? null,
    driverRoster: fsnap?.driverRoster ?? null,
    cliVersions: fsnap?.cliVersions ?? null,
    driverVersion: fsnap?.driverVersion ?? null,
    bundleSlug: fsnap?.bundleSlug ?? null,
    length: fsnap?.length ?? null,
    tone: fsnap?.tone ?? null,
    workspacePath: fsnap?.workspacePath ?? null,
  };
  return { focused, panes: paneInputs, focusedInput };
}

/** True when two projections draw the same window. Scalars by value; the batch-fresh arrays and roster
 *  maps by reference, so a fresh per-batch rawEnvelopes array counts as changed. */
export function sameAppInputs(a: AppInputs, b: AppInputs): boolean {
  if (a.focused !== b.focused) return false;
  if (a.panes.length !== b.panes.length) return false;
  for (let i = 0; i < a.panes.length; i++) {
    const pa = a.panes[i];
    const pb = b.panes[i];
    if (pa.id !== pb.id
      || pa.showsSession !== pb.showsSession
      || pa.sessionId !== pb.sessionId
      || pa.driver !== pb.driver
      || pa.sessionName !== pb.sessionName
      || pa.connection !== pb.connection
      || pa.endedReason !== pb.endedReason
      || pa.parkReason !== pb.parkReason
      || pa.umSeq !== pb.umSeq
      || pa.turnEndSeq !== pb.turnEndSeq
      || pa.turnEndKind !== pb.turnEndKind
      || pa.turnFailAtT !== pb.turnFailAtT
      || pa.turnToolCount !== pb.turnToolCount
      || pa.turnLiveToolName !== pb.turnLiveToolName
      || pa.languageOpenTick !== pb.languageOpenTick) return false;
  }
  const fa = a.focusedInput;
  const fb = b.focusedInput;
  return Object.is(fa.rawEnvelopes, fb.rawEnvelopes)
    && Object.is(fa.topologyGraph, fb.topologyGraph)
    && Object.is(fa.language, fb.language)
    && Object.is(fa.recentWorkspaces, fb.recentWorkspaces)
    && Object.is(fa.driverGroups, fb.driverGroups)
    && Object.is(fa.driverRoster, fb.driverRoster)
    && Object.is(fa.cliVersions, fb.cliVersions)
    && Object.is(fa.driverVersion, fb.driverVersion)
    && fa.bundleSlug === fb.bundleSlug
    && fa.length === fb.length
    && fa.tone === fb.tone
    && fa.workspacePath === fb.workspacePath;
}
