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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"dcbb14514216"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"217d11902729","window_id":"dcbb14514216","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"217d11902729","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":371,"kind":"WORKSPACE_BOUND","payload":{"request_id":"a8d41e165495","session_id":"db3d085bac98","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-g3yb2r3k","shape":"flat"}}
{"t":371,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"217d11902729","session_id":"db3d085bac98","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-g3yb2r3k","shape":"flat"}}
{"t":371,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"217d11902729","session_id":"db3d085bac98"}}
{"t":373,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"217d11902729","tool_call_id":"cP0","depth":1}}
{"t":373,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"217d11902729","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":373,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"217d11902729","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/ca7a7ed37896/record"}}
{"t":377,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-status","byte":56}}
{"t":2406,"kind":"DESCENT_ENTERED","payload":{"pane_id":"217d11902729","child_record_root":"/Users/peterlaffey/.substrate/sessions/ca7a7ed37896/record","depth":1}}
{"t":2408,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-descent","byte":1}}
{"t":3928,"kind":"DESCENT_ENTERED","payload":{"pane_id":"217d11902729","child_record_root":"/Users/peterlaffey/.substrate/sessions/d5cc4645697d/record","depth":2}}
{"t":3934,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-descent","byte":2}}
{"t":5457,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"217d11902729","tool_call_id":"cB0","depth":2}}
{"t":5767,"kind":"DESCENT_EXITED","payload":{"pane_id":"217d11902729","to_depth":1}}
{"t":5770,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-descent","byte":1}}
{"t":5923,"kind":"DESCENT_EXITED","payload":{"pane_id":"217d11902729","to_depth":0}}
{"t":5928,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-descent","byte":0}}
{"t":6079,"kind":"PANE_SPLIT","payload":{"from_pane_id":"217d11902729","new_pane_id":"5c3179460436","axis":"row"}}
{"t":6079,"kind":"PANE_CREATED","payload":{"pane_id":"5c3179460436","window_id":"dcbb14514216","session_id":null,"from_split":"e5cff424c9e6"}}
{"t":6079,"kind":"PANE_FOCUSED","payload":{"pane_id":"5c3179460436","prior_pane_id":"217d11902729"}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-focus","byte":128}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-status","byte":56}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-reveal","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-lens","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-level","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-dir","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-descent","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-surface","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-find","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-inspect","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-header-popover","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-focus","byte":255}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-status","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-reveal","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-lens","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-level","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-dir","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-descent","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-surface","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-find","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-inspect","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-header-popover","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-focus","byte":128}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-status","byte":56}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-reveal","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-lens","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-level","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-dir","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-descent","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-surface","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-find","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-inspect","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-header-popover","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-focus","byte":255}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-status","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-reveal","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-lens","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-level","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-dir","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-descent","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-surface","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-find","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-inspect","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-header-popover","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-focus","byte":128}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-status","byte":56}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-reveal","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-lens","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-level","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-dir","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-descent","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-surface","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-find","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-inspect","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217d11902729-header-popover","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-focus","byte":255}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-status","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-reveal","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-lens","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-level","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-dir","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-descent","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-surface","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-find","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-inspect","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-header-popover","byte":0}}
{"t":6520,"kind":"WORKSPACE_BOUND","payload":{"request_id":"1c7a1173b10e","session_id":"f52f83a407e8","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-YoIXev","shape":"flat"}}
{"t":6520,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"5c3179460436","session_id":"f52f83a407e8","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-YoIXev","shape":"flat"}}
{"t":6520,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"5c3179460436","session_id":"f52f83a407e8"}}
{"t":6522,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"5c3179460436","tool_call_id":"f0","depth":1}}
{"t":6522,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"5c3179460436","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6522,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"5c3179460436","tool_call_id":"f1","depth":1}}
{"t":6522,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"5c3179460436","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6522,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"5c3179460436","tool_call_id":"f2","depth":1}}
{"t":6522,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"5c3179460436","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6522,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"5c3179460436","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6528,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5c3179460436-status","byte":56}}
{"t":8559,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"5c3179460436","tool_call_id":"f0"}}
{"t":8773,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"5c3179460436","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8879,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"5c3179460436","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8982,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"5c3179460436","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9091,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"5c3179460436","tool_call_id":"f0"}}
```
