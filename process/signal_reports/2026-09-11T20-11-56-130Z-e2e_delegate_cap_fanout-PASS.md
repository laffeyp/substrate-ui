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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"fb5d9fe05a00"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"99088315c4e2","window_id":"fb5d9fe05a00","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"99088315c4e2","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":26,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":372,"kind":"WORKSPACE_BOUND","payload":{"request_id":"b91b1bfe69ab","session_id":"560d6ac61e60","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-w2tgbh82","shape":"flat"}}
{"t":372,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"99088315c4e2","session_id":"560d6ac61e60","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-w2tgbh82","shape":"flat"}}
{"t":372,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"99088315c4e2","session_id":"560d6ac61e60"}}
{"t":373,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"99088315c4e2","tool_call_id":"cP0","depth":1}}
{"t":373,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"99088315c4e2","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":373,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"99088315c4e2","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/b642c4401715/record"}}
{"t":379,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-status","byte":56}}
{"t":2396,"kind":"DESCENT_ENTERED","payload":{"pane_id":"99088315c4e2","child_record_root":"/Users/peterlaffey/.substrate/sessions/b642c4401715/record","depth":1}}
{"t":2402,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-descent","byte":1}}
{"t":3921,"kind":"DESCENT_ENTERED","payload":{"pane_id":"99088315c4e2","child_record_root":"/Users/peterlaffey/.substrate/sessions/5bd08e54c6c3/record","depth":2}}
{"t":3927,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-descent","byte":2}}
{"t":5454,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"99088315c4e2","tool_call_id":"cB0","depth":2}}
{"t":5765,"kind":"DESCENT_EXITED","payload":{"pane_id":"99088315c4e2","to_depth":1}}
{"t":5767,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-descent","byte":1}}
{"t":5920,"kind":"DESCENT_EXITED","payload":{"pane_id":"99088315c4e2","to_depth":0}}
{"t":5927,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-descent","byte":0}}
{"t":6076,"kind":"PANE_SPLIT","payload":{"from_pane_id":"99088315c4e2","new_pane_id":"e0e66e93f119","axis":"row"}}
{"t":6076,"kind":"PANE_CREATED","payload":{"pane_id":"e0e66e93f119","window_id":"fb5d9fe05a00","session_id":null,"from_split":"ed8714470e93"}}
{"t":6076,"kind":"PANE_FOCUSED","payload":{"pane_id":"e0e66e93f119","prior_pane_id":"99088315c4e2"}}
{"t":6080,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-focus","byte":128}}
{"t":6080,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-status","byte":56}}
{"t":6081,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-reveal","byte":0}}
{"t":6081,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-lens","byte":0}}
{"t":6081,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-level","byte":0}}
{"t":6081,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-dir","byte":0}}
{"t":6081,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-descent","byte":0}}
{"t":6081,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-surface","byte":0}}
{"t":6081,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-find","byte":0}}
{"t":6081,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-inspect","byte":0}}
{"t":6081,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-header_popover","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-focus","byte":255}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-status","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-reveal","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-lens","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-level","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-dir","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-descent","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-surface","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-find","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-inspect","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-header_popover","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-focus","byte":128}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-status","byte":56}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-reveal","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-lens","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-level","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-dir","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-descent","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-surface","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-find","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-inspect","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-header_popover","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-focus","byte":255}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-status","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-reveal","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-lens","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-level","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-dir","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-descent","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-surface","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-find","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-inspect","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-header_popover","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-focus","byte":128}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-status","byte":56}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-reveal","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-lens","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-level","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-dir","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-descent","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-surface","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-find","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-inspect","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-99088315c4e2-header_popover","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-focus","byte":255}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-status","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-reveal","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-lens","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-level","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-dir","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-descent","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-surface","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-find","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-inspect","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-header_popover","byte":0}}
{"t":6519,"kind":"WORKSPACE_BOUND","payload":{"request_id":"b0b7ecf188f8","session_id":"856e170383c0","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-9gGUj2","shape":"flat"}}
{"t":6519,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"e0e66e93f119","session_id":"856e170383c0","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-9gGUj2","shape":"flat"}}
{"t":6519,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"e0e66e93f119","session_id":"856e170383c0"}}
{"t":6521,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"e0e66e93f119","tool_call_id":"f0","depth":1}}
{"t":6521,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"e0e66e93f119","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6521,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"e0e66e93f119","tool_call_id":"f1","depth":1}}
{"t":6521,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"e0e66e93f119","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6521,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"e0e66e93f119","tool_call_id":"f2","depth":1}}
{"t":6521,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"e0e66e93f119","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6521,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"e0e66e93f119","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6526,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e0e66e93f119-status","byte":56}}
{"t":8548,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"e0e66e93f119","tool_call_id":"f0"}}
{"t":8763,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"e0e66e93f119","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8868,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"e0e66e93f119","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8972,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"e0e66e93f119","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9080,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"e0e66e93f119","tool_call_id":"f0"}}
```
