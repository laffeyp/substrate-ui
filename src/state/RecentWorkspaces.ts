// RecentWorkspaces — read the recent-workspaces roster via the bridge.

import { bridgeRequest } from "@/observability/BridgeClient";
import { WorkspaceShape } from "./ShellState";
import { isWorkspaceShape } from "@/observability/reasons";

export interface RecentWorkspace {
  path: string;
  shape: WorkspaceShape;
  last_used: number | null;
}

export async function readRecentWorkspaces(): Promise<RecentWorkspace[]> {
  try {
    const rows = await bridgeRequest<unknown>("read_recent_workspaces", {});
    if (!Array.isArray(rows)) return [];
    const out: RecentWorkspace[] = [];
    for (const row of rows) {
      if (typeof row !== "object" || row === null) continue;
      const r = row as { path?: unknown; shape?: unknown; last_used?: unknown };
      if (typeof r.path !== "string") continue;
      const shape: WorkspaceShape = isWorkspaceShape(r.shape) ? r.shape : "flat";
      out.push({
        path: r.path,
        shape,
        last_used: typeof r.last_used === "number" ? r.last_used : null,
      });
    }
    return out;
  } catch {
    return [];
  }
}
