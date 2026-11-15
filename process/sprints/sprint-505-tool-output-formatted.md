# Sprint 505 — Tool output formatted

```yaml
---
id: 505
status: closed
phase: editor features (roadmap 2026-11-14 r4, E7)
pass_kind: functional
---
```

## scope

`ToolCard.tsx` draws a result as one grey block. A result is highlighted with the editor's parsers and palette: by the extension of the file a read, write or edit names; as shell for `bash`, its ANSI colours kept (through `transcript/ansi.ts`, the login card's terminal model; the card first named a `ansi.ts` that does not exist at that path); JSON as JSON; anything else as plain text. Args are formatted the same way. Highlighting runs once, when the result lands. One verifiable property: a `read_file` of a `.py` fixture shows its keywords in the palette's keyword colour, decoded from pixels.

## observation contract

Gate on the bundle with real fixtures for each kind; pixels decoded as in `editor_highlight_seen`. Mutant: one grey fails.

## close

**Built.**
- `web/reveal/tool_format.ts`: a call's file (kernel positional args, Claude Code's `key=value`), the format of each arg and of the output, a read's line numbers split off as a gutter, JSON laid out when it comes on one line, a kernel `bash` result (`{exit, stdout, stderr}`) read apart, and which text needs the terminal model. 6 unit specs.
- `web/reveal/transcript/ToolText.tsx`: code parsed with the language the editor gives that file name (`@codemirror/language-data`) and drawn with `@lezer/highlight`'s `highlightCode`, once per text, kept by text across remounts; plain past 200,000 characters. Text with escapes, carriage returns or backspaces is drawn through `ansi.ts`'s `AnsiTerminal`.
- `ToolCard.tsx`: a shell command and a file's body arg drawn in their format; the output in its format; a kernel `bash` result as its stdout, its stderr under a label, and its exit code when not 0. `ProgressStream.tsx`: the live stream through the terminal model.
- `derive/look.ts` `transcriptVars(look, scheme)`: the editor's palette as `--syntax-<class>` variables, ghost included; its three callers pass the scheme.

**Found and fixed.**
- The kernel's `bash` returns JSON, so its output first drew as a JSON object with the command's escapes inside strings. The card now draws what the command printed.
- The live stream drew escape codes as text (`[31mfailed [0m`), seen in the screenshot; the gate did not check it until then.
- `editor_view` pinned `EDITOR_DRAWN`'s whole payload and failed on card 504's `groups` field; card 504 had not run it. Pin updated.

**Gate `tool_output_formatted`** (new; in `gates:electron`). One scripted deterministic turn on the large fixtures: `read_file` of the real `models.py` (211 lines), `bash` with ANSI red, bold and a carriage return, `bash` printing one-line JSON, `write_file` of TypeScript. From source and on bundle 1794725844:
- formats drawn: Python code, Shell, terminal (stream and output), JSON, TypeScript;
- 211 line numbers in the gutter, none left in the code; no escape drawn as text; `100% done` replaces `50%`; JSON on 16 lines;
- ink, CIEDE2000 from the screenshot: Python keyword 2.3 from the keyword colour (10.7 from the old grey), string 1.4, ANSI red 3.0 from the failed red, shell string 1.4; ghost scheme keyword 0.5 from the ghost grey.

Screenshots read: the read and bash cards, the JSON block, the write's body.

**Mutants**, each failing the gate, every build exit checked: tokens all grey; line numbers left in; `bash` JSON not unwrapped; stream drawn raw; scheme ignored. Two first attempts broke the build and were rewritten.

**Not observed in a window.** Claude Code's own tool cards (`Read`, `Bash`, `Edit`, as Substrate Next's sessions draw them): their arg and output shapes are in the unit specs, not driven through a live `claude` turn.

**Other gates on the bundle:** action_signals, chat_one_turn, tool_output_toggle, transcript_follow, editor_view, editor_inspector, editor_groups, editor_markdown_links pass. 247 unit specs pass.

**Installed** into Substrate: 1794725844 replaced 1794714455, launched with launchd's environment; `APP_BOOTED` vocabulary 0.73, home_kind default.

**Rubber Duck Pass.** No tag changed; tool cards write no new signal. One observation, recorded above: the harness path is unit-tested only.
