# Signal report — e2e_reveal_toggle

Outcome: **PASS**
Summary: e2e_reveal_toggle — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 85 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"464a66d22d50"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"dba1f3b16bf2","window_id":"464a66d22d50","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"dba1f3b16bf2","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":23,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":357,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"baf0ef222805","driver":"deterministic"}}
{"t":358,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"baf0ef222805","driver":"deterministic","context_tokens":null}}
{"t":358,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"bcb61d78250a","pane_id":"dba1f3b16bf2","session_id":"c64f100071f2","name":"session-c64f10","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-rELRZR","workspace_shape":"flat","bundle":"","seed":""}}
{"t":360,"kind":"SESSION_CREATED","payload":{"request_id":"bcb61d78250a","session_id":"c64f100071f2","name":"session-c64f10","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-rELRZR","workspace_shape":"flat","status":"running"}}
{"t":360,"kind":"WORKSPACE_BOUND","payload":{"request_id":"bcb61d78250a","session_id":"c64f100071f2","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-rELRZR","shape":"flat"}}
{"t":360,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"dba1f3b16bf2","session_id":"c64f100071f2","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-rELRZR","shape":"flat"}}
{"t":360,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"dba1f3b16bf2","session_id":"c64f100071f2"}}
{"t":365,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-status","byte":64}}
{"t":426,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"dba1f3b16bf2","from":"terminal","to":"reveal"}}
{"t":431,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":128}}
{"t":694,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"dba1f3b16bf2","from":"reveal","to":"terminal"}}
{"t":698,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":0}}
{"t":919,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"dba1f3b16bf2","from":"terminal","to":"reveal"}}
{"t":923,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":128}}
{"t":945,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"dba1f3b16bf2","from":"reveal","to":"terminal"}}
{"t":948,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":0}}
{"t":968,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"dba1f3b16bf2","from":"terminal","to":"reveal"}}
{"t":973,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":128}}
{"t":984,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"dba1f3b16bf2","from":"reveal","to":"terminal"}}
{"t":990,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":0}}
{"t":1000,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"dba1f3b16bf2","from":"terminal","to":"reveal"}}
{"t":1006,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":128}}
{"t":1017,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"dba1f3b16bf2","from":"reveal","to":"terminal"}}
{"t":1023,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":0}}
{"t":1034,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"dba1f3b16bf2","from":"terminal","to":"reveal"}}
{"t":1040,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":128}}
{"t":1050,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"dba1f3b16bf2","from":"reveal","to":"terminal"}}
{"t":1056,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":0}}
{"t":1066,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"dba1f3b16bf2","from":"terminal","to":"reveal"}}
{"t":1073,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":128}}
{"t":1083,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"dba1f3b16bf2","from":"reveal","to":"terminal"}}
{"t":1090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-dba1f3b16bf2-reveal","byte":0}}
```
