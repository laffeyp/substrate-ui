# Signal report — e2e_reveal_toggle

Outcome: **PASS**
Summary: e2e_reveal_toggle — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 85 emits

```jsonl
{"t":4,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"09fc6a539ffc"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"b6f431df9422","window_id":"09fc6a539ffc","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"b6f431df9422","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-header-popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":389,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"bf2cecfcc433","driver":"deterministic"}}
{"t":390,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"bf2cecfcc433","driver":"deterministic","context_tokens":null}}
{"t":390,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"70647e33dd6b","pane_id":"b6f431df9422","session_id":"ce0b05d0ee82","name":"session-ce0b05","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-Tdr5VV","workspace_shape":"flat","bundle":"","seed":""}}
{"t":391,"kind":"SESSION_CREATED","payload":{"request_id":"70647e33dd6b","session_id":"ce0b05d0ee82","name":"session-ce0b05","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-Tdr5VV","workspace_shape":"flat","status":"running"}}
{"t":391,"kind":"WORKSPACE_BOUND","payload":{"request_id":"70647e33dd6b","session_id":"ce0b05d0ee82","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-Tdr5VV","shape":"flat"}}
{"t":391,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"b6f431df9422","session_id":"ce0b05d0ee82","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-Tdr5VV","shape":"flat"}}
{"t":391,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"b6f431df9422","session_id":"ce0b05d0ee82"}}
{"t":397,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-status","byte":64}}
{"t":417,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"b6f431df9422","from":"terminal","to":"reveal"}}
{"t":422,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":128}}
{"t":702,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"b6f431df9422","from":"reveal","to":"terminal"}}
{"t":706,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":0}}
{"t":928,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"b6f431df9422","from":"terminal","to":"reveal"}}
{"t":931,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":128}}
{"t":950,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"b6f431df9422","from":"reveal","to":"terminal"}}
{"t":957,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":0}}
{"t":966,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"b6f431df9422","from":"terminal","to":"reveal"}}
{"t":974,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":128}}
{"t":984,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"b6f431df9422","from":"reveal","to":"terminal"}}
{"t":990,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":0}}
{"t":1000,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"b6f431df9422","from":"terminal","to":"reveal"}}
{"t":1006,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":128}}
{"t":1016,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"b6f431df9422","from":"reveal","to":"terminal"}}
{"t":1022,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":0}}
{"t":1033,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"b6f431df9422","from":"terminal","to":"reveal"}}
{"t":1039,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":128}}
{"t":1049,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"b6f431df9422","from":"reveal","to":"terminal"}}
{"t":1056,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":0}}
{"t":1066,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"b6f431df9422","from":"terminal","to":"reveal"}}
{"t":1072,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":128}}
{"t":1083,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"b6f431df9422","from":"reveal","to":"terminal"}}
{"t":1089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b6f431df9422-reveal","byte":0}}
```
