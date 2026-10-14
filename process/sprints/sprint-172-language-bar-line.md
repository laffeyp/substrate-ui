# Sprint 172 — The bar line names its settings and carries shifts

```yaml
---
id: 172
status: closed
closed_at: 2026-10-13
phase: language
pass_kind: functional
depends_on: [168]
roadmap: process/planning/ROADMAP-2026-10-13-language-in-the-app.md
design: process/planning/design-sheets/2026-10-13-language/ (22b; D76, D79)
---
```

## scope

The bar line's settings tail reads `guidance <level> · length <position> · tone <position>`. A `LanguageDrift` since the last setting change shows as its measure's short name and ↑/↓ right after the setting its group belongs to, in the group's colour, dotted underline; hover and focus open that shift (measure, direction, the turn it was flagged, the setting in force). More than two in a group collapse to a count after that setting. In a narrow pane the tail wraps under the turn recap. `/language` opens the lens at the latest shift's turn; `/language clear` hides the shifts until the next one; `/language off` and `on` hide and show them for the session. The commands join the one slash table.

## observation contract

Gate `language_bar_line`: after a drift the line shows the shift after its setting; the hover text matches the record; each command does what it says; `controls_mid_session` reads the named form.

## result

- **Built.** `web/reveal/settings_tail.ts` writes the tail `· guidance <level> · length <position> · tone <position>`. Model-stream shifts since the last setting change or `/language clear` sit after their group's setting as short name and ↑/↓, in the group's colour with a dotted underline; more than two in a group collapse to "N shifts". The hover text is `shiftNote()` from `language_lens.ts`, the same text as the lens's ▲/▼ marks. The tail is one unbreakable span, so in a narrow pane it drops under the turn recap whole. `/language [open|clear|off|on]` is in the slash table. `open` refreshes the view and bumps a per-pane tick; `reveal.ts` then opens meta on the language lens and selects the latest shift's reply, so the lens shows that turn.
- **Fixed on the way.** The lens's key handler judged "typing" by `document.activeElement`. The Enter that runs `/language` unmounts the input bar before the handler runs, so the handler read that Enter as "open the stream" and switched the lens straight back. It now judges by the key's target. The UI boundary test (`test_ui_imports_only_sanctioned_substrate_surfaces`) had been failing since sprint 168: `scripts/gen_kinds.py` imported `substrate.language.catalog` and `.drift` directly. The kernel now exports both modules from `substrate.app` as `language_catalog` and `language_drift`, and the generator imports them from there; the generated files came out byte-identical.
- **Tests.** Unit `settings_tail.spec.ts` (4). Server `tests/test_language_shift_route_172.py`: a scripted driver's replies jump in length, and a words shift reaches `/api/session/<id>/language` at turn 22. Gate `language_bar_line` (in `gates:electron`): the deterministic driver's replies never vary, so the gate injects one words shift on turn 0's reply and says so. The line reads "length normal words ↑" with the shift's note as hover; off, on and clear each do what they say; `/language` opens the lens on t0. Removing the selection line makes it fail on t1. `controls_mid_session` now expects the named form.
- **Found at the full gate run.** `language_bar_line` failed 7 runs in 12. The refresh queued after turn one fetched while turn two was finishing on the server; turn two's `Returned` then queued a second fetch, which replaced the view the gate had patched with its shift. Two changes: the gate adds its shift to every response of the language route (`win.route`), so each of the app's own refreshes carries it (6 of 6 after); and `loadLanguage` applies only its latest fetch, since an earlier fetch that resolved last would have put an older view on screen (`language_fetch_order.spec.ts`, red without the check). `slash_inline_hint` expected `/l` to match two commands; with `/language` it matches three, and the gate now says so.
