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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"4c29daa1918d"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"678c86ca6ca2","window_id":"4c29daa1918d","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"678c86ca6ca2","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-header-popover","byte":0}}
{"t":20,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":22,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":362,"kind":"SURFACE_OPENED","payload":{"pane_id":"678c86ca6ca2","kind":"studio","prior_kind":null}}
{"t":364,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-surface","byte":2}}
{"t":818,"kind":"STUDIO_VIEW_TOGGLED","payload":{"from":"form","to":"canvas"}}
{"t":1045,"kind":"STUDIO_VIEW_TOGGLED","payload":{"from":"canvas","to":"form"}}
{"t":1270,"kind":"STUDIO_VALIDATE_REQUESTED","payload":{"topo_name":""}}
{"t":1271,"kind":"STUDIO_VALIDATE_FAILED","payload":{"topo_name":"","errors":["topo_name '' does not match ^[a-z0-9_]+$"]}}
{"t":2062,"kind":"STUDIO_VALIDATE_REQUESTED","payload":{"topo_name":"harness_studio_topo"}}
{"t":2063,"kind":"STUDIO_VALIDATED","payload":{"topo_name":"harness_studio_topo","producer_count":2,"view_count":1,"trigger_count":1,"route_count":3}}
{"t":2586,"kind":"STUDIO_BUILD_REQUESTED","payload":{"topo_name":"harness_studio_topo"}}
{"t":2588,"kind":"STUDIO_BUILT","payload":{"topo_name":"harness_studio_topo","record_root":"/Users/peterlaffey/.substrate/topologies/harness_studio_topo.py"}}
{"t":3301,"kind":"SURFACE_CLOSED","payload":{"pane_id":"678c86ca6ca2","kind":"studio"}}
{"t":3304,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-surface","byte":0}}
{"t":3614,"kind":"SURFACE_OPENED","payload":{"pane_id":"678c86ca6ca2","kind":"assay","prior_kind":null}}
{"t":3618,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-surface","byte":3}}
{"t":3924,"kind":"SURFACE_CLOSED","payload":{"pane_id":"678c86ca6ca2","kind":"assay"}}
{"t":3924,"kind":"SURFACE_OPENED","payload":{"pane_id":"678c86ca6ca2","kind":"studio","prior_kind":"assay"}}
{"t":3927,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-surface","byte":2}}
{"t":4337,"kind":"SURFACE_CLOSED","payload":{"pane_id":"678c86ca6ca2","kind":"studio"}}
{"t":4346,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-678c86ca6ca2-surface","byte":0}}
```
