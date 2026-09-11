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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"760877b7f29d"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"ff5de0d9415b","window_id":"760877b7f29d","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"ff5de0d9415b","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-header_popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":364,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"1e5b55b31660","driver":"deterministic"}}
{"t":367,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"1e5b55b31660","driver":"deterministic","context_tokens":null}}
{"t":367,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"2128d9290b0b","pane_id":"ff5de0d9415b","session_id":"c4e02334a312","name":"session-c4e023","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-beFtCL","workspace_shape":"flat","bundle":"","seed":""}}
{"t":369,"kind":"SESSION_CREATED","payload":{"request_id":"2128d9290b0b","session_id":"c4e02334a312","name":"session-c4e023","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-beFtCL","workspace_shape":"flat","status":"running"}}
{"t":369,"kind":"WORKSPACE_BOUND","payload":{"request_id":"2128d9290b0b","session_id":"c4e02334a312","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-beFtCL","shape":"flat"}}
{"t":369,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"ff5de0d9415b","session_id":"c4e02334a312","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-beFtCL","shape":"flat"}}
{"t":369,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"ff5de0d9415b","session_id":"c4e02334a312"}}
{"t":375,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-status","byte":64}}
{"t":427,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ff5de0d9415b","from":"terminal","to":"reveal"}}
{"t":433,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-reveal","byte":128}}
{"t":646,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"ff5de0d9415b","from":"transcript","to":"stream"}}
{"t":807,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"ff5de0d9415b","from":"stream","to":"transcript"}}
{"t":966,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"ff5de0d9415b","from":"transcript","to":"stream"}}
{"t":970,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"ff5de0d9415b","from":"stream","to":"transcript"}}
{"t":1127,"kind":"PANE_SPLIT","payload":{"from_pane_id":"ff5de0d9415b","new_pane_id":"631519fdbeab","axis":"row"}}
{"t":1127,"kind":"PANE_CREATED","payload":{"pane_id":"631519fdbeab","window_id":"760877b7f29d","session_id":null,"from_split":"119c675895c2"}}
{"t":1127,"kind":"PANE_FOCUSED","payload":{"pane_id":"631519fdbeab","prior_pane_id":"ff5de0d9415b"}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-focus","byte":128}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-status","byte":64}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-reveal","byte":128}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-lens","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-level","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-dir","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-descent","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-surface","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-find","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-inspect","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-header_popover","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-focus","byte":255}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-status","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-reveal","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-lens","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-level","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-dir","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-descent","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-surface","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-find","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-inspect","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-header_popover","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-focus","byte":128}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-status","byte":64}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-reveal","byte":128}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-lens","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-level","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-dir","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-descent","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-surface","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-find","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-inspect","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-header_popover","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-focus","byte":255}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-status","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-reveal","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-lens","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-level","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-dir","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-descent","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-surface","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-find","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-inspect","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-header_popover","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-focus","byte":128}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-status","byte":64}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-reveal","byte":128}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-lens","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-level","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-dir","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-descent","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-surface","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-find","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-inspect","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ff5de0d9415b-header_popover","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-focus","byte":255}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-status","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-reveal","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-lens","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-level","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-dir","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-descent","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-surface","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-find","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-inspect","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-header_popover","byte":0}}
{"t":1472,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"416eca8805d2","driver":"deterministic"}}
{"t":1473,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"416eca8805d2","driver":"deterministic","context_tokens":null}}
{"t":1473,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"118c3209fc6e","pane_id":"631519fdbeab","session_id":"d2e11778722c","name":"session-d2e117","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-0OxiKn","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1475,"kind":"SESSION_CREATED","payload":{"request_id":"118c3209fc6e","session_id":"d2e11778722c","name":"session-d2e117","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-0OxiKn","workspace_shape":"flat","status":"running"}}
{"t":1475,"kind":"WORKSPACE_BOUND","payload":{"request_id":"118c3209fc6e","session_id":"d2e11778722c","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-0OxiKn","shape":"flat"}}
{"t":1475,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"631519fdbeab","session_id":"d2e11778722c","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-0OxiKn","shape":"flat"}}
{"t":1475,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"631519fdbeab","session_id":"d2e11778722c"}}
{"t":1483,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-status","byte":64}}
{"t":1494,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"631519fdbeab","from":"terminal","to":"reveal"}}
{"t":1499,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-631519fdbeab-reveal","byte":128}}
{"t":1807,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"631519fdbeab","from":"transcript","to":"stream"}}
```
