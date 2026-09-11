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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"4903c100e5d1"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"49e5f2a67ca4","window_id":"4903c100e5d1","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"49e5f2a67ca4","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":23,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":362,"kind":"WORKSPACE_BOUND","payload":{"request_id":"65d81585fe6c","session_id":"a8cd47164b33","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-6nn15j5i","shape":"flat"}}
{"t":362,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"49e5f2a67ca4","session_id":"a8cd47164b33","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-6nn15j5i","shape":"flat"}}
{"t":362,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"49e5f2a67ca4","session_id":"a8cd47164b33"}}
{"t":364,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"49e5f2a67ca4","tool_call_id":"cP0","depth":1}}
{"t":364,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"49e5f2a67ca4","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":364,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"49e5f2a67ca4","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/683e47fff2cd/record"}}
{"t":367,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-status","byte":56}}
{"t":2397,"kind":"DESCENT_ENTERED","payload":{"pane_id":"49e5f2a67ca4","child_record_root":"/Users/peterlaffey/.substrate/sessions/683e47fff2cd/record","depth":1}}
{"t":2400,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-descent","byte":1}}
{"t":3927,"kind":"DESCENT_ENTERED","payload":{"pane_id":"49e5f2a67ca4","child_record_root":"/Users/peterlaffey/.substrate/sessions/c9ea32666f5d/record","depth":2}}
{"t":3934,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-descent","byte":2}}
{"t":5452,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"49e5f2a67ca4","tool_call_id":"cB0","depth":2}}
{"t":5762,"kind":"DESCENT_EXITED","payload":{"pane_id":"49e5f2a67ca4","to_depth":1}}
{"t":5765,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-descent","byte":1}}
{"t":5919,"kind":"DESCENT_EXITED","payload":{"pane_id":"49e5f2a67ca4","to_depth":0}}
{"t":5923,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-descent","byte":0}}
{"t":6079,"kind":"PANE_SPLIT","payload":{"from_pane_id":"49e5f2a67ca4","new_pane_id":"96baf009cc5e","axis":"row"}}
{"t":6079,"kind":"PANE_CREATED","payload":{"pane_id":"96baf009cc5e","window_id":"4903c100e5d1","session_id":null,"from_split":"fe0c80192d87"}}
{"t":6079,"kind":"PANE_FOCUSED","payload":{"pane_id":"96baf009cc5e","prior_pane_id":"49e5f2a67ca4"}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-focus","byte":128}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-status","byte":56}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-reveal","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-lens","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-level","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-dir","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-descent","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-surface","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-find","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-inspect","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-header-popover","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-focus","byte":255}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-status","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-reveal","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-lens","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-level","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-dir","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-descent","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-surface","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-find","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-inspect","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-header-popover","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-focus","byte":128}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-status","byte":56}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-reveal","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-lens","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-level","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-dir","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-descent","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-surface","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-find","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-inspect","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-header-popover","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-focus","byte":255}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-status","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-reveal","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-lens","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-level","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-dir","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-descent","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-surface","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-find","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-inspect","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-header-popover","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-focus","byte":128}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-status","byte":56}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-reveal","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-lens","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-level","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-dir","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-descent","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-surface","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-find","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-inspect","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-49e5f2a67ca4-header-popover","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-focus","byte":255}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-status","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-reveal","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-lens","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-level","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-dir","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-descent","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-surface","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-find","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-inspect","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-header-popover","byte":0}}
{"t":6521,"kind":"WORKSPACE_BOUND","payload":{"request_id":"bc4043eb9f9f","session_id":"bbd2c26bc971","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-6j2A3V","shape":"flat"}}
{"t":6521,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"96baf009cc5e","session_id":"bbd2c26bc971","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-6j2A3V","shape":"flat"}}
{"t":6521,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"96baf009cc5e","session_id":"bbd2c26bc971"}}
{"t":6522,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"96baf009cc5e","tool_call_id":"f0","depth":1}}
{"t":6522,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"96baf009cc5e","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6522,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"96baf009cc5e","tool_call_id":"f1","depth":1}}
{"t":6522,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"96baf009cc5e","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6522,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"96baf009cc5e","tool_call_id":"f2","depth":1}}
{"t":6522,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"96baf009cc5e","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6522,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"96baf009cc5e","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6525,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-96baf009cc5e-status","byte":56}}
{"t":8544,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"96baf009cc5e","tool_call_id":"f0"}}
{"t":8757,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"96baf009cc5e","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8864,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"96baf009cc5e","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8971,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"96baf009cc5e","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9081,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"96baf009cc5e","tool_call_id":"f0"}}
```
