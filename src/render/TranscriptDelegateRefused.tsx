// TranscriptDelegateRefused.tsx — Sprint 023.
//
// Rendered next to a delegate row whose alt-click at depth 2 was
// refused (Layer 5 terminal DELEGATE_DEPTH_CAP_REFUSED). The reducer
// stamps the tool_call_id into pane.refusedToolCallIds; Pane.tsx pipes
// each delegate row a `refused` flag; this component renders the
// visual affordance.

interface Props {
  paneId: string;
  toolCallId: string;
}

export function TranscriptDelegateRefused({ paneId, toolCallId }: Props): JSX.Element {
  return (
    <div
      data-testid={`transcript-delegate-refused-${paneId}-${toolCallId}`}
      style={{
        padding: "2px 6px",
        fontSize: 11,
        color: "#c26058",
        borderLeft: "3px solid #c26058",
        background: "#251616",
        marginLeft: 22,
      }}
    >
      delegate refused (depth cap 2)
    </div>
  );
}
