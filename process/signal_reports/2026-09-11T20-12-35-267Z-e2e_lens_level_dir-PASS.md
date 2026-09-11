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
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"d234b0030a3a"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"d5c6bb2c71db","window_id":"d234b0030a3a","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"d5c6bb2c71db","prior_pane_id":null}}
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
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-focus","byte":255}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-status","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-reveal","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-lens","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-level","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-dir","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-descent","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-surface","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-find","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-inspect","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-header_popover","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-focus","byte":255}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-status","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-reveal","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-lens","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-level","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-dir","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-descent","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-surface","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-find","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-inspect","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-header_popover","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-focus","byte":255}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-status","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-reveal","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-lens","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-level","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-dir","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-descent","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-surface","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-find","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-inspect","byte":0}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-header_popover","byte":0}}
{"t":22,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":30,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":378,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"2a584f6478a7","driver":"deterministic"}}
{"t":379,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"2a584f6478a7","driver":"deterministic","context_tokens":null}}
{"t":379,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"69d74257771d","pane_id":"d5c6bb2c71db","session_id":"3afdb3f16806","name":"session-3afdb3","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-M3Janx","workspace_shape":"flat","bundle":"","seed":""}}
{"t":381,"kind":"SESSION_CREATED","payload":{"request_id":"69d74257771d","session_id":"3afdb3f16806","name":"session-3afdb3","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-M3Janx","workspace_shape":"flat","status":"running"}}
{"t":381,"kind":"WORKSPACE_BOUND","payload":{"request_id":"69d74257771d","session_id":"3afdb3f16806","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-M3Janx","shape":"flat"}}
{"t":381,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"d5c6bb2c71db","session_id":"3afdb3f16806","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-M3Janx","shape":"flat"}}
{"t":381,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"d5c6bb2c71db","session_id":"3afdb3f16806"}}
{"t":390,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-status","byte":64}}
{"t":441,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"d5c6bb2c71db","from":"terminal","to":"reveal"}}
{"t":446,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-reveal","byte":128}}
{"t":732,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"d5c6bb2c71db","from":"all","to":"app"}}
{"t":738,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-level","byte":255}}
{"t":933,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"d5c6bb2c71db","from":"down","to":"side"}}
{"t":939,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-dir","byte":255}}
{"t":1132,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"d5c6bb2c71db","from":"app","to":"all"}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-level","byte":0}}
{"t":1148,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"d5c6bb2c71db","from":"side","to":"down"}}
{"t":1154,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d5c6bb2c71db-dir","byte":0}}
```
