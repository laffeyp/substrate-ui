# Signal report — e2e_reveal_focus

Outcome: **PASS**
Summary: e2e_reveal_focus — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 147 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"81740a638ad5"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"5a5271badc81","window_id":"81740a638ad5","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"5a5271badc81","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":28,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":421,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"127b17d95723","driver":"deterministic"}}
{"t":422,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"127b17d95723","driver":"deterministic","context_tokens":null}}
{"t":422,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"9e8815fac5d8","pane_id":"5a5271badc81","session_id":"14ac88f655bf","name":"session-14ac88","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-NMeOwr","workspace_shape":"flat","bundle":"","seed":""}}
{"t":423,"kind":"SESSION_CREATED","payload":{"request_id":"9e8815fac5d8","session_id":"14ac88f655bf","name":"session-14ac88","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-NMeOwr","workspace_shape":"flat","status":"running"}}
{"t":423,"kind":"WORKSPACE_BOUND","payload":{"request_id":"9e8815fac5d8","session_id":"14ac88f655bf","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-NMeOwr","shape":"flat"}}
{"t":423,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"5a5271badc81","session_id":"14ac88f655bf","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-NMeOwr","shape":"flat"}}
{"t":423,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"5a5271badc81","session_id":"14ac88f655bf"}}
{"t":430,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-status","byte":64}}
{"t":486,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"5a5271badc81","from":"terminal","to":"reveal"}}
{"t":487,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-reveal","byte":128}}
{"t":698,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"5a5271badc81","from":"transcript","to":"stream"}}
{"t":857,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"5a5271badc81","from":"stream","to":"transcript"}}
{"t":1012,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"5a5271badc81","from":"transcript","to":"stream"}}
{"t":1014,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"5a5271badc81","from":"stream","to":"transcript"}}
{"t":1170,"kind":"PANE_SPLIT","payload":{"from_pane_id":"5a5271badc81","new_pane_id":"85c5239ca19d","axis":"row"}}
{"t":1170,"kind":"PANE_CREATED","payload":{"pane_id":"85c5239ca19d","window_id":"81740a638ad5","session_id":null,"from_split":"1dca1739aab1"}}
{"t":1170,"kind":"PANE_FOCUSED","payload":{"pane_id":"85c5239ca19d","prior_pane_id":"5a5271badc81"}}
{"t":1175,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-focus","byte":128}}
{"t":1175,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-status","byte":64}}
{"t":1175,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-reveal","byte":128}}
{"t":1175,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-lens","byte":0}}
{"t":1175,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-level","byte":0}}
{"t":1175,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-dir","byte":0}}
{"t":1175,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-descent","byte":0}}
{"t":1175,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-surface","byte":0}}
{"t":1175,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-find","byte":0}}
{"t":1175,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-inspect","byte":0}}
{"t":1175,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-header_popover","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-focus","byte":255}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-status","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-reveal","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-lens","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-level","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-dir","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-descent","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-surface","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-find","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-inspect","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-header_popover","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-focus","byte":128}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-status","byte":64}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-reveal","byte":128}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-lens","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-level","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-dir","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-descent","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-surface","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-find","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-inspect","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-header_popover","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-focus","byte":255}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-status","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-reveal","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-lens","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-level","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-dir","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-descent","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-surface","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-find","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-inspect","byte":0}}
{"t":1176,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-header_popover","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-focus","byte":128}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-status","byte":64}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-reveal","byte":128}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-lens","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-level","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-dir","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-descent","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-surface","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-find","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-inspect","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5a5271badc81-header_popover","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-focus","byte":255}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-status","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-reveal","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-lens","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-level","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-dir","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-descent","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-surface","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-find","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-inspect","byte":0}}
{"t":1177,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-header_popover","byte":0}}
{"t":1508,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"9a0fc501a39a","driver":"deterministic"}}
{"t":1509,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"9a0fc501a39a","driver":"deterministic","context_tokens":null}}
{"t":1509,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"a8f78d491b34","pane_id":"85c5239ca19d","session_id":"e48461c24374","name":"session-e48461","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-n3Z9zE","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1511,"kind":"SESSION_CREATED","payload":{"request_id":"a8f78d491b34","session_id":"e48461c24374","name":"session-e48461","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-n3Z9zE","workspace_shape":"flat","status":"running"}}
{"t":1511,"kind":"WORKSPACE_BOUND","payload":{"request_id":"a8f78d491b34","session_id":"e48461c24374","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-n3Z9zE","shape":"flat"}}
{"t":1511,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"85c5239ca19d","session_id":"e48461c24374","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-n3Z9zE","shape":"flat"}}
{"t":1511,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"85c5239ca19d","session_id":"e48461c24374"}}
{"t":1517,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-status","byte":64}}
{"t":1528,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"85c5239ca19d","from":"terminal","to":"reveal"}}
{"t":1533,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-85c5239ca19d-reveal","byte":128}}
{"t":1838,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"85c5239ca19d","from":"transcript","to":"stream"}}
```
