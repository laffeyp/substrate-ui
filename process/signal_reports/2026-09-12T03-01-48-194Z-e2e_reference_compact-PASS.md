# Signal report — e2e_reference_compact

Outcome: **PASS**
Summary: reference-compact — six primitives, three-channel agreement (session_id=5fa012fe92b5)

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 71 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"91b1d1fe17fb"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"63610a22cf1f","window_id":"91b1d1fe17fb","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"63610a22cf1f","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-focus","byte":255}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-status","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-reveal","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-lens","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-level","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-dir","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-descent","byte":0}}
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":30,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":372,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"e55c012f13bf","driver":"deterministic"}}
{"t":373,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"e55c012f13bf","driver":"deterministic","context_tokens":null}}
{"t":373,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"4cc99e39863c","pane_id":"63610a22cf1f","session_id":"5fa012fe92b5","name":"session-5fa012","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-f9gOac","workspace_shape":"flat","bundle":"","seed":""}}
{"t":374,"kind":"SESSION_CREATED","payload":{"request_id":"4cc99e39863c","session_id":"5fa012fe92b5","name":"session-5fa012","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-f9gOac","workspace_shape":"flat","status":"running"}}
{"t":374,"kind":"WORKSPACE_BOUND","payload":{"request_id":"4cc99e39863c","session_id":"5fa012fe92b5","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-f9gOac","shape":"flat"}}
{"t":374,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"63610a22cf1f","session_id":"5fa012fe92b5","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-f9gOac","shape":"flat"}}
{"t":374,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"63610a22cf1f","session_id":"5fa012fe92b5"}}
{"t":377,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-status","byte":64}}
{"t":455,"kind":"PROMPT_SUBMITTED","payload":{"pane_id":"63610a22cf1f","text_length":5}}
{"t":455,"kind":"TURN_SUBMIT_REQUESTED","payload":{"request_id":"ff8dbec69819","pane_id":"63610a22cf1f","session_id":"5fa012fe92b5","text_length":5,"timeout_seconds":60}}
{"t":460,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-status","byte":96}}
{"t":462,"kind":"TURN_SUBMITTED","payload":{"request_id":"ff8dbec69819","session_id":"5fa012fe92b5","turn_index":0}}
{"t":465,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"63610a22cf1f","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":465,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"63610a22cf1f","envelope_seq":14,"envelope_kind":"PromptFragment","envelope_producer_kind":"user_message_fragment"}}
{"t":465,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"63610a22cf1f","envelope_seq":22,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":465,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"63610a22cf1f","envelope_seq":27,"park_reason":"final_answer"}}
{"t":468,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-63610a22cf1f-status","byte":64}}
{"t":551,"kind":"PROMPT_CHANGED","payload":{"pane_id":"63610a22cf1f","length":5}}
```
