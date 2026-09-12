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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"e4ae55eab1db"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"9cb9d6e9e1ff","window_id":"e4ae55eab1db","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"9cb9d6e9e1ff","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":9,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":30,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":367,"kind":"WORKSPACE_BOUND","payload":{"request_id":"7b5c980cc488","session_id":"2be3c44f34f6","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-uwz1aqin","shape":"flat"}}
{"t":367,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"9cb9d6e9e1ff","session_id":"2be3c44f34f6","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-uwz1aqin","shape":"flat"}}
{"t":367,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"9cb9d6e9e1ff","session_id":"2be3c44f34f6"}}
{"t":368,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"9cb9d6e9e1ff","tool_call_id":"cP0","depth":1}}
{"t":368,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"9cb9d6e9e1ff","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":368,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"9cb9d6e9e1ff","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/231fcdc8aae9/record"}}
{"t":372,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-status","byte":56}}
{"t":2393,"kind":"DESCENT_ENTERED","payload":{"pane_id":"9cb9d6e9e1ff","child_record_root":"/Users/peterlaffey/.substrate/sessions/231fcdc8aae9/record","depth":1}}
{"t":2397,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-descent","byte":1}}
{"t":3916,"kind":"DESCENT_ENTERED","payload":{"pane_id":"9cb9d6e9e1ff","child_record_root":"/Users/peterlaffey/.substrate/sessions/0b14913ad9b4/record","depth":2}}
{"t":3922,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-descent","byte":2}}
{"t":5440,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"9cb9d6e9e1ff","tool_call_id":"cB0","depth":2}}
{"t":5747,"kind":"DESCENT_EXITED","payload":{"pane_id":"9cb9d6e9e1ff","to_depth":1}}
{"t":5749,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-descent","byte":1}}
{"t":5901,"kind":"DESCENT_EXITED","payload":{"pane_id":"9cb9d6e9e1ff","to_depth":0}}
{"t":5902,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-descent","byte":0}}
{"t":6056,"kind":"PANE_SPLIT","payload":{"from_pane_id":"9cb9d6e9e1ff","new_pane_id":"6670bc6f2230","axis":"row"}}
{"t":6056,"kind":"PANE_CREATED","payload":{"pane_id":"6670bc6f2230","window_id":"e4ae55eab1db","session_id":null,"from_split":"7098c860af98"}}
{"t":6056,"kind":"PANE_FOCUSED","payload":{"pane_id":"6670bc6f2230","prior_pane_id":"9cb9d6e9e1ff"}}
{"t":6059,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-focus","byte":128}}
{"t":6059,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-status","byte":56}}
{"t":6059,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-reveal","byte":0}}
{"t":6059,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-lens","byte":0}}
{"t":6059,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-level","byte":0}}
{"t":6059,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-dir","byte":0}}
{"t":6060,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-descent","byte":0}}
{"t":6060,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-surface","byte":0}}
{"t":6060,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-find","byte":0}}
{"t":6060,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-inspect","byte":0}}
{"t":6060,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-header-popover","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-focus","byte":255}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-status","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-reveal","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-lens","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-level","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-dir","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-descent","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-surface","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-find","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-inspect","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-header-popover","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-focus","byte":128}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-status","byte":56}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-reveal","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-lens","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-level","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-dir","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-descent","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-surface","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-find","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-inspect","byte":0}}
{"t":6061,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-header-popover","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-focus","byte":255}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-status","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-reveal","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-lens","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-level","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-dir","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-descent","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-surface","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-find","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-inspect","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-header-popover","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-focus","byte":128}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-status","byte":56}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-reveal","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-lens","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-level","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-dir","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-descent","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-surface","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-find","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-inspect","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9cb9d6e9e1ff-header-popover","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-focus","byte":255}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-status","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-reveal","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-lens","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-level","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-dir","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-descent","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-surface","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-find","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-inspect","byte":0}}
{"t":6062,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-header-popover","byte":0}}
{"t":6484,"kind":"WORKSPACE_BOUND","payload":{"request_id":"7c96bdb14e70","session_id":"be56fcd524f8","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-M3pllH","shape":"flat"}}
{"t":6484,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"6670bc6f2230","session_id":"be56fcd524f8","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-M3pllH","shape":"flat"}}
{"t":6484,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"6670bc6f2230","session_id":"be56fcd524f8"}}
{"t":6485,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"6670bc6f2230","tool_call_id":"f0","depth":1}}
{"t":6485,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"6670bc6f2230","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6485,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"6670bc6f2230","tool_call_id":"f1","depth":1}}
{"t":6485,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"6670bc6f2230","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6485,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"6670bc6f2230","tool_call_id":"f2","depth":1}}
{"t":6485,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"6670bc6f2230","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6485,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"6670bc6f2230","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6488,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6670bc6f2230-status","byte":56}}
{"t":8509,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"6670bc6f2230","tool_call_id":"f0"}}
{"t":8718,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"6670bc6f2230","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8823,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"6670bc6f2230","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8928,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"6670bc6f2230","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9034,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"6670bc6f2230","tool_call_id":"f0"}}
```
