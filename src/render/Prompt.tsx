// Prompt.tsx — the bound pane's prompt editor. Draft text stays local; the
// shell fires PROMPT_CHANGED{pane_id, length} debounced 100ms per Layer 4
// cadence. The privacy invariant (Layer 2): raw draft text never enters
// the JSONL trace — only `length`.

import { useEffect, useRef } from "react";
import { Pane } from "@/state/ShellState";

interface Props {
  pane: Pane;
  onText: (paneId: string, text: string) => void;
  onLengthChanged: (paneId: string, length: number) => void;
  onSubmit: (paneId: string, text: string) => void;
}

const DEBOUNCE_MS = 100;

export function Prompt({ pane, onText, onLengthChanged, onSubmit }: Props): JSX.Element {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFiredLength = useRef<number>(pane.promptDraft.length);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const scheduleEmit = (paneId: string, length: number): void => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (length !== lastFiredLength.current) {
        onLengthChanged(paneId, length);
        lastFiredLength.current = length;
      }
    }, DEBOUNCE_MS);
  };

  return (
    <div style={{ padding: 8, borderTop: "1px solid #2a2d33" }}>
      <textarea
        data-testid={`prompt-${pane.id}`}
        value={pane.promptDraft}
        onChange={(e) => {
          const text = e.target.value;
          onText(pane.id, text);
          scheduleEmit(pane.id, text.length);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            const text = pane.promptDraft.trim();
            if (text.length > 0 && pane.boundSessionId) onSubmit(pane.id, text);
          }
        }}
        rows={4}
        placeholder="Type a prompt…"
        style={{
          width: "100%", padding: "6px 8px",
          border: "1px solid #2a2d33", background: "#1c1e22", color: "#b9bec5",
          fontFamily: "inherit", fontSize: 13, resize: "vertical",
        }}
      />
    </div>
  );
}
