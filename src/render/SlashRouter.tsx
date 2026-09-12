// src/render/SlashRouter.tsx — Sprint 030.
//
// A menu that hovers above the prompt textarea whenever the draft
// begins with "/". The reducer's PROMPT_TEXT case opens and closes
// the router as the leading character crosses that boundary; this
// component renders the list, highlights the walked row, and shows
// each command's hint. The key handlers live in Prompt.tsx — the
// textarea keeps focus so the user can type the command's argument
// (Layer 2 SLASH_COMMAND_ROUTED payload carries `arg_length`).

import type { Pane as PaneModel } from "@/state/ShellState";
import { SLASH_COMMANDS } from "@/state/SlashCommands";

interface Props {
  pane: PaneModel;
}

const menuStyle: React.CSSProperties = {
  position: "absolute", bottom: 96, left: 8, right: 8,
  background: "#1a1c20", border: "1px solid #2a2d33",
  borderRadius: 4, padding: 4, maxHeight: 220, overflowY: "auto",
  fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  fontSize: 12, color: "#b9bec5", zIndex: 25,
};

const rowStyle = (active: boolean): React.CSSProperties => ({
  display: "grid", gridTemplateColumns: "110px 1fr", gap: 8,
  padding: "3px 6px", borderRadius: 2,
  background: active ? "#2a3140" : "transparent",
  color: active ? "#e2e5e9" : "#b9bec5",
});

export function SlashRouter({ pane }: Props): JSX.Element | null {
  if (!pane.slashRouter.open) return null;
  return (
    <div
      data-testid={`slash-router-${pane.id}`}
      data-index={pane.slashRouter.index}
      style={menuStyle}
    >
      {SLASH_COMMANDS.map((c, i) => (
        <div
          key={c.name}
          data-testid={`slash-command-${pane.id}-${c.name.slice(1)}`}
          data-active={i === pane.slashRouter.index ? "true" : "false"}
          style={rowStyle(i === pane.slashRouter.index)}
        >
          <span className="label">{c.name}</span>
          <span className="label" style={{ color: "#5f636b" }}>{c.hint}</span>
        </div>
      ))}
    </div>
  );
}
