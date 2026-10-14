// web/vm/session_controller.ts — the Presentation Model.
//
// One class holds the state and behavior every substrate-ui shell needs.
// Views subscribe to snapshot updates and call actions; nothing else.
// No DOM, no dc-runtime, no framework primitives — Views come and go, the
// controller stays.
//
// Corresponds to Fowler's Presentation Model / MVVM's ViewModel / Cockburn's
// hexagonal core. The `SubstrateClient` port keeps the transport swappable.

import type {
  BackgroundTaskRow,
  RunRow,
  BundleRow,
  ConnectionState,
  LanguageView,
  ProducerNode,
  RecordEnvelope,
  Snapshot,
  SessionRow,
  TopologyGraph,
  TranscriptRow,
  TriggerEdge,
  WorkspaceRow,
} from "./types";
import type { SubstrateClient, Unsubscribe } from "./client";
import { emit as sddEmit } from "./instrumentation/sdd";
import { EnvelopeKind } from "./kinds";
import { setToolOutputMode, toggleToolOutputMode } from "./tool_output_mode";
import { SessionStatus, TaskStatus } from "./statuses.gen";
import { GUIDANCE_LEVEL_BUNDLES, LENGTH_DEFAULT, LengthPosition, TONE_DEFAULT, TonePosition } from "./controls.gen";
import type { EnvelopeKindValue } from "./kinds";

/** One slash command (UI sprint 162). */
interface SlashCommand {
  names: string[];
  usage: string;
  about: string;
  choices?: readonly string[];
  current?: () => string;
  run: (rest: string) => Promise<void> | void;
}

/** A slash command as the menu reads it. */
export interface SlashCatalogEntry {
  name: string;
  aliases: string[];
  usage: string;
  about: string;
  choices: string[] | null;
  current: string | null;
}

// Sprint 096 — every generated envelope kind must be classified here: `rendered` (handleEnvelope
// has a case that shows it) or `ignored` (bookkeeping the transcript does not show). The Record
// type makes tsc fail when the generator adds a kind this table does not name (TypeScript
// Handbook, exhaustiveness checking).
// Park.reason values on records before vocabulary v0.3, read as Returned.reason (§ K.3).
const LEGACY_PARK_REASONS: Record<string, string> = { final_answer: "replied", interrupt: "interrupted" };
// SessionEnded.reason on records before kernel K264: the turn cap wrote "timeout" (vocabulary.py
// LEGACY_SESSION_END_REASONS).
const LEGACY_SESSION_END_REASONS: Record<string, string> = { timeout: "turn_cap" };

const KIND_DISPOSITION: Record<EnvelopeKindValue, "rendered" | "ignored"> = {
  [EnvelopeKind.SessionStarted]: "rendered",
  [EnvelopeKind.BackgroundTaskEnded]: "rendered",
  // Kernel K314-K319 (vocabulary v0.12 § X): a run in the caller's record, and a run's own card,
  // checks, report and pauses in its pane.
  [EnvelopeKind.TopologyRunStarted]: "rendered",
  [EnvelopeKind.TopologyRunEnded]: "rendered",
  [EnvelopeKind.CardAccepted]: "rendered",
  [EnvelopeKind.ChecksRun]: "rendered",
  [EnvelopeKind.ReportWritten]: "rendered",
  [EnvelopeKind.RunPaused]: "rendered",
  [EnvelopeKind.RunResumed]: "rendered",
  [EnvelopeKind.SessionChanged]: "rendered",
  // Kernel K282, UI sprint 129: a harness driver's tool calls, drawn as tool cards.
  [EnvelopeKind.HarnessToolCall]: "rendered",
  [EnvelopeKind.HarnessToolResult]: "rendered",
  [EnvelopeKind.UserMessage]: "rendered",
  [EnvelopeKind.ModelReply]: "rendered",
  [EnvelopeKind.FinalAnswer]: "rendered",
  [EnvelopeKind.ToolCall]: "rendered",
  [EnvelopeKind.ToolProgress]: "rendered",
  [EnvelopeKind.ToolResult]: "rendered",
  [EnvelopeKind.Park]: "rendered",
  [EnvelopeKind.Returned]: "rendered",
  [EnvelopeKind.SessionEnded]: "rendered",
  [EnvelopeKind.SessionWarning]: "rendered",
  [EnvelopeKind.TranscriptCompacted]: "rendered",
  [EnvelopeKind.InputBuildFailed]: "rendered",
  [EnvelopeKind.RunFinalised]: "rendered",
  [EnvelopeKind.PredicateQuarantined]: "rendered",
  [EnvelopeKind.ProducerEmittedInvalidEvent]: "rendered",
  // ProducerFailed: a model failure reaches the user as Returned{reason: model_error, detail}.
  [EnvelopeKind.ProducerFailed]: "ignored",
  // ProducerCancelled: an interrupt reaches the user as Returned{reason: interrupted}.
  [EnvelopeKind.ProducerCancelled]: "ignored",
  [EnvelopeKind.PromptFragment]: "ignored",
  [EnvelopeKind.PromptComposed]: "ignored",
  // Kernel K310 (vocabulary § W): measurements of the turn, not part of the conversation.
  [EnvelopeKind.LanguageProfile]: "ignored",
  [EnvelopeKind.LanguageDrift]: "ignored",
  [EnvelopeKind.InterruptRequested]: "ignored",
  [EnvelopeKind.SessionEndRequested]: "ignored",
  [EnvelopeKind.RunStarted]: "ignored",
  [EnvelopeKind.TriggerFired]: "ignored",
  [EnvelopeKind.ProducerStarted]: "ignored",
  [EnvelopeKind.ProducerCompleted]: "ignored",
  [EnvelopeKind.TerminationMatched]: "ignored",
  [EnvelopeKind.InjectionApplied]: "ignored",
};
const KIND_DISPOSITION_BY_VALUE: Record<string, string> = KIND_DISPOSITION;

type Listener = (snap: Snapshot) => void;

/** One typed signal the controller emits at a named call site. */
export interface ControllerEvent {
  tag: string;
  payload: Record<string, unknown>;
  at: number;
}

type EventListener = (ev: ControllerEvent) => void;

/** Session-create body per POST /api/session (piece B). */
export interface OpenSessionRequest {
  driver?: string;
  driverParams?: Record<string, unknown>;
  workspace?: string;
  workspaceShape?: string;
  bundle?: string;
  tools?: string[];
  name?: string;
  isolate?: boolean;
  /** UI sprint 143 (kernel K296): the Length and Tone positions; absent is the default. */
  length?: string;
  tone?: string;
}

/** ACK shape POST /api/session returns; only fields the controller reads. */
interface OpenSessionAck {
  session_id: string;
  name?: string | null;
  bundle?: string | null;
  workspace?: string | null;
  workspace_shape?: string | null;
  driver_params?: Record<string, unknown> | null;
  length?: string | null;
  tone?: string | null;
}

interface ModelsRoster {
  models: string[];
  default: string;
  cli?: string[];
  cli_login_supported?: string[];
  cli_versions?: Record<string, {
    families: { id: string; label: string; default_pin: string | null; pins: { id: string; label: string }[] }[];
    default_family: string | null;
  }>;
  ollama_cloud?: string[];
  ollama_local?: string[];
  testing?: string[];
}

interface SessionBuckets {
  live: RawSession[];
  parked: RawSession[];
  interrupted: RawSession[];
  ended: RawSession[];
}

interface RawSession {
  session_id: string;
  name?: string | null;
  driver?: string | null;
  workspace?: string | null;
  workspace_shape?: string | null;
  created_at?: number | null;
}

interface RecentWorkspaceRow {
  path: string;
  shape: string;
}

interface RawBundleRow {
  name: string;
  description?: string | null;
  slot_count?: number | null;
}

const EMPTY_SNAPSHOT: Snapshot = {
  sessionId: null,
  sessionName: null,
  driver: null,
  // Sprint 054: default to substrate's shipped `session` bundle so every
  // reveal-shell session opens with the bundle's system-prompt fragments
  // wired. `substrate/bundles.py` line 72 declares this as the canonical
  // daily-driver bundle. Callers can still override via openSession({bundle}).
  // UI sprint 132: no bundle picked means "auto": the daemon gives the session its model's
  // default guidance level.
  bundleSlug: null,
  length: null,
  tone: null,
  workspacePath: null,
  workspaceShape: null,
  turnIndex: 0,
  transcript: [],
  parkReason: null,
      turnFailure: null,
      backgroundTasks: [],
      runs: [],
      viewOnly: null,
  language: null,
  languageOff: false,
  languageClearedSeq: -1,
  languageOpenTick: 0,
  endedReason: null,
  driverRoster: [],
  driverDefault: null,
  driverGroups: [],
  cliVersions: null,
  driverVersion: {},
  liveSessions: [],
  recentWorkspaces: [],
  bundleRoster: [],
  connection: "idle",
  lastError: null,
  topologyGraph: null,
  rawEnvelopes: [],
  progressByCallId: {},
};

export class SessionController {
  private snap: Snapshot = { ...EMPTY_SNAPSHOT };
  private readonly listeners = new Set<Listener>();
  private readonly eventListeners = new Set<EventListener>();
  private unsubscribeStream: Unsubscribe | null = null;
  private lastSeq = -1;
  /** callId → callKey of the ToolCall currently open under that id (UI sprint 101). */
  private openCallKey = new Map<string, string>();
  /** UI sprint 129: a harness call's tool name by call id, for its result row. */
  private harnessToolNames = new Map<string, string>();
  /** UI sprint 105: the refresh timer that runs while a background task is running. */
  private tasksTimer: ReturnType<typeof setTimeout> | null = null;
  private runsTimer: ReturnType<typeof setTimeout> | null = null;
  private languageTimer: ReturnType<typeof setTimeout> | null = null;
  /** Numbers each language fetch; only the latest one's view is applied. */
  private languageRequest = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private endedEmittedFor: string | null = null;
  // The last compaction cut shown, so a repeated cut adds no row (session vocabulary § S.4).
  private lastCompactionCut: string | null = null;
  /** Sprint 085 followup — subset of driverGroups.cli that the
   *  AuthPromptCard supports (server sends cli_login_supported).
   *  pickDriver only fires the card for names in this list. */
  private cliLoginSupported: string[] = [];

  constructor(private readonly client: SubstrateClient) {}

  // ── read side ────────────────────────────────────────────────────────
  snapshot(): Snapshot { return this.snap; }

  subscribe(listener: Listener): Unsubscribe {
    this.listeners.add(listener);
    listener(this.snap);
    return () => { this.listeners.delete(listener); };
  }

  /** Subscribe to typed events (`SESSION_OPEN_ACKED`,
   * `TURN_SUBMITTED`, etc.). Every shell that forwards to an SDD sink
   * plugs in here. Every emission fires at exactly one call site. */
  onEvent(listener: EventListener): Unsubscribe {
    this.eventListeners.add(listener);
    return () => { this.eventListeners.delete(listener); };
  }

  private emit(tag: string, payload: Record<string, unknown> = {}): void {
    // Validate against the locked vocabulary at the speaker's mouth.
    // Unknown tag or missing required payload field throws — the whole
    // point of the lock.
    sddEmit(tag, payload);
    const event: ControllerEvent = { tag, payload, at: Date.now() };
    for (const listener of this.eventListeners) listener(event);
  }

  // ── boot loaders ────────────────────────────────────────────────────
  async loadDriverRoster(): Promise<void> {
    const result = await this.client.fetchJson<ModelsRoster>("/api/models");
    if (!result.ok) { this.patch({ lastError: `driver_roster: ${result.detail}` }); return; }
    // `deterministic` is a dev/CI stand-in with no reasoning ability;
    // it does not belong in a user-facing driver picker. It stays
    // available server-side for harness pins (?driver=deterministic).
    const rawModels = Array.isArray(result.data.models) ? result.data.models : [];
    const roster = rawModels.filter((m) => m !== "deterministic");
    const rawDefault = typeof result.data.default === "string" ? result.data.default : null;
    const defaultDriver = rawDefault === "deterministic" ? (roster[0] ?? null) : rawDefault;
    // Sprint 084 — grouped roster for the sectioned picker. Server returns
    // cli / ollama_cloud / ollama_local / testing arrays alongside the flat
    // `models` list. Groups render as headers in the dropdown; empty groups
    // drop out. Legacy `driverRoster` stays flat for pickDriver + other
    // consumers that expect a bare list.
    const cli = Array.isArray(result.data.cli) ? result.data.cli : [];
    const cliLoginSupported = Array.isArray(result.data.cli_login_supported)
      ? result.data.cli_login_supported : cli;
    const ollamaCloud = Array.isArray(result.data.ollama_cloud) ? result.data.ollama_cloud : [];
    const ollamaLocal = Array.isArray(result.data.ollama_local) ? result.data.ollama_local : [];
    const driverGroups = [
      { label: "cli agents", entries: cli },
      { label: "ollama · cloud", entries: ollamaCloud },
      { label: "ollama · local", entries: ollamaLocal },
    ].filter((grp) => grp.entries.length > 0);
    this.cliLoginSupported = cliLoginSupported;
    // Sprint 087 — per-CLI curated version catalog. Only CLIs installed
    // on this box (and thus present in `cli`) appear here.
    const cliVersions = (result.data.cli_versions && typeof result.data.cli_versions === "object")
      ? result.data.cli_versions
      : null;
    this.patch({ driverRoster: roster, driverDefault: defaultDriver, driverGroups, cliVersions });
    this.emit("DRIVER_ROSTER_LOADED", { count: roster.length, default: defaultDriver });
  }

  /** Sprint 087 — record which model version to run for a CLI. The
   *  choice is scoped by CLI name because two CLIs may share a version
   *  id ("gpt-5" is a codex value AND a cursor-agent value). openSession
   *  reads snap.driverVersion[driver] and folds it into
   *  driver_params.driver_version. Passing null clears the pick and the
   *  server falls back to the CLI's default_version. */
  pickDriverVersion(driver: string, versionId: string | null): void {
    const next = { ...this.snap.driverVersion };
    if (versionId == null) delete next[driver];
    else next[driver] = versionId;
    this.patch({ driverVersion: next });
    this.emit("DRIVER_VERSION_PICKED", { driver, version: versionId });
  }

  async loadLiveSessions(): Promise<void> {
    const result = await this.client.fetchJson<SessionBuckets>("/api/session");
    if (!result.ok) { this.patch({ lastError: `sessions: ${result.detail}` }); return; }
    const rows: SessionRow[] = [];
    for (const s of result.data.live ?? []) rows.push(rowFrom(s, "live"));
    for (const s of result.data.parked ?? []) rows.push(rowFrom(s, "parked"));
    for (const s of result.data.interrupted ?? []) rows.push(rowFrom(s, "interrupted"));
    for (const s of result.data.ended ?? []) rows.push(rowFrom(s, "ended"));
    this.patch({ liveSessions: rows });
    this.emit("SESSIONS_LOADED", { count: rows.length });
  }

  /** Fetch the record's topology graph off /api/records/<name>/topology_graph.
   * `recordName` is `s_<session_id>` for a session record. Silent 404
   * leaves `topologyGraph` at its previous value. */
  async loadTopologyGraph(recordName: string): Promise<void> {
    if (!recordName) return;
    const result = await this.client.fetchJson<Record<string, unknown>>(
      `/api/records/${encodeURIComponent(recordName)}/topology_graph`,
    );
    if (!result.ok) { return; }
    const raw = result.data ?? {};
    const producersRaw = Array.isArray((raw as { producers?: unknown[] }).producers)
      ? ((raw as { producers: unknown[] }).producers) : [];
    const triggersRaw = Array.isArray((raw as { triggers?: unknown[] }).triggers)
      ? ((raw as { triggers: unknown[] }).triggers) : [];
    const producers: ProducerNode[] = producersRaw.map((p) => {
      const row = p as { kind?: string; emits?: string[]; initial?: boolean; is_initial?: boolean; deterministic?: boolean };
      return {
        kind: String(row.kind ?? "?"),
        emits: Array.isArray(row.emits) ? row.emits.map((e) => String(e)) : [],
        // Server uses `is_initial`; older shapes used `initial`. Accept both.
        initial: !!(row.is_initial ?? row.initial),
        deterministic: !!row.deterministic,
      };
    });
    const triggers: TriggerEdge[] = triggersRaw.map((t, idx) => {
      const row = t as { id?: string; on?: string | string[]; on_kind?: string; kind?: string; starts?: string; policy?: string };
      // Server sends `on` as an array of event kinds (`["substrate.RunStarted"]`).
      // Older shapes used a scalar `on_kind`. Handle both.
      let onKind: string;
      if (Array.isArray(row.on)) onKind = row.on.join(", ");
      else if (typeof row.on === "string") onKind = row.on;
      else if (typeof row.on_kind === "string") onKind = row.on_kind;
      else onKind = String(row.kind ?? "?");
      return {
        id: String(row.id ?? `trigger_${idx}`),
        onKind,
        on: Array.isArray(row.on) ? row.on.map((k) => String(k)) : onKind.split(", ").filter(Boolean),
        starts: String(row.starts ?? "?"),
        policy: String(row.policy ?? ""),
      };
    });
    const strings = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);
    const views = strings((raw as { views?: unknown }).views);
    const termination = strings((raw as { termination?: unknown }).termination);
    const routesRaw = (raw as { routes?: unknown }).routes;
    const routes = (Array.isArray(routesRaw) ? routesRaw : []).map((r) => {
      const row = r as { id?: string; slot?: string };
      return { id: String(row.id ?? "?"), slot: String(row.slot ?? "?") };
    });
    const outside = strings((raw as { outside?: unknown }).outside);
    const exports = strings((raw as { exports?: unknown }).exports);
    const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {});
    const baseline = obj((raw as { baseline?: unknown }).baseline);
    const config = obj((raw as { config?: unknown }).config);
    this.patch({ topologyGraph: { producers, triggers, views, termination, routes, outside, exports, baseline, config } });
    this.emit("TOPOLOGY_LOADED", { producer_count: producers.length, trigger_count: triggers.length });
  }

  async loadRecentWorkspaces(): Promise<void> {
    const result = await this.client.fetchJson<RecentWorkspaceRow[]>("/api/workspaces");
    if (!result.ok) {
      // /api/workspaces is optional on the server side; a 404 leaves the
      // recentWorkspaces empty rather than surfacing an error.
      return;
    }
    const rows: WorkspaceRow[] = Array.isArray(result.data)
      ? result.data.filter((r): r is RecentWorkspaceRow => !!r && typeof r.path === "string")
        .map((r) => ({ path: r.path, shape: r.shape ?? "flat" }))
      : [];
    this.patch({ recentWorkspaces: rows });
    this.emit("WORKSPACES_LOADED", { count: rows.length });
  }

  /** Sprint 086 — POST /api/workspaces {path}. Server appends the path
   *  to ~/.substrate/recent-workspaces.json (LRU, dedup) after classifying
   *  its shape. Response carries the fresh workspace list, which this
   *  patches into snapshot.recentWorkspaces on success. */
  async addWorkspace(path: string): Promise<void> {
    const result = await this.client.fetchJson<{ ok: boolean; workspaces?: RecentWorkspaceRow[] }>(
      "/api/workspaces", { method: "POST", body: JSON.stringify({ path }) },
    );
    if (!result.ok || !result.data?.ok) return;
    const rows: WorkspaceRow[] = Array.isArray(result.data.workspaces)
      ? result.data.workspaces.filter((r): r is RecentWorkspaceRow => !!r && typeof r.path === "string")
        .map((r) => ({ path: r.path, shape: r.shape ?? "flat" }))
      : [];
    this.patch({ recentWorkspaces: rows });
  }

  /** Sprint 086 — GET /api/sessions/by-workspace?path=&offset=&limit=.
   *  Newest-first paginated session list for one workspace. Returns
   *  {rows: SessionRow[], total, offset, limit}. Does not touch
   *  Snapshot; the caller owns pagination state. */
  async loadSessionsByWorkspace(
    workspacePath: string, offset: number, limit: number,
  ): Promise<{ rows: SessionRow[]; total: number; offset: number; limit: number }> {
    const url = `/api/sessions/by-workspace?path=${encodeURIComponent(workspacePath)}`
      + `&offset=${offset}&limit=${limit}`;
    return this.fetchPaged(url, offset, limit);
  }

  private async fetchPaged(
    url: string, offset: number, limit: number,
  ): Promise<{ rows: SessionRow[]; total: number; offset: number; limit: number }> {
    const result = await this.client.fetchJson<{ rows: RawSession[]; total: number; offset: number; limit: number }>(url);
    if (!result.ok) return { rows: [], total: 0, offset, limit };
    const raw = result.data;
    const rows = Array.isArray(raw.rows)
      ? raw.rows.map((s) => rowFrom(s, (s as unknown as { status?: SessionRow["status"] }).status ?? "ended"))
      : [];
    return { rows, total: raw.total ?? 0, offset: raw.offset ?? offset, limit: raw.limit ?? limit };
  }

  async loadBundleRoster(): Promise<void> {
    const result = await this.client.fetchJson<RawBundleRow[]>("/api/bundles");
    if (!result.ok) { this.patch({ lastError: `bundle_roster: ${result.detail}` }); return; }
    const raw = Array.isArray(result.data) ? result.data : [];
    const rows: BundleRow[] = raw
      .filter((r): r is RawBundleRow => !!r && typeof r.name === "string")
      .map((r) => ({
        name: r.name,
        description: typeof r.description === "string" ? r.description : "",
        slotCount: typeof r.slot_count === "number" ? r.slot_count : 0,
      }));
    this.patch({ bundleRoster: rows });
    this.emit("BUNDLE_ROSTER_LOADED", { count: rows.length });
  }

  // ── session lifecycle ───────────────────────────────────────────────
  async openSession(request: OpenSessionRequest = {}): Promise<void> {
    if (this.snap.sessionId) return;
    // A session runs the model the user picked, never the roster's default or a stand-in: with
    // no driver picked, nothing opens.
    const driver = request.driver ?? this.snap.driver;
    if (!driver) return;
    const body: Record<string, unknown> = { driver };
    // Sprint 087 — fold the per-CLI version pick into driver_params
    // before the request goes out. An explicit driver_params.driver_version
    // from the caller wins; otherwise snap.driverVersion[driver] fills it
    // in. The server's _daemon_driver_resolver reads params.driver_version
    // and appends the corresponding flag to the CLI argv.
    const chosenVersion = this.snap.driverVersion[driver];
    const params: Record<string, unknown> = { ...(request.driverParams ?? {}) };
    if (chosenVersion && params.driver_version == null) {
      params.driver_version = chosenVersion;
    }
    if (Object.keys(params).length > 0) body.driver_params = params;
    // Sprint 086 followup — the picker sets snap.workspacePath via
    // pickWorkspace when the user picks a real folder. Fall back to
    // that if the caller passed no explicit request.workspace, so a
    // sendTurn() with no args opens the session in the picked folder
    // instead of substrate's default per-session sandbox.
    const workspace = request.workspace ?? this.snap.workspacePath ?? undefined;
    if (workspace) body.workspace = workspace;
    if (request.workspaceShape) body.workspace_shape = request.workspaceShape;
    const bundle = request.bundle ?? this.snap.bundleSlug;
    if (bundle) body.bundle = bundle;
    const length = request.length ?? this.snap.length;
    if (length) body.length = length;
    const tone = request.tone ?? this.snap.tone;
    if (tone) body.tone = tone;
    if (request.tools) body.tools = request.tools;
    // UI sprint 145: a name given in the top bar before the session opened goes with the open.
    const name = request.name ?? this.snap.sessionName;
    if (name) body.name = name;
    if (request.isolate) body.isolate = request.isolate;
    this.patch({ connection: "connecting", lastError: null, driver });
    this.emit("SESSION_OPEN_REQUESTED", { driver, workspace: request.workspace ?? null, bundle: request.bundle ?? null });
    const result = await this.client.fetchJson<OpenSessionAck>("/api/session", { method: "POST", body });
    if (!result.ok) {
      this.patch({ connection: "closed", lastError: `session_open: ${result.detail}` });
      this.emit("SESSION_OPEN_REFUSED", { failure_class: result.failureClass, detail: result.detail });
      return;
    }
    const ack = result.data;
    this.lastSeq = -1;
    this.openCallKey.clear();
    this.harnessToolNames.clear();
    this.endedEmittedFor = null;
    this.lastCompactionCut = null;
    // Sprint 085b follow-up: AuthPrompt rows persist across session boundaries
    // as a receipt that the user authenticated a CLI. Every other row type
    // is session-bound and clears with the session.
    const carryOver = this.snap.transcript.filter((row) => row.kind === "AuthPrompt");
    this.patch({
      sessionId: ack.session_id,
      sessionName: ack.name ?? null,
      driver,
      bundleSlug: ack.bundle ?? null,
      workspacePath: ack.workspace ?? null,
      workspaceShape: ack.workspace_shape ?? null,
      turnIndex: 0,
      transcript: carryOver,
      rawEnvelopes: [],
      progressByCallId: {},
      parkReason: null,
      turnFailure: null,
      backgroundTasks: [],
      runs: [],
      viewOnly: null,
      language: null,
      languageOff: false,
      languageClearedSeq: -1,
      languageOpenTick: 0,
      endedReason: null,
    });
    this.attachStream(ack.session_id);
    // No graph fetch here: a fresh session has no record until its first turn, so the request
    // 404'd on every open (UI sprint 107). The SessionStarted handler fetches it once it exists.
    this.emit("SESSION_OPEN_ACKED", { session_id: ack.session_id, name: ack.name ?? null, driver });
  }

  /** UI sprint 105: reload this session's background tasks; keep polling every 3 s while any runs. */
  async refreshTasks(): Promise<void> {
    const sessionId = this.snap.sessionId;
    if (!sessionId) return;
    const result = await this.client.fetchJson<{ tasks: BackgroundTaskRow[] }>(
      `/api/session/${encodeURIComponent(sessionId)}/tasks`,
    );
    if (!result.ok || this.snap.sessionId !== sessionId) return;
    const tasks = result.data?.tasks ?? [];
    this.patch({ backgroundTasks: tasks });
    if (this.tasksTimer) { clearTimeout(this.tasksTimer); this.tasksTimer = null; }
    if (tasks.some((t) => t.status === TaskStatus.RUNNING)) {
      this.tasksTimer = setTimeout(() => { this.tasksTimer = null; void this.refreshTasks(); }, 3000);
    }
  }

  /** UI sprint 176: the runs this session started, as the server's run table holds them. While one
   *  runs, read again every 2 s, so the caller's rows show a run ending before the caller's model
   *  is told (which waits for the caller's next step). */
  async refreshRuns(): Promise<void> {
    const sessionId = this.snap.sessionId;
    if (!sessionId) return;
    const result = await this.client.fetchJson<{ runs: RunRow[] }>(
      `/api/session/${encodeURIComponent(sessionId)}/runs`,
    );
    if (!result.ok || this.snap.sessionId !== sessionId) return;
    const runs = result.data?.runs ?? [];
    this.patch({ runs });
    if (this.runsTimer) { clearTimeout(this.runsTimer); this.runsTimer = null; }
    if (runs.some((r) => r.running)) {
      this.runsTimer = setTimeout(() => { this.runsTimer = null; void this.refreshRuns(); }, 2000);
    }
  }

  /** UI sprint 176: stop a run this session started. Its session ends `caller_stop`. */
  async stopRun(runId: string): Promise<void> {
    const sessionId = this.snap.sessionId;
    if (!sessionId) return;
    const result = await this.client.fetchJson<{ runs: RunRow[] }>(
      `/api/session/${encodeURIComponent(sessionId)}/runs/${encodeURIComponent(runId)}/stop`,
      { method: "POST", body: {} },
    );
    if (!result.ok) {
      this.controlRow(`run ${runId}: ${String(result.detail)}`, false);
      return;
    }
    this.patch({ runs: result.data?.runs ?? this.snap.runs });
    this.emit("RUN_STOP_REQUESTED", { run_id: runId });
    void this.refreshRuns();
  }

  /** UI sprint 176: a line in this pane's transcript from the shell (a run pane that could not open). */
  noteLine(text: string): void { this.controlRow(text, true); }

  /** UI sprint 176: show a run's session in this pane. Its topology writes its messages, so the
   *  pane refuses typing and says why. */
  async attachRun(recordRoot: string, topology: string, runId: string): Promise<void> {
    await this.attachRecordRoot(recordRoot);
    // The run's own SessionStarted names its worktree; until then the pane names no workspace.
    this.patch({
      viewOnly: `view only: the ${topology} writes this session's messages`,
      sessionName: `${topology} ${runId}`,
      workspacePath: null,
      workspaceShape: null,
    });
  }

  /** UI sprint 169: fetch the kernel's language view of this session's record. Calls within
   *  200 ms collapse to one (a record's backlog replays many Returned events at attach). */
  refreshLanguage(): void {
    if (this.languageTimer) clearTimeout(this.languageTimer);
    this.languageTimer = setTimeout(() => {
      this.languageTimer = null;
      void this.loadLanguage();
    }, 200);
  }

  private async loadLanguage(): Promise<void> {
    const sessionId = this.snap.sessionId;
    if (!sessionId) return;
    const request = ++this.languageRequest;
    const result = await this.client.fetchJson<LanguageView>(
      `/api/session/${encodeURIComponent(sessionId)}/language`,
    );
    // A slower, earlier fetch must not replace a later one's view.
    if (request !== this.languageRequest) return;
    if (!result.ok || this.snap.sessionId !== sessionId || !result.data) return;
    this.patch({ language: result.data });
  }

  /** UI sprint 105: stop one background task from the app; the model hears about it. */
  async stopTask(taskId: string): Promise<void> {
    const sessionId = this.snap.sessionId;
    if (!sessionId) return;
    await this.client.fetchJson<unknown>(
      `/api/session/${encodeURIComponent(sessionId)}/tasks/${encodeURIComponent(taskId)}/stop`,
      { method: "POST" },
    );
    await this.refreshTasks();
  }

  async sendTurn(text: string, opts: { skill?: string; driverCommand?: boolean } = {}): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (this.snap.viewOnly) {
      this.controlRow(this.snap.viewOnly, true);
      this.emit("TURN_REFUSED_VIEW_ONLY", {});
      return;
    }
    if (!this.snap.sessionId) await this.openSession();
    const sessionId = this.snap.sessionId;
    if (!sessionId) return;
    // Resuming an ended session: reopen the stream after the last seq we
    // hold (past the old RunFinalised, so the server keeps it open) before
    // the turn posts, so the resumed turn streams in live.
    if (this.snap.endedReason != null) {
      this.patch({ endedReason: null });
      this.attachStream(sessionId);
    }
    // Local echo first so the shell never looks hung during a slow round-trip.
    this.appendTranscript({
      seq: -Math.round(Date.now()),
      kind: EnvelopeKind.UserMessage,
      role: "user",
      text: trimmed,
    });
    const turnIndex = this.snap.turnIndex;
    this.patch({ turnIndex: turnIndex + 1, parkReason: null, turnFailure: null });
    this.emit("TURN_SUBMITTED", { session_id: sessionId, turn_index: turnIndex, text_length: trimmed.length });
    const result = await this.client.fetchJson<unknown>(
      `/api/session/${encodeURIComponent(sessionId)}/turn`,
      {
        method: "POST",
        body: opts.skill
          ? { text: trimmed, skill: opts.skill }
          : opts.driverCommand
            ? { text: trimmed, driver_command: true }
            : { text: trimmed },
      },
    );
    if (!result.ok) {
      this.appendTranscript({
        seq: -Math.round(Date.now()) - 1,
        kind: "TurnError",
        role: "warning",
        text: `turn refused: ${result.detail}`,
      });
      this.patch({ turnFailure: { detail: String(result.detail), atT: Date.now() / 1000 } });
      this.emit("TURN_REFUSED", { failure_class: result.failureClass, detail: result.detail });
    } else {
      this.emit("TURN_ACK", { session_id: sessionId });
    }
  }

  /** Attach to an existing session (opened by another client or by an
   * earlier boot). Replays every envelope from seq 0 so the visible
   * transcript is the record's full history, then follows live. */
  /** Phase 8 item 4: attach to a delegate child record given its
   * filesystem path (from ToolResult.payload.child_root). Replays the
   * child's envelopes into the snapshot the same way `attachExisting`
   * does for a session. The pane's descent stack governs which record
   * feeds the transcript. */
  async attachRecordRoot(recordRoot: string): Promise<void> {
    if (this.unsubscribeStream) { this.unsubscribeStream(); this.unsubscribeStream = null; }
    this.lastSeq = -1;
    this.openCallKey.clear();
    this.harnessToolNames.clear();
    this.endedEmittedFor = null;
    this.lastCompactionCut = null;
    this.patch({
      sessionId: null,
      sessionName: recordRoot,
      turnIndex: 0,
      transcript: [],
      rawEnvelopes: [],
      progressByCallId: {},
      parkReason: null,
      turnFailure: null,
      backgroundTasks: [],
      runs: [],
      viewOnly: null,
      language: null,
      languageOff: false,
      languageClearedSeq: -1,
      languageOpenTick: 0,
      endedReason: null,
      connection: "connecting",
    });
    this.emit("CHILD_RECORD_ATTACH_REQUESTED", { record_root: recordRoot });
    this.unsubscribeStream = this.client.streamRecordByPath(recordRoot, -1, {
      onOpen: () => { this.patch({ connection: "connected" }); this.emit("STREAM_ATTACHED", { record_root: recordRoot }); },
      onEnvelope: (env) => this.handleEnvelope(recordRoot, env),
      onClose: () => { this.patch({ connection: "closed" }); this.emit("STREAM_CLOSED", { record_root: recordRoot }); },
      onError: () => { this.patch({ connection: "reconnecting" }); this.emit("STREAM_RECONNECTING", { record_root: recordRoot }); },
    });
  }

  /** Plan-named alias for `attachExisting`. Kept for the two-shell
   * parity harness which reads action names off the plan doc. */
  async openRecord(sessionId: string): Promise<void> { return this.attachExisting(sessionId); }

  async attachExisting(sessionId: string): Promise<void> {
    if (!sessionId) return;
    this.emit("SESSION_ATTACH_STARTED", { session_id: sessionId });
    // Look up the manifest so the snapshot's name/driver/workspace
    // fields carry through the same way openSession does.
    const result = await this.client.fetchJson<{
      session_id: string;
      name?: string | null;
      driver?: string | null;
      workspace?: string | null;
      workspace_shape?: string | null;
      bundle?: string | null;
      status?: string | null;
      length?: string | null;
      tone?: string | null;
    }>(`/api/session/${encodeURIComponent(sessionId)}`);
    if (!result.ok) {
      this.patch({ lastError: `attach: ${result.detail}` });
      return;
    }
    const manifest = result.data;
    this.lastSeq = -1;
    this.openCallKey.clear();
    this.harnessToolNames.clear();
    this.endedEmittedFor = null;
    this.lastCompactionCut = null;
    this.patch({
      sessionId: manifest.session_id,
      sessionName: manifest.name ?? null,
      driver: manifest.driver ?? this.snap.driver,
      bundleSlug: manifest.bundle ?? null,
      length: manifest.length ?? null,
      tone: manifest.tone ?? null,
      workspacePath: manifest.workspace ?? null,
      workspaceShape: manifest.workspace_shape ?? null,
      turnIndex: 0,
      transcript: [],
      rawEnvelopes: [],
      progressByCallId: {},
      parkReason: null,
      // UI sprint 101: the server's status at attach. A session that is not running has no
      // turn in flight, so a last turn on the record without a Park ended some other way.
      turnFailure:
        manifest.status && manifest.status !== SessionStatus.RUNNING
          ? { detail: `the turn ended without parking (session ${manifest.status})`, atT: Date.now() / 1000 }
          : null,
      language: null,
      languageOff: false,
      languageClearedSeq: -1,
      languageOpenTick: 0,
      endedReason: null,
      runs: [],
      viewOnly: null,
    });
    this.attachStream(manifest.session_id);
    void this.refreshRuns();
    this.loadTopologyGraph(manifest.session_id).catch(() => undefined);
    this.refreshLanguage();
  }

  async endSession(reason: string = "user_exit"): Promise<void> {
    const sessionId = this.snap.sessionId;
    if (!sessionId) return;
    this.emit("SESSION_END_REQUESTED", { session_id: sessionId, reason });
    const result = await this.client.fetchJson<unknown>(
      `/api/session/${encodeURIComponent(sessionId)}/end`,
      { method: "POST", body: { reason } },
    );
    if (!result.ok) {
      this.patch({ lastError: `session_end: ${result.detail}` });
      this.forceClose(reason);
      return;
    }
    // The controller owns the session's lifecycle: endSession must not
    // return until the close-emits have fired. The SessionEnded envelope's
    // handler patches endedReason and emits SESSION_ENDED_LOCAL; forceClose
    // below closes the stream and unbinds, whether or not the envelope came.
    // Poll the snapshot's endedReason for up to 2s, then forceClose.
    // STREAM_CLOSED fires once: closeStreamOnEnd emits it only from the call
    // that actually closed an open stream. SESSION_ENDED_LOCAL only fires from
    // the envelope path, so callers of endSession see it only if the server
    // acknowledged with an envelope in time.
    const deadline = Date.now() + 2000;
    while (Date.now() < deadline) {
      if (this.snap.endedReason != null) break;
      await new Promise((r) => setTimeout(r, 25));
    }
    // An explicit end unbinds; a session reached by attach stays resumable.
    this.forceClose(reason);
  }

  pickDriver(name: string): void {
    // Sprint 085 followup + 2026-09-25 fix: the picker-freeze rule
    // Peter asked for gates the UI dropdown (toggleDd), not this
    // method. The /model slash command calls pickDriver mid-session
    // and must always patch the driver and emit DRIVER_PICKED.
    // Sweep any AuthPromptCard rows only before a session is bound —
    // mid-session switches don't get an auth-card race because the
    // card can't fire (guarded below).
    if (!this.snap.sessionId) {
      const swept = this.snap.transcript.filter((row) => row.kind !== "AuthPrompt");
      this.patch({ driver: name, transcript: swept });
    } else {
      this.patch({ driver: name });
    }
    this.emit("DRIVER_PICKED", { driver: name });
    // Auth card only fires pre-session for CLIs whose login flow fits
    // the AuthPromptCard shape.
    if (!this.snap.sessionId && this.cliLoginSupported.includes(name)) {
      this.maybeOpenAuthPrompt(name);
    }
  }

  private async maybeOpenAuthPrompt(cli: string): Promise<void> {
    try {
      const res = await this.client.fetchJson<{ authed: boolean | null }>(
        `/api/cli/${encodeURIComponent(cli)}/status`,
      );
      if (!res.ok) return;
      if (res.data.authed === false) this.openAuthPrompt(cli);
    } catch { /* status probe unreachable — silent */ }
  }

  openAuthPrompt(cli: string): void {
    // AuthPrompt transcript row. Row.tsx dispatches on kind="AuthPrompt"
    // to render AuthPromptCard, which owns the pty lifecycle
    // (POST /api/cli/<cli>/pty/start, GET stream, POST stdin, POST close).
    // Negative seq keeps the row above any envelope-derived rows.
    this.appendTranscript({
      seq: -Math.round(Date.now()) - 7,
      kind: "AuthPrompt",
      role: "system",
      text: cli,
    });
  }

  /** Choose the bundle openSession will pass unless overridden. Null
   * clears the choice. Silent no-op after a session opens; the bundle
   * is fixed on the record at that point. */
  /** UI sprint 143 (kernel K296): the Length and Tone positions for the session the bar opens.
   * Silent no-op after a session opens: a change then is a PATCH, recorded as SessionChanged. */
  pickControls(length: string | null, tone: string | null): void {
    if (this.snap.sessionId) return;
    // No signal of its own: the pick travels in POST /api/session and lands on the manifest and,
    // as SessionStarted.length/tone and the `control` fragments, on the record.
    this.patch({ length, tone });
  }

  pickBundle(slug: string | null): void {
    if (this.snap.sessionId) return;
    this.patch({ bundleSlug: slug });
    this.emit("BUNDLE_PICKED", { bundle: slug });
  }

  /** Sprint 086 followup — thread the picker's chosen workspace into
   *  the controller so the next openSession sends it as the workspace
   *  field. Empty string clears (falls back to substrate's per-session
   *  sandbox default). Silent no-op once a session is bound. */
  pickWorkspace(path: string | null): void {
    if (this.snap.sessionId) return;
    this.patch({ workspacePath: (path ?? "") || null });
  }

  /** Post an authored topology spec to /api/validate. Returns
   * {valid, error?} the server produced. Emits the SPEC_VALIDATE
   * pair so parity harnesses can see the round trip. */
  async validateSpec(spec: Record<string, unknown>): Promise<{ valid: boolean; error?: string }> {
    const name = typeof spec.name === "string" ? spec.name : "";
    this.emit("SPEC_VALIDATE_REQUESTED", name ? { topology_name: name } : {});
    const result = await this.client.fetchJson<{ valid: boolean; error?: string }>("/api/validate", { method: "POST", body: spec });
    if (!result.ok) {
      const err = `validate: ${result.detail}`;
      this.emit("SPEC_VALIDATED", { valid: false, error: err });
      return { valid: false, error: err };
    }
    const r = result.data;
    if (r.valid) this.emit("SPEC_VALIDATED", { valid: true });
    else this.emit("SPEC_VALIDATED", { valid: false, error: String(r.error ?? "") });
    return { valid: !!r.valid, error: r.error };
  }

  /** Post an authored topology spec to /api/build. Validates first
   * so a bad spec never reaches the runtime. Returns whatever the
   * server produced on success or an error string. Emits the SPEC_BUILD
   * pair or SPEC_BUILD_REJECTED. */
  async buildSpec(spec: Record<string, unknown>): Promise<{ ok: boolean; run?: Record<string, unknown>; error?: string }> {
    const name = typeof spec.name === "string" ? spec.name : "";
    this.emit("SPEC_BUILD_REQUESTED", name ? { topology_name: name } : {});
    const v = await this.client.fetchJson<{ valid: boolean; error?: string }>("/api/validate", { method: "POST", body: spec });
    if (!v.ok || !v.data.valid) {
      const err = !v.ok ? `validate: ${v.detail}` : String(v.data.error ?? "invalid spec");
      this.emit("SPEC_BUILD_REJECTED", { reason: err });
      return { ok: false, error: err };
    }
    const r = await this.client.fetchJson<Record<string, unknown>>("/api/build", { method: "POST", body: spec });
    if (!r.ok) {
      const err = `build: ${r.detail}`;
      this.emit("SPEC_BUILD_REJECTED", { reason: err });
      return { ok: false, error: err };
    }
    const run = r.data;
    const unfired = Array.isArray(run.unfired_triggers) ? run.unfired_triggers : [];
    this.emit("SPEC_BUILT", {
      run_name: String(run.name ?? ""),
      status: String(run.status ?? "unknown"),
      ...(unfired.length ? { unfired_triggers_count: unfired.length } : {}),
    });
    return { ok: true, run };
  }

  /** Route a prompt line. `/foo` goes to a slash handler, plain text
   * to `sendTurn`. Returns true when the line was consumed as a
   * slash so the caller can hand a residual back if it wants. */
  async submitLine(line: string): Promise<boolean> {
    const text = line.trim();
    if (!text) return true;
    if (!text.startsWith("/")) {
      await this.sendTurn(text);
      return false;
    }
    // UI sprint 123: `//<command>` passes `/<command>` to the driver itself (e.g. Claude's /context).
    if (text.startsWith("//")) {
      await this.sendTurn(text.slice(1), { driverCommand: true });
      return true;
    }
    const parts = text.slice(1).split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const rest = parts.slice(1).join(" ");
    this.emit("SLASH_ROUTED", { cmd });
    const command = this.slashCommands().find((c) => c.names.includes(cmd));
    if (command) {
      await command.run(rest);
      return true;
    }
    this.appendTranscript({
      seq: -Math.round(Date.now()) - 4,
      kind: "SlashUnknown", role: "warning",
      text: `unknown slash: /${cmd}. /help for the list.`,
    });
    this.emit("SLASH_UNKNOWN", { cmd });
    return true;
  }

  /** The slash commands: what the menu lists, what `/help` prints and what `submitLine` runs. UI
   * sprint 107 made the dispatch and `/help` one table; UI sprint 162 made the menu read it too
   * (`slashCatalog`), with a description per command and, for a fixed set, its choices. */
  private slashCommands(): SlashCommand[] {
    const control = (
      field: "guidance" | "length" | "tone", about: string, choices: readonly string[], current: () => string,
    ): SlashCommand => ({
      names: [field], usage: `/${field} <${choices.join("|")}>`, about, choices, current,
      run: (rest: string) => rest
        ? this.setControl(field, rest.trim())
        : this.controlRow(`${field}: ${current()}. use /${field} <${choices.join("|")}>.`, false),
    });
    return [
      { names: ["exit", "quit", "end"], usage: "/exit", about: "end this session", run: () => this.endSession("user_end") },
      {
        names: ["model", "driver"], usage: "/model <name>", about: "switch the model this session runs on",
        run: (rest) => {
          if (rest) this.pickDriver(rest);
          else this.appendTranscript({
            seq: -Math.round(Date.now()) - 2,
            kind: "SlashHelp", role: "system",
            text: this.snap.driver ? `current driver: ${this.snap.driver}. use /model <name> to switch.` : "no model picked yet. use /model <name> to pick one.",
          });
        },
      },
      {
        names: ["name", "rename"], usage: "/name <new>", about: "rename this session",
        run: async (rest) => {
          if (rest) { await this.renameSession(rest); return; }
          this.appendTranscript({
            seq: -Math.round(Date.now()) - 9,
            kind: "SlashHelp", role: "system",
            text: `current name: ${this.snap.sessionName ?? "(unnamed)"}. use /name <new> to rename.`,
          });
        },
      },
      // UI sprint 161: guidance, length and tone, mid-session. No argument names the current value.
      control("guidance", "how much of the working standard the model gets", ["auto", ...Object.keys(GUIDANCE_LEVEL_BUNDLES)], () => this.guidanceLevel() ?? "auto"),
      control("length", "how long replies run", Object.values(LengthPosition), () => this.snap.length ?? LENGTH_DEFAULT),
      control("tone", "the register of replies", Object.values(TonePosition), () => this.snap.tone ?? TONE_DEFAULT),
      {
        // UI sprint 122: load the dellm skill for this session and send the text after it as the
        // turn (kernel K277). The skill stays loaded for the rest of the session.
        names: ["dellm"], usage: "/dellm <text>", about: "load the plain-prose editing skill and send the text",
        run: (rest) => this.sendTurn(rest || "Apply the dellm skill to your next reply.", { skill: "dellm" }),
      },
      {
        names: ["list", "ls"], usage: "/list", about: "list the sessions on the server",
        run: async () => {
          await this.loadLiveSessions();
          const rows = this.snap.liveSessions;
          const text = rows.length
            ? `${rows.length} session${rows.length === 1 ? "" : "s"}: ${rows.map(r => `${r.name} (${r.status})`).join(", ")}`
            : "no sessions on the server";
          this.appendTranscript({
            seq: -Math.round(Date.now()) - 10,
            kind: "SlashListed", role: "system",
            text,
          });
        },
      },
      { names: ["interrupt", "int"], usage: "/interrupt", about: "stop the turn in flight (also ^C)", run: () => this.interruptTurn() },
      {
        // UI sprint 172: the language lens and the bar line's shifts.
        names: ["language"], usage: "/language [open|clear|off|on]",
        about: "open the language lens; clear, hide or show the shifts on the bar line",
        choices: ["open", "clear", "off", "on"], current: () => (this.snap.languageOff ? "off" : "on"),
        run: (rest) => {
          const arg = rest.trim();
          if (arg === "clear") this.patch({ languageClearedSeq: this.snap.language?.last_seq ?? -1 });
          else if (arg === "off") this.patch({ languageOff: true });
          else if (arg === "on") this.patch({ languageOff: false });
          else if (arg === "" || arg === "open") {
            this.refreshLanguage();
            this.patch({ languageOpenTick: this.snap.languageOpenTick + 1 });
          }
          else this.controlRow(`language: unknown option ${JSON.stringify(arg)}. use /language [open|clear|off|on].`, false);
        },
      },
      {
        // UI sprint 176: the runs this session started (kernel K319). No id picks the latest.
        names: ["run", "runs"], usage: "/run [stop|focus] [run id]",
        about: "list this session's runs; stop one, or show its pane",
        choices: ["stop", "focus"],
        run: async (rest) => {
          await this.refreshRuns();
          const [action, id] = rest.trim().split(/\s+/);
          const runs = this.snap.runs;
          if (!action) {
            this.controlRow(runs.length
              ? runs.map((r) => `${r.run_id} · ${r.topology} · ${r.running ? "running" : r.paused ? "paused" : `ended ${r.outcome ?? ""}`}`).join("\n")
              : "this session has started no runs", false);
            return;
          }
          const pool = action === "stop" ? runs.filter((r) => r.running || r.paused) : runs;
          const run = id ? runs.find((r) => r.run_id === id) : pool[pool.length - 1];
          if (!run) { this.controlRow(id ? `no run ${id} in this session` : "no run to " + action, true); return; }
          if (action === "stop") await this.stopRun(run.run_id);
          else if (action === "focus") this.emit("RUN_FOCUS_REQUESTED", { run_id: run.run_id, topology: run.topology, sessions: run.sessions });
          else this.controlRow(`run: unknown action ${JSON.stringify(action)}. use /run [stop|focus] [run id].`, true);
        },
      },
      // UI sprint 140: fold or unfold every tool card, as ⌘E does. /fold flips; /unfold unfolds.
      { names: ["fold"], usage: "/fold", about: "fold or unfold all tool output (also ⌘E)", run: () => { toggleToolOutputMode(); } },
      { names: ["unfold"], usage: "/unfold", about: "unfold all tool output", run: () => { setToolOutputMode("expanded"); } },
      { names: ["clear"], usage: "/clear", about: "clear the transcript view", run: () => { this.patch({ transcript: [] }); } },
      {
        names: ["help", "?"], usage: "/help", about: "list these commands",
        run: () => {
          this.appendTranscript({
            seq: -Math.round(Date.now()) - 3,
            kind: "SlashHelp", role: "system",
            text: "slash commands",
            helpRows: this.slashCommands().map((c) => ({ usage: c.usage, about: c.about })),
          });
        },
      },
    ];
  }

  /** The slash commands as the menu shows them (UI sprint 162): each command's name, usage and
   * description, and for a fixed set its choices and the session's current value. */
  slashCatalog(): SlashCatalogEntry[] {
    return this.slashCommands().map((c) => ({
      name: c.names[0], aliases: c.names.slice(1), usage: c.usage, about: c.about,
      choices: c.choices ? [...c.choices] : null,
      current: c.current ? c.current() : null,
    }));
  }

  /** Rename the current session. PATCH /api/session/<id> body
   * `{name: <new>}`. Refreshes the snapshot's sessionName on ACK. */
  /** UI sprint 145: name this pane's session from the top bar. With a session open this is
   * renameSession (PATCH); before it opens, the name is held and sent when it opens. */
  async nameSession(newName: string): Promise<void> {
    const name = newName.trim();
    if (!name) return;
    if (this.snap.sessionId) { await this.renameSession(name); return; }
    this.patch({ sessionName: name });
  }

  /** UI sprint 161 (kernel K296, K298; vocabulary § U): change guidance, length or tone. Before a
   * session opens it is the pick the open carries; after, a PATCH the next turn records as
   * SessionChanged and draws in the history. The snapshot follows the server's reply. */
  async setControl(field: "guidance" | "length" | "tone", value: string): Promise<void> {
    const sessionId = this.snap.sessionId;
    if (!sessionId) {
      if (field === "guidance") {
        const bundle = value === "auto" ? null : (GUIDANCE_LEVEL_BUNDLES as Record<string, string>)[value];
        if (bundle === undefined) { this.controlRow(`unknown guidance level ${value}`, true); return; }
        this.patch({ bundleSlug: bundle });
      } else {
        this.patch(field === "length" ? { length: value } : { tone: value });
      }
      this.controlRow(`${field} ${value} for the session this pane opens`, false);
      return;
    }
    const result = await this.client.fetchJson<{ bundle?: string | null; length?: string | null; tone?: string | null }>(
      `/api/session/${encodeURIComponent(sessionId)}`,
      { method: "PATCH", body: { [field]: value } },
    );
    if (!result.ok) { this.controlRow(`${field} not changed: ${result.detail}`, true); return; }
    this.patch({ bundleSlug: result.data.bundle ?? null, length: result.data.length ?? null, tone: result.data.tone ?? null });
    this.controlRow(`${field} set to ${value}; it applies from the next message`, false);
  }

  private controlRow(text: string, refused: boolean): void {
    this.appendTranscript({
      seq: -Math.round(Date.now()) - 11,
      kind: refused ? "ControlRefused" : "ControlSet", role: refused ? "warning" : "system",
      text,
    });
  }

  /** The session's guidance level, read from its bundle (§ U); null when the bundle is no level's. */
  guidanceLevel(): string | null {
    const bundle = this.snap.bundleSlug;
    const hit = Object.entries(GUIDANCE_LEVEL_BUNDLES).find(([, b]) => b === bundle);
    return hit ? hit[0] : null;
  }

  async renameSession(newName: string): Promise<void> {
    const sessionId = this.snap.sessionId;
    if (!sessionId) return;
    const result = await this.client.fetchJson<{ name?: string | null }>(
      `/api/session/${encodeURIComponent(sessionId)}`,
      { method: "PATCH", body: { name: newName } },
    );
    if (!result.ok) {
      this.appendTranscript({
        seq: -Math.round(Date.now()) - 7,
        kind: "RenameFailed", role: "warning",
        text: `rename failed: ${result.detail}`,
      });
      return;
    }
    this.patch({ sessionName: result.data.name ?? newName });
    this.appendTranscript({
      seq: -Math.round(Date.now()) - 8,
      kind: "Renamed", role: "system",
      text: `session renamed to ${result.data.name ?? newName}`,
    });
  }

  /** Interrupt the in-flight turn. Server refuses if no turn is
   * running (returns {interrupted: false}). Records the outcome as a
   * transcript row so the UI shows what happened. */
  async interruptTurn(tier: "soft" | "hard" = "hard", recordRoot?: string): Promise<void> {
    const sessionId = this.snap.sessionId;
    if (!sessionId) return;
    // Phase 8 item 9 descent scope: when `recordRoot` is set, the client
    // is descended into a delegate; the server routes the interrupt to
    // the CHILD runtime's producers, not the session's.
    const params = new URLSearchParams({ tier });
    if (recordRoot) params.set("record_root", recordRoot);
    const result = await this.client.fetchJson<{
      interrupted?: boolean;
      landed?: boolean;
      signal?: boolean;
      tier?: string;
      scope?: "session" | "descent";
      record_root?: string;
    }>(
      `/api/session/${encodeURIComponent(sessionId)}/interrupt?${params.toString()}`,
      { method: "POST", body: {} },
    );
    if (!result.ok) {
      this.appendTranscript({
        seq: -Math.round(Date.now()) - 5,
        kind: "InterruptFailed", role: "warning",
        text: `interrupt failed: ${result.detail}`,
      });
      return;
    }
    const wasInterrupted = result.data?.interrupted === true;
    const landed = result.data?.landed === true;
    const isSignal = result.data?.signal === true;
    const scope = result.data?.scope === "descent" ? "descent" : "session";
    const scopeSuffix = scope === "descent" ? " · scoped to child" : "";
    let text: string;
    if (isSignal) {
      text = `^C — soft interrupt requested; the model will stop after this tool${scopeSuffix}`;
    } else if (wasInterrupted && tier === "hard") {
      text = scope === "descent"
        ? "^C — hard interrupt; tool cancelled · cancel_producer on the child's runtime"
        : "^C — hard interrupt; producer cancelled";
    } else if (wasInterrupted) {
      text = `^C interrupt (${landed ? "landed" : "dispatched — envelope arriving on /events"})${scopeSuffix}`;
    } else {
      text = scope === "descent"
        ? "^C — no turn in flight on the child (already parked or ended)"
        : "^C — no turn in flight";
    }
    this.appendTranscript({ seq: -Math.round(Date.now()) - 6, kind: "Interrupted", role: "system", text });
    this.emit("TURN_INTERRUPTED", { was_interrupted: wasInterrupted, landed, tier, signal: isSignal, scope });
  }

  disconnect(): void {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.unsubscribeStream) { this.unsubscribeStream(); this.unsubscribeStream = null; }
    this.listeners.clear();
  }

  // ── internal ────────────────────────────────────────────────────────
  private attachStream(sessionId: string): void {
    if (this.unsubscribeStream) { this.unsubscribeStream(); this.unsubscribeStream = null; }
    this.patch({ connection: "connecting" });
    this.unsubscribeStream = this.client.streamRecord(sessionId, this.lastSeq, {
      onOpen: () => { this.patch({ connection: "connected" }); this.emit("STREAM_ATTACHED", { session_id: sessionId }); },
      onEnvelope: (env) => this.handleEnvelope(sessionId, env),
      onClose: () => this.handleStreamClose(sessionId),
      onError: () => this.handleStreamError(sessionId),
    });
  }

  private handleStreamClose(sessionId: string): void {
    // Graceful close on RunFinalised; the SessionEnded envelope already
    // updated state. Move connection to closed and stop.
    if (this.snap.sessionId !== sessionId) return;
    this.patch({ connection: "closed" });
    this.emit("STREAM_CLOSED", { session_id: sessionId });
  }

  private handleStreamError(sessionId: string): void {
    if (this.snap.sessionId !== sessionId) return;
    this.patch({ connection: "reconnecting" });
    this.emit("STREAM_RECONNECTING", { session_id: sessionId });
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.snap.sessionId === sessionId) this.attachStream(sessionId);
    }, 1000);
  }

  private handleEnvelope(sessionId: string, env: RecordEnvelope): void {
    // A reconnecting EventSource asks for the same URL again, so the server replays envelopes
    // this controller already holds. UI sprint 102: skip them whole. Before, rawEnvelopes was
    // deduped but the switch below still ran, so every reconnect appended the transcript again.
    const existing = this.snap.rawEnvelopes;
    if (typeof env.seq === "number" && existing.some((e) => e.seq === env.seq)) return;
    if (typeof env.seq === "number" && env.seq > this.lastSeq) this.lastSeq = env.seq;
    this.emit("STREAM_ENVELOPE_APPENDED", { seq: env.seq, kind: env.kind });
    this.patch({ rawEnvelopes: [...existing, env] });
    const payload = env.payload ?? {};
    switch (env.kind) {
      case EnvelopeKind.SessionStarted: {
        const driver = payload.driver_model != null ? String(payload.driver_model) : this.snap.driver;
        const bundle = payload.bundle == null ? this.snap.bundleSlug : String(payload.bundle);
        this.patch({ driver, bundleSlug: bundle });
        // UI sprint 176: a run's pane has no manifest; its record names the worktree it works in.
        if (this.snap.viewOnly && payload.workspace_path) {
          this.patch({ workspacePath: String(payload.workspace_path), workspaceShape: String(payload.workspace_shape ?? "") || null });
        }
        // A fresh session's record exists from its first turn, and this
        // envelope is read off it: fetch the graph here if nothing (an
        // attach) loaded it yet.
        if (!this.snap.topologyGraph) {
          this.loadTopologyGraph(sessionId).catch(() => undefined);
        }
        return;
      }
      case EnvelopeKind.UserMessage: {
        const text = String(payload.text ?? "");
        // A message after a SessionEnded means the session resumed on the same record.
        if (this.snap.endedReason != null) this.patch({ endedReason: null });
        // Replace the local echo appended in sendTurn. The row moves to the end: envelopes arrive
        // in seq order, and record frames that were still arriving when the echo went up (a
        // reattach's backlog) belong above the message, not below it.
        const transcript = this.snap.transcript;
        const echoIndex = transcript.findIndex(
          (row) => row.role === "user" && row.text === text && row.seq < 0,
        );
        const rest = echoIndex >= 0
          ? [...transcript.slice(0, echoIndex), ...transcript.slice(echoIndex + 1)]
          : transcript;
        const row = echoIndex >= 0 ? transcript[echoIndex] : { kind: env.kind, role: "user", text };
        this.patch({ transcript: [...rest, { ...row, seq: env.seq } as TranscriptRow] });
        return;
      }
      case EnvelopeKind.ModelReply: {
        // Vocabulary v0.3: a model call that only requests a tool writes a ModelReply with no text.
        if (!String(payload.text ?? "")) return;
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "model",
          text: String(payload.text ?? ""),
        });
        return;
      }
      case EnvelopeKind.FinalAnswer: {
        // A bail-final answer with distinct text still shows; a normal duplicate
        // of the preceding ModelReply is skipped so the transcript doesn't
        // double-print.
        const text = String(payload.text ?? "");
        const last = this.snap.transcript[this.snap.transcript.length - 1];
        if (!text || (last && last.role === "model" && last.text === text)) return;
        this.appendTranscript({ seq: env.seq, kind: env.kind, role: "warning", text });
        return;
      }
      case EnvelopeKind.ToolCall: {
        // Phase 8 · 21a: carry the tool name, call_id, args, and step
        // onto the row so the shell can preview the first arg and
        // open the card without a second envelope walk.
        const toolName = payload.tool ? String(payload.tool) : "";
        const callId = payload.call_id ? String(payload.call_id) : "";
        const args = Array.isArray(payload.args)
          ? payload.args.map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
          : [];
        const step = typeof payload.step === "number" ? payload.step : undefined;
        const preview = args.length ? args[0] : "";
        const callKey = callId ? `${callId}@${env.seq}` : "";
        if (callId) this.openCallKey.set(callId, callKey);
        // Kernel K286: a harness driver's call to Substrate's tools over MCP is Substrate's own
        // ToolCall with origin `mcp`; the row says so.
        const route = payload.origin === "mcp" ? "mcp" : undefined;
        const name = route ? `${toolName} (mcp)` : toolName;
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "tool",
          text: preview ? `${name} ${preview}` : `call ${name}`,
          toolName, callId, callKey, args, toolStep: step, toolRoute: route,
        });
        return;
      }
      case EnvelopeKind.HarnessToolCall: {
        // UI sprints 129, 131: a harness driver's call to its OWN tool inside one model step,
        // read from its stream. Same card as a ToolCall; the row says `(harness)`.
        const toolName = payload.tool ? String(payload.tool) : "";
        const callId = payload.call_id ? String(payload.call_id) : "";
        const route = "harness";
        const raw = payload.args && typeof payload.args === "object" ? payload.args : {};
        const args = Object.entries(raw as Record<string, unknown>).map(
          ([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`,
        );
        const first = Object.values(raw as Record<string, unknown>)[0];
        const preview = first === undefined ? "" : typeof first === "string" ? first : JSON.stringify(first);
        const step = typeof payload.step === "number" ? payload.step : undefined;
        const callKey = callId ? `${callId}@${env.seq}` : "";
        if (callId) {
          this.openCallKey.set(callId, callKey);
          this.harnessToolNames.set(callId, toolName);
        }
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "tool",
          text: `${toolName} (${route})${preview ? ` ${preview}` : ""}`,
          toolName, callId, callKey, args, toolStep: step, toolRoute: route,
        });
        return;
      }
      case EnvelopeKind.HarnessToolResult: {
        const callId = payload.call_id ? String(payload.call_id) : "";
        const toolName = this.harnessToolNames.get(callId) ?? "";
        const ok = payload.ok !== false;
        const output = typeof payload.output === "string" ? payload.output : "";
        const callKey = this.openCallKey.get(callId) ?? callId;
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "tool",
          text: ok ? `${toolName} → ok` : `${toolName} → err`,
          toolName, callId, callKey, output: ok ? output : "", error: ok ? "" : output, toolOk: ok,
        });
        return;
      }
      case EnvelopeKind.ToolProgress: {
        // Phase 8 item 8: append a chunk under the ToolCall row's card.
        // The chunk may be empty on eof (marker only). We build a fresh
        // progressByCallId map so the setState triggers a re-render.
        const callId = payload.call_id ? String(payload.call_id) : "";
        if (!callId) return;
        const key = this.openCallKey.get(callId) ?? callId;
        const chunk = typeof payload.chunk === "string" ? payload.chunk : "";
        const eof = payload.eof === true;
        const prior = this.snap.progressByCallId[key] ?? { text: "", eof: false };
        const nextEntry = { text: prior.text + chunk, eof: prior.eof || eof };
        this.patch({
          progressByCallId: { ...this.snap.progressByCallId, [key]: nextEntry },
        });
        return;
      }
      case EnvelopeKind.ToolResult: {
        // Phase 8 · 21b: carry the output/error onto the row. The
        // matching ToolCall row is looked up by call_id at render.
        const toolName = payload.tool ? String(payload.tool) : "";
        const callId = payload.call_id ? String(payload.call_id) : "";
        const ok = payload.ok !== false;
        const err = payload.error ? String(payload.error) : "";
        const rawOutput = payload.output;
        const output = typeof rawOutput === "string"
          ? rawOutput
          : rawOutput === undefined || rawOutput === null
            ? ""
            : JSON.stringify(rawOutput);
        const step = typeof payload.step === "number" ? payload.step : undefined;
        const callKey = this.openCallKey.get(callId) ?? callId;
        if (toolName.startsWith("bash")) void this.refreshTasks(); // UI sprint 105
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "tool",
          text: ok ? `${toolName} → ok` : `${toolName} → err ${err}`,
          toolName, callId, callKey, output, error: err, toolOk: ok, toolStep: step,
        });
        // Seal any ToolProgress stream for this callId — the paired
        // ToolResult is the definitive close, regardless of whether the
        // tool emitted an explicit eof=true chunk.
        if (callKey && this.snap.progressByCallId[callKey]) {
          const entry = this.snap.progressByCallId[callKey];
          if (!entry.eof) {
            this.patch({
              progressByCallId: {
                ...this.snap.progressByCallId,
                [callKey]: { text: entry.text, eof: true },
              },
            });
          }
        }
        return;
      }
      case EnvelopeKind.Park:
      case EnvelopeKind.Returned: {
        // `Returned` ends a turn (vocabulary v0.3); records written before it end with `Park`,
        // whose reasons read as Returned's (§ K.3).
        const raw = String(payload.reason ?? "");
        const reason = LEGACY_PARK_REASONS[raw] ?? raw;
        const detail = String(payload.detail ?? "");
        this.patch({ parkReason: reason });
        this.refreshLanguage(); // UI sprint 169: the turn's measurements are on the record
        // A park with a non-happy reason names its cause. `model_error`
        // is the primary one: the ProducerFailed's `error` field carries
        // the exception (a network hiccup, a 502 from the provider, a
        // schema error). Surface it as a warning row so the user sees
        // WHY the turn ended, not just that it did. `replied` and
        // `interrupted` carry their meaning in the reason and get no detail.
        if (detail) {
          const shaped = summariseModelError(detail);
          this.appendTranscript({
            seq: env.seq - 0.5, kind: "ModelError", role: "warning",
            text: `! model_error: ${shaped}`,
          });
        }
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "park",
          // In a run's pane the topology writes the next message, so it is never the person's turn.
          text: this.snap.viewOnly ? `· returned (${reason})` : `· returned (${reason}) — your turn`,
        });
        this.emit("TURN_PARKED", { park_reason: reason });
        return;
      }
      case EnvelopeKind.SessionEnded: {
        const raw = String(payload.reason ?? "server_end");
        const reason = LEGACY_SESSION_END_REASONS[raw] ?? raw;
        this.endedEmittedFor = sessionId;
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "ended",
          text: `session ended (${reason})`,
        });
        // The stream stays open: in a resumed session's record this SessionEnded is history, and
        // the turns after it are still to come. The server ends the stream (an `end` event) when
        // the record's last frame is a RunFinalised; sendTurn reopens it to resume.
        this.patch({ endedReason: reason });
        this.emit("SESSION_ENDED_LOCAL", { reason });
        return;
      }
      case EnvelopeKind.BackgroundTaskEnded: {
        // UI sprint 104: a bash background task of this session ended; the model was told too.
        void this.refreshTasks();
        const id = String(payload.task_id ?? "");
        const how = payload.status === TaskStatus.EXITED
          ? `exited ${payload.exit ?? "?"}`
          : `stopped (${String(payload.stopped_because ?? "")})`;
        const cmd = String(payload.command ?? "").slice(0, 80);
        this.appendTranscript({ seq: env.seq, kind: env.kind, role: "system", text: `task ${id} ${how} · ${cmd}` });
        return;
      }
      case EnvelopeKind.TopologyRunStarted: {
        // Kernel K319 (§ X.2): this session started a run; it returns at once. The shell opens a
        // pane per run session for a run that starts now (`t` within a minute), not for one read
        // back from an older record.
        const runId = String(payload.run_id ?? "");
        const topology = String(payload.topology ?? "");
        const sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "system",
          text: `run ${runId} · ${topology} started · /run stop ${runId} stops it, /run focus ${runId} shows it`,
        });
        this.emit("RUN_STARTED", { run_id: runId, topology, sessions, t: env.t ?? null });
        void this.refreshRuns();
        return;
      }
      case EnvelopeKind.TopologyRunEnded: {
        const report = (payload.report ?? null) as Record<string, unknown> | null;
        const said = report ? String(report.left || report.done || "").trim() : "";
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "system",
          text: `run ${String(payload.run_id ?? "")} · ${String(payload.topology ?? "")} ended ${String(payload.outcome ?? "")}${said ? ` · ${said.split("\n")[0].slice(0, 160)}` : ""}`,
        });
        void this.refreshRuns();
        return;
      }
      case EnvelopeKind.CardAccepted: {
        // A run's own record (vocabulary § X.3): the card it works.
        const checks = Array.isArray(payload.checks) ? payload.checks : [];
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "system",
          text: `card · ${String(payload.what ?? "")} · ${checks.length} check${checks.length === 1 ? "" : "s"}`,
        });
        return;
      }
      case EnvelopeKind.ChecksRun: {
        const results = Array.isArray(payload.results) ? (payload.results as Record<string, unknown>[]) : [];
        const judged = results.filter((r) => r.passed !== null && r.passed !== undefined);
        const passed = judged.filter((r) => r.passed === true).length;
        const problems = Array.isArray(payload.record_problems) ? payload.record_problems.length : 0;
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: payload.passed ? "system" : "warning",
          text: `checks ${payload.passed ? "passed" : "failed"} · ${judged.length ? `${passed} of ${judged.length} commands` : "no commands"}${problems ? ` · ${problems} record problem${problems === 1 ? "" : "s"}` : ""}`,
        });
        return;
      }
      case EnvelopeKind.ReportWritten: {
        const files = Array.isArray(payload.files) ? payload.files.length : 0;
        const head = `report · ${String(payload.outcome ?? "")}${payload.branch ? ` · branch ${String(payload.branch)}` : ""} · ${files} file${files === 1 ? "" : "s"}`;
        const left = String(payload.left ?? "").trim();
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "system",
          text: left ? `${head} · ${left}` : head,
        });
        return;
      }
      case EnvelopeKind.RunPaused:
      case EnvelopeKind.RunResumed: {
        const what = env.kind === EnvelopeKind.RunPaused ? "paused" : "resumed";
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "system",
          text: `run ${what} by ${String(payload.by ?? "")}`,
        });
        return;
      }
      case EnvelopeKind.SessionChanged: {
        // Kernel K274 (session vocabulary § P.4): the session's driver, bundle, reminder line or
        // date differs from the record; the model was told the same line beside the message.
        const field = String(payload.field ?? "");
        const text = field === "per_turn"
          ? "environment update: the reminder line beside each message changed"
          : `environment update: ${field} changed from ${String(payload.old ?? "") || "(none)"} to ${String(payload.new ?? "") || "(none)"}`;
        this.appendTranscript({ seq: env.seq, kind: env.kind, role: "system", text });
        return;
      }
      case EnvelopeKind.SessionWarning: {
        // SessionWarning names its condition in `kind`; a failed prompt source adds
        // `source_name` and the error in `detail` (session vocabulary § J, § N).
        const parts = [String(payload.kind ?? "warning")];
        if (payload.source_name) parts.push(String(payload.source_name));
        if (payload.detail) parts.push(String(payload.detail));
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "warning",
          text: `warning: ${parts.join(" · ")}`,
        });
        return;
      }
      case EnvelopeKind.TranscriptCompacted: {
        // Session vocabulary § D, § S.4: `dropped_seq_range` is one pair, or absent when only
        // tool output was cleared; `cleared_through_seq` is the clearing boundary (v0.7). A record
        // before v0.7 can repeat the same cut on every turn; a cut equal to the last one adds no row.
        const range = Array.isArray(payload.dropped_seq_range) ? payload.dropped_seq_range : null;
        const cleared = typeof payload.cleared_through_seq === "number" ? payload.cleared_through_seq : null;
        const cut = JSON.stringify([cleared, range]);
        if (cut === this.lastCompactionCut) return;
        this.lastCompactionCut = cut;
        const parts: string[] = [];
        if (range) parts.push(`earlier turns dropped (seq ${range[0]}–${range[1]})`);
        if (cleared !== null) parts.push(`older tool output cleared (results through seq ${cleared})`);
        if (!parts.length) parts.push("compacted");
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "system",
          text: `— prompt history: ${parts.join("; ")}`,
        });
        return;
      }
      case EnvelopeKind.InputBuildFailed: {
        const error = payload.error ? String(payload.error) : "trigger input could not be built";
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "warning",
          text: `! input build failed: ${error}`,
        });
        return;
      }
      case EnvelopeKind.RunFinalised: {
        const transcript = this.snap.transcript;
        const lastTool = [...transcript].reverse().find((r) => r.kind === EnvelopeKind.ToolCall);
        if (lastTool && lastTool.callId) {
          const hasResult = transcript.some(
            (r) => r.kind === EnvelopeKind.ToolResult && r.callId === lastTool.callId,
          );
          if (!hasResult) {
            this.appendTranscript({
              seq: env.seq - 0.5, kind: "OrphanedToolCall", role: "warning",
              text: `! tool call ${lastTool.toolName ?? "?"} never returned — the run ended`,
            });
          }
        }
        return;
      }
      case EnvelopeKind.PredicateQuarantined: {
        // A Trigger's predicate or input builder raised and the kernel quarantined it: the
        // session cannot take that path again this run. Without this row the user saw nothing.
        const trig = String(payload.trigger_id ?? "?");
        const why = payload.error ? String(payload.error) : String(payload.reason ?? "quarantined");
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "warning",
          text: `! trigger ${trig} quarantined: ${why}`,
        });
        return;
      }
      case EnvelopeKind.ProducerEmittedInvalidEvent: {
        const producer = payload.producer as { kind?: string } | undefined;
        const at = payload.at_path ? ` at ${String(payload.at_path)}` : "";
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "warning",
          text: `! ${producer?.kind ?? "a producer"} emitted an invalid event${at}: ${String(payload.reason ?? "")}`,
        });
        return;
      }
      default: {
        if (!(env.kind in KIND_DISPOSITION_BY_VALUE)) {
          // A kind the generated vocabulary does not know: the kernel emits something
          // scripts/gen_kinds.py did not see. Loud in the console, not silent.
          console.warn(`[session_controller] unknown envelope kind ${env.kind} at seq ${env.seq}`);
        }
        return;
      }
    }
  }

  /** Close the stream on a SessionEnded and keep the session bound. An
   * ended session stays resumable (Peter's ruling 2026-09-25, server-side
   * in session_registry.turn_sync): the next sendTurn reopens the stream
   * and the server resumes the same record. Attaching an ended session
   * replays its SessionEnded; clearing sessionId here made the next typed
   * line open a brand-new session and wipe the replayed transcript. */
  private closeStreamOnEnd(reason: string): void {
    const sessionId = this.snap.sessionId;
    const hadStream = this.unsubscribeStream != null;
    if (this.unsubscribeStream) { this.unsubscribeStream(); this.unsubscribeStream = null; }
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.patch({ connection: "closed" as ConnectionState, endedReason: reason });
    // Emit STREAM_CLOSED once, when this call is the one that closed it;
    // the client-side onClose callback races the patched snapshot.
    if (hadStream && sessionId) this.emit("STREAM_CLOSED", { session_id: sessionId });
  }

  /** Close the stream and unbind the session — an explicit endSession.
   * The next typed line opens a new session. */
  private forceClose(reason: string): void {
    this.closeStreamOnEnd(reason);
    this.patch({ sessionId: null, sessionName: null, turnIndex: 0 });
  }

  private appendTranscript(row: TranscriptRow): void {
    this.patch({ transcript: [...this.snap.transcript, row] });
  }

  private patch(delta: Partial<Snapshot>): void {
    this.snap = { ...this.snap, ...delta };
    for (const listener of this.listeners) listener(this.snap);
  }
}

/** Pull a readable kernel out of a wrapped model-producer error. The raw
 * text is a `RuntimeError('<Responder> failed after N attempts: ...')`
 * carrying a chain of HTTPStatusError + body JSON + Go dial errors from
 * Ollama. Match the common cases first; fall back to a trimmed original.
 * The full text stays on the record's Park.detail — this is display shaping. */
function summariseModelError(raw: string): string {
  // `dial tcp: lookup <host>: <reason>` — the DNS / connection kernel.
  const dial = raw.match(/dial tcp: lookup ([^:"'\\]+): ([^"'\\]+)/);
  if (dial) return `network — could not reach ${dial[1]} (${dial[2].trim()})`;
  // `Server error 'NNN <Reason>' for url '<url>'`
  const http = raw.match(/Server error '(\d{3}) ([^']+)'/);
  if (http) {
    const [, code, reason] = http;
    if (code === "429") return `provider rate limited (429 ${reason})`;
    if (code === "502" || code === "503" || code === "504") return `provider unavailable (${code} ${reason})`;
    return `provider returned ${code} ${reason}`;
  }
  // Timeout signature.
  if (/(timeout|timed out|deadline exceeded)/i.test(raw)) return `provider timed out — no response after 3 attempts`;
  // Anti-spin bail (loop guarded).
  if (/stopped after \d+ failed tool call/i.test(raw)) return `tool bail: model called the same failing tool repeatedly and was stopped`;
  // Fallback: strip Python-wrapper crust and cap at 200 chars.
  const stripped = raw
    .replace(/^RuntimeError\(['"](.+?)['"]\)$/s, "$1")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length <= 200) return stripped;
  // UI sprint 160: an OSError ends with the path it failed on (`…: '<path>'`); the cap shortens the
  // text before it and keeps the path whole, since the path is what the reader acts on.
  const os = stripped.match(/^(.*): '([^']+)'$/s);
  if (os) return `${os[1].length > 160 ? os[1].slice(0, 160) + "…" : os[1]}: '${os[2]}'`;
  return stripped.slice(0, 200) + "…";
}


function rowFrom(s: RawSession, status: SessionRow["status"]): SessionRow {
  const short = (s.session_id ?? "").slice(0, 12);
  return {
    sessionId: s.session_id ?? "",
    name: s.name ?? (short ? `${short}…` : "session"),
    driver: s.driver ?? "?",
    status,
    workspacePath: s.workspace ?? null,
    workspaceShape: s.workspace_shape ?? null,
    createdAt: typeof s.created_at === "number" ? s.created_at : 0,
  };
}
