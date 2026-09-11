# Signal report — e2e_reference_compact

Outcome: **PASS**
Summary: reference-compact — six primitives, three-channel agreement (session_id=7e1c9749a31c)

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
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"3c4cd2443026"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"b480e1fec1ce","window_id":"3c4cd2443026","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"b480e1fec1ce","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":373,"kind":"PROBE_DRIVER_REQUESTED","payload":{"request_id":"6b76de5ee0fe","driver":"deterministic"}}
{"t":374,"kind":"PROBE_DRIVER_PROBED","payload":{"request_id":"6b76de5ee0fe","driver":"deterministic","context_tokens":null}}
{"t":374,"kind":"SESSION_CREATE_REQUESTED","payload":{"request_id":"5d16e0509995","pane_id":"b480e1fec1ce","session_id":"7e1c9749a31c","name":"session-7e1c97","driver":"deterministic","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-LSVJup","workspace_shape":"flat","bundle":"","seed":""}}
{"t":375,"kind":"SESSION_CREATED","payload":{"request_id":"5d16e0509995","session_id":"7e1c9749a31c","name":"session-7e1c97","driver":"deterministic","workspace":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-LSVJup","workspace_shape":"flat","status":"running"}}
{"t":375,"kind":"WORKSPACE_BOUND","payload":{"request_id":"5d16e0509995","session_id":"7e1c9749a31c","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-LSVJup","shape":"flat"}}
{"t":375,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"b480e1fec1ce","session_id":"7e1c9749a31c","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-reference-compact-ws-LSVJup","shape":"flat"}}
{"t":375,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"b480e1fec1ce","session_id":"7e1c9749a31c"}}
{"t":384,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-status","byte":64}}
{"t":457,"kind":"PROMPT_SUBMITTED","payload":{"pane_id":"b480e1fec1ce","text_length":5}}
{"t":457,"kind":"TURN_SUBMIT_REQUESTED","payload":{"request_id":"3e1459ba2fbc","pane_id":"b480e1fec1ce","session_id":"7e1c9749a31c","text_length":5,"timeout_seconds":60}}
{"t":458,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-status","byte":96}}
{"t":465,"kind":"TURN_SUBMITTED","payload":{"request_id":"3e1459ba2fbc","session_id":"7e1c9749a31c","turn_index":0}}
{"t":466,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b480e1fec1ce-status","byte":64}}
{"t":466,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"b480e1fec1ce","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":467,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"b480e1fec1ce","envelope_seq":14,"envelope_kind":"PromptFragment","envelope_producer_kind":"user_message_fragment"}}
{"t":467,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"b480e1fec1ce","envelope_seq":22,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":467,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"b480e1fec1ce","envelope_seq":27,"park_reason":"final_answer"}}
{"t":556,"kind":"PROMPT_CHANGED","payload":{"pane_id":"b480e1fec1ce","length":5}}
```
