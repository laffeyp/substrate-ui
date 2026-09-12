# Signal report — e2e_delegate_render

Outcome: **PASS**
Summary: e2e_delegate_render — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 59 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"c3fb436a0f35"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"7371c6fe3f4e","window_id":"c3fb436a0f35","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"7371c6fe3f4e","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":31,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":358,"kind":"WORKSPACE_BOUND","payload":{"request_id":"dd9183e77d25","session_id":"b9c2b22598bf","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-delegate-render-ws-DWyz0F","shape":"flat"}}
{"t":358,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"7371c6fe3f4e","session_id":"b9c2b22598bf","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-delegate-render-ws-DWyz0F","shape":"flat"}}
{"t":358,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"7371c6fe3f4e","session_id":"b9c2b22598bf"}}
{"t":360,"kind":"DELEGATE_CALL_RENDERED","payload":{"pane_id":"7371c6fe3f4e","tool_call_id":"c0","depth":1}}
{"t":360,"kind":"TRANSCRIPT_DELEGATE_LINE_RENDERED","payload":{"pane_id":"7371c6fe3f4e","envelope_seq":0,"tool_call_id":"c0"}}
{"t":363,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7371c6fe3f4e-status","byte":56}}
```
