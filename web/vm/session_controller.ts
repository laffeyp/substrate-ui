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
  ConnectionState,
  RecordEnvelope,
  Snapshot,
  SessionRow,
  TranscriptRow,
  WorkspaceRow,
} from "./types";
import type { SubstrateClient, Unsubscribe } from "./client";

type Listener = (snap: Snapshot) => void;

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
}

interface RecentWorkspaceRow {
  path: string;
  shape: string;
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
  connection: "idle",
  lastError: null,
};

export class SessionController {
  private snap: Snapshot = { ...EMPTY_SNAPSHOT };
  private readonly listeners = new Set<Listener>();
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

  // ── boot loaders ────────────────────────────────────────────────────
  async loadDriverRoster(): Promise<void> {
    const result = await this.client.fetchJson<ModelsRoster>("/api/models");
    if (!result.ok) { this.patch({ lastError: `driver_roster: ${result.detail}` }); return; }
    const roster = Array.isArray(result.data.models) ? result.data.models : [];
    const defaultDriver = typeof result.data.default === "string" ? result.data.default : null;
    this.patch({ driverRoster: roster, driverDefault: defaultDriver });
  }

  async loadLiveSessions(): Promise<void> {
    const result = await this.client.fetchJson<SessionBuckets>("/api/session");
    if (!result.ok) { this.patch({ lastError: `sessions: ${result.detail}` }); return; }
    const rows: SessionRow[] = [];
    for (const s of result.data.live ?? []) rows.push(rowFrom(s, "live"));
    for (const s of result.data.parked ?? []) rows.push(rowFrom(s, "parked"));
    for (const s of result.data.interrupted ?? []) rows.push(rowFrom(s, "interrupted"));
    this.patch({ liveSessions: rows });
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
  }

  // ── session lifecycle ───────────────────────────────────────────────
  async openSession(request: OpenSessionRequest = {}): Promise<void> {
    if (this.snap.sessionId) return;
    const driver = request.driver
      ?? this.snap.driver
      ?? this.snap.driverDefault
      ?? "deterministic";
    const body: Record<string, unknown> = { driver };
    if (request.driverParams) body.driver_params = request.driverParams;
    if (request.workspace) body.workspace = request.workspace;
    if (request.workspaceShape) body.workspace_shape = request.workspaceShape;
    if (request.bundle) body.bundle = request.bundle;
    if (request.tools) body.tools = request.tools;
    if (request.name) body.name = request.name;
    if (request.isolate) body.isolate = request.isolate;
    this.patch({ connection: "connecting", lastError: null, driver });
    const result = await this.client.fetchJson<OpenSessionAck>("/api/session", { method: "POST", body });
    if (!result.ok) {
      this.patch({ connection: "closed", lastError: `session_open: ${result.detail}` });
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
      parkReason: null,
      endedReason: null,
    });
    this.attachStream(ack.session_id);
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
    }
  }

  /** Attach to an existing session (opened by another client or by an
   * earlier boot). Replays every envelope from seq 0 so the visible
   * transcript is the record's full history, then follows live. */
  async attachExisting(sessionId: string): Promise<void> {
    if (!sessionId) return;
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
      parkReason: null,
      endedReason: null,
    });
    this.attachStream(manifest.session_id);
  }

  async endSession(reason: string = "user_exit"): Promise<void> {
    const sessionId = this.snap.sessionId;
    if (!sessionId) return;
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
  async interruptTurn(): Promise<void> {
    const sessionId = this.snap.sessionId;
    if (!sessionId) return;
    const result = await this.client.fetchJson<{ interrupted?: boolean; landed?: boolean }>(
      `/api/session/${encodeURIComponent(sessionId)}/interrupt`,
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
    this.appendTranscript({
      seq: -Math.round(Date.now()) - 6,
      kind: "Interrupted", role: "system",
      text: wasInterrupted
        ? `^C interrupt (${landed ? "landed" : "dispatched — envelope arriving on /events"})`
        : "^C — no turn in flight",
    });
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
      onOpen: () => this.patch({ connection: "connected" }),
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
  }

  private handleStreamError(sessionId: string): void {
    if (this.snap.sessionId !== sessionId) return;
    this.patch({ connection: "reconnecting" });
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.snap.sessionId === sessionId) this.attachStream(sessionId);
    }, 1000);
  }

  private handleEnvelope(sessionId: string, env: RecordEnvelope): void {
    if (typeof env.seq === "number" && env.seq > this.lastSeq) this.lastSeq = env.seq;
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
        const toolName = payload.tool ? String(payload.tool) : "";
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "tool",
          text: `call ${toolName}`, toolName,
        });
        return;
      }
      case "ToolResult": {
        const toolName = payload.tool ? String(payload.tool) : "";
        const ok = payload.ok !== false;
        const err = payload.error ? String(payload.error) : "";
        this.appendTranscript({
          seq: env.seq, kind: env.kind, role: "tool",
          text: ok ? `${toolName} → ok` : `${toolName} → err ${err}`,
          toolName, toolOk: ok,
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
      default: {
        // Every other envelope kind is recorded but not rendered; a future
        // View can pick it up off the transcript by kind.
        return;
      }
    }
  }

  private forceClose(reason: string): void {
    if (this.unsubscribeStream) { this.unsubscribeStream(); this.unsubscribeStream = null; }
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.patch({
      sessionId: null,
      sessionName: null,
      turnIndex: 0,
      connection: "closed" as ConnectionState,
      endedReason: reason,
    });
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
  };
}
