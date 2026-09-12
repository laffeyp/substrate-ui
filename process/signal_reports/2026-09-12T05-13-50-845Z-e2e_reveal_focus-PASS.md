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
{"t":4,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"c02d15cf5ae4"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"ca567c610add","window_id":"c02d15cf5ae4","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"ca567c610add","prior_pane_id":null}}
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
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-focus","byte":255}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-header-popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":364,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"86f54b621a02","driver":"deterministic"}}
{"t":365,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"86f54b621a02","driver":"deterministic","context_tokens":null}}
{"t":365,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"40b33c4c789a","pane_id":"ca567c610add","session_id":"8c033e9864e3","name":"session-8c033e","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-MQPXiP","workspace_shape":"flat","bundle":"","seed":""}}
{"t":366,"kind":"SESSION_CREATED","payload":{"request_id":"40b33c4c789a","session_id":"8c033e9864e3","name":"session-8c033e","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-MQPXiP","workspace_shape":"flat","status":"running"}}
{"t":366,"kind":"WORKSPACE_BOUND","payload":{"request_id":"40b33c4c789a","session_id":"8c033e9864e3","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-MQPXiP","shape":"flat"}}
{"t":366,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"ca567c610add","session_id":"8c033e9864e3","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-MQPXiP","shape":"flat"}}
{"t":366,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"ca567c610add","session_id":"8c033e9864e3"}}
{"t":371,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-status","byte":64}}
{"t":432,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ca567c610add","from":"terminal","to":"reveal"}}
{"t":438,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-reveal","byte":128}}
{"t":643,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"ca567c610add","from":"transcript","to":"stream"}}
{"t":801,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"ca567c610add","from":"stream","to":"transcript"}}
{"t":961,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"ca567c610add","from":"transcript","to":"stream"}}
{"t":968,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"ca567c610add","from":"stream","to":"transcript"}}
{"t":1126,"kind":"PANE_SPLIT","payload":{"from_pane_id":"ca567c610add","new_pane_id":"1e87f0c0e542","axis":"row"}}
{"t":1126,"kind":"PANE_CREATED","payload":{"pane_id":"1e87f0c0e542","window_id":"c02d15cf5ae4","session_id":null,"from_split":"5d3f32d2661f"}}
{"t":1126,"kind":"PANE_FOCUSED","payload":{"pane_id":"1e87f0c0e542","prior_pane_id":"ca567c610add"}}
{"t":1132,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-focus","byte":128}}
{"t":1132,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-status","byte":64}}
{"t":1132,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-reveal","byte":128}}
{"t":1132,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-lens","byte":0}}
{"t":1132,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-level","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-dir","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-descent","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-surface","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-find","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-inspect","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-header-popover","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-focus","byte":255}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-status","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-reveal","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-lens","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-level","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-dir","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-descent","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-surface","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-find","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-inspect","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-header-popover","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-focus","byte":128}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-status","byte":64}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-reveal","byte":128}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-lens","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-level","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-dir","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-descent","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-surface","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-find","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-inspect","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-header-popover","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-focus","byte":255}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-status","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-reveal","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-lens","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-level","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-dir","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-descent","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-surface","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-find","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-inspect","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-header-popover","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-focus","byte":128}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-status","byte":64}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-reveal","byte":128}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-lens","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-level","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-dir","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-descent","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-surface","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-find","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-inspect","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ca567c610add-header-popover","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-focus","byte":255}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-status","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-reveal","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-lens","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-level","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-dir","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-descent","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-surface","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-find","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-inspect","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-header-popover","byte":0}}
{"t":1466,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"e0e191149be2","driver":"deterministic"}}
{"t":1467,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"e0e191149be2","driver":"deterministic","context_tokens":null}}
{"t":1467,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"bf6e2e54ed33","pane_id":"1e87f0c0e542","session_id":"7f0cc27d924c","name":"session-7f0cc2","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-WVvpTC","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1469,"kind":"SESSION_CREATED","payload":{"request_id":"bf6e2e54ed33","session_id":"7f0cc27d924c","name":"session-7f0cc2","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-WVvpTC","workspace_shape":"flat","status":"running"}}
{"t":1469,"kind":"WORKSPACE_BOUND","payload":{"request_id":"bf6e2e54ed33","session_id":"7f0cc27d924c","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-WVvpTC","shape":"flat"}}
{"t":1469,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"1e87f0c0e542","session_id":"7f0cc27d924c","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-WVvpTC","shape":"flat"}}
{"t":1469,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"1e87f0c0e542","session_id":"7f0cc27d924c"}}
{"t":1471,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-status","byte":64}}
{"t":1490,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"1e87f0c0e542","from":"terminal","to":"reveal"}}
{"t":1495,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1e87f0c0e542-reveal","byte":128}}
{"t":1803,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"1e87f0c0e542","from":"transcript","to":"stream"}}
```
