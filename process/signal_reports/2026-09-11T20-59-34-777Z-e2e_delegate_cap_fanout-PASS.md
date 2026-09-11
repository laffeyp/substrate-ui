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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"b7dc15e9f173"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"9fa6e9a6beda","window_id":"b7dc15e9f173","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"9fa6e9a6beda","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-header_popover","byte":0}}
{"t":24,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":31,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":369,"kind":"WORKSPACE_BOUND","payload":{"request_id":"a75d8bbebcde","session_id":"c02096161220","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-d4dnbp2t","shape":"flat"}}
{"t":369,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"9fa6e9a6beda","session_id":"c02096161220","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-d4dnbp2t","shape":"flat"}}
{"t":369,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"9fa6e9a6beda","session_id":"c02096161220"}}
{"t":370,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"9fa6e9a6beda","tool_call_id":"cP0","depth":1}}
{"t":370,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"9fa6e9a6beda","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":370,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"9fa6e9a6beda","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/b06c3a34f67a/record"}}
{"t":374,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-status","byte":56}}
{"t":2401,"kind":"DESCENT_ENTERED","payload":{"pane_id":"9fa6e9a6beda","child_record_root":"/Users/peterlaffey/.substrate/sessions/b06c3a34f67a/record","depth":1}}
{"t":2403,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-descent","byte":1}}
{"t":3932,"kind":"DESCENT_ENTERED","payload":{"pane_id":"9fa6e9a6beda","child_record_root":"/Users/peterlaffey/.substrate/sessions/92b28130ba24/record","depth":2}}
{"t":3937,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-descent","byte":2}}
{"t":5455,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"9fa6e9a6beda","tool_call_id":"cB0","depth":2}}
{"t":5763,"kind":"DESCENT_EXITED","payload":{"pane_id":"9fa6e9a6beda","to_depth":1}}
{"t":5765,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-descent","byte":1}}
{"t":5918,"kind":"DESCENT_EXITED","payload":{"pane_id":"9fa6e9a6beda","to_depth":0}}
{"t":5921,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-descent","byte":0}}
{"t":6076,"kind":"PANE_SPLIT","payload":{"from_pane_id":"9fa6e9a6beda","new_pane_id":"ccc324131ed9","axis":"row"}}
{"t":6076,"kind":"PANE_CREATED","payload":{"pane_id":"ccc324131ed9","window_id":"b7dc15e9f173","session_id":null,"from_split":"409ad957f4d2"}}
{"t":6076,"kind":"PANE_FOCUSED","payload":{"pane_id":"ccc324131ed9","prior_pane_id":"9fa6e9a6beda"}}
{"t":6080,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-focus","byte":128}}
{"t":6080,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-status","byte":56}}
{"t":6080,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-reveal","byte":0}}
{"t":6080,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-lens","byte":0}}
{"t":6080,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-level","byte":0}}
{"t":6080,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-dir","byte":0}}
{"t":6080,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-descent","byte":0}}
{"t":6080,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-surface","byte":0}}
{"t":6080,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-find","byte":0}}
{"t":6080,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-inspect","byte":0}}
{"t":6080,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-header_popover","byte":0}}
{"t":6082,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-focus","byte":255}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-status","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-reveal","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-lens","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-level","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-dir","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-descent","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-surface","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-find","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-inspect","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-header_popover","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-focus","byte":128}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-status","byte":56}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-reveal","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-lens","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-level","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-dir","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-descent","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-surface","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-find","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-inspect","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-header_popover","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-focus","byte":255}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-status","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-reveal","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-lens","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-level","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-dir","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-descent","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-surface","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-find","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-inspect","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-header_popover","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-focus","byte":128}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-status","byte":56}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-reveal","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-lens","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-level","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-dir","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-descent","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-surface","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-find","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-inspect","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9fa6e9a6beda-header_popover","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-focus","byte":255}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-status","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-reveal","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-lens","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-level","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-dir","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-descent","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-surface","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-find","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-inspect","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-header_popover","byte":0}}
{"t":6515,"kind":"WORKSPACE_BOUND","payload":{"request_id":"63d7376f18ad","session_id":"964f98f8f4f9","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-CVwJq1","shape":"flat"}}
{"t":6515,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"ccc324131ed9","session_id":"964f98f8f4f9","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-CVwJq1","shape":"flat"}}
{"t":6515,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"ccc324131ed9","session_id":"964f98f8f4f9"}}
{"t":6516,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"ccc324131ed9","tool_call_id":"f0","depth":1}}
{"t":6516,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"ccc324131ed9","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6516,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"ccc324131ed9","tool_call_id":"f1","depth":1}}
{"t":6516,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"ccc324131ed9","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6516,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"ccc324131ed9","tool_call_id":"f2","depth":1}}
{"t":6516,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"ccc324131ed9","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6516,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"ccc324131ed9","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6519,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-ccc324131ed9-status","byte":56}}
{"t":8538,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"ccc324131ed9","tool_call_id":"f0"}}
{"t":8751,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"ccc324131ed9","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8856,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"ccc324131ed9","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8963,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"ccc324131ed9","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9073,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"ccc324131ed9","tool_call_id":"f0"}}
```
