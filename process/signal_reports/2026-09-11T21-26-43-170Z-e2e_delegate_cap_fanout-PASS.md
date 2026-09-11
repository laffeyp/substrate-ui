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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"72667885488e"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"527ba1615ea9","window_id":"72667885488e","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"527ba1615ea9","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-header_popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":26,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":374,"kind":"WORKSPACE_BOUND","payload":{"request_id":"052f80c953bf","session_id":"9c084c5f27c4","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-8nl76k59","shape":"flat"}}
{"t":374,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"527ba1615ea9","session_id":"9c084c5f27c4","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-8nl76k59","shape":"flat"}}
{"t":374,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"527ba1615ea9","session_id":"9c084c5f27c4"}}
{"t":376,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"527ba1615ea9","tool_call_id":"cP0","depth":1}}
{"t":376,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"527ba1615ea9","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":376,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"527ba1615ea9","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/8fd3cc70cca5/record"}}
{"t":379,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-status","byte":56}}
{"t":2393,"kind":"DESCENT_ENTERED","payload":{"pane_id":"527ba1615ea9","child_record_root":"/Users/peterlaffey/.substrate/sessions/8fd3cc70cca5/record","depth":1}}
{"t":2398,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-descent","byte":1}}
{"t":3921,"kind":"DESCENT_ENTERED","payload":{"pane_id":"527ba1615ea9","child_record_root":"/Users/peterlaffey/.substrate/sessions/358462611155/record","depth":2}}
{"t":3923,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-descent","byte":2}}
{"t":5441,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"527ba1615ea9","tool_call_id":"cB0","depth":2}}
{"t":5749,"kind":"DESCENT_EXITED","payload":{"pane_id":"527ba1615ea9","to_depth":1}}
{"t":5751,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-descent","byte":1}}
{"t":5905,"kind":"DESCENT_EXITED","payload":{"pane_id":"527ba1615ea9","to_depth":0}}
{"t":5906,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-descent","byte":0}}
{"t":6062,"kind":"PANE_SPLIT","payload":{"from_pane_id":"527ba1615ea9","new_pane_id":"6c371d048396","axis":"row"}}
{"t":6062,"kind":"PANE_CREATED","payload":{"pane_id":"6c371d048396","window_id":"72667885488e","session_id":null,"from_split":"de19686243c5"}}
{"t":6062,"kind":"PANE_FOCUSED","payload":{"pane_id":"6c371d048396","prior_pane_id":"527ba1615ea9"}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-focus","byte":128}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-status","byte":56}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-reveal","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-lens","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-level","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-dir","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-descent","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-surface","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-find","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-inspect","byte":0}}
{"t":6067,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-header_popover","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-focus","byte":255}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-status","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-reveal","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-lens","byte":0}}
{"t":6069,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-level","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-dir","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-descent","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-surface","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-find","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-inspect","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-header_popover","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-focus","byte":128}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-status","byte":56}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-reveal","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-lens","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-level","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-dir","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-descent","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-surface","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-find","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-inspect","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-header_popover","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-focus","byte":255}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-status","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-reveal","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-lens","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-level","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-dir","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-descent","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-surface","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-find","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-inspect","byte":0}}
{"t":6070,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-header_popover","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-focus","byte":128}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-status","byte":56}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-reveal","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-lens","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-level","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-dir","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-descent","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-surface","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-find","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-inspect","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-527ba1615ea9-header_popover","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-focus","byte":255}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-status","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-reveal","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-lens","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-level","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-dir","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-descent","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-surface","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-find","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-inspect","byte":0}}
{"t":6071,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-header_popover","byte":0}}
{"t":6494,"kind":"WORKSPACE_BOUND","payload":{"request_id":"e426cb731e03","session_id":"af0a225361a6","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-ipz0hc","shape":"flat"}}
{"t":6494,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"6c371d048396","session_id":"af0a225361a6","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-ipz0hc","shape":"flat"}}
{"t":6494,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"6c371d048396","session_id":"af0a225361a6"}}
{"t":6495,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"6c371d048396","tool_call_id":"f0","depth":1}}
{"t":6495,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"6c371d048396","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6495,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"6c371d048396","tool_call_id":"f1","depth":1}}
{"t":6495,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"6c371d048396","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6495,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"6c371d048396","tool_call_id":"f2","depth":1}}
{"t":6495,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"6c371d048396","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6495,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"6c371d048396","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6499,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-6c371d048396-status","byte":56}}
{"t":8513,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"6c371d048396","tool_call_id":"f0"}}
{"t":8726,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"6c371d048396","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8831,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"6c371d048396","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8937,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"6c371d048396","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9045,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"6c371d048396","tool_call_id":"f0"}}
```
