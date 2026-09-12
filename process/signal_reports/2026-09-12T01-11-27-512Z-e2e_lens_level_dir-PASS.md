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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"0b87a4701262"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"00cee0fb51d5","window_id":"0b87a4701262","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"00cee0fb51d5","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":357,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"645d16a93cb2","driver":"deterministic"}}
{"t":358,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"645d16a93cb2","driver":"deterministic","context_tokens":null}}
{"t":359,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"97afd961bcb4","pane_id":"00cee0fb51d5","session_id":"89efe830fd69","name":"session-89efe8","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-wX1DAm","workspace_shape":"flat","bundle":"","seed":""}}
{"t":360,"kind":"SESSION_CREATED","payload":{"request_id":"97afd961bcb4","session_id":"89efe830fd69","name":"session-89efe8","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-wX1DAm","workspace_shape":"flat","status":"running"}}
{"t":360,"kind":"WORKSPACE_BOUND","payload":{"request_id":"97afd961bcb4","session_id":"89efe830fd69","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-wX1DAm","shape":"flat"}}
{"t":360,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"00cee0fb51d5","session_id":"89efe830fd69","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-lens-level-dir-ws-wX1DAm","shape":"flat"}}
{"t":360,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"00cee0fb51d5","session_id":"89efe830fd69"}}
{"t":365,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-status","byte":64}}
{"t":417,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"00cee0fb51d5","from":"terminal","to":"reveal"}}
{"t":422,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-reveal","byte":128}}
{"t":717,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"00cee0fb51d5","from":"all","to":"app"}}
{"t":722,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-level","byte":255}}
{"t":917,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"00cee0fb51d5","from":"down","to":"side"}}
{"t":922,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-dir","byte":255}}
{"t":1127,"kind":"STREAM_LEVEL_TOGGLED","payload":{"pane_id":"00cee0fb51d5","from":"app","to":"all"}}
{"t":1131,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-level","byte":0}}
{"t":1152,"kind":"STREAM_DIR_TOGGLED","payload":{"pane_id":"00cee0fb51d5","from":"side","to":"down"}}
{"t":1156,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-00cee0fb51d5-dir","byte":0}}
```
