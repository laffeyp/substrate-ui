// DropOverlay.tsx — five hit zones (w/e/n/s/c) over a pane during drag.
// Emits DROP_HINT_ZONE_CHANGED on pointer-over-zone; commit fires MOVE_PANE.

import { Zone, ZONES } from "@/state/SplitTree";

interface Props {
  paneId: string;
  activeZone: Zone | null;
  onZoneEnter: (zone: Zone) => void;
  onDrop: (zone: Zone) => void;
  onCancel: () => void;
}

const ZONE_BOX: Record<Zone, React.CSSProperties> = {
  w: { position: "absolute", left: 0, top: "25%", width: "25%", height: "50%" },
  e: { position: "absolute", right: 0, top: "25%", width: "25%", height: "50%" },
  n: { position: "absolute", left: "25%", top: 0, width: "50%", height: "25%" },
  s: { position: "absolute", left: "25%", bottom: 0, width: "50%", height: "25%" },
  c: { position: "absolute", left: "25%", top: "25%", width: "50%", height: "50%" },
};

export function DropOverlay({ paneId, activeZone, onZoneEnter, onDrop, onCancel }: Props): JSX.Element {
  const zones: readonly Zone[] = ZONES;
  return (
    <div
      data-testid={`drop-overlay-${paneId}`}
      onPointerLeave={onCancel}
      style={{ position: "absolute", inset: 0, zIndex: 50 }}
    >
      {zones.map((z) => (
        <div
          key={z}
          data-testid={`drop-zone-${paneId}-${z}`}
          data-active={activeZone === z ? "true" : "false"}
          onPointerEnter={() => onZoneEnter(z)}
          onPointerUp={() => onDrop(z)}
          style={{
            ...ZONE_BOX[z],
            background: activeZone === z ? "rgba(130,165,200,0.25)" : "transparent",
            border: activeZone === z ? "1px solid rgba(130,165,200,0.6)" : "none",
            pointerEvents: "auto",
          }}
        />
      ))}
    </div>
  );
}
