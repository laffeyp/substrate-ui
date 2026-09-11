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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"3f0beb912a7d"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"cc45967fe03c","window_id":"3f0beb912a7d","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"cc45967fe03c","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-header_popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":359,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"23a6c37a8b32","driver":"deterministic"}}
{"t":360,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"23a6c37a8b32","driver":"deterministic","context_tokens":null}}
{"t":360,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"f465dac86598","pane_id":"cc45967fe03c","session_id":"3e293d7b8264","name":"session-3e293d","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-yMFdqg","workspace_shape":"flat","bundle":"","seed":""}}
{"t":362,"kind":"SESSION_CREATED","payload":{"request_id":"f465dac86598","session_id":"3e293d7b8264","name":"session-3e293d","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-yMFdqg","workspace_shape":"flat","status":"running"}}
{"t":362,"kind":"WORKSPACE_BOUND","payload":{"request_id":"f465dac86598","session_id":"3e293d7b8264","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-yMFdqg","shape":"flat"}}
{"t":362,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"cc45967fe03c","session_id":"3e293d7b8264","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-yMFdqg","shape":"flat"}}
{"t":362,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"cc45967fe03c","session_id":"3e293d7b8264"}}
{"t":366,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-status","byte":64}}
{"t":427,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"cc45967fe03c","from":"terminal","to":"reveal"}}
{"t":433,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-reveal","byte":128}}
{"t":648,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"cc45967fe03c","from":"transcript","to":"stream"}}
{"t":807,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"cc45967fe03c","from":"stream","to":"transcript"}}
{"t":963,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"cc45967fe03c","from":"transcript","to":"stream"}}
{"t":966,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"cc45967fe03c","from":"stream","to":"transcript"}}
{"t":1123,"kind":"PANE_SPLIT","payload":{"from_pane_id":"cc45967fe03c","new_pane_id":"276eca060d21","axis":"row"}}
{"t":1123,"kind":"PANE_CREATED","payload":{"pane_id":"276eca060d21","window_id":"3f0beb912a7d","session_id":null,"from_split":"d0398deee385"}}
{"t":1123,"kind":"PANE_FOCUSED","payload":{"pane_id":"276eca060d21","prior_pane_id":"cc45967fe03c"}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-focus","byte":128}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-status","byte":64}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-reveal","byte":128}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-lens","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-level","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-dir","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-descent","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-surface","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-find","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-inspect","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-header_popover","byte":0}}
{"t":1129,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-focus","byte":255}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-status","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-reveal","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-lens","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-level","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-dir","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-descent","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-surface","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-find","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-inspect","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-header_popover","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-focus","byte":128}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-status","byte":64}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-reveal","byte":128}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-lens","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-level","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-dir","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-descent","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-surface","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-find","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-inspect","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-header_popover","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-focus","byte":255}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-status","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-reveal","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-lens","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-level","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-dir","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-descent","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-surface","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-find","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-inspect","byte":0}}
{"t":1130,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-header_popover","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-focus","byte":128}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-status","byte":64}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-reveal","byte":128}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-lens","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-level","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-dir","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-descent","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-surface","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-find","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-inspect","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-cc45967fe03c-header_popover","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-focus","byte":255}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-status","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-reveal","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-lens","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-level","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-dir","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-descent","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-surface","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-find","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-inspect","byte":0}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-header_popover","byte":0}}
{"t":1467,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"e842f4a889c9","driver":"deterministic"}}
{"t":1468,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"e842f4a889c9","driver":"deterministic","context_tokens":null}}
{"t":1468,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"b10e01d27886","pane_id":"276eca060d21","session_id":"61a0cd33d365","name":"session-61a0cd","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-ZKllDP","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1470,"kind":"SESSION_CREATED","payload":{"request_id":"b10e01d27886","session_id":"61a0cd33d365","name":"session-61a0cd","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-ZKllDP","workspace_shape":"flat","status":"running"}}
{"t":1470,"kind":"WORKSPACE_BOUND","payload":{"request_id":"b10e01d27886","session_id":"61a0cd33d365","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-ZKllDP","shape":"flat"}}
{"t":1470,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"276eca060d21","session_id":"61a0cd33d365","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-ZKllDP","shape":"flat"}}
{"t":1470,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"276eca060d21","session_id":"61a0cd33d365"}}
{"t":1473,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-status","byte":64}}
{"t":1494,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"276eca060d21","from":"terminal","to":"reveal"}}
{"t":1498,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-276eca060d21-reveal","byte":128}}
{"t":1804,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"276eca060d21","from":"transcript","to":"stream"}}
```
