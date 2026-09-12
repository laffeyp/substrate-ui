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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"d6942634d3c1"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"3b6f6c0ac24c","window_id":"d6942634d3c1","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"3b6f6c0ac24c","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":23,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":359,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"08c5aa205d9b","driver":"deterministic"}}
{"t":360,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"08c5aa205d9b","driver":"deterministic","context_tokens":null}}
{"t":360,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"7664c581531b","pane_id":"3b6f6c0ac24c","session_id":"b6e0b53ddff2","name":"session-b6e0b5","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-5QFSxh","workspace_shape":"flat","bundle":"","seed":""}}
{"t":361,"kind":"SESSION_CREATED","payload":{"request_id":"7664c581531b","session_id":"b6e0b53ddff2","name":"session-b6e0b5","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-5QFSxh","workspace_shape":"flat","status":"running"}}
{"t":361,"kind":"WORKSPACE_BOUND","payload":{"request_id":"7664c581531b","session_id":"b6e0b53ddff2","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-5QFSxh","shape":"flat"}}
{"t":361,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"3b6f6c0ac24c","session_id":"b6e0b53ddff2","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-5QFSxh","shape":"flat"}}
{"t":361,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"3b6f6c0ac24c","session_id":"b6e0b53ddff2"}}
{"t":365,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-status","byte":64}}
{"t":424,"kind":"PROMPT_SUBMITTED","payload":{"pane_id":"3b6f6c0ac24c","text_length":5}}
{"t":424,"kind":"TURN_SUBMIT_REQUESTED","payload":{"request_id":"44b118da54ee","pane_id":"3b6f6c0ac24c","session_id":"b6e0b53ddff2","text_length":5,"timeout_seconds":60}}
{"t":431,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-status","byte":96}}
{"t":433,"kind":"TURN_SUBMITTED","payload":{"request_id":"44b118da54ee","session_id":"b6e0b53ddff2","turn_index":0}}
{"t":436,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"3b6f6c0ac24c","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":436,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"3b6f6c0ac24c","envelope_seq":14,"envelope_kind":"PromptFragment","envelope_producer_kind":"user_message_fragment"}}
{"t":436,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"3b6f6c0ac24c","envelope_seq":22,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":436,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"3b6f6c0ac24c","envelope_seq":27,"park_reason":"final_answer"}}
{"t":440,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-3b6f6c0ac24c-status","byte":64}}
{"t":523,"kind":"PROMPT_CHANGED","payload":{"pane_id":"3b6f6c0ac24c","length":5}}
```
