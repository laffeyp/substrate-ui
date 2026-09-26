// Sprint 085b — AuthPromptCard.
//
// Renders a live view of a CLI's login command running inside a
// pty on the substrate-ui server. The card takes the cli name as
// its prop; on mount it POSTs /api/cli/<cli>/pty/start, opens an
// EventSource on /api/cli/<cli>/pty/stream/<sid>, decodes each
// base64 frame into the output pane, linkifies http(s) URLs so the
// user can click into the vendor's OAuth flow, and forwards
// keystrokes typed into the local textarea to /api/cli/<cli>/pty/stdin/<sid>.
// The stream's `event: exit` frame flips the card into a done
// state that says "authenticated (or cancelled)"; a re-probe of
// /api/cli/<cli>/status is offered as a "retry" affordance.

import * as React from "react";

interface Props { cli: string }

interface State {
  sid: string | null;
  output: string;
  exited: boolean;
  exitCode: number | null;
  postAuth: { authed: boolean | null; raw: string } | null;
  keystrokeDraft: string;
  startError: string | null;
}

const CARD_BG = "#1a1c20";
const CARD_BORDER = "rgba(255,255,255,.13)";
const HEADER_FG = "#e2e5e9";
const MUTED = "#62676f";
const LINK = "#82a5c8";
const OUTPUT_FG = "#b9bec5";

function decodeSseFrame(b64: string): string {
  try { return atob(b64.trim()); } catch { return ""; }
}

function linkifyChildren(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const urlRe = /https?:\/\/[^\s\u001b]+/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = urlRe.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const url = match[0];
    out.push(
      <a key={`u${key++}`} href={url} target="_blank" rel="noreferrer noopener" style={{ color: LINK, textDecoration: "underline" }}>{url}</a>,
    );
    last = match.index + url.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// Strip ANSI escape sequences so the transcript stays readable.
// Login CLIs use colour, cursor moves, and clear-line codes freely;
// the card is not a terminal emulator — flatten to text.
function stripAnsi(s: string): string {
  return s.replace(/\u001b\[[0-9;?]*[A-Za-z]/g, "").replace(/\u001b\][^\u0007]*\u0007/g, "");
}

const AuthPromptCardInner: React.FC<Props> = ({ cli }) => {
  const [state, setState] = React.useState<State>({
    sid: null, output: "", exited: false, exitCode: null,
    postAuth: null, keystrokeDraft: "", startError: null,
  });
  const esRef = React.useRef<EventSource | null>(null);

  const start = React.useCallback(async () => {
    setState((s) => ({ ...s, output: "", exited: false, exitCode: null, postAuth: null, startError: null }));
    try {
      const res = await fetch(`/api/cli/${encodeURIComponent(cli)}/pty/start`, { method: "POST" });
      if (!res.ok) {
        setState((s) => ({ ...s, startError: `pty start failed: ${res.status}` }));
        return;
      }
      const body = (await res.json()) as { sid?: string };
      const sid = body.sid;
      if (!sid) { setState((s) => ({ ...s, startError: "no sid in response" })); return; }
      setState((s) => ({ ...s, sid }));
      const es = new EventSource(`/api/cli/${encodeURIComponent(cli)}/pty/stream/${sid}`);
      esRef.current = es;
      es.onmessage = (ev) => {
        const chunk = stripAnsi(decodeSseFrame(ev.data));
        if (!chunk) return;
        setState((s) => ({ ...s, output: s.output + chunk }));
      };
      es.addEventListener("exit", (ev) => {
        try {
          const parsed = JSON.parse((ev as MessageEvent).data ?? "{}") as { exit_code?: number };
          setState((s) => ({ ...s, exited: true, exitCode: parsed.exit_code ?? null }));
        } catch {
          setState((s) => ({ ...s, exited: true, exitCode: null }));
        }
        es.close();
        // Auto-reprobe status once the login exits.
        void fetch(`/api/cli/${encodeURIComponent(cli)}/status`)
          .then((r) => r.json())
          .then((raw) => setState((s) => ({ ...s, postAuth: raw as { authed: boolean | null; raw: string } })))
          .catch(() => undefined);
      });
      es.onerror = () => { /* server hangup — the exit event usually fires first */ };
    } catch (err) {
      setState((s) => ({ ...s, startError: err instanceof Error ? err.message : String(err) }));
    }
  }, [cli]);

  React.useEffect(() => {
    void start();
    return () => { if (esRef.current) esRef.current.close(); };
  }, [start]);

  const sendKeystrokes = React.useCallback(async (data: string) => {
    if (!state.sid || state.exited) return;
    await fetch(`/api/cli/${encodeURIComponent(cli)}/pty/stdin/${state.sid}`, {
      method: "POST", body: data,
    }).catch(() => undefined);
  }, [cli, state.sid, state.exited]);

  const cancel = React.useCallback(async () => {
    if (!state.sid) return;
    await fetch(`/api/cli/${encodeURIComponent(cli)}/pty/close/${state.sid}`, { method: "POST" })
      .catch(() => undefined);
  }, [cli, state.sid]);

  const badge = state.exited
    ? (state.postAuth?.authed ? "authenticated" : (state.exitCode === 0 ? "exited" : `exit ${state.exitCode}`))
    : "waiting";
  const badgeColor = state.exited
    ? (state.postAuth?.authed ? "#7fb3b8" : (state.exitCode === 0 ? MUTED : "#c26058"))
    : LINK;

  return (
    <div style={{
      border: `1px solid ${CARD_BORDER}`, borderRadius: 6, background: CARD_BG,
      padding: "10px 12px", marginTop: 6, maxWidth: 780,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ color: HEADER_FG, fontWeight: 600 }}>{cli}</span>
        <span style={{ color: MUTED, fontSize: 11 }}>login inside substrate</span>
        <span style={{ marginLeft: "auto", color: badgeColor, fontSize: 11 }}>{badge}</span>
      </div>
      {state.startError ? (
        <div style={{ color: "#c26058", fontSize: 12, marginTop: 6 }}>{state.startError}</div>
      ) : null}
      <pre style={{
        marginTop: 8, whiteSpace: "pre-wrap", overflowWrap: "anywhere",
        color: OUTPUT_FG, fontFamily: "inherit", fontSize: 12, lineHeight: 1.45,
        maxHeight: 320, overflowY: "auto", background: "transparent",
      }}>{linkifyChildren(state.output || "…")}</pre>
      {!state.exited ? (
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <input
            value={state.keystrokeDraft}
            onChange={(e) => setState((s) => ({ ...s, keystrokeDraft: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void sendKeystrokes(state.keystrokeDraft + "\n");
                setState((s) => ({ ...s, keystrokeDraft: "" }));
                e.preventDefault();
              }
            }}
            placeholder="type here if the CLI is asking for input"
            style={{
              flex: 1, background: "#212327", color: HEADER_FG,
              border: `1px solid ${CARD_BORDER}`, borderRadius: 4,
              padding: "4px 8px", fontSize: 12, fontFamily: "inherit", outline: "none",
            }}
          />
          <button
            onClick={() => void cancel()}
            style={{
              background: "transparent", color: MUTED, border: `1px solid ${CARD_BORDER}`,
              borderRadius: 4, padding: "4px 10px", cursor: "pointer",
              fontSize: 11, fontFamily: "inherit",
            }}>cancel</button>
        </div>
      ) : (
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button
            onClick={() => void start()}
            style={{
              background: "transparent", color: LINK, border: `1px solid ${CARD_BORDER}`,
              borderRadius: 4, padding: "4px 10px", cursor: "pointer",
              fontSize: 11, fontFamily: "inherit",
            }}>retry</button>
          <span style={{ color: MUTED, fontSize: 11, alignSelf: "center" }}>
            {state.postAuth?.authed ? "ready to pick a session" : "not authenticated yet"}
          </span>
        </div>
      )}
    </div>
  );
};

export const AuthPromptCard = React.memo(AuthPromptCardInner);
