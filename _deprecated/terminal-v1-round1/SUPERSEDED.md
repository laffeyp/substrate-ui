# SUPERSEDED — terminal-v1 round 1

Superseded 2026-08-14 by Architect direction. Visual + structural regressions vs the parent substrate-ui (see the running console at `/`) made this round unshippable: tab labels too large, stripped-down palette, run-as-graph rendered as a text summary instead of the parent's swimlane view, topology structure lost hierarchy, agent terminal lost the params strip, iframe violation in original Sprint 015 (ripped, but the trust cost stayed).

Kept on disk per hard rule 12 (audit trail is the work). Do not build from this.

Next round starts fresh in `substrate-ui/terminal-v1/` under stricter SDD discipline. Post-mortem for the iframe failure: `../../../design/terminal-v1/postmortem-iframe.md`.
