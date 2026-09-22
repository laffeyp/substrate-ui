/* Sprint 035x — terminal-module shared types.

   Extracted from web/terminal.ts so slash handlers under
   web/terminal/slash/ can depend on the interface without pulling in
   the whole session machinery. Two shapes:

   - TerminalHandle — the state the mountTerminal closure returns to the
     rest of the module. Session lifecycle lives here (sessionId,
     driverName, etc.). Callbacks the handle exposes (endSession,
     updatePrompt, updateParamsHint) are injected by mountTerminal so
     slash files stay decoupled from the impl.

   - SlashCommand / SlashContext — the contract every slash handler
     under web/terminal/slash/ implements. One class per slash;
     web/terminal/slash/index.ts collects them into SLASH_COMMANDS and
     exposes route(). */

export interface PendingContext {
  parent_seq_range: [number, number];
  kinds: string[];
}

export interface TerminalHandle {
  el: HTMLElement;
  sessionId: string | null;
  driverName: string;
  bundleSlug: string;
  eventSource: EventSource | null;
  turnIndex: number;
  lastSeq: number;
  chatting: boolean;
  endedEmittedFor: string | null;
  updatePrompt: () => void;
  updateParamsHint: () => void;
  driverParams: Record<string, unknown> | null;
  pendingDriverParams: Record<string, unknown> | null;
  pendingCreate: {
    bundle?: string;
    workspace?: string;
    workspace_shape?: string;
    isolate?: boolean;
    tools?: string[];
    name?: string;
  };
  pendingContext: PendingContext | null;
  currentRecord: string | null;
  // Sprint 048: dedup for local echo. _sendTurn pushes "> text" locally on
  // Enter (before any await) so the user sees their message immediately;
  // the SSE UserMessage envelope's render then dedups against this so the
  // same line does not print twice. `lastReplyText` does the same job for
  // the ModelReply → FinalAnswer pair (they carry the same text on a
  // normal answer; FinalAnswer.text on a bail is DIFFERENT and must
  // render).
  lastEchoedUserText: string | null;
  lastRenderedReplyText: string | null;
  // Sprint 035x: /exit slash calls this; mountTerminal binds it to the
  // module-private _endSession so slash files stay decoupled.
  endSession: (reason: string) => Promise<void>;
}

export const CLS = {
  in: "tl-in",
  out: "tl-out",
  dim: "tl-dim",
  err: "tl-err",
  accent: "tl-accent",
} as const;

export const HELP_TEXT: readonly string[] = [
  "substrate daily-driver terminal — slash inventory:",
  "  /exit                              end this session cleanly",
  "  /model <name>                      swap driver mid-session",
  "  /tools <a,b,c>                     restrict tool suite (empty for unrestricted)",
  "  /bundle <name>                     attach a bundle (queues if no session; PATCH mid-session)",
  "  /workspace <path>                  set workspace at create time (immutable per session)",
  "  /isolate on|off                    Mode 3 nested-child dirs at create time",
  "  /name <n>                          register the next session under a name",
  "  /context <lo-hi> [--kind K]        inject a record slice into the next turn",
  "  /inspect [<record>]                narrate the record's causal beats",
  "  /narrate [<record>]                same as /inspect",
  "  /tail [<record>]                   raw events for the record",
  "  /cat <seq> [<record>]              one event's full payload",
  "  /list [records|topologies|sessions|applications|bundles]",
  "  /replay <record>                   assert byte-identical replay (needs daemon endpoint — hint only)",
  "  /run <application>                 launch a topology as a delegate child",
  "  /set [think|tokens|timeout] [val]  read or change driver params (think on|off; tokens N (0=∞); timeout N)",
  "  /diff                              worktree diff for this session's workspace",
  "  /studio                            open the topology-authoring studio in a new tab",
  "  /interrupt                         cancel the current turn (Ctrl+C alt)",
  "  /help                              this list",
];

export interface SlashContext {
  h: TerminalHandle;
  body: HTMLDivElement;
}

export interface SlashCommand {
  name: string;  // "/model"
  execute: (args: string[], ctx: SlashContext) => Promise<void>;
}
