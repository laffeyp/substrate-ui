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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"e3dd8f0fd8e6"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"b7f6e35e7bba","window_id":"e3dd8f0fd8e6","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"b7f6e35e7bba","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-header_popover","byte":0}}
{"t":23,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":31,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":371,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"e8fe5459ea49","driver":"deterministic"}}
{"t":372,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"e8fe5459ea49","driver":"deterministic","context_tokens":null}}
{"t":372,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"584df0d09276","pane_id":"b7f6e35e7bba","session_id":"c826cac90889","name":"session-c826ca","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-vlCHNn","workspace_shape":"flat","bundle":"","seed":""}}
{"t":374,"kind":"SESSION_CREATED","payload":{"request_id":"584df0d09276","session_id":"c826cac90889","name":"session-c826ca","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-vlCHNn","workspace_shape":"flat","status":"running"}}
{"t":374,"kind":"WORKSPACE_BOUND","payload":{"request_id":"584df0d09276","session_id":"c826cac90889","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-vlCHNn","shape":"flat"}}
{"t":374,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"b7f6e35e7bba","session_id":"c826cac90889","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-vlCHNn","shape":"flat"}}
{"t":374,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"b7f6e35e7bba","session_id":"c826cac90889"}}
{"t":381,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-status","byte":64}}
{"t":434,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"b7f6e35e7bba","from":"terminal","to":"reveal"}}
{"t":439,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-reveal","byte":128}}
{"t":758,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"b7f6e35e7bba","from":"all","to":"app"}}
{"t":764,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-level","byte":255}}
{"t":958,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"b7f6e35e7bba","from":"down","to":"side"}}
{"t":964,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-dir","byte":255}}
{"t":1167,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"b7f6e35e7bba","from":"app","to":"all"}}
{"t":1172,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-level","byte":0}}
{"t":1183,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"b7f6e35e7bba","from":"side","to":"down"}}
{"t":1189,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b7f6e35e7bba-dir","byte":0}}
```
