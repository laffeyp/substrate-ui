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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"814aaa5e45ae"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"7f0d4041e3be","window_id":"814aaa5e45ae","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"7f0d4041e3be","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":31,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":367,"kind":"WORKSPACE_BOUND","payload":{"request_id":"910eb3cc56c9","session_id":"332635af8f15","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-hzm3xo4t","shape":"flat"}}
{"t":367,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"7f0d4041e3be","session_id":"332635af8f15","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-hzm3xo4t","shape":"flat"}}
{"t":367,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"7f0d4041e3be","session_id":"332635af8f15"}}
{"t":368,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"7f0d4041e3be","tool_call_id":"cP0","depth":1}}
{"t":368,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"7f0d4041e3be","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":368,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"7f0d4041e3be","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/0a56116de256/record"}}
{"t":372,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-status","byte":56}}
{"t":2402,"kind":"DESCENT_ENTERED","payload":{"pane_id":"7f0d4041e3be","child_record_root":"/Users/peterlaffey/.substrate/sessions/0a56116de256/record","depth":1}}
{"t":2403,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-descent","byte":1}}
{"t":3933,"kind":"DESCENT_ENTERED","payload":{"pane_id":"7f0d4041e3be","child_record_root":"/Users/peterlaffey/.substrate/sessions/f3ca48ec3011/record","depth":2}}
{"t":3937,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-descent","byte":2}}
{"t":5457,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"7f0d4041e3be","tool_call_id":"cB0","depth":2}}
{"t":5767,"kind":"DESCENT_EXITED","payload":{"pane_id":"7f0d4041e3be","to_depth":1}}
{"t":5768,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-descent","byte":1}}
{"t":5922,"kind":"DESCENT_EXITED","payload":{"pane_id":"7f0d4041e3be","to_depth":0}}
{"t":5924,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-descent","byte":0}}
{"t":6079,"kind":"PANE_SPLIT","payload":{"from_pane_id":"7f0d4041e3be","new_pane_id":"31a816dc18e4","axis":"row"}}
{"t":6079,"kind":"PANE_CREATED","payload":{"pane_id":"31a816dc18e4","window_id":"814aaa5e45ae","session_id":null,"from_split":"5eca0b5822df"}}
{"t":6079,"kind":"PANE_FOCUSED","payload":{"pane_id":"31a816dc18e4","prior_pane_id":"7f0d4041e3be"}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-focus","byte":128}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-status","byte":56}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-reveal","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-lens","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-level","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-dir","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-descent","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-surface","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-find","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-inspect","byte":0}}
{"t":6083,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-header-popover","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-focus","byte":255}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-status","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-reveal","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-lens","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-level","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-dir","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-descent","byte":0}}
{"t":6085,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-surface","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-find","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-inspect","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-header-popover","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-focus","byte":128}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-status","byte":56}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-reveal","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-lens","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-level","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-dir","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-descent","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-surface","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-find","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-inspect","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-header-popover","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-focus","byte":255}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-status","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-reveal","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-lens","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-level","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-dir","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-descent","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-surface","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-find","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-inspect","byte":0}}
{"t":6086,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-header-popover","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-focus","byte":128}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-status","byte":56}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-reveal","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-lens","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-level","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-dir","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-descent","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-surface","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-find","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-inspect","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7f0d4041e3be-header-popover","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-focus","byte":255}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-status","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-reveal","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-lens","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-level","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-dir","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-descent","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-surface","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-find","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-inspect","byte":0}}
{"t":6087,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-header-popover","byte":0}}
{"t":6516,"kind":"WORKSPACE_BOUND","payload":{"request_id":"2e740955010d","session_id":"a79d1154f80d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-iycSRB","shape":"flat"}}
{"t":6516,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"31a816dc18e4","session_id":"a79d1154f80d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-iycSRB","shape":"flat"}}
{"t":6516,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"31a816dc18e4","session_id":"a79d1154f80d"}}
{"t":6517,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"31a816dc18e4","tool_call_id":"f0","depth":1}}
{"t":6517,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"31a816dc18e4","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6517,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"31a816dc18e4","tool_call_id":"f1","depth":1}}
{"t":6517,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"31a816dc18e4","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6517,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"31a816dc18e4","tool_call_id":"f2","depth":1}}
{"t":6517,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"31a816dc18e4","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6517,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"31a816dc18e4","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6522,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-31a816dc18e4-status","byte":56}}
{"t":8539,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"31a816dc18e4","tool_call_id":"f0"}}
{"t":8750,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"31a816dc18e4","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8857,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"31a816dc18e4","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8963,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"31a816dc18e4","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9073,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"31a816dc18e4","tool_call_id":"f0"}}
```
