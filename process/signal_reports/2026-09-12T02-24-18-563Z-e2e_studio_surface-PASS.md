# Signal report — e2e_studio_surface

Outcome: **PASS**
Summary: e2e_studio_surface — three-channel agreement

## Observed
- all checks passed

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Zero — every axis agrees.

## Trace — 72 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"86e35bf49396"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"b931913b0d2c","window_id":"86e35bf49396","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"b931913b0d2c","prior_pane_id":null}}
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
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":24,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":361,"kind":"SURFACE_OPENED","payload":{"pane_id":"b931913b0d2c","kind":"studio","prior_kind":null}}
{"t":364,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-surface","byte":2}}
{"t":808,"kind":"STUDIO_VIEW_TOGGLED","payload":{"from":"form","to":"canvas"}}
{"t":1035,"kind":"STUDIO_VIEW_TOGGLED","payload":{"from":"canvas","to":"form"}}
{"t":1268,"kind":"STUDIO_VALIDATE_REQUESTED","payload":{"topo_name":""}}
{"t":1269,"kind":"STUDIO_VALIDATE_FAILED","payload":{"topo_name":"","errors":["topo_name '' does not match ^[a-z0-9_]+$"]}}
{"t":2060,"kind":"STUDIO_VALIDATE_REQUESTED","payload":{"topo_name":"harness_studio_topo"}}
{"t":2063,"kind":"STUDIO_VALIDATED","payload":{"topo_name":"harness_studio_topo","producer_count":2,"view_count":1,"trigger_count":1,"route_count":3}}
{"t":2594,"kind":"STUDIO_BUILD_REQUESTED","payload":{"topo_name":"harness_studio_topo"}}
{"t":2596,"kind":"STUDIO_BUILT","payload":{"topo_name":"harness_studio_topo","record_root":"/Users/peterlaffey/.substrate/topologies/harness_studio_topo.py"}}
{"t":3307,"kind":"SURFACE_CLOSED","payload":{"pane_id":"b931913b0d2c","kind":"studio"}}
{"t":3310,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-surface","byte":0}}
{"t":3619,"kind":"SURFACE_OPENED","payload":{"pane_id":"b931913b0d2c","kind":"assay","prior_kind":null}}
{"t":3622,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-surface","byte":3}}
{"t":3928,"kind":"SURFACE_CLOSED","payload":{"pane_id":"b931913b0d2c","kind":"assay"}}
{"t":3928,"kind":"SURFACE_OPENED","payload":{"pane_id":"b931913b0d2c","kind":"studio","prior_kind":"assay"}}
{"t":3933,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-surface","byte":2}}
{"t":4345,"kind":"SURFACE_CLOSED","payload":{"pane_id":"b931913b0d2c","kind":"studio"}}
{"t":4353,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-b931913b0d2c-surface","byte":0}}
```
