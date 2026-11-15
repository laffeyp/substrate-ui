# Sprint 510 — Plain bash output formatted by what it printed

```yaml
---
id: 510
status: pending
phase: editor features (roadmap 2026-11-14 r5, E10)
pass_kind: functional
---
```

## scope

Card 505 formats a read, JSON and escapes; other `bash` output draws as plain text. The output is formatted by the command that printed it: `cat`, `head`, `tail`, `sed -n` or `less` of one file is that file's code in its language; `git diff`, `git show` and `diff` output is a diff, added and removed lines in the editor's change colours (D7: teal and red); `grep -n`, `rg -n` and `git grep -n` hits draw their path and line number apart from the matched text; `ls -l` and `git status` stay plain monospace. A pipeline is read by its last command; an unknown command stays plain. One verifiable property: `cat` of the Rust fixture draws its keyword in the keyword colour.

## signal contract

No new tag.

## observation contract

Gate `tool_output_formatted` extended on the bundle with a scripted turn of `cat`, `git diff`, `grep -n` and an unknown command over the large fixtures; ink from pixels; the diff's added and removed lines by colour. Mutant per path.
