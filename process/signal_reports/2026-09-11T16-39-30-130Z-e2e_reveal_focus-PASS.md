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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"c70e0a899be8"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"2e53baa8109f","window_id":"c70e0a899be8","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"2e53baa8109f","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-header_popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":25,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":359,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"1ba04a359f76","driver":"deterministic"}}
{"t":360,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"1ba04a359f76","driver":"deterministic","context_tokens":null}}
{"t":361,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"f19ab3bcfb6d","pane_id":"2e53baa8109f","session_id":"948fb2dec239","name":"session-948fb2","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-BoX4u0","workspace_shape":"flat","bundle":"","seed":""}}
{"t":362,"kind":"SESSION_CREATED","payload":{"request_id":"f19ab3bcfb6d","session_id":"948fb2dec239","name":"session-948fb2","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-BoX4u0","workspace_shape":"flat","status":"running"}}
{"t":362,"kind":"WORKSPACE_BOUND","payload":{"request_id":"f19ab3bcfb6d","session_id":"948fb2dec239","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-BoX4u0","shape":"flat"}}
{"t":362,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"2e53baa8109f","session_id":"948fb2dec239","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-BoX4u0","shape":"flat"}}
{"t":362,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"2e53baa8109f","session_id":"948fb2dec239"}}
{"t":369,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-status","byte":64}}
{"t":421,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"2e53baa8109f","from":"terminal","to":"reveal"}}
{"t":426,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-reveal","byte":128}}
{"t":636,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"2e53baa8109f","from":"transcript","to":"stream"}}
{"t":794,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"2e53baa8109f","from":"stream","to":"transcript"}}
{"t":953,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"2e53baa8109f","from":"transcript","to":"stream"}}
{"t":956,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"2e53baa8109f","from":"stream","to":"transcript"}}
{"t":1112,"kind":"PANE_SPLIT","payload":{"from_pane_id":"2e53baa8109f","new_pane_id":"9481c1a91278","axis":"row"}}
{"t":1113,"kind":"PANE_CREATED","payload":{"pane_id":"9481c1a91278","window_id":"c70e0a899be8","session_id":null,"from_split":"de779367a08a"}}
{"t":1113,"kind":"PANE_FOCUSED","payload":{"pane_id":"9481c1a91278","prior_pane_id":"2e53baa8109f"}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-focus","byte":128}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-status","byte":64}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-reveal","byte":128}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-lens","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-level","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-dir","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-descent","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-surface","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-find","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-inspect","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-header_popover","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-focus","byte":255}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-status","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-reveal","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-lens","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-level","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-dir","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-descent","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-surface","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-find","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-inspect","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-header_popover","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-focus","byte":128}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-status","byte":64}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-reveal","byte":128}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-lens","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-level","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-dir","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-descent","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-surface","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-find","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-inspect","byte":0}}
{"t":1116,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-header_popover","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-focus","byte":255}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-status","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-reveal","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-lens","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-level","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-dir","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-descent","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-surface","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-find","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-inspect","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-header_popover","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-focus","byte":128}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-status","byte":64}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-reveal","byte":128}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-lens","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-level","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-dir","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-descent","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-surface","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-find","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-inspect","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-2e53baa8109f-header_popover","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-focus","byte":255}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-status","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-reveal","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-lens","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-level","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-dir","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-descent","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-surface","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-find","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-inspect","byte":0}}
{"t":1117,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-header_popover","byte":0}}
{"t":1450,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"347ac68c4ca7","driver":"deterministic"}}
{"t":1452,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"347ac68c4ca7","driver":"deterministic","context_tokens":null}}
{"t":1452,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"eecbf830435c","pane_id":"9481c1a91278","session_id":"2e494f74222e","name":"session-2e494f","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-VdGdk1","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1454,"kind":"SESSION_CREATED","payload":{"request_id":"eecbf830435c","session_id":"2e494f74222e","name":"session-2e494f","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-VdGdk1","workspace_shape":"flat","status":"running"}}
{"t":1454,"kind":"WORKSPACE_BOUND","payload":{"request_id":"eecbf830435c","session_id":"2e494f74222e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-VdGdk1","shape":"flat"}}
{"t":1454,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"9481c1a91278","session_id":"2e494f74222e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-VdGdk1","shape":"flat"}}
{"t":1454,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"9481c1a91278","session_id":"2e494f74222e"}}
{"t":1459,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-status","byte":64}}
{"t":1471,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"9481c1a91278","from":"terminal","to":"reveal"}}
{"t":1476,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9481c1a91278-reveal","byte":128}}
{"t":1783,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"9481c1a91278","from":"transcript","to":"stream"}}
```
