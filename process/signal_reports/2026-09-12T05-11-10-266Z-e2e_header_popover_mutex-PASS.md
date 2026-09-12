# Signal report — e2e_header_popover_mutex

Outcome: **PASS**
Summary: e2e_header_popover_mutex — three-channel agreement

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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"34f7d3c115b0"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"34d0d4a2f519","window_id":"34f7d3c115b0","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"34d0d4a2f519","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":28,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":363,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"06bcbe4e1bf3","driver":"deterministic"}}
{"t":364,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"06bcbe4e1bf3","driver":"deterministic","context_tokens":null}}
{"t":364,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"d232b291c984","pane_id":"34d0d4a2f519","session_id":"d024f5ed65ca","name":"session-d024f5","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-header_mutex-ws-oRc0cB","workspace_shape":"flat","bundle":"","seed":""}}
{"t":365,"kind":"SESSION_CREATED","payload":{"request_id":"d232b291c984","session_id":"d024f5ed65ca","name":"session-d024f5","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-header_mutex-ws-oRc0cB","workspace_shape":"flat","status":"running"}}
{"t":365,"kind":"WORKSPACE_BOUND","payload":{"request_id":"d232b291c984","session_id":"d024f5ed65ca","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-header_mutex-ws-oRc0cB","shape":"flat"}}
{"t":365,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"34d0d4a2f519","session_id":"d024f5ed65ca","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-header_mutex-ws-oRc0cB","shape":"flat"}}
{"t":365,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"34d0d4a2f519","session_id":"d024f5ed65ca"}}
{"t":370,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-status","byte":64}}
{"t":439,"kind":"DRIVER_DROPDOWN_OPENED","payload":{"pane_id":"34d0d4a2f519"}}
{"t":445,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-header-popover","byte":128}}
{"t":693,"kind":"DRIVER_DROPDOWN_CLOSED","payload":{"pane_id":"34d0d4a2f519"}}
{"t":693,"kind":"WORKSPACE_POPOVER_OPENED","payload":{"pane_id":"34d0d4a2f519"}}
{"t":699,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-header-popover","byte":255}}
{"t":921,"kind":"WORKSPACE_POPOVER_CLOSED","payload":{"pane_id":"34d0d4a2f519"}}
{"t":921,"kind":"DRIVER_DROPDOWN_OPENED","payload":{"pane_id":"34d0d4a2f519"}}
{"t":925,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-header-popover","byte":128}}
{"t":1151,"kind":"DRIVER_DROPDOWN_CLOSED","payload":{"pane_id":"34d0d4a2f519"}}
{"t":1153,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-34d0d4a2f519-header-popover","byte":0}}
```
