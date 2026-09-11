# Signal report — e2e_reveal_focus

Outcome: **PASS**
Summary: e2e_reveal_focus — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 147 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"a39e7704cfc7"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"801d3d431cc2","window_id":"a39e7704cfc7","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"801d3d431cc2","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":363,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"a2e99bfe4dd4","driver":"deterministic"}}
{"t":364,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"a2e99bfe4dd4","driver":"deterministic","context_tokens":null}}
{"t":364,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"7332744c8fc5","pane_id":"801d3d431cc2","session_id":"7273f30a8430","name":"session-7273f3","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-balaVH","workspace_shape":"flat","bundle":"","seed":""}}
{"t":365,"kind":"SESSION_CREATED","payload":{"request_id":"7332744c8fc5","session_id":"7273f30a8430","name":"session-7273f3","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-balaVH","workspace_shape":"flat","status":"running"}}
{"t":365,"kind":"WORKSPACE_BOUND","payload":{"request_id":"7332744c8fc5","session_id":"7273f30a8430","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-balaVH","shape":"flat"}}
{"t":365,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"801d3d431cc2","session_id":"7273f30a8430","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-balaVH","shape":"flat"}}
{"t":365,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"801d3d431cc2","session_id":"7273f30a8430"}}
{"t":373,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-status","byte":64}}
{"t":384,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"801d3d431cc2","from":"terminal","to":"reveal"}}
{"t":389,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-reveal","byte":128}}
{"t":602,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"801d3d431cc2","from":"transcript","to":"stream"}}
{"t":761,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"801d3d431cc2","from":"stream","to":"transcript"}}
{"t":919,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"801d3d431cc2","from":"transcript","to":"stream"}}
{"t":921,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"801d3d431cc2","from":"stream","to":"transcript"}}
{"t":1078,"kind":"PANE_SPLIT","payload":{"from_pane_id":"801d3d431cc2","new_pane_id":"2706c85b910a","axis":"row"}}
{"t":1078,"kind":"PANE_CREATED","payload":{"pane_id":"2706c85b910a","window_id":"a39e7704cfc7","session_id":null,"from_split":"2dafd871fa57"}}
{"t":1078,"kind":"PANE_FOCUSED","payload":{"pane_id":"2706c85b910a","prior_pane_id":"801d3d431cc2"}}
{"t":1083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-focus","byte":128}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-status","byte":64}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-reveal","byte":128}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-lens","byte":0}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-level","byte":0}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-dir","byte":0}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-descent","byte":0}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-surface","byte":0}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-find","byte":0}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-inspect","byte":0}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-header-popover","byte":0}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-focus","byte":255}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-status","byte":0}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-reveal","byte":0}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-lens","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-level","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-dir","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-descent","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-surface","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-find","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-inspect","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-header-popover","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-focus","byte":128}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-status","byte":64}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-reveal","byte":128}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-lens","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-level","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-dir","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-descent","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-surface","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-find","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-inspect","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-header-popover","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-focus","byte":255}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-status","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-reveal","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-lens","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-level","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-dir","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-descent","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-surface","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-find","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-inspect","byte":0}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-header-popover","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-focus","byte":128}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-status","byte":64}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-reveal","byte":128}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-lens","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-level","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-dir","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-descent","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-surface","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-find","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-inspect","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-801d3d431cc2-header-popover","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-focus","byte":255}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-status","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-reveal","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-lens","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-level","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-dir","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-descent","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-surface","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-find","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-inspect","byte":0}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-header-popover","byte":0}}
{"t":1415,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"c44821c0feb1","driver":"deterministic"}}
{"t":1416,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"c44821c0feb1","driver":"deterministic","context_tokens":null}}
{"t":1416,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"c16f3c2313b6","pane_id":"2706c85b910a","session_id":"85639ae2917e","name":"session-85639a","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-A9DRTu","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1417,"kind":"SESSION_CREATED","payload":{"request_id":"c16f3c2313b6","session_id":"85639ae2917e","name":"session-85639a","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-A9DRTu","workspace_shape":"flat","status":"running"}}
{"t":1417,"kind":"WORKSPACE_BOUND","payload":{"request_id":"c16f3c2313b6","session_id":"85639ae2917e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-A9DRTu","shape":"flat"}}
{"t":1417,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"2706c85b910a","session_id":"85639ae2917e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-A9DRTu","shape":"flat"}}
{"t":1417,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"2706c85b910a","session_id":"85639ae2917e"}}
{"t":1421,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-status","byte":64}}
{"t":1433,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2706c85b910a","from":"terminal","to":"reveal"}}
{"t":1440,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2706c85b910a-reveal","byte":128}}
{"t":1745,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"2706c85b910a","from":"transcript","to":"stream"}}
```
