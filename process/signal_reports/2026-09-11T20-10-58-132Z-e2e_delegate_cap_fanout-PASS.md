# Signal report — e2e_delegate_cap_fanout

Outcome: **PASS**
Summary: e2e_delegate_cap_fanout — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 71 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"a1087f018fce"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"40c7cdbf24d7","window_id":"a1087f018fce","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"40c7cdbf24d7","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":23,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":379,"kind":"WORKSPACE_BOUND","payload":{"request_id":"d544e375077d","session_id":"b8f75060d750","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-34auxwm4","shape":"flat"}}
{"t":379,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"40c7cdbf24d7","session_id":"b8f75060d750","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-34auxwm4","shape":"flat"}}
{"t":379,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"40c7cdbf24d7","session_id":"b8f75060d750"}}
{"t":380,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"40c7cdbf24d7","tool_call_id":"cP0","depth":1}}
{"t":380,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"40c7cdbf24d7","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":380,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"40c7cdbf24d7","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/0fce7bbc6fc4/record"}}
{"t":381,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-status","byte":56}}
{"t":2413,"kind":"DESCENT_ENTERED","payload":{"pane_id":"40c7cdbf24d7","child_record_root":"/Users/peterlaffey/.substrate/sessions/0fce7bbc6fc4/record","depth":1}}
{"t":2415,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-descent","byte":1}}
{"t":3940,"kind":"DESCENT_ENTERED","payload":{"pane_id":"40c7cdbf24d7","child_record_root":"/Users/peterlaffey/.substrate/sessions/d4fffc7995dc/record","depth":2}}
{"t":3944,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-descent","byte":2}}
{"t":5473,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"40c7cdbf24d7","tool_call_id":"cB0","depth":2}}
{"t":5782,"kind":"DESCENT_EXITED","payload":{"pane_id":"40c7cdbf24d7","to_depth":1}}
{"t":5784,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-descent","byte":1}}
{"t":5987,"kind":"DESCENT_EXITED","payload":{"pane_id":"40c7cdbf24d7","to_depth":0}}
{"t":5988,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40c7cdbf24d7-descent","byte":0}}
{"t":6192,"kind":"PANE_CLOSED","payload":{"pane_id":"40c7cdbf24d7"}}
{"t":6192,"kind":"WINDOW_CLOSED","payload":{"window_id":"a1087f018fce"}}
```
