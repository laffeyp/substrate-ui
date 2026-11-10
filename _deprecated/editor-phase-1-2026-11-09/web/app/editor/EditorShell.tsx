// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// The editor view's three-column layout with a bottom panel (sprint 389 shell, sprint 390 columns).
// Each side column folds to a labelled rail; the bottom panel collapses to a sill. The bottom panel's
// content (transcript, activity, input bar) is passed as the `bottom` prop from the composing
// component — this module does not import any of those components.

import * as React from "react";
import { EditorColumnFoldedColumn } from "../../vm/signals.gen";
import { FileTree } from "./FileTree";

export type DockPosition = "bottom" | "right";

export interface EditorShellProps {
  paneId: number;
  workspacePath: string | null;
  readOnly: boolean;
  readOnlyReason: string | null;
  leftFolded: boolean;
  rightFolded: boolean;
  bottomFolded: boolean;
  dockPosition: DockPosition;
  sidesSwapped: boolean;
  onToggleColumn: (column: EditorColumnFoldedColumn) => void;
  onToggleDock: () => void;
  onToggleSides: () => void;
  bottom: React.ReactNode;
}

const RAIL_WIDTH = 28;
const DEFAULT_LEFT = 240;
const DEFAULT_RIGHT = 280;
const DEFAULT_BOTTOM = 180;
const DEFAULT_DOCK_WIDTH = 360;
const SILL_HEIGHT = 52;
const MIN_SIDE = 120;
const MIN_BOTTOM = 100;
const STORAGE_KEY = "substrate:editor-column-widths";

interface ColumnWidths { left: number; right: number; bottomHeight: number; dockWidth: number }

function readStoredWidths(): ColumnWidths {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        left: typeof parsed.left === "number" ? parsed.left : DEFAULT_LEFT,
        right: typeof parsed.right === "number" ? parsed.right : DEFAULT_RIGHT,
        bottomHeight: typeof parsed.bottomHeight === "number" ? parsed.bottomHeight : DEFAULT_BOTTOM,
        dockWidth: typeof parsed.dockWidth === "number" ? parsed.dockWidth : DEFAULT_DOCK_WIDTH,
      };
    }
  } catch { /* private window or blocked storage */ }
  return { left: DEFAULT_LEFT, right: DEFAULT_RIGHT, bottomHeight: DEFAULT_BOTTOM, dockWidth: DEFAULT_DOCK_WIDTH };
}

function writeStoredWidths(cw: ColumnWidths): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cw)); } catch { /* ignore */ }
}

function useColumnWidths(): [ColumnWidths, (patch: Partial<ColumnWidths>) => void] {
  const [widths, setWidths] = React.useState<ColumnWidths>(readStoredWidths);
  const update = React.useCallback((patch: Partial<ColumnWidths>) => {
    setWidths((prev) => {
      const next = { ...prev, ...patch };
      writeStoredWidths(next);
      return next;
    });
  }, []);
  return [widths, update];
}

function DragHandle({ axis, onDrag }: { axis: "col" | "row"; onDrag: (delta: number) => void }): React.ReactElement {
  const dragging = React.useRef(false);
  const last = React.useRef(0);
  const onPointerDown = React.useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    last.current = axis === "col" ? e.clientX : e.clientY;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
  }, [axis]);
  const onPointerMove = React.useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const pos = axis === "col" ? e.clientX : e.clientY;
    const delta = pos - last.current;
    if (delta !== 0) { last.current = pos; onDrag(delta); }
  }, [axis, onDrag]);
  const onPointerUp = React.useCallback(() => { dragging.current = false; }, []);
  return (
    <div
      data-drag-handle={axis}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        flex: "none",
        [axis === "col" ? "width" : "height"]: 4,
        cursor: axis === "col" ? "col-resize" : "row-resize",
        background: "transparent",
        zIndex: 1,
      }}
    />
  );
}

const COL_STYLE: React.CSSProperties = {
  minWidth: 0,
  minHeight: 0,
  overflow: "hidden",
};

const RAIL_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  userSelect: "none",
};

const RAIL_LABEL: React.CSSProperties = {
  writingMode: "vertical-lr",
  transform: "rotate(180deg)",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.06em",
  color: "#6b7280",
  textTransform: "uppercase",
};

const TOGGLE_BTN: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#6b7280",
  cursor: "pointer",
  fontSize: 11,
  padding: "4px 6px",
  lineHeight: 1,
};

function Rail({ label, side, onClick }: { label: string; side: "left" | "right" | "bottom"; onClick: () => void }): React.ReactElement {
  if (side === "bottom") {
    return (
      <div
        data-editor-rail="bottom"
        onClick={onClick}
        style={{ ...RAIL_STYLE, height: SILL_HEIGHT, flexDirection: "row", borderTop: "1px solid #2d3139", gap: 8, padding: "0 12px" }}
      >
        <span style={{ ...RAIL_LABEL, writingMode: "horizontal-tb", transform: "none" }}>{label}</span>
        <span style={{ color: "#6b7280", fontSize: 10 }}>▴</span>
      </div>
    );
  }
  return (
    <div
      data-editor-rail={side}
      onClick={onClick}
      style={{
        ...RAIL_STYLE,
        width: RAIL_WIDTH,
        flexDirection: "column",
        gap: 6,
        ...(side === "left" ? { borderRight: "1px solid #2d3139" } : { borderLeft: "1px solid #2d3139" }),
      }}
    >
      <span style={{ color: "#6b7280", fontSize: 10 }}>{side === "left" ? "▸" : "◂"}</span>
      <span style={RAIL_LABEL}>{label}</span>
    </div>
  );
}

type NativeBridge = {
  diffVsMain?: (workspace: string) => Promise<{ files: { path: string; status: string }[] }>;
  listDir?: (workspace: string, dirPath: string) => Promise<{ entries: { name: string; type: string; size: number }[]; truncated: boolean }>;
};

export interface DiffEntry { path: string; status: string }

function useDiffVsMain(workspacePath: string | null): Map<string, string> {
  const [diffMap, setDiffMap] = React.useState<Map<string, string>>(new Map());
  const wsRef = React.useRef(workspacePath);
  React.useEffect(() => {
    wsRef.current = workspacePath;
    if (!workspacePath) { setDiffMap(new Map()); return; }
    let cancelled = false;
    const native = (window as unknown as { native?: NativeBridge }).native;
    if (!native?.diffVsMain) return;
    native.diffVsMain(workspacePath).then((result) => {
      if (cancelled || wsRef.current !== workspacePath) return;
      const m = new Map<string, string>();
      for (const f of result.files) m.set(f.path, f.status);
      setDiffMap(m);
    });
    return () => { cancelled = true; };
  }, [workspacePath]);
  return diffMap;
}

function useHasGit(workspacePath: string | null): boolean | null {
  const [hasGit, setHasGit] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    if (!workspacePath) { setHasGit(null); return; }
    let cancelled = false;
    const native = (window as unknown as { native?: NativeBridge }).native;
    if (!native?.listDir) return;
    native.listDir(workspacePath, workspacePath).then((result) => {
      if (cancelled) return;
      setHasGit(result.entries.some((e) => e.name === ".git"));
    });
    return () => { cancelled = true; };
  }, [workspacePath]);
  return hasGit;
}

export function EditorShell({ paneId, workspacePath, readOnly, readOnlyReason, leftFolded, rightFolded, bottomFolded, dockPosition, sidesSwapped, onToggleColumn, onToggleDock, onToggleSides, bottom }: EditorShellProps): React.ReactElement {
  const diffMap = useDiffVsMain(workspacePath);
  const hasGit = useHasGit(workspacePath);
  const [widths, setWidths] = useColumnWidths();
  const shellRef = React.useRef<HTMLDivElement>(null);
  const [promptFocused, setPromptFocused] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const onIn = (ev: FocusEvent) => {
      if (ev.target instanceof HTMLElement && (ev.target.tagName === "TEXTAREA" || ev.target.tagName === "INPUT" || ev.target.isContentEditable)) {
        setPromptFocused(true);
      }
    };
    const onOut = (ev: FocusEvent) => {
      if (!el.contains(ev.relatedTarget as Node)) setPromptFocused(false);
    };
    el.addEventListener("focusin", onIn);
    el.addEventListener("focusout", onOut);
    return () => { el.removeEventListener("focusin", onIn); el.removeEventListener("focusout", onOut); };
  }, []);
  const effLeftFolded = promptFocused || leftFolded;
  const effRightFolded = promptFocused || rightFolded;
  const onDragLeft = React.useCallback((delta: number) => {
    setWidths({ left: Math.max(MIN_SIDE, widths.left + delta) });
  }, [widths.left, setWidths]);
  const onDragRight = React.useCallback((delta: number) => {
    setWidths({ right: Math.max(MIN_SIDE, widths.right - delta) });
  }, [widths.right, setWidths]);
  const onDragBottom = React.useCallback((delta: number) => {
    setWidths({ bottomHeight: Math.max(MIN_BOTTOM, widths.bottomHeight - delta) });
  }, [widths.bottomHeight, setWidths]);
  const onDragDock = React.useCallback((delta: number) => {
    setWidths({ dockWidth: Math.max(MIN_SIDE, widths.dockWidth - delta) });
  }, [widths.dockWidth, setWidths]);

  const dockRight = dockPosition === "right";

  const transcriptHeader = (
    <div style={{ flex: "none", display: "flex", alignItems: "center", padding: "0 12px", height: 28 }}>
      <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", color: "#6b7280", textTransform: "uppercase" }}>TRANSCRIPT</span>
      <span style={{ flex: 1 }} />
      <button onClick={onToggleDock} style={TOGGLE_BTN} title={dockRight ? "Dock transcript bottom" : "Dock transcript right"}>
        {dockRight ? "⇊" : "⇉"}
      </button>
      <button onClick={() => onToggleColumn(EditorColumnFoldedColumn.BOTTOM)} style={TOGGLE_BTN} title="Collapse transcript (⌘J)">
        {dockRight ? "▸" : "▾"}
      </button>
    </div>
  );

  const leftColumn = effLeftFolded
    ? <Rail label="FILES" side="left" onClick={() => onToggleColumn(EditorColumnFoldedColumn.LEFT)} />
    : (
      <>
        <div data-editor-column="left" style={{ ...COL_STYLE, width: widths.left, flex: "none", borderRight: "1px solid #2d3139", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: "none", display: "flex", alignItems: "center", padding: "0 10px", height: 28 }}>
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", color: "#6b7280", textTransform: "uppercase" }}>FILES</span>
            <span style={{ flex: 1 }} />
            <button onClick={onToggleSides} style={TOGGLE_BTN} title="Swap sides">⇄</button>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {workspacePath ? <FileTree workspacePath={workspacePath} diffMap={diffMap} /> : <div style={{ padding: "8px 12px", fontSize: 12, color: "#6b7280" }}>No workspace</div>}
          </div>
          {hasGit === false && <div data-no-git="" style={{ flex: "none", padding: "4px 10px", fontSize: 10, color: "#6b7280" }}>no git repository</div>}
          <button onClick={() => onToggleColumn(EditorColumnFoldedColumn.LEFT)} style={{ ...TOGGLE_BTN, flex: "none", textAlign: "left", padding: "6px 10px" }} title="Fold left column (⌥⌘L)">◂</button>
        </div>
        <DragHandle axis="col" onDrag={onDragLeft} />
      </>
    );

  const centreColumn = (
    <div data-editor-column="centre" style={{ ...COL_STYLE, flex: 1, display: "flex", flexDirection: "column" }}>
      {readOnly && (
        <div data-editor-readonly="" style={{ flex: "none", padding: "6px 12px", fontSize: 11, color: "#f59e0b", background: "#292524", borderBottom: "1px solid #2d3139" }}>
          Read-only{readOnlyReason ? ` · ${readOnlyReason}` : ""}
        </div>
      )}
      <div style={{ flex: 1 }} />
    </div>
  );

  const inspectorColumn = effRightFolded
    ? <Rail label="INSPECTOR" side="right" onClick={() => onToggleColumn(EditorColumnFoldedColumn.RIGHT)} />
    : (
      <>
        <DragHandle axis="col" onDrag={onDragRight} />
        <div data-editor-column="right" style={{ ...COL_STYLE, width: widths.right, flex: "none", borderLeft: "1px solid #2d3139", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }} />
          <button onClick={() => onToggleColumn(EditorColumnFoldedColumn.RIGHT)} style={{ ...TOGGLE_BTN, flex: "none", textAlign: "right", padding: "6px 10px" }} title="Fold right column (⌥⌘R)">▸</button>
        </div>
      </>
    );

  return (
    <div
      ref={shellRef}
      data-editor-shell=""
      data-pane-id={String(paneId)}
      data-dock={dockPosition}
      style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "#212327" }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "row", minHeight: 0 }}>
        {sidesSwapped ? inspectorColumn : leftColumn}
        {dockRight ? (
          <>
            {centreColumn}
            {bottomFolded
              ? <Rail label="TRANSCRIPT" side="right" onClick={() => onToggleColumn(EditorColumnFoldedColumn.BOTTOM)} />
              : (
                <>
                  <DragHandle axis="col" onDrag={onDragDock} />
                  <div data-editor-column="bottom" style={{ ...COL_STYLE, width: widths.dockWidth, flex: "none", borderLeft: "1px solid #2d3139", display: "flex", flexDirection: "column" }}>
                    {transcriptHeader}
                    <div ref={bottomRef} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{bottom}</div>
                  </div>
                </>
              )
            }
            {sidesSwapped ? leftColumn : inspectorColumn}
          </>
        ) : (
          <>
            {centreColumn}
            {sidesSwapped ? leftColumn : inspectorColumn}
          </>
        )}
      </div>
      {!dockRight && (
        bottomFolded
          ? <Rail label="TRANSCRIPT" side="bottom" onClick={() => onToggleColumn(EditorColumnFoldedColumn.BOTTOM)} />
          : (
            <>
              <DragHandle axis="row" onDrag={onDragBottom} />
              <div data-editor-column="bottom" style={{ flex: "none", height: widths.bottomHeight, display: "flex", flexDirection: "column" }}>
                {transcriptHeader}
                <div ref={bottomRef} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{bottom}</div>
              </div>
            </>
          )
      )}
    </div>
  );
}
