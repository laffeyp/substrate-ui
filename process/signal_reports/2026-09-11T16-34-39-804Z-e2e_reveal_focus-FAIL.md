# Signal report — e2e_reveal_focus

Outcome: **FAIL**
Summary: e2e_reveal_focus — 1 failing checks

## Observed
- FAIL: harness body threw: locator.waitFor: Timeout 3000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid="reveal-shell-b77e4989e0df"]')[22m


## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Fails listed above.

## Hypothesis
- Read the trace above; localize by the first FAIL entry.

## Trace — 138 emits

```jsonl
{"t":4,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"44092d876f22"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"017dbe76f565","window_id":"44092d876f22","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"017dbe76f565","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-focus","byte":255}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-status","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-reveal","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-lens","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-level","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-dir","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-descent","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-surface","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-find","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-inspect","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-header_popover","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-focus","byte":255}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-status","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-reveal","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-lens","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-level","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-dir","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-descent","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-surface","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-find","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-inspect","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-header_popover","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-focus","byte":255}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-status","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-reveal","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-lens","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-level","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-dir","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-descent","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-surface","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-find","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-inspect","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-header_popover","byte":0}}
{"t":18,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":25,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":367,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"d67a927e6e27","driver":"deterministic"}}
{"t":368,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"d67a927e6e27","driver":"deterministic","context_tokens":null}}
{"t":368,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"6413f153e96f","pane_id":"017dbe76f565","session_id":"9f985c4d23af","name":"session-9f985c","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-cnEIpt","workspace_shape":"flat","bundle":"","seed":""}}
{"t":370,"kind":"SESSION_CREATED","payload":{"request_id":"6413f153e96f","session_id":"9f985c4d23af","name":"session-9f985c","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-cnEIpt","workspace_shape":"flat","status":"running"}}
{"t":370,"kind":"WORKSPACE_BOUND","payload":{"request_id":"6413f153e96f","session_id":"9f985c4d23af","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-cnEIpt","shape":"flat"}}
{"t":370,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"017dbe76f565","session_id":"9f985c4d23af","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-cnEIpt","shape":"flat"}}
{"t":370,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"017dbe76f565","session_id":"9f985c4d23af"}}
{"t":376,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-status","byte":64}}
{"t":437,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"017dbe76f565","from":"terminal","to":"reveal"}}
{"t":441,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-reveal","byte":128}}
{"t":654,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"017dbe76f565","from":"transcript","to":"stream"}}
{"t":813,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"017dbe76f565","from":"stream","to":"transcript"}}
{"t":971,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"017dbe76f565","from":"transcript","to":"stream"}}
{"t":975,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"017dbe76f565","from":"stream","to":"transcript"}}
{"t":1134,"kind":"PANE_SPLIT","payload":{"from_pane_id":"017dbe76f565","new_pane_id":"b77e4989e0df","axis":"row"}}
{"t":1134,"kind":"PANE_CREATED","payload":{"pane_id":"b77e4989e0df","window_id":"44092d876f22","session_id":null,"from_split":"7a07194edef1"}}
{"t":1134,"kind":"PANE_FOCUSED","payload":{"pane_id":"b77e4989e0df","prior_pane_id":"017dbe76f565"}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-focus","byte":128}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-status","byte":64}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-reveal","byte":128}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-lens","byte":0}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-level","byte":0}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-dir","byte":0}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-descent","byte":0}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-surface","byte":0}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-find","byte":0}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-inspect","byte":0}}
{"t":1140,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-header_popover","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-focus","byte":255}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-status","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-reveal","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-lens","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-level","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-dir","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-descent","byte":0}}
{"t":1141,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-surface","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-find","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-inspect","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-header_popover","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-focus","byte":128}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-status","byte":64}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-reveal","byte":128}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-lens","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-level","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-dir","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-descent","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-surface","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-find","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-inspect","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-header_popover","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-focus","byte":255}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-status","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-reveal","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-lens","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-level","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-dir","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-descent","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-surface","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-find","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-inspect","byte":0}}
{"t":1142,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-header_popover","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-focus","byte":128}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-status","byte":64}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-reveal","byte":128}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-lens","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-level","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-dir","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-descent","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-surface","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-find","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-inspect","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-017dbe76f565-header_popover","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-focus","byte":255}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-status","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-reveal","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-lens","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-level","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-dir","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-descent","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-surface","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-find","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-inspect","byte":0}}
{"t":1143,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-header_popover","byte":0}}
{"t":2998,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"b77e4989e0df","from":"terminal","to":"reveal"}}
{"t":3000,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b77e4989e0df-reveal","byte":128}}
```
