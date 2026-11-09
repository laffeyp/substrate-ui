// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The meta view's own state (sprint 313; plan PLAN-2026-11-04-shell-to-react-r5.md, D7): the lens on
// show, the stream's direction and level, the selected seq, and the split between the transcript and
// the machinery. Moved from DCLogic's state (`mode`, `dir`, `level`, `sel`, `revealL`). The meta view
// (web/app/MetaView.tsx) and its lenses read and write it; App reads it for the language keys and the
// transcript column's width, and writes it when `/language` opens the lens.

import { createStore } from "../store";
import { GraphDirection, GraphMode, RevealLevel } from "../../vm/kinds";
import { emit } from "../../vm/instrumentation/sdd";
import { LensChangedLens, SeqSelectedHow, Signal, StreamDirectionSetDirection, StreamLevelSetLevel } from "../../vm/signals.gen";

export type MetaMode = (typeof GraphMode)[keyof typeof GraphMode];
export type MetaDir = (typeof GraphDirection)[keyof typeof GraphDirection];
export type MetaLevel = (typeof RevealLevel)[keyof typeof RevealLevel];

export interface MetaState {
  mode: MetaMode;
  dir: MetaDir;
  level: MetaLevel;
  sel: number | null;
  /** The transcript column's flex weight against the machinery's 1, from 0.5 to 3. */
  split: number;
}

export const SPLIT_MIN = 0.5;
export const SPLIT_MAX = 3;

// One instance per window, as in shell.ts (sprint 212).
const KEY = "__substrateMeta";
const scope = globalThis as unknown as Record<string, ReturnType<typeof createStore<MetaState>> | undefined>;
export const meta = scope[KEY] ?? (scope[KEY] = createStore<MetaState>({ mode: GraphMode.Stream, dir: GraphDirection.Down, level: RevealLevel.All, sel: null, split: 1.15 }));

/** Each lens as LENS_CHANGED names it (sprint 368). */
const LENS_OF: Record<MetaMode, LensChangedLens> = {
  [GraphMode.Stream]: LensChangedLens.STREAM,
  [GraphMode.Structure]: LensChangedLens.STRUCTURE,
  [GraphMode.Language]: LensChangedLens.LANGUAGE,
  [GraphMode.Scene]: LensChangedLens.SCENE,
  [GraphMode.IO]: LensChangedLens.IO,
};

/** Direction is the stream lens's alone, so leaving the stream resets it to down: a side direction
 *  carried into another lens would leave no chip on screen to change it. A change of lens for the
 *  meta view of `paneId` is written as LENS_CHANGED, with the pane's session when it has one. */
export function setMode(mode: MetaMode, paneId: number, sessionId: string | null): void {
  const was = meta.getSnapshot().mode;
  meta.set(mode === GraphMode.Stream ? { mode } : { mode, dir: GraphDirection.Down });
  if (mode !== was) emit(Signal.LENS_CHANGED, { lens: LENS_OF[mode], ...(sessionId ? { session_id: sessionId } : {}) }, { pane_id: paneId });
}

/** Each direction and level as the vocabulary names them (v0.24, P-0.24-ACTIONS). */
const DIRECTION_OF: Record<MetaDir, StreamDirectionSetDirection> = {
  [GraphDirection.Down]: StreamDirectionSetDirection.DOWN,
  [GraphDirection.Side]: StreamDirectionSetDirection.SIDE,
};
const LEVEL_OF: Record<MetaLevel, StreamLevelSetLevel> = {
  [RevealLevel.All]: StreamLevelSetLevel.ALL,
  [RevealLevel.App]: StreamLevelSetLevel.APP,
};

/** The stream lens's direction for the meta view of `paneId`; a change is STREAM_DIRECTION_SET. */
export function setDir(dir: MetaDir, paneId: number): void {
  const was = meta.getSnapshot().dir;
  meta.set({ dir });
  if (dir !== was) emit(Signal.STREAM_DIRECTION_SET, { direction: DIRECTION_OF[dir] }, { pane_id: paneId });
}

/** The stream lens's level; a change is STREAM_LEVEL_SET. */
export function setLevel(level: MetaLevel, paneId: number): void {
  const was = meta.getSnapshot().level;
  meta.set({ level });
  if (level !== was) emit(Signal.STREAM_LEVEL_SET, { level: LEVEL_OF[level] }, { pane_id: paneId });
}

/** The lit seq, written as SEQ_SELECTED when it changes (null: cleared). */
function setSel(sel: number | null, paneId: number, how: SeqSelectedHow): void {
  const was = meta.getSnapshot().sel;
  meta.set({ sel });
  if (sel !== was) emit(Signal.SEQ_SELECTED, { seq: sel, how }, { pane_id: paneId });
}

/** A click on a stream row or a side-graph segment lights its seq, or clears it when lit. */
export function pickSeq(seq: number, paneId: number, how: SeqSelectedHow.STREAM_ROW | SeqSelectedHow.SIDE_GRAPH): void {
  setSel(meta.getSnapshot().sel === seq ? null : seq, paneId, how);
}

/** A click on a language row lights its turn's seq, lit or not; so do the language keys and `/language`. */
export function selectSeq(seq: number | null, paneId: number, how: SeqSelectedHow.LANGUAGE_ROW | SeqSelectedHow.LANGUAGE_KEY | SeqSelectedHow.LANGUAGE_OPEN): void {
  setSel(seq, paneId, how);
}

/** The split after a drag of `dx` pixels in a window `winW` wide: the gutter follows the pointer. */
export function splitAfterDrag(split: number, dx: number, winW: number): number {
  const next = split + (dx / Math.max(300, winW)) * (split + 1);
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, next));
}

export function dragSplit(dx: number, winW: number): void {
  meta.set((s) => ({ split: splitAfterDrag(s.split, dx, winW) }));
}
