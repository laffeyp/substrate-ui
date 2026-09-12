# Signal report — e2e_reference_compact

Outcome: **PASS**
Summary: reference-compact — six primitives, three-channel agreement (session_id=9d4fc637666b)

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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"1431eab72b26"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"0fe4af5b43b8","window_id":"1431eab72b26","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"0fe4af5b43b8","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":30,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":373,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"42d330cc48cd","driver":"deterministic"}}
{"t":374,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"42d330cc48cd","driver":"deterministic","context_tokens":null}}
{"t":374,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"880d3fbdfedf","pane_id":"0fe4af5b43b8","session_id":"9d4fc637666b","name":"session-9d4fc6","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-BvUfMR","workspace_shape":"flat","bundle":"","seed":""}}
{"t":375,"kind":"SESSION_CREATED","payload":{"request_id":"880d3fbdfedf","session_id":"9d4fc637666b","name":"session-9d4fc6","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-BvUfMR","workspace_shape":"flat","status":"running"}}
{"t":375,"kind":"WORKSPACE_BOUND","payload":{"request_id":"880d3fbdfedf","session_id":"9d4fc637666b","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-BvUfMR","shape":"flat"}}
{"t":375,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"0fe4af5b43b8","session_id":"9d4fc637666b","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-BvUfMR","shape":"flat"}}
{"t":375,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"0fe4af5b43b8","session_id":"9d4fc637666b"}}
{"t":379,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-status","byte":64}}
{"t":456,"kind":"PROMPT_SUBMITTED","payload":{"pane_id":"0fe4af5b43b8","text_length":5}}
{"t":456,"kind":"TURN_SUBMIT_REQUESTED","payload":{"request_id":"1cb301f7e50f","pane_id":"0fe4af5b43b8","session_id":"9d4fc637666b","text_length":5,"timeout_seconds":60}}
{"t":461,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-status","byte":96}}
{"t":464,"kind":"TURN_SUBMITTED","payload":{"request_id":"1cb301f7e50f","session_id":"9d4fc637666b","turn_index":0}}
{"t":467,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"0fe4af5b43b8","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":467,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"0fe4af5b43b8","envelope_seq":14,"envelope_kind":"PromptFragment","envelope_producer_kind":"user_message_fragment"}}
{"t":467,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"0fe4af5b43b8","envelope_seq":22,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":467,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"0fe4af5b43b8","envelope_seq":27,"park_reason":"final_answer"}}
{"t":470,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-0fe4af5b43b8-status","byte":64}}
{"t":553,"kind":"PROMPT_CHANGED","payload":{"pane_id":"0fe4af5b43b8","length":5}}
```
