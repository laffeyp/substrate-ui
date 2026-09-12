# Signal report — e2e_probe_driver

Outcome: **PASS**
Summary: e2e_probe_driver — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 61 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"57f1452a49ec"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"07c6a4870afc","window_id":"57f1452a49ec","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"07c6a4870afc","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":23,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":357,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"4821a69b1a9e","driver":"deterministic"}}
{"t":358,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"4821a69b1a9e","driver":"deterministic","context_tokens":null}}
{"t":358,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"4f81d56baaf9","pane_id":"07c6a4870afc","session_id":"3c81439c4985","name":"session-3c8143","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-probe-ws-uLTRkh","workspace_shape":"flat","bundle":"","seed":""}}
{"t":359,"kind":"SESSION_CREATED","payload":{"request_id":"4f81d56baaf9","session_id":"3c81439c4985","name":"session-3c8143","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-probe-ws-uLTRkh","workspace_shape":"flat","status":"running"}}
{"t":359,"kind":"WORKSPACE_BOUND","payload":{"request_id":"4f81d56baaf9","session_id":"3c81439c4985","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-probe-ws-uLTRkh","shape":"flat"}}
{"t":359,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"07c6a4870afc","session_id":"3c81439c4985","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-probe-ws-uLTRkh","shape":"flat"}}
{"t":359,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"07c6a4870afc","session_id":"3c81439c4985"}}
{"t":366,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-07c6a4870afc-status","byte":64}}
```
