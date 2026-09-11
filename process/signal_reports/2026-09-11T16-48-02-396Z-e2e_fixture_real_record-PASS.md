# Signal report — e2e_fixture_real_record

Outcome: **PASS**
Summary: e2e_fixture_real_record — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 124 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"32c7660b7302"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"5afea6212d24","window_id":"32c7660b7302","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"5afea6212d24","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-header_popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-header_popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-header_popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":30,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":349,"kind":"WORKSPACE_BOUND","payload":{"request_id":"63d058391b0f","session_id":"s_f2b1b3eab93a4553bc8b2997","workspace_path":"/Users/peterlaffey/.substrate/sessions/s_f2b1b3eab93a4553bc8b2997/workspace","shape":"flat"}}
{"t":349,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"5afea6212d24","session_id":"s_f2b1b3eab93a4553bc8b2997","workspace_path":"/Users/peterlaffey/.substrate/sessions/s_f2b1b3eab93a4553bc8b2997/workspace","shape":"flat"}}
{"t":355,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5afea6212d24-status","byte":64}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":7,"envelope_kind":"UserMessage","envelope_producer_kind":"session_open"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":11,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":355,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":16,"park_reason":"final_answer"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":18,"envelope_kind":"UserMessage","envelope_producer_kind":"?"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":21,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":25,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":29,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":33,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":37,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":41,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":45,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":49,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":53,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":57,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":61,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":65,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":69,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":73,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":77,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":81,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":85,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":89,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":93,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":97,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":101,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":355,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":106,"park_reason":"final_answer"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":108,"envelope_kind":"UserMessage","envelope_producer_kind":"?"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":111,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":115,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":119,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":123,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":355,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":127,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":356,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":132,"park_reason":"final_answer"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":134,"envelope_kind":"UserMessage","envelope_producer_kind":"?"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":137,"envelope_kind":"ModelReply","envelope_producer_kind":"model"}}
{"t":356,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":142,"park_reason":"final_answer"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":144,"envelope_kind":"UserMessage","envelope_producer_kind":"?"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":147,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":151,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":155,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":159,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":163,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":167,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":356,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":175,"park_reason":"final_answer"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":177,"envelope_kind":"UserMessage","envelope_producer_kind":"?"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":180,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":184,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":188,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":192,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":196,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":200,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":356,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":208,"park_reason":"final_answer"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":210,"envelope_kind":"UserMessage","envelope_producer_kind":"?"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":213,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":217,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":221,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":225,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":229,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":233,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":356,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":241,"park_reason":"final_answer"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":243,"envelope_kind":"UserMessage","envelope_producer_kind":"?"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":246,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":250,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":254,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":258,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":262,"envelope_kind":"ToolCall","envelope_producer_kind":"model"}}
{"t":356,"kind":"TRANSCRIPT_ROW_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":266,"envelope_kind":"ToolResult","envelope_producer_kind":"tool"}}
{"t":356,"kind":"TRANSCRIPT_PARK_RENDERED","payload":{"pane_id":"5afea6212d24","envelope_seq":274,"park_reason":"final_answer"}}
```
