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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"c335444b5b14"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"54f0938a6061","window_id":"c335444b5b14","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"54f0938a6061","prior_pane_id":null}}
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
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-lens","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-level","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-dir","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-descent","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-surface","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-find","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-inspect","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":23,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":374,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"17458a84a4af","driver":"deterministic"}}
{"t":375,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"17458a84a4af","driver":"deterministic","context_tokens":null}}
{"t":375,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"3fa0a28bf3a1","pane_id":"54f0938a6061","session_id":"acb9baa152f0","name":"session-acb9ba","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-wBubZT","workspace_shape":"flat","bundle":"","seed":""}}
{"t":376,"kind":"SESSION_CREATED","payload":{"request_id":"3fa0a28bf3a1","session_id":"acb9baa152f0","name":"session-acb9ba","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-wBubZT","workspace_shape":"flat","status":"running"}}
{"t":376,"kind":"WORKSPACE_BOUND","payload":{"request_id":"3fa0a28bf3a1","session_id":"acb9baa152f0","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-wBubZT","shape":"flat"}}
{"t":376,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"54f0938a6061","session_id":"acb9baa152f0","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-wBubZT","shape":"flat"}}
{"t":376,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"54f0938a6061","session_id":"acb9baa152f0"}}
{"t":384,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-status","byte":64}}
{"t":440,"kind":"PROMPT_SUBMITTED","payload":{"pane_id":"54f0938a6061","text_length":5}}
{"t":440,"kind":"TURN_SUBMIT_REQUESTED","payload":{"request_id":"21e62f3cb8bb","pane_id":"54f0938a6061","session_id":"acb9baa152f0","text_length":5,"timeout_seconds":60}}
{"t":441,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-status","byte":96}}
{"t":449,"kind":"TURN_SUBMITTED","payload":{"request_id":"21e62f3cb8bb","session_id":"acb9baa152f0","turn_index":0}}
{"t":449,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-54f0938a6061-status","byte":64}}
{"t":451,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"54f0938a6061","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":451,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"54f0938a6061","envelope_seq":14,"envelope_kind":"PromptFragment","envelope_producer_kind":"user_message_fragment"}}
{"t":451,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"54f0938a6061","envelope_seq":22,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":451,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"54f0938a6061","envelope_seq":27,"park_reason":"final_answer"}}
{"t":536,"kind":"PROMPT_CHANGED","payload":{"pane_id":"54f0938a6061","length":5}}
```
