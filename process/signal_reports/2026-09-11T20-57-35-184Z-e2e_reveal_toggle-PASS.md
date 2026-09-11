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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"36f0d217dd3a"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"9eed654127b9","window_id":"36f0d217dd3a","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"9eed654127b9","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":31,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":356,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"781312772793","driver":"deterministic"}}
{"t":357,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"781312772793","driver":"deterministic","context_tokens":null}}
{"t":357,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"18099f96b44b","pane_id":"9eed654127b9","session_id":"773bec5e1587","name":"session-773bec","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-uhfrLq","workspace_shape":"flat","bundle":"","seed":""}}
{"t":358,"kind":"SESSION_CREATED","payload":{"request_id":"18099f96b44b","session_id":"773bec5e1587","name":"session-773bec","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-uhfrLq","workspace_shape":"flat","status":"running"}}
{"t":358,"kind":"WORKSPACE_BOUND","payload":{"request_id":"18099f96b44b","session_id":"773bec5e1587","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-uhfrLq","shape":"flat"}}
{"t":358,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"9eed654127b9","session_id":"773bec5e1587","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-uhfrLq","shape":"flat"}}
{"t":358,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"9eed654127b9","session_id":"773bec5e1587"}}
{"t":362,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-status","byte":64}}
{"t":423,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9eed654127b9","from":"terminal","to":"reveal"}}
{"t":428,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":128}}
{"t":698,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9eed654127b9","from":"reveal","to":"terminal"}}
{"t":703,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":0}}
{"t":925,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9eed654127b9","from":"terminal","to":"reveal"}}
{"t":928,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":128}}
{"t":950,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9eed654127b9","from":"reveal","to":"terminal"}}
{"t":953,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":0}}
{"t":972,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9eed654127b9","from":"terminal","to":"reveal"}}
{"t":978,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":128}}
{"t":989,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9eed654127b9","from":"reveal","to":"terminal"}}
{"t":995,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":0}}
{"t":1005,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9eed654127b9","from":"terminal","to":"reveal"}}
{"t":1011,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":128}}
{"t":1022,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9eed654127b9","from":"reveal","to":"terminal"}}
{"t":1028,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":0}}
{"t":1038,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9eed654127b9","from":"terminal","to":"reveal"}}
{"t":1045,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":128}}
{"t":1055,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9eed654127b9","from":"reveal","to":"terminal"}}
{"t":1061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":0}}
{"t":1071,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9eed654127b9","from":"terminal","to":"reveal"}}
{"t":1078,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":128}}
{"t":1088,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9eed654127b9","from":"reveal","to":"terminal"}}
{"t":1095,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eed654127b9-reveal","byte":0}}
```
