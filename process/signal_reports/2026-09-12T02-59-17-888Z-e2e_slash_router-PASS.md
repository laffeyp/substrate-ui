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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"87e14b0c6e53"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"0a679a56a922","window_id":"87e14b0c6e53","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"0a679a56a922","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":27,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":359,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"53a9f4d1f70f","driver":"deterministic"}}
{"t":360,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"53a9f4d1f70f","driver":"deterministic","context_tokens":null}}
{"t":360,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"ec4a5298055a","pane_id":"0a679a56a922","session_id":"d6124724da6d","name":"session-d61247","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-USjIrY","workspace_shape":"flat","bundle":"","seed":""}}
{"t":362,"kind":"SESSION_CREATED","payload":{"request_id":"ec4a5298055a","session_id":"d6124724da6d","name":"session-d61247","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-USjIrY","workspace_shape":"flat","status":"running"}}
{"t":362,"kind":"WORKSPACE_BOUND","payload":{"request_id":"ec4a5298055a","session_id":"d6124724da6d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-USjIrY","shape":"flat"}}
{"t":362,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"0a679a56a922","session_id":"d6124724da6d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-USjIrY","shape":"flat"}}
{"t":362,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"0a679a56a922","session_id":"d6124724da6d"}}
{"t":370,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0a679a56a922-status","byte":64}}
{"t":425,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"0a679a56a922"}}
{"t":525,"kind":"PROMPT_CHANGED","payload":{"pane_id":"0a679a56a922","length":1}}
{"t":638,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"0a679a56a922","from_index":0,"to_index":1}}
{"t":703,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"0a679a56a922","from_index":1,"to_index":2}}
{"t":767,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"0a679a56a922","from_index":2,"to_index":1}}
{"t":880,"kind":"SLASH_ROUTER_CLOSED","payload":{"pane_id":"0a679a56a922"}}
{"t":982,"kind":"PROMPT_CHANGED","payload":{"pane_id":"0a679a56a922","length":0}}
{"t":1095,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"0a679a56a922"}}
{"t":1196,"kind":"PROMPT_CHANGED","payload":{"pane_id":"0a679a56a922","length":1}}
{"t":1251,"kind":"SLASH_COMMAND_ROUTED","payload":{"pane_id":"0a679a56a922","command":"/list","arg_length":0}}
{"t":1470,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"0a679a56a922"}}
{"t":1629,"kind":"SLASH_ROUTER_CLOSED","payload":{"pane_id":"0a679a56a922"}}
```
