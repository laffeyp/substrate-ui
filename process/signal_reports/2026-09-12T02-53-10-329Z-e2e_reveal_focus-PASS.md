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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"ace08b80e4e8"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"8683da92d332","window_id":"ace08b80e4e8","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"8683da92d332","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":25,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":365,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"1c525eabe5e6","driver":"deterministic"}}
{"t":366,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"1c525eabe5e6","driver":"deterministic","context_tokens":null}}
{"t":366,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"2b23b2b951ac","pane_id":"8683da92d332","session_id":"a6becb32b990","name":"session-a6becb","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-o1B0jD","workspace_shape":"flat","bundle":"","seed":""}}
{"t":368,"kind":"SESSION_CREATED","payload":{"request_id":"2b23b2b951ac","session_id":"a6becb32b990","name":"session-a6becb","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-o1B0jD","workspace_shape":"flat","status":"running"}}
{"t":368,"kind":"WORKSPACE_BOUND","payload":{"request_id":"2b23b2b951ac","session_id":"a6becb32b990","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-o1B0jD","shape":"flat"}}
{"t":368,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"8683da92d332","session_id":"a6becb32b990","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-o1B0jD","shape":"flat"}}
{"t":368,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"8683da92d332","session_id":"a6becb32b990"}}
{"t":375,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-status","byte":64}}
{"t":428,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"8683da92d332","from":"terminal","to":"reveal"}}
{"t":433,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-reveal","byte":128}}
{"t":653,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"8683da92d332","from":"transcript","to":"stream"}}
{"t":810,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"8683da92d332","from":"stream","to":"transcript"}}
{"t":967,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"8683da92d332","from":"transcript","to":"stream"}}
{"t":971,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"8683da92d332","from":"stream","to":"transcript"}}
{"t":1129,"kind":"PANE_SPLIT","payload":{"from_pane_id":"8683da92d332","new_pane_id":"3ed78bee8951","axis":"row"}}
{"t":1129,"kind":"PANE_CREATED","payload":{"pane_id":"3ed78bee8951","window_id":"ace08b80e4e8","session_id":null,"from_split":"55f714791538"}}
{"t":1129,"kind":"PANE_FOCUSED","payload":{"pane_id":"3ed78bee8951","prior_pane_id":"8683da92d332"}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-focus","byte":128}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-status","byte":64}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-reveal","byte":128}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-lens","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-level","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-dir","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-descent","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-surface","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-find","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-inspect","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-header-popover","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-focus","byte":255}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-status","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-reveal","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-lens","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-level","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-dir","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-descent","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-surface","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-find","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-inspect","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-header-popover","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-focus","byte":128}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-status","byte":64}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-reveal","byte":128}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-lens","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-level","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-dir","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-descent","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-surface","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-find","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-inspect","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-header-popover","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-focus","byte":255}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-status","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-reveal","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-lens","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-level","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-dir","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-descent","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-surface","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-find","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-inspect","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-header-popover","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-focus","byte":128}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-status","byte":64}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-reveal","byte":128}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-lens","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-level","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-dir","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-descent","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-surface","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-find","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-inspect","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8683da92d332-header-popover","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-focus","byte":255}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-status","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-reveal","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-lens","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-level","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-dir","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-descent","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-surface","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-find","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-inspect","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-header-popover","byte":0}}
{"t":1477,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"1697c126b0bf","driver":"deterministic"}}
{"t":1478,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"1697c126b0bf","driver":"deterministic","context_tokens":null}}
{"t":1478,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"0a53f9b26d58","pane_id":"3ed78bee8951","session_id":"c266ae990ac8","name":"session-c266ae","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-OHZikG","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1480,"kind":"SESSION_CREATED","payload":{"request_id":"0a53f9b26d58","session_id":"c266ae990ac8","name":"session-c266ae","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-OHZikG","workspace_shape":"flat","status":"running"}}
{"t":1480,"kind":"WORKSPACE_BOUND","payload":{"request_id":"0a53f9b26d58","session_id":"c266ae990ac8","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-OHZikG","shape":"flat"}}
{"t":1480,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"3ed78bee8951","session_id":"c266ae990ac8","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-OHZikG","shape":"flat"}}
{"t":1480,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"3ed78bee8951","session_id":"c266ae990ac8"}}
{"t":1483,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-status","byte":64}}
{"t":1503,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"3ed78bee8951","from":"terminal","to":"reveal"}}
{"t":1508,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3ed78bee8951-reveal","byte":128}}
{"t":1811,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"3ed78bee8951","from":"transcript","to":"stream"}}
```
