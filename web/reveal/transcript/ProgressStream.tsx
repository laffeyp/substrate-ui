// Sprint 074 — streaming pane inside a tool card. Reads
// `snapshot.progressByCallId[callId]` from the shared snapshot the
// Transcript already subscribed to. Rendered as a memoized component
// so streaming updates re-render only this pane, not sibling cards.

import * as React from "react";

interface Props {
  progressText: string;
  eof: boolean;
}

const ProgressStreamInner: React.FC<Props> = ({ progressText, eof }) => {
  return (
    <>
      <div style={{ marginTop: 8, color: "#62676f" }}>
        streaming{eof ? <span style={{ color: "#4a4e55" }}> · eof</span> : null}
      </div>
      <div style={{
        background: "#1a1c20",
        borderRadius: 5,
        padding: "8px 12px",
        maxHeight: 220,
        overflow: "auto",
        color: "#7fb3b8",
        whiteSpace: "pre-wrap",
      }}>{progressText}</div>
    </>
  );
};

export const ProgressStream = React.memo(ProgressStreamInner);
