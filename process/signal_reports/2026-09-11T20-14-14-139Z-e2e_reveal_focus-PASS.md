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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"e0a7ce4d4ebe"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"0b03b6ecdec0","window_id":"e0a7ce4d4ebe","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"0b03b6ecdec0","prior_pane_id":null}}
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
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-header_popover","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-focus","byte":255}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-status","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-reveal","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-lens","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-level","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-dir","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-descent","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-surface","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-find","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-inspect","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-header_popover","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-focus","byte":255}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-status","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-reveal","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-lens","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-level","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-dir","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-descent","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-surface","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-find","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-inspect","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-header_popover","byte":0}}
{"t":22,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":27,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":357,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"9cbf1739c676","driver":"deterministic"}}
{"t":358,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"9cbf1739c676","driver":"deterministic","context_tokens":null}}
{"t":358,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"bce003b409ef","pane_id":"0b03b6ecdec0","session_id":"99daee6a036e","name":"session-99daee","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-uUBD3x","workspace_shape":"flat","bundle":"","seed":""}}
{"t":360,"kind":"SESSION_CREATED","payload":{"request_id":"bce003b409ef","session_id":"99daee6a036e","name":"session-99daee","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-uUBD3x","workspace_shape":"flat","status":"running"}}
{"t":360,"kind":"WORKSPACE_BOUND","payload":{"request_id":"bce003b409ef","session_id":"99daee6a036e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-uUBD3x","shape":"flat"}}
{"t":360,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"0b03b6ecdec0","session_id":"99daee6a036e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-uUBD3x","shape":"flat"}}
{"t":360,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"0b03b6ecdec0","session_id":"99daee6a036e"}}
{"t":369,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-status","byte":64}}
{"t":422,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"0b03b6ecdec0","from":"terminal","to":"reveal"}}
{"t":427,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-reveal","byte":128}}
{"t":636,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"0b03b6ecdec0","from":"transcript","to":"stream"}}
{"t":794,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"0b03b6ecdec0","from":"stream","to":"transcript"}}
{"t":949,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"0b03b6ecdec0","from":"transcript","to":"stream"}}
{"t":952,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"0b03b6ecdec0","from":"stream","to":"transcript"}}
{"t":1107,"kind":"PANE_SPLIT","payload":{"from_pane_id":"0b03b6ecdec0","new_pane_id":"485550849b28","axis":"row"}}
{"t":1107,"kind":"PANE_CREATED","payload":{"pane_id":"485550849b28","window_id":"e0a7ce4d4ebe","session_id":null,"from_split":"9540877d35f3"}}
{"t":1107,"kind":"PANE_FOCUSED","payload":{"pane_id":"485550849b28","prior_pane_id":"0b03b6ecdec0"}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-focus","byte":128}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-status","byte":64}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-reveal","byte":128}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-lens","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-level","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-dir","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-descent","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-surface","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-find","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-inspect","byte":0}}
{"t":1112,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-header_popover","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-focus","byte":255}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-status","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-reveal","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-lens","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-level","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-dir","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-descent","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-surface","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-find","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-inspect","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-header_popover","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-focus","byte":128}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-status","byte":64}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-reveal","byte":128}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-lens","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-level","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-dir","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-descent","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-surface","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-find","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-inspect","byte":0}}
{"t":1113,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-header_popover","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-focus","byte":255}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-status","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-reveal","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-lens","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-level","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-dir","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-descent","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-surface","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-find","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-inspect","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-header_popover","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-focus","byte":128}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-status","byte":64}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-reveal","byte":128}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-lens","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-level","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-dir","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-descent","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-surface","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-find","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-inspect","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0b03b6ecdec0-header_popover","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-focus","byte":255}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-status","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-reveal","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-lens","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-level","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-dir","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-descent","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-surface","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-find","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-inspect","byte":0}}
{"t":1114,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-header_popover","byte":0}}
{"t":1436,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"7128ed1a8fc4","driver":"deterministic"}}
{"t":1437,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"7128ed1a8fc4","driver":"deterministic","context_tokens":null}}
{"t":1437,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"bf7b2eedf348","pane_id":"485550849b28","session_id":"3611659e83f3","name":"session-361165","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-THBC9D","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1439,"kind":"SESSION_CREATED","payload":{"request_id":"bf7b2eedf348","session_id":"3611659e83f3","name":"session-361165","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-THBC9D","workspace_shape":"flat","status":"running"}}
{"t":1439,"kind":"WORKSPACE_BOUND","payload":{"request_id":"bf7b2eedf348","session_id":"3611659e83f3","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-THBC9D","shape":"flat"}}
{"t":1439,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"485550849b28","session_id":"3611659e83f3","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-THBC9D","shape":"flat"}}
{"t":1439,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"485550849b28","session_id":"3611659e83f3"}}
{"t":1444,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-status","byte":64}}
{"t":1454,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"485550849b28","from":"terminal","to":"reveal"}}
{"t":1460,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-485550849b28-reveal","byte":128}}
{"t":1764,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"485550849b28","from":"transcript","to":"stream"}}
```
