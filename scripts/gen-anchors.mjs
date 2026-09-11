// scripts/gen-anchors.mjs — regenerate src/observability/anchors.ts
// from signals/0.1.json § layer_7_evidence.evidence_constraints
// [pixel_anchor].anchors.
//
// Every anchor mount, byte read, slot-order array in the shell reads
// through AppSlot.X and PaneSlot.X. TypeScript sees each entry as its
// literal type; a slot rename in Layer 7 breaks the compile for every
// caller. Runs as part of `npm run build` via prebuild.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");
const signals = JSON.parse(readFileSync(resolve(REPO, "signals/0.1.json"), "utf8"));
const pixelAnchor = signals.layer_7_evidence.evidence_constraints
  .find((c) => c.kind === "pixel_anchor");
if (!pixelAnchor || !Array.isArray(pixelAnchor.anchors)) {
  throw new Error("Layer 7 has no pixel_anchor entry — anchors codegen cannot run");
}

const appSlots = [];
const paneSlots = [];
for (const a of pixelAnchor.anchors) {
  const t = a.testid;
  const paneM = /^anchor-pane-\{pane_id\}-(.+)$/.exec(t);
  if (paneM) { paneSlots.push(paneM[1]); continue; }
  const appM = /^anchor-(.+)$/.exec(t);
  if (appM) appSlots.push(appM[1]);
}

function slotKey(s) { return s.toUpperCase().replace(/-/g, "_"); }

const appBody = appSlots.map((s) => `  ${slotKey(s)}: ${JSON.stringify(s)},`).join("\n");
const paneBody = paneSlots.map((s) => `  ${slotKey(s)}: ${JSON.stringify(s)},`).join("\n");

const out = `// src/observability/anchors.ts — GENERATED from signals/0.1.json §
// layer_7_evidence.evidence_constraints[pixel_anchor].anchors. Do not
// edit by hand; run \`npm run gen:anchors\` after a Layer 7 change and
// review the diff.
//
// Every anchor slot reference goes through AppSlot.X or PaneSlot.X —
// TypeScript narrows to the exact string; a Layer 7 rename fails the
// compile.

export const AppSlot = {
${appBody}
} as const;
export type AppSlotName = typeof AppSlot[keyof typeof AppSlot];
export const APP_SLOT_ORDER: readonly AppSlotName[] = ${JSON.stringify(appSlots)} as const;

export const PaneSlot = {
${paneBody}
} as const;
export type PaneSlotName = typeof PaneSlot[keyof typeof PaneSlot];
export const PANE_SLOT_ORDER: readonly PaneSlotName[] = ${JSON.stringify(paneSlots)} as const;

// Runtime sanity — a Layer 7 edit without regenerating fails at load.
import signalsV01 from "@/../signals/0.1.json";
const layer7Anchors = (signalsV01 as {
  layer_7_evidence: { evidence_constraints: Array<{ kind: string; anchors?: unknown[] }> };
}).layer_7_evidence.evidence_constraints.find((c) => c.kind === "pixel_anchor")?.anchors ?? [];
if (layer7Anchors.length !== APP_SLOT_ORDER.length + PANE_SLOT_ORDER.length) {
  throw new Error(
    \`anchors.ts drift — \${APP_SLOT_ORDER.length + PANE_SLOT_ORDER.length} slots vs Layer 7's \${layer7Anchors.length}; \` +
    \`run npm run gen:anchors\`,
  );
}
`;

writeFileSync(resolve(REPO, "src/observability/anchors.ts"), out);
console.log(`gen-anchors: wrote ${appSlots.length} app + ${paneSlots.length} pane slots to src/observability/anchors.ts`);
