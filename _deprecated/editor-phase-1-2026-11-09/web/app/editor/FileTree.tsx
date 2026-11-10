// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 392 — a file tree in the editor's left column. Reads the workspace directory via
// window.native.listDir (IPC, sprint 391). Directories expand/collapse on click. Files are
// listed but not yet clickable (file opening comes in Phase 2).

import * as React from "react";

interface DirEntry {
  name: string;
  type: "file" | "directory";
  size: number;
}

interface TreeNodeState {
  entries: DirEntry[] | null;
  expanded: boolean;
  loading: boolean;
}

interface FileTreeProps {
  workspacePath: string;
  diffMap: Map<string, string>;
}

type NativeBridge = { listDir?: (workspace: string, dirPath: string) => Promise<{ entries: DirEntry[]; truncated: boolean }> };

async function listDir(workspace: string, dirPath: string): Promise<DirEntry[]> {
  const native = (window as unknown as { native?: NativeBridge }).native;
  if (!native?.listDir) return [];
  const result = await native.listDir(workspace, dirPath);
  return sortEntries(result.entries);
}

function sortEntries(entries: DirEntry[]): DirEntry[] {
  const dirs = entries.filter((e) => e.type === "directory").sort((a, b) => a.name.localeCompare(b.name));
  const files = entries.filter((e) => e.type === "file").sort((a, b) => a.name.localeCompare(b.name));
  return [...dirs, ...files];
}

const ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "2px 0",
  cursor: "pointer",
  fontSize: 12,
  color: "#c9ccd1",
  userSelect: "none",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const ICON_STYLE: React.CSSProperties = {
  width: 14,
  textAlign: "center",
  fontSize: 9,
  color: "#6b7280",
  flexShrink: 0,
};

const STATUS_COLORS: Record<string, string> = { A: "#4ade80", M: "#facc15", D: "#f87171" };

function dotColor(status: string): string {
  return STATUS_COLORS[status.charAt(0)] ?? "#facc15";
}

function dirHasModified(relDir: string, diffMap: Map<string, string>): string | null {
  for (const [p, s] of diffMap) {
    if (p.startsWith(relDir + "/")) return s;
  }
  return null;
}

function TreeNode({ name, fullPath, workspace, depth, isDir, diffMap }: {
  name: string;
  fullPath: string;
  workspace: string;
  depth: number;
  isDir: boolean;
  diffMap: Map<string, string>;
}): React.ReactElement {
  const rel = fullPath.startsWith(workspace + "/") ? fullPath.slice(workspace.length + 1) : fullPath;
  const fileStatus = diffMap.get(rel) ?? null;
  const dirStatus = isDir ? dirHasModified(rel, diffMap) : null;
  const showDot = isDir ? dirStatus : fileStatus;
  const [state, setState] = React.useState<TreeNodeState>({ entries: null, expanded: false, loading: false });

  const toggle = React.useCallback(async () => {
    if (!isDir) return;
    if (state.expanded) {
      setState((s) => ({ ...s, expanded: false }));
      return;
    }
    setState((s) => ({ ...s, loading: true, expanded: true }));
    const entries = await listDir(workspace, fullPath);
    setState({ entries, expanded: true, loading: false });
  }, [isDir, state.expanded, workspace, fullPath]);

  const indent = 8 + depth * 16;

  return (
    <>
      <div
        data-tree-node={isDir ? "dir" : "file"}
        data-tree-path={fullPath}
        onClick={toggle}
        style={{ ...ROW_STYLE, paddingLeft: indent }}
        title={fullPath}
      >
        <span style={ICON_STYLE}>{isDir ? (state.expanded ? "▾" : "▸") : " "}</span>
        <span style={{ marginLeft: 4 }}>{name}</span>
        {showDot && <span data-modified-dot="" style={{ marginLeft: 6, width: 6, height: 6, borderRadius: "50%", background: dotColor(showDot), display: "inline-block", flexShrink: 0 }} />}
      </div>
      {isDir && state.expanded && state.entries && state.entries.map((e) => (
        <TreeNode
          key={e.name}
          name={e.name}
          fullPath={fullPath + "/" + e.name}
          workspace={workspace}
          depth={depth + 1}
          isDir={e.type === "directory"}
          diffMap={diffMap}
        />
      ))}
      {isDir && state.expanded && state.loading && (
        <div style={{ ...ROW_STYLE, paddingLeft: indent + 16, color: "#6b7280", fontSize: 11 }}>…</div>
      )}
    </>
  );
}

export function FileTree({ workspacePath, diffMap }: FileTreeProps): React.ReactElement {
  const [entries, setEntries] = React.useState<DirEntry[] | null>(null);
  const wsRef = React.useRef(workspacePath);

  React.useEffect(() => {
    wsRef.current = workspacePath;
    let cancelled = false;
    listDir(workspacePath, workspacePath).then((result) => {
      if (!cancelled && wsRef.current === workspacePath) setEntries(result);
    });
    return () => { cancelled = true; };
  }, [workspacePath]);

  const rootName = workspacePath.split("/").pop() || "workspace";

  return (
    <div data-file-tree="" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "4px 0" }}>
      <div style={{ ...ROW_STYLE, paddingLeft: 8, fontWeight: 600, fontSize: 11, color: "#9ca3af" }}>{rootName}</div>
      {entries === null
        ? <div style={{ ...ROW_STYLE, paddingLeft: 24, color: "#6b7280", fontSize: 11 }}>…</div>
        : entries.map((e) => (
          <TreeNode
            key={e.name}
            name={e.name}
            fullPath={workspacePath + "/" + e.name}
            workspace={workspacePath}
            depth={0}
            isDir={e.type === "directory"}
            diffMap={diffMap}
          />
        ))
      }
    </div>
  );
}
