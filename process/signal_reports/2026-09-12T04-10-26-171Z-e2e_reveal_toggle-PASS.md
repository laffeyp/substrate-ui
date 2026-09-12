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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"acd44c6316d1"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"e574da50b805","window_id":"acd44c6316d1","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"e574da50b805","prior_pane_id":null}}
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
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-focus","byte":255}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-status","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-header-popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":367,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"69fe4d4fa36a","driver":"deterministic"}}
{"t":368,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"69fe4d4fa36a","driver":"deterministic","context_tokens":null}}
{"t":368,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"a309c657292e","pane_id":"e574da50b805","session_id":"0b0896649d58","name":"session-0b0896","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-sqzbVc","workspace_shape":"flat","bundle":"","seed":""}}
{"t":369,"kind":"SESSION_CREATED","payload":{"request_id":"a309c657292e","session_id":"0b0896649d58","name":"session-0b0896","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-sqzbVc","workspace_shape":"flat","status":"running"}}
{"t":369,"kind":"WORKSPACE_BOUND","payload":{"request_id":"a309c657292e","session_id":"0b0896649d58","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-sqzbVc","shape":"flat"}}
{"t":369,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"e574da50b805","session_id":"0b0896649d58","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-sqzbVc","shape":"flat"}}
{"t":369,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"e574da50b805","session_id":"0b0896649d58"}}
{"t":372,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-status","byte":64}}
{"t":433,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e574da50b805","from":"terminal","to":"reveal"}}
{"t":438,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":128}}
{"t":702,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e574da50b805","from":"reveal","to":"terminal"}}
{"t":706,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":0}}
{"t":928,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e574da50b805","from":"terminal","to":"reveal"}}
{"t":930,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":128}}
{"t":950,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e574da50b805","from":"reveal","to":"terminal"}}
{"t":956,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":0}}
{"t":966,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e574da50b805","from":"terminal","to":"reveal"}}
{"t":972,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":128}}
{"t":984,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e574da50b805","from":"reveal","to":"terminal"}}
{"t":989,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":0}}
{"t":999,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e574da50b805","from":"terminal","to":"reveal"}}
{"t":1006,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":128}}
{"t":1015,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e574da50b805","from":"reveal","to":"terminal"}}
{"t":1022,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":0}}
{"t":1032,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e574da50b805","from":"terminal","to":"reveal"}}
{"t":1038,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":128}}
{"t":1049,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e574da50b805","from":"reveal","to":"terminal"}}
{"t":1055,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":0}}
{"t":1065,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e574da50b805","from":"terminal","to":"reveal"}}
{"t":1072,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":128}}
{"t":1082,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"e574da50b805","from":"reveal","to":"terminal"}}
{"t":1088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e574da50b805-reveal","byte":0}}
```
