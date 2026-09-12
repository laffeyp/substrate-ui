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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"4e10e265b2e3"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"7d689c1c0c17","window_id":"4e10e265b2e3","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"7d689c1c0c17","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":26,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":362,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"3933398a608a","driver":"deterministic"}}
{"t":363,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"3933398a608a","driver":"deterministic","context_tokens":null}}
{"t":363,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"f4c868a6df9b","pane_id":"7d689c1c0c17","session_id":"b0fed390711d","name":"session-b0fed3","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-SZe26s","workspace_shape":"flat","bundle":"","seed":""}}
{"t":364,"kind":"SESSION_CREATED","payload":{"request_id":"f4c868a6df9b","session_id":"b0fed390711d","name":"session-b0fed3","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-SZe26s","workspace_shape":"flat","status":"running"}}
{"t":365,"kind":"WORKSPACE_BOUND","payload":{"request_id":"f4c868a6df9b","session_id":"b0fed390711d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-SZe26s","shape":"flat"}}
{"t":365,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"7d689c1c0c17","session_id":"b0fed390711d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-SZe26s","shape":"flat"}}
{"t":365,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"7d689c1c0c17","session_id":"b0fed390711d"}}
{"t":369,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-status","byte":64}}
{"t":429,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d689c1c0c17","from":"terminal","to":"reveal"}}
{"t":435,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":128}}
{"t":712,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d689c1c0c17","from":"reveal","to":"terminal"}}
{"t":718,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":0}}
{"t":939,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d689c1c0c17","from":"terminal","to":"reveal"}}
{"t":943,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":128}}
{"t":963,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d689c1c0c17","from":"reveal","to":"terminal"}}
{"t":968,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":0}}
{"t":979,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d689c1c0c17","from":"terminal","to":"reveal"}}
{"t":986,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":128}}
{"t":996,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d689c1c0c17","from":"reveal","to":"terminal"}}
{"t":1001,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":0}}
{"t":1012,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d689c1c0c17","from":"terminal","to":"reveal"}}
{"t":1018,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":128}}
{"t":1029,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d689c1c0c17","from":"reveal","to":"terminal"}}
{"t":1035,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":0}}
{"t":1045,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d689c1c0c17","from":"terminal","to":"reveal"}}
{"t":1051,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":128}}
{"t":1062,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d689c1c0c17","from":"reveal","to":"terminal"}}
{"t":1068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":0}}
{"t":1078,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d689c1c0c17","from":"terminal","to":"reveal"}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":128}}
{"t":1095,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d689c1c0c17","from":"reveal","to":"terminal"}}
{"t":1101,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d689c1c0c17-reveal","byte":0}}
```
