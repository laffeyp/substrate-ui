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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"188fed7e481b"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"fa01aba0d305","window_id":"188fed7e481b","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"fa01aba0d305","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-focus","byte":255}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-status","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-reveal","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-lens","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-level","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-dir","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-descent","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-surface","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-find","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-inspect","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-header_popover","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-focus","byte":255}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-status","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-reveal","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-lens","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-level","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-dir","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-descent","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-header_popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-header_popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":359,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"c65a3173c3a0","driver":"deterministic"}}
{"t":360,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"c65a3173c3a0","driver":"deterministic","context_tokens":null}}
{"t":360,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"50c94a30916f","pane_id":"fa01aba0d305","session_id":"aaa7a1b3f486","name":"session-aaa7a1","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-rIiSBi","workspace_shape":"flat","bundle":"","seed":""}}
{"t":362,"kind":"SESSION_CREATED","payload":{"request_id":"50c94a30916f","session_id":"aaa7a1b3f486","name":"session-aaa7a1","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-rIiSBi","workspace_shape":"flat","status":"running"}}
{"t":362,"kind":"WORKSPACE_BOUND","payload":{"request_id":"50c94a30916f","session_id":"aaa7a1b3f486","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-rIiSBi","shape":"flat"}}
{"t":362,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"fa01aba0d305","session_id":"aaa7a1b3f486","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-rIiSBi","shape":"flat"}}
{"t":362,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"fa01aba0d305","session_id":"aaa7a1b3f486"}}
{"t":367,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-status","byte":64}}
{"t":428,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"fa01aba0d305","from":"terminal","to":"reveal"}}
{"t":433,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-reveal","byte":128}}
{"t":745,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"fa01aba0d305","from":"all","to":"app"}}
{"t":750,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-level","byte":255}}
{"t":944,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"fa01aba0d305","from":"down","to":"side"}}
{"t":951,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-dir","byte":255}}
{"t":1154,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"fa01aba0d305","from":"app","to":"all"}}
{"t":1159,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-level","byte":0}}
{"t":1169,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"fa01aba0d305","from":"side","to":"down"}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fa01aba0d305-dir","byte":0}}
```
