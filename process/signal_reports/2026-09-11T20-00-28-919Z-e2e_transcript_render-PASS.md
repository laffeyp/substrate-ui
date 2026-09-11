# Signal report — e2e_transcript_render

Outcome: **PASS**
Summary: e2e_transcript_render — three-channel agreement

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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"0f5bf4d3ccb1"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"9eafe5c60288","window_id":"0f5bf4d3ccb1","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"9eafe5c60288","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-header_popover","byte":0}}
{"t":22,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":26,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":358,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"15e7908f51ad","driver":"deterministic"}}
{"t":359,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"15e7908f51ad","driver":"deterministic","context_tokens":null}}
{"t":359,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"b340f1d0c516","pane_id":"9eafe5c60288","session_id":"5b20fe316557","name":"session-5b20fe","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-SM4Kaw","workspace_shape":"flat","bundle":"","seed":""}}
{"t":361,"kind":"SESSION_CREATED","payload":{"request_id":"b340f1d0c516","session_id":"5b20fe316557","name":"session-5b20fe","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-SM4Kaw","workspace_shape":"flat","status":"running"}}
{"t":361,"kind":"WORKSPACE_BOUND","payload":{"request_id":"b340f1d0c516","session_id":"5b20fe316557","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-SM4Kaw","shape":"flat"}}
{"t":361,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"9eafe5c60288","session_id":"5b20fe316557","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-SM4Kaw","shape":"flat"}}
{"t":361,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"9eafe5c60288","session_id":"5b20fe316557"}}
{"t":369,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-status","byte":64}}
{"t":424,"kind":"PROMPT_SUBMITTED","payload":{"pane_id":"9eafe5c60288","text_length":5}}
{"t":424,"kind":"TURN_SUBMIT_REQUESTED","payload":{"request_id":"6c98d74afb5b","pane_id":"9eafe5c60288","session_id":"5b20fe316557","text_length":5,"timeout_seconds":60}}
{"t":426,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-status","byte":96}}
{"t":432,"kind":"TURN_SUBMITTED","payload":{"request_id":"6c98d74afb5b","session_id":"5b20fe316557","turn_index":0}}
{"t":434,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-9eafe5c60288-status","byte":64}}
{"t":435,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"9eafe5c60288","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":435,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"9eafe5c60288","envelope_seq":14,"envelope_kind":"PromptFragment","envelope_producer_kind":"user_message_fragment"}}
{"t":435,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"9eafe5c60288","envelope_seq":22,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":435,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"9eafe5c60288","envelope_seq":27,"park_reason":"final_answer"}}
{"t":520,"kind":"PROMPT_CHANGED","payload":{"pane_id":"9eafe5c60288","length":5}}
```
