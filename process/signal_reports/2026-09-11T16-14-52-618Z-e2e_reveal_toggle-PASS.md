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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"8a42dfd77880"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"89e15665290f","window_id":"8a42dfd77880","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"89e15665290f","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-header_popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":360,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"fc3d8980313a","driver":"deterministic"}}
{"t":361,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"fc3d8980313a","driver":"deterministic","context_tokens":null}}
{"t":361,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"3bc160dc9d07","pane_id":"89e15665290f","session_id":"4b2a9a91a547","name":"session-4b2a9a","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-PBqqFs","workspace_shape":"flat","bundle":"","seed":""}}
{"t":363,"kind":"SESSION_CREATED","payload":{"request_id":"3bc160dc9d07","session_id":"4b2a9a91a547","name":"session-4b2a9a","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-PBqqFs","workspace_shape":"flat","status":"running"}}
{"t":363,"kind":"WORKSPACE_BOUND","payload":{"request_id":"3bc160dc9d07","session_id":"4b2a9a91a547","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-PBqqFs","shape":"flat"}}
{"t":363,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"89e15665290f","session_id":"4b2a9a91a547","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-ws-PBqqFs","shape":"flat"}}
{"t":363,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"89e15665290f","session_id":"4b2a9a91a547"}}
{"t":367,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-status","byte":64}}
{"t":427,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"89e15665290f","from":"terminal","to":"reveal"}}
{"t":433,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":128}}
{"t":688,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"89e15665290f","from":"reveal","to":"terminal"}}
{"t":691,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":0}}
{"t":910,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"89e15665290f","from":"terminal","to":"reveal"}}
{"t":917,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":128}}
{"t":926,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"89e15665290f","from":"reveal","to":"terminal"}}
{"t":933,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":0}}
{"t":943,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"89e15665290f","from":"terminal","to":"reveal"}}
{"t":949,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":128}}
{"t":959,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"89e15665290f","from":"reveal","to":"terminal"}}
{"t":966,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":0}}
{"t":978,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"89e15665290f","from":"terminal","to":"reveal"}}
{"t":982,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":128}}
{"t":1001,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"89e15665290f","from":"reveal","to":"terminal"}}
{"t":1008,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":0}}
{"t":1018,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"89e15665290f","from":"terminal","to":"reveal"}}
{"t":1025,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":128}}
{"t":1034,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"89e15665290f","from":"reveal","to":"terminal"}}
{"t":1041,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":0}}
{"t":1051,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"89e15665290f","from":"terminal","to":"reveal"}}
{"t":1058,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":128}}
{"t":1067,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"89e15665290f","from":"reveal","to":"terminal"}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-89e15665290f-reveal","byte":0}}
```
