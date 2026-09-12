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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"cfdc06cc93bf"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"c52aa6b2d001","window_id":"cfdc06cc93bf","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"c52aa6b2d001","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":25,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":374,"kind":"WORKSPACE_BOUND","payload":{"request_id":"38b04ae6c85b","session_id":"83a6e52746f4","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-yuu61k05","shape":"flat"}}
{"t":374,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"c52aa6b2d001","session_id":"83a6e52746f4","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-yuu61k05","shape":"flat"}}
{"t":374,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"c52aa6b2d001","session_id":"83a6e52746f4"}}
{"t":375,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"c52aa6b2d001","tool_call_id":"cP0","depth":1}}
{"t":375,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"c52aa6b2d001","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":375,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"c52aa6b2d001","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/936998e550f6/record"}}
{"t":376,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-status","byte":56}}
{"t":2407,"kind":"DESCENT_ENTERED","payload":{"pane_id":"c52aa6b2d001","child_record_root":"/Users/peterlaffey/.substrate/sessions/936998e550f6/record","depth":1}}
{"t":2409,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-descent","byte":1}}
{"t":3930,"kind":"DESCENT_ENTERED","payload":{"pane_id":"c52aa6b2d001","child_record_root":"/Users/peterlaffey/.substrate/sessions/d0c6bf30e564/record","depth":2}}
{"t":3934,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-descent","byte":2}}
{"t":5463,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"c52aa6b2d001","tool_call_id":"cB0","depth":2}}
{"t":5772,"kind":"DESCENT_EXITED","payload":{"pane_id":"c52aa6b2d001","to_depth":1}}
{"t":5774,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-descent","byte":1}}
{"t":5927,"kind":"DESCENT_EXITED","payload":{"pane_id":"c52aa6b2d001","to_depth":0}}
{"t":5929,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-descent","byte":0}}
{"t":6083,"kind":"PANE_SPLIT","payload":{"from_pane_id":"c52aa6b2d001","new_pane_id":"639dabc6f9d6","axis":"row"}}
{"t":6083,"kind":"PANE_CREATED","payload":{"pane_id":"639dabc6f9d6","window_id":"cfdc06cc93bf","session_id":null,"from_split":"7455a0bca1b5"}}
{"t":6083,"kind":"PANE_FOCUSED","payload":{"pane_id":"639dabc6f9d6","prior_pane_id":"c52aa6b2d001"}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-focus","byte":128}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-status","byte":56}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-reveal","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-lens","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-level","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-dir","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-descent","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-surface","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-find","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-inspect","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-header-popover","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-focus","byte":255}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-status","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-reveal","byte":0}}
{"t":6088,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-lens","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-level","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-dir","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-descent","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-surface","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-find","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-inspect","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-header-popover","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-focus","byte":128}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-status","byte":56}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-reveal","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-lens","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-level","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-dir","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-descent","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-surface","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-find","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-inspect","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-header-popover","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-focus","byte":255}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-status","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-reveal","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-lens","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-level","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-dir","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-descent","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-surface","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-find","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-inspect","byte":0}}
{"t":6089,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-header-popover","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-focus","byte":128}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-status","byte":56}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-reveal","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-lens","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-level","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-dir","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-descent","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-surface","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-find","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-inspect","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-c52aa6b2d001-header-popover","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-focus","byte":255}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-status","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-reveal","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-lens","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-level","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-dir","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-descent","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-surface","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-find","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-inspect","byte":0}}
{"t":6090,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-header-popover","byte":0}}
{"t":6527,"kind":"WORKSPACE_BOUND","payload":{"request_id":"31e48180ba91","session_id":"3a4be96ade09","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-taWEW6","shape":"flat"}}
{"t":6527,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"639dabc6f9d6","session_id":"3a4be96ade09","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-taWEW6","shape":"flat"}}
{"t":6527,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"639dabc6f9d6","session_id":"3a4be96ade09"}}
{"t":6529,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"639dabc6f9d6","tool_call_id":"f0","depth":1}}
{"t":6529,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"639dabc6f9d6","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6529,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"639dabc6f9d6","tool_call_id":"f1","depth":1}}
{"t":6529,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"639dabc6f9d6","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6529,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"639dabc6f9d6","tool_call_id":"f2","depth":1}}
{"t":6529,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"639dabc6f9d6","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6529,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"639dabc6f9d6","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6534,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-639dabc6f9d6-status","byte":56}}
{"t":8554,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"639dabc6f9d6","tool_call_id":"f0"}}
{"t":8768,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"639dabc6f9d6","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8874,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"639dabc6f9d6","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8980,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"639dabc6f9d6","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9088,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"639dabc6f9d6","tool_call_id":"f0"}}
```
