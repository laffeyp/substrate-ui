// Anchor.tsx — the 1×1 pixel-anchor canvas. Every anchor lives at its own
// unique screen position (deterministic from slot + paneId) so element-scoped
// screenshots decode the right canvas per Addendum A2 B4.
//
// Layout: a top-of-window strip. App-scoped anchors take the first 5 columns
// (0..4). Each pane's 11 anchors take columns 5..15 within its own row (row =
// hash(paneId) mod 8, giving up to 8 panes per window unique rows).

import { useEffect, useRef } from "react";
import { register, unregister, setByte } from "@/observability/AnchorPainter";

interface Props {
  id: string;
  byte: number;
  scope: "app" | "pane";
  paneId?: string;
  slot: string;
}

const APP_SLOT_ORDER = ["dialog", "window-strip", "bridge", "last-tag", "heartbeat"] as const;
const PANE_SLOT_ORDER = [
  "focus", "status", "reveal", "lens", "level", "dir",
  "descent", "surface", "find", "inspect", "header_popover",
] as const;

function paneRow(paneId: string): number {
  let h = 0;
  for (let i = 0; i < paneId.length; i++) h = ((h << 5) - h + paneId.charCodeAt(i)) | 0;
  return Math.abs(h) % 8;
}

function xy(props: Props): { x: number; y: number } {
  if (props.scope === "app") {
    const i = APP_SLOT_ORDER.indexOf(props.slot as (typeof APP_SLOT_ORDER)[number]);
    return { x: i >= 0 ? i : 0, y: 0 };
  }
  const i = PANE_SLOT_ORDER.indexOf(props.slot as (typeof PANE_SLOT_ORDER)[number]);
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

  const testid = scope === "pane" ? `anchor-pane-${paneId}-${slot}` : `anchor-${slot}`;
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
