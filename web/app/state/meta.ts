// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The meta view's own state (sprint 313; plan PLAN-2026-11-04-shell-to-react-r5.md, D7): the lens on
// show, the stream's direction and level, the selected seq, and the split between the transcript and
// the machinery. Moved from DCLogic's state (`mode`, `dir`, `level`, `sel`, `revealL`). The meta view
// (web/app/MetaView.tsx) and its lenses read and write it; DCLogic reads it for the language keys and
// the left column's width, and writes it when `/language` opens the lens.

import { createStore } from "../store";
import { GraphDirection, GraphMode, RevealLevel } from "../../vm/kinds";

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

/** Direction is the stream lens's alone, so leaving the stream resets it to down: a side direction
 *  carried into another lens would leave no chip on screen to change it. */
export function setMode(mode: MetaMode): void {
  meta.set(mode === GraphMode.Stream ? { mode } : { mode, dir: GraphDirection.Down });
}

export function setDir(dir: MetaDir): void {
  meta.set({ dir });
}

export function setLevel(level: MetaLevel): void {
  meta.set({ level });
}

/** A click on a stream row or a side-graph segment lights its seq, or clears it when lit. */
export function pickSeq(seq: number): void {
  meta.set((s) => ({ sel: s.sel === seq ? null : seq }));
}

/** A click on a language row lights its turn's seq, lit or not. */
export function selectSeq(seq: number | null): void {
  meta.set({ sel: seq });
}

/** The split after a drag of `dx` pixels in a window `winW` wide: the gutter follows the pointer. */
export function splitAfterDrag(split: number, dx: number, winW: number): number {
  const next = split + (dx / Math.max(300, winW)) * (split + 1);
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, next));
}

export function dragSplit(dx: number, winW: number): void {
  meta.set((s) => ({ split: splitAfterDrag(s.split, dx, winW) }));
}
