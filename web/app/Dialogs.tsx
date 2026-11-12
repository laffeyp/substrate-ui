// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The settings dialog and the end-session confirm (sprint 214; plan PLAN-2026-11-04-shell-to-react-r5.md,
// B1). Moved from the dialog block of the dc-runtime template (`web/reveal.html` at `d4322e1`);
// the styles are copied as written, so the
// pixel captures hold. The end-session confirm names the session it ends, where the template named a
// fixed example session (F351).

import * as React from "react";
import { useSyncExternalStore } from "react";
import { closeDialog, dialogs } from "./state/dialogs";
import { BINDINGS as EDITOR_BINDINGS, fontSize, pickBinding, pickLook, pickSelectionMatches, pickTheme, settings, stepFont, THEMES } from "./state/settings";
import { LOOKS } from "./derive/look";
import { DialogClosedOutcome, PaneDrawnConnection } from "../vm/signals.gen";

interface VmLike {
  snapshot?(): { sessionId: string | null; connection: string; parkReason: unknown; endedReason: unknown } | null;
  interruptTurn?(): Promise<unknown>;
  endSession(reason: string): unknown;
}

const backdrop: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 50, background: "rgba(13,16,19,.55)", display: "flex", alignItems: "center", justifyContent: "center" };
const panel: React.CSSProperties = { width: 560, background: "#26292e", border: "1px solid rgba(255,255,255,.09)", borderRadius: 10, boxShadow: "0 18px 48px rgba(0,0,0,.5)", padding: "18px 22px 20px", display: "flex", flexDirection: "column" };
const label: React.CSSProperties = { color: "#62676f", width: 130 };
const stepper: React.CSSProperties = { cursor: "pointer", color: "#9aa0a8", border: "1px solid rgba(255,255,255,.09)", borderRadius: 4, padding: "0 9px" };
const keycap: React.CSSProperties = { marginLeft: "auto", color: "#9aa0a8", background: "#1a1c20", border: "1px solid rgba(255,255,255,.08)", borderRadius: 4, padding: "0 7px" };
const cancel: React.CSSProperties = { color: "#9aa0a8", border: "1px solid rgba(255,255,255,.09)", borderRadius: 5, padding: "4px 14px", cursor: "pointer" };

const BINDINGS: readonly [string, string][] = [
  ["meta / panes", "⌘M"],
  ["split right / down", "⌘D · ⌘⇧D"],
  ["all tool output, open or closed", "⌘E"],
  ["find in focused lens", "⌘F"],
  ["full-line divider drag", "⌥ drag"],
];

// A click inside a panel stops there, so the backdrop closes only on clicks outside it (sprint 203).
const swallow = (ev: React.MouseEvent) => ev.stopPropagation();
// The backdrop and the cancel and close controls (sprint 365: DIALOG_CLOSED cancelled).
const cancelDialog = () => closeDialog(DialogClosedOutcome.CANCELLED);
const confirmDialog = () => closeDialog(DialogClosedOutcome.CONFIRMED);

/** A section's heading in Settings (sprint 484), quieter than the rows it heads. */
const section: React.CSSProperties = { fontSize: 9, letterSpacing: ".14em", color: "#4a4e55", marginBottom: -6 };

function SettingsDialog({ defaultFontSize }: { defaultFontSize: number }): React.ReactElement {
  const st = useSyncExternalStore(settings.subscribe, settings.getSnapshot, settings.getSnapshot);
  return (
    <div onClick={cancelDialog} style={backdrop}>
      <div onClick={swallow} style={{ ...panel, gap: 14, fontSize: 12 }}>
        <div style={{ fontSize: 9.5, letterSpacing: ".14em", color: "#62676f" }}>SETTINGS · ⌘,</div>
        {/* Sprint 484: the tweaks in sections, so each new one has its place (the Architect, 2026-11-11). */}
        <div data-settings-section="appearance" style={section}>APPEARANCE</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={label}>appearance</span>
          <span style={{ display: "flex", border: "1px solid rgba(255,255,255,.09)", borderRadius: 5, overflow: "hidden" }}>
            {THEMES.map((t) => (
              <span key={t} onClick={() => pickTheme(t)} style={{ padding: "3px 12px", cursor: "pointer", color: st.theme === t ? "#e2e5e9" : "#62676f", background: st.theme === t ? "#2e3138" : "transparent" }}>{t}</span>
            ))}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={label}>look</span>
          <span style={{ display: "flex", border: "1px solid rgba(255,255,255,.09)", borderRadius: 5, overflow: "hidden" }}>
            {LOOKS.map((l) => (
              <span key={l} data-setting-look={l} data-lit={st.look === l ? "1" : "0"} onClick={() => pickLook(l)} style={{ padding: "3px 12px", cursor: "pointer", color: st.look === l ? "#e2e5e9" : "#62676f", background: st.look === l ? "#2e3138" : "transparent" }}>{l}</span>
            ))}
          </span>
        </div>
        {st.settingsNote ? <div style={{ color: "#62676f", fontSize: 11, margin: "-8px 0 0 144px" }}>{st.settingsNote}</div> : null}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={label}>type size</span>
          <span onClick={() => stepFont(-1, defaultFontSize)} style={stepper}>−</span>
          <span style={{ color: "#e2e5e9" }}>{fontSize(defaultFontSize) + "px"}</span>
          <span onClick={() => stepFont(1, defaultFontSize)} style={stepper}>+</span>
        </div>
        <div data-settings-section="editor" style={section}>EDITOR</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={label}>editor keys</span>
          <span style={{ display: "flex", border: "1px solid rgba(255,255,255,.09)", borderRadius: 5, overflow: "hidden" }}>
            {EDITOR_BINDINGS.map((b) => (
              <span key={b} data-setting-binding={b} data-lit={st.binding === b ? "1" : "0"} onClick={() => pickBinding(b)} style={{ padding: "3px 12px", cursor: "pointer", color: st.binding === b ? "#e2e5e9" : "#62676f", background: st.binding === b ? "#2e3138" : "transparent" }}>{b}</span>
            ))}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={label}>match highlight</span>
          <span style={{ display: "flex", border: "1px solid rgba(255,255,255,.09)", borderRadius: 5, overflow: "hidden" }}>
            {([["on", true], ["off", false]] as const).map(([name, on]) => (
              <span key={name} data-setting-matches={name} data-lit={st.selectionMatches === on ? "1" : "0"} onClick={() => pickSelectionMatches(on)} style={{ padding: "3px 12px", cursor: "pointer", color: st.selectionMatches === on ? "#e2e5e9" : "#62676f", background: st.selectionMatches === on ? "#2e3138" : "transparent" }}>{name}</span>
            ))}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <span style={{ ...label, paddingTop: 2 }}>bindings</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, fontSize: 11.5 }}>
            {BINDINGS.map(([what, keys]) => (
              <div key={what} style={{ display: "flex" }}><span style={{ color: "#b9bec5" }}>{what}</span><span style={keycap}>{keys}</span></div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span onClick={cancelDialog} style={{ ...cancel, fontSize: 11.5 }}>close esc</span>
        </div>
      </div>
    </div>
  );
}

// 19f, as the template drew it (sprint 334). Its export button closes it, as the template's did.
function ExportDialog(): React.ReactElement {
  return (
    <div onClick={cancelDialog} style={backdrop}>
      <div onClick={swallow} style={{ ...panel, gap: 12, fontSize: 12 }}>
        <div style={{ fontSize: 9.5, letterSpacing: ".14em", color: "#62676f" }}>EXPORT RECORD · 01M1684 · fix-race-in-metering · 244 ev</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11.5 }}>
          <div style={{ display: "flex", gap: 10, padding: "8px 12px", background: "#2e3138", borderRadius: 6 }}><span style={{ color: "#e2e5e9" }}>.record directory</span><span style={{ color: "#62676f" }}>segments + manifest + blobs + sidecar — replayable</span><span style={{ marginLeft: "auto", color: "#62676f" }}>↵</span></div>
          <div style={{ display: "flex", gap: 10, padding: "8px 12px", background: "#1a1c20", borderRadius: 6 }}><span style={{ color: "#b9bec5" }}>events.jsonl</span><span style={{ color: "#4a4e55" }}>flat, single file — read-only</span></div>
        </div>
        <div style={{ display: "flex", gap: 10, border: "1px solid rgba(255,255,255,.13)", borderRadius: 6, padding: "8px 12px", background: "#1a1c20", fontSize: 11.5 }}><span style={{ color: "#62676f" }}>to</span><span style={{ color: "#e2e5e9" }}>~/exports/fix-race-in-metering.record</span></div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", fontSize: 11.5 }}>
          <span onClick={cancelDialog} style={{ color: "#9aa0a8", border: "1px solid rgba(255,255,255,.09)", borderRadius: 5, padding: "4px 14px", cursor: "pointer" }}>cancel esc</span>
          <span onClick={confirmDialog} style={{ color: "#0d1013", background: "#82a5c8", borderRadius: 5, padding: "4px 14px", fontWeight: 600, cursor: "pointer" }}>export ↵</span>
        </div>
      </div>
    </div>
  );
}

/** D68: a session with a turn in flight has the turn interrupted first, then ends. */
async function endSession(): Promise<void> {
  confirmDialog();
  const vm = (window as unknown as { __vm?: VmLike }).__vm;
  if (!vm) return;
  const snap = vm.snapshot ? vm.snapshot() : null;
  const isLive = !!(snap && snap.sessionId && snap.connection === PaneDrawnConnection.CONNECTED && !snap.parkReason && !snap.endedReason);
  if (isLive && typeof vm.interruptTurn === "function") {
    try { await vm.interruptTurn(); } catch { /* end regardless */ }
  }
  vm.endSession("user_end");
}

function EndSessionDialog({ title }: { title: string }): React.ReactElement {
  return (
    <div onClick={cancelDialog} style={backdrop}>
      <div onClick={swallow} style={{ ...panel, gap: 12 }}>
        <div style={{ color: "#e2e5e9", fontSize: 13 }}>End session {title}?</div>
        <div style={{ color: "#62676f", fontSize: 11.5, lineHeight: 1.7 }}>Interrupts the running turn, emits SessionEnded and finalises the record. The record stays in records; the session cannot be resumed.</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", fontSize: 11.5 }}>
          <span onClick={cancelDialog} style={cancel}>cancel esc</span>
          <span onClick={() => { void endSession(); }} style={{ color: "#e2e5e9", background: "#2e3138", border: "1px solid rgba(255,255,255,.12)", borderRadius: 5, padding: "4px 14px", fontWeight: 600, cursor: "pointer" }}>end session</span>
        </div>
      </div>
    </div>
  );
}

export function Dialogs({ defaultFontSize }: { defaultFontSize: number }): React.ReactElement | null {
  const d = useSyncExternalStore(dialogs.subscribe, dialogs.getSnapshot, dialogs.getSnapshot);
  if (d.open === "settings") return <SettingsDialog defaultFontSize={defaultFontSize} />;
  if (d.open === "end-session") return <EndSessionDialog title={d.title} />;
  if (d.open === "export") return <ExportDialog />;
  return null;
}
