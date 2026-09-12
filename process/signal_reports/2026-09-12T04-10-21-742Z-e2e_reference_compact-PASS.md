# Signal report — e2e_reference_compact

Outcome: **PASS**
Summary: reference-compact — six primitives, three-channel agreement (session_id=740b6f5d3bc2)

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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"60e53c795c0c"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"1f0d8dfca43b","window_id":"60e53c795c0c","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"1f0d8dfca43b","prior_pane_id":null}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":8,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-header-popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":376,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"4bafcc339ed3","driver":"deterministic"}}
{"t":377,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"4bafcc339ed3","driver":"deterministic","context_tokens":null}}
{"t":377,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"034e4a0af93d","pane_id":"1f0d8dfca43b","session_id":"740b6f5d3bc2","name":"session-740b6f","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-EQglnr","workspace_shape":"flat","bundle":"","seed":""}}
{"t":378,"kind":"SESSION_CREATED","payload":{"request_id":"034e4a0af93d","session_id":"740b6f5d3bc2","name":"session-740b6f","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-EQglnr","workspace_shape":"flat","status":"running"}}
{"t":378,"kind":"WORKSPACE_BOUND","payload":{"request_id":"034e4a0af93d","session_id":"740b6f5d3bc2","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-EQglnr","shape":"flat"}}
{"t":378,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"1f0d8dfca43b","session_id":"740b6f5d3bc2","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-EQglnr","shape":"flat"}}
{"t":378,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"1f0d8dfca43b","session_id":"740b6f5d3bc2"}}
{"t":382,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-status","byte":64}}
{"t":459,"kind":"PROMPT_SUBMITTED","payload":{"pane_id":"1f0d8dfca43b","text_length":5}}
{"t":459,"kind":"TURN_SUBMIT_REQUESTED","payload":{"request_id":"732f5a8e4f44","pane_id":"1f0d8dfca43b","session_id":"740b6f5d3bc2","text_length":5,"timeout_seconds":60}}
{"t":464,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-status","byte":96}}
{"t":466,"kind":"TURN_SUBMITTED","payload":{"request_id":"732f5a8e4f44","session_id":"740b6f5d3bc2","turn_index":0}}
{"t":469,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"1f0d8dfca43b","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":469,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"1f0d8dfca43b","envelope_seq":14,"envelope_kind":"PromptFragment","envelope_producer_kind":"user_message_fragment"}}
{"t":469,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"1f0d8dfca43b","envelope_seq":22,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":469,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"1f0d8dfca43b","envelope_seq":27,"park_reason":"final_answer"}}
{"t":473,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-1f0d8dfca43b-status","byte":64}}
{"t":556,"kind":"PROMPT_CHANGED","payload":{"pane_id":"1f0d8dfca43b","length":5}}
```
