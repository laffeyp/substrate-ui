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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"5b246861b8ea"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"0dfa8cbf2417","window_id":"5b246861b8ea","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"0dfa8cbf2417","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":361,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"f215b00a7a64","driver":"deterministic"}}
{"t":361,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"f215b00a7a64","driver":"deterministic","context_tokens":null}}
{"t":362,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"711e656261cd","pane_id":"0dfa8cbf2417","session_id":"715ba98e1104","name":"session-715ba9","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-vnqr15","workspace_shape":"flat","bundle":"","seed":""}}
{"t":363,"kind":"SESSION_CREATED","payload":{"request_id":"711e656261cd","session_id":"715ba98e1104","name":"session-715ba9","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-vnqr15","workspace_shape":"flat","status":"running"}}
{"t":363,"kind":"WORKSPACE_BOUND","payload":{"request_id":"711e656261cd","session_id":"715ba98e1104","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-vnqr15","shape":"flat"}}
{"t":363,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"0dfa8cbf2417","session_id":"715ba98e1104","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-vnqr15","shape":"flat"}}
{"t":363,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"0dfa8cbf2417","session_id":"715ba98e1104"}}
{"t":365,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-status","byte":64}}
{"t":383,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"0dfa8cbf2417","from":"terminal","to":"reveal"}}
{"t":388,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":128}}
{"t":641,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"0dfa8cbf2417","from":"reveal","to":"terminal"}}
{"t":648,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":0}}
{"t":867,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"0dfa8cbf2417","from":"terminal","to":"reveal"}}
{"t":873,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":128}}
{"t":884,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"0dfa8cbf2417","from":"reveal","to":"terminal"}}
{"t":890,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":0}}
{"t":899,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"0dfa8cbf2417","from":"terminal","to":"reveal"}}
{"t":907,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":128}}
{"t":916,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"0dfa8cbf2417","from":"reveal","to":"terminal"}}
{"t":923,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":0}}
{"t":932,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"0dfa8cbf2417","from":"terminal","to":"reveal"}}
{"t":939,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":128}}
{"t":948,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"0dfa8cbf2417","from":"reveal","to":"terminal"}}
{"t":955,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":0}}
{"t":965,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"0dfa8cbf2417","from":"terminal","to":"reveal"}}
{"t":971,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":128}}
{"t":982,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"0dfa8cbf2417","from":"reveal","to":"terminal"}}
{"t":988,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":0}}
{"t":998,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"0dfa8cbf2417","from":"terminal","to":"reveal"}}
{"t":1005,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":128}}
{"t":1015,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"0dfa8cbf2417","from":"reveal","to":"terminal"}}
{"t":1021,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0dfa8cbf2417-reveal","byte":0}}
```
