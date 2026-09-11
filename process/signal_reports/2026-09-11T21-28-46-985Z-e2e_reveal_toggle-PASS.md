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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"4b664721d987"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"c881551e036a","window_id":"4b664721d987","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"c881551e036a","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-header_popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":26,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":357,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"4d483a766306","driver":"deterministic"}}
{"t":358,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"4d483a766306","driver":"deterministic","context_tokens":null}}
{"t":358,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"9d0e77a15f47","pane_id":"c881551e036a","session_id":"822e14ceeff6","name":"session-822e14","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-7ZOgJW","workspace_shape":"flat","bundle":"","seed":""}}
{"t":360,"kind":"SESSION_CREATED","payload":{"request_id":"9d0e77a15f47","session_id":"822e14ceeff6","name":"session-822e14","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-7ZOgJW","workspace_shape":"flat","status":"running"}}
{"t":360,"kind":"WORKSPACE_BOUND","payload":{"request_id":"9d0e77a15f47","session_id":"822e14ceeff6","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-7ZOgJW","shape":"flat"}}
{"t":360,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"c881551e036a","session_id":"822e14ceeff6","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-7ZOgJW","shape":"flat"}}
{"t":360,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"c881551e036a","session_id":"822e14ceeff6"}}
{"t":368,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-status","byte":64}}
{"t":429,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c881551e036a","from":"terminal","to":"reveal"}}
{"t":434,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":128}}
{"t":689,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c881551e036a","from":"reveal","to":"terminal"}}
{"t":694,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":0}}
{"t":913,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c881551e036a","from":"terminal","to":"reveal"}}
{"t":918,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":128}}
{"t":938,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c881551e036a","from":"reveal","to":"terminal"}}
{"t":942,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":0}}
{"t":962,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c881551e036a","from":"terminal","to":"reveal"}}
{"t":968,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":128}}
{"t":978,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c881551e036a","from":"reveal","to":"terminal"}}
{"t":984,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":0}}
{"t":995,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c881551e036a","from":"terminal","to":"reveal"}}
{"t":1001,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":128}}
{"t":1011,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c881551e036a","from":"reveal","to":"terminal"}}
{"t":1018,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":0}}
{"t":1028,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c881551e036a","from":"terminal","to":"reveal"}}
{"t":1034,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":128}}
{"t":1044,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c881551e036a","from":"reveal","to":"terminal"}}
{"t":1051,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":0}}
{"t":1061,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c881551e036a","from":"terminal","to":"reveal"}}
{"t":1067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":128}}
{"t":1078,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"c881551e036a","from":"reveal","to":"terminal"}}
{"t":1084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c881551e036a-reveal","byte":0}}
```
