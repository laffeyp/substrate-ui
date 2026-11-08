# Sprint 367 — the window writes each key it routes (KEY_ROUTED)

```yaml
---
id: 367
status: closed
phase: SDD re-centre
pass_kind: functional
---
```

## scope

Plan r3 item 4, key routing. `App.onKey` writes `KEY_ROUTED` right after `windowKey` (`web/app/keymap.ts`) decides the action, for the keys that map reads: the arrows, Enter, Escape, and any ⌘ or Ctrl chord. The payload:
- `key`: the key with its modifiers, for example `Meta+m` or `Enter`;
- `action`: the action's kind, or `none`;
- `target`:
  - `records`, `picker` or `language` for those actions;
  - `window` for every other action;
  - for a key with no action, `box` when the key's target is a text box and `none` otherwise.

A typed character is never written, and neither is a lone modifier, Backspace or Tab. `keymap.ts` exports `ARROWS`, its list keys.

## context_files

- `../sdd-kit-3/AGENTS.md`; `web/vm/signals/versions/0.17.json` (`KEY_ROUTED`: "never a printable character")
- `web/app/App.tsx` (`onKey`), `web/app/keymap.ts`
- `harness/shakeout/records_keys.ts`, `harness/shakeout/language_bar_line.ts`

## signal contract

### Emits

- `KEY_ROUTED` (`key`, `action`, `target`: `KeyRoutedTarget`)

### Invariants

- No `KEY_ROUTED` names a typed character (Layer 7: tags carry kinds and reasons, never what was typed).
- No behaviour changes: the record is written before the action runs, and the action is unchanged.

## artifact contract

### Files created

- `harness/shakeout/key_signals.ts`

### Files modified

- `web/app/App.tsx`, `web/app/keymap.ts` (the export)
- `web/vm/signals/unemitted.json`, `package.json` (`gates:electron` runs `key_signals`)

### Command exit codes

`npx tsc --noEmit` 0; `npx tsc -p harness --noEmit` 0; `npm run build` 0; `npm run signals` 0; `npm run test:unit` 0.

## observation contract

`harness/shakeout/key_signals.ts`, from source and packaged. It presses one key per target:
- ↓ on the unbound pane's picker;
- "hello", typed key by key, then Enter;
- Escape with nothing open;
- `/language`, then ↑ once the lens draws its turn rows;
- ⌘M;
- ↓ on the records page.

`window-1.jsonl` must then hold these records in that order, with other routed keys allowed between them:
1. ArrowDown picker picker
2. Enter none box
3. Escape none none
4. Enter none box
5. ArrowUp language language
6. Meta+m toggle-meta window
7. ArrowDown records records

No record may name a single character.

Plants:
- the language target mapped to `window` fails the gate;
- writing every key fails it, naming the record `h e l l o`.

## done criteria

Each key the window routes is in the trace with its action and where it went, and nothing typed is.

## result

- **Two corrections, made while running the gate:**
  - *The box target.* `/language`'s Enter first wrote `none`, because by routing time that Enter has unmounted its box. The target is now read from the key's target, as `keymap.ts`' `targetTyping` already reads it.
  - *The gate's typing.* The first run filled "hello" with Playwright's `fill`, which sends no key events, so the no-typed-character check passed even with every key written. The gate now types it key by key, and that plant fails.
- **Gate run:** the gate's ↑ first wrote `ArrowUp none none`, because the language lens had not drawn its turns yet. The gate now waits for `[data-lang-row]`.
- **Commands:** `tsc` 0 for the window and for the harness; lint 0; `npm run build` 0.
- **Gate:** `key_signals` 0 from source, with 8 KEY_ROUTED records. The 7 expected ones are in order.
- **Rubber Duck Pass**, on that trace:
  - ↓ went to the picker;
  - two Enters went to boxes, the bind's path box and the input bar;
  - "hello" wrote nothing;
  - Escape with nothing open went nowhere;
  - `/language`'s Enter went to its box;
  - ↑ walked the language lens;
  - ⌘M toggled meta;
  - ↓ walked the records list.

  Observations: none.
