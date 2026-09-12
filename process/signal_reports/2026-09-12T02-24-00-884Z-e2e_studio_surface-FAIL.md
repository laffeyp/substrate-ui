# Signal report — e2e_studio_surface

Outcome: **FAIL**
Summary: e2e_studio_surface — 1 failing checks

## Observed
- FAIL: SURFACE_OPENED === SURFACE_CLOSED after teardown (3 vs 2)

## Expected
- Every emit's kind ∈ signals/0.1.json § layer_1_lexical.tags[].name.
- Every emit's payload carries every required field per signals/0.1.json § layer_2_payload.payload_schemas[kind].required.
- Every pairing_ordering / forbidden_after rule in Layer 5 holds.
- Every pixel-anchor's decoded byte matches its Layer 7 encoding for the current state.

## Delta
- Fails listed above.

## Hypothesis
- Read the trace above; localize by the first FAIL entry.

## Trace — 70 emits

```jsonl
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":5,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":5,"kind":"WINDOW_OPENED","payload":{"window_id":"6d4e69d2f9eb"}}
{"t":5,"kind":"PANE_CREATED","payload":{"pane_id":"5e78b2495bc9","window_id":"6d4e69d2f9eb","session_id":null,"from_split":null}}
{"t":5,"kind":"PANE_FOCUSED","payload":{"pane_id":"5e78b2495bc9","prior_pane_id":null}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":6,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-focus","byte":255}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-status","byte":0}}
{"t":20,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-reveal","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-lens","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-level","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-dir","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-descent","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-surface","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-find","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-inspect","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-header-popover","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-focus","byte":255}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-status","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-reveal","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-lens","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-level","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-dir","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-descent","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-surface","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-find","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-inspect","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-header-popover","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-dialog","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-window-strip","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-last-tag","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-heartbeat","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-focus","byte":255}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-status","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-reveal","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-lens","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-level","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-dir","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-descent","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-surface","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-find","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-inspect","byte":0}}
{"t":21,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-header-popover","byte":0}}
{"t":22,"kind":"BRIDGE_HELLO_RECEIVED","payload":{"substrate_version":"1.0.1","protocol":1}}
{"t":26,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-bridge","byte":128}}
{"t":362,"kind":"SURFACE_OPENED","payload":{"pane_id":"5e78b2495bc9","kind":"studio","prior_kind":null}}
{"t":367,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-surface","byte":2}}
{"t":822,"kind":"STUDIO_VIEW_TOGGLED","payload":{"from":"form","to":"canvas"}}
{"t":1049,"kind":"STUDIO_VIEW_TOGGLED","payload":{"from":"canvas","to":"form"}}
{"t":1281,"kind":"STUDIO_VALIDATE_REQUESTED","payload":{"topo_name":""}}
{"t":1283,"kind":"STUDIO_VALIDATE_FAILED","payload":{"topo_name":"","errors":["topo_name '' does not match ^[a-z0-9_]+$"]}}
{"t":2166,"kind":"STUDIO_VALIDATE_REQUESTED","payload":{"topo_name":"harness_studio_topo"}}
{"t":2167,"kind":"STUDIO_VALIDATED","payload":{"topo_name":"harness_studio_topo","producer_count":2,"view_count":1,"trigger_count":1,"route_count":3}}
{"t":2683,"kind":"STUDIO_BUILD_REQUESTED","payload":{"topo_name":"harness_studio_topo"}}
{"t":2684,"kind":"STUDIO_BUILT","payload":{"topo_name":"harness_studio_topo","record_root":"/Users/peterlaffey/.substrate/topologies/harness_studio_topo.py"}}
{"t":3395,"kind":"SURFACE_CLOSED","payload":{"pane_id":"5e78b2495bc9","kind":"studio"}}
{"t":3397,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-surface","byte":0}}
{"t":3705,"kind":"SURFACE_OPENED","payload":{"pane_id":"5e78b2495bc9","kind":"assay","prior_kind":null}}
{"t":3707,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-surface","byte":3}}
{"t":4013,"kind":"SURFACE_CLOSED","payload":{"pane_id":"5e78b2495bc9","kind":"assay"}}
{"t":4013,"kind":"SURFACE_OPENED","payload":{"pane_id":"5e78b2495bc9","kind":"studio","prior_kind":"assay"}}
{"t":4019,"kind":"ANCHOR_PAINTED","payload":{"anchor_id":"anchor-pane-5e78b2495bc9-surface","byte":2}}
```
