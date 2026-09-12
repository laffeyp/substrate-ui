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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"8435651cc32a"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"3325d42cfa2b","window_id":"8435651cc32a","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"3325d42cfa2b","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":25,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":358,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"7c8fee725fee","driver":"deterministic"}}
{"t":359,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"7c8fee725fee","driver":"deterministic","context_tokens":null}}
{"t":359,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"777593c8b560","pane_id":"3325d42cfa2b","session_id":"c17e475ce299","name":"session-c17e47","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-lc4WW2","workspace_shape":"flat","bundle":"","seed":""}}
{"t":361,"kind":"SESSION_CREATED","payload":{"request_id":"777593c8b560","session_id":"c17e475ce299","name":"session-c17e47","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-lc4WW2","workspace_shape":"flat","status":"running"}}
{"t":361,"kind":"WORKSPACE_BOUND","payload":{"request_id":"777593c8b560","session_id":"c17e475ce299","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-lc4WW2","shape":"flat"}}
{"t":361,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"3325d42cfa2b","session_id":"c17e475ce299","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-lc4WW2","shape":"flat"}}
{"t":361,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"3325d42cfa2b","session_id":"c17e475ce299"}}
{"t":368,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-status","byte":64}}
{"t":420,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"3325d42cfa2b","from":"terminal","to":"reveal"}}
{"t":425,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-reveal","byte":128}}
{"t":635,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"3325d42cfa2b","from":"transcript","to":"stream"}}
{"t":795,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"3325d42cfa2b","from":"stream","to":"transcript"}}
{"t":953,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"3325d42cfa2b","from":"transcript","to":"stream"}}
{"t":957,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"3325d42cfa2b","from":"stream","to":"transcript"}}
{"t":1115,"kind":"PANE_SPLIT","payload":{"from_pane_id":"3325d42cfa2b","new_pane_id":"266330ec79c4","axis":"row"}}
{"t":1115,"kind":"PANE_CREATED","payload":{"pane_id":"266330ec79c4","window_id":"8435651cc32a","session_id":null,"from_split":"4f4a8a9a2866"}}
{"t":1115,"kind":"PANE_FOCUSED","payload":{"pane_id":"266330ec79c4","prior_pane_id":"3325d42cfa2b"}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-focus","byte":128}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-status","byte":64}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-reveal","byte":128}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-lens","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-level","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-dir","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-descent","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-surface","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-find","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-inspect","byte":0}}
{"t":1121,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-header-popover","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-focus","byte":255}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-status","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-reveal","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-lens","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-level","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-dir","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-descent","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-surface","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-find","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-inspect","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-header-popover","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-focus","byte":128}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-status","byte":64}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-reveal","byte":128}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-lens","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-level","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-dir","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-descent","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-surface","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-find","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-inspect","byte":0}}
{"t":1122,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-header-popover","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-focus","byte":255}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-status","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-reveal","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-lens","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-level","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-dir","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-descent","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-surface","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-find","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-inspect","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-header-popover","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-focus","byte":128}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-status","byte":64}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-reveal","byte":128}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-lens","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-level","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-dir","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-descent","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-surface","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-find","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-inspect","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3325d42cfa2b-header-popover","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-focus","byte":255}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-status","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-reveal","byte":0}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-lens","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-level","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-dir","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-descent","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-surface","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-find","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-inspect","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-header-popover","byte":0}}
{"t":1458,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"c8f7ec9e4c60","driver":"deterministic"}}
{"t":1460,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"c8f7ec9e4c60","driver":"deterministic","context_tokens":null}}
{"t":1460,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"496faa2d61e4","pane_id":"266330ec79c4","session_id":"dffc9853a84d","name":"session-dffc98","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-0mGi8Z","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1462,"kind":"SESSION_CREATED","payload":{"request_id":"496faa2d61e4","session_id":"dffc9853a84d","name":"session-dffc98","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-0mGi8Z","workspace_shape":"flat","status":"running"}}
{"t":1462,"kind":"WORKSPACE_BOUND","payload":{"request_id":"496faa2d61e4","session_id":"dffc9853a84d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-0mGi8Z","shape":"flat"}}
{"t":1462,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"266330ec79c4","session_id":"dffc9853a84d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-0mGi8Z","shape":"flat"}}
{"t":1462,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"266330ec79c4","session_id":"dffc9853a84d"}}
{"t":1466,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-status","byte":64}}
{"t":1479,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"266330ec79c4","from":"terminal","to":"reveal"}}
{"t":1484,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-266330ec79c4-reveal","byte":128}}
{"t":1793,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"266330ec79c4","from":"transcript","to":"stream"}}
```
