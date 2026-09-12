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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"ea7817e0d6d4"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"ad30bd1c1b44","window_id":"ea7817e0d6d4","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"ad30bd1c1b44","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":31,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":361,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"e763087e2f28","driver":"deterministic"}}
{"t":362,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"e763087e2f28","driver":"deterministic","context_tokens":null}}
{"t":362,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"65870d119c23","pane_id":"ad30bd1c1b44","session_id":"823ee9125724","name":"session-823ee9","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-J4Gvri","workspace_shape":"flat","bundle":"","seed":""}}
{"t":363,"kind":"SESSION_CREATED","payload":{"request_id":"65870d119c23","session_id":"823ee9125724","name":"session-823ee9","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-J4Gvri","workspace_shape":"flat","status":"running"}}
{"t":363,"kind":"WORKSPACE_BOUND","payload":{"request_id":"65870d119c23","session_id":"823ee9125724","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-J4Gvri","shape":"flat"}}
{"t":363,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"ad30bd1c1b44","session_id":"823ee9125724","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-J4Gvri","shape":"flat"}}
{"t":363,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"ad30bd1c1b44","session_id":"823ee9125724"}}
{"t":372,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-status","byte":64}}
{"t":431,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ad30bd1c1b44","from":"terminal","to":"reveal"}}
{"t":436,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":128}}
{"t":716,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ad30bd1c1b44","from":"reveal","to":"terminal"}}
{"t":719,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":0}}
{"t":942,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ad30bd1c1b44","from":"terminal","to":"reveal"}}
{"t":946,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":128}}
{"t":964,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ad30bd1c1b44","from":"reveal","to":"terminal"}}
{"t":971,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":0}}
{"t":980,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ad30bd1c1b44","from":"terminal","to":"reveal"}}
{"t":987,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":128}}
{"t":997,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ad30bd1c1b44","from":"reveal","to":"terminal"}}
{"t":1003,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":0}}
{"t":1013,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ad30bd1c1b44","from":"terminal","to":"reveal"}}
{"t":1019,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":128}}
{"t":1030,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ad30bd1c1b44","from":"reveal","to":"terminal"}}
{"t":1036,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":0}}
{"t":1046,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ad30bd1c1b44","from":"terminal","to":"reveal"}}
{"t":1053,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":128}}
{"t":1063,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ad30bd1c1b44","from":"reveal","to":"terminal"}}
{"t":1069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":0}}
{"t":1079,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ad30bd1c1b44","from":"terminal","to":"reveal"}}
{"t":1086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":128}}
{"t":1096,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"ad30bd1c1b44","from":"reveal","to":"terminal"}}
{"t":1103,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ad30bd1c1b44-reveal","byte":0}}
```
