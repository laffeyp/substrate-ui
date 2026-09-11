// Sessions.ts — list_sessions bridge wrapper.

import { bridgeRequest } from "@/observability/BridgeClient";
import { WorkspaceShape } from "./ShellState";

export interface ManifestRow {
  session_id: string;
  name: string | null;
  status: string;
  workspace: string;
  workspace_shape: WorkspaceShape;
  driver: string;
  bundle: string | null;
  record_root: string;
}

export async function listSessions(): Promise<ManifestRow[]> {
  try {
    const rows = await bridgeRequest<unknown>("list_sessions", {});
    if (!Array.isArray(rows)) return [];
    return rows as ManifestRow[];
  } catch {
    return [];
  }
}
