# Signal report — e2e_reveal_focus

Outcome: **PASS**
Summary: e2e_reveal_focus — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 147 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"88d0912f3a6e"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"c48f2a62a029","window_id":"88d0912f3a6e","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"c48f2a62a029","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-header_popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":32,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":356,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"42b189dd436b","driver":"deterministic"}}
{"t":357,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"42b189dd436b","driver":"deterministic","context_tokens":null}}
{"t":357,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"92b0f6ca6dc6","pane_id":"c48f2a62a029","session_id":"b4298056598a","name":"session-b42980","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-A87kgn","workspace_shape":"flat","bundle":"","seed":""}}
{"t":359,"kind":"SESSION_CREATED","payload":{"request_id":"92b0f6ca6dc6","session_id":"b4298056598a","name":"session-b42980","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-A87kgn","workspace_shape":"flat","status":"running"}}
{"t":359,"kind":"WORKSPACE_BOUND","payload":{"request_id":"92b0f6ca6dc6","session_id":"b4298056598a","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-A87kgn","shape":"flat"}}
{"t":359,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"c48f2a62a029","session_id":"b4298056598a","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-A87kgn","shape":"flat"}}
{"t":359,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"c48f2a62a029","session_id":"b4298056598a"}}
{"t":364,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-status","byte":64}}
{"t":425,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c48f2a62a029","from":"terminal","to":"reveal"}}
{"t":431,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-reveal","byte":128}}
{"t":646,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"c48f2a62a029","from":"transcript","to":"stream"}}
{"t":802,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"c48f2a62a029","from":"stream","to":"transcript"}}
{"t":960,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"c48f2a62a029","from":"transcript","to":"stream"}}
{"t":965,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"c48f2a62a029","from":"stream","to":"transcript"}}
{"t":1122,"kind":"PANE_SPLIT","payload":{"from_pane_id":"c48f2a62a029","new_pane_id":"8ceb34e6f3b8","axis":"row"}}
{"t":1122,"kind":"PANE_CREATED","payload":{"pane_id":"8ceb34e6f3b8","window_id":"88d0912f3a6e","session_id":null,"from_split":"a22aa1f4a38b"}}
{"t":1122,"kind":"PANE_FOCUSED","payload":{"pane_id":"8ceb34e6f3b8","prior_pane_id":"c48f2a62a029"}}
{"t":1128,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-focus","byte":128}}
{"t":1128,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-status","byte":64}}
{"t":1128,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-reveal","byte":128}}
{"t":1128,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-lens","byte":0}}
{"t":1128,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-level","byte":0}}
{"t":1128,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-dir","byte":0}}
{"t":1128,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-descent","byte":0}}
{"t":1128,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-surface","byte":0}}
{"t":1128,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-find","byte":0}}
{"t":1128,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-inspect","byte":0}}
{"t":1128,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-header_popover","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-focus","byte":255}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-status","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-reveal","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-lens","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-level","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-dir","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-descent","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-surface","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-find","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-inspect","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-header_popover","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-focus","byte":128}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-status","byte":64}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-reveal","byte":128}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-lens","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-level","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-dir","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-descent","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-surface","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-find","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-inspect","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-header_popover","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-focus","byte":255}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-status","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-reveal","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-lens","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-level","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-dir","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-descent","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-surface","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-find","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-inspect","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-header_popover","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-focus","byte":128}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-status","byte":64}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-reveal","byte":128}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-lens","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-level","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-dir","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-descent","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-surface","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-find","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-inspect","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c48f2a62a029-header_popover","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-focus","byte":255}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-status","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-reveal","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-lens","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-level","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-dir","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-descent","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-surface","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-find","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-inspect","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-header_popover","byte":0}}
{"t":1462,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"70abcd7c9822","driver":"deterministic"}}
{"t":1463,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"70abcd7c9822","driver":"deterministic","context_tokens":null}}
{"t":1463,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"9de821c09bb4","pane_id":"8ceb34e6f3b8","session_id":"7f3feebc7e0e","name":"session-7f3fee","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-e0CvQH","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1465,"kind":"SESSION_CREATED","payload":{"request_id":"9de821c09bb4","session_id":"7f3feebc7e0e","name":"session-7f3fee","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-e0CvQH","workspace_shape":"flat","status":"running"}}
{"t":1465,"kind":"WORKSPACE_BOUND","payload":{"request_id":"9de821c09bb4","session_id":"7f3feebc7e0e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-e0CvQH","shape":"flat"}}
{"t":1465,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"8ceb34e6f3b8","session_id":"7f3feebc7e0e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-e0CvQH","shape":"flat"}}
{"t":1465,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"8ceb34e6f3b8","session_id":"7f3feebc7e0e"}}
{"t":1467,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-status","byte":64}}
{"t":1487,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"8ceb34e6f3b8","from":"terminal","to":"reveal"}}
{"t":1492,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8ceb34e6f3b8-reveal","byte":128}}
{"t":1799,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"8ceb34e6f3b8","from":"transcript","to":"stream"}}
```
