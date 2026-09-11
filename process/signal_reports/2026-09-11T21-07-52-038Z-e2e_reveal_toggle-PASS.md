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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"3b22b50f75dc"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"5e922dc136bb","window_id":"3b22b50f75dc","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"5e922dc136bb","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":23,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":357,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"fa84fe79d163","driver":"deterministic"}}
{"t":358,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"fa84fe79d163","driver":"deterministic","context_tokens":null}}
{"t":358,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"21d29ca769af","pane_id":"5e922dc136bb","session_id":"c4f8bda078a4","name":"session-c4f8bd","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-PjkH9S","workspace_shape":"flat","bundle":"","seed":""}}
{"t":360,"kind":"SESSION_CREATED","payload":{"request_id":"21d29ca769af","session_id":"c4f8bda078a4","name":"session-c4f8bd","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-PjkH9S","workspace_shape":"flat","status":"running"}}
{"t":360,"kind":"WORKSPACE_BOUND","payload":{"request_id":"21d29ca769af","session_id":"c4f8bda078a4","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-PjkH9S","shape":"flat"}}
{"t":360,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"5e922dc136bb","session_id":"c4f8bda078a4","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-PjkH9S","shape":"flat"}}
{"t":360,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"5e922dc136bb","session_id":"c4f8bda078a4"}}
{"t":366,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-status","byte":64}}
{"t":426,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"5e922dc136bb","from":"terminal","to":"reveal"}}
{"t":431,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":128}}
{"t":684,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"5e922dc136bb","from":"reveal","to":"terminal"}}
{"t":690,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":0}}
{"t":901,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"5e922dc136bb","from":"terminal","to":"reveal"}}
{"t":906,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":128}}
{"t":917,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"5e922dc136bb","from":"reveal","to":"terminal"}}
{"t":923,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":0}}
{"t":933,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"5e922dc136bb","from":"terminal","to":"reveal"}}
{"t":940,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":128}}
{"t":950,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"5e922dc136bb","from":"reveal","to":"terminal"}}
{"t":956,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":0}}
{"t":967,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"5e922dc136bb","from":"terminal","to":"reveal"}}
{"t":973,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":128}}
{"t":983,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"5e922dc136bb","from":"reveal","to":"terminal"}}
{"t":990,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":0}}
{"t":1000,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"5e922dc136bb","from":"terminal","to":"reveal"}}
{"t":1006,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":128}}
{"t":1016,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"5e922dc136bb","from":"reveal","to":"terminal"}}
{"t":1023,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":0}}
{"t":1033,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"5e922dc136bb","from":"terminal","to":"reveal"}}
{"t":1040,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":128}}
{"t":1050,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"5e922dc136bb","from":"reveal","to":"terminal"}}
{"t":1056,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e922dc136bb-reveal","byte":0}}
```
