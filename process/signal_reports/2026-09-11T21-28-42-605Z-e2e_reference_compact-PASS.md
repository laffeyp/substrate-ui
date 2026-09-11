# Signal report — e2e_reference_compact

Outcome: **PASS**
Summary: reference-compact — six primitives, three-channel agreement (session_id=158bf2437c0d)

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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"4f43ef4b5338"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"76d794eea6a6","window_id":"4f43ef4b5338","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"76d794eea6a6","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-header_popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":26,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":369,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"bb58299ca6d3","driver":"deterministic"}}
{"t":370,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"bb58299ca6d3","driver":"deterministic","context_tokens":null}}
{"t":370,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"69ec29d1adcf","pane_id":"76d794eea6a6","session_id":"158bf2437c0d","name":"session-158bf2","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-Fvj1xo","workspace_shape":"flat","bundle":"","seed":""}}
{"t":371,"kind":"SESSION_CREATED","payload":{"request_id":"69ec29d1adcf","session_id":"158bf2437c0d","name":"session-158bf2","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-Fvj1xo","workspace_shape":"flat","status":"running"}}
{"t":371,"kind":"WORKSPACE_BOUND","payload":{"request_id":"69ec29d1adcf","session_id":"158bf2437c0d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-Fvj1xo","shape":"flat"}}
{"t":371,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"76d794eea6a6","session_id":"158bf2437c0d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-Fvj1xo","shape":"flat"}}
{"t":371,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"76d794eea6a6","session_id":"158bf2437c0d"}}
{"t":377,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-status","byte":64}}
{"t":452,"kind":"PROMPT_SUBMITTED","payload":{"pane_id":"76d794eea6a6","text_length":5}}
{"t":452,"kind":"TURN_SUBMIT_REQUESTED","payload":{"request_id":"6ca630bc8726","pane_id":"76d794eea6a6","session_id":"158bf2437c0d","text_length":5,"timeout_seconds":60}}
{"t":459,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-status","byte":96}}
{"t":460,"kind":"TURN_SUBMITTED","payload":{"request_id":"6ca630bc8726","session_id":"158bf2437c0d","turn_index":0}}
{"t":462,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"76d794eea6a6","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":463,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"76d794eea6a6","envelope_seq":14,"envelope_kind":"PromptFragment","envelope_producer_kind":"user_message_fragment"}}
{"t":463,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"76d794eea6a6","envelope_seq":22,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":463,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"76d794eea6a6","envelope_seq":27,"park_reason":"final_answer"}}
{"t":468,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-76d794eea6a6-status","byte":64}}
{"t":550,"kind":"PROMPT_CHANGED","payload":{"pane_id":"76d794eea6a6","length":5}}
```
