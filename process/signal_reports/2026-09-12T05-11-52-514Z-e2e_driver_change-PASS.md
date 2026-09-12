# Signal report — e2e_driver_change

Outcome: **PASS**
Summary: e2e_driver_change — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 75 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"7b9942fa8909"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"32e1e3e94c76","window_id":"7b9942fa8909","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"32e1e3e94c76","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":369,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"7ca606759c76","driver":"deterministic"}}
{"t":370,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"7ca606759c76","driver":"deterministic","context_tokens":null}}
{"t":370,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"93e10308b3e9","pane_id":"32e1e3e94c76","session_id":"31bf108f7a11","name":"session-31bf10","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-driver_change-ws-Bsd7IV","workspace_shape":"flat","bundle":"","seed":""}}
{"t":372,"kind":"SESSION_CREATED","payload":{"request_id":"93e10308b3e9","session_id":"31bf108f7a11","name":"session-31bf10","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-driver_change-ws-Bsd7IV","workspace_shape":"flat","status":"running"}}
{"t":372,"kind":"WORKSPACE_BOUND","payload":{"request_id":"93e10308b3e9","session_id":"31bf108f7a11","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-driver_change-ws-Bsd7IV","shape":"flat"}}
{"t":372,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"32e1e3e94c76","session_id":"31bf108f7a11","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-driver_change-ws-Bsd7IV","shape":"flat"}}
{"t":372,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"32e1e3e94c76","session_id":"31bf108f7a11"}}
{"t":381,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-status","byte":64}}
{"t":433,"kind":"DRIVER_DROPDOWN_OPENED","payload":{"pane_id":"32e1e3e94c76"}}
{"t":438,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-header-popover","byte":128}}
{"t":660,"kind":"DRIVER_PICKED","payload":{"pane_id":"32e1e3e94c76","from_driver":"deterministic","to_driver":"deterministic"}}
{"t":660,"kind":"DRIVER_DROPDOWN_CLOSED","payload":{"pane_id":"32e1e3e94c76"}}
{"t":660,"kind":"DRIVER_CHANGE_REQUESTED","payload":{"request_id":"3c42befd2ade","session_id":"31bf108f7a11","to_driver":"deterministic"}}
{"t":663,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-header-popover","byte":0}}
{"t":664,"kind":"DRIVER_CHANGED","payload":{"request_id":"3c42befd2ade","session_id":"31bf108f7a11","from_driver":"deterministic","to_driver":"deterministic"}}
{"t":1688,"kind":"DRIVER_DROPDOWN_OPENED","payload":{"pane_id":"32e1e3e94c76"}}
{"t":1690,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-header-popover","byte":128}}
{"t":1917,"kind":"DRIVER_PICKED","payload":{"pane_id":"32e1e3e94c76","from_driver":"deterministic","to_driver":"ollama:no-such-model-xyz"}}
{"t":1917,"kind":"DRIVER_DROPDOWN_CLOSED","payload":{"pane_id":"32e1e3e94c76"}}
{"t":1917,"kind":"DRIVER_CHANGE_REQUESTED","payload":{"request_id":"bd5a3387c61d","session_id":"31bf108f7a11","to_driver":"ollama:no-such-model-xyz"}}
{"t":1921,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-32e1e3e94c76-header-popover","byte":0}}
{"t":1939,"kind":"DRIVER_CHANGE_FAILED","payload":{"request_id":"bd5a3387c61d","session_id":"31bf108f7a11","reason":"driver_unavailable"}}
```
