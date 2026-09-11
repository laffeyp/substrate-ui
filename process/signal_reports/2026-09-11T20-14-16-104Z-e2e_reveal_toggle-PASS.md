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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"61838b848cb1"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"81bf259a8534","window_id":"61838b848cb1","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"81bf259a8534","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-header_popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":367,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"0e9c30f9c9b9","driver":"deterministic"}}
{"t":368,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"0e9c30f9c9b9","driver":"deterministic","context_tokens":null}}
{"t":368,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"406f46e6f046","pane_id":"81bf259a8534","session_id":"6d60b4427f7d","name":"session-6d60b4","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-YDl2Qm","workspace_shape":"flat","bundle":"","seed":""}}
{"t":370,"kind":"SESSION_CREATED","payload":{"request_id":"406f46e6f046","session_id":"6d60b4427f7d","name":"session-6d60b4","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-YDl2Qm","workspace_shape":"flat","status":"running"}}
{"t":370,"kind":"WORKSPACE_BOUND","payload":{"request_id":"406f46e6f046","session_id":"6d60b4427f7d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-YDl2Qm","shape":"flat"}}
{"t":370,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"81bf259a8534","session_id":"6d60b4427f7d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-YDl2Qm","shape":"flat"}}
{"t":370,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"81bf259a8534","session_id":"6d60b4427f7d"}}
{"t":375,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-status","byte":64}}
{"t":436,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"81bf259a8534","from":"terminal","to":"reveal"}}
{"t":440,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":128}}
{"t":694,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"81bf259a8534","from":"reveal","to":"terminal"}}
{"t":699,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":0}}
{"t":909,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"81bf259a8534","from":"terminal","to":"reveal"}}
{"t":916,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":128}}
{"t":926,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"81bf259a8534","from":"reveal","to":"terminal"}}
{"t":932,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":0}}
{"t":942,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"81bf259a8534","from":"terminal","to":"reveal"}}
{"t":950,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":128}}
{"t":960,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"81bf259a8534","from":"reveal","to":"terminal"}}
{"t":967,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":0}}
{"t":984,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"81bf259a8534","from":"terminal","to":"reveal"}}
{"t":992,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":128}}
{"t":1001,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"81bf259a8534","from":"reveal","to":"terminal"}}
{"t":1007,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":0}}
{"t":1017,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"81bf259a8534","from":"terminal","to":"reveal"}}
{"t":1024,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":128}}
{"t":1034,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"81bf259a8534","from":"reveal","to":"terminal"}}
{"t":1041,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":0}}
{"t":1051,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"81bf259a8534","from":"terminal","to":"reveal"}}
{"t":1058,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":128}}
{"t":1067,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"81bf259a8534","from":"reveal","to":"terminal"}}
{"t":1074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-81bf259a8534-reveal","byte":0}}
```
