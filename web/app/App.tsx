// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The window (sprint 328; plan PLAN-2026-11-04-shell-to-react-r5.md, E4; F327, F344). App owns the
// panes, the focus, the open view and page, and the pane pickers' state, with the actions that change
// them; its `render` draws the window from the areas in web/app/. Moved from web/reveal_component.ts,
// the class dc-runtime evaluated from a string (F344) under `@ts-nocheck` (F327); this one is
// type-checked against the controllers' own types (web/vm/).
//
// The areas App does not draw from props read their stores (web/app/state/), which App writes after
// each render: the pickers' views, the stream's record, the panes view, the top bar and the chrome.
// Values the old class computed for template slots nothing reads any more (per-pane dots, the pane's
// sent lines, the legacy start lines, a driver menu flag) are not carried over.

import * as React from "react";
import { flushSync } from "react-dom";
import { Surface, GraphMode } from "../vm/kinds";
import type { PaneRegistry } from "../vm/pane_registry";
import type { SessionController } from "../vm/session_controller";
import type { SessionRow, Snapshot, WorkspaceRow } from "../vm/types";
import { toggleToolOutputMode } from "../vm/tool_output_mode";
import { GUIDANCE_LEVEL_BUNDLES, LENGTH_DEFAULT, LengthPosition, TONE_DEFAULT, TonePosition } from "../vm/controls.gen";
import { buildLanguageLens, type Lens } from "../reveal/language_lens";
import { Transcript } from "../reveal/transcript";
import { LOOK } from "./derive/look";
import { liveActivity } from "../reveal/activity";
import { fontSize, loadSettings, settings } from "./state/settings";
import { closeDialog, dialogOpen, openSettings } from "./state/dialogs";
import { chrome } from "./state/chrome";
import { editor as editorStore } from "./state/editor";
import { firstRun } from "./state/first_run";
import { setTopBarActions, topBar, type TopBarActions, type TopBarState } from "./state/top_bar";
import { workspaceCard } from "./derive/workspace_card";
import { GUIDANCE_AUTO_META, GUIDANCE_META, LENGTH_META, TONE_META } from "./derive/control_notes";
import { setTitleOf } from "./state/input_bar";
import { closeFind, find, findQuery, setFindScope, toggleFind } from "./state/find";
import { recordsKey, setOpenSession } from "./state/records";
import { lineStep, paneShape, SHARED_SANDBOX, tabFill, workspaceRows } from "./derive/picker";
import { treeKey, type TreeItem } from "./derive/tree_key";
import { chipLabel, driverLabel, modelRows, type ModelToggle } from "./derive/driver_label";
import { picker, type ChoiceRowView, type ModelRowView, type PickerView, type WsRowView } from "./state/picker";
import { stream, type StreamState } from "./state/stream";
import { panes as panesStore, type PanesView as PanesViewModel } from "./state/panes";
import { meta, selectSeq, setMode } from "./state/meta";
import { closePane, dragCols, dragRows, gutterStops, MAX_PANES, splitPane, trackList, type Cell, type SplitDir } from "./derive/panes";
import { language, setLanguageLane } from "./state/language";
import { languageKey, selectedTurn } from "./derive/language_keys";
import { ARROWS, windowKey, type KeyAction } from "./keymap";
import { findText, streamRows } from "./derive/stream";
import { onCommand, shell } from "./state/shell";
import { emit as emitSignal } from "../vm/instrumentation/sdd";
import { closePage, editorBase, metaBase, pageOf, show, START, toggleEditor, toggleMeta, togglePage, type Page, type ViewState } from "./derive/open_view";
import { ActivityLine, TaskRows } from "./ActivityLine";
import { AssayPage } from "./AssayPage";
import { EditorView, foldColumn, toggleDock, toggleFocus, toggleMetaPane, toggleSwap } from "./editor/EditorView";
import { openSearch } from "./editor/Search";
import { openQuick } from "./editor/QuickOpen";
import { addSelection, closeFile, requestSave, routeUndo } from "./editor/Centre";
import { Dialogs } from "./Dialogs";
import { FindBar } from "./FindBar";
import { FirstRun } from "./FirstRun";
import { Footer } from "./Footer";
import { InputBar } from "./InputBar";
import { MetaView } from "./MetaView";
import { PanesView } from "./PanesView";
import { RecordsPage } from "./RecordsPage";
import { StudioPage } from "./StudioPage";
import { TopBar } from "./TopBar";
import { ContextMenu } from "./ContextMenu";
import { closeMenu, menuKey, menuOpen } from "./state/context_menu";
import "./window.css";
import { Signal, UndoRoutedDirection, UndoRoutedTo, EditorColumnFoldedCause, EditorDrawnBinding, EditorDrawnMode, EditorOpenedBinding, EditorDrawnDock, EditorDrawnLeftTab, EditorDrawnShowing, EditorKeyRefusedReason, SeqSelectedHow, ToolOutputModeSetCause, TopBarCardSetCard, TopBarCardSetCause, DialogClosedOutcome, ContextMenuClosedOutcome, KeyRoutedTarget, RecordOpenedHow, ViewChangedCause, PaneBoundBinding, PaneBoundHow, PaneDrawnConnection, PaneDrawnPickerLine, PaneDrawnState, PaneDrawnTurnState, PaneFocusedCause, PaneOpenedCause, PickerFolderArmedSource, PickerFolderDisarmedCause, PickerLineEnteredCause, PickerLineEnteredLine, type SignalPayloads } from "../vm/signals.gen";
import type { Activity } from "../reveal/activity";

// UI sprint 132 (kernel K288, session vocabulary § R): the guidance levels the bar offers, each with
// the bundle that carries it. `auto` names none, so the daemon picks the model's default. UI sprint
// 161: the levels and their bundles are generated from the kernel (vm/controls.gen.ts); the notes
// are web/app/derive/control_notes.ts (sprint 261), which the slash menu reads too.
interface ChoiceOption { label: string; meta: string }
interface GuidanceOption extends ChoiceOption { level: string | null; bundle: string | null }
interface ValueOption extends ChoiceOption { value: string }
const GUIDANCE_OPTIONS: GuidanceOption[] = [
  { level: null, bundle: null, label: "auto", meta: GUIDANCE_AUTO_META },
  ...Object.entries(GUIDANCE_LEVEL_BUNDLES).map(([level, bundle]) => ({ level, bundle, label: level, meta: GUIDANCE_META[level] || "" })),
];
// UI sprint 143 (kernel K296, session vocabulary § T): the Length and Tone lines under GUIDANCE. The
// positions and defaults are generated from the kernel; the defaults write no text.
const LENGTH_OPTIONS: ValueOption[] = Object.values(LengthPosition).map((v) => ({ value: v, label: v, meta: LENGTH_META[v] || "" }));
const TONE_OPTIONS: ValueOption[] = Object.values(TonePosition).map((v) => ({ value: v, label: v, meta: TONE_META[v] || "" }));
const LENGTH_DEFAULT_AT = LENGTH_OPTIONS.findIndex((opt) => opt.value === LENGTH_DEFAULT);
const TONE_DEFAULT_AT = TONE_OPTIONS.findIndex((opt) => opt.value === TONE_DEFAULT);

/** A folder picked in the workspace column, waiting on a model. `isDefault` is the per-session sandbox. */
interface Armed { ws: string; isDefault: boolean }
type PickerHalf = PaneDrawnPickerLine;
type SelKey = "guidanceSel" | "lengthSel" | "toneSel";

export interface AppPane extends Cell {
  name: string;
  /** The driver picked for the pane's next session; a bound session's own is on its snapshot. */
  driver: string | null;
  /** No session and no folder yet: the pane shows its picker. */
  unbound: boolean;
  /** The top bar's name field. */
  editing: boolean;
  nameVal: string;
  /** The picker's typed path, armed folder, open line and lit rows. */
  wsQ: string;
  armed: Armed | null;
  pickerHalf: PickerHalf;
  wsSelIdx: number;
  modelSelIdx: number | null;
  guidanceSel?: number;
  lengthSel?: number;
  toneSel?: number;
  guidance?: string | null;
  length?: string;
  tone?: string;
  /** The folder the pane's session runs in ('' for the per-session sandbox) and its shape. */
  ws?: string;
  shape?: string;
  /** A run's record this pane shows (UI sprint 182), or a delegate child's session (183). */
  runRoot?: string;
  childSid?: string;
}

type Snapshots = Record<number, Snapshot>;

/** The design tool's tweak props, as the dc-runtime template (`web/reveal.html` at `d4322e1`)
 *  declared them on its script tag (`data-props`; restored in sprint 334). dc-runtime's tweak
 *  editor set them; with no editor, each takes its default, which changes nothing. */
export const TWEAK_PROPS = {
  transcriptFontSize: { editor: "range", default: 13, min: 6.5, max: 19.5, step: 0.5, tsType: "number", section: "Type — default ±50%" },
  columns: { editor: "range", default: 1, min: 1, max: 4, step: 1, tsType: "number", section: "Test the splits (⌘D also works once clicked in)" },
  rows: { editor: "range", default: 1, min: 1, max: 2, step: 1, tsType: "number", section: "Test the splits (⌘D also works once clicked in)" },
  view: { editor: "enum", default: "revealed", options: ["terminal", "revealed"], tsType: "string", section: "Level" },
  firstRun: { editor: "boolean", default: false, tsType: "boolean", section: "Scenarios" },
  simulateRateLimit: { editor: "boolean", default: false, tsType: "boolean", section: "Scenarios" },
} as const;

export interface AppProps {
  transcriptFontSize?: number;
  columns?: number;
  rows?: number;
  view?: "terminal" | "revealed";
  firstRun?: boolean;
  simulateRateLimit?: boolean;
}

interface AppState {
  /** The open view and the view a page returns to (web/app/derive/open_view.ts, sprint 346). */
  vs: ViewState;
  panes: AppPane[];
  focused: number;
  cols: number;
  rows: number;
  colW: number[];
  rowW: number[];
  /** The pane whose model card, or workspace card, is open in the top bar. */
  ddFor: number | null;
  wsFor: number | null;
  driverExpandedGroups: Record<string, boolean>;
  driverExpandedCli: string | null;
  driverExpandedFamily: string | null;
  /** The picker's open workspace rows and the sessions read under each (sprint 086). */
  pickerExpandedWs: Record<string, boolean>;
  pickerPagedByWs: Record<string, { rows: SessionRow[]; total: number }>;
  controllerSnapshots: Snapshots;
  winW: number;
  /** The meta split, mirrored so a drag redraws the transcript column. */
  metaSplit: number;
}

const vmOf = (): PaneRegistry | undefined => (window as unknown as { __vm?: PaneRegistry }).__vm;
const ctlOf = (paneId: number): SessionController | undefined => vmOf()?.get(paneId);

const newPaneFields = (id: number): AppPane => ({
  id, col: 1, row: 1, cw: 1, rh: 1, name: "pane-" + id, driver: null, unbound: true, editing: false, nameVal: "",
  wsQ: "", armed: null, pickerHalf: PaneDrawnPickerLine.WS, wsSelIdx: 0, modelSelIdx: null,
});

// The pane lifecycle records (vocabulary v0.14, sprint 360), written from the commit that shows the
// change (componentDidMount, componentDidUpdate). Where the state cannot say why, the path that made
// the change notes it first: a click or an open path for focus, the picker or an attach for binding.
/** The pane no longer shows its picker: as `session(p)` in computeViews. */
const showsBinding = (p: AppPane, snaps: Snapshots): boolean => !p.unbound || !!snaps[p.id]?.sessionId;
/** The keys KEY_ROUTED leaves out when pressed alone (sprint 367). */
const MODIFIER_KEYS = ["Meta", "Control", "Alt", "Shift"];
/** Where a key's action went (KEY_ROUTED); every other action is the window's. */
/** vim's mode as EDITOR_DRAWN names it: the visual sub-modes are visual (sprint 424, v0.33). */
function drawnMode(mode: string | null): EditorDrawnMode {
  if (!mode) return EditorDrawnMode.NONE;
  if (mode.startsWith("visual")) return EditorDrawnMode.VISUAL;
  return mode === "insert" ? EditorDrawnMode.INSERT : mode === "replace" ? EditorDrawnMode.REPLACE : EditorDrawnMode.NORMAL;
}

const KEY_TARGET: Partial<Record<KeyAction["kind"], KeyRoutedTarget>> = {
  records: KeyRoutedTarget.RECORDS,
  picker: KeyRoutedTarget.PICKER,
  language: KeyRoutedTarget.LANGUAGE,
  "fold-editor": KeyRoutedTarget.EDITOR,
  "refuse-split": KeyRoutedTarget.EDITOR,
  "editor-find": KeyRoutedTarget.EDITOR,
  "editor-search": KeyRoutedTarget.EDITOR,
  "tree-find": KeyRoutedTarget.EDITOR,
  "quick-open": KeyRoutedTarget.EDITOR,
  "add-selection": KeyRoutedTarget.EDITOR,
};
/** The picker line PICKER_LINE_ENTERED names, as the pane's open line. */
const HALF_OF_LINE: Record<PickerLineEnteredLine, PaneDrawnPickerLine> = {
  [PickerLineEnteredLine.MODEL]: PaneDrawnPickerLine.MODEL,
  [PickerLineEnteredLine.GUIDANCE]: PaneDrawnPickerLine.GUIDANCE,
  [PickerLineEnteredLine.LENGTH]: PaneDrawnPickerLine.LENGTH,
  [PickerLineEnteredLine.TONE]: PaneDrawnPickerLine.TONE,
};
/** PANE_DRAWN.turn_state for what the activity line draws (web/reveal/activity.ts). */
const TURN_OF_ACTIVITY: Record<Activity["kind"], PaneDrawnTurnState> = {
  live: PaneDrawnTurnState.RUNNING, failed: PaneDrawnTurnState.FAILED, recap: PaneDrawnTurnState.PARKED,
};

type Handler = (ev?: unknown) => void;
interface KeyEv { key: string; shiftKey: boolean; altKey: boolean; metaKey: boolean; ctrlKey: boolean; preventDefault(): void }
const stop = (ev: unknown) => { const e = ev as { stopPropagation?: () => void } | undefined; e?.stopPropagation?.(); };

export class App extends React.Component<AppProps, AppState> {
  override state: AppState = {
    vs: START,
    // No model until one is picked: pane 1 names none and preselects none.
    panes: [newPaneFields(1)],
    focused: 1, cols: 1, rows: 1, colW: [1], rowW: [1], ddFor: null, wsFor: null,
    driverExpandedGroups: {}, driverExpandedCli: null, driverExpandedFamily: null,
    pickerExpandedWs: {}, pickerPagedByWs: {}, controllerSnapshots: {}, winW: window.innerWidth, metaSplit: meta.getSnapshot().split,
  };

  private nextId = 2;
  private offs: (() => void)[] = [];
  /** The `/language` tick each pane last opened the lens at (UI sprint 172). */
  private langTicks: Record<number, number> = {};
  /** The session each pane last wrote to the URL. */
  private urlSessions: Record<number, string | null> = {};
  /** The pane gutter being dragged. */
  private gut: { type: "col" | "row"; i: number } | null = null;
  // Written in render, published after it: a store write during a render would update other
  // components mid-render.
  private pickerViews: Record<number, PickerView> = {};
  private streamView: StreamState = { envelopes: [], topology: null, language: null };
  private panesView: PanesViewModel | null = null;
  private topBarVals: TopBarState | null = null;
  private topBarActs: Omit<TopBarActions, "finishEdit"> | null = null;
  private streamMatches = 0;
  private offTopBarActs: (() => void) | null = null;
  private focusCause: PaneFocusedCause | null = null;
  /** Why the next commit's open view changed (VIEW_CHANGED, sprint 366), noted by the path that changes it. */
  private viewCause: ViewChangedCause | null = null;
  private bindHow = new Map<number, PaneBoundHow>();
  /** Panes the layout's tweak props made (componentDidUpdate's tweak sync): PANE_OPENED start. */
  private startPanes = new Set<number>();
  /** Each pane's last PANE_DRAWN payload, so a record is written only when what it draws changed. */
  private lastDrawn = new Map<number, string>();
  /** The editor view's last EDITOR_DRAWN payload (sprint 407), so a record is written only on a change. */
  private lastEditorDrawn: string | null = null;

  private snap(paneId: number): Snapshot | undefined { return this.state.controllerSnapshots[paneId]; }
  private setPane(paneId: number, patch: Partial<AppPane>): void {
    this.setState((s) => ({ panes: s.panes.map((x) => (x.id === paneId ? { ...x, ...patch } : x)) }));
  }

  private newPane(): AppPane {
    const id = Math.max(this.nextId, ...this.state.panes.map((p) => p.id + 1));
    this.nextId = id + 1;
    // Each pane owns its own SessionController; a new one loads the rosters at once.
    const ctl = vmOf()?.spawn(id);
    if (ctl) {
      ctl.loadDriverRoster().catch(() => undefined);
      ctl.loadBundleRoster().catch(() => undefined);
      ctl.loadRecentWorkspaces().catch(() => undefined);
    }
    return newPaneFields(id);
  }

  // Kinds: the default is a fresh per-session sandbox (substrate mints ~/.substrate/sessions/<id>/
  // workspace); `sandbox` the shared ~/.substrate/sandbox; `flat` any folder picked. An empty `ws`
  // leaves the workspace off the session's POST, so substrate falls back to its isolated default.
  private bindPane(id: number, ws: string, isDefault = false): void {
    this.setState((s) => {
      const pane = s.panes.find((p) => p.id === id);
      if (!pane || !pane.unbound) return null;
      return { panes: s.panes.map((p) => (p.id === id ? { ...p, unbound: false, ws: isDefault ? "" : ws, shape: paneShape(ws, isDefault) } : p)) };
    });
  }

  // UI sprint 124: the workspace bar runs left to right. A folder pick arms the folder and ungreys the
  // model half; the workspace reaches the controller only when the session starts, so a folder armed
  // and disarmed (esc) leaves nothing behind.
  private armWorkspace(paneId: number, ws: string, isDefault: boolean, source: PickerFolderArmedSource = PickerFolderArmedSource.ROW): void {
    // The default row (a per-session sandbox) has no path yet: null, as the vocabulary declares, not "".
    emitSignal(Signal.PICKER_FOLDER_ARMED, { pane_id: paneId, workspace: ws || null, is_default: isDefault, source }, { pane_id: paneId });
    this.setPane(paneId, { armed: { ws, isDefault }, pickerHalf: PaneDrawnPickerLine.MODEL, modelSelIdx: null });
  }
  // "choose folder…" (⌘O): Electron's folder dialog gives the folder's absolute path, which is recorded
  // as a recent workspace and armed. Commit 4fcc3bf removed this method and left its call, so the row
  // threw a TypeError from then until sprint 328. Outside Electron the path box takes the focus.
  private async pickFolder(paneId: number): Promise<void> {
    const native = (window as unknown as { native?: { pickFolder?: () => Promise<string | null> } }).native;
    if (!native?.pickFolder) {
      document.querySelector<HTMLElement>(`[data-ws-input="${paneId}"]`)?.focus();
      return;
    }
    const path = await native.pickFolder().catch(() => null);
    if (!path) return;
    await vmOf()?.addWorkspace(path).catch(() => undefined);
    this.armWorkspace(paneId, path, false, PickerFolderArmedSource.DIALOG);
  }
  // F362: ⌘O. The picker's "choose folder…" row names the key; with the focused pane's picker
  // showing (panes in view, no page open, no session bound) it opens the folder chooser. Anywhere
  // else it is File ▸ Open Record…: the record dialog, and pane 1 attaches the picked record, as the
  // menu did before.
  private openKey(): void {
    const s = this.state;
    const fp = this.pane(s.focused);
    const fsnap = this.snap(s.focused);
    if (fp && fp.unbound && !(fsnap && fsnap.sessionId) && s.vs.view === "panes") {
      void this.pickFolder(fp.id);
      return;
    }
    const native = (window as unknown as { native?: { openRecordDialog?: () => Promise<string | null> } }).native;
    if (!native?.openRecordDialog) return;
    void native.openRecordDialog().then((path) => {
      if (path) vmOf()?.get(1)?.attachRecordRoot(path, RecordOpenedHow.OPEN_RECORD).catch(() => undefined);
    }).catch(() => undefined);
  }
  private disarmWorkspace(paneId: number, cause: PickerFolderDisarmedCause): void {
    emitSignal(Signal.PICKER_FOLDER_DISARMED, { pane_id: paneId, cause }, { pane_id: paneId });
    this.setPane(paneId, { armed: null, pickerHalf: PaneDrawnPickerLine.WS, modelSelIdx: null });
  }
  private enterGuidance(paneId: number): void {
    emitSignal(Signal.PICKER_LINE_ENTERED, { pane_id: paneId, line: PickerLineEnteredLine.GUIDANCE, cause: PickerLineEnteredCause.PICKED }, { pane_id: paneId });
    this.setState((st) => ({ panes: st.panes.map((x) => {
      if (x.id !== paneId) return x;
      const at = GUIDANCE_OPTIONS.findIndex((gd) => gd.level === (x.guidance ?? null));
      return { ...x, pickerHalf: PaneDrawnPickerLine.GUIDANCE, guidanceSel: at < 0 ? 0 : at };
    }) }));
  }
  private pane(paneId: number): AppPane | undefined { return this.state.panes.find((x) => x.id === paneId); }
  private pickGuidance(paneId: number, option: GuidanceOption): void {
    const pane = this.pane(paneId);
    if (!pane || !pane.armed || pane.pickerHalf !== PaneDrawnPickerLine.GUIDANCE) return;
    // UI sprint 143: the guidance level no longer starts the session; LENGTH comes next.
    emitSignal(Signal.PICKER_LINE_ENTERED, { pane_id: paneId, line: PickerLineEnteredLine.LENGTH, cause: PickerLineEnteredCause.PICKED }, { pane_id: paneId });
    this.setPane(paneId, { guidance: option.level, pickerHalf: PaneDrawnPickerLine.LENGTH, lengthSel: LENGTH_DEFAULT_AT });
    vmOf()?.pickBundle(option.bundle);
  }
  private pickLength(paneId: number, option: ValueOption): void {
    const pane = this.pane(paneId);
    if (!pane || !pane.armed || pane.pickerHalf !== PaneDrawnPickerLine.LENGTH) return;
    emitSignal(Signal.PICKER_LINE_ENTERED, { pane_id: paneId, line: PickerLineEnteredLine.TONE, cause: PickerLineEnteredCause.PICKED }, { pane_id: paneId });
    this.setPane(paneId, { length: option.value, pickerHalf: PaneDrawnPickerLine.TONE, toneSel: TONE_DEFAULT_AT });
  }
  private pickTone(paneId: number, option: ValueOption): void {
    const pane = this.pane(paneId);
    if (!pane || !pane.armed || pane.pickerHalf !== PaneDrawnPickerLine.TONE) return;
    this.setPane(paneId, { tone: option.value });
    vmOf()?.pickControls(pane.length || null, option.value);
    this.commitPane(paneId, pane.armed);
  }
  private commitPane(paneId: number, armed: Armed): void {
    emitSignal(Signal.PICKER_COMMITTED, { pane_id: paneId, workspace: armed.ws || null, is_default: armed.isDefault }, { pane_id: paneId });
    this.bindHow.set(paneId, PaneBoundHow.PICKER);
    const vm = vmOf();
    if (armed.isDefault) {
      vm?.pickWorkspace(null);
      this.bindPane(paneId, "", true);
      return;
    }
    vm?.pickWorkspace(armed.ws);
    if (vm && armed.ws !== SHARED_SANDBOX) void vm.addWorkspace(armed.ws);
    this.bindPane(paneId, armed.ws);
  }

  // Sprint 085: ⌘W ends the pane's session (as /exit does) and gives its space to the neighbour that
  // shares its edge. The last pane stays open; ⌘⇧W closes the window.
  private closePaneNow(paneId: number): void {
    if (this.state.panes.length <= 1) return;
    const vm = vmOf();
    const ctl = vm?.get(paneId);
    if (ctl && ctl.snapshot().sessionId) ctl.endSession("user_close").catch(() => undefined);
    vm?.drop(paneId);
    this.setState((s) => {
      const out = closePane({ cols: s.cols, rows: s.rows, colW: s.colW, rowW: s.rowW }, s.panes, paneId);
      return out ? { ...out.grid, panes: out.panes, focused: out.focused } : null;
    });
  }

  // The driver a pane's chip shows. A bound session runs the driver on its manifest, which its
  // controller reads at attach; a resumed session shows that, not the roster default. An unbound pane
  // shows the driver picked for its next session, and none before one is picked.
  private paneDriver(pane: AppPane): string | null {
    const snap = this.snap(pane.id);
    if (snap && snap.sessionId && snap.driver) return snap.driver;
    return pane.driver || null;
  }
  private driverLabelOf(driver: string | null, snap: Snapshot | undefined): string {
    return driverLabel(driver, snap?.cliVersions ?? null, snap?.driverVersion ?? {});
  }

  // The model column's rows (web/app/derive/driver_label.ts, sprint 281); their actions run here.
  private modelHalfRows(p: AppPane, fsnap: Snapshot | undefined): (ModelRowView & { isGroup: boolean; expanded: boolean; expandable: boolean; current: boolean; notHeader: boolean })[] {
    const s = this.state;
    const rows = modelRows({
      groups: fsnap?.driverGroups ?? [], roster: fsnap?.driverRoster ?? [], cliVersions: fsnap?.cliVersions ?? null,
      currentDriver: this.paneDriver(p), expandedGroups: s.driverExpandedGroups,
      expandedCli: s.driverExpandedCli, expandedFamily: s.driverExpandedFamily,
    });
    const pickDriverAndVersion = (cli: string, versionId: string | null) => {
      this.noteCards({ ddFor: null, wsFor: this.state.wsFor }, TopBarCardSetCause.PICKED);
      this.setState((st) => ({ ddFor: null, driverExpandedCli: null, driverExpandedFamily: null, panes: st.panes.map((x) => (x.id === p.id ? { ...x, driver: cli } : x)) }));
      const vm = vmOf();
      if (vm) { vm.pickDriver(cli); vm.pickDriverVersion(cli, versionId); }
      // UI sprint 132: a model picked with a folder armed moves on to the guidance line.
      if (p.armed) this.enterGuidance(p.id);
    };
    const toggle = (what: ModelToggle) => (ev?: unknown) => {
      stop(ev);
      if ("group" in what) this.setState((st) => ({ driverExpandedGroups: { ...st.driverExpandedGroups, [what.group]: !st.driverExpandedGroups[what.group] } }));
      else if ("cli" in what) this.setState((st) => ({ driverExpandedCli: st.driverExpandedCli === what.cli ? null : what.cli, driverExpandedFamily: null }));
      else this.setState((st) => ({ driverExpandedFamily: st.driverExpandedFamily === what.family ? null : what.family }));
    };
    const noop = () => undefined;
    return rows.map((row) => {
      const pick = row.pick;
      return {
        label: row.label, indent: row.indent, lit: "0", cursor: "pointer", liveRow: true, greyRow: false, bg: "transparent",
        color: row.current ? "#e2e5e9" : "#b9bec5",
        notHeader: true, isGroup: row.isGroup, current: row.current, expanded: row.expanded, expandable: row.expandable,
        chevron: row.expandable ? (row.expanded ? "▾" : "◂") : " ",
        toggleExpand: row.toggle ? toggle(row.toggle) : noop,
        pick: "driver" in pick ? () => pickDriverAndVersion(pick.driver, pick.version) : toggle(pick),
      };
    });
  }
  private modelSelIdx(p: AppPane, picks: readonly { current: boolean }[]): number {
    if (typeof p.modelSelIdx === "number") return p.modelSelIdx;
    const i = picks.findIndex((opt) => opt.current);
    return i < 0 ? 0 : i;
  }

  // UI sprints 124, 128: the workspace column's rows, with each open row's sessions
  // (web/app/derive/picker.ts, sprint 275).
  private wsPickerRows(p: AppPane, recent: readonly WorkspaceRow[]): (WsRowView & { kind: string; expandable: boolean; expandKey: string; sessions: (WsRowView["sessions"][number] & { row: SessionRow })[] })[] {
    if (!p.unbound) return [];
    const inheritFrom = this.state.panes.find((pp) => pp.id !== p.id && !pp.unbound && !!pp.ws);
    const { rows } = workspaceRows({
      recentWorkspaces: recent,
      inherit: inheritFrom && inheritFrom.ws ? { path: inheritFrom.ws, name: inheritFrom.name } : null,
      typed: p.wsQ, armed: p.armed, pickerHalf: p.pickerHalf, sel: p.wsSelIdx,
      expanded: this.state.pickerExpandedWs, paged: this.state.pickerPagedByWs,
    });
    // A session picked under a row opens in this pane, as the records page's pick does: the pane is
    // bound before the attach so the transcript draws.
    const attach = (row: SessionRow) => {
      const vm = vmOf();
      if (!vm || !row.sessionId) return;
      this.bindHow.set(p.id, PaneBoundHow.ATTACH);
      this.setPane(p.id, { unbound: false, ws: row.workspacePath || "", shape: row.workspaceShape || "flat", name: row.name || p.name });
      void vm.attachExisting(row.sessionId);
    };
    // On open, a row reads its first sessions once.
    const toggle = (path: string) => {
      const was = !!this.state.pickerExpandedWs[path];
      this.setState((st) => ({ pickerExpandedWs: { ...st.pickerExpandedWs, [path]: !was } }));
      const vm = vmOf();
      if (!was && vm && !this.state.pickerPagedByWs[path]) {
        vm.loadSessionsByWorkspace(path, 0, 5).then((r) => {
          this.setState((st) => ({ pickerPagedByWs: { ...st.pickerPagedByWs, [path]: { rows: r.rows, total: r.total } } }));
        }).catch(() => undefined);
      }
    };
    return rows.map((row) => ({
      kind: row.kind, path: row.path, meta: row.meta, key: row.key, expanded: row.expanded, expandable: row.expandable, expandKey: row.expandKey,
      c: row.lit ? "#e2e5e9" : "#b9bec5",
      bg: row.lit ? "#2e3138" : "transparent",
      litAttr: row.lit ? "1" : "0",
      chevron: row.expandable ? (row.expanded ? "▾" : "▸") : " ",
      toggleExpand: row.expandable ? (ev?: unknown) => { stop(ev); toggle(row.expandKey); } : () => undefined,
      sessions: row.sessions.map((s) => ({
        row: s.row, name: s.name, driver: s.driver, statusLabel: s.statusLabel, dotColor: s.dotColor,
        sessionIdShort: s.idShort, pick: () => attach(s.row),
        bg: s.lit ? "#2e3138" : "transparent", litAttr: s.lit ? "1" : "0",
      })),
      pick: () => {
        if (row.kind === "choose") { void this.pickFolder(p.id); return; }
        this.armWorkspace(p.id, row.kind === "default" ? "" : row.path, row.kind === "default");
      },
    }));
  }

  // UI sprints 124, 128: the workspace bar's keys. ↑↓ move, ↵ picks, ⇧↵ (or ⌥↵) opens or folds a row
  // with rows under it; → ← also open and fold. Before a folder is armed the keys work the workspace
  // column; after, the model column, where esc disarms. ⇥ fills the typed path from the nearest
  // recent folder.
  private wsKey(paneId: number, ev: KeyEv): void {
    const p = this.pane(paneId);
    if (!p || !p.unbound) return;
    const fsnap = this.snap(this.state.focused);
    const opens = ev.key === "Enter" && (ev.shiftKey || ev.altKey);
    const reveal = (sel: string) => setTimeout(() => {
      for (const el of Array.from(document.querySelectorAll(sel))) el.scrollIntoView({ block: "nearest" });
    }, 0);
    // UI sprint 143: GUIDANCE, LENGTH and TONE share a line's keys (lineStep); esc or ↑ steps back.
    const lines: [PickerHalf, ChoiceOption[], SelKey, number, (o: ChoiceOption) => void, PickerLineEnteredLine][] = [
      [PaneDrawnPickerLine.GUIDANCE, GUIDANCE_OPTIONS, "guidanceSel", 0, (opt) => this.pickGuidance(paneId, opt as GuidanceOption), PickerLineEnteredLine.MODEL],
      [PaneDrawnPickerLine.LENGTH, LENGTH_OPTIONS, "lengthSel", 1, (opt) => this.pickLength(paneId, opt as ValueOption), PickerLineEnteredLine.GUIDANCE],
      [PaneDrawnPickerLine.TONE, TONE_OPTIONS, "toneSel", 1, (opt) => this.pickTone(paneId, opt as ValueOption), PickerLineEnteredLine.LENGTH],
    ];
    for (const [half, opts, selKey, start, pick, back] of lines) {
      if (p.pickerHalf !== half || !p.armed) continue;
      const step = lineStep(opts.length, p[selKey] ?? start, ev.key);
      if (!step) return;
      ev.preventDefault();
      if ("move" in step) this.setPane(paneId, { [selKey]: step.move });
      else if ("pick" in step) pick(opts[step.pick]);
      else {
        emitSignal(Signal.PICKER_LINE_ENTERED, { pane_id: paneId, line: back, cause: PickerLineEnteredCause.BACK }, { pane_id: paneId });
        this.setPane(paneId, { pickerHalf: HALF_OF_LINE[back] });
      }
      return;
    }
    if (p.pickerHalf === PaneDrawnPickerLine.MODEL && p.armed) {
      const opts = this.modelHalfRows(p, fsnap);
      if (!opts.length) return;
      const at = Math.max(0, Math.min(this.modelSelIdx(p, opts), opts.length - 1));
      const row = opts[at];
      const move = (i: number) => { this.setPane(paneId, { modelSelIdx: i }); reveal("[data-model-half] [data-lit=\"1\"]"); };
      // UI sprint 149: ↓ keeps drilling. Landing on a folded group whose group above is open opens it;
      // on the last row ↓ stays put while the column scrolls, and wraps only when it all fits.
      if (ev.key === "ArrowDown") {
        ev.preventDefault();
        if (at + 1 >= opts.length) {
          const scroll = document.querySelector(`[data-pane="${paneId}"] [data-model-scroll]`);
          move(scroll && scroll.scrollHeight > scroll.clientHeight ? at : 0);
          return;
        }
        const next = opts[at + 1];
        const above = opts.slice(0, at + 1).reverse().find((opt) => opt.isGroup);
        if (next.isGroup && !next.expanded && above && above.expanded) next.toggleExpand();
        move(at + 1);
        return;
      }
      if (ev.key === "ArrowUp") { ev.preventDefault(); move((at - 1 + opts.length) % opts.length); return; }
      if (ev.key === "ArrowRight" && row.expandable && !row.expanded) { ev.preventDefault(); move(at); row.toggleExpand(); return; }
      if (ev.key === "ArrowLeft" && row.expandable && row.expanded) { ev.preventDefault(); move(at); row.toggleExpand(); return; }
      // UI sprint 151: ← inside an open row folds that row (the nearest row above with a smaller
      // indent) and lights it; on a top-level row it goes back to the workspace column (150).
      if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        let up = at - 1;
        while (up >= 0 && opts[up].indent >= row.indent) up--;
        if (up >= 0 && opts[up].expanded) { move(up); opts[up].toggleExpand(); return; }
        this.disarmWorkspace(paneId, PickerFolderDisarmedCause.ARROW_LEFT);
        return;
      }
      if (opens) { ev.preventDefault(); move(at); if (row.expandable) row.toggleExpand(); return; }
      if (ev.key === "Enter") { ev.preventDefault(); move(at); row.pick(); return; }
      if (ev.key === "Escape") { ev.preventDefault(); this.disarmWorkspace(paneId, PickerFolderDisarmedCause.ESCAPE); }
      return;
    }
    const rows = this.wsPickerRows(p, fsnap?.recentWorkspaces ?? []);
    const flat: (TreeItem & { row: (typeof rows)[number]; session: (typeof rows)[number]["sessions"][number] | null })[] = [];
    for (const r of rows) {
      const parent = flat.length;
      flat.push({ row: r, session: null, expandable: !!r.expandable, expanded: !!r.expanded, parent: null });
      for (const s of r.sessions) flat.push({ row: r, session: s, expandable: false, expanded: false, parent });
    }
    if (!flat.length) return;
    const cur = Math.max(0, Math.min(p.wsSelIdx, flat.length - 1));
    const move = (i: number) => { this.setPane(paneId, { wsSelIdx: i }); reveal("[data-ws-lit=\"1\"]"); };
    if (ev.key === "Tab") {
      const fill = tabFill(rows.map((r) => ({ ...r, armed: false, lit: false, sessions: [] })) as Parameters<typeof tabFill>[0]);
      if (fill !== null) { ev.preventDefault(); this.setPane(paneId, { wsQ: fill, wsSelIdx: 0 }); }
      return;
    }
    const step = treeKey(flat, cur, ev);
    if (!step) return;
    ev.preventDefault();
    if ("move" in step) move(step.move);
    else if ("toggle" in step) flat[step.toggle].row.toggleExpand();
    else if ("fold" in step) { move(step.fold); flat[step.fold].row.toggleExpand(); }
    else { const f = flat[step.pick]; if (f.session) f.session.pick(); else f.row.pick(); }
  }

  // UI sprint 182: a run started now opens a pane per session beside its caller's pane, bound to the
  // session's record. A pane already showing that record is focused instead.
  private openRunPanes(callerPaneId: number, run: { run_id?: unknown; topology?: unknown; sessions?: { record_root?: unknown }[] }): void {
    const vm = vmOf();
    for (const sess of run.sessions || []) {
      const root = String(sess.record_root || "");
      if (!root) continue;
      const shown = this.state.panes.find((p) => p.runRoot === root);
      if (shown) { this.focusCause = PaneFocusedCause.OPEN; this.setState({ focused: shown.id }); vm?.setActive(shown.id); continue; }
      if (this.state.panes.length >= MAX_PANES) {
        vm?.get(callerPaneId)?.noteLine(`run ${String(run.run_id)}: eight panes are open; close one, then /run focus ${String(run.run_id)}`);
        continue;
      }
      this.focusCause = PaneFocusedCause.OPEN;
      this.setState({ focused: callerPaneId }, () => this.split("right", {
        unbound: false, name: `${String(run.topology)} ${String(run.run_id)}`, runRoot: root, ws: "", shape: "flat",
      }, (id) => { vm?.get(id)?.attachRun(root, String(run.topology || "run"), String(run.run_id || "")).catch(() => undefined); }));
    }
  }
  // UI sprint 183: a delegate child opens an interactive pane beside its caller, attached to the
  // child's session, as any session a person writes to. A pane already showing it is focused.
  private openSessionPane(callerPaneId: number, sessionId: string): void {
    if (!sessionId) return;
    const vm = vmOf();
    const shown = this.state.panes.find((p) => p.childSid === sessionId);
    if (shown) { this.focusCause = PaneFocusedCause.OPEN; this.setState({ focused: shown.id }); vm?.setActive(shown.id); return; }
    if (this.state.panes.length >= MAX_PANES) {
      vm?.get(callerPaneId)?.noteLine(`delegate child ${sessionId}: eight panes are open; close one to see it`);
      return;
    }
    this.focusCause = PaneFocusedCause.OPEN;
    this.setState({ focused: callerPaneId }, () => this.split("right", {
      unbound: false, name: "delegate " + sessionId.slice(2, 10), childSid: sessionId, ws: "", shape: "flat",
    }, (id) => { vm?.get(id)?.attachExisting(sessionId).catch(() => undefined); }));
  }
  // A split adds one pane, up to eight (web/app/derive/panes.ts, sprint 319). `patch` sets fields of
  // the new pane; `then(id)` runs once it is in the layout (UI sprint 182). UI sprint 146: a new pane
  // is drawn in the panes view, so making one goes there.
  private split(dir: SplitDir, patch?: Partial<AppPane>, then?: (id: number) => void): void {
    let madeId: number | null = null;
    this.viewCause = ViewChangedCause.SPLIT;
    this.setState((s) => {
      if (s.panes.length >= MAX_PANES) return null;
      const out = splitPane({ cols: s.cols, rows: s.rows, colW: s.colW, rowW: s.rowW }, s.panes, s.focused, dir, { ...this.newPane(), ...(patch || {}) });
      if (!out) return null;
      madeId = out.made.id;
      return { ...out.grid, panes: out.panes, focused: out.made.id, vs: show("panes") };
    }, () => {
      if (madeId === null) return;
      vmOf()?.setActive(madeId);
      if (then) then(madeId);
    });
  }

  override componentDidMount(): void {
    // Pane 1's PANE_OPENED is written by web/reveal.ts, where pane 1 is created (sprint 377).
    for (const p of this.state.panes) if (p.id !== 1) emitSignal(Signal.PANE_OPENED, { pane_id: p.id, cause: PaneOpenedCause.START }, { pane_id: p.id });
    // A reload's ?session= is attached to pane 1 by web/reveal.ts, outside the window's controls.
    if (new URLSearchParams(window.location.search).get("session")) this.bindHow.set(1, PaneBoundHow.RESTORE);
    // 19c settings: theme and type size, per viewer (web/app/state/settings.ts, sprint 204).
    loadSettings();
    this.offs.push(settings.subscribe(() => this.forceUpdate()));
    this.offs.push(find.subscribe(() => this.forceUpdate()));
    // The files tree's row count, for EDITOR_DRAWN (sprint 410).
    // Sprint 424: App commits with the editor's own components, so every state the view draws (the status
    // line's mode among them) reaches EDITOR_DRAWN. A plain forceUpdate from a key CodeMirror handles is a
    // default-priority render that can come after several store changes, while the store's readers render
    // at once; flushSync renders App in step. Inside App's own componentDidUpdate React cannot flush.
    this.offs.push(editorStore.subscribe(() => { if (this.committing) this.forceUpdate(); else flushSync(() => this.forceUpdate()); }));
    // Each pane controller's snapshot arrives through web/app/state/shell.ts (sprint 211).
    const applyShell = () => {
      const { snapshots, changedPane } = shell.getSnapshot();
      if (changedPane == null) return;
      const snap = snapshots[changedPane];
      const focusedId = this.state.focused;
      let revealed: boolean | undefined;
      // UI sprint 172: `/language` bumps the pane's open tick; meta opens on the lens, at the latest
      // shift's reply when there is one.
      const tick = snap.languageOpenTick ?? 0;
      if (changedPane === focusedId && tick > (this.langTicks[changedPane] ?? 0)) {
        revealed = true;
        setMode(GraphMode.Language, changedPane, snap.sessionId);
        const shifts = snap.language?.shifts ?? [];
        if (shifts.length) selectSeq(shifts[shifts.length - 1].source_seq, changedPane, SeqSelectedHow.LANGUAGE_OPEN);
      }
      this.langTicks[changedPane] = tick;
      if (revealed) { this.viewCause = ViewChangedCause.LANGUAGE; this.setState({ controllerSnapshots: { ...snapshots }, vs: show("meta") }); }
      else this.setState({ controllerSnapshots: { ...snapshots } });
      // The focused pane's session is the URL's `session`, so a reload reopens it.
      if (changedPane === focusedId && snap.sessionId !== (this.urlSessions[changedPane] ?? null)) {
        this.urlSessions[changedPane] = snap.sessionId;
        const url = new URL(window.location.href);
        if (snap.sessionId) url.searchParams.set("session", snap.sessionId);
        else url.searchParams.delete("session");
        window.history.replaceState({}, "", url.toString());
      }
    };
    this.offs.push(shell.subscribe(applyShell));
    applyShell();
    this.publish();
    this.notePaneDrawn();
    // The left column's width follows the meta view's split (web/app/state/meta.ts, sprint 313).
    this.offs.push(meta.subscribe(() => this.setState({ metaSplit: meta.getSnapshot().split })));
    // The input bar's /exit names the pane's session (web/app/state/input_bar.ts, sprint 261).
    this.offs.push(setTitleOf((paneId) => { const p = this.pane(paneId); return p ? this.paneTitle(p) : "pane-" + paneId; }));
    // A session picked on the records page opens in the focused pane (sprint 240), marked bound
    // first with the record's own folder and shape, so the pane draws the transcript.
    this.offs.push(setOpenSession((r) => {
      const vm = vmOf();
      if (!vm || !r.sessionId) return;
      this.bindHow.set(this.state.focused, PaneBoundHow.ATTACH);
      this.viewCause = ViewChangedCause.RECORDS_OPEN;
      this.setState((s) => ({
        vs: closePage(s.vs),
        panes: s.panes.map((pn) => (pn.id === s.focused ? { ...pn, unbound: false, ws: r.workspacePath || "", shape: r.workspaceShape || "flat", name: r.name || pn.name } : pn)),
      }));
      void vm.attachExisting(r.sessionId);
    }));
    // First run's pick gives pane 1 its driver (sprint 225).
    this.offs.push(firstRun.subscribe(() => {
      const picked = firstRun.getSnapshot().picked;
      if (picked) this.setPane(1, { driver: picked });
    }));
    this.offs.push(onCommand((command) => {
      if (command === "toggle-meta") this.toggleMeta(ViewChangedCause.MENU);
      else if (command === "toggle-assays") this.toggleSurface(Surface.Assay, ViewChangedCause.MENU);
      // Sprint 416: View ▸ Editor, and the editor's layout items, which act only while it is open.
      else if (command === "toggle-editor") this.toggleEditor(ViewChangedCause.MENU, "View > Editor");
      // Sprint 423: nano's ⌃X leaves the editor for the pane, as Escape does.
      else if (command === "leave-editor") { if (this.state.vs.view === "editor") { this.viewCause = ViewChangedCause.KEY; this.setState({ vs: show("panes") }); } }
      else if (command === "editor-dock" && this.state.vs.view === "editor") toggleDock(this.state.focused);
      // Sprint 441: Go ▸ Quick Open, in the editor.
      else if (command === "quick-open" && this.state.vs.view === "editor") openQuick();
      else if (command === "editor-swap" && this.state.vs.view === "editor") toggleSwap(this.state.focused);
      else if (command === "editor-focus" && this.state.vs.view === "editor") toggleFocus(this.state.focused);
      else if (command === "settings") openSettings();
      // Sprint 419: in the editor ⌘W closes the active tab and never ends the session (roadmap r8 key table).
      // Sprint 425 (roadmap r8, the key table): ⌘W with no tab open in the editor, and ⌘S, refused and written.
      else if (command === "close-pane" && this.state.vs.view === "editor") { const a = editorStore.getSnapshot().active; if (a) closeFile(a, this.state.focused); else emitSignal(Signal.EDITOR_KEY_REFUSED, { key: "Meta+w", reason: EditorKeyRefusedReason.NO_FILE }, { pane_id: this.state.focused }); }
      // Sprint 426: Edit ▸ Undo and Redo, routed (roadmap r8 key table; BLACKBOARD 2026-11-09 the undo boundary).
      else if (command === "undo" || command === "redo") {
        const to = this.state.vs.view === "editor" ? routeUndo(command) : document.execCommand(command) ? UndoRoutedTo.PAGE : UndoRoutedTo.NONE;
        emitSignal(Signal.UNDO_ROUTED, { direction: command === "undo" ? UndoRoutedDirection.UNDO : UndoRoutedDirection.REDO, to }, { pane_id: this.state.focused });
      }
      else if (command === "save") { if (this.state.vs.view === "editor") requestSave(this.state.focused); else emitSignal(Signal.EDITOR_KEY_REFUSED, { key: "Meta+s", reason: EditorKeyRefusedReason.NOT_EDITOR }, { pane_id: this.state.focused }); }
      else if (command === "close-pane") this.closePaneNow(this.state.focused);
      else if (command === "open") this.openKey();
    }));
    // UI sprint 182: a run a session starts now opens its panes; `/run focus` shows or reopens one. A
    // start read back from an older record (`t` over a minute old) opens nothing.
    const vm = vmOf();
    if (vm) this.offs.push(vm.onEvent((ev) => {
      const run = (ev.payload || {}) as { t?: unknown; session_id?: unknown };
      if (ev.tag === "RUN_STARTED") {
        if (typeof run.t === "number" && Date.now() / 1000 - run.t > 60) return;
        this.openRunPanes(ev.paneId, run as Parameters<App["openRunPanes"]>[1]);
      } else if (ev.tag === "RUN_FOCUS_REQUESTED") this.openRunPanes(ev.paneId, run as Parameters<App["openRunPanes"]>[1]);
      else if (ev.tag === "DELEGATE_CHILD_STARTED") this.openSessionPane(ev.paneId, String(run.session_id || ""));
    }));
    // Sprint 085: a mousedown outside the top bar's cards closes them; the chip that opens a card
    // sits inside its region, so its own click toggles it.
    const outside = (ev: MouseEvent) => {
      const s = this.state;
      if (!s.ddFor && !s.wsFor) return;
      if (ev.target instanceof Element && ev.target.closest("[data-dropdown-region]")) return;
      this.noteCards({ ddFor: null, wsFor: null }, TopBarCardSetCause.OUTSIDE);
      this.setState({ ddFor: null, wsFor: null });
    };
    this.listen(document, "mousedown", outside as EventListener, true);
    this.listen(window, "keydown", ((e: KeyboardEvent) => this.onKey(e)) as EventListener);
    this.listen(window, "mousemove", ((e: MouseEvent) => {
      const gt = this.gut;
      if (!gt) return;
      const s = this.state;
      if (gt.type === "col") this.setState({ colW: dragCols(s.colW, gt.i, e.movementX, s.winW) });
      else this.setState({ rowW: dragRows(s.rowW, gt.i, e.movementY) });
    }) as EventListener);
    this.listen(window, "mouseup", () => { this.gut = null; });
    this.listen(window, "resize", () => this.setState({ winW: window.innerWidth }));
  }
  private listen(target: EventTarget, type: string, fn: EventListener, capture = false): void {
    target.addEventListener(type, fn, capture);
    this.offs.push(() => target.removeEventListener(type, fn, capture));
  }

  // The window's keys: web/app/keymap.ts (sprint 327, F336) says which action a key takes.
  private onKey(e: KeyboardEvent): void {
    const s = this.state;
    const isBox = (el: EventTarget | null): el is HTMLInputElement | HTMLTextAreaElement | HTMLElement =>
      el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    const el = document.activeElement;
    const fp = this.pane(s.focused);
    const fsnap = this.snap(s.focused);
    const mt = meta.getSnapshot();
    // The language lens's turns, built only while it shows (web/app/derive/language_keys.ts).
    let lens: Lens | null = null;
    if (metaBase(s.vs) && mt.mode === GraphMode.Language && !pageOf(s.vs)) {
      const lg = language.getSnapshot();
      lens = buildLanguageLens(this.streamView.language, { stream: lg.stream, selTurn: selectedTurn(this.streamView.envelopes, mt.sel), lane: lg.lane, view: lg.view });
    }
    const caret = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.selectionStart === el.selectionEnd : false;
    const action = windowKey(e, {
      typing: isBox(el), targetTyping: isBox(e.target), caretOnly: isBox(el) && caret,
      surface: pageOf(s.vs), revealed: metaBase(s.vs), editor: s.vs.view === "editor",
      vimCode: s.vs.view === "editor" && settings.getSnapshot().binding === "vim" && !!(el instanceof HTMLElement && el.hasAttribute("data-editor-code")),
      editorTerminal: s.vs.view === "editor" && !!(el instanceof HTMLElement && el.closest('[data-editor-area="bottom"], [data-editor-sill]')),
      editorTree: s.vs.view === "editor" && !!(el instanceof HTMLElement && el.closest("[data-editor-tree]")),
      editorCode: s.vs.view === "editor" && !!(el instanceof HTMLElement && el.hasAttribute("data-editor-code")),
      pickerFocused: !!(fp && fp.unbound && !(fsnap && fsnap.sessionId)),
      languageTurns: !!(lens && lens.turns.length),
      findOpen: find.getSnapshot().open, dialogOpen: dialogOpen(), cardOpen: !!(s.ddFor || s.wsFor),
      running: !!(fsnap && fsnap.sessionId && fsnap.connection === PaneDrawnConnection.CONNECTED && !fsnap.parkReason && !fsnap.endedReason),
      menuOpen: menuOpen(),
    });
    // KEY_ROUTED (sprint 367): the keys the keymap reads, the arrows, Enter, Escape and any ⌘ or Ctrl
    // chord, with the action they took and where it went: a key with no action pressed in a text box
    // went to the box (its target, as the Enter that runs `/language` has unmounted it by now). A typed
    // character is never written.
    // Sprint 456: an ⌥ chord is named by its physical letter (Alt+A), since macOS gives `key` the composed character (å).
    const letter = e.altKey && /^Key[A-Z]$/.test(e.code) ? e.code.slice(3) : e.key;
    const name = [e.metaKey && "Meta", e.ctrlKey && "Control", e.altKey && "Alt", e.shiftKey && "Shift", letter].filter(Boolean).join("+");
    if (ARROWS.includes(e.key) || e.key === "Escape" || ((e.metaKey || e.ctrlKey) && !MODIFIER_KEYS.includes(e.key)) || action?.kind === "add-selection") {
      // A key typed in the editor's code reaches the window retargeted to the code's shadow host (sprint 423).
      const inCode = e.target instanceof HTMLElement && e.target.hasAttribute("data-editor-code");
      const target = action ? KEY_TARGET[action.kind] ?? KeyRoutedTarget.WINDOW : inCode ? KeyRoutedTarget.EDITOR : isBox(e.target) ? KeyRoutedTarget.BOX : KeyRoutedTarget.NONE;
      const routed: KeyAction["kind"] | "none" = action ? action.kind : "none";
      emitSignal(Signal.KEY_ROUTED, { key: name, action: routed, target });
    }
    if (!action) return;
    if (action.kind === "records") { recordsKey(e); return; }
    if (action.kind === "picker" && fp) {
      document.querySelector<HTMLElement>(`[data-ws-input="${fp.id}"]`)?.focus();
      this.wsKey(fp.id, e);
      return;
    }
    if (action.kind === "language" && lens) {
      const step = languageKey(lens.turns, lens.lanes.length, mt.sel, language.getSnapshot().lane, e.key);
      if (!step) return;
      e.preventDefault();
      if ("sel" in step) selectSeq(step.sel, s.focused, SeqSelectedHow.LANGUAGE_KEY);
      else if ("lane" in step) setLanguageLane(step.lane, s.focused);
      else setMode(GraphMode.Stream, s.focused, fsnap ? fsnap.sessionId : null);
      return;
    }
    // Sprint 457: the right-click menu's keys; its Escape closes it, first in the cascade.
    if (action.kind === "menu") { e.preventDefault(); menuKey(e.key); return; }
    if (action.kind === "close-menu") { e.preventDefault(); closeMenu(ContextMenuClosedOutcome.ESCAPE); return; }
    if (action.kind === "close-find") { closeFind(); return; }
    if (action.kind === "close-dialog") { closeDialog(DialogClosedOutcome.ESCAPE); return; }
    if (action.kind === "close-cards") { this.noteCards({ ddFor: null, wsFor: null }, TopBarCardSetCause.ESCAPE); this.setState({ ddFor: null, wsFor: null }); return; }
    if (action.kind === "close-surface") { this.viewCause = ViewChangedCause.CLOSE; this.setState((st) => ({ vs: closePage(st.vs) })); return; }
    // Every other action is the window's own: the key does nothing else, so no character is typed (⌥A in the code,
    // sprint 456).
    e.preventDefault();
    if (action.kind === "toggle-meta") this.toggleMeta(ViewChangedCause.KEY);
    else if (action.kind === "toggle-editor") this.toggleEditor(ViewChangedCause.KEY, name);
    else if (action.kind === "refuse-split") emitSignal(Signal.EDITOR_KEY_REFUSED, { key: name, reason: EditorKeyRefusedReason.NO_SPLIT }, { pane_id: s.focused });
    else if (action.kind === "fold-editor") foldColumn(action.column, !editorStore.getSnapshot().folded[action.column], EditorColumnFoldedCause.KEY, s.focused);
    // Sprint 428: ⌘F and ⌥⌘F in the editor go to the inspector's FIND / REPLACE, unfolding it if folded.
    else if (action.kind === "editor-find") {
      if (editorStore.getSnapshot().folded.right) foldColumn("right", false, EditorColumnFoldedCause.KEY, s.focused);
      editorStore.set({ findFocus: editorStore.getSnapshot().findFocus + 1 });
      requestAnimationFrame(() => { const box = document.querySelector<HTMLInputElement>(`[data-find-input="${action.field}"]`); box?.focus(); box?.select(); });
    }
    // Sprint 434 (roadmap r10 E8): ⌘⇧F in the editor opens the left column's search, unfolding it if folded.
    else if (action.kind === "editor-search") openSearch(s.focused);
    // Sprint 441: ⌘P in the editor opens quick open.
    else if (action.kind === "quick-open") openQuick();
    // Sprint 454, 456: ⌥A in the code adds the selection (or the file) to the message, and types nothing.
    else if (action.kind === "add-selection") addSelection(s.focused);
    // Sprint 437: ⌥⌘F in the tree opens its find by name.
    else if (action.kind === "tree-find") {
      if (editorStore.getSnapshot().folded.left) foldColumn("left", false, EditorColumnFoldedCause.KEY, s.focused);
      editorStore.set({ leftTab: "files", treeFindFocus: editorStore.getSnapshot().treeFindFocus + 1 });
    }
    else if (action.kind === "toggle-tools") toggleToolOutputMode(ToolOutputModeSetCause.KEY);
    else if (action.kind === "split") this.split(action.dir);
    else if (action.kind === "toggle-find") toggleFind();
    else if (action.kind === "settings") openSettings();
    else if (action.kind === "toggle-assays") this.toggleSurface(Surface.Assay, ViewChangedCause.KEY);
    // Escape is hard by default, the terminal habit: stop now. ⇧Esc is softer: stop after this tool.
    else if (action.kind === "interrupt") ctlOf(s.focused)?.interruptTurn(action.tier).catch(() => undefined);
  }

  /** The top bar's cards (model: ddFor, workspace: wsFor), each a pane id or null. A card that opens or
   *  closes is TOP_BAR_CARD_SET in its pane's context (v0.24, P-0.24-ACTIONS); a card closed because
   *  the other one opened says other_card. Called with the state about to be set, before setState. */
  private noteCards(next: { ddFor: number | null; wsFor: number | null }, cause: TopBarCardSetCause): void {
    const cards: [TopBarCardSetCard, number | null, number | null][] = [
      [TopBarCardSetCard.MODEL, this.state.ddFor, next.ddFor],
      [TopBarCardSetCard.WORKSPACE, this.state.wsFor, next.wsFor],
    ];
    const opening = cards.some(([, was, now]) => now !== null && now !== was);
    for (const [card, was, now] of cards) {
      if (was !== null && was !== now) emitSignal(Signal.TOP_BAR_CARD_SET, { card, open: false, cause: opening && now === null && cause === TopBarCardSetCause.CLICK ? TopBarCardSetCause.OTHER_CARD : cause }, { pane_id: was });
      if (now !== null && now !== was) emitSignal(Signal.TOP_BAR_CARD_SET, { card, open: true, cause }, { pane_id: now });
    }
  }

  /** The stores the window's other areas read, written after each render. */
  private publish(): void {
    this.computeViews();
    picker.set({ views: this.pickerViews });
    find.set({ streamMatches: this.streamMatches });
    stream.set(this.streamView);
    if (this.panesView) panesStore.set({ view: this.panesView });
    const s = this.state;
    const fp = this.pane(s.focused) ?? s.panes[0];
    chrome.set({ focusedPane: s.focused, unbound: fp.unbound, title: this.paneTitle(fp), surfaceOpen: !!pageOf(s.vs), editorOpen: s.vs.view === "editor", rateLimited: this.props.simulateRateLimit ?? false });
    firstRun.set({ forced: this.props.firstRun ?? false });
    if (this.topBarVals && this.topBarActs) {
      topBar.set(this.topBarVals);
      this.offTopBarActs?.();
      this.offTopBarActs = setTopBarActions({ ...this.topBarActs, finishEdit: (name) => this.finishEdit(name) });
    }
  }
  // UI sprint 145: ↵ names the session (the daemon keeps it); esc cancels; empty changes nothing.
  private finishEdit(name: string | null): void {
    const id = this.state.focused;
    this.setPane(id, { editing: false });
    if (name) ctlOf(id)?.nameSession(name);
  }
  /** App's componentDidUpdate is running (sprint 424): a store change from it re-renders without flushSync. */
  private committing = false;
  override componentDidUpdate(prevProps: AppProps, prevState: AppState): void {
    this.committing = true;
    try { this.didUpdate(prevProps, prevState); } finally { this.committing = false; }
  }
  private didUpdate(prevProps: AppProps, prevState: AppState): void {
    this.notePanes(prevState);
    if (prevState.vs.view !== this.state.vs.view && this.viewCause) emitSignal(Signal.VIEW_CHANGED, { from: prevState.vs.view, to: this.state.vs.view, cause: this.viewCause });
    this.viewCause = null;
    this.noteEditor(prevState);
    this.publish();
    this.notePaneDrawn();
    // The template's tweak sync: only when a tweak changed, never against the window's own state.
    const changed = (k: keyof AppProps) => this.props[k] !== prevProps[k];
    if (!changed("columns") && !changed("rows") && !changed("view")) return;
    const state = this.state;
    const pc = this.props.columns, pr = this.props.rows, pv = this.props.view;
    if ((changed("columns") && pc && pc !== state.cols) || (changed("rows") && pr && pr !== state.rows)) {
      const cols = pc || state.cols, rows = pr || state.rows;
      const need = cols * rows;
      const panes = state.panes.slice(0, Math.max(1, need));
      while (panes.length < need) { const made = this.newPane(); this.startPanes.add(made.id); panes.push(made); }
      const colW = Array.from({ length: cols }, (_, i) => state.colW[i] || 1);
      const rowW = Array.from({ length: rows }, (_, i) => state.rowW[i] || 1);
      this.setState({ cols, rows, colW, rowW, panes });
    }
    if (changed("view") && pv && (pv === "revealed") !== metaBase(state.vs)) { this.viewCause = ViewChangedCause.TWEAK; this.setState({ vs: show(pv === "revealed" ? "meta" : "panes") }); }
  }
  /** PANE_CLOSED, PANE_OPENED, PANE_BOUND and PANE_FOCUSED for what this commit changed. */
  private notePanes(prev: AppState): void {
    const s = this.state;
    const prevIds = new Set(prev.panes.map((p) => p.id));
    const nowIds = new Set(s.panes.map((p) => p.id));
    for (const p of prev.panes) {
      if (nowIds.has(p.id)) continue;
      emitSignal(Signal.PANE_CLOSED, { pane_id: p.id, had_session: showsBinding(p, prev.controllerSnapshots) }, { pane_id: p.id });
      this.bindHow.delete(p.id);
    }
    for (const p of s.panes) {
      const isNew = !prevIds.has(p.id);
      if (isNew) {
        const cause = this.startPanes.delete(p.id) ? PaneOpenedCause.START : p.runRoot ? PaneOpenedCause.RUN : p.childSid ? PaneOpenedCause.DELEGATE : PaneOpenedCause.SPLIT;
        emitSignal(Signal.PANE_OPENED, { pane_id: p.id, cause }, { pane_id: p.id });
      }
      const was = isNew ? false : showsBinding(prev.panes.find((x) => x.id === p.id)!, prev.controllerSnapshots);
      if (was || !showsBinding(p, s.controllerSnapshots)) continue;
      const noted = this.bindHow.get(p.id);
      this.bindHow.delete(p.id);
      const how = p.runRoot ? PaneBoundHow.RUN : p.childSid ? PaneBoundHow.CHILD : noted ?? PaneBoundHow.DIRECT;
      const sid = p.childSid || s.controllerSnapshots[p.id]?.sessionId || null;
      emitSignal(Signal.PANE_BOUND, { pane_id: p.id, binding: p.runRoot ? PaneBoundBinding.RECORD : PaneBoundBinding.SESSION, how, ...(sid ? { session_id: sid } : {}) }, { pane_id: p.id });
    }
    if (s.focused !== prev.focused) {
      const cause = !prevIds.has(s.focused) ? PaneFocusedCause.SPLIT : !nowIds.has(prev.focused) ? PaneFocusedCause.CLOSE : this.focusCause;
      if (cause) emitSignal(Signal.PANE_FOCUSED, { pane_id: s.focused, cause }, { pane_id: s.focused });
    }
    this.focusCause = null;
  }
  /** PANE_DRAWN (v0.15) for each pane whose drawn state this commit changed, from the values publish
   *  just gave the areas that draw it: the picker's view, or the session's snapshot. */
  private notePaneDrawn(): void {
    const s = this.state;
    const live = new Set<number>();
    for (const p of s.panes) {
      live.add(p.id);
      const snap = this.snap(p.id);
      let payload: SignalPayloads[Signal.PANE_DRAWN];
      if (!showsBinding(p, s.controllerSnapshots)) {
        const view = this.pickerViews[p.id];
        payload = {
          pane_id: p.id, state: PaneDrawnState.PICKER, picker_line: p.pickerHalf, armed: !!p.armed,
          folder_rows: view ? view.wsRows.length : 0, model_rows: view ? view.modelRows.length : 0,
          driver_shown: this.paneDriver(p),
        };
      } else {
        const activity = liveActivity(snap);
        const drawn = activity ? TURN_OF_ACTIVITY[activity.kind] : PaneDrawnTurnState.IDLE;
        const turn = drawn === PaneDrawnTurnState.PARKED && snap?.endedReason ? PaneDrawnTurnState.ENDED : drawn;
        payload = {
          pane_id: p.id, state: p.runRoot ? PaneDrawnState.RECORD : PaneDrawnState.SESSION, connection: snap?.connection ?? PaneDrawnConnection.IDLE, turn_state: turn,
          driver_shown: this.paneDriver(p), named: !!snap?.sessionName,
          ...(snap?.sessionId ? { session_id: snap.sessionId } : {}),
        };
      }
      const key = JSON.stringify(payload);
      if (this.lastDrawn.get(p.id) === key) continue;
      this.lastDrawn.set(p.id, key);
      emitSignal(Signal.PANE_DRAWN, payload, { pane_id: p.id });
    }
    for (const id of Array.from(this.lastDrawn.keys())) if (!live.has(id)) this.lastDrawn.delete(id);
  }
  override componentWillUnmount(): void {
    for (const off of this.offs.splice(0)) off();
    this.offTopBarActs?.();
  }

  // ⌘⇧E (sprint 407; roadmap 2026-11-09-code-editor r6, R1): the editor view on the focused pane's
  // session, and back. A pane with no session (its picker, or a session not yet open) has no workspace
  // to show: the key is refused, and the refusal is written so a key that does nothing says why.
  private toggleEditor(cause: ViewChangedCause, key: string): void {
    const s = this.state;
    if (s.vs.view !== "editor" && !this.snap(s.focused)?.sessionId) {
      emitSignal(Signal.EDITOR_KEY_REFUSED, { key, reason: EditorKeyRefusedReason.NO_SESSION }, { pane_id: s.focused });
      return;
    }
    this.viewCause = cause;
    this.setState((st) => ({ vs: toggleEditor(st.vs) }));
  }
  /** The editor run's records for what this commit changed (sprint 407): EDITOR_CLOSED for the pane
   *  it leaves (unless the pane itself closed, which PANE_CLOSED ends), EDITOR_OPENED for the pane it
   *  shows, then EDITOR_DRAWN when what the view draws changed. A focused pane with no session takes
   *  the window back to the panes. */
  private noteEditor(prev: AppState): void {
    const s = this.state;
    const was = editorBase(prev.vs), is = editorBase(s.vs);
    const moved = was && is && prev.focused !== s.focused;
    if (was && (!is || moved) && s.panes.some((p) => p.id === prev.focused)) emitSignal(Signal.EDITOR_CLOSED, { tab_count: editorStore.getSnapshot().tabs.length }, { pane_id: prev.focused });
    if (is && (!was || moved)) { emitSignal(Signal.EDITOR_OPENED, { binding: settings.getSnapshot().binding as EditorOpenedBinding }, { pane_id: s.focused }); this.lastEditorDrawn = null; }
    if (is && !this.snap(s.focused)?.sessionId) { this.viewCause = ViewChangedCause.CLOSE; this.setState({ vs: show("panes") }); return; }
    if (s.vs.view !== "editor") return;
    const drawn: SignalPayloads[Signal.EDITOR_DRAWN] = {
      tab_count: editorStore.getSnapshot().tabs.length, left_folded: editorStore.getSnapshot().folded.left, right_folded: editorStore.getSnapshot().folded.right, bottom_folded: editorStore.getSnapshot().folded.bottom,
      showing: editorStore.getSnapshot().showing === "meta" ? EditorDrawnShowing.LENSES : EditorDrawnShowing.SPINE, left_tab: editorStore.getSnapshot().leftTab as EditorDrawnLeftTab,
      binding: settings.getSnapshot().binding as EditorDrawnBinding,
      // Sprint 424 (v0.33): the buffer's state the status line and the centre draw.
      mode: drawnMode(editorStore.getSnapshot().mode), unsaved: editorStore.getSnapshot().unsaved.length,
      // Sprint 425 (v0.34): the stale-save offer drawn for the shown file.
      conflict: !!editorStore.getSnapshot().conflict && editorStore.getSnapshot().conflict === editorStore.getSnapshot().active,
      // Sprint 431 (v0.40): the session's edits marked and not yet resolved.
      follow_marks: editorStore.getSnapshot().follow.length,
      dock: editorStore.getSnapshot().dock === "right" ? EditorDrawnDock.RIGHT : EditorDrawnDock.BOTTOM,
      sides_swapped: editorStore.getSnapshot().swapped, focus: editorStore.getSnapshot().focus.on, tree_rows: editorStore.getSnapshot().treeRows, modified_dots: editorStore.getSnapshot().modifiedDots,
      // Sprint 422: what the inspector draws.
      outline_rows: editorStore.getSnapshot().inspector.outlineRows, hunks: editorStore.getSnapshot().inspector.hunks,
      activity_rows: editorStore.getSnapshot().inspector.activityRows, history_rows: editorStore.getSnapshot().inspector.historyRows,
    };
    const key = JSON.stringify(drawn);
    if (key === this.lastEditorDrawn) return;
    this.lastEditorDrawn = key;
    const rec = emitSignal(Signal.EDITOR_DRAWN, drawn, { pane_id: s.focused });
    // Sprint 411: the view paints this record, by its proc_seq, into its pixel anchor.
    editorStore.set({ anchor: {
      seq: rec.proc_seq, tree_rows: drawn.tree_rows, modified_dots: drawn.modified_dots,
      left_folded: drawn.left_folded, right_folded: drawn.right_folded, bottom_folded: drawn.bottom_folded,
      dock_right: drawn.dock === EditorDrawnDock.RIGHT, sides_swapped: drawn.sides_swapped, focus: drawn.focus,
    }, anchor3: {
      seq: rec.proc_seq, mode: drawn.mode, binding: drawn.binding, unsaved: drawn.unsaved, conflict: drawn.conflict, meta: drawn.showing === EditorDrawnShowing.LENSES, follow_marks: Math.min(15, drawn.follow_marks), left_tab: drawn.left_tab,
    }, anchor2: {
      seq: rec.proc_seq, tab_count: drawn.tab_count, outline_rows: drawn.outline_rows, hunks: drawn.hunks,
      activity_rows: drawn.activity_rows, history_rows: drawn.history_rows,
    } });
  }

  // ⌘M and View ▸ Meta (UI sprint 147). Into meta is refused while the focused pane is still at its
  // picker with no session; back to the panes always works.
  private toggleMeta(cause: ViewChangedCause): void {
    const s = this.state;
    // Sprint 430 (the Architect, 2026-11-09): in the editor, the meta pane opens inside the editor view.
    if (s.vs.view === "editor") { toggleMetaPane(s.focused); return; }
    if (!metaBase(s.vs)) {
      const fp = this.pane(s.focused);
      const fs = this.snap(s.focused);
      if (fp && fp.unbound && !(fs && fs.sessionId)) return;
    }
    this.viewCause = cause;
    this.setState((st) => ({ vs: toggleMeta(st.vs) }));
  }
  // UI sprint 145: what the top bar calls a pane: its session's name when it has one, else its label.
  private paneTitle(pane: AppPane): string {
    return this.snap(pane.id)?.sessionName || pane.name;
  }
  // Sprint 085: the records page reads the sessions again on every open; boot's one read can miss.
  private toggleSurface(name: Page, cause: ViewChangedCause): void {
    this.viewCause = cause;
    this.setState((s) => ({ vs: togglePage(s.vs, name) }));
    if (name === Surface.Records) {
      const vm = vmOf();
      vm?.loadLiveSessions().catch(() => undefined);
      vm?.loadRecentWorkspaces().catch(() => undefined);
    }
  }

  /** A pane's picker view (web/app/PanePicker.tsx, sprint 286). */
  private pickerView(p: AppPane, fsnap: Snapshot | undefined, paneW: number): PickerView {
    const wsRows = this.wsPickerRows(p, fsnap?.recentWorkspaces ?? []);
    const rows = this.modelHalfRows(p, fsnap);
    const sel = p.pickerHalf === PaneDrawnPickerLine.MODEL && p.armed ? this.modelSelIdx(p, rows) : -1;
    const noop = () => undefined;
    const modelRowViews: ModelRowView[] = rows.map((opt, i) => {
      if (!p.armed) return { ...opt, color: "#4a4e55", bg: "transparent", cursor: "default", pick: noop, toggleExpand: noop, liveRow: false, greyRow: true, lit: "0" };
      const lit = i === sel;
      return { ...opt, color: lit ? "#e2e5e9" : opt.color, bg: lit ? "#2e3138" : "transparent", cursor: "pointer", liveRow: true, greyRow: false, lit: lit ? "1" : "0" };
    });
    // UI sprint 132 (kernel K288): the guidance level for the session the bar will open. Auto leaves it
    // to the daemon. UI sprint 143: once LENGTH or TONE is open, the picked level shows in white.
    const guidanceOpen = !!p.armed && p.pickerHalf === PaneDrawnPickerLine.GUIDANCE;
    const pastGuidance = !!p.armed && (p.pickerHalf === PaneDrawnPickerLine.LENGTH || p.pickerHalf === PaneDrawnPickerLine.TONE);
    const guidanceRows: ChoiceRowView[] = GUIDANCE_OPTIONS.map((gd, i) => {
      const lit = guidanceOpen && i === (p.guidanceSel ?? 0);
      const picked = pastGuidance && (p.guidance ?? null) === gd.level;
      return {
        label: gd.label, meta: gd.meta, lit: lit ? "1" : "0", live: guidanceOpen, grey: !guidanceOpen,
        color: lit || picked ? "#e2e5e9" : "#b9bec5", greyColor: picked ? "#e2e5e9" : "#4a4e55",
        bg: lit ? "#2e3138" : "transparent", pick: () => this.pickGuidance(p.id, gd),
      };
    });
    const line = (half: PickerHalf, opts: ValueOption[], selKey: SelKey, pick: (o: ValueOption) => void, chosen: string | undefined, defaultAt: number) => {
      const open = !!p.armed && p.pickerHalf === half;
      const at = Math.max(0, Math.min(p[selKey] ?? defaultAt, opts.length - 1));
      return {
        rows: opts.map((opt, i): ChoiceRowView => {
          const lit = open && i === at;
          const picked = !open && chosen === opt.value;
          return {
            label: opt.label, meta: opt.meta, lit: lit ? "1" : "0", live: open, grey: !open,
            color: lit || picked ? "#e2e5e9" : "#b9bec5", bg: lit ? "#2e3138" : "transparent",
            greyColor: picked ? "#e2e5e9" : "#4a4e55", pick: () => pick(opt),
          };
        }),
        headColor: open ? "#62676f" : "#4a4e55",
        note: open ? opts[at].meta : "",
      };
    };
    const len = line(PaneDrawnPickerLine.LENGTH, LENGTH_OPTIONS, "lengthSel", (opt) => this.pickLength(p.id, opt), p.length, LENGTH_DEFAULT_AT);
    const tone = line(PaneDrawnPickerLine.TONE, TONE_OPTIONS, "toneSel", (opt) => this.pickTone(p.id, opt), p.tone, TONE_DEFAULT_AT);
    const narrow = paneW < 480;
    const armedOn = (half: PickerHalf) => !!p.armed && p.pickerHalf === half;
    return {
      pickerDir: narrow ? "column" : "row",
      // UI sprint 150: the workspace list fills its column: the folded rows (the header at 9.5px and
      // each row at 11.5px, both at line-height 2.1) plus, side by side, the 93px of the model
      // column's three lines. An open row's sessions drop into the room under the rows, then the list
      // scrolls; the bar's height, and so its top, never change.
      wsListH: (9.5 * 2.1 + wsRows.length * 11.5 * 2.1 + (narrow ? 0 : 93)).toFixed(2) + "px",
      // A click on the list's empty space, with a folder armed, goes back to the workspace column.
      onWsListClick: (ev?: unknown) => {
        const t = (ev as { target?: EventTarget | null } | undefined)?.target;
        if (p.armed && !(t instanceof Element && t.closest("[data-ws-lit]"))) this.disarmWorkspace(p.id, PickerFolderDisarmedCause.LIST_CLICK);
      },
      wsRows,
      modelArmed: p.armed ? "1" : "0",
      modelBorderL: narrow ? "none" : "1px solid rgba(255,255,255,.08)",
      modelBorderT: narrow ? "1px solid rgba(255,255,255,.08)" : "none",
      // The model column never grows the bar: side by side it fills the workspace column's height and
      // scrolls inside; stacked under a narrow pane it caps at 140px.
      modelInnerPos: narrow ? "static" : "absolute",
      modelScrollBottom: narrow ? "auto" : "93px",
      modelMaxH: narrow ? "140px" : "none",
      modelHeadColor: p.armed ? "#62676f" : "#4a4e55",
      modelRows: modelRowViews,
      guidancePos: narrow ? "static" : "absolute",
      lines: [
        // UI sprint 142: before a model is picked the guidance note is a hint, at the hint level.
        { key: PaneDrawnPickerLine.GUIDANCE, head: "GUIDANCE", bottom: narrow ? "0" : "62px", headColor: armedOn(PaneDrawnPickerLine.GUIDANCE) ? "#62676f" : "#4a4e55", rows: guidanceRows,
          noteClass: armedOn(PaneDrawnPickerLine.GUIDANCE) ? "" : "tx-hint", noteColor: armedOn(PaneDrawnPickerLine.GUIDANCE) ? "#62676f" : "var(--tx-hint)",
          note: armedOn(PaneDrawnPickerLine.GUIDANCE) ? GUIDANCE_OPTIONS[Math.max(0, Math.min(p.guidanceSel ?? 0, GUIDANCE_OPTIONS.length - 1))].meta : pastGuidance ? "" : "pick a model first" },
        { key: PaneDrawnPickerLine.LENGTH, head: "LENGTH", bottom: narrow ? "0" : "31px", headColor: len.headColor, rows: len.rows, noteClass: "", noteColor: "#62676f", note: len.note },
        { key: PaneDrawnPickerLine.TONE, head: "TONE", bottom: "0", headColor: tone.headColor, rows: tone.rows, noteClass: "", noteColor: "#62676f", note: tone.note },
      ],
      wsQ: p.wsQ,
      wsPlaceholder: armedOn(PaneDrawnPickerLine.TONE) ? "← → moves · ↵ picks the tone and starts · esc back to length"
        : armedOn(PaneDrawnPickerLine.LENGTH) ? "← → moves · ↵ picks the length · esc back to guidance"
        : armedOn(PaneDrawnPickerLine.GUIDANCE) ? "← → moves · ↵ picks the guidance · esc back to models"
        : armedOn(PaneDrawnPickerLine.MODEL) ? "↑↓ moves · ⇧↵ opens · ↵ picks the model · esc back"
        : "↑↓ moves · ⇧↵ opens · ↵ picks the folder",
      onWsQ: (ev) => {
        if (this.pane(p.id)?.armed) emitSignal(Signal.PICKER_FOLDER_DISARMED, { pane_id: p.id, cause: PickerFolderDisarmedCause.TYPED }, { pane_id: p.id });
        this.setPane(p.id, { wsQ: ev.target.value, wsSelIdx: 0, armed: null, pickerHalf: PaneDrawnPickerLine.WS, modelSelIdx: null });
      },
      onWsKey: (ev?: unknown) => this.wsKey(p.id, ev as KeyEv),
    };
  }

  /** The views the window's other areas draw, built from the committed state (sprint 344). They were
   *  built in `render` and published after the commit; under React 18's concurrent root a render can
   *  run for an update that commits later or not at all, so a commit could publish another render's
   *  views: the pane picker's folder read armed, then not, then armed again, with no input between,
   *  and a model click in the window between did nothing (the missed model pick, BLACKBOARD
   *  2026-11-05). dc-runtime rendered synchronously, so the old component never met it. */
  private computeViews(): void {
    const state = this.state;
    const fp = this.pane(state.focused) ?? state.panes[0];
    // The registry's back-compat calls (window.__vm.<action>) go to the focused pane.
    vmOf()?.setActive(fp.id);
    const fsnap = this.snap(fp.id);
    const paneW = state.winW / state.cols;
    const session = (p: AppPane) => !!this.snap(p.id)?.sessionId || !p.unbound;
    this.pickerViews = Object.fromEntries(state.panes.filter((p) => p.unbound).map((p) => [p.id, this.pickerView(p, fsnap, paneW)]));
    // The stream's record for meta's lenses, and find's match count in it.
    const envelopes = fsnap?.rawEnvelopes ?? [];
    const q = findQuery();
    this.streamMatches = q ? streamRows(envelopes).filter((e) => findText(e).includes(q)).length : 0;
    this.streamView = { envelopes, topology: fsnap?.topologyGraph ?? null, language: fsnap?.language ?? null };
    const transcriptSize = fontSize(this.props.transcriptFontSize ?? 13);
    this.panesView = {
      cols: trackList(state.colW), rows: trackList(state.rowW), fontSize: transcriptSize,
      panes: state.panes.map((p) => ({
        id: p.id,
        gridCol: p.col + " / span " + p.cw, gridRow: p.row + " / span " + p.rh,
        opacity: state.panes.length > 1 && p.id !== state.focused ? ".55" : "1",
        session: session(p),
        focus: () => { this.focusCause = PaneFocusedCause.CLICK; this.setState({ focused: p.id }); },
      })),
      colGutters: gutterStops(state.colW).map((left, i) => ({ left, grab: (ev?: { preventDefault(): void }) => { ev?.preventDefault(); this.gut = { type: "col", i: i + 1 }; } })),
      rowGutters: gutterStops(state.rowW).map((top, i) => ({ top, grab: (ev?: { preventDefault(): void }) => { ev?.preventDefault(); this.gut = { type: "row", i: i + 1 }; } })),
    };
    this.topBarVals = this.topBarView(fp, fsnap);
    this.topBarActs = {
      startEdit: () => this.setPane(fp.id, { editing: true, nameVal: this.paneTitle(fp) }),
      // UI sprint 139 (U125): the model chip opens a card, as the workspace chip does; it picks nothing.
      toggleModelCard: () => {
        this.noteCards({ ddFor: this.state.ddFor === fp.id ? null : fp.id, wsFor: null }, TopBarCardSetCause.CLICK);
        this.setState((s) => ({ ddFor: s.ddFor === fp.id ? null : fp.id, wsFor: null }));
      },
      toggleWsCard: () => {
        this.noteCards({ ddFor: null, wsFor: this.state.wsFor === fp.id ? null : fp.id }, TopBarCardSetCause.CLICK);
        this.setState((s) => ({ wsFor: s.wsFor === fp.id ? null : fp.id, ddFor: null }));
      },
      openRecords: () => this.toggleSurface(Surface.Records, ViewChangedCause.BUTTON),
      openStudio: () => this.toggleSurface(Surface.Studio, ViewChangedCause.BUTTON),
      // Meta → panes always works; panes → meta waits until the focused pane leaves its picker.
      toggleReveal: () => {
        const s = this.state;
        // Sprint 409: in the editor the chip reads "⌘⇧E pane" and returns to the panes.
        if (s.vs.view === "editor") { this.viewCause = ViewChangedCause.BUTTON; this.setState({ vs: show("panes") }); return; }
        if (!metaBase(s.vs)) { const p = this.pane(s.focused); if (p && p.unbound) return; }
        this.viewCause = ViewChangedCause.BUTTON;
        this.setState((st) => ({ vs: toggleMeta(st.vs) }));
      },
    };
  }

  override render(): React.ReactElement {
    const state = this.state;
    const fp = this.pane(state.focused) ?? state.panes[0];
    const transcriptSize = fontSize(this.props.transcriptFontSize ?? 13);
    const surf = pageOf(state.vs);
    const showTerminal = state.vs.view === "panes";
    const showRevealed = state.vs.view === "meta";
    const showEditor = state.vs.view === "editor";
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#212327", color: "#b9bec5", fontFamily: "ui-monospace,'SF Mono',Menlo,Consolas,monospace", fontSize: 13, overflow: "hidden" }}>
        {/* One top bar (UI sprint 136): it shows the focused pane. */}
        <div style={{ flex: "none", minWidth: 0 }}><TopBar /></div>
        {showTerminal && <PanesView />}
        {showRevealed && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}>
              <div style={{ flex: state.metaSplit.toFixed(3) + " 1 0%", display: "flex", flexDirection: "column", minWidth: 0, background: "#212327" }}>
                <div data-view="meta" data-pane-id={String(fp.id)} style={{ flex: "none" }}><FindBar view="meta" /></div>
                <div onClick={() => setFindScope("transcript")} style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "20px 26px", lineHeight: LOOK[settings.getSnapshot().look].metaLineHeight, fontSize: transcriptSize, minWidth: 0 }}>
                  <div key={fp.id} data-vm-transcript-mount="reveal" data-pane-id={String(fp.id)}>
                    <div data-vm-atom-root="reveal" data-pane-id={String(fp.id)}><Transcript paneId={fp.id} view="reveal" /></div>
                  </div>
                </div>
                <div data-view="meta" data-pane-id={String(fp.id)} style={{ flex: "none" }}><ActivityLine paneId={fp.id} view="meta" /></div>
                <div data-view="meta" data-pane-id={String(fp.id)} style={{ flex: "none" }}><TaskRows paneId={fp.id} view="meta" /></div>
                <div data-view="meta" data-pane-id={String(fp.id)} style={{ flex: "none", padding: "12px 26px 18px" }}><InputBar paneId={fp.id} /></div>
              </div>
              <MetaView key={fp.id} paneId={fp.id} />
            </div>
          </div>
        )}
        {showEditor && <EditorView key={fp.id} paneId={fp.id} fontSize={transcriptSize} sessionId={this.snap(fp.id)?.sessionId ?? ""} workspace={this.snap(fp.id)?.workspacePath ?? (fp.ws || null)} shape={fp.shape || null} />}
        {surf === Surface.Records && <div data-app-mount="records" style={{ flex: 1, overflow: "auto", background: "#212327", padding: "22px 22px" }}><RecordsPage /></div>}
        {surf === Surface.Assay && <div data-app-mount="assays" style={{ flex: 1, overflow: "auto", background: "#212327", padding: "20px 40px" }}><AssayPage /></div>}
        {surf === Surface.Studio && <StudioPage />}
        <div style={{ flex: "none" }}><Footer /></div>
        <Dialogs defaultFontSize={this.props.transcriptFontSize ?? 13} />
        <ContextMenu />
        <FirstRun />
      </div>
    );
  }

  /** The top bar's fields for the focused pane (web/app/state/top_bar.ts, sprint 231). */
  private topBarView(fp: AppPane, fsnap: Snapshot | undefined): TopBarState {
    const state = this.state;
    const surf = pageOf(state.vs);
    const title = this.paneTitle(fp);
    const driver = this.paneDriver(fp) || "";
    const label = this.driverLabelOf(driver, fsnap);
    const version = label.slice(driver.toLowerCase().length).trim();
    // A CLI on its own Auto mode picks the model itself and does not report which (cursor-agent: the
    // stream, `about` and `models` all say Auto). Say so; never name a model it did not report.
    const auto = /^auto\b/.test(version);
    const conn = fsnap?.connection;
    const dot = conn === "connected" ? "#7fb3b8" : conn === "connecting" ? "#82a5c8" : conn === "reconnecting" ? "#c9a05a" : conn === "closed" ? "#c26058" : "#4a4e55";
    const card = workspaceCard({ unbound: fp.unbound, ws: fp.ws || "", shape: fp.shape || "", name: fp.name, workspacePath: fsnap?.workspacePath ?? null });
    return {
      dotBg: dot, dot,
      crumb: surf === Surface.Records ? title + " › records" : surf === Surface.Assay ? title + " › assays" : surf === Surface.Studio ? title + " › studio" : title,
      editing: fp.editing, nameVal: fp.nameVal,
      showChips: !surf, showDriverChip: !surf && !!driver,
      // On Auto the chip names the CLI only; the card says why (UI sprint 139).
      driverName: chipLabel(driver, label),
      modelCardOpen: state.ddFor === fp.id,
      model: driver || "—",
      modelVersion: auto ? "Auto — chosen by " + driver + ", which does not report the model" : (version || "default"),
      guidance: fsnap?.bundleSlug || "auto",
      // UI sprint 143: the Length and Tone positions; null is the default.
      length: fsnap?.length || LENGTH_DEFAULT,
      tone: fsnap?.tone || TONE_DEFAULT,
      // No workspace yet reads ⌥ —; a per-session sandbox reads ⌥ sandbox; a git folder reads its
      // branch, `substrate/<pane name>` (restored in sprint 334). UI sprint 182: a run's pane names the
      // worktree its record names, home written `~`.
      wsLabel: fp.unbound ? "⌥ —" : fp.runRoot ? "⌥ " + (fsnap?.workspacePath || "—").replace(/^\/Users\/[^/]+/, "~")
        : "⌥ " + (fp.shape === "worktree" ? "substrate/" + (fp.name || "main") : (fp.ws || "sandbox")),
      wsCardOpen: state.wsFor === fp.id,
      workspace: card.workspace, shape: card.shape, branch: card.branch,
      escHint: surf ? "esc — back" : "",
      recordsColor: surf === Surface.Records ? "#e2e5e9" : "#9aa0a8",
      studioColor: surf === Surface.Studio ? "#e2e5e9" : "#9aa0a8",
      // Sprint 409: the chip names the way back (spec r6 §4); in the editor, "⌘⇧E pane" on the accent (24a).
      revealLabel: state.vs.view === "editor" ? "⌘⇧E pane" : metaBase(state.vs) ? "panes" : "meta",
      revealColor: (metaBase(state.vs) || state.vs.view === "editor") && !surf ? "#212327" : "#9aa0a8",
      revealBg: (metaBase(state.vs) || state.vs.view === "editor") && !surf ? "#82a5c8" : "#3d434c",
    };
  }
}
