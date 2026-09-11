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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"249228d22192"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"00d15fab273c","window_id":"249228d22192","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"00d15fab273c","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-header_popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":26,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":369,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"5e44b911e5a5","driver":"deterministic"}}
{"t":370,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"5e44b911e5a5","driver":"deterministic","context_tokens":null}}
{"t":370,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"4c7ed84e76ad","pane_id":"00d15fab273c","session_id":"3a1d2f611308","name":"session-3a1d2f","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-a4vnML","workspace_shape":"flat","bundle":"","seed":""}}
{"t":371,"kind":"SESSION_CREATED","payload":{"request_id":"4c7ed84e76ad","session_id":"3a1d2f611308","name":"session-3a1d2f","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-a4vnML","workspace_shape":"flat","status":"running"}}
{"t":371,"kind":"WORKSPACE_BOUND","payload":{"request_id":"4c7ed84e76ad","session_id":"3a1d2f611308","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-a4vnML","shape":"flat"}}
{"t":371,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"00d15fab273c","session_id":"3a1d2f611308","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-a4vnML","shape":"flat"}}
{"t":371,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"00d15fab273c","session_id":"3a1d2f611308"}}
{"t":378,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-status","byte":64}}
{"t":440,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"00d15fab273c","from":"terminal","to":"reveal"}}
{"t":444,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":128}}
{"t":714,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"00d15fab273c","from":"reveal","to":"terminal"}}
{"t":719,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":0}}
{"t":939,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"00d15fab273c","from":"terminal","to":"reveal"}}
{"t":944,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":128}}
{"t":966,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"00d15fab273c","from":"reveal","to":"terminal"}}
{"t":968,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":0}}
{"t":989,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"00d15fab273c","from":"terminal","to":"reveal"}}
{"t":995,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":128}}
{"t":1005,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"00d15fab273c","from":"reveal","to":"terminal"}}
{"t":1011,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":0}}
{"t":1021,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"00d15fab273c","from":"terminal","to":"reveal"}}
{"t":1028,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":128}}
{"t":1038,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"00d15fab273c","from":"reveal","to":"terminal"}}
{"t":1044,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":0}}
{"t":1054,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"00d15fab273c","from":"terminal","to":"reveal"}}
{"t":1061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":128}}
{"t":1071,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"00d15fab273c","from":"reveal","to":"terminal"}}
{"t":1077,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":0}}
{"t":1087,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"00d15fab273c","from":"terminal","to":"reveal"}}
{"t":1094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":128}}
{"t":1104,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"00d15fab273c","from":"reveal","to":"terminal"}}
{"t":1111,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00d15fab273c-reveal","byte":0}}
```
