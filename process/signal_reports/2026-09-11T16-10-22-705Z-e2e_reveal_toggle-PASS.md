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
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"f2398e44f490"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"65c351ef0096","window_id":"f2398e44f490","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"65c351ef0096","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-header_popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-header_popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-header_popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":372,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"e889d9d5c3db","driver":"deterministic"}}
{"t":373,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"e889d9d5c3db","driver":"deterministic","context_tokens":null}}
{"t":373,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"0a66bcb2d149","pane_id":"65c351ef0096","session_id":"d2116503d3a2","name":"session-d21165","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-BU7zxj","workspace_shape":"flat","bundle":"","seed":""}}
{"t":374,"kind":"SESSION_CREATED","payload":{"request_id":"0a66bcb2d149","session_id":"d2116503d3a2","name":"session-d21165","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-BU7zxj","workspace_shape":"flat","status":"running"}}
{"t":374,"kind":"WORKSPACE_BOUND","payload":{"request_id":"0a66bcb2d149","session_id":"d2116503d3a2","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-BU7zxj","shape":"flat"}}
{"t":374,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"65c351ef0096","session_id":"d2116503d3a2","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-BU7zxj","shape":"flat"}}
{"t":374,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"65c351ef0096","session_id":"d2116503d3a2"}}
{"t":381,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-status","byte":64}}
{"t":442,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"65c351ef0096","from":"terminal","to":"reveal"}}
{"t":447,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":128}}
{"t":726,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"65c351ef0096","from":"reveal","to":"terminal"}}
{"t":730,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":0}}
{"t":952,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"65c351ef0096","from":"terminal","to":"reveal"}}
{"t":955,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":128}}
{"t":976,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"65c351ef0096","from":"reveal","to":"terminal"}}
{"t":980,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":0}}
{"t":999,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"65c351ef0096","from":"terminal","to":"reveal"}}
{"t":1007,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":128}}
{"t":1017,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"65c351ef0096","from":"reveal","to":"terminal"}}
{"t":1024,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":0}}
{"t":1033,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"65c351ef0096","from":"terminal","to":"reveal"}}
{"t":1040,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":128}}
{"t":1050,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"65c351ef0096","from":"reveal","to":"terminal"}}
{"t":1057,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":0}}
{"t":1066,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"65c351ef0096","from":"terminal","to":"reveal"}}
{"t":1072,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":128}}
{"t":1082,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"65c351ef0096","from":"reveal","to":"terminal"}}
{"t":1088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":0}}
{"t":1099,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"65c351ef0096","from":"terminal","to":"reveal"}}
{"t":1105,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":128}}
{"t":1113,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"65c351ef0096","from":"reveal","to":"terminal"}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-65c351ef0096-reveal","byte":0}}
```
