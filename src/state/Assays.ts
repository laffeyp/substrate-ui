// Assays.ts — list_assays bridge wrapper. Sprint 026.

import { bridgeRequest } from "@/observability/BridgeClient";

// Layer 1 review §6 defers the assay drill-in path (ASSAY_ARM_INSPECTED
// / ASSAY_CELL_OPENED) to v0.2. Sprint 026 ships the grid + open/close
// pair; the row shape below is a placeholder. When substrate exposes a
// real assay projection over the bridge, extend this interface.
export interface AssayRow {
  topology: string;
  trial: string;
  score: number | null;
  record_root: string;
}

export async function listAssays(): Promise<AssayRow[]> {
  try {
    const rows = await bridgeRequest<unknown>("list_assays", {});
    if (!Array.isArray(rows)) return [];
    return rows as AssayRow[];
  } catch {
    return [];
  }
}
