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
{"t":6,"kind":"WINDOW_OPENED","payload":{"window_id":"b6dc509c8ce3"}}
{"t":6,"kind":"PANE_CREATED","payload":{"pane_id":"a30293c76fb8","window_id":"b6dc509c8ce3","session_id":null,"from_split":null}}
{"t":6,"kind":"PANE_FOCUSED","payload":{"pane_id":"a30293c76fb8","prior_pane_id":null}}
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
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-header-popover","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-focus","byte":255}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-status","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-reveal","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-lens","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-level","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-dir","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-descent","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-surface","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-find","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-inspect","byte":0}}
{"t":19,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-header-popover","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-reveal","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-lens","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-level","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-dir","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-descent","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-surface","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-find","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-inspect","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-header-popover","byte":0}}
{"t":21,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":31,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":367,"kind":"SURFACE_OPENED","payload":{"pane_id":"a30293c76fb8","kind":"studio","prior_kind":null}}
{"t":370,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-surface","byte":2}}
{"t":806,"kind":"STUDIO_VIEW_TOGGLED","payload":{"from":"form","to":"canvas"}}
{"t":1023,"kind":"STUDIO_VIEW_TOGGLED","payload":{"from":"canvas","to":"form"}}
{"t":1249,"kind":"STUDIO_VALIDATE_REQUESTED","payload":{"topo_name":""}}
{"t":1251,"kind":"STUDIO_VALIDATE_FAILED","payload":{"topo_name":"","errors":["topo_name '' does not match ^[a-z0-9_]+$"]}}
{"t":2024,"kind":"STUDIO_VALIDATE_REQUESTED","payload":{"topo_name":"harness_studio_topo"}}
{"t":2025,"kind":"STUDIO_VALIDATED","payload":{"topo_name":"harness_studio_topo","producer_count":2,"view_count":1,"trigger_count":1,"route_count":3}}
{"t":2550,"kind":"STUDIO_BUILD_REQUESTED","payload":{"topo_name":"harness_studio_topo"}}
{"t":2551,"kind":"STUDIO_BUILT","payload":{"topo_name":"harness_studio_topo","record_root":"/Users/peterlaffey/.substrate/topologies/harness_studio_topo.py"}}
{"t":3261,"kind":"SURFACE_CLOSED","payload":{"pane_id":"a30293c76fb8","kind":"studio"}}
{"t":3263,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-surface","byte":0}}
{"t":3569,"kind":"SURFACE_OPENED","payload":{"pane_id":"a30293c76fb8","kind":"assay","prior_kind":null}}
{"t":3571,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-surface","byte":3}}
{"t":3876,"kind":"SURFACE_CLOSED","payload":{"pane_id":"a30293c76fb8","kind":"assay"}}
{"t":3876,"kind":"SURFACE_OPENED","payload":{"pane_id":"a30293c76fb8","kind":"studio","prior_kind":"assay"}}
{"t":3880,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-surface","byte":2}}
{"t":4289,"kind":"SURFACE_CLOSED","payload":{"pane_id":"a30293c76fb8","kind":"studio"}}
{"t":4295,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-a30293c76fb8-surface","byte":0}}
```
