# Sprint 511 — Claude Code's own tool cards formatted, checked live

```yaml
---
id: 511
status: closed
phase: editor features (roadmap 2026-11-14 r5, E11)
pass_kind: observation
---
```

## scope

Cards 505, 509 and 510 read Claude Code's call shapes (`key=value` args, plain-text output) in unit specs only. Every card in a session on the `claude` driver is Claude Code's: `Bash`, `Read`, `Edit`, `MultiEdit`, `Write` (Claude Code 2.1.325 has no `Grep` or `Glob`; its searches run through `Bash`). Each is checked through a live `claude` turn and formatted as its kernel twin is: `Read` output as its file's code with `     N→` numbers in the gutter, `Edit` old and new strings as that file's code, `Bash` as card 510 draws it, `Grep` hits as card 510's grep hits. A shape that differs from the unit specs is fixed here. One verifiable property: a live `claude` turn asked to read the Python fixture and run `grep -n` over the fixtures draws both cards formatted.

## signal contract

No new tag.

## observation contract

Gate `tool_output_claude` on the bundle: driver `claude` (a capable model), the large fixtures, one turn asking for a read, an edit, a `bash` command and a grep; each card opened; formats read from the DOM and ink from pixels. The record holds the calls; the gate reads their shapes from it.

## close

**Found in the live record.** Claude Code 2.1.325's init event lists `Bash`, `Read`, `Edit`, `Write` and no `Grep` or `Glob`, so its searches are `Bash` calls (`grep -n`, `grep -rn`, `find`). Edit needs a Read of the file first. Its call args arrive as `key=value` with the keys sorted.

**Built.**
- `web/reveal/tool_format.ts` `grepFormat`: a grep of one named file, not recursive, keeps that file. Its hits (`59:class …`, no path, as Claude Code's `grep -n` printed them) draw with their line numbers in a gutter and their text in the file's language. A path that starts with `(` is not a hit, so a shell's `(eval):1: no matches found` stays plain. 2 unit specs.
- `ToolCard.tsx`: an edit's `old_string` is listed before its `new_string`.

**Gate `tool_output_claude`** (new). One live `claude` turn (the live roster, this machine's Claude Code) on the large fixtures made a repository, asked for eight calls: Read of `models.py`, Bash `grep -n` of it, Bash `grep -rn` over the Go files, Read then Edit of `strings.go`, Write of a TypeScript file, Bash `git diff`, Bash `find`. The turn returns in 22–28 s. From source and on bundle 1794792720:
- the record holds all eight calls, each with its result;
- Read: 805 gutter rows, Python;
- `grep -n` of one file: 6 gutter numbers, Python tokens;
- `grep -rn`: 211 hits with paths, Go tokens;
- Edit: `old_string` then `new_string`, both Go; Write: TypeScript; `git diff`: a diff in Go; Bash summaries parsed as Shell, none reading `key=`;
- ink, CIEDE2000: Read keyword 2.3, `grep -n` keyword 2.3, diff `+` mark 3.1.

Screenshots read: the Edit card, and the `grep -rn` card before the fixes, which showed zsh's unmatched glob drawn as a hit with path `(eval)`. The gate's own ask then quoted `--include='*.go'`.

**Mutants**, each failing the live gate, every build checked: the one-file grep losing its file; `Edit` not a file tool; old and new not swapped. The `(`-path rule is checked by its unit spec.

**Not in `gates:electron`.** The gate needs the live roster and a `claude` turn, as `image_chip_claude` does; neither runs in the chained suite.

**Also corrected in place:** card 505's close called `models.py` 211 lines. The file has 804; 211 was the kernel `read_file`'s first page.

**Other gates on the bundle:** tool_output_formatted, tool_summary_lines, tool_output_toggle, action_signals, chat_one_turn pass. 253 unit specs pass.

**Installed** into Substrate: 1794792720 replaced 1794780217; vocabulary 0.73, home_kind default. Substrate Next ran throughout.

**Rubber Duck Pass.** No tag changed.
