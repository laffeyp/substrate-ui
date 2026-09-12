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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"f29d84339011"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"ecd00192f369","window_id":"f29d84339011","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"ecd00192f369","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-header-popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":30,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":368,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"8caa66f7cde3","driver":"deterministic"}}
{"t":369,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"8caa66f7cde3","driver":"deterministic","context_tokens":null}}
{"t":369,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"7d8d995e01b0","pane_id":"ecd00192f369","session_id":"5ef18185cd49","name":"session-5ef181","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-0J3khK","workspace_shape":"flat","bundle":"","seed":""}}
{"t":370,"kind":"SESSION_CREATED","payload":{"request_id":"7d8d995e01b0","session_id":"5ef18185cd49","name":"session-5ef181","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-0J3khK","workspace_shape":"flat","status":"running"}}
{"t":370,"kind":"WORKSPACE_BOUND","payload":{"request_id":"7d8d995e01b0","session_id":"5ef18185cd49","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-0J3khK","shape":"flat"}}
{"t":370,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"ecd00192f369","session_id":"5ef18185cd49","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-slash_router-ws-0J3khK","shape":"flat"}}
{"t":370,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"ecd00192f369","session_id":"5ef18185cd49"}}
{"t":379,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ecd00192f369-status","byte":64}}
{"t":434,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"ecd00192f369"}}
{"t":535,"kind":"PROMPT_CHANGED","payload":{"pane_id":"ecd00192f369","length":1}}
{"t":650,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"ecd00192f369","from_index":0,"to_index":1}}
{"t":716,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"ecd00192f369","from_index":1,"to_index":2}}
{"t":783,"kind":"SLASH_ROUTER_WALKED","payload":{"pane_id":"ecd00192f369","from_index":2,"to_index":1}}
{"t":894,"kind":"SLASH_ROUTER_CLOSED","payload":{"pane_id":"ecd00192f369"}}
{"t":995,"kind":"PROMPT_CHANGED","payload":{"pane_id":"ecd00192f369","length":0}}
{"t":1105,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"ecd00192f369"}}
{"t":1207,"kind":"PROMPT_CHANGED","payload":{"pane_id":"ecd00192f369","length":1}}
{"t":1260,"kind":"SLASH_COMMAND_ROUTED","payload":{"pane_id":"ecd00192f369","command":"/list","arg_length":0}}
{"t":1478,"kind":"SLASH_ROUTER_OPENED","payload":{"pane_id":"ecd00192f369"}}
{"t":1639,"kind":"SLASH_ROUTER_CLOSED","payload":{"pane_id":"ecd00192f369"}}
```
