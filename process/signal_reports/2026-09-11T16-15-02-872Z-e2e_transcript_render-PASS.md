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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"e3e5ed3aa9ea"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"0ce14aaead3d","window_id":"e3e5ed3aa9ea","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"0ce14aaead3d","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":27,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":368,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"a2efde2d9036","driver":"deterministic"}}
{"t":370,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"a2efde2d9036","driver":"deterministic","context_tokens":null}}
{"t":370,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"312ba72da57d","pane_id":"0ce14aaead3d","session_id":"d962a9f05128","name":"session-d962a9","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-oZ0Cx4","workspace_shape":"flat","bundle":"","seed":""}}
{"t":372,"kind":"SESSION_CREATED","payload":{"request_id":"312ba72da57d","session_id":"d962a9f05128","name":"session-d962a9","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-oZ0Cx4","workspace_shape":"flat","status":"running"}}
{"t":372,"kind":"WORKSPACE_BOUND","payload":{"request_id":"312ba72da57d","session_id":"d962a9f05128","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-oZ0Cx4","shape":"flat"}}
{"t":372,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"0ce14aaead3d","session_id":"d962a9f05128","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-oZ0Cx4","shape":"flat"}}
{"t":372,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"0ce14aaead3d","session_id":"d962a9f05128"}}
{"t":378,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-status","byte":64}}
{"t":433,"kind":"PROMPT_SUBMITTED","payload":{"pane_id":"0ce14aaead3d","text_length":5}}
{"t":433,"kind":"TURN_SUBMIT_REQUESTED","payload":{"request_id":"7aa5193755ac","pane_id":"0ce14aaead3d","session_id":"d962a9f05128","text_length":5,"timeout_seconds":60}}
{"t":435,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-status","byte":96}}
{"t":441,"kind":"TURN_SUBMITTED","payload":{"request_id":"7aa5193755ac","session_id":"d962a9f05128","turn_index":0}}
{"t":442,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"0ce14aaead3d","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":442,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"0ce14aaead3d","envelope_seq":14,"envelope_kind":"PromptFragment","envelope_producer_kind":"user_message_fragment"}}
{"t":442,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"0ce14aaead3d","envelope_seq":22,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":442,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"0ce14aaead3d","envelope_seq":27,"park_reason":"final_answer"}}
{"t":444,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0ce14aaead3d-status","byte":64}}
{"t":529,"kind":"PROMPT_CHANGED","payload":{"pane_id":"0ce14aaead3d","length":5}}
```
