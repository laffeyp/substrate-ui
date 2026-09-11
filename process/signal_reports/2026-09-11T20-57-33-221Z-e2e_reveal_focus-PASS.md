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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"a07f0fc83d3a"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"9062324c8b07","window_id":"a07f0fc83d3a","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"9062324c8b07","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-header_popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":27,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":356,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"08ff2d977bef","driver":"deterministic"}}
{"t":358,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"08ff2d977bef","driver":"deterministic","context_tokens":null}}
{"t":358,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"c43ea9d251a5","pane_id":"9062324c8b07","session_id":"edef7ab18a86","name":"session-edef7a","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-MV6sJS","workspace_shape":"flat","bundle":"","seed":""}}
{"t":360,"kind":"SESSION_CREATED","payload":{"request_id":"c43ea9d251a5","session_id":"edef7ab18a86","name":"session-edef7a","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-MV6sJS","workspace_shape":"flat","status":"running"}}
{"t":360,"kind":"WORKSPACE_BOUND","payload":{"request_id":"c43ea9d251a5","session_id":"edef7ab18a86","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-MV6sJS","shape":"flat"}}
{"t":360,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"9062324c8b07","session_id":"edef7ab18a86","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-MV6sJS","shape":"flat"}}
{"t":360,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"9062324c8b07","session_id":"edef7ab18a86"}}
{"t":362,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-status","byte":64}}
{"t":422,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9062324c8b07","from":"terminal","to":"reveal"}}
{"t":427,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-reveal","byte":128}}
{"t":633,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"9062324c8b07","from":"transcript","to":"stream"}}
{"t":789,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"9062324c8b07","from":"stream","to":"transcript"}}
{"t":947,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"9062324c8b07","from":"transcript","to":"stream"}}
{"t":951,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"9062324c8b07","from":"stream","to":"transcript"}}
{"t":1109,"kind":"PANE_SPLIT","payload":{"from_pane_id":"9062324c8b07","new_pane_id":"260493e8bd3c","axis":"row"}}
{"t":1109,"kind":"PANE_CREATED","payload":{"pane_id":"260493e8bd3c","window_id":"a07f0fc83d3a","session_id":null,"from_split":"9323820147b2"}}
{"t":1109,"kind":"PANE_FOCUSED","payload":{"pane_id":"260493e8bd3c","prior_pane_id":"9062324c8b07"}}
{"t":1115,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-focus","byte":128}}
{"t":1115,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-status","byte":64}}
{"t":1115,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-reveal","byte":128}}
{"t":1115,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-lens","byte":0}}
{"t":1115,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-level","byte":0}}
{"t":1115,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-dir","byte":0}}
{"t":1115,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-descent","byte":0}}
{"t":1115,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-surface","byte":0}}
{"t":1115,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-find","byte":0}}
{"t":1115,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-inspect","byte":0}}
{"t":1115,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-header_popover","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-focus","byte":255}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-status","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-reveal","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-lens","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-level","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-dir","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-descent","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-surface","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-find","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-inspect","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-header_popover","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-focus","byte":128}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-status","byte":64}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-reveal","byte":128}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-lens","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-level","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-dir","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-descent","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-surface","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-find","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-inspect","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-header_popover","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-focus","byte":255}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-status","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-reveal","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-lens","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-level","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-dir","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-descent","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-surface","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-find","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-inspect","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-header_popover","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-focus","byte":128}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-status","byte":64}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-reveal","byte":128}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-lens","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-level","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-dir","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-descent","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-surface","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-find","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-inspect","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9062324c8b07-header_popover","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-focus","byte":255}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-status","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-reveal","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-lens","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-level","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-dir","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-descent","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-surface","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-find","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-inspect","byte":0}}
{"t":1118,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-header_popover","byte":0}}
{"t":1456,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"92d4bf02ff76","driver":"deterministic"}}
{"t":1457,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"92d4bf02ff76","driver":"deterministic","context_tokens":null}}
{"t":1457,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"76d7123ca194","pane_id":"260493e8bd3c","session_id":"7dcc178d38d8","name":"session-7dcc17","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-eBAqRi","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1460,"kind":"SESSION_CREATED","payload":{"request_id":"76d7123ca194","session_id":"7dcc178d38d8","name":"session-7dcc17","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-eBAqRi","workspace_shape":"flat","status":"running"}}
{"t":1460,"kind":"WORKSPACE_BOUND","payload":{"request_id":"76d7123ca194","session_id":"7dcc178d38d8","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-eBAqRi","shape":"flat"}}
{"t":1460,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"260493e8bd3c","session_id":"7dcc178d38d8","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-eBAqRi","shape":"flat"}}
{"t":1460,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"260493e8bd3c","session_id":"7dcc178d38d8"}}
{"t":1469,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-status","byte":64}}
{"t":1505,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"260493e8bd3c","from":"terminal","to":"reveal"}}
{"t":1510,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-260493e8bd3c-reveal","byte":128}}
{"t":1816,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"260493e8bd3c","from":"transcript","to":"stream"}}
```
