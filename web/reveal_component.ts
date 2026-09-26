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
  EnvelopeKind, TranscriptRole, Surface, GraphMode, RevealLevel, GraphDirection,
} from "./vm/kinds";
import { mdBlocks, mdInlines, renderBlock, renderInline } from "./reveal/markdown";


class Component extends DCLogic {
  state = { revealed: false, mode: GraphMode.Stream, dir: GraphDirection.Down, sel: 240, childOpen: false, promptVal: '', surface: null, studioView: 'form', studioOut: 'author a topology, then validate or build.', studioOutColor: '#62676f', level: RevealLevel.All, sent: [], toolOpen: {},
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
    driverName: null, driverOpen: false, wsOpen: false,
    nsOpen: false, nsName: '', nsWorkspace: '~/.substrate/sandbox', nsIsolate: false, nsStatus: '',
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
    focused: 1, cols: 1, rows: 1, colW: [1], rowW: [1], revealL: 1.15, ddFor: null, wsFor: null, allSessions: [], dropHint: null,
    descent: [], descPv: '', descExtra: {}, fanOpen: false, fanSel: 0, findOpen: false, findQ: '', findScope: 'transcript', nestedDescent: false,
    showSettings: false, showExport: false, showEndConfirm: false, ended: false, frDone: false, theme: 'dark', fontOverride: null, settingsNote: '',
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
  _liveActivity(snap) {
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
      activityRestText: activity ? activity.restText : '',
      activityColor: activity ? activity.color : '#62676f',
      activityPulseClass: activity && activity.pulseOn ? 'act-pulse' : '',
    };
  }
  _liveBindingsForRetired(paneId, state) {
    const snap = (state.controllerSnapshots || {})[paneId] || null;
    const transcript = (snap && Array.isArray(snap.transcript)) ? snap.transcript : [];
    const findQ = (state.findOpen && state.findScope === 'transcript' ? (state.findQ || '') : '').toLowerCase();
    const resultByCallId = new Map();
    for (const row of transcript) {
      if (row.kind === EnvelopeKind.ToolResult && row.callId) resultByCallId.set(row.callId, row);
    }
    const toolOpen = state.toolOpen || {};
    const rows = transcript.map(row => {
      let glyph = '·', glyphColor = '#4a4e55', textColor = '#9aa0a8', marginTop = '2px';
      if (row.role === TranscriptRole.User) { glyph = '›'; glyphColor = '#82a5c8'; textColor = '#e2e5e9'; marginTop = '12px'; }
      else if (row.role === TranscriptRole.Model) { glyph = '◆'; glyphColor = '#7fb3b8'; textColor = '#b9bec5'; marginTop = '6px'; }
      else if (row.role === TranscriptRole.Tool) {
        const failed = row.toolOk === false;
        glyph = failed ? '⚠' : '⚙';
        glyphColor = failed ? '#c26058' : '#62676f';
        textColor = failed ? '#c26058' : '#62676f';
      }
      else if (row.role === TranscriptRole.Park) { glyph = '◐'; glyphColor = '#82a5c8'; textColor = '#82a5c8'; marginTop = '10px'; }
      else if (row.role === TranscriptRole.Ended) { glyph = '◇'; glyphColor = '#62676f'; textColor = '#62676f'; marginTop = '10px'; }
      else if (row.role === TranscriptRole.Warning) { glyph = '!'; glyphColor = '#c26058'; textColor = '#c26058'; }
      const text = row.text || '';
      const rawBlocks = row.role === TranscriptRole.Model ? this._mdBlocks(text) : [];
      const blocks = rawBlocks.map(b => this._mdRenderBlock(b));
      const isModel = row.role === TranscriptRole.Model;
      const matches = !findQ || text.toLowerCase().includes(findQ);
      const opacity = findQ ? (matches ? '1' : '.35') : '1';
      // 21a/21b/21c: only ToolCall rows carry the card. A ToolCall
      // with no matching ToolResult is running (◌); with one is done
      // (⚙); a failed result stamps ⚠ onto the CALL row so the arg
      // preview stays legible.
      const isToolCall = row.kind === EnvelopeKind.ToolCall;
      const progressMap = (snap && snap.progressByCallId) || {};
      const progressEntry = (isToolCall && row.callId) ? progressMap[row.callId] : null;
      const streamingShow = !!(progressEntry && progressEntry.text);
      const streamingText = progressEntry ? progressEntry.text : '';
      const streamingEof = !!(progressEntry && progressEntry.eof);
      let toolCardOpen = false, toolGlyph = '', toolPreview = '', toolArgs = [], toolOutput = '', toolError = '', toolCallId = '', toolStep = '', toolBytes = '', toolStatus = '', toolStatusColor = '#62676f', toolRunning = false;
      let descendShow = false, descendPath = '';
      if (isToolCall && row.callId) {
        const paired = resultByCallId.get(row.callId);
        toolRunning = !paired;
        const failed = paired && paired.toolOk === false;
        toolGlyph = toolRunning ? '◌' : failed ? '⚠' : '⚙';
        glyph = toolGlyph;
        glyphColor = toolRunning ? '#7fb3b8' : failed ? '#c26058' : '#62676f';
        textColor = toolRunning ? '#b9bec5' : failed ? '#c26058' : '#9aa0a8';
        toolPreview = (row.args && row.args[0]) ? String(row.args[0]) : '';
        toolArgs = row.args || [];
        // delegate returns {answer, child_root, steps} — a dict. String()
        // over a dict yields "[object Object]"; render the answer text as
        // the card body and expose child_root as a "· descend ⏎"
        // affordance the user clicks to attach the pane's controller to
        // the child record via SessionController.attachRecordRoot (item 4).
        const output = paired ? paired.output : null;
        const isDelegate = row.toolName === 'delegate' && output && typeof output === 'object';
        // Sprint 055: fan-out delegate carries `answers` + `child_roots`
        // (dicts keyed by child name) instead of the single-child
        // `answer` + `child_root` strings. Detect and render as the
        // D72 aggregation shape: one header line + per-child rows.
        const isDelegateFanout = isDelegate && output && output.answers
          && typeof output.answers === 'object' && !Array.isArray(output.answers);
        if (isDelegateFanout) {
          const answers = output.answers || {};
          const roots = output.child_roots || {};
          const failed = output.failed || {};
          const names = Object.keys({ ...answers, ...failed });
          const nSuccess = Object.keys(answers).length;
          const nFailed = Object.keys(failed).length;
          const header = '⑂ delegate → ' + names.length + ' children · '
            + nSuccess + ' answered · ' + nFailed + ' failed';
          const lines = [header, ''];
          for (const name of names) {
            const root = String(roots[name] || '');
            const answer = String(answers[name] || '');
            const fail = failed[name];
            if (fail) {
              lines.push('  ' + name + ' — failed: ' + String(fail.error || fail));
            } else {
              lines.push('  ' + name + ' — ' + (answer.length > 200 ? answer.slice(0, 200) + '…' : answer));
            }
            if (root) lines.push('    ' + root);
          }
          toolOutput = lines.join('\n');
          // Descend affordance on the first child; keyboard walk + per-
          // row descend land in a follow-up sprint. For now the user
          // clicks descend to attach the pane to the first child, then
          // navigates further by hand.
          const firstRoot = Object.values(roots)[0];
          if (typeof firstRoot === 'string' && firstRoot.length > 0) {
            descendPath = firstRoot;
            descendShow = true;
          }
        } else if (isDelegate) {
          toolOutput = String((output && output.answer) || '');
          if (output && typeof output.child_root === 'string') {
            descendPath = output.child_root;
            descendShow = descendPath.length > 0;
          }
        } else if (output && typeof output === 'object') {
          toolOutput = JSON.stringify(output, null, 2);
        } else {
          toolOutput = paired ? String(output || '') : '';
        }
        toolError = paired ? String(paired.error || '') : '';
        toolCallId = row.callId;
        toolStep = row.toolStep !== undefined ? String(row.toolStep) : '';
        toolBytes = paired ? String(toolOutput.length) + ' bytes' : '';
        toolStatus = toolRunning ? 'running' : failed ? 'err · ' + toolError : 'ok';
        toolStatusColor = toolRunning ? '#7fb3b8' : failed ? '#c26058' : '#9aa0a8';
        // Auto-open a running tool's card so streaming is visible without
        // a click. A user who explicitly collapses it (toolOpen[cid] === false)
        // keeps it closed. Otherwise: open while running OR while streaming
        // chunks are pending. A sealed tool with no explicit state stays
        // collapsed by default (post-hoc review click).
        const explicit = toolOpen[row.callId];
        if (explicit === true) toolCardOpen = true;
        else if (explicit === false) toolCardOpen = false;
        else toolCardOpen = toolRunning || streamingShow;
      }
      const isTool = row.role === TranscriptRole.Tool && isToolCall;
      const notTool = !isTool;
      const cardCaret = toolCardOpen ? '▾' : '▸';
      // Toggle flips the visibly-open state. Three inputs: explicit true,
      // explicit false, unset (auto-open while running or streaming).
      // A click on a card the user sees open sets false; a click on a
      // card the user sees closed sets true. Without this, a streamed
      // tool (bash) traps the user: clearing the flag hands control
      // back to auto, and auto reopens the card in the same render
      // because streamingShow stays true after eof.
      const bindToggleTool = (cid) => () => this.setState(st => {
        const next = Object.assign({}, st.toolOpen || {});
        if (next[cid]) delete next[cid]; else next[cid] = true;
        return { toolOpen: next };
      });
      // Phase 8 item 9 prerequisite — descent click on a delegate row.
      // Clicking calls SessionController.attachRecordRoot(child_root)
      // (item 4 endpoint) and pushes the child_root onto state.descent so
      // the descent crumbs and depth-ramp accent apply to the child
      // scope. Consumed only when the paired ToolResult carried a
      // child_root string (delegate always does; other tools never).
      const bindDescend = (rootPath) => () => {
        const vm = window.__vm;
        if (!vm) return;
        if (typeof vm.setActive === 'function') vm.setActive(paneId);
        if (typeof vm.attachRecordRoot === 'function') {
          vm.attachRecordRoot(rootPath).catch(() => undefined);
        }
        this.setState(st => ({
          descent: [...(st.descent || []), rootPath],
          descPv: '',
        }));
      };
      // The output pane in the card waits for the STREAM to close, not
      // just for the ToolResult. A streaming tool's ToolResult carries
      // the same bytes the chunks already delivered; showing both makes
      // the output panel fill while the streaming pane below it is still
      // ticking. Rule: if streaming happened, output shows only after
      // streamingEof; a non-streaming tool shows output the moment the
      // ToolResult lands.
      const hasResult = !toolRunning && (!streamingShow || streamingEof);
      return {
        glyph, glyphColor, textColor, marginTop, text, blocks, isModel, notModel: !isModel, opacity,
        isTool, notTool,
        toolName: row.toolName || '',
        toolPreview, toolCardOpen, cardCaret,
        toolArgs: toolArgs.map((a, i) => ({ i: '[' + i + ']', v: String(a) })),
        toolOutput, toolError, toolCallId, toolStep, toolBytes, toolStatus, toolStatusColor,
        toolRunning, hasResult, hasError: !!toolError,
        openCard: isTool && row.callId ? bindToggleTool(row.callId) : (() => {}),
        descendShow, descendPath,
        descend: descendShow ? bindDescend(descendPath) : (() => {}),
        streamingShow, streamingText, streamingEof,
      };
    });
    // Only KEEP one row per (ToolCall, ToolResult) pair — the ToolCall
    // row is the surface; the ToolResult row folds into its card.
    const filteredRows = rows.filter((r, i) => transcript[i].kind !== EnvelopeKind.ToolResult);
    const hasSession = !!(snap && snap.sessionId);
    const activity = this._liveActivity(snap);
    return {
      liveOn: true,
      scriptedOn: false,
      liveTranscript: filteredRows,
      // Activity strip above the prompt (live producer / turn recap).
      // "turn N" is the head word and pulses in the live state; the
      // tail lists tool name / seconds / tool count. Recap replaces
      // the tail with elapsed / tool count / park reason.
      activityShow: !!activity,
      activityTurnWord: activity ? activity.turnWord : '',
      activityTurnColor: activity ? activity.turnColor : '#4a4e55',
      activityRest: activity ? activity.hasRest : false,
      activityRestText: activity ? activity.restText : '',
      activityColor: activity ? activity.color : '#62676f',
      activityPulseClass: activity && activity.pulseOn ? 'act-pulse' : '',
      liveEmpty: hasSession && rows.length === 0,
      liveSessionLabel: snap && snap.sessionName ? snap.sessionName
        : (snap && snap.sessionId ? snap.sessionId.slice(0, 12) : ''),
      liveEventCount: rows.length,
      liveConnection: snap ? snap.connection : 'idle',
    };
  }
  _linesForPane(p, state) {
    const snaps = state.controllerSnapshots || {};
    const snap = snaps[p.id];
    if (!snap || !Array.isArray(snap.transcript) || !snap.transcript.length) return p.lines || [];
    const out = [];
    for (const row of snap.transcript) {
      const c = row.role === TranscriptRole.User ? '#e2e5e9'
        : row.role === TranscriptRole.Model ? '#88b0d0'
        : row.role === TranscriptRole.Tool ? '#7fb3b8'
        : row.role === TranscriptRole.Park ? '#82a5c8'
        : row.role === TranscriptRole.Warning ? '#c9a0b8'
        : row.role === TranscriptRole.Ended ? '#62676f'
        : '#9aa0a8';
      const prefix = row.role === TranscriptRole.User ? '› ' : row.role === TranscriptRole.Tool ? '◦ ' : '';
      out.push({ t: prefix + (row.text || ''), c });
    }
    return out;
  }
  async _pickFolder(paneId) {
    // Prefer Electron's native folder dialog — returns the folder's
    // real absolute path, which the session actually opens in.
    // The old showDirectoryPicker path returned only the folder's
    // basename ('substrate-ui'), which caused every "choose folder"
    // session to silently fall back to a per-session sandbox and
    // never persist.
    const native = window.native;
    if (native && typeof native.pickFolder === 'function') {
      try {
        const path = await native.pickFolder();
        if (!path) return; // user cancelled
        // Persist to ~/.substrate/recent-workspaces.json.
        const vm = window.__vm;
        if (vm && typeof vm.addWorkspace === 'function') {
          await vm.addWorkspace(path);
        }
        // Bind the pane's UI state AND thread the workspace into the
        // controller so the next openSession picks it up.
        if (vm && typeof vm.pickWorkspace === 'function') vm.pickWorkspace(path);
        this._bindPane(paneId, path);
      } catch (_e) { /* dialog failed */ }
      return;
    }
    // Non-Electron fallback: focus the type-a-path input.
    this.setState(st => ({ panes: st.panes.map(p => p.id === paneId ? Object.assign({}, p, { wsQ: '', wsHint: 'no native folder picker — type the path here' }) : p) }));
    setTimeout(() => {
      const el = document.querySelector('input[placeholder^="type a path"]');
      if (el) el.focus();
    }, 40);
  }
  _newPane() {
    const id = (this._nextId = (this._nextId || Math.max(...this.state.panes.map(p => p.id), ...(this.state.allSessions || []).map(s => s.id)) + 1)) && this._nextId++;
    const defaultDriver = this.state.driverDefault || null;
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
    return { id, name: 'pane-' + id, driver: defaultDriver, unbound: true, wsQ: '', editing: false, nameVal: '', pv: '', lines: [] };
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

  _split(dir) {
    // Each split adds exactly one pane, up to a hard cap of eight.
    // The focused pane's cell is halved along the requested axis; the
    // new pane takes the freed half. Grid resolution doubles on demand
    // when the focused pane's span in the split axis is 1.
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
        const newPane = Object.assign(this._newPane(), { col: target.col + half, row: target.row, cw: half, rh: target.rh });
        target.cw = half;
        panes.push(newPane);
        return { cols, rows, colW, rowW, panes, focused: newPane.id };
      }
      // dir === 'down'
      if (target.rh < 2) {
        rows *= 2;
        rowW = rowW.reduce((acc, h) => (acc.push(h, h), acc), []);
        for (const p of panes) { p.row = p.row * 2 - 1; p.rh = p.rh * 2; }
      }
      const half = target.rh / 2;
      const newPane = Object.assign(this._newPane(), { col: target.col, row: target.row + half, cw: target.cw, rh: half });
      target.rh = half;
      panes.push(newPane);
      return { cols, rows, colW, rowW, panes, focused: newPane.id };
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
        if (typeof s.nestedDescent === 'boolean') patch.nestedDescent = s.nestedDescent;
        if (Object.keys(patch).length) this.setState(patch);
      }
    } catch (_e) { /* localStorage unavailable / disabled — carry defaults */ }
    this._persistSettings = () => {
      try {
        const s = this.state;
        window.localStorage.setItem('substrate-ui.settings', JSON.stringify({
          theme: s.theme, fontOverride: s.fontOverride, nestedDescent: !!s.nestedDescent,
        }));
      } catch (_e) { /* ignore */ }
    };
    // Tick the activity strip's seconds counter between controller
    // events. A live tool that takes 12s emits no envelopes for 12s;
    // without a tick the counter reads its start value the whole time.
    this._activityTick = window.setInterval(() => this.forceUpdate(), 500);
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
      if (e.ctrlKey && e.key === '\u0060') { e.preventDefault(); if (this.state.panes.some(p => p.unbound)) return; this.setState(s => ({ revealed: !s.revealed, surface: null })); }
      if (e.metaKey && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); this._split(e.shiftKey ? 'down' : 'right'); }
      if (e.metaKey && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); this.setState(s => ({ findOpen: !s.findOpen, findQ: '' })); }
      if (e.metaKey && e.key === ',') { e.preventDefault(); this.setState({ showSettings: true }); }
      if (this.state.fanOpen && !this.state.descent.length && !this.state.showSettings && !this.state.showExport && !this.state.showEndConfirm) {
        if (e.key === 'ArrowDown') { e.preventDefault(); this.setState(s => ({ fanSel: Math.min(2, s.fanSel + 1) })); }
        if (e.key === 'ArrowUp') { e.preventDefault(); this.setState(s => ({ fanSel: Math.max(0, s.fanSel - 1) })); }
        if (e.key === 'Enter' && !(document.activeElement && document.activeElement.tagName === 'INPUT')) { e.preventDefault(); const k = ['floor_a', 'floor_b', 'floor_c'][this.state.fanSel]; this.setState({ descent: [k], descPv: '' }); }
      }
      if (e.key === 'Escape') {
        const s = this.state;
        if (s.findOpen) this.setState({ findOpen: false, findQ: '' });
        else if (s.showSettings || s.showExport || s.showEndConfirm) this.setState({ showSettings: false, showExport: false, showEndConfirm: false });
        else if (s.nsOpen || s.driverOpen || s.wsOpen || s.ddFor || s.wsFor) this.setState({ nsOpen: false, driverOpen: false, wsOpen: false, ddFor: null, wsFor: null, nsStatus: '' });
        else if (s.descent.length) this.setState({ descent: s.descent.slice(0, -1), descPv: '' });
        else if (s.fanOpen) this.setState({ fanOpen: false });
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
            // Phase 8 item 9 descent scope: when the pane is descended
            // into a delegate, state.descent[-1] holds the child's
            // record_root string (set by the descend click on a
            // delegate ToolResult, b17960c). Passing it through routes
            // the interrupt to the CHILD's runtime.
            const desc = Array.isArray(s.descent) ? s.descent : [];
            const descTarget = desc.length ? String(desc[desc.length - 1]) : undefined;
            vm.interruptTurn(tier, descTarget);
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
  componentWillUnmount() { window.removeEventListener('keydown', this._kd); window.removeEventListener('mousemove', this._mm); window.removeEventListener('mouseup', this._mu); window.removeEventListener('resize', this._rs); if (this._ddOutside) document.removeEventListener('mousedown', this._ddOutside, true); if (this._activityTick) { window.clearInterval(this._activityTick); this._activityTick = null; } }
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
    // ── turn 20: delegate descent ──
    // D70 (2026-09-06): the depth ramp for delegation. Session accent
    // is #82a5c8 (depth 0); each descent step deepens toward violet.
    // The step is deliberately subtle so adjacent levels look almost
    // identical — the ramp reads only when levels are stacked (20f).
    // Applied to the ⑂ line, inset border, path chip, and focused
    // prompt at the corresponding depth.
    const DEPTHC = ['#82a5c8', '#93a0cb', '#9a9bce', '#a096d0', '#ac92d4', '#b88fd9'];
    const demoDescentChildren = {
      'reviewer-a': { name: 'reviewer-a', driver: 'glm-4.6', rec: 'delegate_child_3e36', talkable: true,
        head: 'reviewer-a · glm-4.6 · child record delegate_child_3e36 · 26 events',
        lines: [
          { t: 'delegated: check the stripe-count derivation · from fix-race-in-metering · turn 9', c: '#62676f' },
          { t: '  ⚙ read_file src/substrate/metering.py ·· 312 lines', c: '#62676f' },
          { t: '  ⚙ bash python -c "stripe_model.py --check" ·· ok', c: '#62676f' },
          { t: 'The derivation holds for N≥4 stripes; below that CAS retry cost dominates. Checking the boundary case now.', c: '#b9bec5', wrap: 1 },
          { t: '  ⑂ delegate → verifier "re-derive independently" · running · depth 2/2 · click to descend', c: '#b88fd9', go: 'verifier' },
          { t: '◐ parked — awaiting your message', c: '#7fb3b8' }] },
      'verifier': { name: 'verifier', driver: 'deterministic', rec: 'delegate_child_9a12', talkable: false,
        head: 'verifier · deterministic · child record delegate_child_9a12 · 11 events',
        lines: [
          { t: 'delegated: re-derive independently · from ⑂ reviewer-a', c: '#62676f' },
          { t: '  ⚙ read_file stripe_model.py ·· 88 lines', c: '#62676f' },
          { t: '  ⚙ bash python stripe_rederive.py --independent ·· ok', c: '#62676f' },
          { t: 'Re-derived from the queueing model directly: floor(N)=4 confirmed; N=3 degrades 2.1× under -n 8.', c: '#b9bec5', wrap: 1 },
          { t: '  ⑂ delegate → checker · refused — ok false · "delegate depth cap reached (max_depth=2)"', c: '#c9a0b8' },
          { t: '  ⚙ bash python stripe_rederive.py --sweep 2..16 ·· running 4s', c: '#62676f' },
          { t: '◌ working — this topology takes no messages', c: '#4a4e55' }] },
      'floor_a': { name: 'floor_a', driver: 'glm-4.6', rec: 'delegate_child_a1c8', talkable: true,
        head: 'floor_a · glm-4.6 · child record delegate_child_a1c8 · 19 events',
        lines: [
          { t: 'delegated: derive the stripe floor independently · from fix-race-in-metering · turn 10', c: '#62676f' },
          { t: '  ⚙ bash python stripe_floor.py --derive ·· ok', c: '#62676f' },
          { t: 'floor(N)=4 — the CAS retry cost dominates below 4 stripes.', c: '#b9bec5', wrap: 1 },
          { t: '◐ parked — awaiting your message', c: '#7fb3b8' }] },
      'floor_b': { name: 'floor_b', driver: 'qwen3:8b', rec: 'delegate_child_b774', talkable: false,
        head: 'floor_b · qwen3:8b · child record delegate_child_b774 · 11 events',
        lines: [
          { t: 'delegated: derive the stripe floor independently · from fix-race-in-metering · turn 10', c: '#62676f' },
          { t: '  ⚙ bash python stripe_floor.py --sweep 2..16 ·· running 12s', c: '#62676f' },
          { t: '◌ running — this topology takes no messages', c: '#4a4e55' }] },
      'floor_c': { name: 'floor_c', driver: 'deterministic', rec: 'delegate_child_c093', talkable: false,
        head: 'floor_c · deterministic · child record delegate_child_c093 · 6 events',
        lines: [
          { t: 'delegated: derive the stripe floor independently · from fix-race-in-metering · turn 10', c: '#62676f' },
          { t: '  ⚙ bash python queueing_model.py ·· running 3s', c: '#62676f' },
          { t: '◌ running — this topology takes no messages', c: '#4a4e55' }] },
    };
    const descTop = state.descent[state.descent.length - 1] || null;
    const dChild = descTop ? demoDescentChildren[descTop] : null;
    const descended = !!dChild && mainFocused;
    const dColor = DEPTHC[Math.min(Math.max(state.descent.length - 1, 0), DEPTHC.length - 1)];
    const descLines = !dChild ? [] : dChild.lines.concat((state.descExtra[descTop] || [])).map(L => ({
      t: L.t, c: L.c, mt: L.wrap ? '6px' : '0', ws: L.wrap ? 'normal' : 'nowrap', cur: L.go ? 'pointer' : 'default',
      click: L.go ? (() => this.setState(st => ({ descent: [...st.descent, L.go], descPv: '' }))) : (() => {}),
    }));
    const descCrumbs = [{ t: 'fix-race-in-metering', c: '#4a4e55', jump: () => this.setState({ descent: [], descPv: '' }) }]
      .concat(state.descent.map((k, i) => ({ t: '› ⑂ ' + demoDescentChildren[k].name, c: i === state.descent.length - 1 ? DEPTHC[Math.min(i, 1)] : '#4a4e55', jump: () => this.setState({ descent: this.state.descent.slice(0, i + 1), descPv: '' }) })));
    const descAncestors = !state.nestedDescent || !dChild ? [] : (() => {
      const rows = [{ t: '› have someone review the locking change before we land it', c: '#62676f' }];
      state.descent.slice(0, -1).forEach(k => rows.push({ t: '  ⑂ delegate → ' + demoDescentChildren[k].name + ' · running', c: '#a08fc9' }));
      return rows;
    })();
    // ── 20g: fan-out ──
    const fanRows = ['floor_a', 'floor_b', 'floor_c'].map((k, ki) => { const c = demoDescentChildren[k]; const parked = c.talkable; return {
      name: c.name, driver: c.driver, meta: c.rec.replace('delegate_child_', '') + ' · ' + c.head.match(/(\d+) events/)[1] + ' ev',
      st: parked ? '◐ parked — floor(N)=4' : '◌ running', stC: parked ? '#7fb3b8' : '#4a4e55',
      bg: state.fanOpen && state.fanSel === ki ? '#2e3138' : 'transparent', go: () => this.setState({ descent: [k], descPv: '', fanSel: ki }) }; });
    // ── 19h/k/l: find (transcript scope — the focused pane) ──
    const findQuery = state.findOpen ? state.findQ.trim().toLowerCase() : '';
    const FSTREAM = state.findOpen && state.findScope === 'stream';
    const FTRANS = state.findOpen && state.findScope === 'transcript';
    const demoFindTranscriptText = {
      fdIntro: 'session fix-race-in-metering resumed turn 9 record 01M1684 244 events',
      fdU1: 'the metering test flakes under load — find and fix the race',
      fdGrep: 'grep meter_lock src 14 matches', fdRead: 'read_file src substrate metering.py 312 lines', fdEdit: 'edit_file metering.py ok',
      fdU2: 'have someone review the locking change before we land it',
      fdDel: 'delegate reviewer-a review the locking change answered',
      fdBash: 'bash pytest -k metering -n 8 24 passed',
      fdAns: 'the race was in _emit_log — an unlocked deque shared by two producers. wrapped it in the kernel lock; reviewer-a signed off. 24 24 green under -n 8.',
      fdPark: 'parked' };
    const fdOf = (k) => (!findQuery || !FTRANS ? 1 : (demoFindTranscriptText[k].toLowerCase().includes(findQuery) ? 1 : 0.3));
    const paneW = (state.winW || window.innerWidth) / state.cols;
    const compact = paneW < 480;
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
    const CMDS = [
      ['/exit', 'end this session cleanly', (paneId) => { _clearPv(paneId); this.setState({ showEndConfirm: true }); }],
      ['/model', 'swap driver — /model <name>', null],
      ['/name', 'rename this session — /name <new>', null],
      ['/list', 'list sessions on the server', (paneId) => { _clearPv(paneId); _vmSubmitFor(paneId, '/list'); }],
      ['/interrupt', 'stop the in-flight turn (also ^C)', (paneId) => { _clearPv(paneId); _vmSubmitFor(paneId, '/interrupt'); }],
      ['/clear', 'clear the transcript view', (paneId) => { _clearPv(paneId); _vmSubmitFor(paneId, '/clear'); }],
      ['/help', 'show this list', (paneId) => { _clearPv(paneId); _vmSubmitFor(paneId, '/help'); }],
    ];
    const panes = state.panes.map(p => Object.assign({
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
      wsRows: (() => {
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
        if (p.wsQ) rows.unshift({ path: p.wsQ, meta: 'typed — ↵ binds + starts', kind: 'typed', key: '↵' });
        const selIdx = Math.max(0, Math.min(p.wsSelIdx || 0, rows.length - 1));
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
        return rows.map((row, i) => {
          const expandKey = row.expandPath || row.path;
          const expanded = !!(row.expandable && pickerExpanded[expandKey]);
          const paged = row.expandable ? pickerPaged[expandKey] : null;
          const sessions = (expanded && paged)
            ? paged.rows.slice(0, 5).map(s => ({
                sessionIdShort: (s.sessionId || '').slice(0, 12),
                name: s.name || (s.sessionId || '').slice(0, 8),
                driver: s.driver || '?',
                statusLabel: s.status === 'live' ? '● running'
                  : s.status === 'parked' ? '◐ parked'
                  : s.status === 'interrupted' ? '! interrupted'
                  : '◇ ended',
                dotColor: s.status === 'live' ? '#7fb3b8' : s.status === 'parked' ? '#82a5c8' : s.status === 'interrupted' ? '#c26058' : '#4a4e55',
                pick: () => _attachToExisting(p.id, s),
              }))
            : [];
          return Object.assign({}, row, {
            c: i === selIdx ? '#e2e5e9' : '#b9bec5',
            bg: i === selIdx ? '#2e3138' : 'transparent',
            key: row.key || (i === selIdx ? '↵' : ''),
            expanded, notExpanded: !expanded,
            chevron: row.expandable ? (expanded ? '▾' : '▸') : ' ',
            toggleExpand: row.expandable ? ((ev) => { if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation(); _pickerToggle(expandKey); }) : (() => undefined),
            sessions,
            pick: () => {
              if (row.kind === 'choose') { this._pickFolder(p.id); return; }
              if (row.kind === 'default') { this._bindPane(p.id, '', { isDefault: true }); return; }
              const vm = window.__vm;
              if (vm && typeof vm.pickWorkspace === 'function') vm.pickWorkspace(row.path);
              if (vm && typeof vm.addWorkspace === 'function' && row.path !== '~/.substrate/sandbox') {
                void vm.addWorkspace(row.path);
              }
              this._bindPane(p.id, row.path);
            },
          });
        });
      })(),
      wsQ: p.wsQ || '',
      onWsQ: (ev) => this.setState(st => ({ panes: st.panes.map(x => x.id === p.id ? Object.assign({}, x, { wsQ: ev.target.value, wsSelIdx: 0 }) : x) })),
      onWsKey: (ev) => {
        // Keyboard nav — ↑↓ moves through the row list, ⇥ completes the
        // typed path against the first recent, ↵ binds the current row.
        const wsRows = ((studioState) => {
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
          const userFolders = ((studioState.recentWorkspaces || []).filter(r => !skip(r)));
          const inheritFrom = studioState.panes.find(pp => pp.id !== p.id && !pp.unbound && !!pp.ws);
          const rows = [];
          rows.push({ path: 'per session sandbox', kind: 'default' });
          if (inheritFrom) rows.push({ path: inheritFrom.ws, kind: 'inherit' });
          rows.push({ path: '~/.substrate/sandbox', kind: 'sandbox' });
          for (const r of userFolders.slice(0, 2)) rows.push({ path: r.path, kind: 'recent' });
          rows.push({ path: 'choose folder…', kind: 'choose' });
          if (p.wsQ) rows.unshift({ path: p.wsQ, kind: 'typed' });
          return rows;
        })(this.state);
        const cur = Math.max(0, Math.min(p.wsSelIdx || 0, wsRows.length - 1));
        if (ev.key === 'ArrowDown') { ev.preventDefault(); this.setState(st => ({ panes: st.panes.map(x => x.id === p.id ? Object.assign({}, x, { wsSelIdx: (cur + 1) % wsRows.length }) : x) })); return; }
        if (ev.key === 'ArrowUp') { ev.preventDefault(); this.setState(st => ({ panes: st.panes.map(x => x.id === p.id ? Object.assign({}, x, { wsSelIdx: (cur - 1 + wsRows.length) % wsRows.length }) : x) })); return; }
        if (ev.key === 'Tab') {
          const firstRecent = wsRows.find(r => r.kind === 'recent' || r.kind === 'inherit' || r.kind === 'sandbox');
          if (firstRecent) { ev.preventDefault(); this.setState(st => ({ panes: st.panes.map(x => x.id === p.id ? Object.assign({}, x, { wsQ: firstRecent.path, wsSelIdx: 0 }) : x) })); }
          return;
        }
        if (ev.key === 'Enter') {
          const row = wsRows[cur];
          if (!row) return;
          if (row.kind === 'choose') { this._pickFolder(p.id); return; }
          if (row.kind === 'default') { this._bindPane(p.id, '', { isDefault: true }); return; }
          const vm = window.__vm;
          if (vm && typeof vm.pickWorkspace === 'function') vm.pickWorkspace(row.path);
          if (vm && typeof vm.addWorkspace === 'function' && row.path !== '~/.substrate/sandbox') {
            void vm.addWorkspace(row.path);
          }
          this._bindPane(p.id, row.path);
        }
      },
      showChips: paneW >= 340,
      hdrGap: compact ? '5px' : '8px',
      nameMin: compact ? '44px' : '64px',
      wsLabel: p.unbound ? '⌥ —' : compact ? '⌥' : '⌥ ' + (p.shape === 'worktree' ? 'substrate/' + (p.name || 'main') : (p.ws || p.name || '')),
      revealText: compact ? '⌃`' : '⌃` reveal',
      id: p.id, name: p.name, driver: p.driver || state.driverDefault || 'deterministic',
      // isMain gates the full machinery lens (transcript + prompt +
      // find bar). Every bound pane, not just pane 1, should render
      // it — otherwise a newly-split pane falls through to the
      // legacy `pn.lines` list and the model's replies never format
      // correctly there. An unbound pane still falls to notMain so
      // its workspace picker renders in place of the empty transcript.
      isMain: !p.unbound, notMain: !!p.unbound,
      // Machinery-lens bindings scoped to THIS pane so splitting the
      // window does not blank an unfocused pane. Each pane reads its
      // own controller's snapshot; focus only controls emphasis.
      ...this._liveBindingsFor(p.id, state),
      // Each pane's transcript lines come from its own controller's
      // snapshot. Non-focused panes still show live transcript from
      // their own session — no cross-pane bleed. `_linesForPane` is
      // computed above the .map so the closure captures the pane id
      // by value, not the enclosing iterator.
      lines: this._linesForPane(p, state),
      // Prompt row bindings — every rendered pane owns its own. A
      // global `state.promptVal` field would mirror the same string
      // into every visible input on every render, so a keystroke in
      // pane 1 would visibly appear in pane 2's input box even though
      // the send only routed to pane 1's controller. Each pane's
      // prompt text lives on `p.pv`; the router row list and its
      // pick callbacks reference the pane's own state.
      pv: p.pv || '',
      promptVal: p.pv || '',
      onPv: (ev) => this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { pv: ev.target.value }) : x) })),
      onPrompt: (ev) => this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { pv: ev.target.value }) : x) })),
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
      onPromptKey: (ev) => {
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
      routerRows: (() => {
        const q = (p.pv || '').trim();
        if (!q.startsWith('/')) return [];
        return CMDS.filter(c => c[0].startsWith(q) || q === '/').map(c => ({
          cmd: c[0], desc: c[1],
          pick: c[2]
            ? (() => { this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { pv: '' }) : x) })); (c[2])(p.id); })
            : (() => this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { pv: c[0] + ' ' }) : x) }))),
        }));
      })(),
      routerOpen: (() => {
        const q = (p.pv || '').trim();
        return q.startsWith('/') && CMDS.some(c => c[0].startsWith(q) || q === '/');
      })(),
      promptRadius: (() => {
        const q = (p.pv || '').trim();
        return (q.startsWith('/') && CMDS.some(c => c[0].startsWith(q) || q === '/')) ? '0 0 6px 6px' : '6px';
      })(),
      sentLines: (p.sent || []).map(t => ({ text: t })),
      editing: p.editing, notEditing: !p.editing, nameVal: p.nameVal,
      nameColor: p.id === state.focused ? '#e2e5e9' : '#9aa0a8',
      // Status dot per pane. 19i: when the last transcript row is a
      // RateLimitedWaiting warning, the dot hollows (no fill) so the
      // user sees the retry state at a glance without a modal.
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
        const last = (snap.transcript || []).slice(-1)[0];
        const rateLimited = last && last.kind === 'RateLimitedWaiting';
        if (rateLimited) return 'transparent';
        const conn = snap.connection;
        if (conn === 'connected') return '#7fb3b8';
        if (conn === 'connecting') return '#82a5c8';
        if (conn === 'reconnecting') return '#c9a05a';
        if (conn === 'closed') return '#c26058';
        return '#4a4e55';
      })(),
      outline: 'none',
      dim: (state.panes.length > 1 && p.id !== state.focused) ? '.55' : '1',
      hintOn: !!(state.dropHint && state.dropHint.id === p.id),
      hintL: state.dropHint && state.dropHint.zone === 'e' ? '50%' : '0', hintT: state.dropHint && state.dropHint.zone === 's' ? '50%' : '0',
      hintW: state.dropHint && (state.dropHint.zone === 'w' || state.dropHint.zone === 'e') ? '50%' : '100%',
      hintH: state.dropHint && (state.dropHint.zone === 'n' || state.dropHint.zone === 's') ? '50%' : (state.dropHint && (state.dropHint.zone === 'w' || state.dropHint.zone === 'e') ? '100%' : '100%'),
      branch: p.shape === 'worktree' ? 'substrate/' + (p.name || 'main') : (p.ws || ''),
      wsPath: p.ws || '~/.substrate/sandbox',
      wsShape: p.shape || 'sandbox',
      ddOpen: state.ddFor === p.id, wsOpenP: state.wsFor === p.id,
      // Clip the header by default so a narrow pane's chip row does not
      // bleed sideways into the next pane. Restore `visible` while a
      // dropdown (driver picker or workspace popup) is open, because
      // those are `position:absolute; top:20px` inside the header and
      // rely on the header not clipping to be visible below it.
      hdrOverflow: (state.ddFor === p.id || state.wsFor === p.id) ? 'visible' : 'hidden',
      toggleDd: () => {
        // Sprint 085 followup — freeze picker once this pane has a bound
        // session. Switching driver mid-session triggers auth flows for
        // a driver the session is not using.
        const paneSnap = (state.controllerSnapshots || {})[p.id];
        if (paneSnap && paneSnap.sessionId) return;
        this.setState(s => ({ focused: p.id, ddFor: s.ddFor === p.id ? null : p.id, wsFor: null }));
      },
      toggleWsP: () => this.setState(s => ({ focused: p.id, wsFor: s.wsFor === p.id ? null : p.id, ddFor: null })),
      driverOpts: (() => {
        // Sprint 084 — sectioned driver picker. Header rows carry
        // `isHeader:true`; the template renders headers as uppercase
        // labels and item rows as clickable pickers. The `notHeader`
        // twin lets dc-runtime's sc-if pick the right span shape.
        const groups = (state.driverGroups && state.driverGroups.length)
          ? state.driverGroups
          : [{ label: '', entries: (state.driverRoster && state.driverRoster.length) ? state.driverRoster : ['deterministic'] }];
        const items: Array<{ label: string; color: string; isHeader: boolean; notHeader: boolean; pick: () => void }> = [];
        const noop = () => undefined;
        for (const grp of groups) {
          if (grp.label) items.push({ label: grp.label, color: '#62676f', isHeader: true, notHeader: false, pick: noop });
          for (const m of grp.entries) {
            items.push({
              label: m,
              color: m === p.driver ? '#e2e5e9' : '#9aa0a8',
              isHeader: false, notHeader: true,
              pick: () => {
                this.setState(s => ({ ddFor: null, panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { driver: m }) : x) }));
                const vm = window.__vm;
                if (vm) vm.pickDriver(m);
              },
            });
          }
        }
        return items;
      })(),
      caretColor: p.id === state.focused ? '#82a5c8' : '#4a4e55',
      promptHint: p.id === state.focused ? 'type to talk · / for commands' : 'click to focus',
      focus: () => this.setState({ focused: p.id }),
      gripStart: (ev) => { ev.stopPropagation(); this._dragPaneId = p.id; if (ev.dataTransfer) { ev.dataTransfer.setData('text/plain', String(p.id)); const pane = ev.currentTarget.parentElement; if (pane && ev.dataTransfer.setDragImage) ev.dataTransfer.setDragImage(pane, 60, 14); } },
      splitR: (ev) => { ev.stopPropagation(); this.setState({ focused: p.id }); this._split('right'); },
      splitD: (ev) => { ev.stopPropagation(); this.setState({ focused: p.id }); this._split('down'); },
      dragOver: (ev) => {
        ev.preventDefault();
        if (!this._dragPaneId || this._dragPaneId === p.id) return;
        const r = ev.currentTarget.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        const zone = x < .3 ? 'w' : x > .7 ? 'e' : y < .3 ? 'n' : y > .7 ? 's' : 'c';
        if (!this.state.dropHint || this.state.dropHint.id !== p.id || this.state.dropHint.zone !== zone) this.setState({ dropHint: { id: p.id, zone } });
      },
      dragLeave: () => { if (this.state.dropHint && this.state.dropHint.id === p.id) this.setState({ dropHint: null }); },
      dropSwap: (ev) => {
        ev.preventDefault(); const from = this._dragPaneId; const hint = this.state.dropHint; this._dragPaneId = null;
        if (!from || from === p.id) { this.setState({ dropHint: null }); return; }
        this.setState(s => {
          const panes = s.panes.slice();
          const a = panes.findIndex(x => x.id === from), b = panes.findIndex(x => x.id === p.id);
          if (a < 0 || b < 0) return { dropHint: null };
          const zone = (hint && hint.id === p.id) ? hint.zone : 'c';
          if (zone === 'c') { const t = panes[a]; panes[a] = panes[b]; panes[b] = t; }
          else { const [moved] = panes.splice(a, 1); let bi = panes.findIndex(x => x.id === p.id); const before = (zone === 'w' || zone === 'n'); panes.splice(before ? bi : bi + 1, 0, moved); }
          return { panes, focused: from, dropHint: null };
        });
      },
      goRecords: () => {
        this.setState({ focused: p.id, surface: Surface.Records });
        const vm = window.__vm;
        if (vm) {
          if (typeof vm.loadLiveSessions === 'function') vm.loadLiveSessions().catch(() => undefined);
          if (typeof vm.loadRecentWorkspaces === 'function') vm.loadRecentWorkspaces().catch(() => undefined);
        }
      },
      goStudio: () => this.setState({ focused: p.id, surface: Surface.Studio }),
      goReveal: () => this.setState({ focused: p.id, revealed: true, surface: null }),
      startEdit: () => this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { editing: true, nameVal: x.name }) : x) })),
      updName: (ev) => this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { nameVal: ev.target.value }) : x) })),
      nameKey: (ev) => { if (ev.key === 'Enter') this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { editing: false, name: x.nameVal.trim() || x.name }) : x), allSessions: (s.allSessions || []).map(x => x.id === p.id ? Object.assign({}, x, { name: (s.panes.find(pp => pp.id === p.id) || {}).nameVal || x.name }) : x) })); if (ev.key === 'Escape') this.setState(s => ({ panes: s.panes.map(x => x.id === p.id ? Object.assign({}, x, { editing: false }) : x) })); },
    }));
    // Color = participant relevance. Bright = participant-to-participant
    // message (Model, Delegate, External); shown in both `all` and `app`.
    // Gray = runtime plumbing (scheduling, lifecycle, bookkeeping);
    // shown only in `all`. The LOW filter below reads this rule.
    const envelopeKindColor = {
      // Participant messages — bright.
      ToolCall: '#a08fc9', ToolResult: '#7fb3b8',
      UserMessage: '#88b0d0', ModelReply: '#88b0d0', FinalAnswer: '#88b0d0',
      Park: '#82a5c8', SessionEnded: '#88b0d0',
      // Runtime plumbing — gray.
      TriggerFired: '#62676f', ProducerStarted: '#62676f', ProducerCompleted: '#62676f',
      RunStarted: '#62676f', RunFinalised: '#62676f', TerminationMatched: '#62676f',
      SessionStarted: '#62676f', PromptFragment: '#62676f', PromptComposed: '#62676f',
    };
    // full-granularity turn slice — every tool cycle is ToolCall · TriggerFired · ProducerStarted · ToolResult · ProducerCompleted, as on a real record
    const cycle = (base, tool, callId, step, args, gist, resultGist, resultPayload, resultContent, child) => ([
      { seq: base, kind: EnvelopeKind.ToolCall, schema: 'tool_loop.ToolCall', prod: 'model', gist, lanes: child ? 'mc' : 'mt', payload: { call_id: callId, tool, args, step }, content: [] },
      { seq: base + 1, kind: 'TriggerFired', schema: 'substrate.TriggerFired', prod: 'runtime', gist: 'fire-tool → tool', lanes: child ? 'mc' : 'mt', payload: { trigger_id: 'fire-tool', starts: 'tool' }, content: [] },
      { seq: base + 2, kind: 'ProducerStarted', schema: 'substrate.ProducerStarted', prod: 'runtime', gist: 'tool · ' + tool, lanes: child ? 'mc' : 'mt', payload: { kind: 'tool', instance: 'tool_' + callId }, content: [] },
      { seq: base + 3, kind: EnvelopeKind.ToolResult, schema: 'tool_loop.ToolResult', prod: 'tool · ' + tool, gist: resultGist, lanes: child ? 'mc' : 'mt', payload: Object.assign({ call_id: callId, tool, step, ok: true, error: '' }, resultPayload), content: resultContent },
      { seq: base + 4, kind: 'ProducerCompleted', schema: 'substrate.ProducerCompleted', prod: 'runtime', gist: 'tool · ' + tool, lanes: child ? 'mc' : 'mt', payload: { kind: 'tool', instance: 'tool_' + callId }, content: [] },
    ]);
    const demoFullSessionEnvelopes = [
      { seq: 214, kind: EnvelopeKind.UserMessage, schema: 'session.UserMessage', prod: 'runtime', gist: 'the metering test flakes…', lanes: 'm',
        payload: { text: 'the metering test flakes under load — find and fix the race', turn_index: 9, slash_source: null },
        content: [{ k: 'ASSEMBLED_PROMPT', v: '[system] You are the session driver…\n[turn 8] …compacted…\n[user] the metering test flakes under load — find and fix the race' }] },
      { seq: 215, kind: 'TriggerFired', schema: 'substrate.TriggerFired', prod: 'runtime', gist: 'fire-model → model', lanes: 'm', payload: { trigger_id: 'fire-model', starts: 'model' }, content: [] },
      { seq: 216, kind: 'ProducerStarted', schema: 'substrate.ProducerStarted', prod: 'runtime', gist: 'model', lanes: 'm', payload: { kind: 'model', instance: 'model_a1b2c3' }, content: [] },
      ...cycle(217, 'grep', 'tc_0034', 34, ['meter_lock', 'src/'], 'grep "meter_lock" src/', 'ok · 14 matches', {}, [{ k: 'OUTPUT', v: 'src/substrate/metering.py:41: with meter_lock:\nsrc/substrate/metering.py:88: meter_lock = Lock()\n… 14 matches' }]),
      ...cycle(222, 'read_file', 'tc_0035', 35, ['src/substrate/metering.py'], 'read_file metering.py', 'ok · 312 lines', {}, [{ k: 'OUTPUT', v: 'def _emit_log(self, entry):\n    self._log.append(entry)   # ← two producers share this deque\n… 312 lines' }]),
      ...cycle(227, 'edit_file', 'tc_0036', 36, ['src/substrate/metering.py', 'self._log.append(entry)', 'with self._kernel_lock:\n    self._log.append(entry)'], 'edit_file metering.py', 'ok · 1 replacement', { output: 'ok — 1 replacement' }, []),
      ...cycle(232, 'delegate', 'tc_0037', 37, ['review the locking change in metering.py'], 'delegate → reviewer-a', 'ok · answer folded', {}, [{ k: 'OUTPUT', v: 'lock scope is right — add a comment on why the deque needs the kernel lock\n\n(child record: delegate_child_3e366fe6_c0 · 47 events)' }], true),
      ...cycle(237, 'bash', 'tc_0038', 38, ['pytest -k metering -n 8'], 'bash pytest -k metering -n 8', 'ok · 24 passed', { output: { exit: 0, stdout: '24 passed in 4.12s', stderr: '' } }, [{ k: 'OUTPUT.STDOUT', v: '24 passed in 4.12s' }]),
      { seq: 242, kind: 'FinalAnswer', schema: 'tool_loop.FinalAnswer', prod: 'model', gist: 'turn done', lanes: 'm', payload: { steps: 38 },
        content: [{ k: 'TEXT', v: 'The race was in _emit_log — an unlocked deque shared by two producers. Wrapped it in the kernel lock; reviewer-a signed off. 24/24 green under -n 8.' }] },
      { seq: 243, kind: 'TriggerFired', schema: 'substrate.TriggerFired', prod: 'runtime', gist: 'park-on-final-answer → park', lanes: '', payload: { trigger_id: 'park-on-final-answer', starts: 'park' }, content: [] },
      { seq: 244, kind: EnvelopeKind.Park, schema: 'session.Park', prod: 'park', gist: 'await UserMessage', lanes: '', payload: { awaiting: EnvelopeKind.UserMessage, turn_index: 9, reason: 'final_answer' }, content: [] },
    ];
    const demoLiteSessionEnvelopes = [
      { seq: 0, kind: EnvelopeKind.SessionStarted, schema: 'session.SessionStarted', prod: 'runtime', gist: 'seed · driver ' + fp.driver + ' · worktree substrate/' + fp.name, lanes: '', payload: { session_id: fp.name, driver_model: fp.driver, workspace_shape: 'worktree', bundle: null, parent_session_id: null }, content: [] },
      { seq: 1, kind: EnvelopeKind.Park, schema: 'session.Park', prod: 'park', gist: 'await UserMessage', lanes: '', payload: { awaiting: EnvelopeKind.UserMessage, turn_index: 0, reason: 'session_open' }, content: [] },
    ];
    // Stream lens is always fed off the controller's real envelopes.
    // Framework brackets carry the `substrate.` prefix on the wire;
    // strip it so the lane derivation below matches on bare kind
    // names, the way the prototype's demoFullSessionEnvelopes demo did.
    const _liveEnvelopes = (_vmSnap && Array.isArray(_vmSnap.rawEnvelopes)) ? _vmSnap.rawEnvelopes : [];
    const stripSubstratePrefix = (k) => (typeof k === 'string' && k.indexOf('substrate.') === 0) ? k.slice('substrate.'.length) : k;
    // Bucket every producer kind onto one of four swim lanes.
    const laneForProducerKind = (producerKind) => {
      const k = producerKind || '';
      if (k === 'model') return 'model';
      if (k === 'tool') return 'tool';
      if (k === 'park') return 'park';
      return 'runtime';
    };
    // Prototype v7 convention for the `prod` column and gist per kind
    // is hand-annotated in demoFullSessionEnvelopes (lines 803, 806, 810, 823, etc.).
    // Real envelopes carry different fields; this map translates while
    // keeping the visible strings identical to the prototype's shape.
    const formatProducerLabel = (kind, producerKind, payload) => {
      // Framework brackets always read as `runtime` — matches prototype.
      if (kind === 'TriggerFired' || kind === 'ProducerStarted' || kind === 'ProducerCompleted'
          || kind === 'RunStarted' || kind === EnvelopeKind.RunFinalised || kind === 'TerminationMatched') return 'runtime';
      if (kind === EnvelopeKind.UserMessage) return 'runtime';
      if (kind === EnvelopeKind.ToolCall) return 'model';
      if (kind === EnvelopeKind.ToolResult) return payload.tool ? `tool · ${payload.tool}` : 'tool';
      if (kind === 'FinalAnswer' || kind === EnvelopeKind.ModelReply) return 'model';
      if (kind === EnvelopeKind.Park) return 'park';
      if (kind === EnvelopeKind.PromptFragment || kind === 'PromptComposed' || kind === EnvelopeKind.SessionStarted) return 'runtime';
      return producerKind || 'runtime';
    };
    const formatEnvelopeGist = (kind, payload) => {
      if (kind === EnvelopeKind.UserMessage) return String(payload.text || payload.assembled_prompt || '').slice(0, 160);
      if (kind === EnvelopeKind.ModelReply) return String(payload.text || '').slice(0, 160);
      if (kind === 'FinalAnswer') return 'turn done';
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
      if (kind === EnvelopeKind.SessionStarted) return `seed · driver ${payload.driver_model || '?'}`;
      if (kind === EnvelopeKind.SessionEnded) return `end · ${payload.reason || 'server_end'}`;
      if (kind === 'RateLimitedWaiting') return `retry ${payload.retry_index || payload.attempt || '?'} in ${payload.retry_after_seconds || '?'}s`;
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
        schema: env.schema || '',
        prod,
        producerInstance,
        gist,
        // Lane hint mirrors the prototype's demoFullSessionEnvelopes shape.
        lanes: (kind === EnvelopeKind.ToolCall || kind === EnvelopeKind.ToolResult) ? 'mt'
          : (kind === EnvelopeKind.Park || kind === 'TriggerFired' && payload.starts === 'park') ? ''
          : 'm',
        payload,
        content: [],
      };
    });
    const _evTexts = envelopes.map(e => (e.kind + ' ' + e.prod + ' ' + e.gist).toLowerCase());
    const findCount = !findQuery ? 'scope: ' + state.findScope + ' — click a lens to move it' : (FSTREAM ? _evTexts.filter(t => t.includes(findQuery)).length + ' matching events · scope: stream' : Object.keys(demoFindTranscriptText).filter(k => demoFindTranscriptText[k].toLowerCase().includes(findQuery)).length + ' matching lines · scope: transcript');
    const seqToTimeLabel = { 0: 't+0.0s', 1: 't+0.0s', 214: 't+0.0s', 215: 't+0.0s', 216: 't+0.0s', 242: 't+49s', 243: 't+49s', 244: 't+49s' };
    const formatElapsedTimeForSeq = (seq) => seqToTimeLabel[seq] || ('t+' + (seq < 222 ? '2' : seq < 227 ? '4' : seq < 232 ? '8' : seq < 237 ? '10' : '43') + 's');
    // LOW = runtime plumbing, hidden in `app`. Derived from envelopeKindColor by the
    // color rule: any envelope colored #62676f is plumbing. Kept as an
    // explicit set so a stray color change cannot silently move an
    // envelope into or out of the app view.
    const LOW = {
      TriggerFired: 1, ProducerStarted: 1, ProducerCompleted: 1,
      RunStarted: 1, RunFinalised: 1, TerminationMatched: 1,
      SessionStarted: 1, PromptFragment: 1, PromptComposed: 1,
    };
    const shownEV = state.level === RevealLevel.App ? envelopes.filter(e => !LOW[e.kind]) : envelopes;
    const selE = envelopes.find(e => e.seq === state.sel);
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
    // a delegation from the model: session_started, session_open,
    // tools_suite_fragment, per_turn_fragment, prompt_composer, the
    // tool_loop tools, session_end, session_warning — each renders as
    // a span in the delegation lane from its ProducerStarted to its
    // matching ProducerCompleted (paired by producer instance). Park
    // rides its own lane so the return-to-idle beat reads cleanly.
    const _lastSeq = envelopes.length ? envelopes[envelopes.length - 1].seq : 0;
    const _firstSeq = envelopes.length ? envelopes[0].seq : 0;
    const _endedSeq = (function () {
      for (const x of envelopes) if (x.kind === EnvelopeKind.SessionEnded) return x.seq;
      return _lastSeq;
    })();
    const spansByKind = { model: [], delegation: [], external: [] };
    if (envelopes.length) {
      spansByKind.model.push({
        start: _firstSeq, end: _endedSeq,
        color: '#3d5166', bright: '#82a5c8',
      });
    }
    const _calls = {};
    const _producerStarts = {}; // instance → {seq, kind} — non-park only
    // Park is a wait-shape on the External lifeline, not a producer
    // activation. It opens at TriggerFired(starts=park) and closes at
    // the next UserMessage — same round trip shape as ToolCall →
    // ToolResult on the Delegate lifeline.
    let _parkOpen = null;
    envelopes.forEach(e => {
      if (e.kind === 'ProducerStarted' && e.producerInstance && e.payload && e.payload.kind && e.payload.kind !== 'park') {
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
          color: '#4d6b6e', bright: '#7fb3b8', kind: started.kind, plumbing: true,
        });
      }
      if (e.kind === 'TriggerFired' && e.payload && e.payload.starts === 'park' && _parkOpen === null) {
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
          kind: c.tool || 'tool', plumbing: false,
        });
      }
    });
    // Live delegation producers still open — leading edge to last seq.
    // Park deliberately excluded: an unterminated park stays a dot,
    // not a bar smeared across the rest of the session.
    for (const inst of Object.keys(_producerStarts)) {
      const st = _producerStarts[inst];
      if (st.kind === 'model') continue;
      spansByKind.delegation.push({ start: st.seq, end: _lastSeq, color: '#4d6b6e', bright: '#7fb3b8', kind: st.kind, plumbing: true });
    }
    if (_parkOpen !== null) {
      spansByKind.external.push({ start: _parkOpen, end: _parkOpen, color: '#3d5166', bright: '#82a5c8', kind: 'park' });
    }
    // Fixed three-lifeline shape: model / delegate / external. No
    // sub-track packing — overlapping spans stack in the same lane
    // cell. Sub-track expansion under real concurrency remains a
    // design option (D29) but the daily-driver session topology
    // reads cleaner without it.
    const _laneFilter = (sp) => state.level === RevealLevel.App ? !sp.plumbing : true;
    const laneDefs = [
      { kind: 'model', label: 'model' },
      { kind: 'delegation', label: 'delegate' },
      { kind: 'external', label: 'external' },
    ].map(ld => ({
      ...ld,
      spans: (spansByKind[ld.kind] || []).filter(_laneFilter).slice().sort((a, b) => a.start - b.start),
    }));
    const kindOf = (e) => {
      // Three lifelines: model / delegate / external. Every envelope
      // belongs to one. A row's "own kind" decides which lane cell
      // renders bright.
      const pkind = (e.payload && e.payload.kind) || '';
      if (pkind === 'park' || e.kind === EnvelopeKind.Park) return 'external';
      if (e.kind === EnvelopeKind.UserMessage) return 'external';
      if (e.kind === EnvelopeKind.ToolCall || e.kind === EnvelopeKind.ToolResult) return 'delegation';
      if (pkind && pkind !== 'model') return 'delegation';
      if (e.kind === 'TriggerFired') {
        const starts = e.payload && e.payload.starts;
        if (starts === 'park') return 'external';
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
        if (starts === 'park') {
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
        if (pkind && pkind !== 'model' && pkind !== 'park') {
          const a = cx(laneIdx.delegation), b = cx(laneIdx.model);
          return { c: '#7fb3b8', l: Math.min(a, b), w: Math.abs(b - a), dot: b };
        }
        const b = cx(laneIdx.model);
        return { c: '#82a5c8', l: b, w: 0, dot: b };
      }
      // FinalAnswer, SessionEnded = moments on the model lifeline.
      if (e.kind === 'FinalAnswer' || e.kind === EnvelopeKind.SessionEnded) {
        const b = cx(laneIdx.model);
        return { c: '#82a5c8', l: 0, w: b, dot: b };
      }
      // Park envelope = the await moment inside the open park span.
      // Dot only, no line — the arrow lives on TriggerFired and on the
      // UserMessage that closes it.
      if (e.kind === EnvelopeKind.Park) {
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
    const _parkSeqs = envelopes.filter(e => e.kind === EnvelopeKind.Park).map(e => e.seq);
    if (_parkSeqs.length) {
      _sideLanes.push({
        label: 'park', color: '#82a5c8',
        segs: _parkSeqs.map(seq => segOf(Math.max(0, seq - 0.5), seq + 0.6, '#82a5c8', seq)),
      });
    }
    const sideLanes = _sideLanes;
    const modes = [['stream', 'stream+graph'], ['io', 'i/o'], ['structure', 'structure'], ['scene', 'scene']];
    // Direction (down/side) is a property of the stream lens; the
    // io/structure/scene lenses render their own layouts and the
    // direction toggle is not visible for them. Carrying `dir=Side`
    // through a mode switch leaves the shell in a state whose
    // affordance is hidden — the user sees a side-oriented layout
    // and no chip to change it. Reset `dir` to Down whenever the
    // user leaves stream.
    const modeChips = modes.map(([id, label]) => ({
      label,
      pick: () => this.setState(id === GraphMode.Stream ? { mode: id } : { mode: id, dir: GraphDirection.Down }),
      color: state.mode === id ? '#d7dade' : '#62676f', bg: state.mode === id ? '#2e3138' : 'transparent',
    }));
    // CMDS moved earlier — see the block above panes.map that
    // instantiates it once and hands each pane its own bound pick
    // callbacks. Two legacy references below are kept as no-ops so any
    // downstream reference does not crash; the real work lives per pane.
    const q = (fp && fp.pv ? fp.pv : (state.promptVal || '')).trim();
    const routerRows = q.startsWith('/') ? CMDS.filter(c => c[0].startsWith(q) || q === '/').map(c => ({
      cmd: c[0], desc: c[1],
      pick: c[2] ? (() => (c[2])(fp && fp.id ? fp.id : 1))
        : (() => this.setState(s => ({ panes: s.panes.map(x => x.id === (fp && fp.id ? fp.id : 1) ? Object.assign({}, x, { pv: c[0] + ' ' }) : x) }))),
    })) : [];
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
    const _labelStatus = (row) => row.status === 'live' ? '● running'
      : row.status === 'parked' ? '◐ parked'
      : row.status === 'interrupted' ? '! interrupted'
      : row.status === 'ended' ? '◇ ended'
      : '· ' + row.status;
    const _dotFor = (row) => row.status === 'live' ? '#7fb3b8'
      : row.status === 'parked' ? '#82a5c8'
      : row.status === 'interrupted' ? '#c26058'
      : '#4a4e55';
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
    for (const ws of _workspaces) {
      const isPerSessionRoot = ws.shape === 'per-session-sandboxes';
      const countKey = isPerSessionRoot ? '__PER_SESSION_SANDBOXES__' : ws.path;
      const totalInMemory = _countByCanonical.get(countKey) || 0;
      const paged = _pagedByWs[ws.path];
      const expanded = !!_expandedWs[ws.path];
      const shownRows = expanded && paged ? paged.rows : [];
      const total = paged ? paged.total : totalInMemory;
      _workspaceGroups.push({
        path: ws.path,
        shapeLabel: ws.shape === 'worktree' ? 'git · sessions get worktrees'
          : ws.shape === 'sandbox' ? 'sandbox'
          : ws.shape === 'per-session-sandboxes' ? 'per-session sandboxes · substrate-managed'
          : ws.shape,
        sessions: shownRows.map(_mapSession),
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
    // (_hasVmSession hoisted with _vmSnap at renderVals top.)
    const _vmTranscript = (_vmSnap && Array.isArray(_vmSnap.transcript)) ? _vmSnap.transcript : [];
    const _liveTranscriptRows = _vmTranscript.map(row => {
      let glyph = '·', glyphColor = '#4a4e55', textColor = '#9aa0a8', marginTop = '2px';
      if (row.role === TranscriptRole.User) { glyph = '›'; glyphColor = '#82a5c8'; textColor = '#e2e5e9'; marginTop = '12px'; }
      else if (row.role === TranscriptRole.Model) { glyph = '◆'; glyphColor = '#7fb3b8'; textColor = '#b9bec5'; marginTop = '6px'; }
      else if (row.role === TranscriptRole.Tool) {
        const failed = row.toolOk === false;
        glyph = failed ? '⚠' : '⚙';
        glyphColor = failed ? '#c26058' : '#62676f';
        textColor = failed ? '#c26058' : '#62676f';
      }
      else if (row.role === TranscriptRole.Park) { glyph = '◐'; glyphColor = '#82a5c8'; textColor = '#82a5c8'; marginTop = '10px'; }
      else if (row.role === TranscriptRole.Ended) { glyph = '◇'; glyphColor = '#62676f'; textColor = '#62676f'; marginTop = '10px'; }
      else if (row.role === TranscriptRole.Warning) { glyph = '!'; glyphColor = '#c26058'; textColor = '#c26058'; }
      return { glyph, glyphColor, textColor, marginTop, text: row.text || '' };
    });

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
      topoProducerRows: (_vmSnap && _vmSnap.topologyGraph && _vmSnap.topologyGraph.producers ? _vmSnap.topologyGraph.producers : []).map(p => ({
        name: p.kind,
        emits: (p.emits && p.emits.length ? p.emits.join(', ') : '(no emissions)'),
        initialTag: p.initial ? '▸ initial' : '',
      })),
      topoTriggerRows: (_vmSnap && _vmSnap.topologyGraph && _vmSnap.topologyGraph.triggers ? _vmSnap.topologyGraph.triggers : []).map(t => ({
        id: t.id, onKind: t.onKind, starts: t.starts,
      })),
      topoProducerCount: (_vmSnap && _vmSnap.topologyGraph && _vmSnap.topologyGraph.producers) ? _vmSnap.topologyGraph.producers.length : 0,
      topoTriggerCount: (_vmSnap && _vmSnap.topologyGraph && _vmSnap.topologyGraph.triggers) ? _vmSnap.topologyGraph.triggers.length : 0,
      topoAny: !!(_vmSnap && _vmSnap.topologyGraph && _vmSnap.topologyGraph.producers && _vmSnap.topologyGraph.producers.length),
      topoEmpty: !(_vmSnap && _vmSnap.topologyGraph && _vmSnap.topologyGraph.producers && _vmSnap.topologyGraph.producers.length),
      assaysEmpty: arms.length === 0,
      assaysAny: arms.length > 0,
      // Reveal view transcript reads the SAME rich rows the per-pane
      // terminal view reads. _liveBindingsFor already computes tool
      // cards, Markdown blocks, opacity from find, running seconds —
      // reuse it here for the focused pane so both views stay in sync.
      ...this._liveBindingsFor(fp.id, state),
      crumb: surf === Surface.Records ? fp.name + ' › records' : surf === Surface.Assay ? fp.name + ' › assays › rev_kimi_vs_glm' : surf === Surface.Studio ? fp.name + ' › studio' : descended ? fp.name + state.descent.map(k => ' › ⑂ ' + demoDescentChildren[k].name).join('') : fp.name,
      escHint: surf ? 'esc — back' : descended ? 'esc — up one level' : '',
      openRecords: () => this._toggleSurface('records'),
      openStudio: () => this._toggleSurface('studio'),
      openAssay: () => this.setState({ surface: Surface.Assay }),
      backToSession: () => this.setState({ surface: null }),
      extraSessions: (state.liveSessionsFromServer && state.liveSessionsFromServer.length
        ? state.liveSessionsFromServer.map(row => ({
            name: row.name || (row.sessionId || '').slice(0, 12),
            meta: (row.driver || '?') + ' · ' + row.status,
            where: 'open in a pane ▸',
          }))
        : (state.allSessions || []).map(x => { const open = state.panes.some(pp => pp.id === x.id); const nm = (state.panes.find(pp => pp.id === x.id) || x).name; return { name: nm, meta: x.driver + ' · worktree substrate/' + nm, where: open ? 'open in a pane ▸' : 'no pane — still yours' }; })
      ),
      fpDdOpen: state.ddFor === fp.id && state.revealed, fpToggleDd: () => {
        // Sprint 085 followup — freeze picker once the focused pane's
        // session is bound. Same reason as the per-pane toggle above.
        const focusedSnap = (state.controllerSnapshots || {})[fp.id];
        if (focusedSnap && focusedSnap.sessionId) return;
        this.setState(s => ({ ddFor: s.ddFor === fp.id ? null : fp.id, wsFor: null }));
      },
      fpWsOpen: state.wsFor === fp.id && state.revealed, fpToggleWs: () => this.setState(s => ({ wsFor: s.wsFor === fp.id ? null : fp.id, ddFor: null })),
      fpDriverOpts: (() => {
        const groups = (state.driverGroups && state.driverGroups.length)
          ? state.driverGroups
          : [{ label: '', entries: (state.driverRoster && state.driverRoster.length) ? state.driverRoster : ['deterministic'] }];
        const items: Array<{ label: string; color: string; isHeader: boolean; notHeader: boolean; pick: () => void }> = [];
        const noop = () => undefined;
        for (const grp of groups) {
          if (grp.label) items.push({ label: grp.label, color: '#62676f', isHeader: true, notHeader: false, pick: noop });
          for (const m of grp.entries) {
            items.push({
              label: m,
              color: m === fp.driver ? '#e2e5e9' : '#9aa0a8',
              isHeader: false, notHeader: true,
              pick: () => {
                this.setState(s => ({ ddFor: null, panes: s.panes.map(x => x.id === fp.id ? Object.assign({}, x, { driver: m }) : x) }));
                const vm = window.__vm;
                if (vm) vm.pickDriver(m);
              },
            });
          }
        }
        return items;
      })(),
      recordsColor: surf === Surface.Records ? '#e2e5e9' : '#9aa0a8',
      studioColor: surf === Surface.Studio ? '#e2e5e9' : '#9aa0a8',
      showTerminal: !surf && !state.revealed, showRevealed: !surf && state.revealed,
      showRecords: surf === Surface.Records, showAssay: surf === Surface.Assay, showStudio: surf === Surface.Studio,
      toggleReveal: () => { if (this.state.panes.some(p => p.unbound)) return; this.setState(s => ({ revealed: !s.revealed, surface: null })); },
      revealLabel: state.revealed ? '⌃` terminal' : '⌃` reveal',
      revealBtnColor: state.revealed && !surf ? '#212327' : '#9aa0a8', revealBtnBg: state.revealed && !surf ? '#82a5c8' : '#3d434c',
      fontSize: state.fontOverride ?? this.props.transcriptFontSize ?? 13,
      childOpen: state.childOpen, toggleChild: () => this.setState(s => ({ childOpen: !s.childOpen })),
      descendReviewer: (ev) => { ev.stopPropagation(); this.setState({ descent: ['reviewer-a'], descPv: '', surface: null }); },
      swallow: (ev) => ev.stopPropagation(),
      childHint: state.childOpen ? '▾' : '· answered ▸',
      // Reveal view's single-pane prompt row (reveal.html:345). Bound
      // to the focused pane's pv, so the same field the terminal-view
      // pane input mutates is what the reveal-view input shows.
      promptVal: (fp && fp.pv) || '',
      onPrompt: (ev) => {
        const paneId = (fp && fp.id) || 1;
        const val = ev.target.value;
        this.setState(s => ({ panes: s.panes.map(x => x.id === paneId ? Object.assign({}, x, { pv: val }) : x) }));
      },
      routerOpen: routerRows.length > 0, routerRows,
      promptRadius: routerRows.length > 0 ? '0 0 6px 6px' : '6px',
      streamRef: (el) => { this._streamEl = el; },
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
      isDown: state.dir === GraphDirection.Down, isSide: state.dir === GraphDirection.Side,
      setAll: () => this.setState({ level: RevealLevel.All }), setApp: () => this.setState({ level: RevealLevel.App }),
      allColor: state.level === RevealLevel.All ? '#d7dade' : '#62676f', allBg: state.level === RevealLevel.All ? '#2e3138' : 'transparent',
      appColor: state.level === RevealLevel.App ? '#d7dade' : '#62676f', appBg: state.level === RevealLevel.App ? '#2e3138' : 'transparent',
      setDown: () => this.setState({ dir: GraphDirection.Down }), setSide: () => this.setState({ dir: GraphDirection.Side }),
      downColor: state.dir === GraphDirection.Down ? '#d7dade' : '#62676f', downBg: state.dir === GraphDirection.Down ? '#2e3138' : 'transparent',
      sideColor: state.dir === GraphDirection.Side ? '#d7dade' : '#62676f', sideBg: state.dir === GraphDirection.Side ? '#2e3138' : 'transparent',
      selSeq: selE ? selE.seq : 0, selKind: selE ? selE.kind : '', selSchema: selE ? selE.schema : '',
      selTime: selE ? formatElapsedTimeForSeq(selE.seq) + ' into turn 9' : '', selProducer: selE ? selE.prod : '',
      selColor: selE ? (envelopeKindColor[selE.kind] || '#9aa0a8') : '#9aa0a8',
      selContent: selE ? selE.content : [], selPayload: selE ? JSON.stringify(selE.payload, null, 1) : '',
      // IO lens: the application-visible input/output documents on
      // the record, in seq order. Always real; empty when no session
      // has spoken yet.
      ioDocs: _liveEnvelopes
        .filter((env) => env && env.payload && (
          env.kind === EnvelopeKind.UserMessage || env.kind === EnvelopeKind.ModelReply
          || env.kind === 'FinalAnswer' || env.kind === EnvelopeKind.ToolResult))
        .map((env) => {
          const p = env.payload || {};
          const text = env.kind === EnvelopeKind.ToolResult
            ? (typeof p.output === 'string' ? p.output
                : (p.output && (p.output.stdout || p.output.text || JSON.stringify(p.output))) || '')
            : String(p.text || p.assembled_prompt || '');
          const label = env.kind === EnvelopeKind.UserMessage ? 'UserMessage · input'
            : env.kind === EnvelopeKind.ModelReply ? 'ModelReply · output'
            : env.kind === 'FinalAnswer' ? 'FinalAnswer · output'
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
      sentLines: (fp && fp.sent) ? fp.sent.map(t => ({ text: t })) : [],
      onPromptKey: (ev) => {
        if (ev.key !== 'Enter') return;
        const paneId = (fp && fp.id) || 1;
        const pane = this.state.panes.find(x => x.id === paneId);
        const v = ((pane && pane.pv) || '').trim();
        if (!v) return;
        this.setState(s => ({ panes: s.panes.map(x => x.id === paneId ? Object.assign({}, x, { pv: '' }) : x) }));
        const vm = window.__vm;
        if (vm && typeof vm.setActive === 'function') vm.setActive(paneId);
        const controller = vm && typeof vm.get === 'function' ? vm.get(paneId) : null;
        if (controller && typeof controller.submitLine === 'function') controller.submitLine(v);
        else if (vm && typeof vm.submitLine === 'function') vm.submitLine(v);
      },
      panes, paneCols: state.colW.map(w => w.toFixed(3) + 'fr').join(' '), paneRows: state.rowW.map(w => w.toFixed(3) + 'fr').join(' '), focusedName: fp.name, focusedId: fp.id, fpLines: fp.lines || [],
      revealFlexL: state.revealL.toFixed(3) + ' 1 0%',
      revealGutterLeft: (state.revealL / (state.revealL + 1) * 100).toFixed(2) + '%',
      revealGrab: (ev) => { ev.preventDefault(); this._gut = { type: 'reveal' }; },
      colGutters: state.colW.slice(0, -1).map((_, i) => { const total = state.colW.reduce((a, b) => a + b, 0); const left = state.colW.slice(0, i + 1).reduce((a, b) => a + b, 0) / total * 100; return { left: left.toFixed(2) + '%', grab: (ev) => { ev.preventDefault(); this._gut = { type: 'col', i: i + 1 }; } }; }),
      rowGutters: state.rowW.slice(0, -1).map((_, i) => { const total = state.rowW.reduce((a, b) => a + b, 0); const top = state.rowW.slice(0, i + 1).reduce((a, b) => a + b, 0) / total * 100; return { top: top.toFixed(2) + '%', grab: (ev) => { ev.preventDefault(); this._gut = { type: 'row', i: i + 1 }; } }; }), focusedBranch: fp.shape === 'worktree' ? 'substrate/' + (fp.name || 'main') : (fp.ws || ''),
      focusedWorkspace: fp.ws || '~/.substrate/sandbox',
      focusedShape: fp.shape || 'sandbox',
      // Every pane's reveal view renders the full machinery lens now
      // that every pane has its own controller. The old
      // notMainFocused branch showed only the scripted pane.lines and
      // is dead.
      isMainFocused: true, notMainFocused: false,
      singlePane: state.panes.length === 1,
      showStrip: !surf && !state.revealed && state.panes.length > 1,
      showFullHeader: !!surf || state.revealed,
      splitRight: () => this._split('right'),
      driverName: fp.driver || state.driverDefault || 'deterministic', driverOpen: state.driverOpen,
      toggleDriverMenu: () => this.setState(s => ({ driverOpen: !s.driverOpen, wsOpen: false })),
      driverOptions: ['kimi-k2', 'deepseek-r1:8b', 'qwen3-coder:480b-cloud', 'nemotron-3-super', 'claude (cli)', 'gemini (cli)', 'deterministic'].map(m => ({
        label: m, color: m === fp.driver ? '#e2e5e9' : '#9aa0a8',
        pick: () => this.setState(s => ({ driverOpen: false, panes: s.panes.map(x => x.id === s.focused ? Object.assign({}, x, { driver: m }) : x) })),
      })),
      wsOpen: state.wsOpen, toggleWs: () => this.setState(s => ({ wsOpen: !s.wsOpen, driverOpen: false })),
      nsOpen: state.nsOpen, openNs: () => this.setState({ nsOpen: true, driverOpen: false, wsOpen: false }),
      closeNs: () => this.setState({ nsOpen: false, nsStatus: '' }),
      nsName: state.nsName, updNsName: (ev) => this.setState({ nsName: ev.target.value }),
      nsWorkspace: state.nsWorkspace, updNsWorkspace: (ev) => this.setState({ nsWorkspace: ev.target.value }),
      nsShape: (() => { const w = state.nsWorkspace.trim(); if (!w) return 'sandbox — ~/.substrate/sessions/<id>/workspace/'; return 'plain directory → flat (same tree, same reflexes)'; })(),
      nsIsolate: state.nsIsolate, toggleNsIsolate: () => this.setState(s => ({ nsIsolate: !s.nsIsolate })),
      nsIsoBox: state.nsIsolate ? '#82a5c8' : 'transparent', nsIsoBorder: state.nsIsolate ? '#82a5c8' : '#4a4e55',
      nsStatus: state.nsStatus, nsStatusColor: state.nsStatus.startsWith('created') ? '#82a5c8' : '#9aa0a8',
      createNs: () => { const w = this.state.nsWorkspace.trim(); if (w && !w.startsWith('/') && !w.startsWith('~')) { this.setState({ nsStatus: 'workspace must be an absolute path (or blank for the sandbox)' }); return; } this.setState({ nsStatus: 'created (prototype — the real app POSTs /api/session and the rail picks it up)' }); },
      logoDot: state.ended ? '#4a4e55' : '#62676f', // session status (D31); gray once finalised
      footRecord: descended ? 'record ' + dChild.rec + ' · ⑂ depth ' + state.descent.length + '/2' : mainFocused ? (state.ended ? 'record 01M1684 · 246 events · finalised' : 'record 01M1684 · 244 events') : fp.unbound ? 'unbound — pick a workspace' : 'record ' + fp.name + ' · 2 events',
      footHint: surf ? 'esc back to session' : descended ? 'esc climbs one level' : '⌃` toggles the reveal',
      footStatus: (this.props.simulateRateLimit ?? false) ? '◌ rate-limited · retry 3/6 in 14s' : state.ended ? '● finalised · ✓ clean' : '● live · clean',
      footStatusColor: (this.props.simulateRateLimit ?? false) ? '#7fb3b8' : state.ended ? '#62676f' : '#82a5c8',
      // ── descend (turn 20) ──
      descended, notDescended: !descended, descLines, descCrumbs, descAncestors,
      descHead: dChild ? dChild.head : '', descColor: dColor,
      descTalkable: descended && dChild.talkable, descNotTalkable: descended && !dChild.talkable,
      descWatchNote: dChild && !dChild.talkable ? '· watching' : '',
      nestedOn: state.nestedDescent && descended, descBorder: state.nestedDescent && descended ? '2px solid ' + dColor : 'none', descPad: state.nestedDescent && descended ? '16px' : '0',
      descEscHint: 'esc back to ' + (state.descent.length > 1 ? '⑂ ' + demoDescentChildren[state.descent[state.descent.length - 2]].name : 'session'),
      descPlaceholder: dChild ? 'message ' + dChild.name + (dChild.talkable ? ' — delivers at its next park · / commands' : '') : '',
      descPv: state.descPv, onDescPv: (ev) => this.setState({ descPv: ev.target.value }),
      onDescPvKey: (ev) => { if (ev.key !== 'Enter') return; const v = this.state.descPv.trim(); if (!v) return; const k = descTop;
        this.setState(st => ({ descPv: '', descExtra: Object.assign({}, st.descExtra, { [k]: [...(st.descExtra[k] || []), { t: '› ' + v, c: '#e2e5e9' }, { t: 'queued — delivers at the child\u2019s next park (prototype; needs park/resume wiring in the child topology, D70)', c: '#4a4e55' }] }) })); },
      // ── fan-out (20g) ──
      fanOpen: state.fanOpen, toggleFan: () => this.setState(st => ({ fanOpen: !st.fanOpen })),
      fanHint: state.fanOpen ? '▾' : '· expand ▸', fanRows,
      // ── find (19k/19l) ──
      findOpen: state.findOpen, findQ: state.findQ, onFindQ: (ev) => this.setState({ findQ: ev.target.value }), findCount,
      focusTranscript: () => { if (this.state.findScope !== 'transcript') this.setState({ findScope: 'transcript' }); },
      focusStream: () => { if (this.state.findScope !== 'stream') this.setState({ findScope: 'stream' }); },
      closeFind: () => this.setState({ findOpen: false, findQ: '' }),
      fdIntro: fdOf('fdIntro'), fdU1: fdOf('fdU1'), fdGrep: fdOf('fdGrep'), fdRead: fdOf('fdRead'), fdEdit: fdOf('fdEdit'), fdU2: fdOf('fdU2'), fdDel: fdOf('fdDel'), fdBash: fdOf('fdBash'), fdAns: fdOf('fdAns'), fdPark: fdOf('fdPark'),
      // ── dialogs (19c/19f/19g) ──
      showSettings: state.showSettings, closeSettings: () => this.setState({ showSettings: false, settingsNote: '' }),
      themeChips: ['dark', 'light', 'system'].map(t => ({ label: t, color: state.theme === t ? '#e2e5e9' : '#62676f', bg: state.theme === t ? '#2e3138' : 'transparent',
        pick: () => this.setState({ theme: t, settingsNote: t === 'dark' ? '' : 'noted — the light theme ships with the build; the prototype renders dark' }, this._persistSettings) })),
      settingsNote: state.settingsNote,
      fontLabel: (state.fontOverride ?? this.props.transcriptFontSize ?? 13) + 'px',
      fontMinus: () => this.setState(st => ({ fontOverride: Math.max(9, (st.fontOverride ?? this.props.transcriptFontSize ?? 13) - 1) }), this._persistSettings),
      fontPlus: () => this.setState(st => ({ fontOverride: Math.min(19, (st.fontOverride ?? this.props.transcriptFontSize ?? 13) + 1) }), this._persistSettings),
      nestedBox: state.nestedDescent ? '#82a5c8' : 'transparent', nestedBorder: state.nestedDescent ? '#82a5c8' : '#4a4e55',
      toggleNested: () => this.setState(st => ({ nestedDescent: !st.nestedDescent }), this._persistSettings),
      showExport: state.showExport, closeExport: () => this.setState({ showExport: false }), doExport: () => this.setState({ showExport: false }),
      showEndConfirm: state.showEndConfirm, closeEndConfirm: () => this.setState({ showEndConfirm: false }),
      doEndSession: async () => {
        // D68: a LIVE session (turn in flight) interrupts the turn
        // first, then ends. Connection == 'connected' with a park
        // reason still unset means a turn is running.
        this.setState({ showEndConfirm: false, descent: [] });
        const vm = window.__vm;
        if (!vm) return;
        const snap = vm.snapshot ? vm.snapshot() : null;
        const isLive = !!(snap && snap.sessionId && snap.connection === 'connected' && !snap.parkReason && !snap.endedReason);
        if (isLive && typeof vm.interruptTurn === 'function') {
          try { await vm.interruptTurn(); } catch (_e) { /* proceed to end regardless */ }
        }
        vm.endSession('user_end');
      },
      isEnded: state.ended,
      simRL: this.props.simulateRateLimit ?? false,
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
