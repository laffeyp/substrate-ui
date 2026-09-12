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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"934490fce4ac"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"fe4afcb4f15d","window_id":"934490fce4ac","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"fe4afcb4f15d","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":363,"kind":"WORKSPACE_BOUND","payload":{"request_id":"3b0cfa7bdb4f","session_id":"dec1f4db6842","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-ywnnip25","shape":"flat"}}
{"t":363,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"fe4afcb4f15d","session_id":"dec1f4db6842","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-ywnnip25","shape":"flat"}}
{"t":363,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"fe4afcb4f15d","session_id":"dec1f4db6842"}}
{"t":365,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"fe4afcb4f15d","tool_call_id":"cP0","depth":1}}
{"t":365,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"fe4afcb4f15d","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":365,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"fe4afcb4f15d","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/12b15ed10533/record"}}
{"t":368,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-status","byte":56}}
{"t":2398,"kind":"DESCENT_ENTERED","payload":{"pane_id":"fe4afcb4f15d","child_record_root":"/Users/peterlaffey/.substrate/sessions/12b15ed10533/record","depth":1}}
{"t":2400,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-descent","byte":1}}
{"t":3930,"kind":"DESCENT_ENTERED","payload":{"pane_id":"fe4afcb4f15d","child_record_root":"/Users/peterlaffey/.substrate/sessions/1d67b10f0ed5/record","depth":2}}
{"t":3934,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-descent","byte":2}}
{"t":5461,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"fe4afcb4f15d","tool_call_id":"cB0","depth":2}}
{"t":5771,"kind":"DESCENT_EXITED","payload":{"pane_id":"fe4afcb4f15d","to_depth":1}}
{"t":5773,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-descent","byte":1}}
{"t":5926,"kind":"DESCENT_EXITED","payload":{"pane_id":"fe4afcb4f15d","to_depth":0}}
{"t":5928,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-descent","byte":0}}
{"t":6082,"kind":"PANE_SPLIT","payload":{"from_pane_id":"fe4afcb4f15d","new_pane_id":"b8b10f256a0c","axis":"row"}}
{"t":6082,"kind":"PANE_CREATED","payload":{"pane_id":"b8b10f256a0c","window_id":"934490fce4ac","session_id":null,"from_split":"70470d0c5d14"}}
{"t":6082,"kind":"PANE_FOCUSED","payload":{"pane_id":"b8b10f256a0c","prior_pane_id":"fe4afcb4f15d"}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-focus","byte":128}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-status","byte":56}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-reveal","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-lens","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-level","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-dir","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-descent","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-surface","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-find","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-inspect","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-header-popover","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-focus","byte":255}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-status","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-reveal","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-lens","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-level","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-dir","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-descent","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-surface","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-find","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-inspect","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-header-popover","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-focus","byte":128}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-status","byte":56}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-reveal","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-lens","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-level","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-dir","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-descent","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-surface","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-find","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-inspect","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-header-popover","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-focus","byte":255}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-status","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-reveal","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-lens","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-level","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-dir","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-descent","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-surface","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-find","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-inspect","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-header-popover","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-focus","byte":128}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-status","byte":56}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-reveal","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-lens","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-level","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-dir","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-descent","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-surface","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-find","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-inspect","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fe4afcb4f15d-header-popover","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-focus","byte":255}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-status","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-reveal","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-lens","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-level","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-dir","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-descent","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-surface","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-find","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-inspect","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-header-popover","byte":0}}
{"t":6513,"kind":"WORKSPACE_BOUND","payload":{"request_id":"6723bb0fa0b3","session_id":"7260e762974d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-UAwBqa","shape":"flat"}}
{"t":6513,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"b8b10f256a0c","session_id":"7260e762974d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-UAwBqa","shape":"flat"}}
{"t":6513,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"b8b10f256a0c","session_id":"7260e762974d"}}
{"t":6515,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"b8b10f256a0c","tool_call_id":"f0","depth":1}}
{"t":6515,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"b8b10f256a0c","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6515,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"b8b10f256a0c","tool_call_id":"f1","depth":1}}
{"t":6515,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"b8b10f256a0c","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6515,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"b8b10f256a0c","tool_call_id":"f2","depth":1}}
{"t":6515,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"b8b10f256a0c","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6515,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"b8b10f256a0c","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6516,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b8b10f256a0c-status","byte":56}}
{"t":8544,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"b8b10f256a0c","tool_call_id":"f0"}}
{"t":8755,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"b8b10f256a0c","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8861,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"b8b10f256a0c","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8967,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"b8b10f256a0c","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9078,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"b8b10f256a0c","tool_call_id":"f0"}}
```
