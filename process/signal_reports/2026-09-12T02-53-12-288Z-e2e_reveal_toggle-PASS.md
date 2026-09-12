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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"a0e4d0bd8d71"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"9cf124b0e463","window_id":"a0e4d0bd8d71","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"9cf124b0e463","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-focus","byte":255}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-status","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-lens","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-level","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-dir","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-descent","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-surface","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-find","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-inspect","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-header-popover","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-header-popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":26,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":364,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"283cd01772b4","driver":"deterministic"}}
{"t":369,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"283cd01772b4","driver":"deterministic","context_tokens":null}}
{"t":369,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"4fbe6b92c184","pane_id":"9cf124b0e463","session_id":"40dd1e71f7e5","name":"session-40dd1e","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-SXgXh4","workspace_shape":"flat","bundle":"","seed":""}}
{"t":370,"kind":"SESSION_CREATED","payload":{"request_id":"4fbe6b92c184","session_id":"40dd1e71f7e5","name":"session-40dd1e","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-SXgXh4","workspace_shape":"flat","status":"running"}}
{"t":370,"kind":"WORKSPACE_BOUND","payload":{"request_id":"4fbe6b92c184","session_id":"40dd1e71f7e5","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-SXgXh4","shape":"flat"}}
{"t":370,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"9cf124b0e463","session_id":"40dd1e71f7e5","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-SXgXh4","shape":"flat"}}
{"t":370,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"9cf124b0e463","session_id":"40dd1e71f7e5"}}
{"t":377,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-status","byte":64}}
{"t":438,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9cf124b0e463","from":"terminal","to":"reveal"}}
{"t":444,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":128}}
{"t":722,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9cf124b0e463","from":"reveal","to":"terminal"}}
{"t":727,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":0}}
{"t":952,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9cf124b0e463","from":"terminal","to":"reveal"}}
{"t":954,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":128}}
{"t":972,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9cf124b0e463","from":"reveal","to":"terminal"}}
{"t":978,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":0}}
{"t":988,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9cf124b0e463","from":"terminal","to":"reveal"}}
{"t":993,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":128}}
{"t":1004,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9cf124b0e463","from":"reveal","to":"terminal"}}
{"t":1010,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":0}}
{"t":1021,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9cf124b0e463","from":"terminal","to":"reveal"}}
{"t":1027,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":128}}
{"t":1038,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9cf124b0e463","from":"reveal","to":"terminal"}}
{"t":1044,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":0}}
{"t":1054,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9cf124b0e463","from":"terminal","to":"reveal"}}
{"t":1060,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":128}}
{"t":1070,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9cf124b0e463","from":"reveal","to":"terminal"}}
{"t":1077,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":0}}
{"t":1087,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9cf124b0e463","from":"terminal","to":"reveal"}}
{"t":1093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":128}}
{"t":1104,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9cf124b0e463","from":"reveal","to":"terminal"}}
{"t":1110,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cf124b0e463-reveal","byte":0}}
```
