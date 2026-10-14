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
// `window.__vm` (the PaneRegistry booted by reveal.ts), and a small
// helper set (`formatProducerLabel`, `formatEnvelopeGist`, `laneForProducerKind`, `stripSubstratePrefix`)
// referenced across methods. None of them import; dc-runtime evaluates
// the class as a bare script.

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
import { describeEventTime, eventTimes, formatClock, formatElapsed } from "./reveal/timeline";
import { toggleToolOutputMode } from "./vm/tool_output_mode";
import { GUIDANCE_LEVEL_BUNDLES, HANDOFF_DEFAULT, LENGTH_DEFAULT, LengthPosition, TONE_DEFAULT, TonePosition } from "./vm/controls.gen";

// UI sprint 132 (kernel K288, session vocabulary § R): the guidance levels the bar offers, each
// with the bundle that carries it. `auto` names none, so the daemon picks the model's default.
// UI sprint 138: one or two sentences per structure-lens heading, from Substrate's docs
// (docs/api.md, docs/tutorial.md, docs/adding-a-topology.md, kernel/topology.py).
const STRUCTURE_DEFS = {
  events: 'An event is a typed record a producer emits. The run\u2019s record is its events in order, and every other part reads them. Runtime: lifecycle events the runtime writes. Outside: written into the record by the app, for the user.',
  producers: 'A producer is a callable that takes typed input and yields typed events. The runtime starts one each time a trigger fires and records its start and its end.',
  triggers: 'A trigger starts a producer when an event it subscribes to arrives and its predicate holds over the views. PerEvent fires on every match; Once fires a single time.',
  routes: 'A route stages data from an event into a named slot, and a later trigger reads it. Context reaches a producer\u2019s next instantiation this way.',
  views: 'A view is a deterministic projection the runtime keeps current over the events. Triggers read views by name to decide whether to fire and what to pass.',
  ends: 'The termination policy decides when the run stops: it finalises the record, or pauses it to wait for input.',
  run: 'The baseline is metadata recorded when the run opens (environment, fixtures, seeds), so the record reads from a known state. Exports are what a run composed inside another hands back to its parent.',
  initial: 'An initial producer starts when the run opens, before any trigger.',
  instrument: 'An instrument is a producer and its trigger registered together: it starts once for every event of one kind.',
  deterministic: 'A deterministic producer gives the same events for the same input, so replay can run it again.',
};

// UI sprint 161: the levels and their bundles are generated from the kernel (vm/controls.gen.ts);
// only the one-line notes are the UI's own.
// The input bar's hint; a run's pane shows why it takes no typing instead (UI sprint 182).
const INPUT_HINT = 'type to input · / for commands · ↵ to send';
const GUIDANCE_AUTO_META = 'follows the model';
const GUIDANCE_META = { harness: 'loop rules only', low: 'one line a rule', medium: 'rules, no examples', high: 'the full standard' };
const GUIDANCE_OPTIONS = [
  { level: null, bundle: null, label: 'auto', meta: GUIDANCE_AUTO_META },
  ...Object.entries(GUIDANCE_LEVEL_BUNDLES).map(([level, bundle]) => ({ level, bundle, label: level, meta: GUIDANCE_META[level] || '' })),
];
// UI sprint 143 (kernel K296, session vocabulary § T): the Length and Tone lines under GUIDANCE.
// The positions and defaults are generated from the kernel (vm/controls.gen.ts); only the one-line
// descriptions are the UI's own. The defaults write no text.
const LENGTH_META = {
  [LengthPosition.TERSE]: 'the answer and its facts',
  [LengthPosition.NORMAL]: 'as the guidance has it',
  [LengthPosition.FULL]: 'complete, not padded',
};
const TONE_META = {
  [TonePosition.BLUNT]: 'plain judgements, no softening',
  [TonePosition.NEUTRAL]: 'as the guidance has it',
  [TonePosition.FORMAL]: 'for readers outside the conversation',
  [TonePosition.DRY]: 'understated and factual',
};
const LENGTH_OPTIONS = Object.values(LengthPosition).map(v => ({ value: v, label: v, meta: LENGTH_META[v] || '' }));
const TONE_OPTIONS = Object.values(TonePosition).map(v => ({ value: v, label: v, meta: TONE_META[v] || '' }));
const LENGTH_DEFAULT_AT = LENGTH_OPTIONS.findIndex(o => o.value === LENGTH_DEFAULT);
const TONE_DEFAULT_AT = TONE_OPTIONS.findIndex(o => o.value === TONE_DEFAULT);
import { mdBlocks, mdInlines, renderBlock, renderInline } from "./reveal/markdown";
import { liveActivity } from "./reveal/activity";
import { followBottom } from "./reveal/follow_bottom";
import { sessionStatusLook } from "./reveal/session_status";
import { buildLanguageLens, LANGUAGE_STREAM_TABS, languageView, languageViewTabs, LanguageStreamId, LanguageViewMode } from "./reveal/language_lens";
import { settingsTail } from "./reveal/settings_tail";


// UI sprint 187: a baseline value as the structure view's run table shows it. A composed run's
// plan reads as its steps in order; any other object as JSON, cut to one line.
function baselineText(key, value) {
  if (key === 'plan' && value && Array.isArray(value.steps)) {
    return value.steps.map(s => `${s.id} (${s.part})`).join(' → ');
  }
  if (value && typeof value === 'object') {
    const json = JSON.stringify(value);
    return json.length > 160 ? json.slice(0, 160) + '…' : json;
  }
  return String(value);
}

class Component extends DCLogic {
  state = { revealed: false, mode: GraphMode.Stream, dir: GraphDirection.Down, sel: null, langStream: LanguageStreamId.Model, langLane: 0, langView: LanguageViewMode.Bars, promptVal: '', surface: null, studioView: 'form', studioOut: 'author a topology, then validate or build.', studioOutColor: '#62676f', level: RevealLevel.All, sent: [],
    topoName: 'adversarial_pair_review',
    prods: [{ name: 'builder', initial: true, emits: 'Draft' }, { name: 'attacker', initial: false, emits: 'Critique' }, { name: 'judge', initial: false, emits: 'Verdict' }],
    sviews: [{ name: 'draft_count', def: 'KindCount(of Draft)' }, { name: 'critique_buf', def: 'KindBuffer(of Critique)' }],
    trigs: [{ id: 'attack', view: 'draft_count', op: '≥', n: '1', starts: 'attacker' }, { id: 'adjudicate', view: 'critique_buf', op: '≥', n: '2', starts: 'judge' }],
    sroutes: [{ id: 'seed-judge', kind: 'Draft', slot: 'judge.draft' }],
    termKind: 'threshold_count', termOf: 'Verdict', termN: '1',
    responder: 'deterministic', seed: '0', model: 'llama3.2',
    cardPos: { builder: { x: 80, y: 80 }, attacker: { x: 390, y: 190 }, judge: { x: 700, y: 86 } },
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
    findOpen: false, findQ: '', findScope: 'transcript',
    showSettings: false, showExport: false, showEndConfirm: false, frDone: false, theme: 'dark', fontOverride: null, settingsNote: '',
  // Sprint 086 — Records surface: per-workspace expand state and
  // paginated session buffers. Empty means "not expanded, not fetched
  // yet". On expand, loadSessionsByWorkspace(path, 0, 50) fills
  // pagedByWs[path]. Load-more button fires at offset = current length.
  expandedWs: {}, pagedByWs: {}, addWsBusy: false,
  // Sprint 086 followup — workspace picker's per-row expand state
  // (independent of Records surface). Expanding a row fetches the
  // most recent 5 sessions from that workspace and lists them
  // beneath so the user can attach to an existing one instead of
  // starting fresh.
  pickerExpandedWs: {}, pickerPagedByWs: {} };
  _buildStudioSpec() {
    // Studio state → server spec. Mirrors the shape web/studio.ts posts
    // to /api/validate + /api/build. Fields are the ones builder.py
    // reads (kind, emits, initial, model, prompt on producers; name,
    // kind, of on views; id, on, predicate, starts, policy, reads on
    // triggers; id, of, slot on routes; termination + responder + seed
    // + model_name at the top).
    const studioState = this.state;
    const producers = studioState.prods.map(p => ({
      kind: String(p.name || '').trim(),
      emits: String(p.emits || '').split(',').map(s => s.trim()).filter(Boolean),
      initial: !!p.initial,
      model: !!p.model,
      prompt: String(p.prompt || '').trim(),
    })).filter(p => p.kind);
    const views = studioState.sviews.map(v => {
      const def = String(v.def || '');
      const m = def.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*of\s+([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*$/);
      const kind = m ? m[1] : def.split('(')[0].trim();
      const of = m ? m[2] : (def.match(/of\s+([A-Za-z_][A-Za-z0-9_]*)/) || [])[1] || '';
      return { name: String(v.name || '').trim(), kind, of };
    }).filter(v => v.name && v.of);
    const triggers = studioState.trigs.map(t => {
      const view = String(t.view || '').trim();
      const rawOp = String(t.op || '≥');
      const op = rawOp === '≥' ? '>=' : rawOp === '≤' ? '<=' : rawOp === '≠' ? '!=' : rawOp;
      const predicate = view ? { view, op, n: Number(t.n) || 0 } : null;
      return {
        id: String(t.id || '').trim(),
        on: String(t.on || '').trim(),
        predicate,
        starts: String(t.starts || '').trim(),
        policy: String(t.policy || 'PerEvent'),
        reads: String(t.reads || '').trim(),
      };
    }).filter(t => t.id && t.starts);
    const routes = studioState.sroutes.map(r => ({
      id: String(r.id || '').trim(),
      of: String(r.kind || '').trim(),
      slot: String(r.slot || '').trim(),
    })).filter(r => r.id && r.of && r.slot);
    const termKind = studioState.termKind || 'quiescence_with_watchdog';
    let termination;
    if (termKind === 'all_completed' || termKind === 'cancel_all_others') termination = { kind: termKind };
    else if (termKind === 'threshold_count') termination = { kind: 'threshold_count', of: String(studioState.termOf || ''), n: Number(studioState.termN) || 1 };
    else termination = { kind: 'quiescence_with_watchdog', seconds: Number(studioState.termSeconds) || 1 };
    return {
      name: String(studioState.topoName || 'authored').trim(),
      producers, views, triggers, routes, termination,
      responder: studioState.responder || 'deterministic',
      seed: Number(studioState.seed) || 0,
      model_name: String(studioState.model || '').trim(),
    };
  }
  // Sprint 073 — markdown methods extracted to `web/reveal/markdown.ts`.
  // The wrappers below preserve the dc-runtime call sites
  // (`this._mdBlocks(...)`, `this._mdRenderBlock(...)`) while the
  // implementation lives in one place. Unit tests at
  // `web/reveal/__tests__/markdown.spec.ts`.
  _mdRenderInline(seg) { return renderInline(seg); }
  _mdRenderBlock(blk) { return renderBlock(blk); }
  _mdInlines(text) { return mdInlines(text); }
  _mdBlocks(text) { return mdBlocks(text); }
  _liveActivity(snap) { return liveActivity(snap); }
  // UI sprints 161, 172: the bar line ends with the settings, each named, and each language shift
  // since the last change written after the setting its measure answers to.
  _tailSegs(paneId, snap) {
    if (!snap || !snap.sessionId) return [];
    const vm = window.__vm;
    const ctl = vm && typeof vm.get === 'function' ? vm.get(paneId) : null;
    const level = ctl && typeof ctl.guidanceLevel === 'function' ? ctl.guidanceLevel() : null;
    return settingsTail({
      guidance: level || snap.bundleSlug || 'none', length: snap.length || LENGTH_DEFAULT, tone: snap.tone || TONE_DEFAULT,
      handoff: snap.handoff || HANDOFF_DEFAULT,
      language: snap.language || null, off: !!snap.languageOff, clearedSeq: snap.languageClearedSeq ?? -1,
    }).map(sg => ({ ...sg, deco: sg.shift ? 'underline dotted' : 'none', cursor: sg.shift ? 'help' : 'inherit', shiftAttr: sg.shift ? sg.text : '' }));
  }
  _liveBindingsFor(paneId, state) {
    // Sprint 076 retirement: dc-runtime no longer renders transcript
    // rows. This helper now surfaces the activity strip alone (the
    // producer/turn recap above the prompt row). Every transcript
    // row goes through the React atom tree at web/reveal/transcript/.
    const snap = (state.controllerSnapshots || {})[paneId] || null;
    const activity = this._liveActivity(snap);
    return {
      activityShow: !!activity,
      activityTurnWord: activity ? activity.turnWord : '',
      activityTurnColor: activity ? activity.turnColor : '#4a4e55',
      activityRest: activity ? activity.hasRest : false,
      // UI sprint 161: the session's guidance, length and tone end the line (§ U).
      activityRestText: activity ? activity.restText : '',
      tailSegs: activity ? this._tailSegs(paneId, snap) : [],
      activityColor: activity ? activity.color : '#62676f',
      activityPulseClass: activity && activity.pulseOn ? 'act-pulse' : '',
      // UI sprint 105: one line per running bash background task, with a stop link (Claude
      // Code's /tasks). The controller keeps the list fresh while any task runs.
      ...this._taskBindings(paneId, snap),
    };
  }
  _taskBindings(paneId, snap) {
    const tasks = (snap && Array.isArray(snap.backgroundTasks)) ? snap.backgroundTasks : [];
    const running = tasks.filter((t) => t.status === 'running');
    const fmt = (s) => formatClock(s);
    return {
      tasksShow: running.length > 0,
      taskRows: running.map((t) => ({
        id: t.task_id,
        label: `${t.task_id} · ${String(t.command).slice(0, 60)} · ${fmt(t.runtime_s)}`,
        stop: () => {
          const vm = window.__vm;
          const c = vm && vm.get(paneId);
          if (c) c.stopTask(t.task_id);
        },
      })),
    };
  }
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
    return { id, name: 'pane-' + id, driver: null, unbound: true, wsQ: '', editing: false, nameVal: '', pv: '', lines: [] };
  }
  _bindPane(id, ws, opts) {
    this.setState(s => {
      const pane = s.panes.find(p => p.id === id); if (!pane || !pane.unbound) return {};
      // Kinds: 'default' = fresh per-session sandbox (substrate mints
      // ~/.substrate/sessions/<id>/workspace); 'sandbox' = the shared
      // ~/.substrate/sandbox; 'flat' = any user-picked directory.
      const isDefault = !!(opts && opts.isDefault);
      const shape = isDefault ? 'isolated' : (ws === '~/.substrate/sandbox' ? 'sandbox' : 'flat');
      // Session open elsewhere reads pane.ws. Empty ws leaves the
      // workspace field off the POST so substrate falls back to its
      // per-session isolated default.
      const boundWs = isDefault ? '' : ws;
      const displayWs = isDefault ? 'fresh per-session sandbox' : ws;
      const lines = [
        { t: 'session ' + pane.name + ' started · driver ' + pane.driver + ' · ' + displayWs + (shape === 'worktree' ? ' · worktree substrate/' + pane.name : ' · ' + shape), c: '#62676f' },
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
    if (vm && typeof vm.addWorkspace === 'function' && armed.ws !== '~/.substrate/sandbox') {
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

  _resolveDriverLabel(state, driver) {
    // Sprint 087c follow-up — the chip shows the resolved model
    // spelling, not just the CLI name. Ollama tags already carry the
    // model in `driver`, so this is a no-op for them. For CLIs we
    // walk cliVersions to find the family + pin that match the
    // current pick (either an explicit driverVersion or the CLI's
    // default_family → default_pin), and return
    //   "<cli> <family label> <pin label>"
    // Everything lowercase — matches the section-header case Peter
    // set for "cli agents" and mirrors the CLI names themselves.
    const base = String(driver || '').toLowerCase();
    if (!base) return base;
    const tree = (state.cliVersions || {})[driver];
    if (!tree || !Array.isArray(tree.families) || tree.families.length === 0) return base;
    const pickedId = (state.driverVersion || {})[driver] || tree.default_family;
    if (!pickedId) return base;
    for (const fam of tree.families) {
      if (fam.id === pickedId) {
        // Family-level pick — use the family's default pin for the
        // full label so the chip always names the exact pin the
        // server will run.
        const defPin = (fam.pins || []).find((p) => p.id === fam.default_pin);
        const famLabel = String(fam.label || '').toLowerCase();
        const pinLabel = defPin ? String(defPin.label || '').toLowerCase() : '';
        return [base, famLabel, pinLabel].filter(Boolean).join(' ');
      }
      const pin = (fam.pins || []).find((p) => p.id === pickedId);
      if (pin) {
        return [base, String(fam.label || '').toLowerCase(), String(pin.label || '').toLowerCase()].filter(Boolean).join(' ');
      }
    }
    return base;
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

  _buildDriverOpts(state, paneId, currentDriver, onPicked) {
    // Sprint 087b — three-tier dropdown: CLI row (level 0) expands
    // into families (level 1), each family expands into pins
    // (level 2). Every row is its own pick — clicking the CLI label
    // picks the CLI's default family+pin, clicking a family label
    // picks that family's default pin, clicking a pin label pins
    // exactly. Rows carry `indent` (px) so one flat template can
    // draw all three levels. Caret points inward: ◂ collapsed,
    // ▾ expanded.
    const groups = (state.driverGroups && state.driverGroups.length)
      ? state.driverGroups
      : [{ label: '', entries: (state.driverRoster && state.driverRoster.length) ? state.driverRoster : ['deterministic'] }];
    const cliVersions = state.cliVersions || {};
    const items = [];
    const noop = () => undefined;
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
    // UI sprint 124 — each group is a row of its own, folded at first, opened like a workspace
    // row; its drivers sit one level in.
    const toggleGroup = (label) => (ev) => {
      if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
      this.setState((s) => ({ driverExpandedGroups: Object.assign({}, s.driverExpandedGroups, { [label]: !(s.driverExpandedGroups || {})[label] }) }));
    };
    for (const grp of groups) {
      const grouped = !!grp.label;
      const groupOpen = !grouped || !!(state.driverExpandedGroups || {})[grp.label];
      const step = grouped ? 16 : 0;
      if (grouped) items.push({
        label: grp.label, color: '#b9bec5', indent: 12,
        isHeader: false, notHeader: true, isGroup: true, expandable: true, current: false, expanded: groupOpen,
        chevron: groupOpen ? '▾' : '◂', pick: toggleGroup(grp.label), toggleExpand: toggleGroup(grp.label),
      });
      if (!groupOpen) continue;
      for (const cli of grp.entries) {
        const tree = cliVersions[cli];
        const families = tree && Array.isArray(tree.families) ? tree.families : [];
        const cliHasChildren = families.length > 0;
        const cliExpanded = state.driverExpandedCli === cli;
        items.push({
          label: String(cli).toLowerCase(),
          color: cli === currentDriver ? '#e2e5e9' : '#b9bec5',
          indent: 12 + step,
          isHeader: false, notHeader: true,
          current: cli === currentDriver, expanded: cliExpanded,
          expandable: cliHasChildren,
          chevron: cliHasChildren ? (cliExpanded ? '▾' : '◂') : ' ',
          toggleExpand: cliHasChildren
            ? (ev) => { if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation(); this.setState((s) => ({ driverExpandedCli: s.driverExpandedCli === cli ? null : cli, driverExpandedFamily: null })); }
            : noop,
          pick: () => pickDriverAndVersion(cli, null),
        });
        if (!cliExpanded) continue;
        for (const fam of families) {
          const pins = Array.isArray(fam.pins) ? fam.pins : [];
          const famHasChildren = pins.length > 0;
          const famExpanded = state.driverExpandedFamily === (cli + ':' + fam.id);
          items.push({
            label: String(fam.label || '').toLowerCase(),
            color: '#b9bec5',
            indent: 28 + step,
            isHeader: false, notHeader: true,
            current: false, expanded: famExpanded,
            expandable: famHasChildren,
            chevron: famHasChildren ? (famExpanded ? '▾' : '◂') : ' ',
            toggleExpand: famHasChildren
              ? (ev) => { if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation(); this.setState((s) => ({ driverExpandedFamily: s.driverExpandedFamily === (cli + ':' + fam.id) ? null : (cli + ':' + fam.id) })); }
              : noop,
            pick: () => pickDriverAndVersion(cli, fam.id),
          });
          if (!famExpanded) continue;
          for (const pin of pins) {
            items.push({
              label: String(pin.label || '').toLowerCase(),
              color: '#b9bec5',
              indent: 44 + step,
              isHeader: false, notHeader: true,
              current: false, expanded: false,
              expandable: false,
              chevron: ' ',
              toggleExpand: noop,
              pick: () => pickDriverAndVersion(cli, pin.id),
            });
          }
        }
      }
    }
    return items;
  }

  // UI sprint 124/128 — the workspace half's rows, with each open row's sessions.
  _wsPickerRows(state, p) {
    if (!p.unbound) return [];
    // Sprint 086b — picker offers only pickable workspaces:
    //   default (per-session isolated), inherit-from-parent (when
    //   applicable), sandbox, any user-added folders, choose folder…
    // Every server-side row that is a per-session-sandbox
    // collapse, a temp-fixture path, or an on-disk artifact
    // stays out of the picker (those live on the Records surface).
    const skip = (r) => (
      !r || typeof r.path !== 'string' || !r.path
      || r.shape === 'per-session-sandboxes'
      || /\.substrate\/sessions\//.test(r.path)
      || /^\/var\/folders\//.test(r.path)
      || /^\/tmp\//.test(r.path)
      || /substrate-walkthrough-/.test(r.path)
      || /substrate-harness-/.test(r.path)
      || r.path === '~/.substrate/sandbox' || r.path.endsWith('/.substrate/sandbox')
    );
    const userFolders = ((state.recentWorkspaces || []).filter(r => !skip(r)));
    const inheritFrom = this.state.panes.find(pp => pp.id !== p.id && !pp.unbound && !!pp.ws);
    const inheritPath = inheritFrom ? inheritFrom.ws : null;
    const rows = [];
    // Default row: substrate mints a fresh per-session sandbox at
    // ~/.substrate/sessions/<id>/workspace. Path stays empty so
    // openSession sends no workspace field and substrate uses its
    // own default.
    // Per-session-sandbox row: expandable via the server's
    // synthesized `~/.substrate/sessions/` workspace (returned by
    // /api/workspaces with shape='per-session-sandboxes').
    // by-workspace with that path collapses every per-session
    // sandbox session under one paginated result.
    const perSessionRow = (state.recentWorkspaces || []).find(r => r && r.shape === 'per-session-sandboxes');
    const perSessionPath = perSessionRow ? perSessionRow.path : '';
    rows.push({ path: 'per session sandbox', meta: 'substrate manages · isolated', kind: 'default', expandable: !!perSessionPath, expandPath: perSessionPath });
    if (inheritPath) rows.push({ path: inheritPath, meta: 'inherit · from ' + (inheritFrom.name || 'split'), kind: 'inherit' });
    rows.push({ path: '~/.substrate/sandbox', meta: 'sandbox · shared across sessions', kind: 'sandbox', expandable: true });
    for (const r of userFolders.slice(0, 2)) rows.push({ path: r.path, meta: 'recent', kind: 'recent', expandable: true });
    rows.push({ path: 'choose folder…', meta: '', kind: 'choose', key: '⌘O' });
    if (p.wsQ) rows.unshift({ path: p.wsQ, meta: 'typed — ↵ picks the folder', kind: 'typed', key: '↵' });
    const pickerExpanded = state.pickerExpandedWs || {};
    const pickerPaged = state.pickerPagedByWs || {};
    // Session-attach handler for the expanded sub-rows. Mirrors
    // the Records surface's pick: mark pane bound before attach so
    // the transcript branch renders.
    const _attachToExisting = (paneId, s) => {
      const vm = window.__vm;
      if (!vm || !s.sessionId) return;
      const wsPath = (typeof s.workspacePath === 'string' && s.workspacePath) ? s.workspacePath : '';
      const wsShape = (typeof s.workspaceShape === 'string' && s.workspaceShape) ? s.workspaceShape : 'flat';
      this.setState(st => ({
        panes: st.panes.map(pn => pn.id === paneId
          ? Object.assign({}, pn, { unbound: false, ws: wsPath, shape: wsShape, name: s.name || pn.name, lines: [] })
          : pn),
      }));
      vm.attachExisting(s.sessionId);
    };
    // Toggle expand on an expandable row. On expand: fire
    // loadSessionsByWorkspace(path, 0, 5) if not yet fetched.
    const _pickerToggle = (path) => {
      this.setState(st => ({ pickerExpandedWs: Object.assign({}, st.pickerExpandedWs, { [path]: !(st.pickerExpandedWs || {})[path] }) }));
      if (!pickerExpanded[path]) {
        const vm = window.__vm;
        if (vm && typeof vm.loadSessionsByWorkspace === 'function' && !pickerPaged[path]) {
          vm.loadSessionsByWorkspace(path, 0, 5).then((r) => {
            this.setState(st => ({ pickerPagedByWs: Object.assign({}, st.pickerPagedByWs, { [path]: { rows: r.rows, total: r.total } }) }));
          }).catch(() => undefined);
        }
      }
    };
    // Rows and the sessions of an open row share one key list (UI sprint 128); `nav` is a row's
    // place in it, and wsSelIdx counts along it.
    let nav = 0;
    const sel = p.wsSelIdx || 0;
    return rows.map((row) => {
      const rowNav = nav++;
      const expandKey = row.expandPath || row.path;
      const expanded = !!(row.expandable && pickerExpanded[expandKey]);
      const paged = row.expandable ? pickerPaged[expandKey] : null;
      const sessions = (expanded && paged)
        ? paged.rows.slice(0, 5).map(s => { const sNav = nav++; return {
            sessionIdShort: (s.sessionId || '').slice(0, 12),
            name: s.name || (s.sessionId || '').slice(0, 8),
            driver: s.driver || '?',
            statusLabel: sessionStatusLook(s.status).label,
            dotColor: sessionStatusLook(s.status).dot,
            pick: () => _attachToExisting(p.id, s),
            nav: sNav,
            bg: p.pickerHalf !== 'model' && sNav === sel ? '#2e3138' : 'transparent',
            litAttr: p.pickerHalf !== 'model' && sNav === sel ? '1' : '0',
          }; })
        : [];
      const isArmed = !!(p.armed && (row.kind === 'default' ? p.armed.isDefault : (!p.armed.isDefault && p.armed.ws === row.path)));
      const lit = p.pickerHalf === 'model' ? isArmed : rowNav === sel;
      return Object.assign({}, row, {
        c: lit ? '#e2e5e9' : '#b9bec5',
        bg: lit ? '#2e3138' : 'transparent',
        litAttr: lit ? '1' : '0',
        key: isArmed ? '→' : (row.key || (lit ? '↵' : '')),
        expanded, notExpanded: !expanded,
        chevron: row.expandable ? (expanded ? '▾' : '▸') : ' ',
        toggleExpand: row.expandable ? ((ev) => { if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation(); _pickerToggle(expandKey); }) : (() => undefined),
        sessions,
        nav: rowNav,
        pick: () => {
          if (row.kind === 'choose') { this._pickFolder(p.id); return; }
          this._armWorkspace(p.id, row.kind === 'default' ? '' : row.path, row.kind === 'default');
        },
      });
    });
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
    if (p.pickerHalf === 'guidance' && p.armed) {
      const n = GUIDANCE_OPTIONS.length;
      const at = Math.max(0, Math.min(p.guidanceSel ?? 0, n - 1));
      if (ev.key === 'ArrowRight') { ev.preventDefault(); setPane({ guidanceSel: (at + 1) % n }); return; }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); setPane({ guidanceSel: (at - 1 + n) % n }); return; }
      if (ev.key === 'Enter') { ev.preventDefault(); this._pickGuidance(paneId, GUIDANCE_OPTIONS[at]); return; }
      if (ev.key === 'Escape' || ev.key === 'ArrowUp') { ev.preventDefault(); setPane({ pickerHalf: 'model' }); return; }
      return;
    }
    // UI sprint 143: LENGTH and TONE take the guidance line's keys; esc or ↑ steps back a line.
    for (const [half, opts, selKey, pick, back] of [
      ['length', LENGTH_OPTIONS, 'lengthSel', (o) => this._pickLength(paneId, o), 'guidance'],
      ['tone', TONE_OPTIONS, 'toneSel', (o) => this._pickTone(paneId, o), 'length'],
    ]) {
      if (p.pickerHalf !== half || !p.armed) continue;
      const n = opts.length;
      const at = Math.max(0, Math.min(p[selKey] ?? 1, n - 1));
      if (ev.key === 'ArrowRight') { ev.preventDefault(); setPane({ [selKey]: (at + 1) % n }); return; }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); setPane({ [selKey]: (at - 1 + n) % n }); return; }
      if (ev.key === 'Enter') { ev.preventDefault(); pick(opts[at]); return; }
      if (ev.key === 'Escape' || ev.key === 'ArrowUp') { ev.preventDefault(); setPane({ pickerHalf: back }); return; }
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
      flat.push({ pick: r.pick, toggle: r.toggleExpand, expandable: !!r.expandable, expanded: !!r.expanded, parent: null });
      for (const s of r.sessions) flat.push({ pick: s.pick, toggle: null, expandable: false, expanded: false, parent });
    }
    if (!flat.length) return;
    const cur = Math.max(0, Math.min(p.wsSelIdx || 0, flat.length - 1));
    const move = (i) => { setPane({ wsSelIdx: i }); reveal('[data-ws-lit="1"]'); };
    if (ev.key === 'Tab') {
      const firstRecent = rows.find(r => r.kind === 'recent' || r.kind === 'inherit' || r.kind === 'sandbox');
      if (firstRecent) { ev.preventDefault(); setPane({ wsQ: firstRecent.path, wsSelIdx: 0 }); }
      return;
    }
    this._treeKey(flat, cur, ev, move);
  }
  // The workspace tree's keys, shared by the picker's workspace column and the records page (UI
  // sprint 156). `flat` lists rows and, under an open row, its sessions ({ pick, toggle,
  // expandable, expanded, parent }). ↑ ↓ move and wrap; → opens; ← folds an open row, and on a
  // session lights its row and folds it (152); ⇧↵ or ⌥↵ opens or folds; ↵ picks.
  _treeKey(flat, cur, ev, move) {
    if (!flat.length) return false;
    const item = flat[cur];
    const opens = ev.key === 'Enter' && (ev.shiftKey || ev.altKey);
    if (ev.key === 'ArrowDown') { ev.preventDefault(); move((cur + 1) % flat.length); return true; }
    if (ev.key === 'ArrowUp') { ev.preventDefault(); move((cur - 1 + flat.length) % flat.length); return true; }
    if (ev.key === 'ArrowRight' && item.expandable && !item.expanded) { ev.preventDefault(); item.toggle(); return true; }
    if (ev.key === 'ArrowLeft' && item.expandable && item.expanded) { ev.preventDefault(); item.toggle(); return true; }
    if (ev.key === 'ArrowLeft' && item.parent !== null) { ev.preventDefault(); move(item.parent); flat[item.parent].toggle(); return true; }
    if (opens) { ev.preventDefault(); if (item.expandable) item.toggle(); return true; }
    if (ev.key === 'Enter') { ev.preventDefault(); item.pick(); return true; }
    return false;
  }
  // The records page's keys: the workspace tree's, over the rows the last render drew.
  _recordsKey(ev) {
    const flat = this._recordsFlat || [];
    if (!flat.length) return;
    const cur = Math.max(0, Math.min(this.state.recordsSel || 0, flat.length - 1));
    const move = (i) => {
      this.setState({ recordsSel: i });
      setTimeout(() => { const el = document.querySelector('[data-records-lit="1"]'); if (el) el.scrollIntoView({ block: 'nearest' }); }, 0);
    };
    this._treeKey(flat, cur, ev, move);
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
  // UI sprint 182: a run's pane says why it takes no typing; every other pane shows the hint.
  _inputHint(state, paneId) {
    const snap = (state.controllerSnapshots || {})[paneId];
    return (snap && snap.viewOnly) || INPUT_HINT;
  }
  // UI sprint 182 (r9 § 4): a run started now opens a pane per session beside its caller's pane,
  // bound to the session's record. A pane already showing that record is focused instead.
  _openRunPanes(callerPaneId, run) {
    const vm = window.__vm;
    // UI sprint 187: a composed run has no sessions of its own; its pane shows its own record.
    const composed = !(run.sessions || []).length;
    const targets = composed ? (run.record_root ? [{ record_root: run.record_root }] : []) : run.sessions;
    for (const sess of targets) {
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
        if (c && c.attachRun) c.attachRun(root, String(run.topology || 'run'), String(run.run_id || ''), composed).catch(() => undefined);
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
    // 19c settings persistence — load once at mount, save on change.
    // Whole-state restore per D68 still lives in SQLite; these are
    // per-viewer preferences that never round-trip to the server.
    try {
      const raw = window.localStorage.getItem('substrate-ui.settings');
      if (raw) {
        const s = JSON.parse(raw) || {};
        const patch = {};
        if (s.theme === 'dark' || s.theme === 'light' || s.theme === 'system') patch.theme = s.theme;
        if (typeof s.fontOverride === 'number' && s.fontOverride >= 9 && s.fontOverride <= 19) patch.fontOverride = s.fontOverride;
        if (Object.keys(patch).length) this.setState(patch);
      }
    } catch (_e) { /* localStorage unavailable / disabled — carry defaults */ }
    this._persistSettings = () => {
      try {
        const s = this.state;
        window.localStorage.setItem('substrate-ui.settings', JSON.stringify({
          theme: s.theme, fontOverride: s.fontOverride,
        }));
      } catch (_e) { /* ignore */ }
    };
    // Tick the activity strip's seconds counter between controller
    // events. A live tool that takes 12s emits no envelopes for 12s;
    // without a tick the counter reads its start value the whole time.
    this._activityTick = window.setInterval(() => this.forceUpdate(), 500);
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
          && !s.showSettings && !s.showExport && !s.showEndConfirm && !s.findOpen) {
          this._recordsKey(e);
          return;
        }
        if (barKey && !typing && fp && fp.unbound && !(fsnap && fsnap.sessionId) && !s.revealed && !s.surface
          && !s.showSettings && !s.showExport && !s.showEndConfirm && !s.findOpen) {
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
      if (e.metaKey && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); this.setState(s => ({ findOpen: !s.findOpen, findQ: '' })); }
      if (e.metaKey && e.key === ',') { e.preventDefault(); this.setState({ showSettings: true }); }
      if (e.key === 'Escape') {
        const s = this.state;
        if (s.findOpen) this.setState({ findOpen: false, findQ: '' });
        else if (s.showSettings || s.showExport || s.showEndConfirm) this.setState({ showSettings: false, showExport: false, showEndConfirm: false });
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
    this._mm = (e) => { if (!this._drag) return; const n = this._drag; this.setState(s => { const p = s.cardPos[n] || { x: 100, y: 100 }; return { cardPos: Object.assign({}, s.cardPos, { [n]: { x: Math.max(0, Math.min(800, p.x + e.movementX)), y: Math.max(0, Math.min(360, p.y + e.movementY)) } }) }; }); };
    this._mu = () => { this._drag = null; };
    window.addEventListener('mousemove', this._mm); window.addEventListener('mouseup', this._mu);
    this._rs = () => this.setState({ winW: window.innerWidth });
    window.addEventListener('resize', this._rs);
  }
  componentDidUpdate(prevProps) {
    // sync ONLY when a tweak actually changed — never fight the UI's own state
    const pc = this.props.columns, pr = this.props.rows, pv = this.props.view;
    const changed = (k) => prevProps && this.props[k] !== prevProps[k];
    if (!changed('columns') && !changed('rows') && !changed('view')) return;
    const state = this.state;
    if ((changed('columns') && pc && pc !== state.cols) || (changed('rows') && pr && pr !== state.rows)) {
      const cols = pc || state.cols, rows = pr || state.rows;
      const need = cols * rows;
      const panes = state.panes.slice(0, Math.max(1, need));
      while (panes.length < need) panes.push(this._newPane());
      const colW = Array.from({ length: cols }, (_, i) => state.colW[i] || 1);
      const rowW = Array.from({ length: rows }, (_, i) => state.rowW[i] || 1);
      this.setState({ cols, rows, colW, rowW, panes });
    }
    if (changed('view') && pv && (pv === 'revealed') !== state.revealed) this.setState({ revealed: pv === 'revealed', surface: null });
  }
  componentWillUnmount() { if (this._offRuns) this._offRuns(); window.removeEventListener('keydown', this._kd); window.removeEventListener('mousemove', this._mm); window.removeEventListener('mouseup', this._mu); window.removeEventListener('resize', this._rs); if (this._ddOutside) document.removeEventListener('mousedown', this._ddOutside, true); if (this._activityTick) { window.clearInterval(this._activityTick); this._activityTick = null; } }
  _upd(arrKey, i, field) { return (ev) => this.setState(s => { const arr = s[arrKey].map((x, j) => j === i ? Object.assign({}, x, { [field]: ev.target.value }) : x); return { [arrKey]: arr }; }); }
  _rm(arrKey, i) { return () => this.setState(s => ({ [arrKey]: s[arrKey].filter((x, j) => j !== i) })); }
  _validate() {
    const studioState = this.state; const errs = [];
    if (!/^[a-z0-9_]+$/.test(studioState.topoName)) errs.push('name must be [a-z0-9_]+');
    if (!studioState.prods.length) errs.push('no producers');
    const names = studioState.prods.map(p => p.name);
    if (!studioState.prods.some(p => p.initial)) errs.push('no initial producer — nothing runs on the opening cohort');
    studioState.trigs.forEach(t => {
      if (!names.includes(t.starts)) errs.push('trigger ' + t.id + ' starts unknown producer "' + t.starts + '"');
      if (t.view && !studioState.sviews.find(v => v.name === t.view)) errs.push('trigger ' + t.id + ' reads unknown view "' + t.view + '"');
    });
    const emitted = new Set(); studioState.prods.forEach(p => String(p.emits).split(',').map(x => x.trim()).filter(Boolean).forEach(k => emitted.add(k)));
    const consumed = new Set([studioState.termOf]);
    studioState.sviews.forEach(v => { const m = String(v.def).match(/of\s+(\w+)/); if (m) consumed.add(m[1]); });
    studioState.sroutes.forEach(r => consumed.add(r.kind));
    emitted.forEach(k => { if (!consumed.has(k)) errs.push('emitted kind ' + k + ' is neither consumed nor terminal'); });
    return errs;
  }
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
  // UI sprint 141: the input bar's keys, the same in the panes view and the meta view. ↵ sends;
  // ⇧↵ (and ⌥↵) make a new line; ↵ while an input method composes finishes the composition;
  // ↑ on the first line and ↓ on the last walk this pane's sent messages, back to the draft.
  _barKey(paneId, ev) {
    // React's keyboard event leaves isComposing on the browser's own event.
    if (ev.isComposing || (ev.nativeEvent && ev.nativeEvent.isComposing) || ev.keyCode === 229) return;
    const pane = (this.state.panes || []).find(x => x.id === paneId);
    if (!pane) return;
    const setPane = (patch) => this.setState(s => ({ panes: s.panes.map(x => x.id === paneId ? Object.assign({}, x, patch) : x) }));
    const el = ev.target;
    const plain = !ev.shiftKey && !ev.altKey && !ev.metaKey && !ev.ctrlKey;
    // UI sprint 165: Tab completes a command name: one match becomes "/<name> " (its choices
    // then open); several complete to their longest common prefix. Focus stays in the bar.
    if (ev.key === 'Tab' && plain && /^\/\S*$/.test(pane.pv || '')) {
      ev.preventDefault();
      const vm = window.__vm;
      const ctl = vm && typeof vm.get === 'function' ? vm.get(paneId) : null;
      const typed = (pane.pv || '').slice(1).toLowerCase();
      const names = (ctl && typeof ctl.slashCatalog === 'function' ? ctl.slashCatalog() : []).map(c => c.name).filter(n => n.startsWith(typed));
      if (names.length === 1) { setPane({ pv: '/' + names[0] + ' ', slashSel: null }); return; }
      if (names.length > 1) {
        let common = names[0];
        for (const n of names) while (!n.startsWith(common)) common = common.slice(0, -1);
        if (common.length > typed.length) setPane({ pv: '/' + common, slashSel: null });
      }
      return;
    }
    // UI sprint 164: with a command's choices open, ↑ enters the menu at the row nearest the bar,
    // ↑ ↓ move, ↓ off the bottom returns to the bar, ↵ picks, esc returns. History waits.
    const choices = ((this._slashRows || {})[paneId] || []).filter(r => r.choice);
    if (choices.length && plain && ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(ev.key)) {
      const sel = typeof pane.slashSel === 'number' && pane.slashSel < choices.length ? pane.slashSel : null;
      if (ev.key === 'ArrowUp') { ev.preventDefault(); setPane({ slashSel: sel === null ? choices.length - 1 : Math.max(0, sel - 1) }); return; }
      if (ev.key === 'ArrowDown') { ev.preventDefault(); setPane({ slashSel: sel === null || sel + 1 >= choices.length ? null : sel + 1 }); return; }
      if (ev.key === 'Enter' && sel !== null) { ev.preventDefault(); setPane({ slashSel: null }); choices[sel].pick(); return; }
      if (ev.key === 'Escape' && sel !== null) { ev.preventDefault(); setPane({ slashSel: null }); return; }
    }
    if (ev.key === 'Enter' && plain) {
      ev.preventDefault();
      const v = (pane.pv || '').trim();
      if (!v) return;
      const hist = [...(pane.hist || []), v].slice(-200);
      setPane({ pv: '', hist, histAt: null, histDraft: '' });
      const vm = window.__vm;
      if (vm && typeof vm.setActive === 'function') vm.setActive(paneId);
      const controller = vm && typeof vm.get === 'function' ? vm.get(paneId) : null;
      if (controller && typeof controller.submitLine === 'function') controller.submitLine(v);
      else if (vm && typeof vm.submitLine === 'function') vm.submitLine(v);
      return;
    }
    if (!plain || !el || typeof el.selectionStart !== 'number' || el.selectionStart !== el.selectionEnd) return;
    const hist = pane.hist || [];
    const text = String(el.value || '');
    if (ev.key === 'ArrowUp' && !text.slice(0, el.selectionStart).includes('\n') && hist.length) {
      const at = pane.histAt == null ? hist.length : pane.histAt;
      if (at === 0) return;
      ev.preventDefault();
      setPane({ pv: hist[at - 1], histAt: at - 1, histDraft: pane.histAt == null ? (pane.pv || '') : pane.histDraft });
      return;
    }
    if (ev.key === 'ArrowDown' && pane.histAt != null && !text.slice(el.selectionEnd).includes('\n')) {
      ev.preventDefault();
      const next = pane.histAt + 1;
      if (next >= hist.length) setPane({ pv: pane.histDraft || '', histAt: null, histDraft: '' });
      else setPane({ pv: hist[next], histAt: next });
    }
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
    const findQuery = state.findOpen ? state.findQ.trim().toLowerCase() : '';
    const FSTREAM = state.findOpen && state.findScope === 'stream';
    const paneW = (state.winW || window.innerWidth) / state.cols;
    // Slash-router command table. `pick(paneId)` clears that pane's
    // prompt input and submits the slash line on that pane's own
    // controller. The pane loop below hands each rendered pane its
    // own bound routerRows using this table.
    const _vmSubmitFor = (paneId, line) => {
      const vm = window.__vm;
      if (!vm) return;
      if (typeof vm.setActive === 'function') vm.setActive(paneId);
      const controller = typeof vm.get === 'function' ? vm.get(paneId) : null;
      if (controller && typeof controller.submitLine === 'function') controller.submitLine(line);
      else if (typeof vm.submitLine === 'function') vm.submitLine(line);
    };
    const _clearPv = (paneId) => this.setState(s => ({ panes: s.panes.map(x => x.id === paneId ? Object.assign({}, x, { pv: '' }) : x) }));
    // UI sprint 162: the slash menu reads the pane's controller (`slashCatalog`), the same table
    // `submitLine` runs and `/help` prints. A pick sends the line; a command that takes free text
    // fills the bar instead. `/exit` from the menu asks first.
    const _slashMenu = (p) => {
      const raw = p.pv || '';
      if (!raw.startsWith('/') || raw.includes('\n')) return [];
      const vm = window.__vm;
      const ctl = vm && typeof vm.get === 'function' ? vm.get(p.id) : null;
      const catalog = ctl && typeof ctl.slashCatalog === 'function' ? ctl.slashCatalog() : [];
      const send = (line) => { _clearPv(p.id); if (line === '/exit') { this.setState({ showEndConfirm: true }); return; } _vmSubmitFor(p.id, line); };
      const fill = (line) => this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { pv: line }) : x) }));
      const m = raw.match(/^\/(\S+)\s+(\S*)$/);
      if (m) {
        const c = catalog.find(e => e.name === m[1].toLowerCase() || e.aliases.includes(m[1].toLowerCase()));
        if (!c || !c.choices) return [];
        // The picker's own notes for each choice (one copy each, above).
        const notes = { guidance: Object.assign({ auto: GUIDANCE_AUTO_META }, GUIDANCE_META), length: LENGTH_META, tone: TONE_META }[c.name] || {};
        return c.choices.filter(ch => ch.startsWith(m[2].toLowerCase())).map((ch, i) => ({
          choice: true, lit: p.slashSel === i ? '1' : '0', bg: p.slashSel === i ? '#2e3138' : 'transparent',
          cmd: '/' + c.name + ' ' + ch, desc: [notes[ch], ch === c.current ? 'current' : ''].filter(Boolean).join(' · '),
          current: ch === c.current ? '1' : '0', pick: () => send('/' + c.name + ' ' + ch),
        }));
      }
      const q = raw.trim().toLowerCase();
      const matches = catalog.filter(c => ('/' + c.name).startsWith(q));
      // UI sprint 163: one match closes the menu; its hint sits in the input row (_slashHint).
      if (matches.length === 1 && q.length > 1) return [];
      return matches.map(c => ({
        choice: false, lit: '0', bg: 'transparent',
        cmd: '/' + c.name, desc: c.usage === '/' + c.name ? c.about : c.usage.slice(c.name.length + 2) + ' · ' + c.about,
        current: '0',
        pick: c.usage === '/' + c.name ? () => send('/' + c.name) : () => fill('/' + c.name + ' '),
      }));
    };
    // UI sprints 163, 166: the hint for the one command the bar's text names (a unique prefix, or a
    // full name or alias with a space and anything after it): its argument part and description,
    // never its name. It sits in one column for every command, right of the longest command with
    // its longest choice, so typing never moves it; free text that reaches the column hides it.
    const _slashHint = (p) => {
      const raw = p.pv || '';
      if (!raw.startsWith('/') || raw.includes('\n')) return null;
      const vm = window.__vm;
      const ctl = vm && typeof vm.get === 'function' ? vm.get(p.id) : null;
      const catalog = ctl && typeof ctl.slashCatalog === 'function' ? ctl.slashCatalog() : [];
      const col = Math.max(0, ...catalog.map(c => c.name.length + 1 + (c.choices ? 1 + Math.max(...c.choices.map(ch => ch.length)) : 0))) + 3;
      const named = raw.match(/^\/(\S+)\s/);
      const word = named ? named[1].toLowerCase() : raw.slice(1).toLowerCase();
      const matches = named
        ? catalog.filter(c => c.name === word || c.aliases.includes(word))
        : catalog.filter(c => c.name.startsWith(word));
      if (matches.length !== 1 || raw.length >= col) return null;
      const c = matches[0];
      const args = c.usage.slice(c.name.length + 2);
      return { text: args ? args + ' · ' + c.about : c.about, left: col + 'ch' };
    };
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
      ...this._liveBindingsFor(p.id, state),
      // Prompt row bindings — every rendered pane owns its own. A
      // global `state.promptVal` field would mirror the same string
      // into every visible input on every render, so a keystroke in
      // pane 1 would visibly appear in pane 2's input box even though
      // the send only routed to pane 1's controller. Each pane's
      // prompt text lives on `p.pv`; the router row list and its
      // pick callbacks reference the pane's own state.
      pv: p.pv || '',
      promptVal: p.pv || '',
      inputHint: this._inputHint(state, p.id),
      onPv: (ev) => this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { pv: ev.target.value }) : x) })),
      onPrompt: (ev) => this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { pv: ev.target.value, histAt: null, slashSel: null }) : x) })),
      onPvKey: (ev) => {
        if (ev.key !== 'Enter') return;
        const v = (p.pv || '').trim();
        if (!v) return;
        this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { pv: '' }) : x) }));
        const vm = window.__vm;
        if (vm && typeof vm.setActive === 'function') vm.setActive(p.id);
        const controller = vm && typeof vm.get === 'function' ? vm.get(p.id) : null;
        if (controller && typeof controller.submitLine === 'function') controller.submitLine(v);
        else if (vm && typeof vm.submitLine === 'function') vm.submitLine(v);
      },
      onPromptKey: (ev) => this._barKey(p.id, ev),
      ...(() => {
        const rows = _slashMenu(p);
        this._slashRows = Object.assign(this._slashRows || {}, { [p.id]: rows });
        const hint = _slashHint(p);
        return {
          routerRows: rows, routerOpen: rows.length > 0, promptRadius: rows.length ? '0 0 6px 6px' : '6px',
          slashHintShow: !!hint, slashHint: hint ? hint.text : '', slashHintLeft: hint ? hint.left : '0',
        };
      })(),
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
    // Color = participant relevance. Bright = participant-to-participant
    // message (Model, Delegate, External); shown in both `all` and `app`.
    // Gray = runtime plumbing (scheduling, lifecycle, bookkeeping);
    // shown only in `all`. The LOW filter below reads this rule.
    const envelopeKindColor = {
      // Participant messages — bright.
      ToolCall: '#a08fc9', ToolResult: '#7fb3b8',
      UserMessage: '#88b0d0', ModelReply: '#88b0d0', FinalAnswer: '#88b0d0',
      Park: '#82a5c8', Returned: '#82a5c8', SessionEnded: '#88b0d0',
      // Runtime plumbing — gray.
      TriggerFired: '#62676f', ProducerStarted: '#62676f', ProducerCompleted: '#62676f',
      RunStarted: '#62676f', RunFinalised: '#62676f', TerminationMatched: '#62676f',
      SessionStarted: '#62676f', PromptFragment: '#62676f', PromptComposed: '#62676f',
      LanguageProfile: '#62676f', LanguageDrift: '#62676f',
    };
    // Stream lens is always fed off the controller's real envelopes.
    // Framework brackets carry the `substrate.` prefix on the wire;
    // strip it so the lane derivation below matches on bare kind names.
    const _liveEnvelopes = (_vmSnap && Array.isArray(_vmSnap.rawEnvelopes)) ? _vmSnap.rawEnvelopes : [];
    // A turn ends with `Returned` from the `return` producer (vocabulary v0.3); records written
    // before it end with `Park` from the `park` producer. The graph reads both alike.
    const _isTurnEnd = (k) => k === EnvelopeKind.Returned || k === EnvelopeKind.Park;
    const _isReturnProducer = (k) => k === 'return' || k === 'park';
    const stripSubstratePrefix = (k) => (typeof k === 'string' && k.indexOf('substrate.') === 0) ? k.slice('substrate.'.length) : k;
    // Bucket every producer kind onto one of four swim lanes.
    const laneForProducerKind = (producerKind) => {
      const k = producerKind || '';
      if (k === 'model') return 'model';
      if (k === 'tool') return 'tool';
      if (_isReturnProducer(k)) return 'park';
      return 'runtime';
    };
    // The `prod` column and the gist per kind, as the prototype v7 drew them, from the fields
    // real envelopes carry.
    const formatProducerLabel = (kind, producerKind, payload) => {
      // Framework brackets always read as `runtime` — matches prototype.
      if (kind === 'TriggerFired' || kind === 'ProducerStarted' || kind === 'ProducerCompleted'
          || kind === 'RunStarted' || kind === EnvelopeKind.RunFinalised || kind === 'TerminationMatched') return 'runtime';
      if (kind === EnvelopeKind.UserMessage) return 'runtime';
      if (kind === EnvelopeKind.ToolCall) return 'model';
      if (kind === EnvelopeKind.ToolResult) return payload.tool ? `tool · ${payload.tool}` : 'tool';
      if (kind === EnvelopeKind.FinalAnswer || kind === EnvelopeKind.ModelReply) return 'model';
      if (kind === EnvelopeKind.Park || kind === EnvelopeKind.Returned) return 'return';
      if (kind === EnvelopeKind.PromptFragment || kind === EnvelopeKind.PromptComposed || kind === EnvelopeKind.SessionStarted) return 'runtime';
      return producerKind || 'runtime';
    };
    const formatEnvelopeGist = (kind, payload) => {
      if (kind === EnvelopeKind.UserMessage) return String(payload.text || payload.assembled_prompt || '').slice(0, 160);
      if (kind === EnvelopeKind.ModelReply) return String(payload.text || '').slice(0, 160);
      if (kind === EnvelopeKind.FinalAnswer) return 'turn done';
      if (kind === EnvelopeKind.ToolCall) {
        const t = payload.tool || 'tool';
        const args = Array.isArray(payload.args) ? payload.args.join(' ') : (payload.args ? String(payload.args) : '');
        return args ? `${t} ${args}`.slice(0, 160) : t;
      }
      if (kind === EnvelopeKind.ToolResult) {
        const ok = payload.ok !== false;
        const out = payload.output;
        const tail = ok
          ? (typeof out === 'string' ? String(out).slice(0, 80) : (out && (out.stdout || out.text) ? String(out.stdout || out.text).slice(0, 80) : 'ok'))
          : `err · ${payload.error || 'failed'}`;
        return `${ok ? 'ok' : 'err'} · ${tail}`;
      }
      if (kind === 'TriggerFired') {
        const tid = String(payload.factory || payload.trigger_id || 'trigger');
        const starts = payload.starts ? ` → ${payload.starts}` : '';
        return tid + (starts ? ` fired${starts}` : ' fired');
      }
      if (kind === 'ProducerStarted') return (payload.kind || (payload.producer && payload.producer.kind) || 'producer');
      if (kind === 'ProducerCompleted') return (payload.kind || (payload.producer && payload.producer.kind) || 'producer');
      if (kind === EnvelopeKind.Park) return `await ${payload.awaiting || EnvelopeKind.UserMessage}`;
      if (kind === EnvelopeKind.Returned) return `returned · ${payload.reason || ''}`;
      if (kind === EnvelopeKind.SessionStarted) return `seed · driver ${payload.driver_model || '?'}`;
      if (kind === EnvelopeKind.SessionEnded) return `end · ${payload.reason || 'server_end'}`;
      return '';
    };
    const envelopes = _liveEnvelopes.map((env) => {
      const kind = stripSubstratePrefix(env.kind);
      const rawPayload = env.payload || {};
      // ProducerStarted / ProducerCompleted carry the producer info on
      // `payload.producer` (real wire) but the lane logic wants it on
      // `payload.kind` + `payload.instance` (prototype's flat shape).
      const producerFromPayload = rawPayload && rawPayload.producer;
      const producerKind = (env.producer && env.producer.kind)
        || (producerFromPayload && producerFromPayload.kind) || '';
      const producerInstance = (env.producer && env.producer.instance)
        || (producerFromPayload && producerFromPayload.instance) || '';
      // Flatten producer.kind onto payload.kind for the span logic
      // that reads `e.payload.kind === 'model'`.
      const payload = Object.assign({}, rawPayload, {
        kind: producerKind || rawPayload.kind,
        instance: producerInstance || rawPayload.instance,
      });
      const prod = formatProducerLabel(kind, producerKind, rawPayload);
      const gist = formatEnvelopeGist(kind, rawPayload);
      return {
        seq: env.seq,
        kind,
        t: typeof env.t === 'number' ? env.t : null,
        schema: env.schema || '',
        prod,
        producerInstance,
        gist,
        // Which lanes the row touches: m(odel), t(ool).
        lanes: (kind === EnvelopeKind.ToolCall || kind === EnvelopeKind.ToolResult) ? 'mt'
          : (_isTurnEnd(kind) || kind === 'TriggerFired' && _isReturnProducer(payload.starts)) ? ''
          : 'm',
        payload,
        content: [],
      };
    });
    const _evTexts = envelopes.map(e => (e.kind + ' ' + e.prod + ' ' + e.gist).toLowerCase());
    const _rowTexts = ((_vmSnap && Array.isArray(_vmSnap.transcript)) ? _vmSnap.transcript : []).map(r => String(r.text || '').toLowerCase());
    const findCount = !findQuery ? 'scope: ' + state.findScope + ' — click a lens to move it' : (FSTREAM ? _evTexts.filter(t => t.includes(findQuery)).length + ' matching events · scope: stream' : _rowTexts.filter(t => t.includes(findQuery)).length + ' matching lines · scope: transcript');
    // When each event happened: time since the session's first event, from the record's own `t`
    // (reveal/timeline.ts). This replaced a table copied from the prototype's sample record,
    // which put every real event at "t+0.0s" or "t+2s".
    const _eventTimes = eventTimes(envelopes);
    const formatElapsedTimeForSeq = (seq) => {
      const time = _eventTimes.get(seq);
      return time ? formatElapsed(time.sinceStart) : '';
    };
    // LOW = runtime plumbing, hidden in `app`. Derived from envelopeKindColor by the
    // color rule: any envelope colored #62676f is plumbing. Kept as an
    // explicit set so a stray color change cannot silently move an
    // envelope into or out of the app view.
    const LOW = {
      TriggerFired: 1, ProducerStarted: 1, ProducerCompleted: 1,
      RunStarted: 1, RunFinalised: 1, TerminationMatched: 1,
      SessionStarted: 1, PromptFragment: 1, PromptComposed: 1,
      LanguageProfile: 1, LanguageDrift: 1,
    };
    const shownEV = state.level === RevealLevel.App ? envelopes.filter(e => !LOW[e.kind]) : envelopes;
    const selE = envelopes.find(e => e.seq === state.sel);
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
    // lanes: one per producer KIND (fixed width). A lane's bars are SPANS — a tool span runs
    // ToolCall → ToolResult; the model span runs its ProducerStarted → FinalAnswer; park spans
    // TriggerFired → Park. Concurrent spans of one kind pack into sub-tracks that appear ONLY
    // when real overlap exists, so the graph never widens for a merely long run.
    // Three lifelines per UML sequence diagram (Booch/Rumbaugh/Jacobson):
    // model (durable, left), delegate (middle), external (right).
    // Every envelope is either a message between two lifelines or a
    // moment on one. See DESIGN-DECISIONS D73.
    // (right). The model is the session's durable participant — one
    // continuous span from the first envelope to SessionEnded (or to
    // the last envelope for a live session). Every OTHER producer is
    // a delegation from the model: session_started, first_message,
    // session_prompt, interrupt_fragment, the tool_loop tools, return,
    // session_end — each renders as
    // a span in the delegation lane from its ProducerStarted to its
    // matching ProducerCompleted (paired by producer instance). Park
    // rides its own lane so the return-to-idle beat reads cleanly.
    const _lastSeq = envelopes.length ? envelopes[envelopes.length - 1].seq : 0;
    const _firstSeq = envelopes.length ? envelopes[0].seq : 0;
    // One model span per stretch the session was open: each SessionEnded closes one, the next
    // envelope (a resume) opens the next. A single span to the FIRST SessionEnded left a
    // resumed session's model lane empty from its first end on (2026-10-09).
    const spansByKind = { model: [], delegation: [], external: [] };
    let _modelOpen = envelopes.length ? _firstSeq : null;
    for (const x of envelopes) {
      if (_modelOpen === null) _modelOpen = x.seq;
      if (x.kind === EnvelopeKind.SessionEnded) {
        spansByKind.model.push({ start: _modelOpen, end: x.seq, color: '#3d5166', bright: '#82a5c8' });
        _modelOpen = null;
      }
    }
    if (_modelOpen !== null) {
      spansByKind.model.push({ start: _modelOpen, end: _lastSeq, color: '#3d5166', bright: '#82a5c8' });
    }
    const _calls = {};
    const _producerStarts = {}; // instance → {seq, kind} — non-park only
    // Park is a wait-shape on the External lifeline, not a producer
    // activation. It opens at TriggerFired(starts=park) and closes at
    // the next UserMessage — same round trip shape as ToolCall →
    // ToolResult on the Delegate lifeline.
    let _parkOpen = null;
    envelopes.forEach(e => {
      if (e.kind === 'ProducerStarted' && e.producerInstance && e.payload && e.payload.kind && !_isReturnProducer(e.payload.kind)) {
        _producerStarts[e.producerInstance] = { seq: e.seq, kind: e.payload.kind };
      }
      if (e.kind === 'ProducerCompleted' && e.producerInstance && _producerStarts[e.producerInstance]) {
        const started = _producerStarts[e.producerInstance];
        delete _producerStarts[e.producerInstance];
        if (started.kind === 'model') return; // model owns its own lane
        // Scaffolding producers (session_started, prompt_composer, …)
        // are runtime plumbing under the color rule.
        spansByKind.delegation.push({
          start: started.seq, end: e.seq,
          color: '#4d6b6e', bright: '#7fb3b8', kind: started.kind,
        });
      }
      if (e.kind === 'TriggerFired' && e.payload && _isReturnProducer(e.payload.starts) && _parkOpen === null) {
        _parkOpen = e.seq;
      }
      if (e.kind === EnvelopeKind.UserMessage && _parkOpen !== null) {
        spansByKind.external.push({ start: _parkOpen, end: e.seq, color: '#3d5166', bright: '#82a5c8', kind: 'park' });
        _parkOpen = null;
      }
      if (e.kind === EnvelopeKind.ToolCall) _calls[e.payload.call_id] = { start: e.seq, tool: e.payload.tool };
      if (e.kind === EnvelopeKind.ToolResult) {
        const c = _calls[e.payload.call_id];
        if (c) spansByKind.delegation.push({
          start: c.start, end: e.seq,
          color: c.tool === 'delegate' ? '#665f7d' : '#4d6b6e',
          bright: c.tool === 'delegate' ? '#a08fc9' : '#7fb3b8',
          kind: c.tool || 'tool',
        });
      }
    });
    // Live delegation producers still open — leading edge to last seq.
    // Park deliberately excluded: an unterminated park stays a dot,
    // not a bar smeared across the rest of the session.
    for (const inst of Object.keys(_producerStarts)) {
      const st = _producerStarts[inst];
      if (st.kind === 'model') continue;
      spansByKind.delegation.push({ start: st.seq, end: _lastSeq, color: '#4d6b6e', bright: '#7fb3b8', kind: st.kind });
    }
    if (_parkOpen !== null) {
      spansByKind.external.push({ start: _parkOpen, end: _parkOpen, color: '#3d5166', bright: '#82a5c8', kind: 'park' });
    }
    // Fixed three-lifeline shape: model / delegate / external. No
    // sub-track packing — overlapping spans stack in the same lane
    // cell. Sub-track expansion under real concurrency remains a
    // design option (D29) but the daily-driver session topology
    // reads cleaner without it.
    // UI sprint 155: app view hides plumbing rows, not spans; a row it keeps draws its lanes as
    // all view does, so a user message inside a producer span keeps its delegate cell.
    const laneDefs = [
      { kind: 'model', label: 'model' },
      { kind: 'delegation', label: 'delegate' },
      { kind: 'external', label: 'external' },
    ].map(ld => ({
      ...ld,
      spans: (spansByKind[ld.kind] || []).slice().sort((a, b) => a.start - b.start),
    }));
    const kindOf = (e) => {
      // Three lifelines: model / delegate / external. Every envelope
      // belongs to one. A row's "own kind" decides which lane cell
      // renders bright.
      const pkind = (e.payload && e.payload.kind) || '';
      if (_isReturnProducer(pkind) || _isTurnEnd(e.kind)) return 'external';
      if (e.kind === EnvelopeKind.UserMessage) return 'external';
      if (e.kind === EnvelopeKind.ToolCall || e.kind === EnvelopeKind.ToolResult) return 'delegation';
      if (pkind && pkind !== 'model') return 'delegation';
      if (e.kind === 'TriggerFired') {
        const starts = e.payload && e.payload.starts;
        if (_isReturnProducer(starts)) return 'external';
        if (starts && starts !== 'model') return 'delegation';
      }
      return 'model';
    };
    // message connectors (sequence-diagram arrows): ToolCall = model→tool, ToolResult = tool→model,
    // TriggerFired / UserMessage = runtime stub into the lane it starts.
    const laneIdx = {}; laneDefs.forEach((ld, i) => { if (laneIdx[ld.kind] === undefined) laneIdx[ld.kind] = i; });
    const cx = (i) => i * 12 + 4;
    // Which UserMessage seqs close an open park? Precomputed so the
    // return arrow can render on that row.
    const _closesPark = new Set(spansByKind.external.map(sp => sp.end).filter(s => s !== undefined));
    const connFor = (e) => {
      // ToolCall = model → delegation. Dot lands on the delegation lane.
      if (e.kind === EnvelopeKind.ToolCall) {
        const a = cx(laneIdx.model), b = cx(laneIdx.delegation);
        return { c: e.payload.tool === 'delegate' ? '#a08fc9' : '#7fb3b8', l: Math.min(a, b), w: Math.abs(b - a), dot: b };
      }
      // ToolResult = delegation → model return.
      if (e.kind === EnvelopeKind.ToolResult) {
        const a = cx(laneIdx.delegation), b = cx(laneIdx.model);
        return { c: '#7fb3b8', l: Math.min(a, b), w: Math.abs(b - a), dot: b };
      }
      // TriggerFired(starts=park) = model → park (tool_loop shape).
      // Every other TriggerFired keeps the runtime-stub arrow.
      if (e.kind === 'TriggerFired') {
        const starts = e.payload && e.payload.starts;
        if (_isReturnProducer(starts)) {
          const a = cx(laneIdx.model), b = cx(laneIdx.external);
          return { c: '#82a5c8', l: Math.min(a, b), w: Math.abs(b - a), dot: b };
        }
        const laneName = (starts && starts !== 'model') ? 'delegation' : 'model';
        const b = cx(laneIdx[laneName]);
        return { c: '#c9a0b8', l: 0, w: b, dot: b };
      }
      // UserMessage closing a park = park → model return arrow.
      // A UserMessage with no open park is the user → model stub.
      if (e.kind === EnvelopeKind.UserMessage) {
        if (_closesPark.has(e.seq)) {
          const a = cx(laneIdx.external), b = cx(laneIdx.model);
          return { c: '#82a5c8', l: Math.min(a, b), w: Math.abs(b - a), dot: b };
        }
        const b = cx(laneIdx.model);
        return { c: '#88b0d0', l: 0, w: b, dot: b };
      }
      // ProducerCompleted for a non-model producer = delegation → model
      // return arrow. Model's own ProducerCompleted stays a lifeline dot.
      if (e.kind === 'ProducerCompleted') {
        const pkind = (e.payload && e.payload.kind) || '';
        if (pkind && pkind !== 'model' && !_isReturnProducer(pkind)) {
          const a = cx(laneIdx.delegation), b = cx(laneIdx.model);
          return { c: '#7fb3b8', l: Math.min(a, b), w: Math.abs(b - a), dot: b };
        }
        const b = cx(laneIdx.model);
        return { c: '#82a5c8', l: b, w: 0, dot: b };
      }
      // FinalAnswer, SessionEnded = moments on the model lifeline.
      if (e.kind === EnvelopeKind.FinalAnswer || e.kind === EnvelopeKind.SessionEnded) {
        const b = cx(laneIdx.model);
        return { c: '#82a5c8', l: 0, w: b, dot: b };
      }
      // Park envelope = the await moment inside the open park span.
      // Dot only, no line — the arrow lives on TriggerFired and on the
      // UserMessage that closes it.
      if (_isTurnEnd(e.kind)) {
        const b = cx(laneIdx.external);
        return { c: '#82a5c8', l: b, w: 0, dot: b };
      }
      return null;
    };
    const events = shownEV.map(e => {
      const ownKind = kindOf(e);
      const conn = connFor(e);
      return {
        hasConn: !!conn, connL: conn ? conn.l : 0, connW: conn ? Math.max(conn.w, 2) : 0, connC: conn ? conn.c : 'transparent', dotL: conn ? conn.dot : 0,
        seq: e.seq, t: formatElapsedTimeForSeq(e.seq), kind: e.kind, pl: e.prod + ' · ' + e.gist, kindColor: envelopeKindColor[e.kind] || '#9aa0a8',
        rowOp: (FSTREAM && findQuery) ? ((e.kind + ' ' + e.prod + ' ' + e.gist).toLowerCase().includes(findQuery) ? 1 : 0.3) : 1,
        sel: e.seq === state.sel, rowBg: e.seq === state.sel ? '#2e3138' : ((FSTREAM && findQuery && (e.kind + ' ' + e.prod + ' ' + e.gist).toLowerCase().includes(findQuery)) ? '#26292e' : 'transparent'),
        laneCells: laneDefs.map(ld => {
          const sp = ld.spans.find(s => s.start <= e.seq && e.seq <= s.end);
          return { bg: sp ? (ld.kind === ownKind ? sp.bright : sp.color) : 'transparent' };
        }),
        pick: () => this.setState(s => ({ sel: s.sel === e.seq ? null : e.seq })),
      };
    });
    const laneW = laneDefs.length * 12 - 4;
    const laneLegend = laneDefs.map(ld => ({ label: ld.label, color: ld.kind === 'tool' ? '#7fb3b8' : '#82a5c8' }));
    // Side (horizontal) graph — each producer kind gets one row and
    // its spans plot along a normalized seq axis (firstSeq = first seq,
    // lastSeq = last seq of the visible envelopes). Real spans only —
    // pulls straight from `spansByKind` above so the down and side
    // views show the same data at different orientations.
    const firstSeq = envelopes.length ? envelopes[0].seq : 0;
    const lastSeq = envelopes.length ? Math.max(envelopes[envelopes.length - 1].seq, firstSeq + 1) : 1;
    const pct = (x) => (((x - firstSeq) / (lastSeq - firstSeq)) * 100).toFixed(1) + '%';
    const segOf = (s0, s1, base, seq) => ({
      l: pct(s0),
      w: (((s1 - s0) / (lastSeq - firstSeq)) * 100).toFixed(1) + '%',
      title: 'seq ' + seq + ' — click to inspect',
      bg: state.sel === seq ? '#9db8d6' : base,
      pick: () => this.setState(st => ({ sel: st.sel === seq ? null : seq })),
    });
    // Side (horizontal Gantt) graph per D23: "one lane per producer,
    // spans from ToolCall→ToolResult seqs". Read as: one lane per
    // unique tool name (labelled `grep`, `read_file`, etc.), one lane
    // per delegate child (labelled `⑂ <name>`), plus the model span
    // and any park events. Every row is a real segment; no hardcoded
    // demo seqs.
    const _sideLanes = [];
    if (spansByKind.model.length) {
      _sideLanes.push({
        label: 'model', color: '#82a5c8',
        segs: spansByKind.model.map(sp => segOf(sp.start, sp.end + 0.6, sp.bright, sp.start)),
      });
    }
    const _toolsByName = new Map();
    envelopes.forEach(e => {
      if (e.kind === EnvelopeKind.ToolResult) {
        const c = _calls[e.payload.call_id];
        if (!c) return;
        const name = c.tool || 'tool';
        const list = _toolsByName.get(name) || [];
        list.push({ start: c.start, end: e.seq, delegate: c.tool === 'delegate' });
        _toolsByName.set(name, list);
      }
    });
    for (const [name, spans] of _toolsByName) {
      const isDelegate = name === 'delegate';
      _sideLanes.push({
        label: isDelegate ? '⑂ delegate' : name,
        color: isDelegate ? '#a08fc9' : '#7fb3b8',
        segs: spans.map(sp => segOf(sp.start, sp.end + 0.6, isDelegate ? '#665f7d' : '#4d6b6e', sp.start)),
      });
    }
    const _parkSeqs = envelopes.filter(e => _isTurnEnd(e.kind)).map(e => e.seq);
    if (_parkSeqs.length) {
      _sideLanes.push({
        label: 'returned', color: '#82a5c8',
        segs: _parkSeqs.map(seq => segOf(Math.max(0, seq - 0.5), seq + 0.6, '#82a5c8', seq)),
      });
    }
    const sideLanes = _sideLanes;
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
    // The assay surface reads the controller's assay listing once
    // loadAssays lands (deferred until substrate exposes the projection
    // per plan Phase 4-open). Until then it renders empty.
    const arms = [];
    // Presentation-Model bindings — Phase 4. Every field here reads
    // from `state.controllerSnapshot` which reveal.ts refreshes on every
    // controller change. `scriptedOn` inverts `liveOn` so the demo
    // narrative fades out the moment a real session is bound.
    // (`_vmSnap` is hoisted at the top of renderVals.)
    // Records surface: group live sessions by workspace path. Every
    // recentWorkspaces row gets a group; sessions the controller has
    // seen slot in under their workspace.
    const _SESSIONS_PER_WORKSPACE = 8;
    const _liveSessionsForGroups = (state.liveSessionsFromServer || [])
      .slice()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    // The server's fallback recent-workspaces list contains a row per
    // isolated session sandbox (path matches .substrate/sessions/<id>/workspace).
    // Those are not user-level workspaces; collapse them under a single
    // "isolated sessions" bucket instead of showing 200 near-identical
    // rows.
    // Sandbox = any workspace path that is not a user-level directory.
    // Matches: .substrate/sessions/<id>/workspace, pytest temp dirs
    // under /var/folders or /tmp, and substrate-walkthrough-<hash>
    // fixtures. Real workspaces (user's git repos, ~/.substrate/sandbox)
    // stay as top-level rows.
    const _isSandbox = (path) => {
      if (typeof path !== 'string') return false;
      if (/\.substrate\/sessions\/[^/]+\/workspace$/.test(path)) return true;
      if (/^\/var\/folders\//.test(path)) return true;
      if (/^\/tmp\//.test(path)) return true;
      if (/substrate-walkthrough-/.test(path)) return true;
      if (/substrate-harness-/.test(path)) return true;
      return false;
    };
    const _workspacesRaw = (state.recentWorkspaces || []);
    const _workspaces = _workspacesRaw.filter(ws => !_isSandbox(ws.path));
    const _sessionsByWorkspace = new Map();
    for (const row of _liveSessionsForGroups) {
      const key = row.workspacePath || row.workspace || '(unknown)';
      const list = _sessionsByWorkspace.get(key) || [];
      list.push(row);
      _sessionsByWorkspace.set(key, list);
    }
    const _labelStatus = (row) => sessionStatusLook(row.status).label;
    const _dotFor = (row) => sessionStatusLook(row.status).dot;
    const _relTime = (unixSeconds) => {
      if (!unixSeconds || typeof unixSeconds !== 'number') return '';
      const seconds = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
      if (seconds < 60) return `${seconds}s ago`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 14) return `${days}d ago`;
      const weeks = Math.floor(days / 7);
      return `${weeks}w ago`;
    };
    const _mapSession = (r) => ({
      name: r.name || (r.sessionId || '').slice(0, 12),
      driver: r.driver || '?',
      statusLabel: _labelStatus(r),
      dotColor: _dotFor(r),
      sessionIdShort: (r.sessionId || '').slice(0, 12),
      when: _relTime(r.createdAt),
      pick: () => {
        const vm = window.__vm;
        if (!vm || !r.sessionId) return;
        // Mark the focused pane bound before attach so the terminal
        // template renders the transcript branch instead of the
        // workspace picker. Uses the record's own workspace path +
        // shape so the header labels match the loaded session.
        const wsPath = (typeof r.workspacePath === 'string' && r.workspacePath) ? r.workspacePath : '';
        const wsShape = (typeof r.workspaceShape === 'string' && r.workspaceShape) ? r.workspaceShape : 'flat';
        this.setState(s => ({
          surface: null,
          panes: s.panes.map(pn => pn.id === s.focused
            ? Object.assign({}, pn, { unbound: false, ws: wsPath, shape: wsShape, name: r.name || pn.name, lines: [] })
            : pn),
        }));
        vm.attachExisting(r.sessionId);
      },
    });
    // Sprint 086 — collapsible workspaces with paginated session lists.
    // The initial preview shows session count only; expanding fires a
    // paginated fetch (loadSessionsByWorkspace) and renders the paged
    // rows in a scrollable container. Load-more appends the next page.
    const _pagedByWs = state.pagedByWs || {};
    const _expandedWs = state.expandedWs || {};
    const _toggleExpand = (path) => {
      this.setState(s => ({ expandedWs: Object.assign({}, s.expandedWs, { [path]: !(s.expandedWs || {})[path] }) }));
      // On expand: fetch first page unless already fetched.
      if (!_expandedWs[path]) {
        const vm = window.__vm;
        if (vm && typeof vm.loadSessionsByWorkspace === 'function' && !_pagedByWs[path]) {
          vm.loadSessionsByWorkspace(path, 0, 50).then((r) => {
            this.setState(s => ({ pagedByWs: Object.assign({}, s.pagedByWs, { [path]: { rows: r.rows, total: r.total } }) }));
          }).catch(() => undefined);
        }
      }
    };
    const _loadMoreForWs = (path) => {
      const vm = window.__vm;
      if (!vm || typeof vm.loadSessionsByWorkspace !== 'function') return;
      const current = (_pagedByWs[path] && _pagedByWs[path].rows) || [];
      vm.loadSessionsByWorkspace(path, current.length, 50).then((r) => {
        this.setState(s => {
          const prev = (s.pagedByWs || {})[path] || { rows: [], total: r.total };
          return { pagedByWs: Object.assign({}, s.pagedByWs, { [path]: { rows: [...prev.rows, ...r.rows], total: r.total } }) };
        });
      }).catch(() => undefined);
    };
    // Sprint 086b — canonicalize on the client side too. The map key
    // above uses whatever form the server stored on the session; the
    // recent-workspaces list uses canonical form. Group by canonical
    // path so tilde/absolute variants collapse.
    const _perSessionSandboxRe = /\.substrate\/sessions\/[^/]+\/workspace$/;
    const _countByCanonical = new Map();
    for (const [rawPath, rows] of _sessionsByWorkspace) {
      // Per-session sandbox sessions all collect under the synthesized
      // sessions-root workspace (server _recent_workspaces adds that
      // row); every other session groups under its canonical directory.
      const isSessionSandbox = typeof rawPath === 'string' && _perSessionSandboxRe.test(rawPath);
      const key = isSessionSandbox ? '__PER_SESSION_SANDBOXES__' : rawPath;
      const prev = _countByCanonical.get(key) || 0;
      _countByCanonical.set(key, prev + rows.length);
    }
    const _perSessionSandboxRoot = (_workspaces.find(w => w.shape === 'per-session-sandboxes') || {}).path;
    const _workspaceGroups = [];
    const _recordsFlat = [];
    const _recordsSel = state.recordsSel || 0;
    for (const ws of _workspaces) {
      const isPerSessionRoot = ws.shape === 'per-session-sandboxes';
      const countKey = isPerSessionRoot ? '__PER_SESSION_SANDBOXES__' : ws.path;
      const totalInMemory = _countByCanonical.get(countKey) || 0;
      const paged = _pagedByWs[ws.path];
      const expanded = !!_expandedWs[ws.path];
      const shownRows = expanded && paged ? paged.rows : [];
      const total = paged ? paged.total : totalInMemory;
      const _rowNav = _recordsFlat.length;
      _recordsFlat.push({ pick: () => _toggleExpand(ws.path), toggle: () => _toggleExpand(ws.path), expandable: true, expanded, parent: null });
      const _sessions = shownRows.map((r) => {
        const m = _mapSession(r);
        const nav = _recordsFlat.length;
        _recordsFlat.push({ pick: m.pick, toggle: null, expandable: false, expanded: false, parent: _rowNav });
        return Object.assign(m, { litAttr: nav === _recordsSel ? '1' : '0', bg: nav === _recordsSel ? '#2e3138' : 'transparent' });
      });
      _workspaceGroups.push({
        path: ws.path,
        litAttr: _rowNav === _recordsSel ? '1' : '0', bg: _rowNav === _recordsSel ? '#2e3138' : 'transparent',
        // UI sprint 154: sessions do not get worktrees (no caller of _session_worktree), so a git
        // folder reads only "git".
        shapeLabel: ws.shape === 'worktree' ? 'git'
          : ws.shape === 'sandbox' ? 'sandbox'
          : ws.shape === 'per-session-sandboxes' ? 'per-session sandboxes · substrate-managed'
          : ws.shape,
        sessions: _sessions,
        countLabel: total === 1 ? '1 session' : `${total} sessions`,
        expanded, notExpanded: !expanded, chevron: expanded ? '▾' : '▸',
        toggleExpand: () => _toggleExpand(ws.path),
        hasMore: !!(expanded && paged && paged.rows.length < paged.total),
        loadMore: () => _loadMoreForWs(ws.path),
        loadMoreOnScroll: (ev) => {
          if (!expanded || !paged || paged.rows.length >= paged.total) return;
          const el = ev.target;
          if (!el || typeof el.scrollTop !== 'number') return;
          const remaining = el.scrollHeight - (el.scrollTop + el.clientHeight);
          if (remaining < 100) _loadMoreForWs(ws.path);
        },
        remainingLabel: paged ? `load next ${Math.min(50, Math.max(0, paged.total - paged.rows.length))}` : '',
      });
    }
    this._recordsFlat = _recordsFlat;
    void _perSessionSandboxRoot; // available for future use
    // Everything else lands under "isolated sessions" — most sessions
    // in a fresh install run in a per-session sandbox and belong here.
    // Sessions whose workspace path is neither a recent workspace nor
    // an isolated sandbox share this bucket too.
    // Sprint 086b — no isolated-sessions bucket. Server's
    // _recent_workspaces already synthesizes a `~/.substrate/sessions/`
    // row that collapses every per-session sandbox under one
    // paginated entry, so per-session sandbox sessions surface via
    // the by-workspace endpoint with `path=<sessions_root>` — the
    // same load-more code path every real workspace uses.
    return {
      workspaceGroups: _workspaceGroups,
      workspaceGroupsEmpty: _workspaceGroups.length === 0,
      // Sprint 086 — "Add workspace" button opens the OS folder picker
      // via Electron's native.pickFolder(); the picked path POSTs to
      // /api/workspaces and the reload reflects it in the records list.
      // In a plain browser tab window.native is undefined; the button
      // hides via addWorkspaceAvailable.
      addWorkspaceAvailable: !!(window.native && typeof window.native.pickFolder === 'function'),
      addWorkspaceBusy: !!state.addWsBusy,
      addWorkspace: async () => {
        const native = window.native;
        if (!native || typeof native.pickFolder !== 'function') return;
        this.setState({ addWsBusy: true });
        try {
          const picked = await native.pickFolder();
          if (picked) {
            const vm = window.__vm;
            if (vm && typeof vm.addWorkspace === 'function') {
              await vm.addWorkspace(picked);
              // Refresh live sessions so the new workspace's row picks
              // up any pre-existing sessions in it.
              if (typeof vm.loadLiveSessions === 'function') vm.loadLiveSessions().catch(() => undefined);
            }
          }
        } finally {
          this.setState({ addWsBusy: false });
        }
      },
      // UI sprint 138: every primitive of the record's topology in its own section, each heading
      // defined on hover (STRUCTURE_DEFS). Events lead: what emits each kind, and what it fires.
      ...(() => {
        const g = (_vmSnap && _vmSnap.topologyGraph) || null;
        const producers = g ? g.producers : [];
        const triggers = g ? g.triggers : [];
        const outside = new Set(g && g.outside ? g.outside : []);
        // b.instrument registers a trigger named after the producer it starts (kernel/topology.py).
        const instruments = new Set(triggers.filter(t => t.id === t.starts).map(t => t.starts));
        const kinds = new Set();
        producers.forEach(p => p.emits.forEach(k => kinds.add(k)));
        triggers.forEach(t => (t.on || []).forEach(k => kinds.add(k)));
        outside.forEach(k => kinds.add(k));
        const lifecycle = (k) => String(k).startsWith('substrate.');
        const order = [...kinds].sort((a, b) => (lifecycle(a) === lifecycle(b) ? (a < b ? -1 : a > b ? 1 : 0) : lifecycle(a) ? 1 : -1));
        const list = (xs) => xs.map(x => ({ name: x }));
        // a break point after `substrate.` for display only, so a narrow panel never splits a word.
        const label = (k) => String(k).replace(/^substrate\./, 'substrate.\u200b');
        const kindList = (xs) => xs.map(x => ({ name: x, label: label(x) }));
        const baseline = g && g.baseline ? g.baseline : {};
        const config = g && g.config ? g.config : {};
        return {
          topoDefs: STRUCTURE_DEFS,
          topoEventRows: order.map(k => {
            const by = producers.filter(p => p.emits.includes(k)).map(p => p.kind);
            if (lifecycle(k)) by.push('runtime');
            if (outside.has(k)) by.push('outside');
            const fires = triggers.filter(t => (t.on || []).includes(k)).map(t => t.id);
            return { name: k, label: label(k), by: list(by), fires: list(fires.length ? fires : ['—']) };
          }),
          topoEventCount: order.length,
          topoProducerRows: producers.map(p => ({
            name: p.kind,
            emits: (p.emits && p.emits.length ? p.emits.join(', ') : '—'),
            initialTag: p.initial ? 'initial' : '',
            instrumentTag: instruments.has(p.kind) ? 'instrument' : '',
            detTag: p.deterministic ? 'deterministic' : '',
          })),
          topoTriggerRows: triggers.map(t => ({
            id: t.id, onKind: t.onKind, starts: t.starts, policy: t.policy || '—',
            onKinds: kindList(t.on && t.on.length ? t.on : String(t.onKind || '').split(', ').filter(Boolean)),
          })),
          topoRouteRows: (g && g.routes ? g.routes : []).map(r => ({ id: r.id, slot: r.slot })),
          topoRouteCount: g && g.routes ? g.routes.length : 0,
          topoRoutesNone: !(g && g.routes && g.routes.length),
          topoRoutesAny: !!(g && g.routes && g.routes.length),
          topoViewRows: list(g && g.views ? g.views : []),
          topoViewCount: g && g.views ? g.views.length : 0,
          topoTermination: (g && g.termination ? g.termination : []).join(' · ') || '—',
          topoRunRows: [
            { k: 'vocab version', v: String(config.vocab_version ?? '—') },
            { k: 'exports', v: g && g.exports && g.exports.length ? g.exports.join(', ') : 'none' },
            ...Object.keys(baseline).sort().map(k => ({ k: 'baseline · ' + k, v: baselineText(k, baseline[k]) })),
          ],
          topoProducerCount: producers.length,
          topoTriggerCount: triggers.length,
          topoAny: producers.length > 0,
          topoEmpty: producers.length === 0,
        };
      })(),
      assaysEmpty: arms.length === 0,
      assaysAny: arms.length > 0,
      // Reveal view transcript reads the SAME rich rows the per-pane
      // terminal view reads. _liveBindingsFor already computes tool
      // cards, Markdown blocks, opacity from find, running seconds —
      // reuse it here for the focused pane so both views stay in sync.
      ...this._liveBindingsFor(fp.id, state),
      crumb: ((title) => surf === Surface.Records ? title + ' › records' : surf === Surface.Assay ? title + ' › assays' : surf === Surface.Studio ? title + ' › studio' : title)(this._paneTitle(state, fp)),
      escHint: surf ? 'esc — back' : '',
      openRecords: () => this._toggleSurface('records'),
      openStudio: () => this._toggleSurface('studio'),
      openAssay: () => this.setState({ surface: Surface.Assay }),
      backToSession: () => this.setState({ surface: null }),
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
      studioColor: surf === Surface.Studio ? '#e2e5e9' : '#9aa0a8',
      showTerminal: !surf && !state.revealed, showRevealed: !surf && state.revealed,
      showRecords: surf === Surface.Records, showAssay: surf === Surface.Assay, showStudio: surf === Surface.Studio,
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
      fontSize: state.fontOverride ?? this.props.transcriptFontSize ?? 13,
      // Reveal view's single-pane prompt row (reveal.html:345). Bound
      // to the focused pane's pv, so the same field the terminal-view
      // pane input mutates is what the reveal-view input shows.
      promptVal: (fp && fp.pv) || '',
      inputHint: fp ? this._inputHint(state, fp.id) : INPUT_HINT,
      // UI sprint 158: the stream follows the bottom until scrolled up, as the transcript does.
      streamRef: (el) => { this._streamEl = el; if (el) followBottom(el); },
      // Transcript scroll used to live here (Sprint 076 retired
      // the pane's dc-runtime scroll ref / onScroll bindings). The
      // atom transcript React tree at web/reveal/transcript/ owns
      // scroll position now; the reveal.html template no longer
      // emits any ref/onScroll on the transcript scroller.
      graphRef: (el) => { this._graphEl = el; },
      onStreamScroll: (ev) => {
        if (this._syncing || this.state.dir !== 'side') return;
        const el = ev.target, g = this._graphEl; if (!g) return;
        const f = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
        this._syncing = true; g.scrollLeft = f * Math.max(0, g.scrollWidth - g.clientWidth);
        requestAnimationFrame(() => { this._syncing = false; });
      },
      onGraphScroll: (ev) => {
        if (this._syncing) return;
        const el = ev.target, s = this._streamEl; if (!s) return;
        const f = el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth);
        this._syncing = true; s.scrollTop = f * Math.max(0, s.scrollHeight - s.clientHeight);
        requestAnimationFrame(() => { this._syncing = false; });
      },
      events, modeChips, sideLanes, laneDefs, laneW, laneLegend,
      sideAxisA: firstSeq, sideAxisB: lastSeq,
      isStream: state.mode === GraphMode.Stream, isIo: state.mode === GraphMode.IO, isStructure: state.mode === GraphMode.Structure, isScene: state.mode === GraphMode.Scene,
      isLanguage: state.mode === GraphMode.Language, lang: _lang, langRows, langStreams, langViews, langHas: _lang.has, langEmpty: !_lang.has, langNote: !!_lang.note,
      isDown: state.dir === GraphDirection.Down, isSide: state.dir === GraphDirection.Side,
      setAll: () => this.setState({ level: RevealLevel.All }), setApp: () => this.setState({ level: RevealLevel.App }),
      allColor: state.level === RevealLevel.All ? '#d7dade' : '#62676f', allBg: state.level === RevealLevel.All ? '#2e3138' : 'transparent',
      appColor: state.level === RevealLevel.App ? '#d7dade' : '#62676f', appBg: state.level === RevealLevel.App ? '#2e3138' : 'transparent',
      setDown: () => this.setState({ dir: GraphDirection.Down }), setSide: () => this.setState({ dir: GraphDirection.Side }),
      downColor: state.dir === GraphDirection.Down ? '#d7dade' : '#62676f', downBg: state.dir === GraphDirection.Down ? '#2e3138' : 'transparent',
      sideColor: state.dir === GraphDirection.Side ? '#d7dade' : '#62676f', sideBg: state.dir === GraphDirection.Side ? '#2e3138' : 'transparent',
      selSeq: selE ? selE.seq : 0, selKind: selE ? selE.kind : '', selSchema: selE ? selE.schema : '',
      selTime: selE ? describeEventTime(_eventTimes.get(selE.seq)) : '', selProducer: selE ? selE.prod : '',
      selColor: selE ? (envelopeKindColor[selE.kind] || '#9aa0a8') : '#9aa0a8',
      selContent: selE ? selE.content : [], selPayload: selE ? JSON.stringify(selE.payload, null, 1) : '',
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
      arms,
      topoName: state.topoName, updTopoName: (ev) => this.setState({ topoName: ev.target.value }),
      prodRows: state.prods.map((p, i) => ({
        name: p.name, emits: p.emits, updName: this._upd('prods', i, 'name'), updEmits: this._upd('prods', i, 'emits'), rm: this._rm('prods', i),
        initBox: p.initial ? '#82a5c8' : 'transparent', initBorder: p.initial ? '#82a5c8' : '#4a4e55',
        toggleInit: () => this.setState(s => ({ prods: s.prods.map((x, j) => j === i ? Object.assign({}, x, { initial: !x.initial }) : x) })),
      })),
      addProd: () => this.setState(s => ({ prods: [...s.prods, { name: 'producer_' + (s.prods.length + 1), initial: false, emits: '' }] })),
      viewRows: state.sviews.map((v, i) => ({ name: v.name, def: v.def, updName: this._upd('sviews', i, 'name'), updDef: this._upd('sviews', i, 'def'), rm: this._rm('sviews', i) })),
      addView: () => this.setState(s => ({ sviews: [...s.sviews, { name: 'view_' + (s.sviews.length + 1), def: 'KindCount(of )' }] })),
      trigRows: state.trigs.map((t, i) => ({ id: t.id, view: t.view, n: t.n, starts: t.starts, updId: this._upd('trigs', i, 'id'), updView: this._upd('trigs', i, 'view'), updN: this._upd('trigs', i, 'n'), updStarts: this._upd('trigs', i, 'starts'), rm: this._rm('trigs', i) })),
      addTrig: () => this.setState(s => ({ trigs: [...s.trigs, { id: 'trigger_' + (s.trigs.length + 1), view: '', op: '≥', n: '1', starts: '' }] })),
      routeRows: state.sroutes.map((r, i) => ({ id: r.id, kind: r.kind, slot: r.slot, updId: this._upd('sroutes', i, 'id'), updKind: this._upd('sroutes', i, 'kind'), updSlot: this._upd('sroutes', i, 'slot'), rm: this._rm('sroutes', i) })),
      addRoute: () => this.setState(s => ({ sroutes: [...s.sroutes, { id: 'route_' + (s.sroutes.length + 1), kind: '', slot: '' }] })),
      termChips: ['quiescence_with_watchdog', 'all_completed', 'threshold_count', 'cancel_all_others', 'any_of', 'all_of'].map(k => ({
        label: k, pick: () => this.setState({ termKind: k }),
        color: state.termKind === k ? '#a08fc9' : '#62676f', bg: state.termKind === k ? '#2e3138' : 'transparent',
      })),
      isThreshold: state.termKind === 'threshold_count',
      termOf: state.termOf, updTermOf: (ev) => this.setState({ termOf: ev.target.value }),
      termN: state.termN, updTermN: (ev) => this.setState({ termN: ev.target.value }),
      respDColor: state.responder === 'deterministic' ? '#d7dade' : '#62676f', respDBg: state.responder === 'deterministic' ? '#2e3138' : 'transparent',
      respOColor: state.responder === 'ollama' ? '#d7dade' : '#62676f', respOBg: state.responder === 'ollama' ? '#2e3138' : 'transparent',
      setRespD: () => this.setState({ responder: 'deterministic' }), setRespO: () => this.setState({ responder: 'ollama' }),
      seed: state.seed, updSeed: (ev) => this.setState({ seed: ev.target.value }),
      model: state.model, updModel: (ev) => this.setState({ model: ev.target.value }),
      isStudioForm: state.studioView === 'form', isStudioCanvas: state.studioView === 'canvas',
      setStudioForm: () => this.setState({ studioView: 'form' }), setStudioCanvas: () => this.setState({ studioView: 'canvas' }),
      sFormColor: state.studioView === 'form' ? '#d7dade' : '#62676f', sFormBg: state.studioView === 'form' ? '#2e3138' : 'transparent',
      sCanvasColor: state.studioView === 'canvas' ? '#d7dade' : '#62676f', sCanvasBg: state.studioView === 'canvas' ? '#2e3138' : 'transparent',
      canvasCards: state.prods.map((p, i) => {
        const pos = state.cardPos[p.name] || { x: 120 + (i % 3) * 260, y: 300 };
        return { name: p.name, emits: p.emits || '—', initial: p.initial, x: pos.x, y: pos.y, border: p.initial ? '#82a5c8' : 'rgba(255,255,255,.12)', dragStart: (ev) => { ev.preventDefault(); this._drag = p.name; } };
      }),
      canvasEdges: (() => {
        const posOf = (n) => { const i = state.prods.findIndex(p => p.name === n); return state.cardPos[n] || { x: 120 + (Math.max(i, 0) % 3) * 260, y: 300 }; };
        const srcOfKind = (k) => { const p = state.prods.find(p => String(p.emits).split(',').map(x => x.trim()).includes(k)); return p ? p.name : null; };
        const edges = []; const labels = [];
        state.trigs.forEach(t => {
          const v = state.sviews.find(v => v.name === t.view); const m = v ? String(v.def).match(/of\s+(\w+)/) : null;
          const src = m ? srcOfKind(m[1]) : null; if (!src || !state.prods.find(p => p.name === t.starts)) return;
          const a = posOf(src), b = posOf(t.starts);
          edges.push({ d: 'M ' + (a.x + 140) + ' ' + (a.y + 26) + ' C ' + (a.x + 210) + ' ' + (a.y + 26) + ' ' + (b.x - 70) + ' ' + (b.y + 26) + ' ' + b.x + ' ' + (b.y + 26), stroke: '#62676f', dash: '' });
          labels.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + 14, fill: '#c9a0b8', text: t.id + ' · ' + t.view + ' ≥ ' + t.n });
        });
        state.sroutes.forEach(r => {
          const src = srcOfKind(r.kind); const tgt = String(r.slot).split('.')[0]; if (!src || !state.prods.find(p => p.name === tgt)) return;
          const a = posOf(src), b = posOf(tgt);
          edges.push({ d: 'M ' + (a.x + 140) + ' ' + (a.y + 10) + ' C ' + (a.x + 240) + ' ' + (a.y - 40) + ' ' + (b.x - 60) + ' ' + (b.y - 30) + ' ' + (b.x + 150) + ' ' + (b.y + 4), stroke: '#a08fc9', dash: '4 3' });
          labels.push({ x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 18, fill: '#a08fc9', text: r.id + ' · ' + r.kind + ' → ' + r.slot });
        });
        return { edges, labels };
      })().edges,
      canvasLabels: (() => {
        const posOf = (n) => { const i = state.prods.findIndex(p => p.name === n); return state.cardPos[n] || { x: 120 + (Math.max(i, 0) % 3) * 260, y: 300 }; };
        const srcOfKind = (k) => { const p = state.prods.find(p => String(p.emits).split(',').map(x => x.trim()).includes(k)); return p ? p.name : null; };
        const labels = [];
        state.trigs.forEach(t => {
          const v = state.sviews.find(v => v.name === t.view); const m = v ? String(v.def).match(/of\s+(\w+)/) : null;
          const src = m ? srcOfKind(m[1]) : null; if (!src || !state.prods.find(p => p.name === t.starts)) return;
          const a = posOf(src), b = posOf(t.starts);
          labels.push({ x: (a.x + b.x) / 2 - 55, y: (a.y + b.y) / 2 + 16, fill: '#c9a0b8', text: t.id + ' · ' + t.view + ' ≥ ' + t.n });
        });
        state.sroutes.forEach(r => {
          const src = srcOfKind(r.kind); const tgt = String(r.slot).split('.')[0]; if (!src || !state.prods.find(p => p.name === tgt)) return;
          const a = posOf(src), b = posOf(tgt);
          labels.push({ x: (a.x + b.x) / 2 - 55, y: Math.max(6, Math.min(a.y, b.y) - 42), fill: '#a08fc9', text: r.id + ' · ' + r.kind + ' → ' + r.slot });
        });
        return labels;
      })(),
      slotNodes: state.sroutes.map(r => { const tgt = String(r.slot).split('.')[0]; const i = state.prods.findIndex(p => p.name === tgt); if (i < 0) return null; const pos = state.cardPos[tgt] || { x: 120 + (i % 3) * 260, y: 300 }; return { slot: String(r.slot).split('.')[1] || r.slot, x: pos.x + 150, y: pos.y - 2 }; }).filter(Boolean),
      doValidate: async () => {
        const errs = this._validate();
        if (errs.length) { this.setState({ studioOut: 'invalid — ' + errs.join(' · '), studioOutColor: '#c26058' }); return; }
        this.setState({ studioOut: 'validating…', studioOutColor: '#62676f' });
        const vm = window.__vm;
        if (!vm || typeof vm.validateSpec !== 'function') { this.setState({ studioOut: 'controller unavailable', studioOutColor: '#c26058' }); return; }
        const r = await vm.validateSpec(this._buildStudioSpec());
        if (r.valid) this.setState({ studioOut: 'ok — builds through the real TopologyBuilder', studioOutColor: '#82a5c8' });
        else this.setState({ studioOut: 'invalid — ' + (r.error || ''), studioOutColor: '#c26058' });
      },
      doBuild: async () => {
        const errs = this._validate();
        if (errs.length) { this.setState({ studioOut: 'build refused — ' + errs.join(' · '), studioOutColor: '#c26058' }); return; }
        this.setState({ studioOut: 'building & launching…', studioOutColor: '#62676f' });
        const vm = window.__vm;
        if (!vm || typeof vm.buildSpec !== 'function') { this.setState({ studioOut: 'controller unavailable', studioOutColor: '#c26058' }); return; }
        const r = await vm.buildSpec(this._buildStudioSpec());
        if (!r.ok) { this.setState({ studioOut: 'build rejected — ' + (r.error || ''), studioOutColor: '#c26058' }); return; }
        const runName = String((r.run && r.run.name) || '');
        const status = String((r.run && r.run.status) || 'unknown');
        this.setState({ studioOut: 'built — ' + runName + ' (' + status + ') ▸', studioOutColor: '#82a5c8' });
      },
      studioOut: state.studioOut, studioOutColor: state.studioOutColor,
      panes, paneCols: state.colW.map(w => w.toFixed(3) + 'fr').join(' '), paneRows: state.rowW.map(w => w.toFixed(3) + 'fr').join(' '), focusedName: fp.name, focusedId: fp.id,
      revealFlexL: state.revealL.toFixed(3) + ' 1 0%',
      revealGutterLeft: (state.revealL / (state.revealL + 1) * 100).toFixed(2) + '%',
      revealGrab: (ev) => { ev.preventDefault(); this._gut = { type: 'reveal' }; },
      colGutters: state.colW.slice(0, -1).map((_, i) => { const total = state.colW.reduce((a, b) => a + b, 0); const left = state.colW.slice(0, i + 1).reduce((a, b) => a + b, 0) / total * 100; return { left: left.toFixed(2) + '%', grab: (ev) => { ev.preventDefault(); this._gut = { type: 'col', i: i + 1 }; } }; }),
      rowGutters: state.rowW.slice(0, -1).map((_, i) => { const total = state.rowW.reduce((a, b) => a + b, 0); const top = state.rowW.slice(0, i + 1).reduce((a, b) => a + b, 0) / total * 100; return { top: top.toFixed(2) + '%', grab: (ev) => { ev.preventDefault(); this._gut = { type: 'row', i: i + 1 }; } }; }), focusedBranch: fp.shape === 'worktree' ? 'substrate/' + (fp.name || 'main') : (fp.ws || ''),
      focusedWorkspace: fp.ws || '~/.substrate/sandbox',
      focusedShape: fp.shape || 'sandbox',

      // The meta view's machinery lens wraps in this gate; every pane has its own controller, so it
      // always shows (the old notMainFocused branch, scripted lines, is gone).
      isMainFocused: true,
      // UI sprint 136: the one top bar shows the focused pane — its status dot, its name (double-click
      // renames it), and its driver and workspace chips in every view but records, assay and studio.
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
        : '⌥ ' + (fp.shape === 'worktree' ? 'substrate/' + (fp.name || 'main') : (fp.ws || 'sandbox')),
      splitRight: () => this._split('right'),
      driverName: (() => {
        const d = this._paneDriver(state, fp) || '';
        const label = this._resolveDriverLabel(state, d);
        // On Auto the chip names the CLI only; the card says why (UI sprint 139).
        return /^auto\b/.test(label.slice(String(d).toLowerCase().length).trim()) ? String(d).toLowerCase() : label;
      })(), driverOpen: state.driverOpen,
      toggleDriverMenu: () => this.setState(s => ({ driverOpen: !s.driverOpen, wsOpen: false })),
      // Sprint 088c — footRecord + footStatus were both prototype
      // literals: `record 01M1684 · 244 events` and ` · clean` are
      // hardcoded, never change with real state. Show only what we
      // actually derive: descend depth when descending; the pane's
      // real session name otherwise; nothing when unbound. Status
      // reads the real live/finalised bit without the "clean" suffix
      // (which had no not-clean branch).
      footRecord: fp.unbound
          ? 'unbound — pick a workspace'
          : fp.name
            ? 'session ' + fp.name
            : '',
      footHint: surf ? 'esc back to session' : '⌘M toggles meta',
      // UI sprint 186: the focused pane's own state (it read '● live' always, from a flag nothing set).
      footStatus: !_hasVmSession ? '' : _vmSnap.endedReason ? '◇ ended' : _vmSnap.connection === 'connected' ? '● live' : '○ ' + String(_vmSnap.connection || ''),
      footStatusColor: _hasVmSession && !_vmSnap.endedReason && _vmSnap.connection === 'connected' ? '#82a5c8' : '#62676f',
      // ── find (19k/19l) ──
      findOpen: state.findOpen, findQ: state.findQ, onFindQ: (ev) => this.setState({ findQ: ev.target.value }), findCount,
      focusTranscript: () => { if (this.state.findScope !== 'transcript') this.setState({ findScope: 'transcript' }); },
      focusStream: () => { if (this.state.findScope !== 'stream') this.setState({ findScope: 'stream' }); },
      closeFind: () => this.setState({ findOpen: false, findQ: '' }),
      // ── dialogs (19c/19f/19g) ──
      showSettings: state.showSettings, closeSettings: () => this.setState({ showSettings: false, settingsNote: '' }),
      themeChips: ['dark', 'light', 'system'].map(t => ({ label: t, color: state.theme === t ? '#e2e5e9' : '#62676f', bg: state.theme === t ? '#2e3138' : 'transparent',
        pick: () => this.setState({ theme: t, settingsNote: t === 'dark' ? '' : 'noted — the light theme ships with the build; the prototype renders dark' }, this._persistSettings) })),
      settingsNote: state.settingsNote,
      fontLabel: (state.fontOverride ?? this.props.transcriptFontSize ?? 13) + 'px',
      fontMinus: () => this.setState(st => ({ fontOverride: Math.max(9, (st.fontOverride ?? this.props.transcriptFontSize ?? 13) - 1) }), this._persistSettings),
      fontPlus: () => this.setState(st => ({ fontOverride: Math.min(19, (st.fontOverride ?? this.props.transcriptFontSize ?? 13) + 1) }), this._persistSettings),
      showExport: state.showExport, closeExport: () => this.setState({ showExport: false }), doExport: () => this.setState({ showExport: false }),
      showEndConfirm: state.showEndConfirm, closeEndConfirm: () => this.setState({ showEndConfirm: false }),
      doEndSession: async () => {
        // D68: a LIVE session (turn in flight) interrupts the turn
        // first, then ends. Connection == 'connected' with a park
        // reason still unset means a turn is running.
        this.setState({ showEndConfirm: false });
        const vm = window.__vm;
        if (!vm) return;
        const snap = vm.snapshot ? vm.snapshot() : null;
        const isLive = !!(snap && snap.sessionId && snap.connection === 'connected' && !snap.parkReason && !snap.endedReason);
        if (isLive && typeof vm.interruptTurn === 'function') {
          try { await vm.interruptTurn(); } catch (_e) { /* proceed to end regardless */ }
        }
        vm.endSession('user_end');
      },
      // ── first run (19m) ──
      // Gates: this.props.firstRun (for the dc-runtime scenario
      // switcher) OR ?firstrun=1 in the URL. `frDone` closes it once
      // the user picks a driver.
      showFirstRun: (() => {
        const propOn = this.props.firstRun ?? false;
        let urlOn = false;
        try { urlOn = /[?&]firstrun=1(?:&|$)/.test(window.location.search); } catch(_e) {}
        return (propOn || urlOn) && !state.frDone;
      })(),
      // Group the real driver roster by provider — the 19m frame's
      // "what the machine actually has" list. Ordering: local ollama
      // (installed) · cloud ollama (:cloud suffix) · CLIs · APIs (grouped
      // by absent env keys) · deterministic floor.
      frRows: (() => {
        const roster = (state.driverRoster || []);
        const def = state.driverDefault || null;
        const cli = (state.controllerSnapshot && Array.isArray(state.controllerSnapshot.cli)) ? state.controllerSnapshot.cli : ['claude', 'gemini'];
        const isCloud = (m) => /:cloud$/.test(m);
        const isCli = (m) => cli.includes(m);
        const local = roster.filter(m => !isCloud(m) && !isCli(m) && m !== 'deterministic');
        const cloud = roster.filter(m => isCloud(m));
        const clis = roster.filter(m => isCli(m));
        const detOn = roster.includes('deterministic') || true;
        const rows = [];
        for (const m of local) rows.push({ name: 'ollama · ' + m, meta: 'localhost:11434 · installed' + (m === def ? ' · preselected' : ''), driver: m, on: true });
        for (const m of cloud) rows.push({ name: 'ollama·cloud · ' + m, meta: (m === def ? 'default · ' : '') + 'cloud model', driver: m, on: true });
        for (const m of clis) rows.push({ name: m + ' (cli)', meta: 'found on PATH', driver: m, on: true });
        if (detOn) rows.push({ name: 'deterministic', meta: 'built in · replay-stable · no network', driver: 'deterministic', on: true });
        return rows.map(r => ({
          name: r.name, meta: r.meta,
          c: r.driver === def ? '#e2e5e9' : (r.on ? '#b9bec5' : '#62676f'),
          bg: r.driver === def ? '#2e3138' : 'transparent',
          key: r.driver === def ? '↵' : '',
          pick: () => {
            this.setState(st => ({
              frDone: true,
              panes: st.panes.map(p => p.id === 1 ? Object.assign({}, p, { driver: r.driver }) : p),
            }));
            const vm = window.__vm;
            if (vm && typeof vm.pickDriver === 'function') vm.pickDriver(r.driver);
          },
        }));
      })(),
    };
  }
}
