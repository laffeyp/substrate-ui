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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"bf0938bb0980"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"21c28e54e9e6","window_id":"bf0938bb0980","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"21c28e54e9e6","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":374,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"07647fcfa585","driver":"deterministic"}}
{"t":375,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"07647fcfa585","driver":"deterministic","context_tokens":null}}
{"t":375,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"562365eb3cf1","pane_id":"21c28e54e9e6","session_id":"a6f3829403b5","name":"session-a6f382","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-S6u2r2","workspace_shape":"flat","bundle":"","seed":""}}
{"t":377,"kind":"SESSION_CREATED","payload":{"request_id":"562365eb3cf1","session_id":"a6f3829403b5","name":"session-a6f382","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-S6u2r2","workspace_shape":"flat","status":"running"}}
{"t":377,"kind":"WORKSPACE_BOUND","payload":{"request_id":"562365eb3cf1","session_id":"a6f3829403b5","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-S6u2r2","shape":"flat"}}
{"t":377,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"21c28e54e9e6","session_id":"a6f3829403b5","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-S6u2r2","shape":"flat"}}
{"t":377,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"21c28e54e9e6","session_id":"a6f3829403b5"}}
{"t":384,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-status","byte":64}}
{"t":436,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"21c28e54e9e6","from":"terminal","to":"reveal"}}
{"t":441,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-reveal","byte":128}}
{"t":656,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"21c28e54e9e6","from":"transcript","to":"stream"}}
{"t":816,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"21c28e54e9e6","from":"stream","to":"transcript"}}
{"t":974,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"21c28e54e9e6","from":"transcript","to":"stream"}}
{"t":978,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"21c28e54e9e6","from":"stream","to":"transcript"}}
{"t":1133,"kind":"PANE_SPLIT","payload":{"from_pane_id":"21c28e54e9e6","new_pane_id":"40acd527ea1a","axis":"row"}}
{"t":1133,"kind":"PANE_CREATED","payload":{"pane_id":"40acd527ea1a","window_id":"bf0938bb0980","session_id":null,"from_split":"5d8b404122c5"}}
{"t":1133,"kind":"PANE_FOCUSED","payload":{"pane_id":"40acd527ea1a","prior_pane_id":"21c28e54e9e6"}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-focus","byte":128}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-status","byte":64}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-reveal","byte":128}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-lens","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-level","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-dir","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-descent","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-surface","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-find","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-inspect","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-header_popover","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-focus","byte":255}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-status","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-reveal","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-lens","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-level","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-dir","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-descent","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-surface","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-find","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-inspect","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-header_popover","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-focus","byte":128}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-status","byte":64}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-reveal","byte":128}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-lens","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-level","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-dir","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-descent","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-surface","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-find","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-inspect","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-header_popover","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-focus","byte":255}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-status","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-reveal","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-lens","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-level","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-dir","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-descent","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-surface","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-find","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-inspect","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-header_popover","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-focus","byte":128}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-status","byte":64}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-reveal","byte":128}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-lens","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-level","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-dir","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-descent","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-surface","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-find","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-inspect","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-21c28e54e9e6-header_popover","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-focus","byte":255}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-status","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-reveal","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-lens","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-level","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-dir","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-descent","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-surface","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-find","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-inspect","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-header_popover","byte":0}}
{"t":1469,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"3669a706cbdc","driver":"deterministic"}}
{"t":1471,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"3669a706cbdc","driver":"deterministic","context_tokens":null}}
{"t":1471,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"2eefbaf98b2e","pane_id":"40acd527ea1a","session_id":"61ca86cdcb14","name":"session-61ca86","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-d0DJh6","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1473,"kind":"SESSION_CREATED","payload":{"request_id":"2eefbaf98b2e","session_id":"61ca86cdcb14","name":"session-61ca86","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-d0DJh6","workspace_shape":"flat","status":"running"}}
{"t":1473,"kind":"WORKSPACE_BOUND","payload":{"request_id":"2eefbaf98b2e","session_id":"61ca86cdcb14","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-d0DJh6","shape":"flat"}}
{"t":1473,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"40acd527ea1a","session_id":"61ca86cdcb14","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-d0DJh6","shape":"flat"}}
{"t":1473,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"40acd527ea1a","session_id":"61ca86cdcb14"}}
{"t":1475,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-status","byte":64}}
{"t":1495,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"40acd527ea1a","from":"terminal","to":"reveal"}}
{"t":1500,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-40acd527ea1a-reveal","byte":128}}
{"t":1807,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"40acd527ea1a","from":"transcript","to":"stream"}}
```
