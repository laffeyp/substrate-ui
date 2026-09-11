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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"61657b08fe59"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"13b5d698ea36","window_id":"61657b08fe59","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"13b5d698ea36","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":28,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":365,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"9be95c45d94e","driver":"deterministic"}}
{"t":369,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"9be95c45d94e","driver":"deterministic","context_tokens":null}}
{"t":369,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"974e789db03b","pane_id":"13b5d698ea36","session_id":"69e3c8fbc109","name":"session-69e3c8","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-jhBPl7","workspace_shape":"flat","bundle":"","seed":""}}
{"t":371,"kind":"SESSION_CREATED","payload":{"request_id":"974e789db03b","session_id":"69e3c8fbc109","name":"session-69e3c8","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-jhBPl7","workspace_shape":"flat","status":"running"}}
{"t":371,"kind":"WORKSPACE_BOUND","payload":{"request_id":"974e789db03b","session_id":"69e3c8fbc109","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-jhBPl7","shape":"flat"}}
{"t":371,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"13b5d698ea36","session_id":"69e3c8fbc109","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-transcript-ws-jhBPl7","shape":"flat"}}
{"t":371,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"13b5d698ea36","session_id":"69e3c8fbc109"}}
{"t":379,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-status","byte":64}}
{"t":431,"kind":"PROMPT_SUBMITTED","payload":{"pane_id":"13b5d698ea36","text_length":5}}
{"t":431,"kind":"TURN_SUBMIT_REQUESTED","payload":{"request_id":"558b303d3507","pane_id":"13b5d698ea36","session_id":"69e3c8fbc109","text_length":5,"timeout_seconds":60}}
{"t":435,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-status","byte":96}}
{"t":440,"kind":"TURN_SUBMITTED","payload":{"request_id":"558b303d3507","session_id":"69e3c8fbc109","turn_index":0}}
{"t":442,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"13b5d698ea36","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":442,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"13b5d698ea36","envelope_seq":14,"envelope_kind":"PromptFragment","envelope_producer_kind":"user_message_fragment"}}
{"t":442,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"13b5d698ea36","envelope_seq":22,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":442,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"13b5d698ea36","envelope_seq":27,"park_reason":"final_answer"}}
{"t":445,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-13b5d698ea36-status","byte":64}}
{"t":529,"kind":"PROMPT_CHANGED","payload":{"pane_id":"13b5d698ea36","length":5}}
```
