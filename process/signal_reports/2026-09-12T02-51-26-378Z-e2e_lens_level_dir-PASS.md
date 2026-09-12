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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"8b08361ee962"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"18974ed06776","window_id":"8b08361ee962","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"18974ed06776","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":32,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":356,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"c53bb36219d2","driver":"deterministic"}}
{"t":358,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"c53bb36219d2","driver":"deterministic","context_tokens":null}}
{"t":358,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"586fcfb4d327","pane_id":"18974ed06776","session_id":"2ef252ba34fa","name":"session-2ef252","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-eU3w9o","workspace_shape":"flat","bundle":"","seed":""}}
{"t":359,"kind":"SESSION_CREATED","payload":{"request_id":"586fcfb4d327","session_id":"2ef252ba34fa","name":"session-2ef252","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-eU3w9o","workspace_shape":"flat","status":"running"}}
{"t":359,"kind":"WORKSPACE_BOUND","payload":{"request_id":"586fcfb4d327","session_id":"2ef252ba34fa","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-eU3w9o","shape":"flat"}}
{"t":359,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"18974ed06776","session_id":"2ef252ba34fa","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-eU3w9o","shape":"flat"}}
{"t":359,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"18974ed06776","session_id":"2ef252ba34fa"}}
{"t":363,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-status","byte":64}}
{"t":416,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"18974ed06776","from":"terminal","to":"reveal"}}
{"t":421,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-reveal","byte":128}}
{"t":725,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"18974ed06776","from":"all","to":"app"}}
{"t":730,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-level","byte":255}}
{"t":924,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"18974ed06776","from":"down","to":"side"}}
{"t":930,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-dir","byte":255}}
{"t":1133,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"18974ed06776","from":"app","to":"all"}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-level","byte":0}}
{"t":1148,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"18974ed06776","from":"side","to":"down"}}
{"t":1155,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-18974ed06776-dir","byte":0}}
```
