// WindowFrame.tsx — renders one window's split tree as a nested grid.

import { useRef } from "react";
import { ShellState, Window, WorkspaceShape } from "@/state/ShellState";
import { Pane } from "./Pane";
import { Gutter } from "./Gutter";

export interface PaneCallbacks {
  onFocus: (paneId: string) => void;
  onDragStart: (paneId: string, ev: React.PointerEvent) => void;
  onClose: (paneId: string) => void;
  onPickerText: (paneId: string, text: string) => void;
  onPickerWalk: (paneId: string, index: number, path: string, shape: WorkspaceShape) => void;
  onPickerCommit: (paneId: string, path: string, shape: WorkspaceShape) => void;
  onResume: (paneId: string, sessionId: string) => void;
  onPromptText: (paneId: string, text: string) => void;
  onPromptLengthChanged: (paneId: string, length: number) => void;
  onPromptSubmit: (paneId: string, text: string) => void;
}

export interface GutterCallbacks {
  onStart: (splitId: string) => void;
  onStop: (splitId: string, ratio: number) => void;
}

interface Props {
  window: Window;
  state: ShellState;
  gutter: GutterCallbacks;
  pane: PaneCallbacks;
}

function Node({ id, state, gutter, pane }: { id: string; state: ShellState; gutter: GutterCallbacks; pane: PaneCallbacks }): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const split = state.splits[id];
  if (!split) {
    const p = state.panes[id];
    return (
      <Pane
        pane={p}
        onFocus={pane.onFocus}
        onDragStart={pane.onDragStart}
        onClose={pane.onClose}
        onPickerText={pane.onPickerText}
        onPickerWalk={pane.onPickerWalk}
        onPickerCommit={pane.onPickerCommit}
        onResume={pane.onResume}
        onPromptText={pane.onPromptText}
        onPromptLengthChanged={pane.onPromptLengthChanged}
        onPromptSubmit={pane.onPromptSubmit}
      />
    );
  }
  const aStyle: React.CSSProperties = split.axis === "row"
    ? { position: "absolute", left: 0, top: 0, width: `${split.ratio * 100}%`, height: "100%" }
    : { position: "absolute", left: 0, top: 0, width: "100%", height: `${split.ratio * 100}%` };
  const bStyle: React.CSSProperties = split.axis === "row"
    ? { position: "absolute", right: 0, top: 0, width: `${(1 - split.ratio) * 100}%`, height: "100%" }
    : { position: "absolute", left: 0, bottom: 0, width: "100%", height: `${(1 - split.ratio) * 100}%` };
  return (
    <div ref={containerRef} data-testid={`split-${split.id}`} style={{ position: "relative", height: "100%", width: "100%" }}>
      <div style={aStyle}><Node id={split.aId} state={state} gutter={gutter} pane={pane} /></div>
      <div style={bStyle}><Node id={split.bId} state={state} gutter={gutter} pane={pane} /></div>
      <Gutter splitId={split.id} axis={split.axis} ratio={split.ratio}
        onDragStart={gutter.onStart} onDragStop={gutter.onStop} containerRef={containerRef} />
    </div>
  );
}

export function WindowFrame({ window, state, gutter, pane }: Props): JSX.Element {
  return (
    <div data-testid={`window-${window.id}`} style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <Node id={window.rootId} state={state} gutter={gutter} pane={pane} />
    </div>
  );
}
