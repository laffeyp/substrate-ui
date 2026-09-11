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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"7cf33e27f999"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"7d941a299d32","window_id":"7cf33e27f999","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"7d941a299d32","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-header_popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":23,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":369,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"05ffdc0e3df0","driver":"deterministic"}}
{"t":371,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"05ffdc0e3df0","driver":"deterministic","context_tokens":null}}
{"t":371,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"8432cd67aad4","pane_id":"7d941a299d32","session_id":"f4598af39ba3","name":"session-f4598a","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-NorQkr","workspace_shape":"flat","bundle":"","seed":""}}
{"t":373,"kind":"SESSION_CREATED","payload":{"request_id":"8432cd67aad4","session_id":"f4598af39ba3","name":"session-f4598a","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-NorQkr","workspace_shape":"flat","status":"running"}}
{"t":373,"kind":"WORKSPACE_BOUND","payload":{"request_id":"8432cd67aad4","session_id":"f4598af39ba3","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-NorQkr","shape":"flat"}}
{"t":373,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"7d941a299d32","session_id":"f4598af39ba3","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-NorQkr","shape":"flat"}}
{"t":373,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"7d941a299d32","session_id":"f4598af39ba3"}}
{"t":375,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-status","byte":64}}
{"t":435,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d941a299d32","from":"terminal","to":"reveal"}}
{"t":440,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":128}}
{"t":709,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d941a299d32","from":"reveal","to":"terminal"}}
{"t":715,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":0}}
{"t":936,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d941a299d32","from":"terminal","to":"reveal"}}
{"t":940,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":128}}
{"t":961,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d941a299d32","from":"reveal","to":"terminal"}}
{"t":966,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":0}}
{"t":986,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d941a299d32","from":"terminal","to":"reveal"}}
{"t":990,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":128}}
{"t":1011,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d941a299d32","from":"reveal","to":"terminal"}}
{"t":1015,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":0}}
{"t":1035,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d941a299d32","from":"terminal","to":"reveal"}}
{"t":1040,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":128}}
{"t":1050,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d941a299d32","from":"reveal","to":"terminal"}}
{"t":1056,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":0}}
{"t":1067,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d941a299d32","from":"terminal","to":"reveal"}}
{"t":1073,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":128}}
{"t":1083,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d941a299d32","from":"reveal","to":"terminal"}}
{"t":1090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":0}}
{"t":1100,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d941a299d32","from":"terminal","to":"reveal"}}
{"t":1106,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":128}}
{"t":1116,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7d941a299d32","from":"reveal","to":"terminal"}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7d941a299d32-reveal","byte":0}}
```
