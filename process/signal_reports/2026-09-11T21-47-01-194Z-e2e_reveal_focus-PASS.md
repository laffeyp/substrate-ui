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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"846f879b1942"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"19546982c84a","window_id":"846f879b1942","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"19546982c84a","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":31,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":369,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"10999e400a4b","driver":"deterministic"}}
{"t":372,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"10999e400a4b","driver":"deterministic","context_tokens":null}}
{"t":372,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"8de73f2132df","pane_id":"19546982c84a","session_id":"174e03654444","name":"session-174e03","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-dIymLz","workspace_shape":"flat","bundle":"","seed":""}}
{"t":373,"kind":"SESSION_CREATED","payload":{"request_id":"8de73f2132df","session_id":"174e03654444","name":"session-174e03","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-dIymLz","workspace_shape":"flat","status":"running"}}
{"t":373,"kind":"WORKSPACE_BOUND","payload":{"request_id":"8de73f2132df","session_id":"174e03654444","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-dIymLz","shape":"flat"}}
{"t":373,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"19546982c84a","session_id":"174e03654444","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-dIymLz","shape":"flat"}}
{"t":373,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"19546982c84a","session_id":"174e03654444"}}
{"t":378,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-status","byte":64}}
{"t":439,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"19546982c84a","from":"terminal","to":"reveal"}}
{"t":446,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-reveal","byte":128}}
{"t":658,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"19546982c84a","from":"transcript","to":"stream"}}
{"t":820,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"19546982c84a","from":"stream","to":"transcript"}}
{"t":981,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"19546982c84a","from":"transcript","to":"stream"}}
{"t":986,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"19546982c84a","from":"stream","to":"transcript"}}
{"t":1142,"kind":"PANE_SPLIT","payload":{"from_pane_id":"19546982c84a","new_pane_id":"9116c00d85ae","axis":"row"}}
{"t":1142,"kind":"PANE_CREATED","payload":{"pane_id":"9116c00d85ae","window_id":"846f879b1942","session_id":null,"from_split":"f5c8c4c5cd0a"}}
{"t":1142,"kind":"PANE_FOCUSED","payload":{"pane_id":"9116c00d85ae","prior_pane_id":"19546982c84a"}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-focus","byte":128}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-status","byte":64}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-reveal","byte":128}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-lens","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-level","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-dir","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-descent","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-surface","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-find","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-inspect","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-header-popover","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-focus","byte":255}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-status","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-reveal","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-lens","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-level","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-dir","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-descent","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-surface","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-find","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-inspect","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-header-popover","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-focus","byte":128}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-status","byte":64}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-reveal","byte":128}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-lens","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-level","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-dir","byte":0}}
{"t":1145,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-descent","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-surface","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-find","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-inspect","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-header-popover","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-focus","byte":255}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-status","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-reveal","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-lens","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-level","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-dir","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-descent","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-surface","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-find","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-inspect","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-header-popover","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-focus","byte":128}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-status","byte":64}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-reveal","byte":128}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-lens","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-level","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-dir","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-descent","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-surface","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-find","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-inspect","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-19546982c84a-header-popover","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-focus","byte":255}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-status","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-reveal","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-lens","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-level","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-dir","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-descent","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-surface","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-find","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-inspect","byte":0}}
{"t":1146,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-header-popover","byte":0}}
{"t":1478,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"9c8261ede6d2","driver":"deterministic"}}
{"t":1480,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"9c8261ede6d2","driver":"deterministic","context_tokens":null}}
{"t":1480,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"71c7fb76f083","pane_id":"9116c00d85ae","session_id":"982a7367eb6a","name":"session-982a73","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-7kZN66","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1482,"kind":"SESSION_CREATED","payload":{"request_id":"71c7fb76f083","session_id":"982a7367eb6a","name":"session-982a73","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-7kZN66","workspace_shape":"flat","status":"running"}}
{"t":1482,"kind":"WORKSPACE_BOUND","payload":{"request_id":"71c7fb76f083","session_id":"982a7367eb6a","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-7kZN66","shape":"flat"}}
{"t":1482,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"9116c00d85ae","session_id":"982a7367eb6a","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-7kZN66","shape":"flat"}}
{"t":1482,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"9116c00d85ae","session_id":"982a7367eb6a"}}
{"t":1486,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-status","byte":64}}
{"t":1506,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9116c00d85ae","from":"terminal","to":"reveal"}}
{"t":1511,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9116c00d85ae-reveal","byte":128}}
{"t":1819,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"9116c00d85ae","from":"transcript","to":"stream"}}
```
