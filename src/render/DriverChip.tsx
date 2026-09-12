// src/render/DriverChip.tsx — Sprint 031.
//
// The header's driver chip shows the pane's current driver and opens
// a dropdown of alternatives on click. Picking a row fires
// DRIVER_PICKED + DRIVER_DROPDOWN_CLOSED + DRIVER_CHANGE_REQUESTED
// in one reducer step, then the async bridge round-trip lands
// DRIVER_CHANGED on success or DRIVER_CHANGE_FAILED on
// driver-unavailable / registry-error.

import type { Pane as PaneModel } from "@/state/ShellState";

// v0.1 driver menu. Deterministic is always available; two ollama
// entries let the harness exercise the availability probe both ways.
// A later widening sprint reads the roster from a config file or from
// the settings dialog (Sprint 040).
export const DRIVER_OPTIONS: readonly string[] = [
  "deterministic",
  "ollama:llama3.2:1b",
  "ollama:no-such-model-xyz",
] as const;

interface Props {
  pane: PaneModel;
  onOpen: (paneId: string, options: readonly string[]) => void;
  onClose: (paneId: string) => void;
  onWalk: (paneId: string, delta: 1 | -1) => void;
  onPick: (paneId: string, sessionId: string, fromDriver: string, toDriver: string) => void;
}

const chipStyle: React.CSSProperties = {
  padding: "2px 6px", borderRadius: 3, background: "#252830",
  color: "#a7acb3", whiteSpace: "nowrap",
  cursor: "pointer", userSelect: "none",
};

const menuStyle: React.CSSProperties = {
  position: "absolute", top: 28, left: 40,
  background: "#1a1c20", border: "1px solid #2a2d33",
  borderRadius: 4, padding: 4, minWidth: 180,
  fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  fontSize: 12, color: "#b9bec5", zIndex: 30,
};

const rowStyle = (active: boolean): React.CSSProperties => ({
  padding: "3px 8px", borderRadius: 2, cursor: "pointer",
  background: active ? "#2a3140" : "transparent",
  color: active ? "#e2e5e9" : "#b9bec5",
});

export function DriverChip({ pane, onOpen, onClose, onWalk, onPick }: Props): JSX.Element {
  const from = pane.driver ?? "";
  const disabled = !pane.boundSessionId;
  return (
    <>
      <span
        data-testid={`driver-chip-${pane.id}`}
        data-driver={pane.driver ?? ""}
        onClick={() => {
          if (disabled) return;
          if (pane.driverPopover.open) onClose(pane.id);
          else onOpen(pane.id, DRIVER_OPTIONS);
        }}
        onKeyDown={(e) => {
          if (!pane.driverPopover.open) return;
          if (e.key === "ArrowDown") { e.preventDefault(); onWalk(pane.id, 1); }
          else if (e.key === "ArrowUp") { e.preventDefault(); onWalk(pane.id, -1); }
          else if (e.key === "Escape") { e.preventDefault(); onClose(pane.id); }
          else if (e.key === "Enter" && pane.boundSessionId) {
            e.preventDefault();
            const to = pane.driverPopover.options[pane.driverPopover.index];
            onPick(pane.id, pane.boundSessionId, from, to);
          }
        }}
        tabIndex={0}
        style={chipStyle}
      >
        <span className="label">{pane.driver ?? "driver"}</span>
      </span>
      {pane.driverPopover.open ? (
        <div data-testid={`driver-popover-${pane.id}`} data-index={pane.driverPopover.index} style={menuStyle}>
          {pane.driverPopover.options.map((opt, i) => (
            <div
              key={opt}
              data-testid={`driver-option-${pane.id}-${i}`}
              data-active={i === pane.driverPopover.index ? "true" : "false"}
              onClick={() => {
                if (!pane.boundSessionId) return;
                onPick(pane.id, pane.boundSessionId, from, opt);
              }}
              style={rowStyle(i === pane.driverPopover.index)}
            >
              <span className="label">{opt}</span>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
