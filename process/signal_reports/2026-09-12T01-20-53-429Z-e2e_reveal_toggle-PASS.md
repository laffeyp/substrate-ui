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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"98676e563f94"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"c31dd27a7dd0","window_id":"98676e563f94","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"c31dd27a7dd0","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":25,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":357,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"87dc29462264","driver":"deterministic"}}
{"t":360,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"87dc29462264","driver":"deterministic","context_tokens":null}}
{"t":360,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"d3de3a988311","pane_id":"c31dd27a7dd0","session_id":"9766644f996e","name":"session-976664","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-VSaA9g","workspace_shape":"flat","bundle":"","seed":""}}
{"t":361,"kind":"SESSION_CREATED","payload":{"request_id":"d3de3a988311","session_id":"9766644f996e","name":"session-976664","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-VSaA9g","workspace_shape":"flat","status":"running"}}
{"t":361,"kind":"WORKSPACE_BOUND","payload":{"request_id":"d3de3a988311","session_id":"9766644f996e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-VSaA9g","shape":"flat"}}
{"t":361,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"c31dd27a7dd0","session_id":"9766644f996e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-VSaA9g","shape":"flat"}}
{"t":361,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"c31dd27a7dd0","session_id":"9766644f996e"}}
{"t":368,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-status","byte":64}}
{"t":430,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c31dd27a7dd0","from":"terminal","to":"reveal"}}
{"t":434,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":128}}
{"t":703,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c31dd27a7dd0","from":"reveal","to":"terminal"}}
{"t":708,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":0}}
{"t":920,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c31dd27a7dd0","from":"terminal","to":"reveal"}}
{"t":926,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":128}}
{"t":936,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c31dd27a7dd0","from":"reveal","to":"terminal"}}
{"t":942,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":0}}
{"t":952,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c31dd27a7dd0","from":"terminal","to":"reveal"}}
{"t":958,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":128}}
{"t":969,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c31dd27a7dd0","from":"reveal","to":"terminal"}}
{"t":975,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":0}}
{"t":986,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c31dd27a7dd0","from":"terminal","to":"reveal"}}
{"t":992,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":128}}
{"t":1002,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c31dd27a7dd0","from":"reveal","to":"terminal"}}
{"t":1008,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":0}}
{"t":1019,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c31dd27a7dd0","from":"terminal","to":"reveal"}}
{"t":1025,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":128}}
{"t":1036,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c31dd27a7dd0","from":"reveal","to":"terminal"}}
{"t":1042,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":0}}
{"t":1052,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c31dd27a7dd0","from":"terminal","to":"reveal"}}
{"t":1058,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":128}}
{"t":1069,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c31dd27a7dd0","from":"reveal","to":"terminal"}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c31dd27a7dd0-reveal","byte":0}}
```
