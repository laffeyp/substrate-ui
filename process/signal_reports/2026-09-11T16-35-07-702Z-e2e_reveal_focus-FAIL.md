# Signal report — e2e_reveal_focus

Outcome: **FAIL**
Summary: e2e_reveal_focus — 1 failing checks

## Observed
- FAIL: harness body threw: locator.waitFor: Timeout 3000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid="reveal-shell-db3588afbe3e"]')[22m


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
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"04a072947412"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"113e658b3497","window_id":"04a072947412","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"113e658b3497","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":366,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"c2ae299b6e63","driver":"deterministic"}}
{"t":367,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"c2ae299b6e63","driver":"deterministic","context_tokens":null}}
{"t":367,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"827022254a1d","pane_id":"113e658b3497","session_id":"a9251cb4a372","name":"session-a9251c","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-L0LLXs","workspace_shape":"flat","bundle":"","seed":""}}
{"t":369,"kind":"SESSION_CREATED","payload":{"request_id":"827022254a1d","session_id":"a9251cb4a372","name":"session-a9251c","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-L0LLXs","workspace_shape":"flat","status":"running"}}
{"t":369,"kind":"WORKSPACE_BOUND","payload":{"request_id":"827022254a1d","session_id":"a9251cb4a372","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-L0LLXs","shape":"flat"}}
{"t":369,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"113e658b3497","session_id":"a9251cb4a372","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reveal-focus-ws-L0LLXs","shape":"flat"}}
{"t":369,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"113e658b3497","session_id":"a9251cb4a372"}}
{"t":371,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-status","byte":64}}
{"t":433,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"113e658b3497","from":"terminal","to":"reveal"}}
{"t":439,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-reveal","byte":128}}
{"t":650,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"113e658b3497","from":"transcript","to":"stream"}}
{"t":809,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"113e658b3497","from":"stream","to":"transcript"}}
{"t":967,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"113e658b3497","from":"transcript","to":"stream"}}
{"t":971,"kind":"REVEAL_FOCUS_MOVED","payload":{"pane_id":"113e658b3497","from":"stream","to":"transcript"}}
{"t":1129,"kind":"PANE_SPLIT","payload":{"from_pane_id":"113e658b3497","new_pane_id":"db3588afbe3e","axis":"row"}}
{"t":1130,"kind":"PANE_CREATED","payload":{"pane_id":"db3588afbe3e","window_id":"04a072947412","session_id":null,"from_split":"899bc6becd21"}}
{"t":1130,"kind":"PANE_FOCUSED","payload":{"pane_id":"db3588afbe3e","prior_pane_id":"113e658b3497"}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-focus","byte":128}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-status","byte":64}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-reveal","byte":128}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-lens","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-level","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-dir","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-descent","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-surface","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-find","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-inspect","byte":0}}
{"t":1136,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-header_popover","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-focus","byte":255}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-status","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-reveal","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-lens","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-level","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-dir","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-descent","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-surface","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-find","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-inspect","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-header_popover","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-focus","byte":128}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-status","byte":64}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-reveal","byte":128}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-lens","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-level","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-dir","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-descent","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-surface","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-find","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-inspect","byte":0}}
{"t":1137,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-header_popover","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-focus","byte":255}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-status","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-reveal","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-lens","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-level","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-dir","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-descent","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-surface","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-find","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-inspect","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-header_popover","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-focus","byte":128}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-status","byte":64}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-reveal","byte":128}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-lens","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-level","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-dir","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-descent","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-surface","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-find","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-inspect","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-113e658b3497-header_popover","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-focus","byte":255}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-status","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-reveal","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-lens","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-level","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-dir","byte":0}}
{"t":1138,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-descent","byte":0}}
{"t":1139,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-surface","byte":0}}
{"t":1139,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-find","byte":0}}
{"t":1139,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-inspect","byte":0}}
{"t":1139,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-header_popover","byte":0}}
{"t":1792,"kind":"REVEAL_TOGGLED","payload":{"pane_id":"db3588afbe3e","from":"terminal","to":"reveal"}}
{"t":1793,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-db3588afbe3e-reveal","byte":128}}
```
