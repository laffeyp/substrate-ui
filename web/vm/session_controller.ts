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
  BundleRow,
  ConnectionState,
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
}

/** ACK shape POST /api/session returns; only fields the controller reads. */
interface OpenSessionAck {
  session_id: string;
  name?: string | null;
  bundle?: string | null;
  workspace?: string | null;
  workspace_shape?: string | null;
  driver_params?: Record<string, unknown> | null;
}

interface ModelsRoster {
  models: string[];
  default: string;
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
  bundleSlug: null,
  workspacePath: null,
  workspaceShape: null,
  turnIndex: 0,
  transcript: [],
  parkReason: null,
  endedReason: null,
  driverRoster: [],
  driverDefault: null,
  liveSessions: [],
  recentWorkspaces: [],
  bundleRoster: [],
  connection: "idle",
  lastError: null,
  topologyGraph: null,
  rawEnvelopes: [],
};

export class SessionController {
  private snap: Snapshot = { ...EMPTY_SNAPSHOT };
  private readonly listeners = new Set<Listener>();
  private readonly eventListeners = new Set<EventListener>();
  private unsubscribeStream: Unsubscribe | null = null;
  private lastSeq = -1;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private endedEmittedFor: string | null = null;

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
    this.patch({ driverRoster: roster, driverDefault: defaultDriver });
    this.emit("DRIVER_ROSTER_LOADED", { count: roster.length, default: defaultDriver });
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
      const row = p as { kind?: string; emits?: string[]; initial?: boolean; is_initial?: boolean };
      return {
        kind: String(row.kind ?? "?"),
        emits: Array.isArray(row.emits) ? row.emits.map((e) => String(e)) : [],
        // Server uses `is_initial`; older shapes used `initial`. Accept both.
        initial: !!(row.is_initial ?? row.initial),
      };
    });
    const triggers: TriggerEdge[] = triggersRaw.map((t, idx) => {
      const row = t as { id?: string; on?: string | string[]; on_kind?: string; kind?: string; starts?: string };
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
        starts: String(row.starts ?? "?"),
      };
    });
    this.patch({ topologyGraph: { producers, triggers } });
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
    // Never open a session with a made-up driver. If the caller passed
    // none and the roster hasn't landed, wait for it — /api/models
    // resolves in a few milliseconds and its `default` is the honest
    // driver to use.
    if (!request.driver && !this.snap.driver && !this.snap.driverDefault) {
      await this.loadDriverRoster();
    }
    const driver = request.driver
      ?? this.snap.driver
      ?? this.snap.driverDefault
      ?? "deterministic";
    const body: Record<string, unknown> = { driver };
    if (request.driverParams) body.driver_params = request.driverParams;
    if (request.workspace) body.workspace = request.workspace;
    if (request.workspaceShape) body.workspace_shape = request.workspaceShape;
    const bundle = request.bundle ?? this.snap.bundleSlug;
    if (bundle) body.bundle = bundle;
    if (request.tools) body.tools = request.tools;
    if (request.name) body.name = request.name;
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
    this.endedEmittedFor = null;
    this.patch({
      sessionId: ack.session_id,
      sessionName: ack.name ?? null,
      driver,
      bundleSlug: ack.bundle ?? null,
      workspacePath: ack.workspace ?? null,
      workspaceShape: ack.workspace_shape ?? null,
      turnIndex: 0,
      transcript: [],
      rawEnvelopes: [],
      parkReason: null,
      endedReason: null,
    });
    this.attachStream(ack.session_id);
    this.loadTopologyGraph(ack.session_id).catch(() => undefined);
    this.emit("SESSION_OPEN_ACKED", { session_id: ack.session_id, name: ack.name ?? null, driver });
  }

  async sendTurn(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!this.snap.sessionId) await this.openSession();
    const sessionId = this.snap.sessionId;
    if (!sessionId) return;
    // Local echo first so the shell never looks hung during a slow round-trip.
    this.appendTranscript({
      seq: -Math.round(Date.now()),
      kind: "UserMessage",
      role: "user",
      text: trimmed,
    });
    const turnIndex = this.snap.turnIndex;
    this.patch({ turnIndex: turnIndex + 1, parkReason: null });
    this.emit("TURN_SUBMITTED", { session_id: sessionId, turn_index: turnIndex, text_length: trimmed.length });
    const result = await this.client.fetchJson<unknown>(
      `/api/session/${encodeURIComponent(sessionId)}/turn`,
      { method: "POST", body: { text: trimmed } },
    );
    if (!result.ok) {
      this.appendTranscript({
        seq: -Math.round(Date.now()) - 1,
        kind: "TurnError",
        role: "warning",
        text: `turn refused: ${result.detail}`,
      });
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
    this.endedEmittedFor = null;
    this.patch({
      sessionId: null,
      sessionName: recordRoot,
      turnIndex: 0,
      transcript: [],
      rawEnvelopes: [],
      parkReason: null,
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
    }>(`/api/session/${encodeURIComponent(sessionId)}`);
    if (!result.ok) {
      this.patch({ lastError: `attach: ${result.detail}` });
      return;
    }
    const manifest = result.data;
    this.lastSeq = -1;
    this.endedEmittedFor = null;
    this.patch({
      sessionId: manifest.session_id,
      sessionName: manifest.name ?? null,
      driver: manifest.driver ?? this.snap.driver,
      bundleSlug: manifest.bundle ?? null,
      workspacePath: manifest.workspace ?? null,
      workspaceShape: manifest.workspace_shape ?? null,
      turnIndex: 0,
      transcript: [],
      rawEnvelopes: [],
      parkReason: null,
      endedReason: null,
    });
    this.attachStream(manifest.session_id);
    this.loadTopologyGraph(manifest.session_id).catch(() => undefined);
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
      return;
    }
    // The SessionEnded envelope on the stream flushes the rest. If the stream
    // dropped mid-end, force the close here.
    if (this.snap.connection !== "connected") this.forceClose(reason);
  }

  pickDriver(name: string): void {
    this.patch({ driver: name });
    this.emit("DRIVER_PICKED", { driver: name });
  }

  /** Choose the bundle openSession will pass unless overridden. Null
   * clears the choice. Silent no-op after a session opens; the bundle
   * is fixed on the record at that point. */
  pickBundle(slug: string | null): void {
    if (this.snap.sessionId) return;
    this.patch({ bundleSlug: slug });
    this.emit("BUNDLE_PICKED", { bundle: slug });
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
    const parts = text.slice(1).split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const rest = parts.slice(1).join(" ");
    this.emit("SLASH_ROUTED", { cmd });
    switch (cmd) {
      case "exit":
      case "quit":
      case "end":
        await this.endSession("user_end");
        return true;
      case "model":
      case "driver":
        if (rest) this.pickDriver(rest);
        else this.appendTranscript({
          seq: -Math.round(Date.now()) - 2,
          kind: "SlashHelp", role: "system",
          text: `current driver: ${this.snap.driver ?? this.snap.driverDefault ?? "deterministic"}. use /model <name> to switch.`,
        });
        return true;
      case "help":
      case "?": {
        const known = ["/exit", "/model <name>", "/name <new>", "/list", "/interrupt", "/clear", "/help"];
        this.appendTranscript({
          seq: -Math.round(Date.now()) - 3,
          kind: "SlashHelp", role: "system",
          text: `slash commands: ${known.join(" · ")}`,
        });
        return true;
      }
      case "clear":
        this.patch({ transcript: [] });
        return true;
      case "interrupt":
      case "int":
        await this.interruptTurn();
        return true;
      case "name":
      case "rename":
        if (!rest) {
          this.appendTranscript({
            seq: -Math.round(Date.now()) - 9,
            kind: "SlashHelp", role: "system",
            text: `current name: ${this.snap.sessionName ?? "(unnamed)"}. use /name <new> to rename.`,
          });
        } else {
          await this.renameSession(rest);
        }
        return true;
      case "list":
      case "ls":
        await this.loadLiveSessions();
        {
          const rows = this.snap.liveSessions;
          const text = rows.length
            ? `${rows.length} session${rows.length === 1 ? "" : "s"}: ${rows.map(r => `${r.name} (${r.status})`).join(", ")}`
            : "no sessions on the server";
          this.appendTranscript({
            seq: -Math.round(Date.now()) - 10,
            kind: "SlashListed", role: "system",
            text,
          });
        }
        return true;
      default:
        this.appendTranscript({
          seq: -Math.round(Date.now()) - 4,
          kind: "SlashUnknown", role: "warning",
          text: `unknown slash: /${cmd}. /help for the list.`,
        });
        this.emit("SLASH_UNKNOWN", { cmd });
        return true;
    }
  }

  /** Rename the current session. PATCH /api/session/<id> body
   * `{name: <new>}`. Refreshes the snapshot's sessionName on ACK. */
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
  async interruptTurn(tier: "soft" | "hard" = "hard"): Promise<void> {
    const sessionId = this.snap.sessionId;
    if (!sessionId) return;
    const result = await this.client.fetchJson<{ interrupted?: boolean; landed?: boolean; signal?: boolean; tier?: string }>(
      `/api/session/${encodeURIComponent(sessionId)}/interrupt?tier=${tier}`,
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
    let text: string;
    if (isSignal) {
      // Phase 8 item 5 · tier=soft with a live tool: the registry
      // recorded the signal; the model will read the InterruptRequested
      // envelope on its next turn (items 6-7) and return.
      text = "^C — soft interrupt requested; the model will stop after this tool";
    } else if (wasInterrupted && tier === "hard") {
      text = "^C — hard interrupt; producer cancelled";
    } else if (wasInterrupted) {
      text = `^C interrupt (${landed ? "landed" : "dispatched — envelope arriving on /events"})`;
    } else {
      text = "^C — no turn in flight";
    }
    this.appendTranscript({ seq: -Math.round(Date.now()) - 6, kind: "Interrupted", role: "system", text });
    this.emit("TURN_INTERRUPTED", { was_interrupted: wasInterrupted, landed, tier, signal: isSignal });
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
    if (typeof env.seq === "number" && env.seq > this.lastSeq) this.lastSeq = env.seq;
    this.emit("STREAM_ENVELOPE_APPENDED", { seq: env.seq, kind: env.kind });
    // Append to rawEnvelopes for the stream lens; dedupe by seq so a
    // resume-replay doesn't double-count.
    const existing = this.snap.rawEnvelopes;
    const alreadyAt = existing.findIndex((e) => e.seq === env.seq);
    if (alreadyAt < 0) {
      this.patch({ rawEnvelopes: [...existing, env] });
    }
    const payload = env.payload ?? {};
    switch (env.kind) {
      case "SessionStarted": {
        const driver = payload.driver_model != null ? String(payload.driver_model) : this.snap.driver;
        const bundle = payload.bundle == null ? this.snap.bundleSlug : String(payload.bundle);
        this.patch({ driver, bundleSlug: bundle });
        return;
      }
      case "UserMessage": {
        const text = String(payload.text ?? "");
        // Dedup against the local echo appended in sendTurn.
        const transcript = this.snap.transcript;
        const echoIndex = transcript.findIndex(
          (row) => row.role === "user" && row.text === text && row.seq < 0,
        );
        if (echoIndex >= 0) {
          const next = transcript.slice();
          next[echoIndex] = { ...next[echoIndex], seq: env.seq };
          this.patch({ transcript: next });
        } else {
          this.appendTranscript({ seq: env.seq, kind: env.kind, role: "user", text });
        }
        return;
      }
      case "ModelReply": {
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "model",
          text: String(payload.text ?? ""),
        });
        return;
      }
      case "FinalAnswer": {
        // A bail-final answer with distinct text still shows; a normal duplicate
        // of the preceding ModelReply is skipped so the transcript doesn't
        // double-print.
        const text = String(payload.text ?? "");
        const last = this.snap.transcript[this.snap.transcript.length - 1];
        if (!text || (last && last.role === "model" && last.text === text)) return;
        this.appendTranscript({ seq: env.seq, kind: env.kind, role: "warning", text });
        return;
      }
      case "ToolCall": {
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
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "tool",
          text: preview ? `${toolName} ${preview}` : `call ${toolName}`,
          toolName, callId, args, toolStep: step,
        });
        return;
      }
      case "ToolResult": {
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
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "tool",
          text: ok ? `${toolName} → ok` : `${toolName} → err ${err}`,
          toolName, callId, output, error: err, toolOk: ok, toolStep: step,
        });
        return;
      }
      case "Park": {
        const reason = String(payload.reason ?? "");
        this.patch({ parkReason: reason });
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "park",
          text: `· parked (${reason}) — your turn`,
        });
        this.emit("TURN_PARKED", { park_reason: reason });
        return;
      }
      case "SessionEnded": {
        const reason = String(payload.reason ?? "server_end");
        this.endedEmittedFor = sessionId;
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "ended",
          text: `session ended (${reason})`,
        });
        this.forceClose(reason);
        this.emit("SESSION_ENDED_LOCAL", { reason });
        return;
      }
      case "SessionWarning": {
        const cond = String(payload.condition_kind ?? "warning");
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "warning",
          text: `warning: ${cond}`,
        });
        return;
      }
      case "RateLimitedWaiting": {
        const model = payload.model ? String(payload.model) : this.snap.driver ?? "?";
        const retry = payload.retry_after_seconds ?? payload.wait_s ?? "?";
        const attempt = payload.attempt ?? payload.retry ?? "?";
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "warning",
          text: `◌ rate-limited — retry ${attempt} in ${retry}s · ${model}`,
        });
        return;
      }
      case "TranscriptCompacted": {
        const droppedStart = payload.dropped_seq_start ?? "?";
        const droppedEnd = payload.dropped_seq_end ?? "?";
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "system",
          text: `— transcript compacted (dropped seq ${droppedStart}–${droppedEnd})`,
        });
        return;
      }
      default: {
        // Every other envelope kind is recorded but not rendered; a future
        // View can pick it up off the transcript by kind.
        return;
      }
    }
  }

  private forceClose(reason: string): void {
    const priorSessionId = this.snap.sessionId;
    if (this.unsubscribeStream) { this.unsubscribeStream(); this.unsubscribeStream = null; }
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.patch({
      sessionId: null,
      sessionName: null,
      turnIndex: 0,
      connection: "closed" as ConnectionState,
      endedReason: reason,
    });
    // Emit STREAM_CLOSED here so a force-close on SessionEnded still
    // fires the tag; the client-side onClose callback races the
    // patched snapshot and its guard short-circuits.
    if (priorSessionId) this.emit("STREAM_CLOSED", { session_id: priorSessionId });
  }

  private appendTranscript(row: TranscriptRow): void {
    this.patch({ transcript: [...this.snap.transcript, row] });
  }

  private patch(delta: Partial<Snapshot>): void {
    this.snap = { ...this.snap, ...delta };
    for (const listener of this.listeners) listener(this.snap);
  }
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
