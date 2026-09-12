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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"9489ccf5b4c2"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"5dd67607ad19","window_id":"9489ccf5b4c2","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"5dd67607ad19","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":368,"kind":"WORKSPACE_BOUND","payload":{"request_id":"39a19a7d0ea7","session_id":"6e247742ddd5","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-ir_ewecu","shape":"flat"}}
{"t":368,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"5dd67607ad19","session_id":"6e247742ddd5","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-ir_ewecu","shape":"flat"}}
{"t":368,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"5dd67607ad19","session_id":"6e247742ddd5"}}
{"t":370,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"5dd67607ad19","tool_call_id":"cP0","depth":1}}
{"t":370,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"5dd67607ad19","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":370,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"5dd67607ad19","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/384a450a88f4/record"}}
{"t":373,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-status","byte":56}}
{"t":2402,"kind":"DESCENT_ENTERED","payload":{"pane_id":"5dd67607ad19","child_record_root":"/Users/peterlaffey/.substrate/sessions/384a450a88f4/record","depth":1}}
{"t":2405,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-descent","byte":1}}
{"t":3923,"kind":"DESCENT_ENTERED","payload":{"pane_id":"5dd67607ad19","child_record_root":"/Users/peterlaffey/.substrate/sessions/4f938bdce412/record","depth":2}}
{"t":3929,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-descent","byte":2}}
{"t":5458,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"5dd67607ad19","tool_call_id":"cB0","depth":2}}
{"t":5767,"kind":"DESCENT_EXITED","payload":{"pane_id":"5dd67607ad19","to_depth":1}}
{"t":5769,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-descent","byte":1}}
{"t":5924,"kind":"DESCENT_EXITED","payload":{"pane_id":"5dd67607ad19","to_depth":0}}
{"t":5925,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-descent","byte":0}}
{"t":6080,"kind":"PANE_SPLIT","payload":{"from_pane_id":"5dd67607ad19","new_pane_id":"0e6c92bd20b3","axis":"row"}}
{"t":6080,"kind":"PANE_CREATED","payload":{"pane_id":"0e6c92bd20b3","window_id":"9489ccf5b4c2","session_id":null,"from_split":"34fea90beb3a"}}
{"t":6080,"kind":"PANE_FOCUSED","payload":{"pane_id":"0e6c92bd20b3","prior_pane_id":"5dd67607ad19"}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-focus","byte":128}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-status","byte":56}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-reveal","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-lens","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-level","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-dir","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-descent","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-surface","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-find","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-inspect","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-header-popover","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-focus","byte":255}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-status","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-reveal","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-lens","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-level","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-dir","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-descent","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-surface","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-find","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-inspect","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-header-popover","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-focus","byte":128}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-status","byte":56}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-reveal","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-lens","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-level","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-dir","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-descent","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-surface","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-find","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-inspect","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-header-popover","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-focus","byte":255}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-status","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-reveal","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-lens","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-level","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-dir","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-descent","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-surface","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-find","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-inspect","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-header-popover","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-focus","byte":128}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-status","byte":56}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-reveal","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-lens","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-level","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-dir","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-descent","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-surface","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-find","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-inspect","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5dd67607ad19-header-popover","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-focus","byte":255}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-status","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-reveal","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-lens","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-level","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-dir","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-descent","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-surface","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-find","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-inspect","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-header-popover","byte":0}}
{"t":6528,"kind":"WORKSPACE_BOUND","payload":{"request_id":"0085a9c796c4","session_id":"d22d51cc9e57","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-DJSsSW","shape":"flat"}}
{"t":6528,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"0e6c92bd20b3","session_id":"d22d51cc9e57","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-DJSsSW","shape":"flat"}}
{"t":6528,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"0e6c92bd20b3","session_id":"d22d51cc9e57"}}
{"t":6530,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"0e6c92bd20b3","tool_call_id":"f0","depth":1}}
{"t":6530,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"0e6c92bd20b3","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6530,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"0e6c92bd20b3","tool_call_id":"f1","depth":1}}
{"t":6530,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"0e6c92bd20b3","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6530,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"0e6c92bd20b3","tool_call_id":"f2","depth":1}}
{"t":6530,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"0e6c92bd20b3","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6530,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"0e6c92bd20b3","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6531,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0e6c92bd20b3-status","byte":56}}
{"t":8564,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"0e6c92bd20b3","tool_call_id":"f0"}}
{"t":8779,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"0e6c92bd20b3","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8884,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"0e6c92bd20b3","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8989,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"0e6c92bd20b3","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9097,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"0e6c92bd20b3","tool_call_id":"f0"}}
```
