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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"2ea1e30315e1"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"ec85e43c1fc0","window_id":"2ea1e30315e1","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"ec85e43c1fc0","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":370,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"970d74be8e05","driver":"deterministic"}}
{"t":371,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"970d74be8e05","driver":"deterministic","context_tokens":null}}
{"t":371,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"627846c0edf2","pane_id":"ec85e43c1fc0","session_id":"600ada582a2d","name":"session-600ada","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-UIyjv6","workspace_shape":"flat","bundle":"","seed":""}}
{"t":372,"kind":"SESSION_CREATED","payload":{"request_id":"627846c0edf2","session_id":"600ada582a2d","name":"session-600ada","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-UIyjv6","workspace_shape":"flat","status":"running"}}
{"t":372,"kind":"WORKSPACE_BOUND","payload":{"request_id":"627846c0edf2","session_id":"600ada582a2d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-UIyjv6","shape":"flat"}}
{"t":372,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"ec85e43c1fc0","session_id":"600ada582a2d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-UIyjv6","shape":"flat"}}
{"t":372,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"ec85e43c1fc0","session_id":"600ada582a2d"}}
{"t":376,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-status","byte":64}}
{"t":437,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ec85e43c1fc0","from":"terminal","to":"reveal"}}
{"t":442,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":128}}
{"t":703,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ec85e43c1fc0","from":"reveal","to":"terminal"}}
{"t":708,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":0}}
{"t":930,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ec85e43c1fc0","from":"terminal","to":"reveal"}}
{"t":934,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":128}}
{"t":956,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ec85e43c1fc0","from":"reveal","to":"terminal"}}
{"t":959,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":0}}
{"t":978,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ec85e43c1fc0","from":"terminal","to":"reveal"}}
{"t":984,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":128}}
{"t":995,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ec85e43c1fc0","from":"reveal","to":"terminal"}}
{"t":1001,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":0}}
{"t":1011,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ec85e43c1fc0","from":"terminal","to":"reveal"}}
{"t":1018,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":128}}
{"t":1027,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ec85e43c1fc0","from":"reveal","to":"terminal"}}
{"t":1033,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":0}}
{"t":1044,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ec85e43c1fc0","from":"terminal","to":"reveal"}}
{"t":1050,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":128}}
{"t":1061,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ec85e43c1fc0","from":"reveal","to":"terminal"}}
{"t":1067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":0}}
{"t":1077,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ec85e43c1fc0","from":"terminal","to":"reveal"}}
{"t":1083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":128}}
{"t":1093,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ec85e43c1fc0","from":"reveal","to":"terminal"}}
{"t":1100,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ec85e43c1fc0-reveal","byte":0}}
```
