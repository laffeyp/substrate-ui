# Signal report — e2e_delegate_cap_fanout

Outcome: **PASS**
Summary: e2e_delegate_cap_fanout — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 154 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"37bd79997078"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"d8fa3ad57d87","window_id":"37bd79997078","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"d8fa3ad57d87","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":26,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":373,"kind":"WORKSPACE_BOUND","payload":{"request_id":"a8d200d8ece4","session_id":"501eff07e18d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-26usf6io","shape":"flat"}}
{"t":373,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"d8fa3ad57d87","session_id":"501eff07e18d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-26usf6io","shape":"flat"}}
{"t":373,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"d8fa3ad57d87","session_id":"501eff07e18d"}}
{"t":375,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"d8fa3ad57d87","tool_call_id":"cP0","depth":1}}
{"t":375,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"d8fa3ad57d87","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":375,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"d8fa3ad57d87","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/0f2cceaabb45/record"}}
{"t":378,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-status","byte":56}}
{"t":2408,"kind":"DESCENT_ENTERED","payload":{"pane_id":"d8fa3ad57d87","child_record_root":"/Users/peterlaffey/.substrate/sessions/0f2cceaabb45/record","depth":1}}
{"t":2410,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-descent","byte":1}}
{"t":3936,"kind":"DESCENT_ENTERED","payload":{"pane_id":"d8fa3ad57d87","child_record_root":"/Users/peterlaffey/.substrate/sessions/da2d43660261/record","depth":2}}
{"t":3939,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-descent","byte":2}}
{"t":5468,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"d8fa3ad57d87","tool_call_id":"cB0","depth":2}}
{"t":5777,"kind":"DESCENT_EXITED","payload":{"pane_id":"d8fa3ad57d87","to_depth":1}}
{"t":5780,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-descent","byte":1}}
{"t":5932,"kind":"DESCENT_EXITED","payload":{"pane_id":"d8fa3ad57d87","to_depth":0}}
{"t":5935,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-descent","byte":0}}
{"t":6089,"kind":"PANE_SPLIT","payload":{"from_pane_id":"d8fa3ad57d87","new_pane_id":"012ba302f797","axis":"row"}}
{"t":6089,"kind":"PANE_CREATED","payload":{"pane_id":"012ba302f797","window_id":"37bd79997078","session_id":null,"from_split":"eed79172dd0f"}}
{"t":6089,"kind":"PANE_FOCUSED","payload":{"pane_id":"012ba302f797","prior_pane_id":"d8fa3ad57d87"}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-focus","byte":128}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-status","byte":56}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-reveal","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-lens","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-level","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-dir","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-descent","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-surface","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-find","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-inspect","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-header-popover","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-focus","byte":255}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-status","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-reveal","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-lens","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-level","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-dir","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-descent","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-surface","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-find","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-inspect","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-header-popover","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-focus","byte":128}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-status","byte":56}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-reveal","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-lens","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-level","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-dir","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-descent","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-surface","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-find","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-inspect","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-header-popover","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-focus","byte":255}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-status","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-reveal","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-lens","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-level","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-dir","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-descent","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-surface","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-find","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-inspect","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-header-popover","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-focus","byte":128}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-status","byte":56}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-reveal","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-lens","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-level","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-dir","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-descent","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-surface","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-find","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-inspect","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-d8fa3ad57d87-header-popover","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-focus","byte":255}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-status","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-reveal","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-lens","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-level","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-dir","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-descent","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-surface","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-find","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-inspect","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-header-popover","byte":0}}
{"t":6534,"kind":"WORKSPACE_BOUND","payload":{"request_id":"1a52e0e9a20f","session_id":"fc49ca20260e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-22yx6l","shape":"flat"}}
{"t":6534,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"012ba302f797","session_id":"fc49ca20260e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-22yx6l","shape":"flat"}}
{"t":6534,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"012ba302f797","session_id":"fc49ca20260e"}}
{"t":6537,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-012ba302f797-status","byte":56}}
{"t":6537,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"012ba302f797","tool_call_id":"f0","depth":1}}
{"t":6537,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"012ba302f797","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6537,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"012ba302f797","tool_call_id":"f1","depth":1}}
{"t":6537,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"012ba302f797","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6537,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"012ba302f797","tool_call_id":"f2","depth":1}}
{"t":6537,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"012ba302f797","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6537,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"012ba302f797","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":8573,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"012ba302f797","tool_call_id":"f0"}}
{"t":8786,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"012ba302f797","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8893,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"012ba302f797","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8997,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"012ba302f797","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9103,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"012ba302f797","tool_call_id":"f0"}}
```
