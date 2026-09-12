# Signal report — e2e_reveal_toggle

Outcome: **PASS**
Summary: e2e_reveal_toggle — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 85 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"d17966d8337f"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"4643bbe057d6","window_id":"d17966d8337f","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"4643bbe057d6","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":23,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":359,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"f7c3602bc42e","driver":"deterministic"}}
{"t":360,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"f7c3602bc42e","driver":"deterministic","context_tokens":null}}
{"t":360,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"758cd5ad1d8c","pane_id":"4643bbe057d6","session_id":"855e5f7c405e","name":"session-855e5f","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-ctxAMl","workspace_shape":"flat","bundle":"","seed":""}}
{"t":361,"kind":"SESSION_CREATED","payload":{"request_id":"758cd5ad1d8c","session_id":"855e5f7c405e","name":"session-855e5f","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-ctxAMl","workspace_shape":"flat","status":"running"}}
{"t":361,"kind":"WORKSPACE_BOUND","payload":{"request_id":"758cd5ad1d8c","session_id":"855e5f7c405e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-ctxAMl","shape":"flat"}}
{"t":361,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"4643bbe057d6","session_id":"855e5f7c405e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-ctxAMl","shape":"flat"}}
{"t":361,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"4643bbe057d6","session_id":"855e5f7c405e"}}
{"t":366,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-status","byte":64}}
{"t":427,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"4643bbe057d6","from":"terminal","to":"reveal"}}
{"t":432,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":128}}
{"t":686,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"4643bbe057d6","from":"reveal","to":"terminal"}}
{"t":690,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":0}}
{"t":919,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"4643bbe057d6","from":"terminal","to":"reveal"}}
{"t":924,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":128}}
{"t":944,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"4643bbe057d6","from":"reveal","to":"terminal"}}
{"t":949,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":0}}
{"t":970,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"4643bbe057d6","from":"terminal","to":"reveal"}}
{"t":974,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":128}}
{"t":993,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"4643bbe057d6","from":"reveal","to":"terminal"}}
{"t":999,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":0}}
{"t":1009,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"4643bbe057d6","from":"terminal","to":"reveal"}}
{"t":1016,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":128}}
{"t":1025,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"4643bbe057d6","from":"reveal","to":"terminal"}}
{"t":1032,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":0}}
{"t":1042,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"4643bbe057d6","from":"terminal","to":"reveal"}}
{"t":1048,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":128}}
{"t":1059,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"4643bbe057d6","from":"reveal","to":"terminal"}}
{"t":1065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":0}}
{"t":1075,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"4643bbe057d6","from":"terminal","to":"reveal"}}
{"t":1082,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":128}}
{"t":1092,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"4643bbe057d6","from":"reveal","to":"terminal"}}
{"t":1098,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4643bbe057d6-reveal","byte":0}}
```
