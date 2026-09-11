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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"1ea345affe2e"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"7348b24d531d","window_id":"1ea345affe2e","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"7348b24d531d","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":23,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":355,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"8b19452721a3","driver":"deterministic"}}
{"t":356,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"8b19452721a3","driver":"deterministic","context_tokens":null}}
{"t":356,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"9cd01beba6ff","pane_id":"7348b24d531d","session_id":"c3337ddc8b3c","name":"session-c3337d","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-IKteQX","workspace_shape":"flat","bundle":"","seed":""}}
{"t":357,"kind":"SESSION_CREATED","payload":{"request_id":"9cd01beba6ff","session_id":"c3337ddc8b3c","name":"session-c3337d","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-IKteQX","workspace_shape":"flat","status":"running"}}
{"t":357,"kind":"WORKSPACE_BOUND","payload":{"request_id":"9cd01beba6ff","session_id":"c3337ddc8b3c","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-IKteQX","shape":"flat"}}
{"t":357,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"7348b24d531d","session_id":"c3337ddc8b3c","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-IKteQX","shape":"flat"}}
{"t":357,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"7348b24d531d","session_id":"c3337ddc8b3c"}}
{"t":365,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-status","byte":64}}
{"t":418,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"7348b24d531d","from":"terminal","to":"reveal"}}
{"t":423,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-reveal","byte":128}}
{"t":637,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"7348b24d531d","from":"transcript","to":"stream"}}
{"t":796,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"7348b24d531d","from":"stream","to":"transcript"}}
{"t":955,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"7348b24d531d","from":"transcript","to":"stream"}}
{"t":958,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"7348b24d531d","from":"stream","to":"transcript"}}
{"t":1116,"kind":"PANE_SPLIT","payload":{"from_pane_id":"7348b24d531d","new_pane_id":"9192aea15d58","axis":"row"}}
{"t":1116,"kind":"PANE_CREATED","payload":{"pane_id":"9192aea15d58","window_id":"1ea345affe2e","session_id":null,"from_split":"58da61074f18"}}
{"t":1116,"kind":"PANE_FOCUSED","payload":{"pane_id":"9192aea15d58","prior_pane_id":"7348b24d531d"}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-focus","byte":128}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-status","byte":64}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-reveal","byte":128}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-lens","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-level","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-dir","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-descent","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-surface","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-find","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-inspect","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-header_popover","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-focus","byte":255}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-status","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-reveal","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-lens","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-level","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-dir","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-descent","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-surface","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-find","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-inspect","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-header_popover","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-focus","byte":128}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-status","byte":64}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-reveal","byte":128}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-lens","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-level","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-dir","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-descent","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-surface","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-find","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-inspect","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-header_popover","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-focus","byte":255}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-status","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-reveal","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-lens","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-level","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-dir","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-descent","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-surface","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-find","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-inspect","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-header_popover","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-focus","byte":128}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-status","byte":64}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-reveal","byte":128}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-lens","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-level","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-dir","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-descent","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-surface","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-find","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-inspect","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7348b24d531d-header_popover","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-focus","byte":255}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-status","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-reveal","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-lens","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-level","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-dir","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-descent","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-surface","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-find","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-inspect","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-header_popover","byte":0}}
{"t":1459,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"bf054279e6fd","driver":"deterministic"}}
{"t":1460,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"bf054279e6fd","driver":"deterministic","context_tokens":null}}
{"t":1460,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"154742ee0159","pane_id":"9192aea15d58","session_id":"0600e6be5429","name":"session-0600e6","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-YE96LB","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1463,"kind":"SESSION_CREATED","payload":{"request_id":"154742ee0159","session_id":"0600e6be5429","name":"session-0600e6","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-YE96LB","workspace_shape":"flat","status":"running"}}
{"t":1463,"kind":"WORKSPACE_BOUND","payload":{"request_id":"154742ee0159","session_id":"0600e6be5429","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-YE96LB","shape":"flat"}}
{"t":1463,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"9192aea15d58","session_id":"0600e6be5429","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-YE96LB","shape":"flat"}}
{"t":1463,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"9192aea15d58","session_id":"0600e6be5429"}}
{"t":1465,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-status","byte":64}}
{"t":1484,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9192aea15d58","from":"terminal","to":"reveal"}}
{"t":1489,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9192aea15d58-reveal","byte":128}}
{"t":1796,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"9192aea15d58","from":"transcript","to":"stream"}}
```
