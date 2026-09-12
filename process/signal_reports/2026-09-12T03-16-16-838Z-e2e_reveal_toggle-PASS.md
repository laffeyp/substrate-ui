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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"61ecfdda03c9"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"2aa070af4232","window_id":"61ecfdda03c9","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"2aa070af4232","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":25,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":369,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"193192b6c363","driver":"deterministic"}}
{"t":370,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"193192b6c363","driver":"deterministic","context_tokens":null}}
{"t":370,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"20d3ce27cec3","pane_id":"2aa070af4232","session_id":"b0a10f115f48","name":"session-b0a10f","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-So671U","workspace_shape":"flat","bundle":"","seed":""}}
{"t":372,"kind":"SESSION_CREATED","payload":{"request_id":"20d3ce27cec3","session_id":"b0a10f115f48","name":"session-b0a10f","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-So671U","workspace_shape":"flat","status":"running"}}
{"t":372,"kind":"WORKSPACE_BOUND","payload":{"request_id":"20d3ce27cec3","session_id":"b0a10f115f48","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-So671U","shape":"flat"}}
{"t":372,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"2aa070af4232","session_id":"b0a10f115f48","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-So671U","shape":"flat"}}
{"t":372,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"2aa070af4232","session_id":"b0a10f115f48"}}
{"t":376,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-status","byte":64}}
{"t":437,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2aa070af4232","from":"terminal","to":"reveal"}}
{"t":442,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":128}}
{"t":712,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2aa070af4232","from":"reveal","to":"terminal"}}
{"t":717,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":0}}
{"t":938,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2aa070af4232","from":"terminal","to":"reveal"}}
{"t":942,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":128}}
{"t":962,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2aa070af4232","from":"reveal","to":"terminal"}}
{"t":967,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":0}}
{"t":978,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2aa070af4232","from":"terminal","to":"reveal"}}
{"t":985,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":128}}
{"t":994,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2aa070af4232","from":"reveal","to":"terminal"}}
{"t":1000,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":0}}
{"t":1011,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2aa070af4232","from":"terminal","to":"reveal"}}
{"t":1017,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":128}}
{"t":1027,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2aa070af4232","from":"reveal","to":"terminal"}}
{"t":1033,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":0}}
{"t":1044,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2aa070af4232","from":"terminal","to":"reveal"}}
{"t":1050,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":128}}
{"t":1060,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2aa070af4232","from":"reveal","to":"terminal"}}
{"t":1067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":0}}
{"t":1077,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2aa070af4232","from":"terminal","to":"reveal"}}
{"t":1083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":128}}
{"t":1094,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2aa070af4232","from":"reveal","to":"terminal"}}
{"t":1100,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2aa070af4232-reveal","byte":0}}
```
