# Sprint 175 — The setting-change rule stays inside the lens

```yaml
---
id: 175
status: closed
closed_at: 2026-10-13
phase: language
pass_kind: functional
depends_on: [169]
roadmap: process/planning/ROADMAP-2026-10-13-language-in-the-app.md
---
```

## scope

From the Architect on the installed lens: a bundle change's rule ("bundle standard → standard-low · per_turn …", which carries the whole per-turn text) ran past the last lane and made the lens scroll sideways. The rule's text ends in an ellipsis at the lens's edge and its hover carries the whole text. The text itself is unchanged.

## observation contract

Gate `language_rule_ellipsis`: after /guidance low, /tone blunt and /length full at one turn, the rule's text ends inside the lens body, is cut, and its hover holds the whole text.

## result

- **Built.** `web/reveal.html`: the rule's text span shrinks in its flex row (`min-width:0`), cuts with `text-overflow:ellipsis`, and has `title` set to the rule text.
- **Tests.** Gate `language_rule_ellipsis` (in `gates:electron`): the text ends inside the body's right edge (1,924 px) and shows less than its full width. Without the fix it ends at 4,984 px and the gate fails.
