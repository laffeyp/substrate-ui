# Signal report — e2e_probe_driver

Outcome: **PASS**
Summary: e2e_probe_driver — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 61 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"dd62e4650ac8"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"ecec6a6adda5","window_id":"dd62e4650ac8","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"ecec6a6adda5","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-focus","byte":255}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-status","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-reveal","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-lens","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-level","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-dir","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-descent","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-surface","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-find","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-inspect","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-header-popover","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-focus","byte":255}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-status","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-reveal","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-lens","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-level","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-dir","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-descent","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-surface","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-find","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-inspect","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-header-popover","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-focus","byte":255}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-status","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-reveal","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-lens","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-level","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-dir","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-descent","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-surface","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-find","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-inspect","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-header-popover","byte":0}}
{"t":23,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":35,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":360,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"fe12bacfab70","driver":"deterministic"}}
{"t":361,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"fe12bacfab70","driver":"deterministic","context_tokens":null}}
{"t":361,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"f840b6dccb06","pane_id":"ecec6a6adda5","session_id":"7b9f48c1aea1","name":"session-7b9f48","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-probe-ws-TKL5o1","workspace_shape":"flat","bundle":"","seed":""}}
{"t":363,"kind":"SESSION_CREATED","payload":{"request_id":"f840b6dccb06","session_id":"7b9f48c1aea1","name":"session-7b9f48","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-probe-ws-TKL5o1","workspace_shape":"flat","status":"running"}}
{"t":363,"kind":"WORKSPACE_BOUND","payload":{"request_id":"f840b6dccb06","session_id":"7b9f48c1aea1","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-probe-ws-TKL5o1","shape":"flat"}}
{"t":363,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"ecec6a6adda5","session_id":"7b9f48c1aea1","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-probe-ws-TKL5o1","shape":"flat"}}
{"t":363,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"ecec6a6adda5","session_id":"7b9f48c1aea1"}}
{"t":366,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecec6a6adda5-status","byte":64}}
```
