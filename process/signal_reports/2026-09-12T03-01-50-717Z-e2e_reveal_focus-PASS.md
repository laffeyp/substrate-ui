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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"dade20e0a51e"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"5c6db1362ced","window_id":"dade20e0a51e","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"5c6db1362ced","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":29,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":364,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"0be8dc7f47b3","driver":"deterministic"}}
{"t":365,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"0be8dc7f47b3","driver":"deterministic","context_tokens":null}}
{"t":365,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"5a7474babf3b","pane_id":"5c6db1362ced","session_id":"b4489a5ad0f2","name":"session-b4489a","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-9ux9pQ","workspace_shape":"flat","bundle":"","seed":""}}
{"t":367,"kind":"SESSION_CREATED","payload":{"request_id":"5a7474babf3b","session_id":"b4489a5ad0f2","name":"session-b4489a","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-9ux9pQ","workspace_shape":"flat","status":"running"}}
{"t":367,"kind":"WORKSPACE_BOUND","payload":{"request_id":"5a7474babf3b","session_id":"b4489a5ad0f2","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-9ux9pQ","shape":"flat"}}
{"t":367,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"5c6db1362ced","session_id":"b4489a5ad0f2","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-9ux9pQ","shape":"flat"}}
{"t":367,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"5c6db1362ced","session_id":"b4489a5ad0f2"}}
{"t":372,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-status","byte":64}}
{"t":432,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"5c6db1362ced","from":"terminal","to":"reveal"}}
{"t":438,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-reveal","byte":128}}
{"t":655,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"5c6db1362ced","from":"transcript","to":"stream"}}
{"t":813,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"5c6db1362ced","from":"stream","to":"transcript"}}
{"t":970,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"5c6db1362ced","from":"transcript","to":"stream"}}
{"t":974,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"5c6db1362ced","from":"stream","to":"transcript"}}
{"t":1134,"kind":"PANE_SPLIT","payload":{"from_pane_id":"5c6db1362ced","new_pane_id":"f827e680eb8c","axis":"row"}}
{"t":1134,"kind":"PANE_CREATED","payload":{"pane_id":"f827e680eb8c","window_id":"dade20e0a51e","session_id":null,"from_split":"caf6bc5a9f81"}}
{"t":1134,"kind":"PANE_FOCUSED","payload":{"pane_id":"f827e680eb8c","prior_pane_id":"5c6db1362ced"}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-focus","byte":128}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-status","byte":64}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-reveal","byte":128}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-lens","byte":0}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-level","byte":0}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-dir","byte":0}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-descent","byte":0}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-surface","byte":0}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-find","byte":0}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-inspect","byte":0}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-header-popover","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-focus","byte":255}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-status","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-reveal","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-lens","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-level","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-dir","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-descent","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-surface","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-find","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-inspect","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-header-popover","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-focus","byte":128}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-status","byte":64}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-reveal","byte":128}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-lens","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-level","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-dir","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-descent","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-surface","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-find","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-inspect","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-header-popover","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-focus","byte":255}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-status","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-reveal","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-lens","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-level","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-dir","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-descent","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-surface","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-find","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-inspect","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-header-popover","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-focus","byte":128}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-status","byte":64}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-reveal","byte":128}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-lens","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-level","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-dir","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-descent","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-surface","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-find","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-inspect","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c6db1362ced-header-popover","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-focus","byte":255}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-status","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-reveal","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-lens","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-level","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-dir","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-descent","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-surface","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-find","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-inspect","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-header-popover","byte":0}}
{"t":1482,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"aa8b3c1dcd7a","driver":"deterministic"}}
{"t":1483,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"aa8b3c1dcd7a","driver":"deterministic","context_tokens":null}}
{"t":1483,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"34fb95ca3d8a","pane_id":"f827e680eb8c","session_id":"e33842542cf9","name":"session-e33842","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-4JvPVz","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1485,"kind":"SESSION_CREATED","payload":{"request_id":"34fb95ca3d8a","session_id":"e33842542cf9","name":"session-e33842","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-4JvPVz","workspace_shape":"flat","status":"running"}}
{"t":1485,"kind":"WORKSPACE_BOUND","payload":{"request_id":"34fb95ca3d8a","session_id":"e33842542cf9","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-4JvPVz","shape":"flat"}}
{"t":1485,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"f827e680eb8c","session_id":"e33842542cf9","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-4JvPVz","shape":"flat"}}
{"t":1485,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"f827e680eb8c","session_id":"e33842542cf9"}}
{"t":1488,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-status","byte":64}}
{"t":1507,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"f827e680eb8c","from":"terminal","to":"reveal"}}
{"t":1512,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-f827e680eb8c-reveal","byte":128}}
{"t":1816,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"f827e680eb8c","from":"transcript","to":"stream"}}
```
