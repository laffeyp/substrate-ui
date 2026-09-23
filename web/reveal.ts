// web/reveal.ts — the prototype-v7 shell's boot script.
//
// Runs after dc-runtime + support.js render the page from `<x-dc>`.
// Builds one SessionController, exposes it as `window.__vm`, and
// mirrors its snapshot into the mounted Component's `state` so the
// prototype's template variables read live substrate data. Every
// binding lands here one feature at a time; the template edits sit
// next to each corresponding controller field.

import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import type { Snapshot } from "./vm";
import { BrowserSubstrateClient, PaneRegistry } from "./vm";
import { Transcript } from "./reveal/transcript";

// Sprint 071 feature flag. When `?atom-transcript=1` is in the URL
// or `localStorage.atomTranscript` is truthy, the reveal shell mounts
// the React atom transcript at `#vm-transcript-mount` (terminal view)
// and `#vm-transcript-mount-reveal` (reveal view). When neither flag
// is set, the dc-runtime template renders the transcript as it did
// before Phase 8 opened. The gate is stable per session; the shell
// does not toggle roots mid-session.
function isAtomTranscriptEnabled(): boolean {
  try {
    if (window.location.search.indexOf("atom-transcript=1") !== -1) return true;
    if (window.localStorage && window.localStorage.getItem("atomTranscript")) return true;
  } catch (_) { /* private mode */ }
  return false;
}

interface DCLogicHandle {
  state: Record<string, unknown>;
  setState: (patch: Record<string, unknown>) => void;
}

interface ReactFiberNode {
  stateNode?: { logic?: DCLogicHandle } | null;
  child?: ReactFiberNode | null;
  sibling?: ReactFiberNode | null;
}

interface ReactContainerRoot {
  stateNode: { current: ReactFiberNode };
}

function findComponent(fiber: ReactFiberNode | null | undefined): DCLogicHandle | null {
  let cursor: ReactFiberNode | null | undefined = fiber;
  while (cursor) {
    const inst = cursor.stateNode;
    if (inst && (inst as { logic?: DCLogicHandle }).logic
      && typeof (inst as { logic?: DCLogicHandle }).logic!.setState === "function") {
      return (inst as { logic: DCLogicHandle }).logic;
    }
    const nested = findComponent(cursor.child ?? null);
    if (nested) return nested;
    cursor = cursor.sibling ?? null;
  }
  return null;
}

function reachComponent(): DCLogicHandle | null {
  const root = document.getElementById("dc-root") as (HTMLElement & Record<string, unknown>) | null;
  if (!root) return null;
  const key = Object.keys(root).find((k) => k.startsWith("__reactContainer"));
  if (!key) return null;
  const container = root[key] as ReactContainerRoot | undefined;
  if (!container?.stateNode?.current) return null;
  return findComponent(container.stateNode.current);
}

function computeStatePatch(snap: Snapshot): Record<string, unknown> {
  return {
    controllerSnapshot: snap,
    driverRoster: snap.driverRoster,
    driverDefault: snap.driverDefault,
    recentWorkspaces: snap.recentWorkspaces,
    liveSessionsFromServer: snap.liveSessions,
    bundleRoster: snap.bundleRoster,
    bundleSlug: snap.bundleSlug,
  };
}

function boot(): void {
  const registry = new PaneRegistry({ makeClient: () => new BrowserSubstrateClient() });
  const controller = registry.spawn(1); // pane 1 is the initial view
  (window as unknown as { __vm: PaneRegistry }).__vm = registry;

  // Ring-buffer every pane's typed events. The parity harness reads
  // this to compare vocabulary; a developer inspecting DevTools sees
  // the last 500 tags with paneId attached so bleed shows up.
  interface TapeEntry { paneId: number; tag: string; payload: Record<string, unknown>; at: number; }
  const tape: TapeEntry[] = [];
  (window as unknown as { __vmTape: TapeEntry[] }).__vmTape = tape;
  registry.onEvent((ev) => {
    tape.push(ev);
    if (tape.length > 500) tape.splice(0, tape.length - 500);
  });

  controller.loadDriverRoster().catch(() => undefined);
  controller.loadLiveSessions().catch(() => undefined);
  controller.loadRecentWorkspaces().catch(() => undefined);
  controller.loadBundleRoster().catch(() => undefined);

  // Bookmarkable sessions: /?session=<id> attaches on load. The URL
  // stays put; hitting refresh continues on the same record.
  const params = new URLSearchParams(window.location.search);
  const attachId = params.get("session");
  if (attachId) {
    controller.attachExisting(attachId).catch(() => undefined);
  }

  let component: DCLogicHandle | null = null;
  // Per-pane snapshots. renderVals reads `controllerSnapshots[p.id]`
  // for a pane-scoped view; `controllerSnapshot` mirrors the FOCUSED
  // pane's snapshot to keep single-pane bindings working unchanged.
  const perPane: Record<number, Snapshot> = {};
  const bind = () => {
    if (component) return true;
    component = reachComponent();
    if (!component) return false;
    const transcriptLens: Record<number, number> = {};
    const sessionIds: Record<number, string | null> = {};
    registry.subscribe((paneId, snap) => {
      if (!component) return;
      perPane[paneId] = snap;
      const focusedId = (component.state as { focused?: number }).focused ?? 1;
      const patch: Record<string, unknown> = { controllerSnapshots: { ...perPane } };
      if (paneId === focusedId) Object.assign(patch, computeStatePatch(snap));
      component.setState(patch);
      // Autoscroll the transcript when the focused pane's grew AND the
      // user is already at the bottom (sticky-bottom terminal rule).
      // If the user scrolled up to read history, transcript growth
      // does not jerk them back to the tail. The shell's ref callbacks
      // save `atBottom` per pane per view under `logic._scrolls`.
      if (paneId === focusedId) {
        const lastLen = transcriptLens[paneId] ?? 0;
        if (snap.transcript.length > lastLen) {
          window.requestAnimationFrame(() => {
            const logic = component as unknown as { _scrolls?: { termByPane?: Record<number, { atBottom?: boolean }>; revByPane?: Record<number, { atBottom?: boolean }> } };
            const scrolls = logic._scrolls;
            const termBottom = scrolls?.termByPane?.[paneId]?.atBottom ?? true;
            const revBottom = scrolls?.revByPane?.[paneId]?.atBottom ?? true;
            if (termBottom) {
              const el = document.getElementById("vm-transcript");
              if (el) el.scrollTop = el.scrollHeight;
            }
            if (revBottom) {
              // The reveal-view transcript container has no id; find it
              // by class-adjacent structure. The pane loop keeps only
              // one such container mounted at a time.
              const el = document.querySelector<HTMLDivElement>('[style*="line-height:1.95"]');
              if (el) el.scrollTop = el.scrollHeight;
            }
          });
        }
        transcriptLens[paneId] = snap.transcript.length;
        // Reflect the focused pane's session in the URL.
        if (snap.sessionId !== (sessionIds[paneId] ?? null)) {
          sessionIds[paneId] = snap.sessionId;
          const url = new URL(window.location.href);
          if (snap.sessionId) url.searchParams.set("session", snap.sessionId);
          else url.searchParams.delete("session");
          window.history.replaceState({}, "", url.toString());
        }
      }
    });
    return true;
  };
  if (!bind()) {
    const tick = window.setInterval(() => {
      if (bind()) window.clearInterval(tick);
    }, 50);
    window.setTimeout(() => window.clearInterval(tick), 5000);
  }

  // Ctrl+C over a prompt input interrupts the in-flight turn, matching
  // the classic shell's behavior. A selection in the input still gets
  // native copy — only a caret-only Ctrl+C fires the interrupt.
  window.addEventListener("keydown", (ev) => {
    if (ev.key !== "c" && ev.key !== "C") return;
    if (!(ev.ctrlKey || ev.metaKey)) return;
    const active = document.activeElement;
    if (!active || active.tagName !== "INPUT") return;
    const input = active as HTMLInputElement;
    if (typeof input.selectionStart === "number"
      && typeof input.selectionEnd === "number"
      && input.selectionStart !== input.selectionEnd) return;
    ev.preventDefault();
    controller.interruptTurn();
  });

  // Sprint 071 — mount the React atom-transcript roots if the flag
  // is on. The dc-runtime template still owns the scroll container;
  // React mounts inside two leaf `<div>`s dc-runtime treats as opaque:
  //   #vm-transcript-mount         (terminal view; always present)
  //   #vm-transcript-mount-reveal  (reveal view; appears only when
  //                                  the user toggles reveal via ⌃`)
  // A MutationObserver on `<body>` catches each mount div the moment
  // it first attaches to the DOM and creates its React root once.
  if (isAtomTranscriptEnabled()) {
    const mounted = new Set<string>();
    const focusedId = () => {
      if (!component) return 1;
      const st = component.state as { focused?: number };
      return st.focused ?? 1;
    };
    const tryMount = (id: string, view: "terminal" | "reveal") => {
      if (mounted.has(id)) return;
      const host = document.getElementById(id);
      if (!host) return;
      mounted.add(id);
      ReactDOMClient.createRoot(host).render(
        React.createElement(Transcript, { paneId: focusedId(), view }),
      );
      console.info(`[reveal] transcript root mounted (${view})`);
    };
    const check = () => {
      tryMount("vm-transcript-mount", "terminal");
      tryMount("vm-transcript-mount-reveal", "reveal");
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  console.info("[reveal] SessionController booted. Read window.__vm.snapshot() in DevTools.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
