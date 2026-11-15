# Sprint 511 — Claude Code's own tool cards formatted, checked live

```yaml
---
id: 511
status: pending
phase: editor features (roadmap 2026-11-14 r5, E11)
pass_kind: observation
---
```

## scope

Cards 505, 509 and 510 read Claude Code's call shapes (`key=value` args, plain-text output) in unit specs only. Every card in a session on the `claude` driver is Claude Code's: `Bash`, `Read`, `Edit`, `MultiEdit`, `Write`, `Grep`, `Glob`. Each is checked through a live `claude` turn and formatted as its kernel twin is: `Read` output as its file's code with `     N→` numbers in the gutter, `Edit` old and new strings as that file's code, `Bash` as card 510 draws it, `Grep` hits as card 510's grep hits. A shape that differs from the unit specs is fixed here. One verifiable property: a live `claude` turn asked to read the Python fixture and run `grep -n` over the fixtures draws both cards formatted.

## signal contract

No new tag.

## observation contract

Gate `tool_output_claude` on the bundle: driver `claude` (a capable model), the large fixtures, one turn asking for a read, an edit, a `bash` command and a grep; each card opened; formats read from the DOM and ink from pixels. The record holds the calls; the gate reads their shapes from it.
