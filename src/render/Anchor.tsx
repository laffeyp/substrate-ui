// Anchor.tsx — the 1×1 pixel-anchor canvas. Every anchor lives at its own
// unique screen position (deterministic from slot + paneId) so element-scoped
// screenshots decode the right canvas per Addendum A2 B4.
//
// Layout: a top-of-window strip. App-scoped anchors take the first 5 columns
// (0..4). Each pane's 11 anchors take columns 5..15 within its own row (row =
// hash(paneId) mod 8, giving up to 8 panes per window unique rows).

import { useEffect, useRef } from "react";
import { register, unregister, setByte } from "@/observability/AnchorPainter";
import {
  AppSlot, PaneSlot, APP_SLOT_ORDER, PANE_SLOT_ORDER,
  type AppSlotName, type PaneSlotName,
} from "@/observability/anchors";

// Re-export the generated slot maps so the rest of the shell imports
// from one place and never touches the codegen file directly.
export { AppSlot, PaneSlot, APP_SLOT_ORDER, PANE_SLOT_ORDER };
export type { AppSlotName, PaneSlotName };

// Anchor scope: app-wide (top strip) or pane-scoped (per-pane row).
// Sourced here as the single-source table; every caller compares
// against the enum member, never a literal.
export const AnchorScope = { APP: "app", PANE: "pane" } as const;
export type AnchorScopeT = typeof AnchorScope[keyof typeof AnchorScope];

interface Props {
  id: string;
  byte: number;
  scope: AnchorScopeT;
  paneId?: string;
  slot: AppSlotName | PaneSlotName;
}

function paneRow(paneId: string): number {
  let h = 0;
  for (let i = 0; i < paneId.length; i++) h = ((h << 5) - h + paneId.charCodeAt(i)) | 0;
  return Math.abs(h) % 8;
}

function xy(props: Props): { x: number; y: number } {
  if (props.scope === AnchorScope.APP) {
    const i = APP_SLOT_ORDER.indexOf(props.slot as AppSlotName);
    return { x: i >= 0 ? i : 0, y: 0 };
  }
  const i = PANE_SLOT_ORDER.indexOf(props.slot as PaneSlotName);
  const row = props.paneId ? paneRow(props.paneId) : 0;
  return { x: 5 + (i >= 0 ? i : 0), y: row };
}

export function Anchor(props: Props): JSX.Element {
  const { id, byte, scope, paneId, slot } = props;
  const ref = useRef<HTMLCanvasElement | null>(null);
  const { x, y } = xy(props);

  useEffect(() => {
    if (!ref.current) return;
    register(id, ref.current, byte);
    return () => unregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => { setByte(id, byte); }, [id, byte]);

  const testid = scope === AnchorScope.PANE ? `anchor-pane-${paneId}-${slot}` : `anchor-${slot}`;
  return (
    <canvas
      ref={ref}
      data-testid={testid}
      width={1}
      height={1}
      style={{
        position: "fixed",
        left: `${x}px`,
        top: `${y}px`,
        width: 1,
        height: 1,
        visibility: "visible",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
