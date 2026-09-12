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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"a8dedc54b184"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"4984e97bed01","window_id":"a8dedc54b184","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"4984e97bed01","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-header-popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":364,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"09b7b9799527","driver":"deterministic"}}
{"t":365,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"09b7b9799527","driver":"deterministic","context_tokens":null}}
{"t":365,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"cc83ebd571eb","pane_id":"4984e97bed01","session_id":"6aa8fa92ce66","name":"session-6aa8fa","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-4TDm2e","workspace_shape":"flat","bundle":"","seed":""}}
{"t":366,"kind":"SESSION_CREATED","payload":{"request_id":"cc83ebd571eb","session_id":"6aa8fa92ce66","name":"session-6aa8fa","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-4TDm2e","workspace_shape":"flat","status":"running"}}
{"t":366,"kind":"WORKSPACE_BOUND","payload":{"request_id":"cc83ebd571eb","session_id":"6aa8fa92ce66","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-4TDm2e","shape":"flat"}}
{"t":366,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"4984e97bed01","session_id":"6aa8fa92ce66","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-4TDm2e","shape":"flat"}}
{"t":366,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"4984e97bed01","session_id":"6aa8fa92ce66"}}
{"t":372,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-status","byte":64}}
{"t":383,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"4984e97bed01","from":"terminal","to":"reveal"}}
{"t":388,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-reveal","byte":128}}
{"t":600,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"4984e97bed01","from":"transcript","to":"stream"}}
{"t":759,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"4984e97bed01","from":"stream","to":"transcript"}}
{"t":914,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"4984e97bed01","from":"transcript","to":"stream"}}
{"t":916,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"4984e97bed01","from":"stream","to":"transcript"}}
{"t":1071,"kind":"PANE_SPLIT","payload":{"from_pane_id":"4984e97bed01","new_pane_id":"61c6226ef86b","axis":"row"}}
{"t":1071,"kind":"PANE_CREATED","payload":{"pane_id":"61c6226ef86b","window_id":"a8dedc54b184","session_id":null,"from_split":"591763e5d18d"}}
{"t":1071,"kind":"PANE_FOCUSED","payload":{"pane_id":"61c6226ef86b","prior_pane_id":"4984e97bed01"}}
{"t":1074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-focus","byte":128}}
{"t":1074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-status","byte":64}}
{"t":1074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-reveal","byte":128}}
{"t":1074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-lens","byte":0}}
{"t":1074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-level","byte":0}}
{"t":1074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-dir","byte":0}}
{"t":1074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-descent","byte":0}}
{"t":1074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-surface","byte":0}}
{"t":1074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-find","byte":0}}
{"t":1074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-inspect","byte":0}}
{"t":1074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-header-popover","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-focus","byte":255}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-status","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-reveal","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-lens","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-level","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-dir","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-descent","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-surface","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-find","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-inspect","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-header-popover","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-focus","byte":128}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-status","byte":64}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-reveal","byte":128}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-lens","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-level","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-dir","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-descent","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-surface","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-find","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-inspect","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-header-popover","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-focus","byte":255}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-status","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-reveal","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-lens","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-level","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-dir","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-descent","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-surface","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-find","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-inspect","byte":0}}
{"t":1075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-header-popover","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-focus","byte":128}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-status","byte":64}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-reveal","byte":128}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-lens","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-level","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-dir","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-descent","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-surface","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-find","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-inspect","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4984e97bed01-header-popover","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-focus","byte":255}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-status","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-reveal","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-lens","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-level","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-dir","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-descent","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-surface","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-find","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-inspect","byte":0}}
{"t":1076,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-header-popover","byte":0}}
{"t":1407,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"9746a34db97a","driver":"deterministic"}}
{"t":1408,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"9746a34db97a","driver":"deterministic","context_tokens":null}}
{"t":1408,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"f12649edc6c5","pane_id":"61c6226ef86b","session_id":"f8d3ebac86aa","name":"session-f8d3eb","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-RMejDe","workspace_shape":"flat","bundle":"","seed":""}}
{"t":1410,"kind":"SESSION_CREATED","payload":{"request_id":"f12649edc6c5","session_id":"f8d3ebac86aa","name":"session-f8d3eb","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-RMejDe","workspace_shape":"flat","status":"running"}}
{"t":1410,"kind":"WORKSPACE_BOUND","payload":{"request_id":"f12649edc6c5","session_id":"f8d3ebac86aa","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-RMejDe","shape":"flat"}}
{"t":1410,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"61c6226ef86b","session_id":"f8d3ebac86aa","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws2-ws-RMejDe","shape":"flat"}}
{"t":1410,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"61c6226ef86b","session_id":"f8d3ebac86aa"}}
{"t":1413,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-status","byte":64}}
{"t":1433,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"61c6226ef86b","from":"terminal","to":"reveal"}}
{"t":1438,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-61c6226ef86b-reveal","byte":128}}
{"t":1745,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"61c6226ef86b","from":"transcript","to":"stream"}}
```
