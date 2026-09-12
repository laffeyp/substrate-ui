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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"2e535d2d54bf"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"69c1e8288dad","window_id":"2e535d2d54bf","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"69c1e8288dad","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-header-popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":365,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"83b8f7d72247","driver":"deterministic"}}
{"t":366,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"83b8f7d72247","driver":"deterministic","context_tokens":null}}
{"t":366,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"bcb862242ee2","pane_id":"69c1e8288dad","session_id":"bc983eaea83e","name":"session-bc983e","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-SJvmai","workspace_shape":"flat","bundle":"","seed":""}}
{"t":367,"kind":"SESSION_CREATED","payload":{"request_id":"bcb862242ee2","session_id":"bc983eaea83e","name":"session-bc983e","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-SJvmai","workspace_shape":"flat","status":"running"}}
{"t":367,"kind":"WORKSPACE_BOUND","payload":{"request_id":"bcb862242ee2","session_id":"bc983eaea83e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-SJvmai","shape":"flat"}}
{"t":367,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"69c1e8288dad","session_id":"bc983eaea83e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-SJvmai","shape":"flat"}}
{"t":367,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"69c1e8288dad","session_id":"bc983eaea83e"}}
{"t":373,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-69c1e8288dad-status","byte":64}}
{"t":439,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"69c1e8288dad"}}
{"t":540,"kind":"PROMPT_CHANGED","payload":{"pane_id":"69c1e8288dad","length":1}}
{"t":651,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"69c1e8288dad","from_index":0,"to_index":1}}
{"t":716,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"69c1e8288dad","from_index":1,"to_index":2}}
{"t":782,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"69c1e8288dad","from_index":2,"to_index":1}}
{"t":893,"kind":"SLASH_ROUTER_CLOSED","payload":{"pane_id":"69c1e8288dad"}}
{"t":995,"kind":"PROMPT_CHANGED","payload":{"pane_id":"69c1e8288dad","length":0}}
{"t":1105,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"69c1e8288dad"}}
{"t":1207,"kind":"PROMPT_CHANGED","payload":{"pane_id":"69c1e8288dad","length":1}}
{"t":1260,"kind":"SLASH_COMMAND_ROUTED","payload":{"pane_id":"69c1e8288dad","command":"/list","arg_length":0}}
{"t":1477,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"69c1e8288dad"}}
{"t":1637,"kind":"SLASH_ROUTER_CLOSED","payload":{"pane_id":"69c1e8288dad"}}
```
