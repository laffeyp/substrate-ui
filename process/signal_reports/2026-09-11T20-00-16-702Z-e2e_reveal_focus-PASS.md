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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"9f4193ad3010"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"2c982945e469","window_id":"9f4193ad3010","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"2c982945e469","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":23,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":356,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"40b485781542","driver":"deterministic"}}
{"t":357,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"40b485781542","driver":"deterministic","context_tokens":null}}
{"t":357,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"68fbc32fefa6","pane_id":"2c982945e469","session_id":"4ab3fa9954cf","name":"session-4ab3fa","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-NYJgkz","workspace_shape":"flat","bundle":"","seed":""}}
{"t":358,"kind":"SESSION_CREATED","payload":{"request_id":"68fbc32fefa6","session_id":"4ab3fa9954cf","name":"session-4ab3fa","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-NYJgkz","workspace_shape":"flat","status":"running"}}
{"t":358,"kind":"WORKSPACE_BOUND","payload":{"request_id":"68fbc32fefa6","session_id":"4ab3fa9954cf","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-NYJgkz","shape":"flat"}}
{"t":358,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"2c982945e469","session_id":"4ab3fa9954cf","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-NYJgkz","shape":"flat"}}
{"t":358,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"2c982945e469","session_id":"4ab3fa9954cf"}}
{"t":365,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-status","byte":64}}
{"t":418,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2c982945e469","from":"terminal","to":"reveal"}}
{"t":423,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-reveal","byte":128}}
{"t":630,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"2c982945e469","from":"transcript","to":"stream"}}
{"t":788,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"2c982945e469","from":"stream","to":"transcript"}}
{"t":945,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"2c982945e469","from":"transcript","to":"stream"}}
{"t":949,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"2c982945e469","from":"stream","to":"transcript"}}
{"t":1107,"kind":"PANE_SPLIT","payload":{"from_pane_id":"2c982945e469","new_pane_id":"577a7a4ca05c","axis":"row"}}
{"t":1107,"kind":"PANE_CREATED","payload":{"pane_id":"577a7a4ca05c","window_id":"9f4193ad3010","session_id":null,"from_split":"0c78a8673244"}}
{"t":1107,"kind":"PANE_FOCUSED","payload":{"pane_id":"577a7a4ca05c","prior_pane_id":"2c982945e469"}}
{"t":1111,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-focus","byte":128}}
{"t":1111,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-status","byte":64}}
{"t":1111,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-reveal","byte":128}}
{"t":1111,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-lens","byte":0}}
{"t":1111,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-level","byte":0}}
{"t":1111,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-dir","byte":0}}
{"t":1111,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-descent","byte":0}}
{"t":1111,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-surface","byte":0}}
{"t":1111,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-find","byte":0}}
{"t":1111,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-inspect","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-header_popover","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-focus","byte":255}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-status","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-reveal","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-lens","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-level","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-dir","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-descent","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-surface","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-find","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-inspect","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-header_popover","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-focus","byte":128}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-status","byte":64}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-reveal","byte":128}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-lens","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-level","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-dir","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-descent","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-surface","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-find","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-inspect","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-header_popover","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-focus","byte":255}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-status","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-reveal","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-lens","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-level","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-dir","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-descent","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-surface","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-find","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-inspect","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-header_popover","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-focus","byte":128}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-status","byte":64}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-reveal","byte":128}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-lens","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-level","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-dir","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-descent","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-surface","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-find","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-inspect","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2c982945e469-header_popover","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-focus","byte":255}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-status","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-reveal","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-lens","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-level","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-dir","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-descent","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-surface","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-find","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-inspect","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-header_popover","byte":0}}
{"t":1449,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"164d72832bdf","driver":"deterministic"}}
{"t":1451,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"164d72832bdf","driver":"deterministic","context_tokens":null}}
{"t":1451,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"7585fdc36090","pane_id":"577a7a4ca05c","session_id":"67dba0160994","name":"session-67dba0","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-2LCc3S","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1452,"kind":"SESSION_CREATED","payload":{"request_id":"7585fdc36090","session_id":"67dba0160994","name":"session-67dba0","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-2LCc3S","workspace_shape":"flat","status":"running"}}
{"t":1452,"kind":"WORKSPACE_BOUND","payload":{"request_id":"7585fdc36090","session_id":"67dba0160994","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-2LCc3S","shape":"flat"}}
{"t":1452,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"577a7a4ca05c","session_id":"67dba0160994","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-2LCc3S","shape":"flat"}}
{"t":1452,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"577a7a4ca05c","session_id":"67dba0160994"}}
{"t":1456,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-status","byte":64}}
{"t":1476,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"577a7a4ca05c","from":"terminal","to":"reveal"}}
{"t":1481,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-577a7a4ca05c-reveal","byte":128}}
{"t":1789,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"577a7a4ca05c","from":"transcript","to":"stream"}}
```
