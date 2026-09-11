// src/observability/anchors.ts — GENERATED from signals/0.1.json §
// layer_7_evidence.evidence_constraints[pixel_anchor].anchors. Do not
// edit by hand; run `npm run gen:anchors` after a Layer 7 change and
// review the diff.
//
// Every anchor slot reference goes through AppSlot.X or PaneSlot.X —
// TypeScript narrows to the exact string; a Layer 7 rename fails the
// compile.

export const AppSlot = {
  DIALOG: "dialog",
  WINDOW_STRIP: "window-strip",
  BRIDGE: "bridge",
  LAST_TAG: "last-tag",
  HEARTBEAT: "heartbeat",
} as const;
export type AppSlotName = typeof AppSlot[keyof typeof AppSlot];
export const APP_SLOT_ORDER: readonly AppSlotName[] = ["dialog","window-strip","bridge","last-tag","heartbeat"] as const;

export const PaneSlot = {
  FOCUS: "focus",
  STATUS: "status",
  REVEAL: "reveal",
  LENS: "lens",
  LEVEL: "level",
  DIR: "dir",
  DESCENT: "descent",
  SURFACE: "surface",
  FIND: "find",
  INSPECT: "inspect",
  HEADER_POPOVER: "header-popover",
} as const;
export type PaneSlotName = typeof PaneSlot[keyof typeof PaneSlot];
export const PANE_SLOT_ORDER: readonly PaneSlotName[] = ["focus","status","reveal","lens","level","dir","descent","surface","find","inspect","header-popover"] as const;

// Runtime sanity — a Layer 7 edit without regenerating fails at load.
import signalsV01 from "@/../signals/0.1.json";
const layer7Anchors = (signalsV01 as {
  layer_7_evidence: { evidence_constraints: Array<{ kind: string; anchors?: unknown[] }> };
}).layer_7_evidence.evidence_constraints.find((c) => c.kind === "pixel_anchor")?.anchors ?? [];
if (layer7Anchors.length !== APP_SLOT_ORDER.length + PANE_SLOT_ORDER.length) {
  throw new Error(
    `anchors.ts drift — ${APP_SLOT_ORDER.length + PANE_SLOT_ORDER.length} slots vs Layer 7's ${layer7Anchors.length}; ` +
    `run npm run gen:anchors`,
  );
}
