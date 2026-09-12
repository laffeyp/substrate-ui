# Signal report — e2e_lens_level_dir

Outcome: **PASS**
Summary: e2e_lens_level_dir — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 71 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"944f303270e6"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"8765f92c7c5b","window_id":"944f303270e6","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"8765f92c7c5b","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":31,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":361,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"4aab4fdd93f1","driver":"deterministic"}}
{"t":363,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"4aab4fdd93f1","driver":"deterministic","context_tokens":null}}
{"t":363,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"253a469d2f14","pane_id":"8765f92c7c5b","session_id":"144632954b0d","name":"session-144632","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-tcB5gd","workspace_shape":"flat","bundle":"","seed":""}}
{"t":364,"kind":"SESSION_CREATED","payload":{"request_id":"253a469d2f14","session_id":"144632954b0d","name":"session-144632","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-tcB5gd","workspace_shape":"flat","status":"running"}}
{"t":364,"kind":"WORKSPACE_BOUND","payload":{"request_id":"253a469d2f14","session_id":"144632954b0d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-tcB5gd","shape":"flat"}}
{"t":364,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"8765f92c7c5b","session_id":"144632954b0d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-tcB5gd","shape":"flat"}}
{"t":364,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"8765f92c7c5b","session_id":"144632954b0d"}}
{"t":371,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-status","byte":64}}
{"t":423,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"8765f92c7c5b","from":"terminal","to":"reveal"}}
{"t":428,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-reveal","byte":128}}
{"t":748,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"8765f92c7c5b","from":"all","to":"app"}}
{"t":753,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-level","byte":255}}
{"t":947,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"8765f92c7c5b","from":"down","to":"side"}}
{"t":953,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-dir","byte":255}}
{"t":1148,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"8765f92c7c5b","from":"app","to":"all"}}
{"t":1153,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-level","byte":0}}
{"t":1164,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"8765f92c7c5b","from":"side","to":"down"}}
{"t":1170,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8765f92c7c5b-dir","byte":0}}
```
