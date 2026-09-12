# Signal report — e2e_records_surface

Outcome: **PASS**
Summary: e2e_records_surface — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 65 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"8a2859c637cb"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"0fea1180444f","window_id":"8a2859c637cb","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"0fea1180444f","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":364,"kind":"SURFACE_OPENED","payload":{"pane_id":"0fea1180444f","kind":"records","prior_kind":null}}
{"t":366,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-surface","byte":1}}
{"t":812,"kind":"SURFACE_CLOSED","payload":{"pane_id":"0fea1180444f","kind":"records"}}
{"t":815,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-surface","byte":0}}
{"t":1124,"kind":"SURFACE_OPENED","payload":{"pane_id":"0fea1180444f","kind":"records","prior_kind":null}}
{"t":1126,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-surface","byte":1}}
{"t":1689,"kind":"SURFACE_CLOSED","payload":{"pane_id":"0fea1180444f","kind":"records"}}
{"t":1693,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-surface","byte":0}}
{"t":1694,"kind":"WORKSPACE_BOUND","payload":{"request_id":"9dc9611331a1","session_id":"627a2a6edcae","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-records-ws-KOe6hO","shape":"flat"}}
{"t":1694,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"0fea1180444f","session_id":"627a2a6edcae","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-records-ws-KOe6hO","shape":"flat"}}
{"t":1694,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"0fea1180444f","session_id":"627a2a6edcae"}}
{"t":1699,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fea1180444f-status","byte":64}}
```
