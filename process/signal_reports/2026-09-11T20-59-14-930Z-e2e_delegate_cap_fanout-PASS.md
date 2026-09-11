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
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"4ac45d3d3ab3"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"3a74ea9adb22","window_id":"4ac45d3d3ab3","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"3a74ea9adb22","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-header_popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":27,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":366,"kind":"WORKSPACE_BOUND","payload":{"request_id":"966711d2df78","session_id":"471073013bc3","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-8be4v5r2","shape":"flat"}}
{"t":366,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"3a74ea9adb22","session_id":"471073013bc3","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-cap-ws-8be4v5r2","shape":"flat"}}
{"t":366,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"3a74ea9adb22","session_id":"471073013bc3"}}
{"t":367,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"3a74ea9adb22","tool_call_id":"cP0","depth":1}}
{"t":367,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"3a74ea9adb22","envelope_seq":0,"tool_call_id":"cP0"}}
{"t":367,"kind":"DELEGATE_CALL_FOLDED","payload":{"pane_id":"3a74ea9adb22","tool_call_id":"cP0","child_record_root":"/Users/peterlaffey/.substrate/sessions/bffe0dca0f2f/record"}}
{"t":371,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-status","byte":56}}
{"t":2401,"kind":"DESCENT_ENTERED","payload":{"pane_id":"3a74ea9adb22","child_record_root":"/Users/peterlaffey/.substrate/sessions/bffe0dca0f2f/record","depth":1}}
{"t":2403,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-descent","byte":1}}
{"t":3933,"kind":"DESCENT_ENTERED","payload":{"pane_id":"3a74ea9adb22","child_record_root":"/Users/peterlaffey/.substrate/sessions/aee619af1820/record","depth":2}}
{"t":3937,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-descent","byte":2}}
{"t":5465,"kind":"DELEGATE_DEPTH_CAP_REFUSED","payload":{"pane_id":"3a74ea9adb22","tool_call_id":"cB0","depth":2}}
{"t":5776,"kind":"DESCENT_EXITED","payload":{"pane_id":"3a74ea9adb22","to_depth":1}}
{"t":5778,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-descent","byte":1}}
{"t":5932,"kind":"DESCENT_EXITED","payload":{"pane_id":"3a74ea9adb22","to_depth":0}}
{"t":5934,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-descent","byte":0}}
{"t":6088,"kind":"PANE_SPLIT","payload":{"from_pane_id":"3a74ea9adb22","new_pane_id":"8cfd034e129c","axis":"row"}}
{"t":6088,"kind":"PANE_CREATED","payload":{"pane_id":"8cfd034e129c","window_id":"4ac45d3d3ab3","session_id":null,"from_split":"38386feea64d"}}
{"t":6088,"kind":"PANE_FOCUSED","payload":{"pane_id":"8cfd034e129c","prior_pane_id":"3a74ea9adb22"}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-focus","byte":128}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-status","byte":56}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-reveal","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-lens","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-level","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-dir","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-descent","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-surface","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-find","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-inspect","byte":0}}
{"t":6091,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-header_popover","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-focus","byte":255}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-status","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-reveal","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-lens","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-level","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-dir","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-descent","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-surface","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-find","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-inspect","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-header_popover","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-focus","byte":128}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-status","byte":56}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-reveal","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-lens","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-level","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-dir","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-descent","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-surface","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-find","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-inspect","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-header_popover","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-focus","byte":255}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-status","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-reveal","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-lens","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-level","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-dir","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-descent","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-surface","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-find","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-inspect","byte":0}}
{"t":6093,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-header_popover","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-focus","byte":128}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-status","byte":56}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-reveal","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-lens","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-level","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-dir","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-descent","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-surface","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-find","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-inspect","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3a74ea9adb22-header_popover","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-focus","byte":255}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-status","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-reveal","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-lens","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-level","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-dir","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-descent","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-surface","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-find","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-inspect","byte":0}}
{"t":6094,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-header_popover","byte":0}}
{"t":6529,"kind":"WORKSPACE_BOUND","payload":{"request_id":"d1bfc1fc414f","session_id":"54521c62a664","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-Xj0T7M","shape":"flat"}}
{"t":6529,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"8cfd034e129c","session_id":"54521c62a664","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-fanout-ws-Xj0T7M","shape":"flat"}}
{"t":6529,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"8cfd034e129c","session_id":"54521c62a664"}}
{"t":6531,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"8cfd034e129c","tool_call_id":"f0","depth":1}}
{"t":6531,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"8cfd034e129c","envelope_seq":0,"tool_call_id":"f0"}}
{"t":6531,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"8cfd034e129c","tool_call_id":"f1","depth":1}}
{"t":6531,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"8cfd034e129c","envelope_seq":1,"tool_call_id":"f1"}}
{"t":6531,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"8cfd034e129c","tool_call_id":"f2","depth":1}}
{"t":6531,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"8cfd034e129c","envelope_seq":2,"tool_call_id":"f2"}}
{"t":6531,"kind":"TRANSCRIPT_FANOUT_LINE_RENDERED","payload":{"pane_id":"8cfd034e129c","envelope_seq":0,"tool_call_id":"f0","children_count":3}}
{"t":6536,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-8cfd034e129c-status","byte":56}}
{"t":8558,"kind":"FAN_OUT_INLINE_EXPANDED","payload":{"pane_id":"8cfd034e129c","tool_call_id":"f0"}}
{"t":8772,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"8cfd034e129c","tool_call_id":"f0","from_index":0,"to_index":1}}
{"t":8878,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"8cfd034e129c","tool_call_id":"f0","from_index":1,"to_index":2}}
{"t":8985,"kind":"FAN_OUT_INLINE_WALKED","payload":{"pane_id":"8cfd034e129c","tool_call_id":"f0","from_index":2,"to_index":1}}
{"t":9091,"kind":"FAN_OUT_INLINE_COLLAPSED","payload":{"pane_id":"8cfd034e129c","tool_call_id":"f0"}}
```
