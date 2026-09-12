# Signal report — e2e_records_surface

Outcome: **PASS**
Summary: e2e_records_surface — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 65 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"d4875c3b2b50"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"bc40dcec172c","window_id":"d4875c3b2b50","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"bc40dcec172c","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":31,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":362,"kind":"SURFACE_OPENED","payload":{"pane_id":"bc40dcec172c","kind":"records","prior_kind":null}}
{"t":363,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-surface","byte":1}}
{"t":809,"kind":"SURFACE_CLOSED","payload":{"pane_id":"bc40dcec172c","kind":"records"}}
{"t":811,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-surface","byte":0}}
{"t":1120,"kind":"SURFACE_OPENED","payload":{"pane_id":"bc40dcec172c","kind":"records","prior_kind":null}}
{"t":1123,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-surface","byte":1}}
{"t":1675,"kind":"SURFACE_CLOSED","payload":{"pane_id":"bc40dcec172c","kind":"records"}}
{"t":1679,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-surface","byte":0}}
{"t":1680,"kind":"WORKSPACE_BOUND","payload":{"request_id":"8dbe817a22f5","session_id":"fe898588187d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-records-ws-b0aLyz","shape":"flat"}}
{"t":1680,"kind":"PANE_UNBOUND_BOUND","payload":{"pane_id":"bc40dcec172c","session_id":"fe898588187d","workspace_path":"/var/folders/zy/6l9pgpls6fz1wmkf6m_5ct8m0000gn/T/substrate-harness-records-ws-b0aLyz","shape":"flat"}}
{"t":1680,"kind":"TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED","payload":{"pane_id":"bc40dcec172c","session_id":"fe898588187d"}}
{"t":1689,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-bc40dcec172c-status","byte":64}}
```
