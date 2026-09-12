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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"8ca3df145016"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"eb6aca88cd25","window_id":"8ca3df145016","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"eb6aca88cd25","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-header-popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":367,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"d4ef36fdc2ba","driver":"deterministic"}}
{"t":372,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"d4ef36fdc2ba","driver":"deterministic","context_tokens":null}}
{"t":372,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"bd01d3a26f45","pane_id":"eb6aca88cd25","session_id":"e2049d7dd2cd","name":"session-e2049d","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-zpFLD2","workspace_shape":"flat","bundle":"","seed":""}}
{"t":374,"kind":"SESSION_CREATED","payload":{"request_id":"bd01d3a26f45","session_id":"e2049d7dd2cd","name":"session-e2049d","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-zpFLD2","workspace_shape":"flat","status":"running"}}
{"t":374,"kind":"WORKSPACE_BOUND","payload":{"request_id":"bd01d3a26f45","session_id":"e2049d7dd2cd","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-zpFLD2","shape":"flat"}}
{"t":374,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"eb6aca88cd25","session_id":"e2049d7dd2cd","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-zpFLD2","shape":"flat"}}
{"t":374,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"eb6aca88cd25","session_id":"e2049d7dd2cd"}}
{"t":381,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-status","byte":64}}
{"t":434,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"eb6aca88cd25","from":"terminal","to":"reveal"}}
{"t":439,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-reveal","byte":128}}
{"t":645,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"eb6aca88cd25","from":"transcript","to":"stream"}}
{"t":802,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"eb6aca88cd25","from":"stream","to":"transcript"}}
{"t":960,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"eb6aca88cd25","from":"transcript","to":"stream"}}
{"t":964,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"eb6aca88cd25","from":"stream","to":"transcript"}}
{"t":1123,"kind":"PANE_SPLIT","payload":{"from_pane_id":"eb6aca88cd25","new_pane_id":"41cbb6597f40","axis":"row"}}
{"t":1123,"kind":"PANE_CREATED","payload":{"pane_id":"41cbb6597f40","window_id":"8ca3df145016","session_id":null,"from_split":"e0a46db86286"}}
{"t":1123,"kind":"PANE_FOCUSED","payload":{"pane_id":"41cbb6597f40","prior_pane_id":"eb6aca88cd25"}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-focus","byte":128}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-status","byte":64}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-reveal","byte":128}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-lens","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-level","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-dir","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-descent","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-surface","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-find","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-inspect","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-header-popover","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-focus","byte":255}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-status","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-reveal","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-lens","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-level","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-dir","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-descent","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-surface","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-find","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-inspect","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-header-popover","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-focus","byte":128}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-status","byte":64}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-reveal","byte":128}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-lens","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-level","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-dir","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-descent","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-surface","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-find","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-inspect","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-header-popover","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-focus","byte":255}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-status","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-reveal","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-lens","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-level","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-dir","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-descent","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-surface","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-find","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-inspect","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-header-popover","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-focus","byte":128}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-status","byte":64}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-reveal","byte":128}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-lens","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-level","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-dir","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-descent","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-surface","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-find","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-inspect","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-eb6aca88cd25-header-popover","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-focus","byte":255}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-status","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-reveal","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-lens","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-level","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-dir","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-descent","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-surface","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-find","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-inspect","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-header-popover","byte":0}}
{"t":1459,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"59389b8ef9c8","driver":"deterministic"}}
{"t":1460,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"59389b8ef9c8","driver":"deterministic","context_tokens":null}}
{"t":1460,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"88fdebf1c205","pane_id":"41cbb6597f40","session_id":"f6271cbd75e7","name":"session-f6271c","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-XiNDl9","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1462,"kind":"SESSION_CREATED","payload":{"request_id":"88fdebf1c205","session_id":"f6271cbd75e7","name":"session-f6271c","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-XiNDl9","workspace_shape":"flat","status":"running"}}
{"t":1462,"kind":"WORKSPACE_BOUND","payload":{"request_id":"88fdebf1c205","session_id":"f6271cbd75e7","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-XiNDl9","shape":"flat"}}
{"t":1462,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"41cbb6597f40","session_id":"f6271cbd75e7","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-XiNDl9","shape":"flat"}}
{"t":1462,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"41cbb6597f40","session_id":"f6271cbd75e7"}}
{"t":1464,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-status","byte":64}}
{"t":1483,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"41cbb6597f40","from":"terminal","to":"reveal"}}
{"t":1489,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-41cbb6597f40-reveal","byte":128}}
{"t":1796,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"41cbb6597f40","from":"transcript","to":"stream"}}
```
