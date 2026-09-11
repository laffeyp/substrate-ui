// DragLayer.tsx — a full-window overlay that catches pointer events during
// a pane drag. Walks the DOM at pointer coordinates to find the target pane,
// computes the zone from relative position, calls onZoneChange per flip.

import { useEffect } from "react";
import { Zone } from "@/state/SplitTree";

interface Props {
  sourceId: string;
  activeTargetId: string | null;
  activeZone: Zone | null;
  onZoneChange: (targetId: string, zone: Zone) => void;
  onCommit: (targetId: string, zone: Zone) => void;
  onCancel: () => void;
}

function paneUnderPoint(x: number, y: number, sourceId: string): string | null {
  const els = document.elementsFromPoint(x, y);
  for (const el of els) {
    if (!(el instanceof HTMLElement)) continue;
    const id = el.dataset.paneId;
    if (id && id !== sourceId) return id;
    const closest = el.closest<HTMLElement>("[data-pane-id]");
    if (closest && closest.dataset.paneId && closest.dataset.paneId !== sourceId) return closest.dataset.paneId;
  }
  return null;
}

function zoneWithin(targetEl: HTMLElement, x: number, y: number): Zone {
  const rect = targetEl.getBoundingClientRect();
  const dx = (x - rect.left) / rect.width;
  const dy = (y - rect.top) / rect.height;
  const inMidX = dx > 0.25 && dx < 0.75;
  const inMidY = dy > 0.25 && dy < 0.75;
  if (inMidX && inMidY) return "c";
  if (dx < 0.25) return "w";
  if (dx > 0.75) return "e";
  if (dy < 0.5)  return "n";
  return "s";
}

export function DragLayer({ sourceId, activeTargetId, activeZone, onZoneChange, onCommit, onCancel }: Props): JSX.Element {
  useEffect(() => {
    const move = (e: PointerEvent): void => {
      const targetId = paneUnderPoint(e.clientX, e.clientY, sourceId);
      if (!targetId) return;
      const targetEl = document.querySelector<HTMLElement>(`[data-pane-id="${targetId}"]`);
      if (!targetEl) return;
      const zone = zoneWithin(targetEl, e.clientX, e.clientY);
      if (targetId !== activeTargetId || zone !== activeZone) onZoneChange(targetId, zone);
    };
    const up = (e: PointerEvent): void => {
      const targetId = paneUnderPoint(e.clientX, e.clientY, sourceId);
      if (targetId && activeZone) {
        const targetEl = document.querySelector<HTMLElement>(`[data-pane-id="${targetId}"]`);
        const zone = targetEl ? zoneWithin(targetEl, e.clientX, e.clientY) : activeZone;
        onCommit(targetId, zone);
      } else {
        onCancel();
      }
    };
    const key = (e: KeyboardEvent): void => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", key);
    };
  }, [sourceId, activeTargetId, activeZone, onZoneChange, onCommit, onCancel]);

  const targetEl = activeTargetId ? document.querySelector<HTMLElement>(`[data-pane-id="${activeTargetId}"]`) : null;
  const rect = targetEl?.getBoundingClientRect();
  const ZONE_BOX: Record<Zone, React.CSSProperties> = rect ? {
    w: { position: "fixed", left: rect.left, top: rect.top + rect.height * 0.25, width: rect.width * 0.25, height: rect.height * 0.5 },
    e: { position: "fixed", left: rect.left + rect.width * 0.75, top: rect.top + rect.height * 0.25, width: rect.width * 0.25, height: rect.height * 0.5 },
    n: { position: "fixed", left: rect.left + rect.width * 0.25, top: rect.top, width: rect.width * 0.5, height: rect.height * 0.25 },
    s: { position: "fixed", left: rect.left + rect.width * 0.25, top: rect.top + rect.height * 0.75, width: rect.width * 0.5, height: rect.height * 0.25 },
    c: { position: "fixed", left: rect.left + rect.width * 0.25, top: rect.top + rect.height * 0.25, width: rect.width * 0.5, height: rect.height * 0.5 },
  } : { w: {}, e: {}, n: {}, s: {}, c: {} };

  return (
    <div data-testid="drag-layer" style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      {activeTargetId && activeZone && (
        <div data-testid={`drop-hint-${activeZone}`} style={{
          ...ZONE_BOX[activeZone],
          background: "rgba(130,165,200,0.25)",
          border: "1px solid rgba(130,165,200,0.6)",
          pointerEvents: "none",
        }} />
      )}
    </div>
  );
}
