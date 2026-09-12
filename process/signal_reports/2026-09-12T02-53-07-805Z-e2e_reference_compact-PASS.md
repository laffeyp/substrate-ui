# Signal report — e2e_reference_compact

Outcome: **PASS**
Summary: reference-compact — six primitives, three-channel agreement (session_id=a9aba689600e)

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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"edf83c0f26a0"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"445a8acb2ac9","window_id":"edf83c0f26a0","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"445a8acb2ac9","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":29,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":375,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"589ba345fcc4","driver":"deterministic"}}
{"t":379,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"589ba345fcc4","driver":"deterministic","context_tokens":null}}
{"t":379,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"8cfe47c0f78a","pane_id":"445a8acb2ac9","session_id":"a9aba689600e","name":"session-a9aba6","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-05YtBE","workspace_shape":"flat","bundle":"","seed":""}}
{"t":381,"kind":"SESSION_CREATED","payload":{"request_id":"8cfe47c0f78a","session_id":"a9aba689600e","name":"session-a9aba6","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-05YtBE","workspace_shape":"flat","status":"running"}}
{"t":381,"kind":"WORKSPACE_BOUND","payload":{"request_id":"8cfe47c0f78a","session_id":"a9aba689600e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-05YtBE","shape":"flat"}}
{"t":381,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"445a8acb2ac9","session_id":"a9aba689600e","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-05YtBE","shape":"flat"}}
{"t":381,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"445a8acb2ac9","session_id":"a9aba689600e"}}
{"t":388,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-status","byte":64}}
{"t":462,"kind":"PROMPT_SUBMITTED","payload":{"pane_id":"445a8acb2ac9","text_length":5}}
{"t":462,"kind":"TURN_SUBMIT_REQUESTED","payload":{"request_id":"650bb95acd49","pane_id":"445a8acb2ac9","session_id":"a9aba689600e","text_length":5,"timeout_seconds":60}}
{"t":463,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-status","byte":96}}
{"t":470,"kind":"TURN_SUBMITTED","payload":{"request_id":"650bb95acd49","session_id":"a9aba689600e","turn_index":0}}
{"t":471,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-445a8acb2ac9-status","byte":64}}
{"t":472,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"445a8acb2ac9","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":472,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"445a8acb2ac9","envelope_seq":14,"envelope_kind":"PromptFragment","envelope_producer_kind":"user_message_fragment"}}
{"t":472,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"445a8acb2ac9","envelope_seq":22,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":472,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"445a8acb2ac9","envelope_seq":27,"park_reason":"final_answer"}}
{"t":557,"kind":"PROMPT_CHANGED","payload":{"pane_id":"445a8acb2ac9","length":5}}
```
