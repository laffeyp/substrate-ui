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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"a0420cb38bea"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"e1adde075c2d","window_id":"a0420cb38bea","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"e1adde075c2d","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":31,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":366,"kind":"WORKSPACE_BOUND","payload":{"request_id":"5209f98483de","session_id":"1e365db11fa6","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-02t_yyk6","shape":"flat"}}
{"t":366,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"e1adde075c2d","session_id":"1e365db11fa6","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-02t_yyk6","shape":"flat"}}
{"t":366,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"e1adde075c2d","session_id":"1e365db11fa6"}}
{"t":368,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"e1adde075c2d","tool_call_id":"cP0","depth":1}}
{"t":368,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"e1adde075c2d","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":368,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"e1adde075c2d","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/b8e472aa7682/record"}}
{"t":371,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-status","byte":56}}
{"t":2401,"kind":"DESCENT_ENTERED","payload":{"pane_id":"e1adde075c2d","child_record_root":"/Users/peterlaffey/.substrate/sessions/b8e472aa7682/record","depth":1}}
{"t":2403,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-descent","byte":1}}
{"t":3924,"kind":"DESCENT_ENTERED","payload":{"pane_id":"e1adde075c2d","child_record_root":"/Users/peterlaffey/.substrate/sessions/d680ba070c87/record","depth":2}}
{"t":3928,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-descent","byte":2}}
{"t":5457,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"e1adde075c2d","tool_call_id":"cB0","depth":2}}
{"t":5767,"kind":"DESCENT_EXITED","payload":{"pane_id":"e1adde075c2d","to_depth":1}}
{"t":5769,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-descent","byte":1}}
{"t":5923,"kind":"DESCENT_EXITED","payload":{"pane_id":"e1adde075c2d","to_depth":0}}
{"t":5925,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-descent","byte":0}}
{"t":6079,"kind":"PANE_SPLIT","payload":{"from_pane_id":"e1adde075c2d","new_pane_id":"185d438ed973","axis":"row"}}
{"t":6079,"kind":"PANE_CREATED","payload":{"pane_id":"185d438ed973","window_id":"a0420cb38bea","session_id":null,"from_split":"c5af840c4977"}}
{"t":6079,"kind":"PANE_FOCUSED","payload":{"pane_id":"185d438ed973","prior_pane_id":"e1adde075c2d"}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-focus","byte":128}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-status","byte":56}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-reveal","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-lens","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-level","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-dir","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-descent","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-surface","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-find","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-inspect","byte":0}}
{"t":6084,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-header-popover","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-focus","byte":255}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-status","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-reveal","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-lens","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-level","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-dir","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-descent","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-surface","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-find","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-inspect","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-header-popover","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-focus","byte":128}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-status","byte":56}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-reveal","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-lens","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-level","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-dir","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-descent","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-surface","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-find","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-inspect","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-header-popover","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-focus","byte":255}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-status","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-reveal","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-lens","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-level","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-dir","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-descent","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-surface","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-find","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-inspect","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-header-popover","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-focus","byte":128}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-status","byte":56}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-reveal","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-lens","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-level","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-dir","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-descent","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-surface","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-find","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-inspect","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-e1adde075c2d-header-popover","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-focus","byte":255}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-status","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-reveal","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-lens","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-level","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-dir","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-descent","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-surface","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-find","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-inspect","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-header-popover","byte":0}}
{"t":6529,"kind":"WORKSPACE_BOUND","payload":{"request_id":"dc2105fa6766","session_id":"8573162e3c55","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-P9jlov","shape":"flat"}}
{"t":6529,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"185d438ed973","session_id":"8573162e3c55","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-P9jlov","shape":"flat"}}
{"t":6529,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"185d438ed973","session_id":"8573162e3c55"}}
{"t":6531,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"185d438ed973","tool_call_id":"f0","depth":1}}
{"t":6531,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"185d438ed973","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6531,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"185d438ed973","tool_call_id":"f1","depth":1}}
{"t":6531,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"185d438ed973","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6531,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"185d438ed973","tool_call_id":"f2","depth":1}}
{"t":6531,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"185d438ed973","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6531,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"185d438ed973","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6537,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-185d438ed973-status","byte":56}}
{"t":8566,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"185d438ed973","tool_call_id":"f0"}}
{"t":8780,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"185d438ed973","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8886,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"185d438ed973","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8990,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"185d438ed973","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9098,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"185d438ed973","tool_call_id":"f0"}}
```
