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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"b69125e1ea50"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"c98af5807199","window_id":"b69125e1ea50","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"c98af5807199","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-header_popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":32,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":362,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"bad369893aeb","driver":"deterministic"}}
{"t":363,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"bad369893aeb","driver":"deterministic","context_tokens":null}}
{"t":363,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"1eddffc56c44","pane_id":"c98af5807199","session_id":"4aff39350604","name":"session-4aff39","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-8z8L3f","workspace_shape":"flat","bundle":"","seed":""}}
{"t":365,"kind":"SESSION_CREATED","payload":{"request_id":"1eddffc56c44","session_id":"4aff39350604","name":"session-4aff39","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-8z8L3f","workspace_shape":"flat","status":"running"}}
{"t":365,"kind":"WORKSPACE_BOUND","payload":{"request_id":"1eddffc56c44","session_id":"4aff39350604","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-8z8L3f","shape":"flat"}}
{"t":365,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"c98af5807199","session_id":"4aff39350604","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-8z8L3f","shape":"flat"}}
{"t":365,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"c98af5807199","session_id":"4aff39350604"}}
{"t":372,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-status","byte":64}}
{"t":432,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c98af5807199","from":"terminal","to":"reveal"}}
{"t":439,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":128}}
{"t":707,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c98af5807199","from":"reveal","to":"terminal"}}
{"t":713,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":0}}
{"t":933,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c98af5807199","from":"terminal","to":"reveal"}}
{"t":939,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":128}}
{"t":958,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c98af5807199","from":"reveal","to":"terminal"}}
{"t":963,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":0}}
{"t":974,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c98af5807199","from":"terminal","to":"reveal"}}
{"t":981,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":128}}
{"t":990,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c98af5807199","from":"reveal","to":"terminal"}}
{"t":996,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":0}}
{"t":1006,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c98af5807199","from":"terminal","to":"reveal"}}
{"t":1013,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":128}}
{"t":1024,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c98af5807199","from":"reveal","to":"terminal"}}
{"t":1030,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":0}}
{"t":1040,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c98af5807199","from":"terminal","to":"reveal"}}
{"t":1046,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":128}}
{"t":1056,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c98af5807199","from":"reveal","to":"terminal"}}
{"t":1063,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":0}}
{"t":1073,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c98af5807199","from":"terminal","to":"reveal"}}
{"t":1081,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":128}}
{"t":1090,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c98af5807199","from":"reveal","to":"terminal"}}
{"t":1096,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c98af5807199-reveal","byte":0}}
```
