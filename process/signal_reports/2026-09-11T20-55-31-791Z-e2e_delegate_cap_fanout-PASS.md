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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"d37b35e779a0"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"60f121776e38","window_id":"d37b35e779a0","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"60f121776e38","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-header_popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":25,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":363,"kind":"WORKSPACE_BOUND","payload":{"request_id":"2b082cffc00b","session_id":"ed90dbd05ac0","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-_jm0d1we","shape":"flat"}}
{"t":363,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"60f121776e38","session_id":"ed90dbd05ac0","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-_jm0d1we","shape":"flat"}}
{"t":363,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"60f121776e38","session_id":"ed90dbd05ac0"}}
{"t":365,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"60f121776e38","tool_call_id":"cP0","depth":1}}
{"t":365,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"60f121776e38","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":365,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"60f121776e38","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/07004b470a3a/record"}}
{"t":369,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-status","byte":56}}
{"t":2387,"kind":"DESCENT_ENTERED","payload":{"pane_id":"60f121776e38","child_record_root":"/Users/peterlaffey/.substrate/sessions/07004b470a3a/record","depth":1}}
{"t":2392,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-descent","byte":1}}
{"t":3913,"kind":"DESCENT_ENTERED","payload":{"pane_id":"60f121776e38","child_record_root":"/Users/peterlaffey/.substrate/sessions/51bccea32656/record","depth":2}}
{"t":3918,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-descent","byte":2}}
{"t":5438,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"60f121776e38","tool_call_id":"cB0","depth":2}}
{"t":5747,"kind":"DESCENT_EXITED","payload":{"pane_id":"60f121776e38","to_depth":1}}
{"t":5749,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-descent","byte":1}}
{"t":5902,"kind":"DESCENT_EXITED","payload":{"pane_id":"60f121776e38","to_depth":0}}
{"t":5906,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-descent","byte":0}}
{"t":6060,"kind":"PANE_SPLIT","payload":{"from_pane_id":"60f121776e38","new_pane_id":"6d45469c257c","axis":"row"}}
{"t":6061,"kind":"PANE_CREATED","payload":{"pane_id":"6d45469c257c","window_id":"d37b35e779a0","session_id":null,"from_split":"23ba45c07ff1"}}
{"t":6061,"kind":"PANE_FOCUSED","payload":{"pane_id":"6d45469c257c","prior_pane_id":"60f121776e38"}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-focus","byte":128}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-status","byte":56}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-reveal","byte":0}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-lens","byte":0}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-level","byte":0}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-dir","byte":0}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-descent","byte":0}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-surface","byte":0}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-find","byte":0}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-inspect","byte":0}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-header_popover","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-focus","byte":255}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-status","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-reveal","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-lens","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-level","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-dir","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-descent","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-surface","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-find","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-inspect","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-header_popover","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-focus","byte":128}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-status","byte":56}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-reveal","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-lens","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-level","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-dir","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-descent","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-surface","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-find","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-inspect","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-header_popover","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-focus","byte":255}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-status","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-reveal","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-lens","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-level","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-dir","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-descent","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-surface","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-find","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-inspect","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-header_popover","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-focus","byte":128}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-status","byte":56}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-reveal","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-lens","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-level","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-dir","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-descent","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-surface","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-find","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-inspect","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-60f121776e38-header_popover","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-focus","byte":255}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-status","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-reveal","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-lens","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-level","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-dir","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-descent","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-surface","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-find","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-inspect","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-header_popover","byte":0}}
{"t":6500,"kind":"WORKSPACE_BOUND","payload":{"request_id":"73c66e8d6b8f","session_id":"57c64cf48d76","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-tQKJvk","shape":"flat"}}
{"t":6500,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"6d45469c257c","session_id":"57c64cf48d76","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-tQKJvk","shape":"flat"}}
{"t":6500,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"6d45469c257c","session_id":"57c64cf48d76"}}
{"t":6502,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"6d45469c257c","tool_call_id":"f0","depth":1}}
{"t":6502,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"6d45469c257c","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6502,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"6d45469c257c","tool_call_id":"f1","depth":1}}
{"t":6502,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"6d45469c257c","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6502,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"6d45469c257c","tool_call_id":"f2","depth":1}}
{"t":6502,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"6d45469c257c","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6502,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"6d45469c257c","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6509,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6d45469c257c-status","byte":56}}
{"t":8530,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"6d45469c257c","tool_call_id":"f0"}}
{"t":8743,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"6d45469c257c","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8848,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"6d45469c257c","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8954,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"6d45469c257c","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9064,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"6d45469c257c","tool_call_id":"f0"}}
```
