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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"88b2bd8839ad"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"e6590b5d3602","window_id":"88b2bd8839ad","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"e6590b5d3602","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":27,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":364,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"dfcc32c4a555","driver":"deterministic"}}
{"t":368,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"dfcc32c4a555","driver":"deterministic","context_tokens":null}}
{"t":368,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"6da522c75368","pane_id":"e6590b5d3602","session_id":"e6e84d2dba03","name":"session-e6e84d","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-dFgWZC","workspace_shape":"flat","bundle":"","seed":""}}
{"t":370,"kind":"SESSION_CREATED","payload":{"request_id":"6da522c75368","session_id":"e6e84d2dba03","name":"session-e6e84d","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-dFgWZC","workspace_shape":"flat","status":"running"}}
{"t":370,"kind":"WORKSPACE_BOUND","payload":{"request_id":"6da522c75368","session_id":"e6e84d2dba03","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-dFgWZC","shape":"flat"}}
{"t":370,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"e6590b5d3602","session_id":"e6e84d2dba03","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-dFgWZC","shape":"flat"}}
{"t":370,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"e6590b5d3602","session_id":"e6e84d2dba03"}}
{"t":378,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-status","byte":64}}
{"t":429,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e6590b5d3602","from":"terminal","to":"reveal"}}
{"t":435,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":128}}
{"t":689,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e6590b5d3602","from":"reveal","to":"terminal"}}
{"t":693,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":0}}
{"t":913,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e6590b5d3602","from":"terminal","to":"reveal"}}
{"t":919,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":128}}
{"t":930,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e6590b5d3602","from":"reveal","to":"terminal"}}
{"t":935,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":0}}
{"t":946,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e6590b5d3602","from":"terminal","to":"reveal"}}
{"t":952,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":128}}
{"t":963,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e6590b5d3602","from":"reveal","to":"terminal"}}
{"t":968,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":0}}
{"t":979,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e6590b5d3602","from":"terminal","to":"reveal"}}
{"t":985,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":128}}
{"t":995,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e6590b5d3602","from":"reveal","to":"terminal"}}
{"t":1002,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":0}}
{"t":1012,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e6590b5d3602","from":"terminal","to":"reveal"}}
{"t":1018,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":128}}
{"t":1029,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e6590b5d3602","from":"reveal","to":"terminal"}}
{"t":1035,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":0}}
{"t":1045,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e6590b5d3602","from":"terminal","to":"reveal"}}
{"t":1052,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":128}}
{"t":1062,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e6590b5d3602","from":"reveal","to":"terminal"}}
{"t":1068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e6590b5d3602-reveal","byte":0}}
```
