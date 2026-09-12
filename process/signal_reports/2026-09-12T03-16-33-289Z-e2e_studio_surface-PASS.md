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
{"t":4,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"94f4ef7eced2"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"7418b65a6712","window_id":"94f4ef7eced2","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"7418b65a6712","prior_pane_id":null}}
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
{"t":17,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-header-popover","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-focus","byte":255}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-status","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-reveal","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-lens","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-level","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-dir","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-descent","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-surface","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-find","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-inspect","byte":0}}
{"t":18,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-header-popover","byte":0}}
{"t":19,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":30,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":373,"kind":"SURFACE_OPENED","payload":{"pane_id":"7418b65a6712","kind":"studio","prior_kind":null}}
{"t":376,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-surface","byte":2}}
{"t":824,"kind":"STUDIO_VIEW_TOGGLED","payload":{"from":"form","to":"canvas"}}
{"t":1050,"kind":"STUDIO_VIEW_TOGGLED","payload":{"from":"canvas","to":"form"}}
{"t":1277,"kind":"STUDIO_VALIDATE_REQUESTED","payload":{"topo_name":""}}
{"t":1279,"kind":"STUDIO_VALIDATE_FAILED","payload":{"topo_name":"","errors":["topo_name '' does not match ^[a-z0-9_]+$"]}}
{"t":2043,"kind":"STUDIO_VALIDATE_REQUESTED","payload":{"topo_name":"harness_studio_topo"}}
{"t":2045,"kind":"STUDIO_VALIDATED","payload":{"topo_name":"harness_studio_topo","producer_count":2,"view_count":1,"trigger_count":1,"route_count":3}}
{"t":2566,"kind":"STUDIO_BUILD_REQUESTED","payload":{"topo_name":"harness_studio_topo"}}
{"t":2567,"kind":"STUDIO_BUILT","payload":{"topo_name":"harness_studio_topo","record_root":"/Users/peterlaffey/.substrate/topologies/harness_studio_topo.py"}}
{"t":3279,"kind":"SURFACE_CLOSED","payload":{"pane_id":"7418b65a6712","kind":"studio"}}
{"t":3281,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-surface","byte":0}}
{"t":3591,"kind":"SURFACE_OPENED","payload":{"pane_id":"7418b65a6712","kind":"assay","prior_kind":null}}
{"t":3595,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-surface","byte":3}}
{"t":3902,"kind":"SURFACE_CLOSED","payload":{"pane_id":"7418b65a6712","kind":"assay"}}
{"t":3902,"kind":"SURFACE_OPENED","payload":{"pane_id":"7418b65a6712","kind":"studio","prior_kind":"assay"}}
{"t":3907,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-surface","byte":2}}
{"t":4319,"kind":"SURFACE_CLOSED","payload":{"pane_id":"7418b65a6712","kind":"studio"}}
{"t":4328,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-7418b65a6712-surface","byte":0}}
```
