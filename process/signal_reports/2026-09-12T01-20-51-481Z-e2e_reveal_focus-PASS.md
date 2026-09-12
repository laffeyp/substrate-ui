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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"48a211c6a37d"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"809634d2c332","window_id":"48a211c6a37d","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"809634d2c332","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":23,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":357,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"99a177c1027a","driver":"deterministic"}}
{"t":360,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"99a177c1027a","driver":"deterministic","context_tokens":null}}
{"t":360,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"0bf0018b3820","pane_id":"809634d2c332","session_id":"570be8c12b86","name":"session-570be8","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-XGk8EZ","workspace_shape":"flat","bundle":"","seed":""}}
{"t":361,"kind":"SESSION_CREATED","payload":{"request_id":"0bf0018b3820","session_id":"570be8c12b86","name":"session-570be8","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-XGk8EZ","workspace_shape":"flat","status":"running"}}
{"t":361,"kind":"WORKSPACE_BOUND","payload":{"request_id":"0bf0018b3820","session_id":"570be8c12b86","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-XGk8EZ","shape":"flat"}}
{"t":361,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"809634d2c332","session_id":"570be8c12b86","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-XGk8EZ","shape":"flat"}}
{"t":361,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"809634d2c332","session_id":"570be8c12b86"}}
{"t":365,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-status","byte":64}}
{"t":417,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"809634d2c332","from":"terminal","to":"reveal"}}
{"t":423,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-reveal","byte":128}}
{"t":633,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"809634d2c332","from":"transcript","to":"stream"}}
{"t":793,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"809634d2c332","from":"stream","to":"transcript"}}
{"t":952,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"809634d2c332","from":"transcript","to":"stream"}}
{"t":957,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"809634d2c332","from":"stream","to":"transcript"}}
{"t":1114,"kind":"PANE_SPLIT","payload":{"from_pane_id":"809634d2c332","new_pane_id":"2a447821bcf9","axis":"row"}}
{"t":1114,"kind":"PANE_CREATED","payload":{"pane_id":"2a447821bcf9","window_id":"48a211c6a37d","session_id":null,"from_split":"2e197deb4169"}}
{"t":1114,"kind":"PANE_FOCUSED","payload":{"pane_id":"2a447821bcf9","prior_pane_id":"809634d2c332"}}
{"t":1120,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-focus","byte":128}}
{"t":1120,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-status","byte":64}}
{"t":1120,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-reveal","byte":128}}
{"t":1120,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-lens","byte":0}}
{"t":1120,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-level","byte":0}}
{"t":1120,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-dir","byte":0}}
{"t":1120,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-descent","byte":0}}
{"t":1120,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-surface","byte":0}}
{"t":1120,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-find","byte":0}}
{"t":1120,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-inspect","byte":0}}
{"t":1120,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-header-popover","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-focus","byte":255}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-status","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-reveal","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-lens","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-level","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-dir","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-descent","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-surface","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-find","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-inspect","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-header-popover","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-focus","byte":128}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-status","byte":64}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-reveal","byte":128}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-lens","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-level","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-dir","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-descent","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-surface","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-find","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-inspect","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-header-popover","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-focus","byte":255}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-status","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-reveal","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-lens","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-level","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-dir","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-descent","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-surface","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-find","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-inspect","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-header-popover","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-focus","byte":128}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-status","byte":64}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-reveal","byte":128}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-lens","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-level","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-dir","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-descent","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-surface","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-find","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-inspect","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-809634d2c332-header-popover","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-focus","byte":255}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-status","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-reveal","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-lens","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-level","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-dir","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-descent","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-surface","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-find","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-inspect","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-header-popover","byte":0}}
{"t":1448,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"965ddc425d08","driver":"deterministic"}}
{"t":1449,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"965ddc425d08","driver":"deterministic","context_tokens":null}}
{"t":1450,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"d9d70d323b18","pane_id":"2a447821bcf9","session_id":"1e0cc40e9330","name":"session-1e0cc4","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-e0BoyA","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1451,"kind":"SESSION_CREATED","payload":{"request_id":"d9d70d323b18","session_id":"1e0cc40e9330","name":"session-1e0cc4","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-e0BoyA","workspace_shape":"flat","status":"running"}}
{"t":1451,"kind":"WORKSPACE_BOUND","payload":{"request_id":"d9d70d323b18","session_id":"1e0cc40e9330","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-e0BoyA","shape":"flat"}}
{"t":1451,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"2a447821bcf9","session_id":"1e0cc40e9330","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-e0BoyA","shape":"flat"}}
{"t":1451,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"2a447821bcf9","session_id":"1e0cc40e9330"}}
{"t":1457,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-status","byte":64}}
{"t":1492,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2a447821bcf9","from":"terminal","to":"reveal"}}
{"t":1498,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2a447821bcf9-reveal","byte":128}}
{"t":1805,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"2a447821bcf9","from":"transcript","to":"stream"}}
```
