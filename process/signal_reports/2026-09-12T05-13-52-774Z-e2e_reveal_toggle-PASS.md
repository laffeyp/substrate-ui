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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"addf40151bf6"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"7a16850d5c38","window_id":"addf40151bf6","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"7a16850d5c38","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":368,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"0eca0c8a5146","driver":"deterministic"}}
{"t":369,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"0eca0c8a5146","driver":"deterministic","context_tokens":null}}
{"t":369,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"709d5804e250","pane_id":"7a16850d5c38","session_id":"60b9f814158a","name":"session-60b9f8","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-Zjz0N1","workspace_shape":"flat","bundle":"","seed":""}}
{"t":370,"kind":"SESSION_CREATED","payload":{"request_id":"709d5804e250","session_id":"60b9f814158a","name":"session-60b9f8","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-Zjz0N1","workspace_shape":"flat","status":"running"}}
{"t":370,"kind":"WORKSPACE_BOUND","payload":{"request_id":"709d5804e250","session_id":"60b9f814158a","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-Zjz0N1","shape":"flat"}}
{"t":370,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"7a16850d5c38","session_id":"60b9f814158a","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-Zjz0N1","shape":"flat"}}
{"t":370,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"7a16850d5c38","session_id":"60b9f814158a"}}
{"t":375,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-status","byte":64}}
{"t":436,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7a16850d5c38","from":"terminal","to":"reveal"}}
{"t":441,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":128}}
{"t":719,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7a16850d5c38","from":"reveal","to":"terminal"}}
{"t":725,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":0}}
{"t":944,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7a16850d5c38","from":"terminal","to":"reveal"}}
{"t":951,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":128}}
{"t":961,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7a16850d5c38","from":"reveal","to":"terminal"}}
{"t":966,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":0}}
{"t":977,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7a16850d5c38","from":"terminal","to":"reveal"}}
{"t":983,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":128}}
{"t":994,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7a16850d5c38","from":"reveal","to":"terminal"}}
{"t":1000,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":0}}
{"t":1010,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7a16850d5c38","from":"terminal","to":"reveal"}}
{"t":1016,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":128}}
{"t":1027,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7a16850d5c38","from":"reveal","to":"terminal"}}
{"t":1033,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":0}}
{"t":1043,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7a16850d5c38","from":"terminal","to":"reveal"}}
{"t":1049,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":128}}
{"t":1060,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7a16850d5c38","from":"reveal","to":"terminal"}}
{"t":1066,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":0}}
{"t":1077,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7a16850d5c38","from":"terminal","to":"reveal"}}
{"t":1083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":128}}
{"t":1093,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7a16850d5c38","from":"reveal","to":"terminal"}}
{"t":1100,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7a16850d5c38-reveal","byte":0}}
```
