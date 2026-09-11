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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"16ba26b5eab0"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"7c8c91cbb80b","window_id":"16ba26b5eab0","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"7c8c91cbb80b","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-header_popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-header_popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-header_popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":28,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":363,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"76b073c267a4","driver":"deterministic"}}
{"t":368,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"76b073c267a4","driver":"deterministic","context_tokens":null}}
{"t":368,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"10a3e80fb374","pane_id":"7c8c91cbb80b","session_id":"d0f2859e235d","name":"session-d0f285","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-fxjk4h","workspace_shape":"flat","bundle":"","seed":""}}
{"t":369,"kind":"SESSION_CREATED","payload":{"request_id":"10a3e80fb374","session_id":"d0f2859e235d","name":"session-d0f285","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-fxjk4h","workspace_shape":"flat","status":"running"}}
{"t":369,"kind":"WORKSPACE_BOUND","payload":{"request_id":"10a3e80fb374","session_id":"d0f2859e235d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-fxjk4h","shape":"flat"}}
{"t":369,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"7c8c91cbb80b","session_id":"d0f2859e235d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-fxjk4h","shape":"flat"}}
{"t":369,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"7c8c91cbb80b","session_id":"d0f2859e235d"}}
{"t":371,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-status","byte":64}}
{"t":431,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7c8c91cbb80b","from":"terminal","to":"reveal"}}
{"t":436,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-reveal","byte":128}}
{"t":652,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"7c8c91cbb80b","from":"transcript","to":"stream"}}
{"t":811,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"7c8c91cbb80b","from":"stream","to":"transcript"}}
{"t":970,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"7c8c91cbb80b","from":"transcript","to":"stream"}}
{"t":975,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"7c8c91cbb80b","from":"stream","to":"transcript"}}
{"t":1131,"kind":"PANE_SPLIT","payload":{"from_pane_id":"7c8c91cbb80b","new_pane_id":"66b246832652","axis":"row"}}
{"t":1131,"kind":"PANE_CREATED","payload":{"pane_id":"66b246832652","window_id":"16ba26b5eab0","session_id":null,"from_split":"e31e22eea5e2"}}
{"t":1131,"kind":"PANE_FOCUSED","payload":{"pane_id":"66b246832652","prior_pane_id":"7c8c91cbb80b"}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-focus","byte":128}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-status","byte":64}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-reveal","byte":128}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-lens","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-level","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-dir","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-descent","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-surface","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-find","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-inspect","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-header_popover","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-focus","byte":255}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-status","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-reveal","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-lens","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-level","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-dir","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-descent","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-surface","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-find","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-inspect","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-header_popover","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-focus","byte":128}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-status","byte":64}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-reveal","byte":128}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-lens","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-level","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-dir","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-descent","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-surface","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-find","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-inspect","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-header_popover","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-focus","byte":255}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-status","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-reveal","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-lens","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-level","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-dir","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-descent","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-surface","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-find","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-inspect","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-header_popover","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-focus","byte":128}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-status","byte":64}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-reveal","byte":128}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-lens","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-level","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-dir","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-descent","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-surface","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-find","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-inspect","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7c8c91cbb80b-header_popover","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-focus","byte":255}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-status","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-reveal","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-lens","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-level","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-dir","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-descent","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-surface","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-find","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-inspect","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-header_popover","byte":0}}
{"t":1473,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"c51a1c32d88f","driver":"deterministic"}}
{"t":1474,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"c51a1c32d88f","driver":"deterministic","context_tokens":null}}
{"t":1474,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"95ce9c6f41f2","pane_id":"66b246832652","session_id":"9d263307f1ac","name":"session-9d2633","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-LRRu19","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1476,"kind":"SESSION_CREATED","payload":{"request_id":"95ce9c6f41f2","session_id":"9d263307f1ac","name":"session-9d2633","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-LRRu19","workspace_shape":"flat","status":"running"}}
{"t":1476,"kind":"WORKSPACE_BOUND","payload":{"request_id":"95ce9c6f41f2","session_id":"9d263307f1ac","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-LRRu19","shape":"flat"}}
{"t":1476,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"66b246832652","session_id":"9d263307f1ac","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-LRRu19","shape":"flat"}}
{"t":1476,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"66b246832652","session_id":"9d263307f1ac"}}
{"t":1479,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-status","byte":64}}
{"t":1498,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"66b246832652","from":"terminal","to":"reveal"}}
{"t":1503,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-66b246832652-reveal","byte":128}}
{"t":1808,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"66b246832652","from":"transcript","to":"stream"}}
```
