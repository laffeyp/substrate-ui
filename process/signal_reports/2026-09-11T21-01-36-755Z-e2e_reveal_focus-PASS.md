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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"8ae672904385"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"237fcae23bbd","window_id":"8ae672904385","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"237fcae23bbd","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":32,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":357,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"983bc33af709","driver":"deterministic"}}
{"t":358,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"983bc33af709","driver":"deterministic","context_tokens":null}}
{"t":358,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"ef9b1918ab33","pane_id":"237fcae23bbd","session_id":"f1c185bb47d2","name":"session-f1c185","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-WQWwbJ","workspace_shape":"flat","bundle":"","seed":""}}
{"t":359,"kind":"SESSION_CREATED","payload":{"request_id":"ef9b1918ab33","session_id":"f1c185bb47d2","name":"session-f1c185","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-WQWwbJ","workspace_shape":"flat","status":"running"}}
{"t":359,"kind":"WORKSPACE_BOUND","payload":{"request_id":"ef9b1918ab33","session_id":"f1c185bb47d2","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-WQWwbJ","shape":"flat"}}
{"t":359,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"237fcae23bbd","session_id":"f1c185bb47d2","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-WQWwbJ","shape":"flat"}}
{"t":359,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"237fcae23bbd","session_id":"f1c185bb47d2"}}
{"t":363,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-status","byte":64}}
{"t":424,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"237fcae23bbd","from":"terminal","to":"reveal"}}
{"t":429,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-reveal","byte":128}}
{"t":645,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"237fcae23bbd","from":"transcript","to":"stream"}}
{"t":806,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"237fcae23bbd","from":"stream","to":"transcript"}}
{"t":964,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"237fcae23bbd","from":"transcript","to":"stream"}}
{"t":968,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"237fcae23bbd","from":"stream","to":"transcript"}}
{"t":1127,"kind":"PANE_SPLIT","payload":{"from_pane_id":"237fcae23bbd","new_pane_id":"732299ab2bdc","axis":"row"}}
{"t":1127,"kind":"PANE_CREATED","payload":{"pane_id":"732299ab2bdc","window_id":"8ae672904385","session_id":null,"from_split":"9e7c8c4f50b0"}}
{"t":1127,"kind":"PANE_FOCUSED","payload":{"pane_id":"732299ab2bdc","prior_pane_id":"237fcae23bbd"}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-focus","byte":128}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-status","byte":64}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-reveal","byte":128}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-lens","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-level","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-dir","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-descent","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-surface","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-find","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-inspect","byte":0}}
{"t":1133,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-header_popover","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-focus","byte":255}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-status","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-reveal","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-lens","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-level","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-dir","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-descent","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-surface","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-find","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-inspect","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-header_popover","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-focus","byte":128}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-status","byte":64}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-reveal","byte":128}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-lens","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-level","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-dir","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-descent","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-surface","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-find","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-inspect","byte":0}}
{"t":1134,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-header_popover","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-focus","byte":255}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-status","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-reveal","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-lens","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-level","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-dir","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-descent","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-surface","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-find","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-inspect","byte":0}}
{"t":1135,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-header_popover","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-focus","byte":128}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-status","byte":64}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-reveal","byte":128}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-lens","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-level","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-dir","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-descent","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-surface","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-find","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-inspect","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-237fcae23bbd-header_popover","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-focus","byte":255}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-status","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-reveal","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-lens","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-level","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-dir","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-descent","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-surface","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-find","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-inspect","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-header_popover","byte":0}}
{"t":1472,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"10e461cc889f","driver":"deterministic"}}
{"t":1474,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"10e461cc889f","driver":"deterministic","context_tokens":null}}
{"t":1474,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"0b1e572d2fce","pane_id":"732299ab2bdc","session_id":"4697e95966f4","name":"session-4697e9","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-DG6qpQ","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1476,"kind":"SESSION_CREATED","payload":{"request_id":"0b1e572d2fce","session_id":"4697e95966f4","name":"session-4697e9","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-DG6qpQ","workspace_shape":"flat","status":"running"}}
{"t":1476,"kind":"WORKSPACE_BOUND","payload":{"request_id":"0b1e572d2fce","session_id":"4697e95966f4","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-DG6qpQ","shape":"flat"}}
{"t":1476,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"732299ab2bdc","session_id":"4697e95966f4","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-DG6qpQ","shape":"flat"}}
{"t":1476,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"732299ab2bdc","session_id":"4697e95966f4"}}
{"t":1479,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-status","byte":64}}
{"t":1499,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"732299ab2bdc","from":"terminal","to":"reveal"}}
{"t":1504,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-732299ab2bdc-reveal","byte":128}}
{"t":1812,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"732299ab2bdc","from":"transcript","to":"stream"}}
```
