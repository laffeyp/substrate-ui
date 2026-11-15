# Sprint 510 — Plain bash output formatted by what it printed

```yaml
---
id: 510
status: closed
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

## close

**Built.**
- `web/reveal/tool_format.ts`: `shellWords`, a word splitter with quotes and escapes; `commandFormat`, which reads a list by its last command and a pipeline by its last stage. `cat`, `head`, `tail`, `sed -n`, `less`, `nl` and `bat` of one file give that file's code, and a `head` reading a pipe takes the file of the stage before it. `git diff`, `git show`, `git log` and `diff` give a diff; `grep`, `rg`, `ag` and `git grep` give hits. `isDiff` and `grepLines` check the output has that shape before the format is used; otherwise it stays plain. A JSON file shown by `cat` is laid out as JSON. 3 unit specs.
- `web/reveal/transcript/ToolText.tsx`: a diff is drawn file by file, each file's lines parsed in its language. Added lines carry the editor's teal `+` and keep their syntax colours; removed lines carry a red `−` and draw in red, as the editor draws them. Headers are dim and hunk headers take the meta colour. Grep hits are drawn in runs of one file: the path dim and kept on one line, the line number in the gutter grey, the matched text parsed in that file's language.
- `ls -l`, `git status` and unknown commands stay plain.

**Gate `tool_output_formatted`**, extended. The workspace is made a repository and one Go file is changed. Five more `bash` calls: `cat` of the Rust fixture, `cd … && cat strings.go | head -n 60`, `git diff`, a `grep -rn` over four languages, and `ls -l`. From source and on bundle 1794780217:
- formats: Rust code, Go code, a diff in Go with 2 added lines and 1 removed, grep hits, `ls -l` as plain text;
- ink, CIEDE2000 from screenshots: Rust keyword 2.3, diff `+` mark 3.1 from the teal, removed line 3.0 from the red, grep path 0.6 from the dim grey, grep keyword 2.3. The dim grey stands 24.8 from the box's ground, so its ink is read with a ground cut-off of 15, not 25.

Screenshots read: the diff (Go colours, teal marks, red removed line) and the grep hits.

**Mutants**, each failing the gate, every build checked: the command ignored; a piped `head` not taking the file before it; the removed line not red; grep text unparsed.

**Found, open.** A `bash` call that streams 249 KB (a `grep -rn` over the two long fixtures, 3,129 hits) takes the window 39–41 s to reach the park after the server returned. The time is the same with card 505's stream change reverted (39.3 s against 39.7 s), so it predates this roadmap. The gate's grep is narrowed to four languages; the lag is on the BLACKBOARD.

**Other gates on the bundle:** tool_summary_lines, tool_output_toggle, action_signals, chat_one_turn and transcript_follow pass. 251 unit specs pass.

**Installed** into Substrate: 1794780217 replaced 1794778244; vocabulary 0.73, home_kind default. Substrate Next ran throughout.

**Rubber Duck Pass.** No tag changed. Claude Code's `Bash` output is checked in the unit specs; card 511's live turn checks it in a window.
