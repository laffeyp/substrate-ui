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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"4fbf6417c659"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"d2ff0050b60f","window_id":"4fbf6417c659","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"d2ff0050b60f","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":359,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"9db82a6dadb2","driver":"deterministic"}}
{"t":361,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"9db82a6dadb2","driver":"deterministic","context_tokens":null}}
{"t":362,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"9a1b9a379336","pane_id":"d2ff0050b60f","session_id":"dc961c667f13","name":"session-dc961c","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-qONy0Q","workspace_shape":"flat","bundle":"","seed":""}}
{"t":363,"kind":"SESSION_CREATED","payload":{"request_id":"9a1b9a379336","session_id":"dc961c667f13","name":"session-dc961c","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-qONy0Q","workspace_shape":"flat","status":"running"}}
{"t":363,"kind":"WORKSPACE_BOUND","payload":{"request_id":"9a1b9a379336","session_id":"dc961c667f13","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-qONy0Q","shape":"flat"}}
{"t":363,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"d2ff0050b60f","session_id":"dc961c667f13","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-qONy0Q","shape":"flat"}}
{"t":363,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"d2ff0050b60f","session_id":"dc961c667f13"}}
{"t":366,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-status","byte":64}}
{"t":427,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"d2ff0050b60f","from":"terminal","to":"reveal"}}
{"t":433,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-reveal","byte":128}}
{"t":743,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"d2ff0050b60f","from":"all","to":"app"}}
{"t":749,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-level","byte":255}}
{"t":952,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"d2ff0050b60f","from":"down","to":"side"}}
{"t":958,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-dir","byte":255}}
{"t":1162,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"d2ff0050b60f","from":"app","to":"all"}}
{"t":1166,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-level","byte":0}}
{"t":1186,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"d2ff0050b60f","from":"side","to":"down"}}
{"t":1191,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d2ff0050b60f-dir","byte":0}}
```
