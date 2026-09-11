# Signal report — e2e_reference_compact

Outcome: **PASS**
Summary: reference-compact — six primitives, three-channel agreement (session_id=50ef52d9cd07)

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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"0e8b578ba035"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"fdb980d6217d","window_id":"0e8b578ba035","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"fdb980d6217d","prior_pane_id":null}}
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
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":27,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":388,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"3db82a130320","driver":"deterministic"}}
{"t":391,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"3db82a130320","driver":"deterministic","context_tokens":null}}
{"t":391,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"372bab4b6bbe","pane_id":"fdb980d6217d","session_id":"50ef52d9cd07","name":"session-50ef52","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-Y5SEOv","workspace_shape":"flat","bundle":"","seed":""}}
{"t":392,"kind":"SESSION_CREATED","payload":{"request_id":"372bab4b6bbe","session_id":"50ef52d9cd07","name":"session-50ef52","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-Y5SEOv","workspace_shape":"flat","status":"running"}}
{"t":392,"kind":"WORKSPACE_BOUND","payload":{"request_id":"372bab4b6bbe","session_id":"50ef52d9cd07","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-Y5SEOv","shape":"flat"}}
{"t":392,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"fdb980d6217d","session_id":"50ef52d9cd07","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-Y5SEOv","shape":"flat"}}
{"t":392,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"fdb980d6217d","session_id":"50ef52d9cd07"}}
{"t":395,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-status","byte":64}}
{"t":475,"kind":"PROMPT_SUBMITTED","payload":{"pane_id":"fdb980d6217d","text_length":5}}
{"t":475,"kind":"TURN_SUBMIT_REQUESTED","payload":{"request_id":"9d981a5d5f78","pane_id":"fdb980d6217d","session_id":"50ef52d9cd07","text_length":5,"timeout_seconds":60}}
{"t":477,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-status","byte":96}}
{"t":483,"kind":"TURN_SUBMITTED","payload":{"request_id":"9d981a5d5f78","session_id":"50ef52d9cd07","turn_index":0}}
{"t":485,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-fdb980d6217d-status","byte":64}}
{"t":486,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"fdb980d6217d","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":486,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"fdb980d6217d","envelope_seq":14,"envelope_kind":"PromptFragment","envelope_producer_kind":"user_message_fragment"}}
{"t":486,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"fdb980d6217d","envelope_seq":22,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":486,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"fdb980d6217d","envelope_seq":27,"park_reason":"final_answer"}}
{"t":572,"kind":"PROMPT_CHANGED","payload":{"pane_id":"fdb980d6217d","length":5}}
```
