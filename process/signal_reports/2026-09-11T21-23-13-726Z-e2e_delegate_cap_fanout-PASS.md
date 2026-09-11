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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"7af3a5e62746"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"4e41dd9372ee","window_id":"7af3a5e62746","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"4e41dd9372ee","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":25,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":364,"kind":"WORKSPACE_BOUND","payload":{"request_id":"3afc70789e12","session_id":"50c3e6a300ba","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-d9fbkqy5","shape":"flat"}}
{"t":364,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"4e41dd9372ee","session_id":"50c3e6a300ba","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-d9fbkqy5","shape":"flat"}}
{"t":364,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"4e41dd9372ee","session_id":"50c3e6a300ba"}}
{"t":365,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"4e41dd9372ee","tool_call_id":"cP0","depth":1}}
{"t":365,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"4e41dd9372ee","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":365,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"4e41dd9372ee","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/17b2526bdbb1/record"}}
{"t":369,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-status","byte":56}}
{"t":2388,"kind":"DESCENT_ENTERED","payload":{"pane_id":"4e41dd9372ee","child_record_root":"/Users/peterlaffey/.substrate/sessions/17b2526bdbb1/record","depth":1}}
{"t":2393,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-descent","byte":1}}
{"t":3915,"kind":"DESCENT_ENTERED","payload":{"pane_id":"4e41dd9372ee","child_record_root":"/Users/peterlaffey/.substrate/sessions/ca3d587f1b9c/record","depth":2}}
{"t":3918,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-descent","byte":2}}
{"t":5436,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"4e41dd9372ee","tool_call_id":"cB0","depth":2}}
{"t":5745,"kind":"DESCENT_EXITED","payload":{"pane_id":"4e41dd9372ee","to_depth":1}}
{"t":5747,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-descent","byte":1}}
{"t":5900,"kind":"DESCENT_EXITED","payload":{"pane_id":"4e41dd9372ee","to_depth":0}}
{"t":5904,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-descent","byte":0}}
{"t":6060,"kind":"PANE_SPLIT","payload":{"from_pane_id":"4e41dd9372ee","new_pane_id":"217f5a594a5b","axis":"row"}}
{"t":6060,"kind":"PANE_CREATED","payload":{"pane_id":"217f5a594a5b","window_id":"7af3a5e62746","session_id":null,"from_split":"945ad008ba07"}}
{"t":6060,"kind":"PANE_FOCUSED","payload":{"pane_id":"217f5a594a5b","prior_pane_id":"4e41dd9372ee"}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-focus","byte":128}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-status","byte":56}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-reveal","byte":0}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-lens","byte":0}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-level","byte":0}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-dir","byte":0}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-descent","byte":0}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-surface","byte":0}}
{"t":6065,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-find","byte":0}}
{"t":6066,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-inspect","byte":0}}
{"t":6066,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-header_popover","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-focus","byte":255}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-status","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-reveal","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-lens","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-level","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-dir","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-descent","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-surface","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-find","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-inspect","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-header_popover","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-focus","byte":128}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-status","byte":56}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-reveal","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-lens","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-level","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-dir","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-descent","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-surface","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-find","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-inspect","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-header_popover","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-focus","byte":255}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-status","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-reveal","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-lens","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-level","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-dir","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-descent","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-surface","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-find","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-inspect","byte":0}}
{"t":6068,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-header_popover","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-focus","byte":128}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-status","byte":56}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-reveal","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-lens","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-level","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-dir","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-descent","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-surface","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-find","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-inspect","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-4e41dd9372ee-header_popover","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-focus","byte":255}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-status","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-reveal","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-lens","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-level","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-dir","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-descent","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-surface","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-find","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-inspect","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-header_popover","byte":0}}
{"t":6497,"kind":"WORKSPACE_BOUND","payload":{"request_id":"f39de7e46ccc","session_id":"0bdd63cff46a","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-wYD8y6","shape":"flat"}}
{"t":6497,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"217f5a594a5b","session_id":"0bdd63cff46a","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-wYD8y6","shape":"flat"}}
{"t":6497,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"217f5a594a5b","session_id":"0bdd63cff46a"}}
{"t":6498,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"217f5a594a5b","tool_call_id":"f0","depth":1}}
{"t":6498,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"217f5a594a5b","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6498,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"217f5a594a5b","tool_call_id":"f1","depth":1}}
{"t":6498,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"217f5a594a5b","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6498,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"217f5a594a5b","tool_call_id":"f2","depth":1}}
{"t":6498,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"217f5a594a5b","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6498,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"217f5a594a5b","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6501,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-217f5a594a5b-status","byte":56}}
{"t":8520,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"217f5a594a5b","tool_call_id":"f0"}}
{"t":8735,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"217f5a594a5b","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8840,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"217f5a594a5b","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8948,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"217f5a594a5b","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9058,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"217f5a594a5b","tool_call_id":"f0"}}
```
