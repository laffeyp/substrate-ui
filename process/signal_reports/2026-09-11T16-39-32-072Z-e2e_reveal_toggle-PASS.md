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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"6786928bbe48"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"c84c27ef13e6","window_id":"6786928bbe48","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"c84c27ef13e6","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":357,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"3cfeb3ac6961","driver":"deterministic"}}
{"t":358,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"3cfeb3ac6961","driver":"deterministic","context_tokens":null}}
{"t":358,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"9fd1c63d5d22","pane_id":"c84c27ef13e6","session_id":"ceee9d3b101a","name":"session-ceee9d","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-LfkK0n","workspace_shape":"flat","bundle":"","seed":""}}
{"t":360,"kind":"SESSION_CREATED","payload":{"request_id":"9fd1c63d5d22","session_id":"ceee9d3b101a","name":"session-ceee9d","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-LfkK0n","workspace_shape":"flat","status":"running"}}
{"t":360,"kind":"WORKSPACE_BOUND","payload":{"request_id":"9fd1c63d5d22","session_id":"ceee9d3b101a","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-LfkK0n","shape":"flat"}}
{"t":360,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"c84c27ef13e6","session_id":"ceee9d3b101a","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-LfkK0n","shape":"flat"}}
{"t":360,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"c84c27ef13e6","session_id":"ceee9d3b101a"}}
{"t":367,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-status","byte":64}}
{"t":428,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c84c27ef13e6","from":"terminal","to":"reveal"}}
{"t":433,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":128}}
{"t":685,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c84c27ef13e6","from":"reveal","to":"terminal"}}
{"t":691,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":0}}
{"t":912,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c84c27ef13e6","from":"terminal","to":"reveal"}}
{"t":917,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":128}}
{"t":937,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c84c27ef13e6","from":"reveal","to":"terminal"}}
{"t":941,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":0}}
{"t":961,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c84c27ef13e6","from":"terminal","to":"reveal"}}
{"t":967,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":128}}
{"t":977,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c84c27ef13e6","from":"reveal","to":"terminal"}}
{"t":983,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":0}}
{"t":994,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c84c27ef13e6","from":"terminal","to":"reveal"}}
{"t":1000,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":128}}
{"t":1010,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c84c27ef13e6","from":"reveal","to":"terminal"}}
{"t":1016,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":0}}
{"t":1026,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c84c27ef13e6","from":"terminal","to":"reveal"}}
{"t":1033,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":128}}
{"t":1043,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c84c27ef13e6","from":"reveal","to":"terminal"}}
{"t":1049,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":0}}
{"t":1060,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c84c27ef13e6","from":"terminal","to":"reveal"}}
{"t":1066,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":128}}
{"t":1076,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c84c27ef13e6","from":"reveal","to":"terminal"}}
{"t":1083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c84c27ef13e6-reveal","byte":0}}
```
