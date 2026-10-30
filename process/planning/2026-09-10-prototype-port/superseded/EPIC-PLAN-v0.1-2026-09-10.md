# Epic plan — substrate-ui v0.1

*Ratified 2026-09-10 by Architect directive "make all the sprint cards for each epic in advance ok, then just execute." Cards live at `process/sprints_v0.1/sprint-NNN-<slug>.md`. This plan is the map; the cards are the contract; the vocabulary at `signals/0.1.json` is the source. Every sprint holds the three-channel observation contract non-negotiable per Architect 2026-09-08.*

The shell decomposes into fifteen epics along the fourteen strata of `signals/0.1.json § layer_3_sessions` plus one harness-maturity epic that hardens the observation apparatus at the end. Epics land in build order — each epic's terminal sprint unblocks the next epic's first sprint.

| Epic | Name | Strata | Sprints | Tag surface |
|---|---|---|---|---|
| A | Boot & observability | app_session | 001 | BRIDGE_HELLO_RECEIVED, ANCHOR_PAINTED |
| B | Pane grid | window_session + pane_session | 002-005 | WINDOW_OPENED, PANE_CREATED, PANE_SPLIT, PANE_FOCUSED, PANE_MOVED, PANE_CLOSED, GUTTER_DRAG_STARTED/STOPPED, DROP_HINT_SHOWN/HIDDEN/ZONE_CHANGED, WINDOW_CLOSED (Sprint 002 also mounts the full PaneHeader shell per D42) |
| C | Substrate binding | pane_session → substrate_binding | 006-010 | WORKSPACE_PICKER_WALKED, SESSION_CREATE_REQUESTED/CREATED/FAILED, WORKSPACE_BOUND, PANE_UNBOUND_BOUND, PROBE_DRIVER_*, session resume (no tag in v0.1 — reused create chain), SESSION_END_REQUESTED, SESSION_ENDED_ACK |
| D | Turn flow | turn + transcript | 011-015 | PROMPT_CHANGED, PROMPT_SUBMITTED, TURN_SUBMIT_REQUESTED/SUBMITTED/FAILED, TRANSCRIPT_ROW_RENDERED, TRANSCRIPT_PARK_RENDERED, TRANSCRIPT_AWAITING_FIRST_MESSAGE_RENDERED, TRANSCRIPT_COMPACTED_RENDERED, TRANSCRIPT_RATE_LIMITED_RENDERED |
| E | Reveal & lenses | reveal + lens | 016-019 | REVEAL_TOGGLED, LENS_SWITCHED, STREAM_LEVEL_TOGGLED, STREAM_DIR_TOGGLED, REVEAL_FOCUS_MOVED |
| F | Delegate flow | delegate_flow + descent | 020-023 | DELEGATE_CALL_RENDERED, DELEGATE_INLINE_EXPANDED/COLLAPSED, DESCENT_ENTERED/EXITED, DELEGATE_CALL_FOLDED, DELEGATE_DEPTH_CAP_REFUSED, FAN_OUT_INLINE_EXPANDED/WALKED/COLLAPSED, TRANSCRIPT_FANOUT_LINE_RENDERED |
| G | Surfaces | surface | 024-027 | INSPECTOR_OPENED/CLOSED, STREAM_ROW_CLICKED, SURFACE_OPENED/CLOSED (records, assay, studio), STUDIO_VIEW_TOGGLED, STUDIO_VALIDATE_REQUESTED/VALIDATED/VALIDATE_FAILED, STUDIO_BUILD_REQUESTED/BUILT/BUILD_REJECTED |
| H | Find | find | 028-029 | FIND_OPENED/CLOSED, FIND_SCOPE_CHANGED, FIND_QUERY_CHANGED (Sprint 029's step walk is silent — no MATCH_STEPPED tag in v0.1) |
| I | Header & driver | header_popover + slash | 030-033 | SLASH_ROUTER_OPENED/WALKED/CLOSED + SLASH_COMMAND_ROUTED (Sprint 030 repurposed after D42 fix), DRIVER_DROPDOWN_OPENED/CLOSED, DRIVER_PICKED, DRIVER_CHANGE_REQUESTED, DRIVER_CHANGED, DRIVER_CHANGE_FAILED, WORKSPACE_POPOVER_OPENED/CLOSED, per-kind popover mutex |
| J | Bundles & tools | (bridge_request) | 034-035 | BUNDLE_ATTACH_REQUESTED, BUNDLE_ATTACHED, BUNDLE_ATTACH_FAILED, TOOLS_RESTRICTED |
| K | Session end lifecycle | dialog + (bridge_request) | 036-037 | END_CONFIRM_OPENED/CLOSED/COMMITTED, INTERRUPT_REQUESTED, INTERRUPTED, SESSION_END_REQUESTED, SESSION_ENDED_ACK |
| L | First-run | first_run | 038-039 | FIRST_RUN_OPENED, FIRST_RUN_DRIVER_PICKED, FIRST_RUN_COMPLETED |
| M | Dialogs & settings | dialog | 040-042 | SETTINGS_OPENED/CLOSED, SETTING_CHANGED, EXPORT_DIALOG_OPENED/CLOSED, EXPORT_COMMITTED, SESSION_RENAME_REQUESTED, SESSION_RENAMED, SESSION_RENAME_FAILED, PANE_RENAMED |
| N | Collections | (summary stratum) | 043-044 | COLLECTION_PERSISTED, COLLECTION_OPENED, COLLECTION_RESTORED |
| O | Menu bar & shortcuts | (app_session) | 045-046 | No new tags — menu clicks and keychords route to the reducer action whose own ratified tag observes the effect (Layer 1 v0.1 did not ratify MENU_ITEM_ACTIVATED / KEYBINDING_FIRED) |
| P | Harness maturity | (all) | 047-048 | 16 anchors wired end-to-end (Sprint 047); tonal rules become a standing shared-harness assertion across every sprint (Sprint 048 audits) |

Total: 48 sprints (001 shipped 2026-09-10; 002-048 drafted per this plan; the review at `process/reviews/REVIEW-2026-09-10-epic-plan-and-sprint-cards.md` landed same day and closed six drift findings against v0.1 — vocabulary drift across ~12 cards, Sprint 007 payload, Sprint 010 scope, Sprint 044 payload, D1 header ordering, and Sprint 048 shape — resolved by rewriting cards against v0.1 without growing the lock).

Each card carries: scope, prerequisites, signal contract (Emits/Consumes referencing only v0.1 tags), artifact contract (files, content assertions, command exit codes), observation contract (driving steps + three-channel agreement), done criteria. Cards inherit sprint 001's shape verbatim; the harness (`tests/harness/`) grows by one file per new tag pair.

Anchor testid naming: per-pane anchors carry `data-testid="anchor-pane-<pane_id>-<slot>"` where `slot ∈ {focus, status, reveal, lens, level, dir, descent, surface, find, inspect, header_popover}`; app-scoped anchors carry `data-testid="anchor-<slot>"` where `slot ∈ {dialog, window-strip, bridge, last-tag, heartbeat}`. Byte encoding per anchor is fixed in `signals/0.1.json § layer_7_evidence.evidence_constraints[pixel_anchor].anchors`; each sprint's card cites the anchor's row.

Sprint sequence: strictly linear on prerequisite chains. Every card's `prerequisites:` line names the exact prior sprint(s). No parallel sprints in v0.1 — the observability spine's guarantee is that any regression is grep-attributable to the last sprint's diff.
