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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"9321bcfb4a72"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"72f5c8d97a3d","window_id":"9321bcfb4a72","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"72f5c8d97a3d","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":357,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"6e6da5039087","driver":"deterministic"}}
{"t":358,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"6e6da5039087","driver":"deterministic","context_tokens":null}}
{"t":358,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"f8c165f306c7","pane_id":"72f5c8d97a3d","session_id":"f8194b8cb259","name":"session-f8194b","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-3u6avN","workspace_shape":"flat","bundle":"","seed":""}}
{"t":359,"kind":"SESSION_CREATED","payload":{"request_id":"f8c165f306c7","session_id":"f8194b8cb259","name":"session-f8194b","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-3u6avN","workspace_shape":"flat","status":"running"}}
{"t":359,"kind":"WORKSPACE_BOUND","payload":{"request_id":"f8c165f306c7","session_id":"f8194b8cb259","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-3u6avN","shape":"flat"}}
{"t":359,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"72f5c8d97a3d","session_id":"f8194b8cb259","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-3u6avN","shape":"flat"}}
{"t":359,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"72f5c8d97a3d","session_id":"f8194b8cb259"}}
{"t":364,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-status","byte":64}}
{"t":426,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"72f5c8d97a3d","from":"terminal","to":"reveal"}}
{"t":430,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":128}}
{"t":692,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"72f5c8d97a3d","from":"reveal","to":"terminal"}}
{"t":698,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":0}}
{"t":918,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"72f5c8d97a3d","from":"terminal","to":"reveal"}}
{"t":922,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":128}}
{"t":943,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"72f5c8d97a3d","from":"reveal","to":"terminal"}}
{"t":948,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":0}}
{"t":967,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"72f5c8d97a3d","from":"terminal","to":"reveal"}}
{"t":973,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":128}}
{"t":982,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"72f5c8d97a3d","from":"reveal","to":"terminal"}}
{"t":989,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":0}}
{"t":999,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"72f5c8d97a3d","from":"terminal","to":"reveal"}}
{"t":1005,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":128}}
{"t":1015,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"72f5c8d97a3d","from":"reveal","to":"terminal"}}
{"t":1022,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":0}}
{"t":1032,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"72f5c8d97a3d","from":"terminal","to":"reveal"}}
{"t":1038,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":128}}
{"t":1049,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"72f5c8d97a3d","from":"reveal","to":"terminal"}}
{"t":1055,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":0}}
{"t":1065,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"72f5c8d97a3d","from":"terminal","to":"reveal"}}
{"t":1072,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":128}}
{"t":1082,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"72f5c8d97a3d","from":"reveal","to":"terminal"}}
{"t":1088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-72f5c8d97a3d-reveal","byte":0}}
```
