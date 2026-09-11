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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"b702397d3e9e"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"9e82fb00c04a","window_id":"b702397d3e9e","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"9e82fb00c04a","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":360,"kind":"WORKSPACE_BOUND","payload":{"request_id":"c229e55a0b61","session_id":"59de8263eedb","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-5cuojv0z","shape":"flat"}}
{"t":360,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"9e82fb00c04a","session_id":"59de8263eedb","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-5cuojv0z","shape":"flat"}}
{"t":360,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"9e82fb00c04a","session_id":"59de8263eedb"}}
{"t":361,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"9e82fb00c04a","tool_call_id":"cP0","depth":1}}
{"t":361,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"9e82fb00c04a","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":361,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"9e82fb00c04a","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/c151808c5612/record"}}
{"t":365,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-status","byte":56}}
{"t":2395,"kind":"DESCENT_ENTERED","payload":{"pane_id":"9e82fb00c04a","child_record_root":"/Users/peterlaffey/.substrate/sessions/c151808c5612/record","depth":1}}
{"t":2397,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-descent","byte":1}}
{"t":3920,"kind":"DESCENT_ENTERED","payload":{"pane_id":"9e82fb00c04a","child_record_root":"/Users/peterlaffey/.substrate/sessions/ba7ab81489f1/record","depth":2}}
{"t":3927,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-descent","byte":2}}
{"t":5447,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"9e82fb00c04a","tool_call_id":"cB0","depth":2}}
{"t":5758,"kind":"DESCENT_EXITED","payload":{"pane_id":"9e82fb00c04a","to_depth":1}}
{"t":5760,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-descent","byte":1}}
{"t":5913,"kind":"DESCENT_EXITED","payload":{"pane_id":"9e82fb00c04a","to_depth":0}}
{"t":5914,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-descent","byte":0}}
{"t":6067,"kind":"PANE_SPLIT","payload":{"from_pane_id":"9e82fb00c04a","new_pane_id":"000a95dd06e9","axis":"row"}}
{"t":6067,"kind":"PANE_CREATED","payload":{"pane_id":"000a95dd06e9","window_id":"b702397d3e9e","session_id":null,"from_split":"153c66e0d9dd"}}
{"t":6067,"kind":"PANE_FOCUSED","payload":{"pane_id":"000a95dd06e9","prior_pane_id":"9e82fb00c04a"}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-focus","byte":128}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-status","byte":56}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-reveal","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-lens","byte":0}}
{"t":6072,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-level","byte":0}}
{"t":6072,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-dir","byte":0}}
{"t":6072,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-descent","byte":0}}
{"t":6072,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-surface","byte":0}}
{"t":6072,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-find","byte":0}}
{"t":6072,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-inspect","byte":0}}
{"t":6072,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-header_popover","byte":0}}
{"t":6073,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-focus","byte":255}}
{"t":6073,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-status","byte":0}}
{"t":6073,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-reveal","byte":0}}
{"t":6073,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-lens","byte":0}}
{"t":6073,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-level","byte":0}}
{"t":6073,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-dir","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-descent","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-surface","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-find","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-inspect","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-header_popover","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-focus","byte":128}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-status","byte":56}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-reveal","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-lens","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-level","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-dir","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-descent","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-surface","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-find","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-inspect","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-header_popover","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-focus","byte":255}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-status","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-reveal","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-lens","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-level","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-dir","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-descent","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-surface","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-find","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-inspect","byte":0}}
{"t":6074,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-header_popover","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-focus","byte":128}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-status","byte":56}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-reveal","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-lens","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-level","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-dir","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-descent","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-surface","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-find","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-inspect","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9e82fb00c04a-header_popover","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-focus","byte":255}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-status","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-reveal","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-lens","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-level","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-dir","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-descent","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-surface","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-find","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-inspect","byte":0}}
{"t":6075,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-header_popover","byte":0}}
{"t":6507,"kind":"WORKSPACE_BOUND","payload":{"request_id":"b571920aa733","session_id":"45fa5d190cab","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-28ABoA","shape":"flat"}}
{"t":6507,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"000a95dd06e9","session_id":"45fa5d190cab","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-28ABoA","shape":"flat"}}
{"t":6507,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"000a95dd06e9","session_id":"45fa5d190cab"}}
{"t":6508,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"000a95dd06e9","tool_call_id":"f0","depth":1}}
{"t":6508,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"000a95dd06e9","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6508,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"000a95dd06e9","tool_call_id":"f1","depth":1}}
{"t":6508,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"000a95dd06e9","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6508,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"000a95dd06e9","tool_call_id":"f2","depth":1}}
{"t":6508,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"000a95dd06e9","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6508,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"000a95dd06e9","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6511,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-000a95dd06e9-status","byte":56}}
{"t":8530,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"000a95dd06e9","tool_call_id":"f0"}}
{"t":8740,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"000a95dd06e9","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8845,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"000a95dd06e9","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8949,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"000a95dd06e9","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9057,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"000a95dd06e9","tool_call_id":"f0"}}
```
