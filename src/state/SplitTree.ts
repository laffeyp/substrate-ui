// SplitTree.ts — pure operations over the split tree in ShellState.

import { Pane, Split, ShellState, isSplit, paneCount, PANE_CAP_PER_WINDOW } from "./ShellState";
import { newId } from "./ids";

export interface SplitResult {
  state: ShellState;
  newPaneId: string;
  newSplitId: string;
  parentPaneId: string;
}

export function splitPane(
  state: ShellState,
  paneId: string,
  axis: "row" | "col",
): SplitResult | null {
  const parent = state.panes[paneId];
  if (!parent) return null;
  if (paneCount(state, parent.windowId) >= PANE_CAP_PER_WINDOW) return null;

  const newSplitId = newId();
  const newPaneId = newId();

  const newPane: Pane = {
    id: newPaneId,
    windowId: parent.windowId,
    splitParentId: newSplitId,
    ratio: 0.5,
    focused: false,
    boundSessionId: null,
    status: "unbound",
    pickerText: "",
    pickerIndex: -1,
    pickerSelection: null,
    creating: null,
    sessionName: null,
    workspacePath: null,
    workspaceShape: null,
    promptDraft: "",
    transcriptRows: [],
    transcriptLastSeq: -1,
    reveal: "terminal",
  };
  const updatedParent: Pane = { ...parent, splitParentId: newSplitId, ratio: 0.5 };
  const newSplit: Split = {
    id: newSplitId,
    axis,
    aId: parent.id,
    bId: newPane.id,
    ratio: 0.5,
  };

  const grandparentId = parent.splitParentId;
  const splits = { ...state.splits, [newSplitId]: newSplit };
  if (grandparentId) {
    const gp = state.splits[grandparentId];
    splits[grandparentId] = {
      ...gp,
      aId: gp.aId === parent.id ? newSplitId : gp.aId,
      bId: gp.bId === parent.id ? newSplitId : gp.bId,
    };
  }
  const window = state.windows[parent.windowId];
  const windows = window.rootId === parent.id
    ? { ...state.windows, [window.id]: { ...window, rootId: newSplitId } }
    : state.windows;

  const nextState: ShellState = {
    ...state,
    panes: { ...state.panes, [parent.id]: updatedParent, [newPane.id]: newPane },
    splits,
    windows,
  };
  return { state: nextState, newPaneId, newSplitId, parentPaneId: parent.id };
}

export function resizeSplit(state: ShellState, splitId: string, ratio: number): ShellState {
  const split = state.splits[splitId];
  if (!split) return state;
  const clamped = Math.max(0.1, Math.min(0.9, ratio));
  return {
    ...state,
    splits: { ...state.splits, [splitId]: { ...split, ratio: clamped } },
  };
}

export function panesInWindow(state: ShellState, windowId: string): number {
  return paneCount(state, windowId);
}

export function atCap(state: ShellState, windowId: string): boolean {
  return paneCount(state, windowId) >= PANE_CAP_PER_WINDOW;
}

export function collectPaneIds(state: ShellState, rootId: string): string[] {
  const out: string[] = [];
  const walk = (id: string): void => {
    if (isSplit(state, id)) {
      const s = state.splits[id];
      walk(s.aId); walk(s.bId);
    } else {
      out.push(id);
    }
  };
  walk(rootId);
  return out;
}

export type Zone = "w" | "e" | "n" | "s" | "c";

interface DetachResult { state: ShellState; parentReplacementId: string | null; }

function detachPane(state: ShellState, paneId: string): DetachResult {
  const pane = state.panes[paneId];
  const parentSplitId = pane.splitParentId;
  if (!parentSplitId) return { state, parentReplacementId: null };
  const parent = state.splits[parentSplitId];
  const siblingId = parent.aId === paneId ? parent.bId : parent.aId;
  // The sibling replaces the parent split in the grandparent / window root.
  const grandparentId = state.panes[siblingId]?.splitParentId ?? state.splits[siblingId]?.id
    ? state.panes[paneId].splitParentId
    : null;
  void grandparentId;
  const parentGrandparentSplitId = Object.values(state.splits).find(
    (s) => s.aId === parentSplitId || s.bId === parentSplitId
  )?.id ?? null;

  const splits = { ...state.splits };
  delete splits[parentSplitId];

  if (parentGrandparentSplitId) {
    const gp = splits[parentGrandparentSplitId];
    splits[parentGrandparentSplitId] = {
      ...gp,
      aId: gp.aId === parentSplitId ? siblingId : gp.aId,
      bId: gp.bId === parentSplitId ? siblingId : gp.bId,
    };
  }

  // Update sibling's splitParentId (only if sibling is a pane; splits carry no parent field).
  const panes = { ...state.panes };
  if (panes[siblingId]) {
    panes[siblingId] = { ...panes[siblingId], splitParentId: parentGrandparentSplitId };
  }
  // Update detached pane's splitParentId → null (its window is set by insertion).
  panes[paneId] = { ...panes[paneId], splitParentId: null };

  // Update window root if the removed parent split was the root.
  const windows = { ...state.windows };
  for (const w of Object.values(windows)) {
    if (w.rootId === parentSplitId) windows[w.id] = { ...w, rootId: siblingId };
  }

  return {
    state: { ...state, splits, panes, windows },
    parentReplacementId: siblingId,
  };
}

function attachAtZone(
  state: ShellState,
  sourceId: string,
  targetId: string,
  zone: Zone,
): ShellState {
  const target = state.panes[targetId];
  if (!target) return state;
  if (zone === "c") {
    // Swap positions: exchange source and target in their parent splits.
    const source = state.panes[sourceId];
    const splits = { ...state.splits };
    if (source.splitParentId) {
      const sp = splits[source.splitParentId];
      splits[source.splitParentId] = {
        ...sp,
        aId: sp.aId === sourceId ? targetId : sp.aId,
        bId: sp.bId === sourceId ? targetId : sp.bId,
      };
    }
    if (target.splitParentId) {
      const tp = splits[target.splitParentId];
      splits[target.splitParentId] = {
        ...tp,
        aId: tp.aId === targetId ? sourceId : tp.aId,
        bId: tp.bId === targetId ? sourceId : tp.bId,
      };
    }
    const windows = { ...state.windows };
    for (const w of Object.values(windows)) {
      if (w.rootId === sourceId) windows[w.id] = { ...w, rootId: targetId };
      else if (w.rootId === targetId) windows[w.id] = { ...w, rootId: sourceId };
    }
    const panes = {
      ...state.panes,
      [sourceId]: { ...source, splitParentId: target.splitParentId, windowId: target.windowId },
      [targetId]: { ...target, splitParentId: source.splitParentId, windowId: source.windowId },
    };
    return { ...state, panes, splits, windows };
  }

  // Edge zone: create a new split at target's slot; source and target become its children.
  const axis: "row" | "col" = zone === "w" || zone === "e" ? "row" : "col";
  const sourceIsFirst = zone === "w" || zone === "n";
  const newSplitId = newId();
  const aId = sourceIsFirst ? sourceId : targetId;
  const bId = sourceIsFirst ? targetId : sourceId;
  const newSplit: Split = { id: newSplitId, axis, aId, bId, ratio: 0.5 };

  const targetOldParentId = target.splitParentId;
  const splits = { ...state.splits, [newSplitId]: newSplit };
  if (targetOldParentId) {
    const p = splits[targetOldParentId];
    splits[targetOldParentId] = {
      ...p,
      aId: p.aId === targetId ? newSplitId : p.aId,
      bId: p.bId === targetId ? newSplitId : p.bId,
    };
  }

  const panes = {
    ...state.panes,
    [sourceId]: { ...state.panes[sourceId], splitParentId: newSplitId, windowId: target.windowId },
    [targetId]: { ...target, splitParentId: newSplitId },
  };
  const windows = { ...state.windows };
  for (const w of Object.values(windows)) {
    if (w.rootId === targetId) windows[w.id] = { ...w, rootId: newSplitId };
  }
  return { ...state, panes, splits, windows };
}

export function firstLeafId(state: ShellState, id: string): string {
  return isSplit(state, id) ? firstLeafId(state, state.splits[id].aId) : id;
}

export interface CloseResult {
  state: ShellState;
  walkedFocusPaneId: string | null;
  windowClosed: boolean;
}

export function closePane(state: ShellState, paneId: string): CloseResult | null {
  const pane = state.panes[paneId];
  if (!pane) return null;
  const windowId = pane.windowId;
  const window = state.windows[windowId];
  if (!window) return null;
  const total = paneCount(state, windowId);

  const panes = { ...state.panes };
  delete panes[paneId];

  if (total === 1) {
    // Closing the last pane closes the window.
    const windows = { ...state.windows };
    delete windows[windowId];
    return {
      state: {
        ...state,
        panes,
        windows,
        windowOrder: state.windowOrder.filter((wid) => wid !== windowId),
        focusedPaneId: state.focusedPaneId === paneId ? null : state.focusedPaneId,
      },
      walkedFocusPaneId: null,
      windowClosed: true,
    };
  }

  const parentSplitId = pane.splitParentId;
  if (!parentSplitId) return null;
  const parent = state.splits[parentSplitId];
  const siblingId = parent.aId === paneId ? parent.bId : parent.aId;

  const parentGrandparentSplitId = Object.values(state.splits).find(
    (s) => s.aId === parentSplitId || s.bId === parentSplitId
  )?.id ?? null;

  const splits = { ...state.splits };
  delete splits[parentSplitId];
  if (parentGrandparentSplitId) {
    const gp = splits[parentGrandparentSplitId];
    splits[parentGrandparentSplitId] = {
      ...gp,
      aId: gp.aId === parentSplitId ? siblingId : gp.aId,
      bId: gp.bId === parentSplitId ? siblingId : gp.bId,
    };
  }
  if (panes[siblingId]) {
    panes[siblingId] = { ...panes[siblingId], splitParentId: parentGrandparentSplitId };
  }

  const windows = { ...state.windows };
  if (window.rootId === parentSplitId) windows[windowId] = { ...window, rootId: siblingId };

  const nextState: ShellState = { ...state, panes, splits, windows };
  const walkedFocus = firstLeafId(nextState, siblingId);
  const withFocus: ShellState = {
    ...nextState,
    panes: {
      ...nextState.panes,
      [walkedFocus]: { ...nextState.panes[walkedFocus], focused: true },
    },
    focusedPaneId: walkedFocus,
  };
  return { state: withFocus, walkedFocusPaneId: walkedFocus, windowClosed: false };
}

export function movePane(
  state: ShellState,
  sourceId: string,
  targetId: string,
  zone: Zone,
): ShellState | null {
  if (sourceId === targetId) return null;
  if (!state.panes[sourceId] || !state.panes[targetId]) return null;
  if (zone === "c") return attachAtZone(state, sourceId, targetId, zone);
  const detached = detachPane(state, sourceId);
  return attachAtZone(detached.state, sourceId, targetId, zone);
}
