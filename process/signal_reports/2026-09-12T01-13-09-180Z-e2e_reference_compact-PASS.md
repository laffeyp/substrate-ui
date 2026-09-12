# Signal report — e2e_reference_compact

Outcome: **PASS**
Summary: reference-compact — six primitives, three-channel agreement (session_id=b28a65ac1872)

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 70 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"b8dc6c88fe00"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"70de356c9769","window_id":"b8dc6c88fe00","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"70de356c9769","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":371,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"f52e55543283","driver":"deterministic"}}
{"t":373,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"f52e55543283","driver":"deterministic","context_tokens":null}}
{"t":373,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"bccf9af56326","pane_id":"70de356c9769","session_id":"b28a65ac1872","name":"session-b28a65","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-hJ6wtp","workspace_shape":"flat","bundle":"","seed":""}}
{"t":374,"kind":"SESSION_CREATED","payload":{"request_id":"bccf9af56326","session_id":"b28a65ac1872","name":"session-b28a65","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-hJ6wtp","workspace_shape":"flat","status":"running"}}
{"t":374,"kind":"WORKSPACE_BOUND","payload":{"request_id":"bccf9af56326","session_id":"b28a65ac1872","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-hJ6wtp","shape":"flat"}}
{"t":374,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"70de356c9769","session_id":"b28a65ac1872","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-hJ6wtp","shape":"flat"}}
{"t":374,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"70de356c9769","session_id":"b28a65ac1872"}}
{"t":380,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-status","byte":64}}
{"t":455,"kind":"PROMPT_SUBMITTED","payload":{"pane_id":"70de356c9769","text_length":5}}
{"t":455,"kind":"TURN_SUBMIT_REQUESTED","payload":{"request_id":"a241c6337f3a","pane_id":"70de356c9769","session_id":"b28a65ac1872","text_length":5,"timeout_seconds":60}}
{"t":463,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-status","byte":96}}
{"t":463,"kind":"TURN_SUBMITTED","payload":{"request_id":"a241c6337f3a","session_id":"b28a65ac1872","turn_index":0}}
{"t":466,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"70de356c9769","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":466,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"70de356c9769","envelope_seq":14,"envelope_kind":"PromptFragment","envelope_producer_kind":"user_message_fragment"}}
{"t":466,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"70de356c9769","envelope_seq":22,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":466,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"70de356c9769","envelope_seq":27,"park_reason":"final_answer"}}
{"t":471,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-70de356c9769-status","byte":64}}
```
