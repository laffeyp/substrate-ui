// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The session bar line and the running background tasks under a pane's transcript (sprint 266; plan
// PLAN-2026-11-04-shell-to-react-r5.md, C2). The line names the turn and what it is doing, or how the
// last one ended (web/reveal/activity.ts), then the session's settings and language shifts
// (web/reveal/settings_tail.ts). Styles are those of
// the dc-runtime template (`web/reveal.html` at `d4322e1`); the panes view and the meta view differ
// only in padding, so `view` picks it.

import * as React from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { HANDOFF_DEFAULT, LENGTH_DEFAULT, TONE_DEFAULT } from "../vm/controls.gen";
import { TaskStatus } from "../vm/statuses.gen";
import type { Snapshot } from "../vm/types";
import { liveActivity } from "../reveal/activity";
import { settingsTail, TAIL_SEPARATOR, type TailSeg } from "../reveal/settings_tail";
import { formatClock } from "../reveal/timeline";
import { shell } from "./state/shell";

export type PaneView = "panes" | "meta";

interface Controller { guidanceLevel?(): string | null; stopTask?(taskId: string): Promise<void>; }
const controller = (paneId: number): Controller | null => {
  const vm = (window as unknown as { __vm?: { get?(id: number): Controller | null } }).__vm;
  return vm && typeof vm.get === "function" ? vm.get(paneId) : null;
};

function useSnapshot(paneId: number): Snapshot | null {
  const snaps = useSyncExternalStore(shell.subscribe, shell.getSnapshot, shell.getSnapshot);
  return snaps.snapshots[paneId] ?? null;
}

/** A live turn's seconds count between controller events: a tool that takes 12s emits nothing for
 *  12s. The clock runs only while the turn is live. */
function useClock(running: boolean): number {
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    if (!running) return undefined;
    setNow(Date.now() / 1000);
    const id = window.setInterval(() => setNow(Date.now() / 1000), 500);
    return () => window.clearInterval(id);
  }, [running]);
  return running ? now : Date.now() / 1000;
}

/** The tail's segments as settings: each starts at a separator, which is drawn apart so the line may break there. */
function settingItems(segs: TailSeg[]): { separator: TailSeg | null; segs: TailSeg[] }[] {
  const items: { separator: TailSeg | null; segs: TailSeg[] }[] = [];
  for (const sg of segs) {
    if (sg.text === TAIL_SEPARATOR) items.push({ separator: sg, segs: [] });
    else if (items.length) items[items.length - 1].segs.push(sg);
    else items.push({ separator: null, segs: [sg] });
  }
  return items;
}

export function ActivityLine({ paneId, view }: { paneId: number; view: PaneView }): React.ReactElement | null {
  const snap = useSnapshot(paneId);
  // Only a live turn pulses (web/reveal/activity.ts), so the pulse says whether the clock must run.
  const live = !!liveActivity(snap)?.pulseOn;
  const now = useClock(live);
  const activity = liveActivity(snap, now);
  if (!snap || !activity) return null;
  const level = snap.sessionId ? controller(paneId)?.guidanceLevel?.() ?? null : null;
  const segs = snap.sessionId ? settingsTail({
    guidance: level || snap.bundleSlug || "none", length: snap.length || LENGTH_DEFAULT, tone: snap.tone || TONE_DEFAULT,
    handoff: snap.handoff || HANDOFF_DEFAULT,
    language: snap.language || null, off: !!snap.languageOff, clearedSeq: snap.languageClearedSeq ?? -1,
  }) : [];
  return (
    <div data-session-bar-line="1" style={{ flex: "none", padding: view === "panes" ? "0 22px 8px" : "0 26px 6px", fontSize: 11, lineHeight: 1.6, color: activity.color }}>
      <span className={activity.pulseOn ? "act-pulse" : ""} style={{ color: activity.turnColor }}>{activity.turnWord}</span>
      {activity.hasRest ? <span> · {activity.restText}</span> : null}
      {/* Sprint 461 (roadmap r13 E12): in a narrow column the line wraps between settings, at each separator; a
          setting (its name, value and shift marks) stays on one line, and nothing is cut. */}
      <span data-settings-tail="1">
        {settingItems(segs).map((item, k) => (
          <React.Fragment key={k}>
            {item.separator ? <span style={{ color: item.separator.color }}>{item.separator.text}</span> : null}
            <span data-settings-item="1" style={{ whiteSpace: "nowrap" }}>
              {item.segs.map((sg, i) => (
                <span key={i} data-lang-shift={sg.shift ? sg.text : ""} title={sg.title} style={{ color: sg.color, textDecoration: sg.shift ? "underline dotted" : "none", textUnderlineOffset: 3, cursor: sg.shift ? "help" : "inherit", whiteSpace: "pre" }}>{sg.text}</span>
              ))}
            </span>
          </React.Fragment>
        ))}
      </span>
    </div>
  );
}

/** UI sprint 105: one line per running bash background task, with a stop link (Claude Code's /tasks). */
export function TaskRows({ paneId, view }: { paneId: number; view: PaneView }): React.ReactElement | null {
  const snap = useSnapshot(paneId);
  const running = (snap?.backgroundTasks ?? []).filter((task) => task.status === TaskStatus.RUNNING);
  if (!running.length) return null;
  return (
    <div data-vm-tasks={view === "panes" ? "terminal" : "reveal"} style={{ flex: "none", padding: view === "panes" ? "0 22px 8px" : "0 26px 6px", fontSize: 11, lineHeight: 1.6, color: "#9aa0a8" }}>
      {running.map((task) => (
        <div key={task.task_id}>
          <span>task {`${task.task_id} · ${String(task.command).slice(0, 60)} · ${formatClock(task.runtime_s)}`}</span> · <span data-vm-task-stop={task.task_id} onClick={() => { void controller(paneId)?.stopTask?.(task.task_id); }} style={{ color: "#c86464", cursor: "pointer" }}>stop</span>
        </div>
      ))}
    </div>
  );
}
