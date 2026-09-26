// Sprint 085c — AuthPromptCard as a mini terminal.
//
// Renders a CLI's login command live: SSE stream from the server's pty
// (Sprint 085a) drives an AnsiTerminal virtual grid; the grid renders as
// styled <pre> lines with SGR color runs. A focusable <div> captures
// keydown events, translates them to escape sequences (arrows, Enter,
// Ctrl-C, Backspace, printable chars), and POSTs to the pty's stdin
// endpoint. The card handles the login shapes Substrate ships:
// URL-based device flows (codex, cursor-agent, claude) show the URL as
// a click; interactive TUI walks (opencode's provider picker) navigate
// via arrow keys the same way iTerm handles them.
//
// On unmount the card POSTs /api/cli/<cli>/pty/close/<sid> so the
// server-side pty terminates when the user switches driver or the row
// is swept.

import * as React from "react";
import { AnsiTerminal, keyToBytes, type Sgr } from "./ansi";

interface Props { cli: string }

interface State {
  sid: string | null;
  exited: boolean;
  exitCode: number | null;
  postAuth: { authed: boolean | null; raw: string } | null;
  startError: string | null;
  version: number;  // forces re-render on grid change
}

const CARD_BG = "#1a1c20";
const CARD_BORDER = "rgba(255,255,255,.13)";
const HEADER_FG = "#e2e5e9";
const MUTED = "#62676f";
const LINK = "#82a5c8";
const OUTPUT_FG = "#b9bec5";

function b64ToBytes(b: string): Uint8Array {
  try {
    const raw = atob(b.trim());
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  } catch { return new Uint8Array(); }
}

// URL detection for the run rendering. Only pure-text runs get linkified
// so we don't split a styled run mid-URL.
const URL_RE = /https?:\/\/[^\s\u001b]+/g;
function renderRun(text: string, sgr: Sgr, key: string): React.ReactNode {
  const style: React.CSSProperties = {
    color: sgr.fg ?? OUTPUT_FG,
    backgroundColor: sgr.bg,
    fontWeight: sgr.bold ? 600 : undefined,
    opacity: sgr.dim ? 0.7 : undefined,
  };
  if (sgr.reverse) { const swap = style.color; style.color = style.backgroundColor ?? CARD_BG; style.backgroundColor = swap; }
  if (!URL_RE.test(text)) return <span key={key} style={style}>{text}</span>;
  URL_RE.lastIndex = 0;
  const parts: React.ReactNode[] = [];
  let last = 0; let m: RegExpExecArray | null; let idx = 0;
  while ((m = URL_RE.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <a key={`${key}u${idx++}`} href={m[0]} target="_blank" rel="noreferrer noopener"
         style={{ color: LINK, textDecoration: "underline" }}>{m[0]}</a>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <span key={key} style={style}>{parts}</span>;
}

const AuthPromptCardInner: React.FC<Props> = ({ cli }) => {
  const [state, setState] = React.useState<State>({
    sid: null, exited: false, exitCode: null, postAuth: null, startError: null, version: 0,
  });
  const termRef = React.useRef(new AnsiTerminal());
  const decoderRef = React.useRef(new TextDecoder("utf-8", { fatal: false }));
  const esRef = React.useRef<EventSource | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const sidRef = React.useRef<string | null>(null);

  const start = React.useCallback(async () => {
    termRef.current.reset();
    decoderRef.current = new TextDecoder("utf-8", { fatal: false });
    setState({ sid: null, exited: false, exitCode: null, postAuth: null, startError: null, version: 0 });
    try {
      const res = await fetch(`/api/cli/${encodeURIComponent(cli)}/pty/start`, { method: "POST" });
      if (!res.ok) { setState((s) => ({ ...s, startError: `pty start failed: ${res.status}` })); return; }
      const body = (await res.json()) as { sid?: string };
      const sid = body.sid;
      if (!sid) { setState((s) => ({ ...s, startError: "no sid in response" })); return; }
      sidRef.current = sid;
      setState((s) => ({ ...s, sid }));
      const es = new EventSource(`/api/cli/${encodeURIComponent(cli)}/pty/stream/${sid}`);
      esRef.current = es;
      es.onmessage = (ev) => {
        const bytes = b64ToBytes(ev.data);
        if (bytes.length === 0) return;
        // Streaming UTF-8 decode across SSE frame boundaries so a
        // multibyte character (e.g. opencode's box-drawing glyphs) that
        // spans two frames does not produce replacement characters.
        const chunk = decoderRef.current.decode(bytes, { stream: true });
        if (!chunk) return;
        termRef.current.write(chunk);
        setState((s) => ({ ...s, version: s.version + 1 }));
      };
      es.addEventListener("exit", (ev) => {
        try {
          const parsed = JSON.parse((ev as MessageEvent).data ?? "{}") as { exit_code?: number };
          setState((s) => ({ ...s, exited: true, exitCode: parsed.exit_code ?? null, version: s.version + 1 }));
        } catch { setState((s) => ({ ...s, exited: true, exitCode: null })); }
        es.close();
        void fetch(`/api/cli/${encodeURIComponent(cli)}/status`)
          .then((r) => r.json())
          .then((raw) => setState((s) => ({ ...s, postAuth: raw as { authed: boolean | null; raw: string } })))
          .catch(() => undefined);
      });
      es.onerror = () => { /* server hangup — exit event usually fires first */ };
    } catch (err) {
      setState((s) => ({ ...s, startError: err instanceof Error ? err.message : String(err) }));
    }
  }, [cli]);

  React.useEffect(() => {
    void start();
    return () => {
      if (esRef.current) esRef.current.close();
      const sid = sidRef.current;
      if (sid) {
        // Best-effort kill of the server-side pty on unmount (driver
        // switch, transcript sweep, or full close). Fire-and-forget.
        void fetch(`/api/cli/${encodeURIComponent(cli)}/pty/close/${sid}`, { method: "POST" })
          .catch(() => undefined);
      }
    };
  }, [start, cli]);

  const onKeyDown = React.useCallback((ev: React.KeyboardEvent<HTMLDivElement>) => {
    if (state.exited || !state.sid) return;
    // Let the browser handle copy on Cmd/Ctrl+C when a selection exists.
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "c") {
      const sel = window.getSelection();
      if (sel && sel.toString().length > 0) return;
    }
    const bytes = keyToBytes(ev.nativeEvent);
    if (bytes === null) return;
    ev.preventDefault();
    ev.stopPropagation();
    void fetch(`/api/cli/${encodeURIComponent(cli)}/pty/stdin/${state.sid}`, {
      method: "POST", body: bytes,
    }).catch(() => undefined);
  }, [cli, state.sid, state.exited]);

  const cancel = React.useCallback(async () => {
    if (!state.sid) return;
    await fetch(`/api/cli/${encodeURIComponent(cli)}/pty/close/${state.sid}`, { method: "POST" })
      .catch(() => undefined);
  }, [cli, state.sid]);

  const snap = termRef.current.snapshot();
  const badge = state.exited
    ? (state.postAuth?.authed ? "authenticated" : (state.exitCode === 0 ? "exited" : `exit ${state.exitCode}`))
    : "waiting";
  const badgeColor = state.exited
    ? (state.postAuth?.authed ? "#7fb3b8" : (state.exitCode === 0 ? MUTED : "#c26058"))
    : LINK;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onClick={() => containerRef.current?.focus()}
      style={{
        border: `1px solid ${CARD_BORDER}`, borderRadius: 6, background: CARD_BG,
        padding: "10px 12px", marginTop: 6, maxWidth: 780, outline: "none",
      }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ color: HEADER_FG, fontWeight: 600 }}>{cli}</span>
        <span style={{ color: MUTED, fontSize: 11 }}>login inside substrate</span>
        <span style={{ marginLeft: "auto", color: badgeColor, fontSize: 11 }}>{badge}</span>
      </div>
      {state.startError ? (
        <div style={{ color: "#c26058", fontSize: 12, marginTop: 6 }}>{state.startError}</div>
      ) : null}
      <div style={{
        marginTop: 8, fontFamily: "inherit", fontSize: 12, lineHeight: 1.4,
        color: OUTPUT_FG, maxHeight: 320, overflowY: "auto",
      }}>
        {snap.rows.map((row, r) => (
          <div key={`r${r}v${state.version}`} style={{ whiteSpace: "pre", minHeight: 16 }}>
            {row.runs.map((run, k) => renderRun(run.text, run.sgr, `${r}-${k}`))}
          </div>
        ))}
      </div>
      {!state.exited ? (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: MUTED, fontSize: 11 }}>click the box, then type; arrow keys work</span>
          <button
            onClick={() => void cancel()}
            style={{
              marginLeft: "auto",
              background: "transparent", color: MUTED, border: `1px solid ${CARD_BORDER}`,
              borderRadius: 4, padding: "4px 10px", cursor: "pointer",
              fontSize: 11, fontFamily: "inherit",
            }}>cancel</button>
        </div>
      ) : (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: MUTED, fontSize: 11 }}>
            {state.postAuth?.authed ? "ready to pick a session" : "not authenticated yet"}
          </span>
          <button
            onClick={() => void start()}
            style={{
              marginLeft: "auto",
              background: "transparent", color: LINK, border: `1px solid ${CARD_BORDER}`,
              borderRadius: 4, padding: "4px 10px", cursor: "pointer",
              fontSize: 11, fontFamily: "inherit",
            }}>retry</button>
        </div>
      )}
    </div>
  );
};

export const AuthPromptCard = React.memo(AuthPromptCardInner);
