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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"ef506c56add2"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"21342329c2ac","window_id":"ef506c56add2","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"21342329c2ac","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-header-popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":364,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"9680999b0572","driver":"deterministic"}}
{"t":365,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"9680999b0572","driver":"deterministic","context_tokens":null}}
{"t":365,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"3d5fda2f222a","pane_id":"21342329c2ac","session_id":"067c07140f10","name":"session-067c07","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-YgrQMl","workspace_shape":"flat","bundle":"","seed":""}}
{"t":367,"kind":"SESSION_CREATED","payload":{"request_id":"3d5fda2f222a","session_id":"067c07140f10","name":"session-067c07","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-YgrQMl","workspace_shape":"flat","status":"running"}}
{"t":367,"kind":"WORKSPACE_BOUND","payload":{"request_id":"3d5fda2f222a","session_id":"067c07140f10","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-YgrQMl","shape":"flat"}}
{"t":367,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"21342329c2ac","session_id":"067c07140f10","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-YgrQMl","shape":"flat"}}
{"t":367,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"21342329c2ac","session_id":"067c07140f10"}}
{"t":373,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-status","byte":64}}
{"t":426,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"21342329c2ac","from":"terminal","to":"reveal"}}
{"t":431,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-reveal","byte":128}}
{"t":641,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"21342329c2ac","from":"transcript","to":"stream"}}
{"t":801,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"21342329c2ac","from":"stream","to":"transcript"}}
{"t":958,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"21342329c2ac","from":"transcript","to":"stream"}}
{"t":961,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"21342329c2ac","from":"stream","to":"transcript"}}
{"t":1118,"kind":"PANE_SPLIT","payload":{"from_pane_id":"21342329c2ac","new_pane_id":"295b0cf7f597","axis":"row"}}
{"t":1118,"kind":"PANE_CREATED","payload":{"pane_id":"295b0cf7f597","window_id":"ef506c56add2","session_id":null,"from_split":"603b7473229b"}}
{"t":1118,"kind":"PANE_FOCUSED","payload":{"pane_id":"295b0cf7f597","prior_pane_id":"21342329c2ac"}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-focus","byte":128}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-status","byte":64}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-reveal","byte":128}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-lens","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-level","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-dir","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-descent","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-surface","byte":0}}
{"t":1124,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-find","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-inspect","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-header-popover","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-focus","byte":255}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-status","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-reveal","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-lens","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-level","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-dir","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-descent","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-surface","byte":0}}
{"t":1125,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-find","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-inspect","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-header-popover","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-focus","byte":128}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-status","byte":64}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-reveal","byte":128}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-lens","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-level","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-dir","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-descent","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-surface","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-find","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-inspect","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-header-popover","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-focus","byte":255}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-status","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-reveal","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-lens","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-level","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-dir","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-descent","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-surface","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-find","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-inspect","byte":0}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-header-popover","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-focus","byte":128}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-status","byte":64}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-reveal","byte":128}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-lens","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-level","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-dir","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-descent","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-surface","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-find","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-inspect","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21342329c2ac-header-popover","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-focus","byte":255}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-status","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-reveal","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-lens","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-level","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-dir","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-descent","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-surface","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-find","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-inspect","byte":0}}
{"t":1127,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-header-popover","byte":0}}
{"t":1461,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"2d08d22fd3dd","driver":"deterministic"}}
{"t":1462,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"2d08d22fd3dd","driver":"deterministic","context_tokens":null}}
{"t":1462,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"672a1762617a","pane_id":"295b0cf7f597","session_id":"8408b8bad189","name":"session-8408b8","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-vh8o4Q","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1464,"kind":"SESSION_CREATED","payload":{"request_id":"672a1762617a","session_id":"8408b8bad189","name":"session-8408b8","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-vh8o4Q","workspace_shape":"flat","status":"running"}}
{"t":1464,"kind":"WORKSPACE_BOUND","payload":{"request_id":"672a1762617a","session_id":"8408b8bad189","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-vh8o4Q","shape":"flat"}}
{"t":1464,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"295b0cf7f597","session_id":"8408b8bad189","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-vh8o4Q","shape":"flat"}}
{"t":1464,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"295b0cf7f597","session_id":"8408b8bad189"}}
{"t":1466,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-status","byte":64}}
{"t":1484,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"295b0cf7f597","from":"terminal","to":"reveal"}}
{"t":1489,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-295b0cf7f597-reveal","byte":128}}
{"t":1798,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"295b0cf7f597","from":"transcript","to":"stream"}}
```
