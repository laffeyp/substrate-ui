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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"daaa86cd47fe"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"f4c57b8fbc31","window_id":"daaa86cd47fe","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"f4c57b8fbc31","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-focus","byte":255}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-status","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-lens","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-level","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-dir","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-descent","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-surface","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-find","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-inspect","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-header_popover","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-focus","byte":255}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-status","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-lens","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-level","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-header_popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-header_popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":26,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":356,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"ff7b54070f8e","driver":"deterministic"}}
{"t":357,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"ff7b54070f8e","driver":"deterministic","context_tokens":null}}
{"t":357,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"f014e100d07e","pane_id":"f4c57b8fbc31","session_id":"bcf845fb3f3b","name":"session-bcf845","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-y2NCc0","workspace_shape":"flat","bundle":"","seed":""}}
{"t":359,"kind":"SESSION_CREATED","payload":{"request_id":"f014e100d07e","session_id":"bcf845fb3f3b","name":"session-bcf845","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-y2NCc0","workspace_shape":"flat","status":"running"}}
{"t":359,"kind":"WORKSPACE_BOUND","payload":{"request_id":"f014e100d07e","session_id":"bcf845fb3f3b","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-y2NCc0","shape":"flat"}}
{"t":359,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"f4c57b8fbc31","session_id":"bcf845fb3f3b","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-y2NCc0","shape":"flat"}}
{"t":359,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"f4c57b8fbc31","session_id":"bcf845fb3f3b"}}
{"t":361,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-status","byte":64}}
{"t":421,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"f4c57b8fbc31","from":"terminal","to":"reveal"}}
{"t":428,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":128}}
{"t":696,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"f4c57b8fbc31","from":"reveal","to":"terminal"}}
{"t":701,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":0}}
{"t":923,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"f4c57b8fbc31","from":"terminal","to":"reveal"}}
{"t":927,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":128}}
{"t":948,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"f4c57b8fbc31","from":"reveal","to":"terminal"}}
{"t":951,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":0}}
{"t":972,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"f4c57b8fbc31","from":"terminal","to":"reveal"}}
{"t":977,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":128}}
{"t":996,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"f4c57b8fbc31","from":"reveal","to":"terminal"}}
{"t":1002,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":0}}
{"t":1012,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"f4c57b8fbc31","from":"terminal","to":"reveal"}}
{"t":1018,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":128}}
{"t":1029,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"f4c57b8fbc31","from":"reveal","to":"terminal"}}
{"t":1035,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":0}}
{"t":1045,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"f4c57b8fbc31","from":"terminal","to":"reveal"}}
{"t":1051,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":128}}
{"t":1061,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"f4c57b8fbc31","from":"reveal","to":"terminal"}}
{"t":1068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":0}}
{"t":1078,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"f4c57b8fbc31","from":"terminal","to":"reveal"}}
{"t":1085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":128}}
{"t":1095,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"f4c57b8fbc31","from":"reveal","to":"terminal"}}
{"t":1101,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f4c57b8fbc31-reveal","byte":0}}
```
