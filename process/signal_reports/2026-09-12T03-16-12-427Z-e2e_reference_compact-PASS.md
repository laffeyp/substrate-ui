# Signal report — e2e_reference_compact

Outcome: **PASS**
Summary: reference-compact — six primitives, three-channel agreement (session_id=986eb4991183)

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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"cbbb4f8cbb54"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"46a82b0bf12a","window_id":"cbbb4f8cbb54","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"46a82b0bf12a","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":23,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":376,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"94588c709348","driver":"deterministic"}}
{"t":381,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"94588c709348","driver":"deterministic","context_tokens":null}}
{"t":382,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"b457d0dbc597","pane_id":"46a82b0bf12a","session_id":"986eb4991183","name":"session-986eb4","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-cHTed6","workspace_shape":"flat","bundle":"","seed":""}}
{"t":383,"kind":"SESSION_CREATED","payload":{"request_id":"b457d0dbc597","session_id":"986eb4991183","name":"session-986eb4","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-cHTed6","workspace_shape":"flat","status":"running"}}
{"t":383,"kind":"WORKSPACE_BOUND","payload":{"request_id":"b457d0dbc597","session_id":"986eb4991183","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-cHTed6","shape":"flat"}}
{"t":383,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"46a82b0bf12a","session_id":"986eb4991183","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-cHTed6","shape":"flat"}}
{"t":383,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"46a82b0bf12a","session_id":"986eb4991183"}}
{"t":391,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-status","byte":64}}
{"t":466,"kind":"PROMPT_SUBMITTED","payload":{"pane_id":"46a82b0bf12a","text_length":5}}
{"t":466,"kind":"TURN_SUBMIT_REQUESTED","payload":{"request_id":"e8fa2c412b8a","pane_id":"46a82b0bf12a","session_id":"986eb4991183","text_length":5,"timeout_seconds":60}}
{"t":473,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-status","byte":96}}
{"t":474,"kind":"TURN_SUBMITTED","payload":{"request_id":"e8fa2c412b8a","session_id":"986eb4991183","turn_index":0}}
{"t":476,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"46a82b0bf12a","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":476,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"46a82b0bf12a","envelope_seq":14,"envelope_kind":"PromptFragment","envelope_producer_kind":"user_message_fragment"}}
{"t":476,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"46a82b0bf12a","envelope_seq":22,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":476,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"46a82b0bf12a","envelope_seq":27,"park_reason":"final_answer"}}
{"t":481,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-46a82b0bf12a-status","byte":64}}
{"t":560,"kind":"PROMPT_CHANGED","payload":{"pane_id":"46a82b0bf12a","length":5}}
```
