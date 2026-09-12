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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"4c692df99770"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"527ff5c96fa7","window_id":"4c692df99770","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"527ff5c96fa7","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":367,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"e524243032c2","driver":"deterministic"}}
{"t":372,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"e524243032c2","driver":"deterministic","context_tokens":null}}
{"t":372,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"d1944cf9d2b3","pane_id":"527ff5c96fa7","session_id":"2b9c4a0ae971","name":"session-2b9c4a","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-XUX7eK","workspace_shape":"flat","bundle":"","seed":""}}
{"t":373,"kind":"SESSION_CREATED","payload":{"request_id":"d1944cf9d2b3","session_id":"2b9c4a0ae971","name":"session-2b9c4a","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-XUX7eK","workspace_shape":"flat","status":"running"}}
{"t":373,"kind":"WORKSPACE_BOUND","payload":{"request_id":"d1944cf9d2b3","session_id":"2b9c4a0ae971","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-XUX7eK","shape":"flat"}}
{"t":373,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"527ff5c96fa7","session_id":"2b9c4a0ae971","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-XUX7eK","shape":"flat"}}
{"t":373,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"527ff5c96fa7","session_id":"2b9c4a0ae971"}}
{"t":380,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ff5c96fa7-status","byte":64}}
{"t":435,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"527ff5c96fa7"}}
{"t":536,"kind":"PROMPT_CHANGED","payload":{"pane_id":"527ff5c96fa7","length":1}}
{"t":649,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"527ff5c96fa7","from_index":0,"to_index":1}}
{"t":714,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"527ff5c96fa7","from_index":1,"to_index":2}}
{"t":780,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"527ff5c96fa7","from_index":2,"to_index":1}}
{"t":907,"kind":"SLASH_ROUTER_CLOSED","payload":{"pane_id":"527ff5c96fa7"}}
{"t":1009,"kind":"PROMPT_CHANGED","payload":{"pane_id":"527ff5c96fa7","length":0}}
{"t":1115,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"527ff5c96fa7"}}
{"t":1217,"kind":"PROMPT_CHANGED","payload":{"pane_id":"527ff5c96fa7","length":1}}
{"t":1270,"kind":"SLASH_COMMAND_ROUTED","payload":{"pane_id":"527ff5c96fa7","command":"/list","arg_length":0}}
{"t":1488,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"527ff5c96fa7"}}
{"t":1646,"kind":"SLASH_ROUTER_CLOSED","payload":{"pane_id":"527ff5c96fa7"}}
```
