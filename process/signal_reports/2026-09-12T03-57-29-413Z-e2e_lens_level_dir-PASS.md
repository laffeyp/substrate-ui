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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"837072508aaa"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"51cb434f0afe","window_id":"837072508aaa","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"51cb434f0afe","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":366,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"47e875cc9654","driver":"deterministic"}}
{"t":368,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"47e875cc9654","driver":"deterministic","context_tokens":null}}
{"t":368,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"43d33e9e4f8f","pane_id":"51cb434f0afe","session_id":"6aaeb716e5a6","name":"session-6aaeb7","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-vgXGJ0","workspace_shape":"flat","bundle":"","seed":""}}
{"t":369,"kind":"SESSION_CREATED","payload":{"request_id":"43d33e9e4f8f","session_id":"6aaeb716e5a6","name":"session-6aaeb7","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-vgXGJ0","workspace_shape":"flat","status":"running"}}
{"t":369,"kind":"WORKSPACE_BOUND","payload":{"request_id":"43d33e9e4f8f","session_id":"6aaeb716e5a6","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-vgXGJ0","shape":"flat"}}
{"t":369,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"51cb434f0afe","session_id":"6aaeb716e5a6","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-vgXGJ0","shape":"flat"}}
{"t":369,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"51cb434f0afe","session_id":"6aaeb716e5a6"}}
{"t":375,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-status","byte":64}}
{"t":427,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"51cb434f0afe","from":"terminal","to":"reveal"}}
{"t":432,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-reveal","byte":128}}
{"t":752,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"51cb434f0afe","from":"all","to":"app"}}
{"t":757,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-level","byte":255}}
{"t":969,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"51cb434f0afe","from":"down","to":"side"}}
{"t":974,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-dir","byte":255}}
{"t":1168,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"51cb434f0afe","from":"app","to":"all"}}
{"t":1174,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-level","byte":0}}
{"t":1184,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"51cb434f0afe","from":"side","to":"down"}}
{"t":1190,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-51cb434f0afe-dir","byte":0}}
```
