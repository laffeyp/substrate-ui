// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// @ts-nocheck
//
// The dc-runtime component that renders the reveal shell. This file
// used to live inline as `<script type="text/x-dc" data-dc-script>` in
// reveal.html — 2,000 lines of untyped JavaScript with no compiler,
// no ESLint, and no way to search or refactor safely.
//
// Sprint 058 extracts the class body verbatim. dc-runtime still
// consumes the script via reveal.html's `<script data-dc-script>` tag;
// a Vite `transformIndexHtml` plugin (see vite.config.ts) reads THIS
// file, strips TypeScript syntax with esbuild, and injects the result
// into the script tag before dc-runtime scans it. Runtime behaviour
// stays the same.
//
// `@ts-nocheck` for now: this file predates its types. Sprint 059
// adds the enums for envelope kind, transcript role, pane mode, and
// surface, replaces raw-string matches, and drops the pragma. Every
// subsequent rename sprint peels a layer.
//
// Globals the class body references: `DCLogic` (base class exposed by
// support.js), `React` / `ReactDOM` (script tags in reveal.html),
// and `window.__vm` (the PaneRegistry booted by reveal.ts). The stream's helpers that this comment
// named are web/app/derive/stream.ts (sprint 289); the page script imports the modules it uses, which
// esbuild bundles in (vite.config.ts, inlineDcScript).

declare const DCLogic: any;
declare const React: any;
declare const ReactDOM: any;

// Shared enum constants. See web/vm/kinds.ts. The Vite plugin
// (vite.config.ts:inlineDcScript) bundles this import into the
// injected script so dc-runtime sees one flat class body.
import {
  EnvelopeKind, Surface, GraphMode, RevealLevel, GraphDirection,
} from "./vm/kinds";
import { isToolCallRow, isToolResultRow } from "./vm/types";
import { toggleToolOutputMode } from "./vm/tool_output_mode";
import { GUIDANCE_LEVEL_BUNDLES, HANDOFF_DEFAULT, LENGTH_DEFAULT, LengthPosition, TONE_DEFAULT, TonePosition } from "./vm/controls.gen";

// UI sprint 132 (kernel K288, session vocabulary § R): the guidance levels the bar offers, each
// with the bundle that carries it. `auto` names none, so the daemon picks the model's default.
// UI sprint 161: the levels and their bundles are generated from the kernel (vm/controls.gen.ts);
// only the one-line notes are the UI's own.
// The choices' notes live in web/app/derive/control_notes.ts (sprint 261), which the slash menu reads too.
const GUIDANCE_OPTIONS = [
  { level: null, bundle: null, label: 'auto', meta: GUIDANCE_AUTO_META },
  ...Object.entries(GUIDANCE_LEVEL_BUNDLES).map(([level, bundle]) => ({ level, bundle, label: level, meta: GUIDANCE_META[level] || '' })),
];
// UI sprint 143 (kernel K296, session vocabulary § T): the Length and Tone lines under GUIDANCE.
// The positions and defaults are generated from the kernel (vm/controls.gen.ts); only the one-line
// descriptions are the UI's own. The defaults write no text.
const LENGTH_OPTIONS = Object.values(LengthPosition).map(v => ({ value: v, label: v, meta: LENGTH_META[v] || '' }));
const TONE_OPTIONS = Object.values(TonePosition).map(v => ({ value: v, label: v, meta: TONE_META[v] || '' }));
const LENGTH_DEFAULT_AT = LENGTH_OPTIONS.findIndex(o => o.value === LENGTH_DEFAULT);
const TONE_DEFAULT_AT = TONE_OPTIONS.findIndex(o => o.value === TONE_DEFAULT);
import { mdBlocks, mdInlines, renderBlock, renderInline } from "./reveal/markdown";
import { followBottom } from "./reveal/follow_bottom";
import { sessionStatusLook } from "./reveal/session_status";
import { buildLanguageLens, LANGUAGE_STREAM_TABS, languageView, languageViewTabs, LanguageStreamId, LanguageViewMode } from "./reveal/language_lens";
import { fontSize, loadSettings, settings } from "./app/state/settings";
import { closeDialog, dialogOpen, openEndSession, openSettings } from "./app/state/dialogs";
import { chrome } from "./app/state/chrome";
import { firstRun } from "./app/state/first_run";
import { setTopBarActions, topBar } from "./app/state/top_bar";
import { workspaceCard } from "./app/derive/workspace_card";
import { GUIDANCE_AUTO_META, GUIDANCE_META, LENGTH_META, TONE_META } from "./app/derive/control_notes";
import { setTitleOf } from "./app/state/input_bar";
import { closeFind, find, findQuery as findQueryOf, setFindScope, toggleFind } from "./app/state/find";
import { recordsKey, setOpenSession } from "./app/state/records";
import { lineStep, paneShape, SHARED_SANDBOX, tabFill, workspaceRows } from "./app/derive/picker";
import { treeKey } from "./app/derive/tree_key";
import { chipLabel, driverLabel, modelRows } from "./app/derive/driver_label";
import { picker } from "./app/state/picker";
import { setGraphLink, setPickSeq, stream } from "./app/state/stream";
import { findText, streamRows } from "./app/derive/stream";
import { onCommand, shell } from "./app/state/shell";


class Component extends DCLogic {
  state = { revealed: false, mode: GraphMode.Stream, dir: GraphDirection.Down, sel: null, langStream: LanguageStreamId.Model, langLane: 0, langView: LanguageViewMode.Bars, surface: null, level: RevealLevel.All, sent: [],
    // `driverName` in the top strip reads the pane's driver at render
    // time; null here means "read from the controller default."
    driverName: null,
    // Pane driver stays null until the controller's /api/models roster
    // lands; then reveal.ts (or the picker) fills it with the server's
    // real default. Anything set at boot would be a guess.
    // 19b: `?blank=1` in the URL flips pane 1 into the workspace
    // picker on first load, matching the "same picker, full screen"
    // frame. A user hitting ⇧⌘N (browser-reserved for incognito;
    // cannot be intercepted) is expected to open /?blank=1 as a
    // bookmark or menu action; the picker state itself carries the
    // frame.
    panes: [{ id: 1, name: 'pane-1', driver: null, editing: false, nameVal: '', unbound: true }],
    focused: 1, cols: 1, rows: 1, colW: [1], rowW: [1], revealL: 1.15, ddFor: null, wsFor: null, driverExpandedCli: null, driverExpandedFamily: null, allSessions: [],
  // Sprint 086 followup — workspace picker's per-row expand state
  // (independent of Records surface). Expanding a row fetches the
  // most recent 5 sessions from that workspace and lists them
  // beneath so the user can attach to an existing one instead of
  // starting fresh.
  pickerExpandedWs: {}, pickerPagedByWs: {} };
  // Sprint 073 — markdown methods extracted to `web/reveal/markdown.ts`.
  // The wrappers below preserve the dc-runtime call sites
  // (`this._mdBlocks(...)`, `this._mdRenderBlock(...)`) while the
  // implementation lives in one place. Unit tests at
  // `web/reveal/__tests__/markdown.spec.ts`.
  _mdRenderInline(seg) { return renderInline(seg); }
  _mdRenderBlock(blk) { return renderBlock(blk); }
  _mdInlines(text) { return mdInlines(text); }
  _mdBlocks(text) { return mdBlocks(text); }
  // The bar line and the task rows are web/app/ActivityLine.tsx (sprint 268).
  _newPane() {
    const id = (this._nextId = (this._nextId || Math.max(...this.state.panes.map(p => p.id), ...(this.state.allSessions || []).map(s => s.id)) + 1)) && this._nextId++;
    // Split-pane multi-session: each pane owns its own SessionController.
    // The registry lazily spawns one on first ask; roster loaders fire
    // once so a new pane starts with the drivers/bundles already known.
    const vm = window.__vm;
    if (vm && typeof vm.spawn === 'function') {
      const c = vm.spawn(id);
      c.loadDriverRoster && c.loadDriverRoster().catch(() => undefined);
      c.loadBundleRoster && c.loadBundleRoster().catch(() => undefined);
      c.loadRecentWorkspaces && c.loadRecentWorkspaces().catch(() => undefined);
    }
    // No model until the user picks one: a new pane names none and preselects none.
    return { id, name: 'pane-' + id, driver: null, unbound: true, wsQ: '', editing: false, nameVal: '', lines: [] };
  }
  _bindPane(id, ws, opts) {
    this.setState(s => {
      const pane = s.panes.find(p => p.id === id); if (!pane || !pane.unbound) return {};
      // Kinds: 'default' = fresh per-session sandbox (substrate mints
      // ~/.substrate/sessions/<id>/workspace); 'sandbox' = the shared
      // ~/.substrate/sandbox; 'flat' = any user-picked directory.
      const isDefault = !!(opts && opts.isDefault);
      const shape = paneShape(ws, isDefault);
      // Session open elsewhere reads pane.ws. Empty ws leaves the
      // workspace field off the POST so substrate falls back to its
      // per-session isolated default.
      const boundWs = isDefault ? '' : ws;
      const displayWs = isDefault ? 'fresh per-session sandbox' : ws;
      const lines = [
        { t: 'session ' + pane.name + ' started · driver ' + pane.driver + ' · ' + displayWs + ' · ' + shape, c: '#62676f' },
        { t: '◐ parked — awaiting your first message', c: '#82a5c8' }];
      return { panes: s.panes.map(p => p.id === id ? Object.assign({}, p, { unbound: false, ws: boundWs, shape, lines }) : p),
        allSessions: [...(s.allSessions || []), { id, name: pane.name, driver: pane.driver, ws: boundWs }] };
    });
  }
  // UI sprint 124 — the workspace bar runs left to right. A folder pick arms the folder and
  // ungreys the model half; a model pick there commits: the workspace reaches the controller
  // only then, so a folder armed and disarmed (esc) leaves nothing behind.
  _armWorkspace(paneId, ws, isDefault) {
    this.setState(st => ({ panes: st.panes.map(x => x.id === paneId
      ? Object.assign({}, x, { armed: { ws, isDefault: !!isDefault }, pickerHalf: 'model', modelSelIdx: null })
      : x) }));
  }
  _disarmWorkspace(paneId) {
    this.setState(st => ({ panes: st.panes.map(x => x.id === paneId
      ? Object.assign({}, x, { armed: null, pickerHalf: 'ws', modelSelIdx: null })
      : x) }));
  }
  _enterGuidance(paneId) {
    this.setState(st => ({ panes: st.panes.map(x => {
      if (x.id !== paneId) return x;
      const at = GUIDANCE_OPTIONS.findIndex((g) => g.level === (x.guidance ?? null));
      return Object.assign({}, x, { pickerHalf: 'guidance', guidanceSel: at < 0 ? 0 : at });
    }) }));
  }
  _pickGuidance(paneId, option) {
    const pane = (this.state.panes || []).find(x => x.id === paneId);
    if (!pane || !pane.armed || pane.pickerHalf !== 'guidance') return;
    // UI sprint 143: the guidance level no longer starts the session; LENGTH comes next.
    this.setState(st => ({ panes: st.panes.map(x => x.id === paneId ? Object.assign({}, x, { guidance: option.level, pickerHalf: 'length', lengthSel: LENGTH_DEFAULT_AT }) : x) }));
    const vm = window.__vm;
    if (vm && typeof vm.pickBundle === 'function') vm.pickBundle(option.bundle);
  }
  _pickLength(paneId, option) {
    const pane = (this.state.panes || []).find(x => x.id === paneId);
    if (!pane || !pane.armed || pane.pickerHalf !== 'length') return;
    this.setState(st => ({ panes: st.panes.map(x => x.id === paneId ? Object.assign({}, x, { length: option.value, pickerHalf: 'tone', toneSel: TONE_DEFAULT_AT }) : x) }));
  }
  _pickTone(paneId, option) {
    const pane = (this.state.panes || []).find(x => x.id === paneId);
    if (!pane || !pane.armed || pane.pickerHalf !== 'tone') return;
    this.setState(st => ({ panes: st.panes.map(x => x.id === paneId ? Object.assign({}, x, { tone: option.value }) : x) }));
    const vm = window.__vm;
    if (vm && typeof vm.pickControls === 'function') vm.pickControls(pane.length || null, option.value);
    this._commitPane(paneId, pane.armed);
  }
  _commitPane(paneId, armed) {
    if (!armed) return;
    const vm = window.__vm;
    if (armed.isDefault) {
      if (vm && typeof vm.pickWorkspace === 'function') vm.pickWorkspace(null);
      this._bindPane(paneId, '', { isDefault: true });
      return;
    }
    if (vm && typeof vm.pickWorkspace === 'function') vm.pickWorkspace(armed.ws);
    if (vm && typeof vm.addWorkspace === 'function' && armed.ws !== SHARED_SANDBOX) {
      void vm.addWorkspace(armed.ws);
    }
    this._bindPane(paneId, armed.ws);
  }
  _closePane(paneId) {
    // Sprint 085 followup — Cmd-W: end this pane's session (like /exit)
    // then remove the pane from the layout, absorbing its cells back
    // into the neighbour that shares its closing edge. Cmd-W on the
    // last remaining pane does nothing — the pane stays open. The app
    // never closes from Cmd-W; use Cmd-Shift-W for that.
    if (this.state.panes.length <= 1) return;
    const vm = window.__vm;
    const controller = vm && typeof vm.get === "function" ? vm.get(paneId) : null;
    if (controller && controller.snapshot().sessionId) {
      controller.endSession("user_close").catch(() => undefined);
    }
    if (vm && typeof vm.drop === "function") vm.drop(paneId);
    this.setState(s => {
      const closed = s.panes.find(p => p.id === paneId);
      const remaining = s.panes.filter(p => p.id !== paneId);
      // Guard again inside setState in case a race added/removed panes
      // between the outer check and the state resolve.
      if (remaining.length === 0) return {};
      // Single-pane collapse: reset the grid to one cell and hand it
      // to the remaining pane. Simplest correct outcome for the split-
      // once-then-close-once case Peter hit.
      if (remaining.length === 1) {
        const only = Object.assign({}, remaining[0], { col: 1, row: 1, cw: 1, rh: 1 });
        return {
          panes: [only], focused: only.id,
          cols: 1, rows: 1, colW: [1], rowW: [1],
        };
      }
      // Multi-pane case: find the ONE remaining pane whose rectangle
      // shares the closed pane's exact edge along one axis, and grow
      // it to absorb the freed region. Falls to "leave a gap" if no
      // neighbour aligns exactly (rare with strict binary splits).
      const cCol = (closed && closed.col) || 1;
      const cRow = (closed && closed.row) || 1;
      const cCw  = (closed && closed.cw)  || 1;
      const cRh  = (closed && closed.rh)  || 1;
      const grown = remaining.map(p => Object.assign({}, p));
      const absorb = grown.find(p => {
        // Right-neighbour of the closed cell absorbs its column span.
        if (p.row === cRow && p.rh === cRh && p.col + p.cw === cCol) return true;
        // Left-neighbour absorbs to the left.
        if (p.row === cRow && p.rh === cRh && cCol + cCw === p.col) return true;
        // Top-neighbour absorbs downwards.
        if (p.col === cCol && p.cw === cCw && p.row + p.rh === cRow) return true;
        // Bottom-neighbour absorbs upwards.
        if (p.col === cCol && p.cw === cCw && cRow + cRh === p.row) return true;
        return false;
      });
      if (absorb) {
        if (absorb.row === cRow && absorb.rh === cRh && absorb.col + absorb.cw === cCol) {
          absorb.cw += cCw;
        } else if (absorb.row === cRow && absorb.rh === cRh && cCol + cCw === absorb.col) {
          absorb.col = cCol; absorb.cw += cCw;
        } else if (absorb.col === cCol && absorb.cw === cCw && absorb.row + absorb.rh === cRow) {
          absorb.rh += cRh;
        } else {
          absorb.row = cRow; absorb.rh += cRh;
        }
      }
      return { panes: grown, focused: grown[0].id };
    });
  }

  // A driver's label: web/app/derive/driver_label.ts (sprint 281).
  _resolveDriverLabel(state, driver) {
    return driverLabel(driver, state.cliVersions || null, state.driverVersion || {});
  }

  // The driver a pane's chip shows. A bound session runs the driver on its manifest, which the
  // pane's controller reads at attach (`attachExisting`); a resumed session must show that, not
  // the roster default. An unbound pane shows the driver picked for its next session, and none
  // before one is picked: the roster's default is never shown or preselected.
  _paneDriver(state, pane) {
    const snap = (state.controllerSnapshots || {})[pane.id];
    if (snap && snap.sessionId && snap.driver) return snap.driver;
    return pane.driver || null;
  }

  // The model column's rows: web/app/derive/driver_label.ts (sprint 281); their actions run here.
  _buildDriverOpts(state, paneId, currentDriver, onPicked) {
    const rows = modelRows({
      groups: state.driverGroups || [], roster: state.driverRoster || [], cliVersions: state.cliVersions || null,
      currentDriver, expandedGroups: state.driverExpandedGroups || {},
      expandedCli: state.driverExpandedCli || null, expandedFamily: state.driverExpandedFamily || null,
    });
    const pickDriverAndVersion = (cli, versionId) => {
      this.setState((s) => ({
        ddFor: null, driverExpandedCli: null, driverExpandedFamily: null,
        panes: s.panes.map((x) => x.id === paneId ? Object.assign({}, x, { driver: cli }) : x),
      }));
      const vm = window.__vm;
      if (vm) {
        vm.pickDriver(cli);
        if (typeof vm.pickDriverVersion === 'function') vm.pickDriverVersion(cli, versionId);
      }
      if (onPicked) onPicked(cli);
    };
    const toggle = (what) => (ev) => {
      if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
      if ('group' in what) this.setState((s) => ({ driverExpandedGroups: Object.assign({}, s.driverExpandedGroups, { [what.group]: !(s.driverExpandedGroups || {})[what.group] }) }));
      else if ('cli' in what) this.setState((s) => ({ driverExpandedCli: s.driverExpandedCli === what.cli ? null : what.cli, driverExpandedFamily: null }));
      else this.setState((s) => ({ driverExpandedFamily: s.driverExpandedFamily === what.family ? null : what.family }));
    };
    const noop = () => undefined;
    return rows.map((row) => ({
      label: row.label, indent: row.indent,
      color: row.current ? '#e2e5e9' : '#b9bec5',
      isHeader: false, notHeader: true, isGroup: row.isGroup,
      current: row.current, expanded: row.expanded, expandable: row.expandable,
      chevron: row.expandable ? (row.expanded ? '▾' : '◂') : ' ',
      toggleExpand: row.toggle ? toggle(row.toggle) : noop,
      pick: 'driver' in row.pick ? () => pickDriverAndVersion(row.pick.driver, row.pick.version) : toggle(row.pick),
    }));
  }

  // UI sprint 124/128 — the workspace half's rows, with each open row's sessions
  // (web/app/derive/picker.ts, sprint 275).
  _wsPickerRows(state, p) {
    if (!p.unbound) return [];
    const inheritFrom = this.state.panes.find(pp => pp.id !== p.id && !pp.unbound && !!pp.ws);
    const { rows } = workspaceRows({
      recentWorkspaces: state.recentWorkspaces || [],
      inherit: inheritFrom ? { path: inheritFrom.ws, name: inheritFrom.name } : null,
      typed: p.wsQ || '', armed: p.armed || null, pickerHalf: p.pickerHalf || 'ws', sel: p.wsSelIdx || 0,
      expanded: state.pickerExpandedWs || {}, paged: state.pickerPagedByWs || {},
    });
    // A session picked under a row opens in this pane, as the records page's pick does: the pane is
    // bound before the attach so the transcript draws.
    const attach = (s) => {
      const vm = window.__vm;
      if (!vm || !s.sessionId) return;
      const wsPath = (typeof s.workspacePath === 'string' && s.workspacePath) ? s.workspacePath : '';
      const wsShape = (typeof s.workspaceShape === 'string' && s.workspaceShape) ? s.workspaceShape : 'flat';
      this.setState(st => ({ panes: st.panes.map(pn => pn.id === p.id ? Object.assign({}, pn, { unbound: false, ws: wsPath, shape: wsShape, name: s.name || pn.name, lines: [] }) : pn) }));
      vm.attachExisting(s.sessionId);
    };
    // On open, a row reads its first sessions once (loadSessionsByWorkspace).
    const toggle = (path) => {
      const was = !!(this.state.pickerExpandedWs || {})[path];
      this.setState(st => ({ pickerExpandedWs: Object.assign({}, st.pickerExpandedWs, { [path]: !was }) }));
      const vm = window.__vm;
      if (!was && vm && typeof vm.loadSessionsByWorkspace === 'function' && !(this.state.pickerPagedByWs || {})[path]) {
        vm.loadSessionsByWorkspace(path, 0, 5).then((r) => {
          this.setState(st => ({ pickerPagedByWs: Object.assign({}, st.pickerPagedByWs, { [path]: { rows: r.rows, total: r.total } }) }));
        }).catch(() => undefined);
      }
    };
    return rows.map((row) => Object.assign({}, row, {
      c: row.lit ? '#e2e5e9' : '#b9bec5',
      bg: row.lit ? '#2e3138' : 'transparent',
      litAttr: row.lit ? '1' : '0',
      notExpanded: !row.expanded,
      chevron: row.expandable ? (row.expanded ? '▾' : '▸') : ' ',
      toggleExpand: row.expandable ? ((ev) => { if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation(); toggle(row.expandKey); }) : (() => undefined),
      sessions: row.sessions.map(s => Object.assign({}, s, {
        sessionIdShort: s.idShort, pick: () => attach(s.row),
        bg: s.lit ? '#2e3138' : 'transparent', litAttr: s.lit ? '1' : '0',
      })),
      pick: () => {
        if (row.kind === 'choose') { this._pickFolder(p.id); return; }
        this._armWorkspace(p.id, row.kind === 'default' ? '' : row.path, row.kind === 'default');
      },
    }));
  }
  // UI sprint 124/128 — keys for the workspace bar. ↑↓ move, ↵ picks, ⇧↵ (or ⌥↵) opens or folds a
  // row that has rows under it; a row with nothing to pick opens on ↵ too. → ← also open and
  // fold. Before a folder is armed the keys work the workspace half; after, the model half,
  // where esc disarms. ⇥ fills the typed path from the nearest recent folder.
  _wsKey(paneId, ev) {
    const p = (this.state.panes || []).find(x => x.id === paneId);
    if (!p || !p.unbound) return;
    const opens = ev.key === 'Enter' && (ev.shiftKey || ev.altKey);
    const setPane = (patch) => this.setState(st => ({ panes: st.panes.map(x => x.id === paneId ? Object.assign({}, x, patch) : x) }));
    const reveal = (half) => setTimeout(() => {
      for (const el of document.querySelectorAll(half)) el.scrollIntoView({ block: 'nearest' });
    }, 0);
    // UI sprint 143: GUIDANCE, LENGTH and TONE share a line's keys (web/app/derive/picker.ts lineStep);
    // esc or ↑ steps back a line.
    for (const [half, opts, selKey, start, pick, back] of [
      ['guidance', GUIDANCE_OPTIONS, 'guidanceSel', 0, (o) => this._pickGuidance(paneId, o), 'model'],
      ['length', LENGTH_OPTIONS, 'lengthSel', 1, (o) => this._pickLength(paneId, o), 'guidance'],
      ['tone', TONE_OPTIONS, 'toneSel', 1, (o) => this._pickTone(paneId, o), 'length'],
    ]) {
      if (p.pickerHalf !== half || !p.armed) continue;
      const step = lineStep(opts.length, p[selKey] ?? start, ev.key);
      if (!step) return;
      ev.preventDefault();
      if ('move' in step) setPane({ [selKey]: step.move });
      else if ('pick' in step) pick(opts[step.pick]);
      else setPane({ pickerHalf: back });
      return;
    }
    if (p.pickerHalf === 'model' && p.armed) {
      const opts = this._modelHalfRows(this.state, p).filter(o => o.notHeader);
      if (!opts.length) return;
      const at = Math.max(0, Math.min(this._modelSelIdx(p, opts), opts.length - 1));
      const row = opts[at];
      const move = (i) => { setPane({ modelSelIdx: i }); reveal('[data-model-half] [data-lit="1"]'); };
      // UI sprint 149: ↓ keeps drilling. Landing on a folded group whose group above is open opens
      // it; on the last row ↓ stays put while the column scrolls, and wraps only when it all fits.
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        if (at + 1 >= opts.length) {
          const scroll = document.querySelector('[data-pane="' + paneId + '"] [data-model-scroll]');
          move(scroll && scroll.scrollHeight > scroll.clientHeight ? at : 0);
          return;
        }
        const next = opts[at + 1];
        const above = opts.slice(0, at + 1).reverse().find(o => o.isGroup);
        if (next.isGroup && !next.expanded && above && above.expanded) next.toggleExpand();
        move(at + 1);
        return;
      }
      if (ev.key === 'ArrowUp') { ev.preventDefault(); move((at - 1 + opts.length) % opts.length); return; }
      if (ev.key === 'ArrowRight' && row.expandable && !row.expanded) { ev.preventDefault(); move(at); row.toggleExpand(); return; }
      if (ev.key === 'ArrowLeft' && row.expandable && row.expanded) { ev.preventDefault(); move(at); row.toggleExpand(); return; }
      // UI sprint 151: ← inside an open row folds that row (the nearest row above with a smaller
      // indent) and lights it; on a top-level row it goes back to the workspace column (150).
      if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        let up = at - 1;
        while (up >= 0 && opts[up].indent >= row.indent) up--;
        if (up >= 0 && opts[up].expanded) { move(up); opts[up].toggleExpand(); return; }
        this._disarmWorkspace(paneId);
        return;
      }
      if (opens) { ev.preventDefault(); move(at); if (row.expandable) row.toggleExpand(); return; }
      if (ev.key === 'Enter') { ev.preventDefault(); move(at); row.pick(); return; }
      if (ev.key === 'Escape') { ev.preventDefault(); this._disarmWorkspace(paneId); return; }
      return;
    }
    const rows = this._wsPickerRows(this.state, p);
    const flat = [];
    for (const r of rows) {
      const parent = flat.length;
      flat.push({ row: r, session: null, expandable: !!r.expandable, expanded: !!r.expanded, parent: null });
      for (const s of r.sessions) flat.push({ row: r, session: s, expandable: false, expanded: false, parent });
    }
    if (!flat.length) return;
    const cur = Math.max(0, Math.min(p.wsSelIdx || 0, flat.length - 1));
    const move = (i) => { setPane({ wsSelIdx: i }); reveal('[data-ws-lit="1"]'); };
    if (ev.key === 'Tab') {
      const fill = tabFill(rows);
      if (fill !== null) { ev.preventDefault(); setPane({ wsQ: fill, wsSelIdx: 0 }); }
      return;
    }
    const step = treeKey(flat, cur, ev);
    if (!step) return;
    ev.preventDefault();
    if ('move' in step) move(step.move);
    else if ('toggle' in step) flat[step.toggle].row.toggleExpand();
    else if ('fold' in step) { move(step.fold); flat[step.fold].row.toggleExpand(); }
    else { const f = flat[step.pick]; if (f.session) f.session.pick(); else f.row.pick(); }
  }
  // UI sprint 124 — the model half of the workspace bar: the header dropdown's rows, in the
  // bar. A pick commits the armed folder; with nothing armed the half is greyed and inert.
  _modelHalfRows(state, p) {
    const armed = p.armed || null;
    // UI sprint 132: picking a model moves on to the guidance line under it; picking a level there
    // starts the session.
    return this._buildDriverOpts(state, p.id, this._paneDriver(state, p), () => {
      if (armed) this._enterGuidance(p.id);
    });
  }
  _modelSelIdx(p, picks) {
    if (typeof p.modelSelIdx === 'number') return p.modelSelIdx;
    const i = picks.findIndex(o => o.current);
    return i < 0 ? 0 : i;
  }
  // UI sprint 182 (r9 § 4): a run started now opens a pane per session beside its caller's pane,
  // bound to the session's record. A pane already showing that record is focused instead.
  _openRunPanes(callerPaneId, run) {
    const vm = window.__vm;
    for (const sess of run.sessions || []) {
      const root = String(sess.record_root || '');
      if (!root) continue;
      const shown = (this.state.panes || []).find(p => p.runRoot === root);
      if (shown) { this.setState({ focused: shown.id }); if (vm && vm.setActive) vm.setActive(shown.id); continue; }
      if ((this.state.panes || []).length >= 8) {
        const caller = vm && vm.get ? vm.get(callerPaneId) : null;
        if (caller && caller.noteLine) caller.noteLine(`run ${run.run_id}: eight panes are open; close one, then /run focus ${run.run_id}`);
        continue;
      }
      this.setState({ focused: callerPaneId }, () => this._split('right', {
        unbound: false, name: `${run.topology} ${run.run_id}`, runRoot: root, ws: '', shape: 'flat', lines: [],
      }, (id) => {
        const c = vm && vm.get ? vm.get(id) : null;
        if (c && c.attachRun) c.attachRun(root, String(run.topology || 'run'), String(run.run_id || '')).catch(() => undefined);
      }));
    }
  }
  // UI sprint 183: a delegate child opens an interactive pane beside its caller, attached to the
  // child's session, as any session a person writes to. A pane already showing it is focused.
  _openSessionPane(callerPaneId, sessionId) {
    if (!sessionId) return;
    const vm = window.__vm;
    const shown = (this.state.panes || []).find(p => p.childSid === sessionId);
    if (shown) { this.setState({ focused: shown.id }); if (vm && vm.setActive) vm.setActive(shown.id); return; }
    if ((this.state.panes || []).length >= 8) {
      const caller = vm && vm.get ? vm.get(callerPaneId) : null;
      if (caller && caller.noteLine) caller.noteLine(`delegate child ${sessionId}: eight panes are open; close one to see it`);
      return;
    }
    this.setState({ focused: callerPaneId }, () => this._split('right', {
      unbound: false, name: 'delegate ' + sessionId.slice(2, 10), childSid: sessionId, ws: '', shape: 'flat', lines: [],
    }, (id) => {
      const c = vm && vm.get ? vm.get(id) : null;
      if (c && c.attachExisting) c.attachExisting(sessionId).catch(() => undefined);
    }));
  }
  _split(dir, patch, then) {
    // Each split adds exactly one pane, up to a hard cap of eight.
    // The focused pane's cell is halved along the requested axis; the
    // new pane takes the freed half. Grid resolution doubles on demand
    // when the focused pane's span in the split axis is 1. `patch` sets fields of the new pane;
    // `then(id)` runs once it is in the layout (UI sprint 182).
    let madeId = null;
    this.setState(s => {
      if ((s.panes || []).length >= 8) return {};
      let { cols, rows } = s;
      let colW = s.colW.slice(), rowW = s.rowW.slice();
      const panes = s.panes.map(p => Object.assign({}, p, {
        col: p.col || 1, row: p.row || 1,
        cw: p.cw || cols, rh: p.rh || rows,
      }));
      const idx = panes.findIndex(p => p.id === s.focused);
      const target = idx >= 0 ? panes[idx] : panes[0];
      if (dir === 'right') {
        if (target.cw < 2) {
          cols *= 2;
          colW = colW.reduce((acc, w) => (acc.push(w, w), acc), []);
          for (const p of panes) { p.col = p.col * 2 - 1; p.cw = p.cw * 2; }
        }
        const half = target.cw / 2;
        const newPane = Object.assign(this._newPane(), { col: target.col + half, row: target.row, cw: half, rh: target.rh }, patch || {});
        target.cw = half;
        panes.push(newPane);
        madeId = newPane.id;
        // UI sprint 146: a new pane is drawn in the panes view, so making one goes there.
        return { cols, rows, colW, rowW, panes, focused: newPane.id, revealed: false, surface: null };
      }
      // dir === 'down'
      if (target.rh < 2) {
        rows *= 2;
        rowW = rowW.reduce((acc, h) => (acc.push(h, h), acc), []);
        for (const p of panes) { p.row = p.row * 2 - 1; p.rh = p.rh * 2; }
      }
      const half = target.rh / 2;
      const newPane = Object.assign(this._newPane(), { col: target.col, row: target.row + half, cw: target.cw, rh: half }, patch || {});
      target.rh = half;
      panes.push(newPane);
      madeId = newPane.id;
      return { cols, rows, colW, rowW, panes, focused: newPane.id, revealed: false, surface: null };
    }, () => {
      if (madeId == null) return;
      const vm = window.__vm;
      if (vm && vm.setActive) vm.setActive(madeId);
      if (then) then(madeId);
    });
  }
  componentDidMount() {
    // 19c settings: theme and type size, per viewer, in web/app/state/settings.ts (sprint 204).
    // Loaded once here; each change redraws the window.
    loadSettings();
    this._offSettings = settings.subscribe(() => this.forceUpdate());
    // The stream's rows dim by find's query (sprint 272).
    this._offFind = find.subscribe(() => this.forceUpdate());
    // Sprint 211: the boot script's controller snapshots and menu commands arrive through
    // web/app/state/shell.ts. Moved from web/reveal.ts, which reached this component's fiber.
    this._langTicks = {};
    this._urlSessions = {};
    const applyShell = () => {
      const { snapshots, changedPane } = shell.getSnapshot();
      if (changedPane == null) return;
      const snap = snapshots[changedPane];
      const focusedId = this.state.focused ?? 1;
      const patch = { controllerSnapshots: { ...snapshots } };
      if (changedPane === focusedId) Object.assign(patch, {
        controllerSnapshot: snap,
        driverRoster: snap.driverRoster,
        driverDefault: snap.driverDefault,
        driverGroups: snap.driverGroups,
        cliVersions: snap.cliVersions,
        driverVersion: snap.driverVersion,
        recentWorkspaces: snap.recentWorkspaces,
        liveSessionsFromServer: snap.liveSessions,
        bundleRoster: snap.bundleRoster,
        bundleSlug: snap.bundleSlug,
      });
      // UI sprint 172: `/language` bumps the pane's open tick; meta opens on the lens, at the
      // latest shift's reply when there is one (the lens selects the turn that holds `sel`).
      const tick = snap.languageOpenTick ?? 0;
      if (changedPane === focusedId && tick > (this._langTicks[changedPane] ?? 0)) {
        Object.assign(patch, { revealed: true, surface: null, mode: GraphMode.Language });
        const shifts = (snap.language && snap.language.shifts) || [];
        if (shifts.length) patch.sel = shifts[shifts.length - 1].source_seq;
      }
      this._langTicks[changedPane] = tick;
      this.setState(patch);
      // The focused pane's session is the URL's `session`, so a reload reopens it.
      if (changedPane === focusedId && snap.sessionId !== (this._urlSessions[changedPane] ?? null)) {
        this._urlSessions[changedPane] = snap.sessionId;
        const url = new URL(window.location.href);
        if (snap.sessionId) url.searchParams.set('session', snap.sessionId);
        else url.searchParams.delete('session');
        window.history.replaceState({}, '', url.toString());
      }
    };
    this._offShell = shell.subscribe(applyShell);
    applyShell();
    picker.set({ views: this._pickerViews || {} });
    if (this._streamView) stream.set(this._streamView);
    this._offPickSeq = setPickSeq((seq) => this.setState(s => ({ sel: s.sel === seq ? null : seq })));
    // The side graph (web/app/SideGraph.tsx) and the stream's scroller scroll together, in proportion.
    this._offGraphLink = setGraphLink({
      ref: (el) => { this._graphEl = el; },
      onScroll: (el) => {
        if (this._syncing) return;
        const s = this._streamEl; if (!s) return;
        const f = el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth);
        this._syncing = true; s.scrollTop = f * Math.max(0, s.scrollHeight - s.clientHeight);
        requestAnimationFrame(() => { this._syncing = false; });
      },
    });
    this._publishChrome();
    this._publishTopBar();
    // The input bar's /exit names the pane's session (web/app/state/input_bar.ts, sprint 261).
    this._offTitleOf = setTitleOf((paneId) => { const p = (this.state.panes || []).find(x => x.id === paneId); return p ? this._paneTitle(this.state, p) : 'pane-' + paneId; });
    // A session picked on the records page opens in the focused pane (web/app/state/records.ts,
    // sprint 240). The pane is marked bound before the attach, with the record's own folder and
    // shape, so the pane draws the transcript and its labels match the session.
    this._offOpenSession = setOpenSession((r) => {
      const vm = window.__vm;
      if (!vm || !r.sessionId) return;
      const wsPath = (typeof r.workspacePath === 'string' && r.workspacePath) ? r.workspacePath : '';
      const wsShape = (typeof r.workspaceShape === 'string' && r.workspaceShape) ? r.workspaceShape : 'flat';
      this.setState(s => ({
        surface: null,
        panes: s.panes.map(pn => pn.id === s.focused
          ? Object.assign({}, pn, { unbound: false, ws: wsPath, shape: wsShape, name: r.name || pn.name, lines: [] })
          : pn),
      }));
      vm.attachExisting(r.sessionId);
    });
    // First run's pick gives pane 1 its driver, as the template's pick did (sprint 225).
    this._offFirstRun = firstRun.subscribe(() => {
      const picked = firstRun.getSnapshot().picked;
      if (picked) this.setState(st => ({ panes: st.panes.map(p => p.id === 1 ? Object.assign({}, p, { driver: picked }) : p) }));
    });
    this._offCommands = onCommand((command) => {
      if (command === 'toggle-meta') this._toggleMeta();
      else if (command === 'toggle-assays') this._toggleSurface(Surface.Assay);
      else if (command === 'settings') openSettings();
      else if (command === 'close-pane') this._closePane(this.state.focused);
    });
    // UI sprint 182: a run a session starts now opens its panes; `/run focus` shows or reopens one.
    // A start read back from an older record (`t` over a minute old) opens nothing.
    { const vm = window.__vm;
      if (vm && typeof vm.onEvent === 'function') this._offRuns = vm.onEvent((ev) => {
        const run = ev.payload || {};
        if (ev.tag === 'RUN_STARTED') {
          if (typeof run.t === 'number' && Date.now() / 1000 - run.t > 60) return;
          this._openRunPanes(ev.paneId, run);
        } else if (ev.tag === 'RUN_FOCUS_REQUESTED') this._openRunPanes(ev.paneId, run);
        else if (ev.tag === 'DELEGATE_CHILD_STARTED') this._openSessionPane(ev.paneId, String(run.session_id || ''));
      }); }
    // Sprint 085 followup — close driver/workspace dropdowns on
    // outside click. Each dropdown wrapper span in reveal.html carries
    // data-dropdown-region; a mousedown outside any of them clears
    // ddFor + wsFor. The chip that toggles the dropdown sits INSIDE
    // the same wrapper, so clicking the chip does not trigger the
    // outside-close (chip's own onClick fires the toggle).
    this._ddOutside = (ev) => {
      const s = this.state;
      if (!s.ddFor && !s.wsFor) return;
      const target = ev.target;
      if (target instanceof Element && target.closest("[data-dropdown-region]")) return;
      this.setState({ ddFor: null, wsFor: null });
    };
    document.addEventListener("mousedown", this._ddOutside, true);
    this._kd = (e) => {
      // UI sprint 128 — on a focused pane with no session, the bar's keys work without a click
      // in its path box: the box takes the cursor and the key. Any other text box keeps its keys.
      {
        const s = this.state;
        const el = document.activeElement;
        const typing = !!(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable));
        const barKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(e.key) && !e.metaKey && !e.ctrlKey;
        const fp = (s.panes || []).find(p => p.id === s.focused);
        const fsnap = (s.controllerSnapshots || {})[s.focused];
        if (barKey && e.key !== 'Escape' && !typing && s.surface === Surface.Records
          && !dialogOpen() && !find.getSnapshot().open) {
          recordsKey(e);
          return;
        }
        if (barKey && !typing && fp && fp.unbound && !(fsnap && fsnap.sessionId) && !s.revealed && !s.surface
          && !dialogOpen() && !find.getSnapshot().open) {
          const box = document.querySelector('[data-ws-input="' + fp.id + '"]');
          if (box) box.focus();
          this._wsKey(fp.id, e);
          return;
        }
      }
      // UI sprint 169: in the language lens, ↑↓ move between turns, ←→ between lanes, ↵ opens the
      // turn in the stream (the selection is the seq, shared with stream+graph).
      {
        const s = this.state;
        // Judge the key by where it was typed: the Enter that runs `/language` opens the lens and
        // unmounts the input box before this handler runs.
        const el = e.target;
        const typing = !!(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable));
        const turns = this._langTurns || [];
        if (s.revealed && s.mode === GraphMode.Language && !s.surface && !typing && turns.length
          && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key) && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          // No selection yet: the lens shows the last turn, so the keys start there.
          let at = turns.length - 1;
          if (s.sel !== null) { at = 0; turns.forEach((t, i) => { if (t.seq <= s.sel) at = i; }); }
          if (e.key === 'ArrowUp') this.setState({ sel: turns[Math.max(0, at - 1)].seq });
          else if (e.key === 'ArrowDown') this.setState({ sel: turns[Math.min(turns.length - 1, at + 1)].seq });
          else if (e.key === 'ArrowLeft') this.setState({ langLane: Math.max(0, s.langLane - 1) });
          else if (e.key === 'ArrowRight') this.setState({ langLane: Math.min((this._langLaneCount || 1) - 1, s.langLane + 1) });
          else this.setState({ mode: GraphMode.Stream });
          return;
        }
      }
      // ⌘M toggles meta and panes (the menu's Minimize gives up the key, electron/menu.js).
      if (e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey && (e.key === 'm' || e.key === 'M')) { e.preventDefault(); this._toggleMeta(); }
      // UI sprint 140: ⌘E expands or collapses every tool card.
      if (e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey && (e.key === 'e' || e.key === 'E')) { e.preventDefault(); this._toggleTools(); }
      if (e.metaKey && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); this._split(e.shiftKey ? 'down' : 'right'); }
      if (e.metaKey && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); toggleFind(); }
      if (e.metaKey && e.key === ',') { e.preventDefault(); openSettings(); }
      // D86: ⌘3 opens the assays page, and the same key returns to the panes (sprint 251).
      if (e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey && e.key === '3') { e.preventDefault(); this._toggleSurface(Surface.Assay); }
      if (e.key === 'Escape') {
        const s = this.state;
        if (find.getSnapshot().open) closeFind();
        else if (dialogOpen()) closeDialog();
        else if (s.ddFor || s.wsFor) this.setState({ ddFor: null, wsFor: null });
        else if (s.surface) this.setState({ surface: null });
        else {
          // Phase 8 item 5 · two-tier ESC. First press within the same
          // running turn sends tier=soft; a second press before the turn
          // parks sends tier=hard. `_lastEscTier` tracks the last tier for
          // the current turn's sessionId; a new sessionId resets it.
          const vm = window.__vm;
          const snap = (s.controllerSnapshots || {})[s.focused] || (vm && vm.snapshot ? vm.snapshot() : null);
          const running = !!(snap && snap.sessionId && snap.connection === 'connected' && !snap.parkReason && !snap.endedReason);
          if (running && vm && typeof vm.interruptTurn === 'function') {
            // ESC is hard by default — the terminal habit says "stop
            // now." Shift+ESC is the softer verb: "stop after this
            // tool." Shift as the delay modifier reads naturally to a
            // user who has hit ESC once expecting immediate action.
            const tier = e.shiftKey ? 'soft' : 'hard';
            vm.interruptTurn(tier);
          }
        }
      }
    };
    window.addEventListener('keydown', this._kd);
    this._gm = (e) => {
      if (!this._gut) return;
      const g = this._gut; const s = this.state;
      if (g.type === 'reveal') {
        const d = (e.movementX / Math.max(300, (s.winW || window.innerWidth))) * (s.revealL + 1);
        this.setState({ revealL: Math.min(3, Math.max(.5, s.revealL + d)) });
        return;
      }
      if (g.type === 'col') {
        const total = s.colW.reduce((a, b) => a + b, 0);
        const d = (e.movementX / Math.max(300, (s.winW || window.innerWidth))) * total;
        const w = s.colW.slice(); w[g.i - 1] = Math.max(.25, w[g.i - 1] + d); w[g.i] = Math.max(.25, w[g.i] - d);
        this.setState({ colW: w });
      } else {
        const total = s.rowW.reduce((a, b) => a + b, 0);
        const d = (e.movementY / 600) * total;
        const w = s.rowW.slice(); w[g.i - 1] = Math.max(.3, w[g.i - 1] + d); w[g.i] = Math.max(.3, w[g.i] - d);
        this.setState({ rowW: w });
      }
    };
    this._gu = () => { this._gut = null; };
    window.addEventListener('mousemove', this._gm); window.addEventListener('mouseup', this._gu);
    this._rs = () => this.setState({ winW: window.innerWidth });
    window.addEventListener('resize', this._rs);
  }
  // What the React footer reads about the focused pane (web/app/state/chrome.ts, sprint 224).
  _publishChrome() {
    const s = this.state;
    const fp = (s.panes || []).find(p => p.id === s.focused) || s.panes[0];
    chrome.set({ focusedPane: s.focused, unbound: !!(fp && fp.unbound), title: (fp && this._paneTitle(s, fp)) || null, surfaceOpen: !!s.surface });
  }
  // The React top bar's fields and actions (web/app/state/top_bar.ts, sprint 231).
  _publishTopBar() {
    if (!this._topBarVals) return;
    topBar.set(this._topBarVals);
    this._offTopBarActs = setTopBarActions(Object.assign({}, this._topBarActs, { finishEdit: (name) => this._finishEdit(name) }));
  }
  // UI sprint 145: ↵ names the session (the daemon keeps it); esc cancels; empty changes nothing.
  _finishEdit(name) {
    const id = this.state.focused;
    this.setState(s => ({ panes: s.panes.map(x => x.id === id ? Object.assign({}, x, { editing: false }) : x) }));
    if (!name) return;
    const vm = window.__vm;
    const controller = vm && typeof vm.get === 'function' ? vm.get(id) : null;
    if (controller && typeof controller.nameSession === 'function') controller.nameSession(name);
  }
  componentDidUpdate() {
    picker.set({ views: this._pickerViews || {} });
    find.set({ streamMatches: this._streamMatches || 0 });
    if (this._streamView) stream.set(this._streamView);
    this._publishChrome();
    this._publishTopBar();
  }
  componentWillUnmount() { if (this._offRuns) this._offRuns(); if (this._offSettings) this._offSettings(); if (this._offFind) this._offFind(); if (this._offShell) this._offShell(); if (this._offCommands) this._offCommands(); if (this._offFirstRun) this._offFirstRun(); if (this._offTopBarActs) this._offTopBarActs(); if (this._offOpenSession) this._offOpenSession(); if (this._offTitleOf) this._offTitleOf(); if (this._offPickSeq) this._offPickSeq(); if (this._offGraphLink) this._offGraphLink(); window.removeEventListener('keydown', this._kd); window.removeEventListener('resize', this._rs); if (this._ddOutside) document.removeEventListener('mousedown', this._ddOutside, true); }
  // UI sprint 140: ⌘E folds or unfolds every tool card (ToolCard reads the setting). No control
  // on screen: the Architect's call; /fold and /unfold do the same from the input bar.
  _toggleTools() {
    toggleToolOutputMode();
  }
  // ⌘M and View → Meta (UI sprint 147). Into meta is refused while the focused pane is still at
  // its picker with no session; back to the panes always works.
  _toggleMeta() {
    const s = this.state;
    if (!s.revealed) {
      const fp = s.panes.find(p => p.id === s.focused);
      const fs = (s.controllerSnapshots || {})[s.focused];
      if (fp && fp.unbound && !(fs && fs.sessionId)) return;
    }
    this.setState(st => ({ revealed: !st.revealed, surface: null }));
  }
  // UI sprint 145: what the top bar calls a pane: its session's name when it has one, else the
  // pane's label.
  _paneTitle(state, pane) {
    const snap = (state.controllerSnapshots || {})[pane.id];
    return (snap && snap.sessionName) || pane.name;
  }
  _toggleSurface(name) {
    this.setState(s => ({ surface: s.surface === name ? null : name }));
    // Sprint 085 followup — refresh the Records-surface data on every
    // open. Boot's one-shot loadLiveSessions can miss (network hiccup,
    // server not ready, silent catch) and leave the page as a wall of
    // workspace headers with no session rows under them.
    if (name === 'records') {
      const vm = window.__vm;
      if (vm) {
        if (typeof vm.loadLiveSessions === 'function') vm.loadLiveSessions().catch(() => undefined);
        if (typeof vm.loadRecentWorkspaces === 'function') vm.loadRecentWorkspaces().catch(() => undefined);
      }
    }
  }
  renderVals() {
    const state = this.state;
    const fp = state.panes.find(p => p.id === state.focused) || state.panes[0];
    const mainFocused = fp.id === 1;
    // Route back-compat proxy calls to the focused pane's controller.
    // setActive is idempotent; calling it on every render is cheap and
    // guarantees any window.__vm.<action> goes to the right session.
    { const vm = window.__vm; if (vm && typeof vm.setActive === 'function') vm.setActive(fp.id); }
    // Controller snapshot — hoisted so the machinery-lens code below
    // (stream/io/scene) can read _vmSnap + _hasVmSession before the
    // template-return block writes them as render fields. Reads the
    // focused pane's snap directly from the per-pane map so a bare
    // focus swap still updates the lens even when the focused pane's
    // controller hasn't emitted anything since.
    const _vmSnap = ((state.controllerSnapshots || {})[state.focused]) || state.controllerSnapshot || null;
    const _hasVmSession = !!(_vmSnap && _vmSnap.sessionId);
    // ⌘F's query. The transcript scope counts the focused pane's own transcript rows (UI sprint 186;
    // before, it counted lines of a sample session's text).
    // Find is web/app/state/find.ts (sprint 272); the stream lens dims its rows by the query
    // (web/app/StreamLens.tsx), and the match count is counted here.
    const findQuery = findQueryOf();
    const paneW = (state.winW || window.innerWidth) / state.cols;
    const panes = state.panes.map(p => { const wsRows = this._wsPickerRows(state, p); return Object.assign({
      // Grid placement. Single-pane state has no col/row on the pane
      // record; treat the missing case as the whole grid so the layout
      // reads the same before any split.
      gridCol: (p.col || 1) + ' / span ' + (p.cw || state.cols),
      gridRow: (p.row || 1) + ' / span ' + (p.rh || state.rows),
    }, {
      unbound: !!p.unbound, bound: !p.unbound,
      // 19a picker per Substrate Shell Directions v3.dc.html:
      //   [inherit-from-split] · [recent…] · [~/.substrate/sandbox] · [choose folder…]
      // Filter the server's fallback list so per-session sandbox paths
      // do not swamp the picker (D66f expects a curated list).
      wsRows,
      modelRows: (() => {
        if (!p.unbound) return [];
        const rows = this._modelHalfRows(state, p);
        const picks = rows.filter(o => o.notHeader);
        const sel = p.pickerHalf === 'model' && p.armed ? this._modelSelIdx(p, picks) : -1;
        const noop = () => undefined;
        return rows.map(o => {
          if (!p.armed) {
            return Object.assign({}, o, { color: '#4a4e55', bg: 'transparent', cursor: 'default', pick: noop, toggleExpand: noop, liveRow: false, greyRow: o.notHeader, lit: '0' });
          }
          const lit = o.notHeader && picks.indexOf(o) === sel;
          return Object.assign({}, o, { color: lit ? '#e2e5e9' : o.color, bg: lit ? '#2e3138' : 'transparent', cursor: 'pointer', liveRow: o.notHeader, greyRow: false, lit: lit ? '1' : '0' });
        });
      })(),
      // UI sprint 132 (kernel K288): the guidance level for the session the bar will open. Auto
      // leaves it to the daemon, which picks the model's default level at creation.
      guidanceRows: GUIDANCE_OPTIONS.map((g, i) => {
        const open = !!p.armed && p.pickerHalf === 'guidance';
        const lit = open && i === (p.guidanceSel ?? 0);
        // UI sprint 143: once LENGTH or TONE is open, the picked level shows in white.
        const picked = !!p.armed && (p.pickerHalf === 'length' || p.pickerHalf === 'tone') && (p.guidance ?? null) === g.level;
        return {
          label: g.label, meta: g.meta, lit: lit ? '1' : '0',
          live: open, grey: !open,
          color: lit || picked ? '#e2e5e9' : '#b9bec5',
          greyColor: picked ? '#e2e5e9' : '#4a4e55',
          bg: lit ? '#2e3138' : 'transparent',
          pick: () => this._pickGuidance(p.id, g),
        };
      }),
      guidanceHeadColor: p.armed && p.pickerHalf === 'guidance' ? '#62676f' : '#4a4e55',
      ...(() => {
        const line = (half, opts, selKey, pick, chosenKey, defaultAt) => {
          const open = !!p.armed && p.pickerHalf === half;
          const sel = Math.max(0, Math.min(p[selKey] ?? defaultAt, opts.length - 1));
          const chosen = p[chosenKey];
          return {
            rows: opts.map((o, i) => {
              const lit = open && i === sel;
              const picked = !open && chosen === o.value;
              return {
                label: o.label, meta: o.meta, lit: lit ? '1' : '0', live: open, grey: !open,
                color: lit || picked ? '#e2e5e9' : '#b9bec5', bg: lit ? '#2e3138' : 'transparent',
                greyColor: picked ? '#e2e5e9' : '#4a4e55',
                pick: () => pick(o),
              };
            }),
            head: open ? '#62676f' : '#4a4e55',
            note: open ? opts[sel].meta : '',
          };
        };
        const len = line('length', LENGTH_OPTIONS, 'lengthSel', (o) => this._pickLength(p.id, o), 'length', LENGTH_DEFAULT_AT);
        const tone = line('tone', TONE_OPTIONS, 'toneSel', (o) => this._pickTone(p.id, o), 'tone', TONE_DEFAULT_AT);
        return {
          lengthRows: len.rows, lengthHeadColor: len.head, lengthNote: len.note, lengthNoteClass: '', lengthNoteColor: '#62676f',
          toneRows: tone.rows, toneHeadColor: tone.head, toneNote: tone.note, toneNoteClass: '', toneNoteColor: '#62676f',
        };
      })(),
      // The lit level's description, at the end of the guidance line.
      // UI sprint 142: before a model is picked the slot holds a hint, at the hint level (.tx-hint);
      // once the guidance line opens it describes the lit level, at the ordinary grey.
      guidanceNoteClass: p.armed && p.pickerHalf === 'guidance' ? '' : 'tx-hint',
      guidanceNoteColor: p.armed && p.pickerHalf === 'guidance' ? '#62676f' : 'var(--tx-hint)',
      guidanceNote: p.armed && p.pickerHalf === 'guidance'
        ? GUIDANCE_OPTIONS[Math.max(0, Math.min(p.guidanceSel ?? 0, GUIDANCE_OPTIONS.length - 1))].meta
        : p.armed && (p.pickerHalf === 'length' || p.pickerHalf === 'tone') ? '' : 'pick a model first',
      // UI sprint 150: the workspace list fills its column: the folded rows (the header at 9.5px and
      // each row at 11.5px, both at line-height 2.1) plus, side by side, the 93px of the model
      // column's GUIDANCE, LENGTH and TONE lines. An opened row's sessions drop into the room under
      // the rows, then the list scrolls; the bar's height, and so its top, never change.
      wsListH: (9.5 * 2.1 + wsRows.length * 11.5 * 2.1 + (paneW < 480 ? 0 : 93)).toFixed(2) + 'px',
      // A click on the list's empty space, with a workspace armed, goes back to the workspace
      // column, as esc and ← do; a click on a row still picks it.
      onWsListClick: (ev) => {
        const t = ev && ev.target;
        if (p.armed && !(t && typeof t.closest === 'function' && t.closest('[data-ws-lit]'))) this._disarmWorkspace(p.id);
      },
      guidancePos: paneW < 480 ? 'static' : 'absolute',
      guidanceBottom: paneW < 480 ? '0' : '62px',
      lengthBottom: paneW < 480 ? '0' : '31px',
      toneBottom: '0',
      modelScrollBottom: paneW < 480 ? 'auto' : '93px',
      modelHeadColor: p.armed ? '#62676f' : '#4a4e55',
      pickerDir: paneW < 480 ? 'column' : 'row',
      modelBorderL: paneW < 480 ? 'none' : '1px solid rgba(255,255,255,.08)',
      modelBorderT: paneW < 480 ? '1px solid rgba(255,255,255,.08)' : 'none',
      modelArmed: p.armed ? '1' : '0',
      // The model half never grows the bar: side by side it fills the workspace half's height
      // and scrolls inside; stacked under a narrow pane it caps at 140px.
      modelInnerPos: paneW < 480 ? 'static' : 'absolute',
      modelMaxH: paneW < 480 ? '140px' : 'none',
      wsPlaceholder: p.pickerHalf === 'tone' && p.armed
        ? '← → moves · ↵ picks the tone and starts · esc back to length'
        : p.pickerHalf === 'length' && p.armed
        ? '← → moves · ↵ picks the length · esc back to guidance'
        : p.pickerHalf === 'guidance' && p.armed
        ? '← → moves · ↵ picks the guidance · esc back to models'
        : p.pickerHalf === 'model' && p.armed
          ? '↑↓ moves · ⇧↵ opens · ↵ picks the model · esc back'
          : '↑↓ moves · ⇧↵ opens · ↵ picks the folder',
      wsQ: p.wsQ || '',
      onWsQ: (ev) => this.setState(st => ({ panes: st.panes.map(x => x.id === p.id ? Object.assign({}, x, { wsQ: ev.target.value, wsSelIdx: 0, armed: null, pickerHalf: 'ws', modelSelIdx: null }) : x) })),
      onWsKey: (ev) => this._wsKey(p.id, ev),
      id: p.id, name: p.name, driver: this._paneDriver(state, p),
      // isMain gates the full machinery lens (transcript + prompt +
      // find bar). Every bound pane, not just pane 1, should render
      // it — otherwise a newly-split pane falls through to the
      // legacy `pn.lines` list and the model's replies never format
      // correctly there. An unbound pane still falls to notMain so
      // its workspace picker renders in place of the empty transcript.
      // isMain flips as soon as the pane's controller has an open
      // session, regardless of the local `unbound` flag. Boot state
      // (no session, unbound) still falls to notMain and shows the
      // workspace picker; the moment openSession lands, the
      // transcript+mount UI takes over. This is what pane-split /
      // model-reply smoke tests exercise — they call openSession on
      // the controller without ever hitting _bindPane.
      isMain: (() => {
        const s = (state.controllerSnapshots || {})[p.id];
        return !!(s && s.sessionId) || !p.unbound;
      })(),
      notMain: (() => {
        const s = (state.controllerSnapshots || {})[p.id];
        return !((s && s.sessionId) || !p.unbound);
      })(),
      // Machinery-lens bindings scoped to THIS pane so splitting the
      // window does not blank an unfocused pane. Each pane reads its
      // own controller's snapshot; focus only controls emphasis.
      // The input bar is web/app/InputBar.tsx, keyed by the pane (sprint 261).
      sentLines: (p.sent || []).map(t => ({ text: t })),
      editing: p.editing, notEditing: !p.editing, nameVal: p.nameVal,
      // Status dot per pane. (19i's hollow "rate-limited" dot was removed in Sprint 096:
      // it keyed on a RateLimitedWaiting kind the kernel never emits.)
      dot: (() => {
        const snap = (state.controllerSnapshots || {})[p.id] || (p.id === 1 ? state.controllerSnapshot : null);
        if (!snap) return '#4a4e55';
        const conn = snap.connection;
        if (conn === 'connected') return '#7fb3b8';
        if (conn === 'connecting') return '#82a5c8';
        if (conn === 'reconnecting') return '#c9a05a';
        if (conn === 'closed') return '#c26058';
        return '#4a4e55';
      })(),
      dotBg: (() => {
        const snap = (state.controllerSnapshots || {})[p.id] || (p.id === 1 ? state.controllerSnapshot : null);
        if (!snap) return '#4a4e55';
        const conn = snap.connection;
        if (conn === 'connected') return '#7fb3b8';
        if (conn === 'connecting') return '#82a5c8';
        if (conn === 'reconnecting') return '#c9a05a';
        if (conn === 'closed') return '#c26058';
        return '#4a4e55';
      })(),
      outline: 'none',
      dim: (state.panes.length > 1 && p.id !== state.focused) ? '.55' : '1',
      caretColor: p.id === state.focused ? '#82a5c8' : '#4a4e55',
      focus: () => this.setState({ focused: p.id }),
      startEdit: () => this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { editing: true, nameVal: this._paneTitle(s, x) }) : x) })),
      updName: (ev) => this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { nameVal: ev.target.value }) : x) })),
      // UI sprint 145: ↵ names the session (the daemon keeps it); esc cancels; empty changes nothing.
      nameKey: (ev) => {
        if (ev.key === 'Escape') { this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { editing: false }) : x) })); return; }
        if (ev.key !== 'Enter') return;
        const pane = (this.state.panes || []).find(x => x.id === p.id);
        const name = ((pane && pane.nameVal) || '').trim();
        this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { editing: false }) : x) }));
        if (!name) return;
        const vm = window.__vm;
        const controller = vm && typeof vm.get === 'function' ? vm.get(p.id) : null;
        if (controller && typeof controller.nameSession === 'function') controller.nameSession(name);
      },
    }); });
    // The stream's rows, spans, connectors and side graph: web/app/derive/stream.ts (sprint 289).
    const _liveEnvelopes = (_vmSnap && Array.isArray(_vmSnap.rawEnvelopes)) ? _vmSnap.rawEnvelopes : [];
    const envelopes = streamRows(_liveEnvelopes);
    // The find bar shows the stream's match count; it is written to the find store after the render.
    this._streamMatches = findQuery ? envelopes.filter(e => findText(e).includes(findQuery)).length : 0;
    // The stream lens's rows and inspector: web/app/StreamLens.tsx (sprint 292), from this view.
    this._streamView = { envelopes: _liveEnvelopes, sel: state.sel, app: state.level === RevealLevel.App, down: state.dir === GraphDirection.Down, topology: (_vmSnap && _vmSnap.topologyGraph) || null };
    // UI sprint 169: the language lens. The selected turn is the one the selected seq falls in,
    // so a pick here moves stream+graph and a pick there moves this.
    let _langSelTurn = null;
    for (const env of state.sel === null ? [] : _liveEnvelopes) {
      if (env.seq > state.sel) break;
      if (env.kind === EnvelopeKind.UserMessage && env.payload) _langSelTurn = Number(env.payload.turn_index);
    }
    const _lang = buildLanguageLens((_vmSnap && _vmSnap.language) || null, { stream: state.langStream, selTurn: _langSelTurn, lane: state.langLane, view: state.langView });
    this._langTurns = _lang.turns;
    this._langLaneCount = _lang.lanes.length;
    const langRows = _lang.rows.map(r => ({ ...r, pick: () => this.setState({ sel: r.seq }), bg: r.selected ? '#2a2d33' : 'transparent' }));
    // UI sprint 174: each stream offers its own views; one it lacks falls back to its first.
    const _langViewNow = languageView(state.langStream, state.langView);
    const langViews = languageViewTabs(state.langStream).map(v => ({
      label: v, pick: () => this.setState({ langView: v }),
      color: _langViewNow === v ? '#d7dade' : '#62676f', bg: _langViewNow === v ? '#2e3138' : 'transparent',
    }));
    const langStreams = LANGUAGE_STREAM_TABS.map(t => ({
      label: t.label, pick: () => this.setState({ langStream: t.id, langLane: 0 }),
      color: state.langStream === t.id ? '#d7dade' : '#62676f',
    }));
    // The side graph: web/app/SideGraph.tsx (sprint 296), from the stream's view.
    const modes = [['stream', 'stream+graph'], ['io', 'i/o'], ['structure', 'structure'], [GraphMode.Language, 'language'], ['scene', 'scene']];
    // Direction (down/side) is a property of the stream lens; the
    // io/structure/scene lenses render their own layouts and the
    // direction toggle is not visible for them. Carrying `dir=Side`
    // through a mode switch leaves the shell in a state whose
    // affordance is hidden — the user sees a side-oriented layout
    // and no chip to change it. Reset `dir` to Down whenever the
    // user leaves stream.
    const modeChips = modes.map(([id, label]) => ({
      label,
      pick: () => {
        this.setState(id === GraphMode.Stream ? { mode: id } : { mode: id, dir: GraphDirection.Down });
        if (id === GraphMode.Language) {
          const vm = window.__vm;
          const ctl = vm && typeof vm.get === 'function' ? vm.get(state.focused) : null;
          if (ctl && typeof ctl.refreshLanguage === 'function') ctl.refreshLanguage();
        }
      },
      color: state.mode === id ? '#d7dade' : '#62676f', bg: state.mode === id ? '#2e3138' : 'transparent',
    }));
    // Detect a 2-D numeric grid inside the bound session's envelopes.
    // game_of_life-style topologies emit `payload.grid` on their
    // Generation event; session records don't. When none is found the
    // scene lens shows an empty state.
    // Scene lens grid detection. Wrapped end-to-end so any malformed
    // payload — non-array grid, ragged rows, Proxy that throws on
    // property access, oversized matrix — falls to the empty-state
    // message instead of taking the renderer down. Cap at
    // SCENE_MAX_CELLS to keep a 500×500 game_of_life grid from hanging
    // paint (Peter's 2026-09-25 crash under Electron: attached record
    // carried a grid larger than Chromium could render as 250k divs
    // before the OS killed the renderer; the window disappeared).
    const SCENE_MAX_CELLS = 400; // 20×20 upper bound
    const _findGrid = () => {
      try {
        const envs = (_vmSnap && Array.isArray(_vmSnap.rawEnvelopes)) ? _vmSnap.rawEnvelopes : [];
        for (let i = envs.length - 1; i >= 0; i--) {
          const p = envs[i] && envs[i].payload;
          if (!p) continue;
          const candidate = p.grid || p.cells || p.matrix;
          if (!Array.isArray(candidate) || !candidate.length) continue;
          if (!Array.isArray(candidate[0])) continue;
          if (typeof candidate[0][0] !== 'number') continue;
          const rows = candidate.length;
          const cols = candidate[0].length;
          if (rows * cols > SCENE_MAX_CELLS) return null;
          return candidate;
        }
      } catch (_) { /* malformed payload — fall to empty state */ }
      return null;
    };
    const _liveGrid = _findGrid();
    const graphGrid: number[][] = Array.isArray(_liveGrid) ? _liveGrid : [];
    const surf = state.surface;
    // Presentation-Model bindings — Phase 4. Every field here reads
    // from `state.controllerSnapshot` which reveal.ts refreshes on every
    // controller change. `scriptedOn` inverts `liveOn` so the demo
    // narrative fades out the moment a real session is bound.
    // (`_vmSnap` is hoisted at the top of renderVals.)
    // The unbound panes' pickers are web/app/PanePicker.tsx (sprint 286): each one's view, written to
    // web/app/state/picker.ts after the render.
    this._pickerViews = Object.fromEntries(panes.filter(r => r.unbound).map(r => [r.id, {
      pickerDir: r.pickerDir, wsListH: r.wsListH, onWsListClick: r.onWsListClick, wsRows: r.wsRows,
      modelArmed: r.modelArmed, modelBorderL: r.modelBorderL, modelBorderT: r.modelBorderT, modelInnerPos: r.modelInnerPos,
      modelScrollBottom: r.modelScrollBottom, modelMaxH: r.modelMaxH, modelHeadColor: r.modelHeadColor, modelRows: r.modelRows,
      guidancePos: r.guidancePos,
      lines: [
        { key: 'guidance', head: 'GUIDANCE', bottom: r.guidanceBottom, headColor: r.guidanceHeadColor, rows: r.guidanceRows, noteClass: r.guidanceNoteClass, noteColor: r.guidanceNoteColor, note: r.guidanceNote },
        { key: 'length', head: 'LENGTH', bottom: r.lengthBottom, headColor: r.lengthHeadColor, rows: r.lengthRows, noteClass: r.lengthNoteClass, noteColor: r.lengthNoteColor, note: r.lengthNote },
        { key: 'tone', head: 'TONE', bottom: r.toneBottom, headColor: r.toneHeadColor, rows: r.toneRows, noteClass: r.toneNoteClass, noteColor: r.toneNoteColor, note: r.toneNote },
      ],
      wsQ: r.wsQ, wsPlaceholder: r.wsPlaceholder, onWsQ: r.onWsQ, onWsKey: r.onWsKey,
    }]));
    const vals = {
      // The structure lens: web/app/StructureLens.tsx (sprint 301), from the stream's view.
      // Reveal view transcript reads the SAME rich rows the per-pane
      // terminal view reads. _liveBindingsFor already computes tool
      // cards, Markdown blocks, opacity from find, running seconds —
      // reuse it here for the focused pane so both views stay in sync.
      crumb: ((title) => surf === Surface.Records ? title + ' › records' : surf === Surface.Assay ? title + ' › assays' : title)(this._paneTitle(state, fp)),
      escHint: surf ? 'esc — back' : '',
      openRecords: () => this._toggleSurface('records'),
      // UI sprint 139 (U125): the model chip opens a card, as the workspace chip does; it picks nothing.
      fpDdOpen: state.ddFor === fp.id, fpToggleDd: () => this.setState(s => ({ ddFor: s.ddFor === fp.id ? null : fp.id, wsFor: null })),
      ...(() => {
        const driver = this._paneDriver(state, fp) || '';
        const label = this._resolveDriverLabel(state, driver);
        const version = label.slice(String(driver).toLowerCase().length).trim();
        const snap = (state.controllerSnapshots || {})[fp.id];
        // A CLI on its own Auto mode picks the model itself and does not report which (cursor-agent:
        // the stream, `about` and `models` all say Auto). Say so; never name a model it did not report.
        const auto = /^auto\b/.test(version);
        return {
          fpModel: driver || '—',
          fpModelVersion: auto ? 'Auto — chosen by ' + driver + ', which does not report the model' : (version || 'default'),
          fpGuidance: (snap && snap.bundleSlug) || 'auto',
          // UI sprint 143: the Length and Tone positions; null is the default.
          fpLength: (snap && snap.length) || LENGTH_DEFAULT,
          fpTone: (snap && snap.tone) || TONE_DEFAULT,
          fpAuto: auto,
        };
      })(),
      fpWsOpen: state.wsFor === fp.id, fpToggleWs: () => this.setState(s => ({ wsFor: s.wsFor === fp.id ? null : fp.id, ddFor: null })),
      recordsColor: surf === Surface.Records ? '#e2e5e9' : '#9aa0a8',
      showTerminal: !surf && !state.revealed, showRevealed: !surf && state.revealed,
      showRecords: surf === Surface.Records, showAssay: surf === Surface.Assay,
      toggleReveal: () => {
        // Reveal → terminal always works. Terminal → reveal blocks only
        // when the focused pane is still on its workspace picker (that
        // picker only renders in the terminal view — toggling away would
        // strand the user).
        const s = this.state;
        if (!s.revealed) {
          const focusedPane = s.panes.find(p => p.id === s.focused);
          if (focusedPane && focusedPane.unbound) return;
        }
        this.setState(st => ({ revealed: !st.revealed, surface: null }));
      },
      revealLabel: state.revealed ? 'panes' : 'meta',
      revealBtnColor: state.revealed && !surf ? '#212327' : '#9aa0a8', revealBtnBg: state.revealed && !surf ? '#82a5c8' : '#3d434c',
      fontSize: fontSize(13),
      // UI sprint 158: the stream follows the bottom until scrolled up, as the transcript does.
      streamRef: (el) => { this._streamEl = el; if (el) followBottom(el); },
      // Transcript scroll used to live here (Sprint 076 retired
      // the pane's dc-runtime scroll ref / onScroll bindings). The
      // atom transcript React tree at web/reveal/transcript/ owns
      // scroll position now; the reveal.html template no longer
      // emits any ref/onScroll on the transcript scroller.
      onStreamScroll: (ev) => {
        if (this._syncing || this.state.dir !== 'side') return;
        const el = ev.target, g = this._graphEl; if (!g) return;
        const f = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
        this._syncing = true; g.scrollLeft = f * Math.max(0, g.scrollWidth - g.clientWidth);
        requestAnimationFrame(() => { this._syncing = false; });
      },
      modeChips,
      isStream: state.mode === GraphMode.Stream, isIo: state.mode === GraphMode.IO, isStructure: state.mode === GraphMode.Structure, isScene: state.mode === GraphMode.Scene,
      isLanguage: state.mode === GraphMode.Language, lang: _lang, langRows, langStreams, langViews, langHas: _lang.has, langEmpty: !_lang.has, langNote: !!_lang.note,
      isDown: state.dir === GraphDirection.Down, isSide: state.dir === GraphDirection.Side,
      setAll: () => this.setState({ level: RevealLevel.All }), setApp: () => this.setState({ level: RevealLevel.App }),
      allColor: state.level === RevealLevel.All ? '#d7dade' : '#62676f', allBg: state.level === RevealLevel.All ? '#2e3138' : 'transparent',
      appColor: state.level === RevealLevel.App ? '#d7dade' : '#62676f', appBg: state.level === RevealLevel.App ? '#2e3138' : 'transparent',
      setDown: () => this.setState({ dir: GraphDirection.Down }), setSide: () => this.setState({ dir: GraphDirection.Side }),
      downColor: state.dir === GraphDirection.Down ? '#d7dade' : '#62676f', downBg: state.dir === GraphDirection.Down ? '#2e3138' : 'transparent',
      sideColor: state.dir === GraphDirection.Side ? '#d7dade' : '#62676f', sideBg: state.dir === GraphDirection.Side ? '#2e3138' : 'transparent',
      // IO lens: the application-visible input/output documents on
      // the record, in seq order. Always real; empty when no session
      // has spoken yet.
      ioDocs: _liveEnvelopes
        .filter((env) => env && env.payload && (
          env.kind === EnvelopeKind.UserMessage || env.kind === EnvelopeKind.ModelReply
          || env.kind === EnvelopeKind.FinalAnswer || env.kind === EnvelopeKind.ToolResult))
        .map((env) => {
          const p = env.payload || {};
          const text = env.kind === EnvelopeKind.ToolResult
            ? (typeof p.output === 'string' ? p.output
                : (p.output && (p.output.stdout || p.output.text || JSON.stringify(p.output))) || '')
            : String(p.text || p.assembled_prompt || '');
          const label = env.kind === EnvelopeKind.UserMessage ? 'UserMessage · input'
            : env.kind === EnvelopeKind.ModelReply ? 'ModelReply · output'
            : env.kind === EnvelopeKind.FinalAnswer ? 'FinalAnswer · output'
            : `ToolResult · ${(p && p.tool) || 'tool'}`;
          return { seq: env.seq, title: label, text };
        }),
      sceneHas: graphGrid.length > 0,
      sceneEmpty: graphGrid.length === 0,
      sceneRows: graphGrid.length,
      sceneCols: (graphGrid[0] && graphGrid[0].length) || 0,
      sceneGridCols: `repeat(${(graphGrid[0] && graphGrid[0].length) || 12}, 1fr)`,
      sceneCells: (() => {
        try {
          return graphGrid.flat().map((v) => ({ bg: v ? '#82a5c8' : '#1a1c20' }));
        } catch (_) { return []; }
      })(),
      panes, paneCols: state.colW.map(w => w.toFixed(3) + 'fr').join(' '), paneRows: state.rowW.map(w => w.toFixed(3) + 'fr').join(' '), focusedName: fp.name, focusedId: fp.id,
      revealFlexL: state.revealL.toFixed(3) + ' 1 0%',
      revealGutterLeft: (state.revealL / (state.revealL + 1) * 100).toFixed(2) + '%',
      revealGrab: (ev) => { ev.preventDefault(); this._gut = { type: 'reveal' }; },
      colGutters: state.colW.slice(0, -1).map((_, i) => { const total = state.colW.reduce((a, b) => a + b, 0); const left = state.colW.slice(0, i + 1).reduce((a, b) => a + b, 0) / total * 100; return { left: left.toFixed(2) + '%', grab: (ev) => { ev.preventDefault(); this._gut = { type: 'col', i: i + 1 }; } }; }),
      rowGutters: state.rowW.slice(0, -1).map((_, i) => { const total = state.rowW.reduce((a, b) => a + b, 0); const top = state.rowW.slice(0, i + 1).reduce((a, b) => a + b, 0) / total * 100; return { top: top.toFixed(2) + '%', grab: (ev) => { ev.preventDefault(); this._gut = { type: 'row', i: i + 1 }; } }; }),
      // The top bar's workspace card (web/app/derive/workspace_card.ts, sprint 233; F328).
      ...(() => {
        const card = workspaceCard({ unbound: !!fp.unbound, ws: fp.ws || '', shape: fp.shape || '', name: fp.name || '',
          workspacePath: (((state.controllerSnapshots || {})[fp.id] || {}).workspacePath) || null });
        return { focusedWorkspace: card.workspace, focusedShape: card.shape };
      })(),

      // The meta view's machinery lens wraps in this gate; every pane has its own controller, so it
      // always shows (the old notMainFocused branch, scripted lines, is gone).
      isMainFocused: true,
      // UI sprint 136: the one top bar shows the focused pane — its status dot, its name (double-click
      // renames it), and its driver and workspace chips in every view but the records and assay pages.
      ...(() => {
        const row = panes.find(x => x.id === fp.id) || panes[0];
        return {
          // UI sprint 141: the meta view's input bar is the focused pane's own bar.
          fpRow: row,
          fpDot: row.dot, fpDotBg: row.dotBg,
          fpEditing: row.editing, fpNotEditing: row.notEditing, fpNameVal: row.nameVal,
          fpStartEdit: row.startEdit, fpUpdName: row.updName, fpNameKey: row.nameKey,
        };
      })(),
      showBarChips: !surf,
      showDriverChip: !surf && !!this._paneDriver(state, fp),
      // No workspace yet reads ⌥ —; a per-session sandbox has no path of its own and reads ⌥ sandbox.
      // UI sprint 182: a run's pane names the worktree its record names, home written `~`.
      fpWsLabel: fp.unbound ? '⌥ —' : fp.runRoot
        ? '⌥ ' + ((((state.controllerSnapshots || {})[fp.id] || {}).workspacePath || '—').replace(/^\/Users\/[^/]+/, '~'))
        // F339: a git folder's pane names its folder; no session has a worktree branch of its own.
        : '⌥ ' + (fp.ws || 'sandbox'),
      splitRight: () => this._split('right'),
      // On Auto the chip names the CLI only; the card says why (UI sprint 139).
      driverName: (() => { const d = this._paneDriver(state, fp) || ''; return chipLabel(d, this._resolveDriverLabel(state, d)); })(), driverOpen: state.driverOpen,
      toggleDriverMenu: () => this.setState(s => ({ driverOpen: !s.driverOpen, wsOpen: false })),
      // The footer is web/app/Footer.tsx (sprint 224).
      // ── find (19k/19l) ──
      // The find bar is web/app/FindBar.tsx (sprint 272); a click on a lens moves its scope.
      focusTranscript: () => setFindScope('transcript'),
      focusStream: () => setFindScope('stream'),
      // The dialogs are web/app/Dialogs.tsx (sprint 216).
      // First run is web/app/FirstRun.tsx (sprint 225).
    };
    // The top bar reads these from its store (web/app/state/top_bar.ts); _publishTopBar writes them
    // after the render, since a store write during a render would update another root mid-render.
    this._topBarVals = {
      dotBg: vals.fpDotBg, dot: vals.fpDot, crumb: vals.crumb, editing: !!vals.fpEditing, nameVal: vals.fpNameVal || '',
      showChips: !!vals.showBarChips, showDriverChip: !!vals.showDriverChip, driverName: vals.driverName,
      modelCardOpen: !!vals.fpDdOpen, model: vals.fpModel, modelVersion: vals.fpModelVersion, guidance: vals.fpGuidance, length: vals.fpLength, tone: vals.fpTone,
      wsLabel: vals.fpWsLabel, wsCardOpen: !!vals.fpWsOpen, workspace: vals.focusedWorkspace, shape: vals.focusedShape,
      escHint: vals.escHint, recordsColor: vals.recordsColor,
      revealLabel: vals.revealLabel, revealColor: vals.revealBtnColor, revealBg: vals.revealBtnBg,
    };
    this._topBarActs = {
      startEdit: vals.fpStartEdit, toggleModelCard: vals.fpToggleDd, toggleWsCard: vals.fpToggleWs,
      openRecords: vals.openRecords, toggleReveal: vals.toggleReveal,
    };
    return vals;
  }
}
