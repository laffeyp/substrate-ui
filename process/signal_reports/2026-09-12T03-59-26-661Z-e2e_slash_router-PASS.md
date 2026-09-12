# Signal report — e2e_slash_router

Outcome: **PASS**
Summary: e2e_slash_router — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 73 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"b32ab90f32f9"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"ed88f1f8a204","window_id":"b32ab90f32f9","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"ed88f1f8a204","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":27,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":368,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"c40111fb7dfc","driver":"deterministic"}}
{"t":369,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"c40111fb7dfc","driver":"deterministic","context_tokens":null}}
{"t":370,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"1a5dee8066b1","pane_id":"ed88f1f8a204","session_id":"378c4658341b","name":"session-378c46","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-JwrZnh","workspace_shape":"flat","bundle":"","seed":""}}
{"t":371,"kind":"SESSION_CREATED","payload":{"request_id":"1a5dee8066b1","session_id":"378c4658341b","name":"session-378c46","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-JwrZnh","workspace_shape":"flat","status":"running"}}
{"t":371,"kind":"WORKSPACE_BOUND","payload":{"request_id":"1a5dee8066b1","session_id":"378c4658341b","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-JwrZnh","shape":"flat"}}
{"t":371,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"ed88f1f8a204","session_id":"378c4658341b","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-JwrZnh","shape":"flat"}}
{"t":371,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"ed88f1f8a204","session_id":"378c4658341b"}}
{"t":378,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ed88f1f8a204-status","byte":64}}
{"t":432,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"ed88f1f8a204"}}
{"t":533,"kind":"PROMPT_CHANGED","payload":{"pane_id":"ed88f1f8a204","length":1}}
{"t":648,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"ed88f1f8a204","from_index":0,"to_index":1}}
{"t":712,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"ed88f1f8a204","from_index":1,"to_index":2}}
{"t":779,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"ed88f1f8a204","from_index":2,"to_index":1}}
{"t":891,"kind":"SLASH_ROUTER_CLOSED","payload":{"pane_id":"ed88f1f8a204"}}
{"t":993,"kind":"PROMPT_CHANGED","payload":{"pane_id":"ed88f1f8a204","length":0}}
{"t":1104,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"ed88f1f8a204"}}
{"t":1206,"kind":"PROMPT_CHANGED","payload":{"pane_id":"ed88f1f8a204","length":1}}
{"t":1264,"kind":"SLASH_COMMAND_ROUTED","payload":{"pane_id":"ed88f1f8a204","command":"/list","arg_length":0}}
{"t":1476,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"ed88f1f8a204"}}
{"t":1635,"kind":"SLASH_ROUTER_CLOSED","payload":{"pane_id":"ed88f1f8a204"}}
```
