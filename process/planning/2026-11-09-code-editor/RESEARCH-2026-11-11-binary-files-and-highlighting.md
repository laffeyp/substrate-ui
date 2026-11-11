# Binary files and syntax highlighting in the editor

*2026-11-11. The Architect asked whether E14 is right, how binary files are usually shown ("shouldn't it actually just be displayed as binary? … a selector that's different standard ways that people actually represent binary files"), and how the editor will highlight every common language and format, "from JSON to Rust". This settles both from the sources below and sets roadmap r13's E14 and E15.*

## What the editor does today

- `server.py`'s file API sends `text: null` for a file that is not UTF-8, and the centre draws one line: `binary file · N KB` (`web/app/editor/Centre.tsx`). A Latin-1 or UTF-16 text file gets the same line, though it is text.
- Highlighting covers seven families, chosen by extension in `Centre.tsx`'s language switch: TypeScript and JavaScript, Python, JSON, HTML, CSS, Markdown, shell. Rust, Go, C, YAML, TOML, SQL and the rest draw as plain text.

## How editors show a binary file

- **Sublime Text** opens a file with a NUL byte as hexadecimal by default: its default preferences set `enable_hexadecimal_encoding` to true, "files containing null bytes are opened as hexadecimal" (Sublime Forum threads quoting the default preferences). File ▸ Reopen with Encoding changes the view.
- **VS Code** does not open it: the editor shows that the file is "either binary or uses an unsupported text encoding", and Open Anyway shows the bytes as text, garbled (forum reports; the wording is not in VS Code's own docs). Microsoft's Hex Editor extension (`ms-vscode.hexeditor`, MIT) is the hex view: a grid of bytes with a decoded-text column, a data inspector for the bytes under the caret as other types, find, and editing with undo; Open With ▸ Hex Editor picks it (`github.com/microsoft/vscode-hexeditor`).
- **The command-line forms** (`man xxd`): a hex dump is the default (an offset, then sixteen bytes in hex, then the same bytes as text with a dot for each unprintable one, as `hexdump -C` prints it); `-b` writes each byte as eight binary digits; `-p` is plain continuous hex. `od -b` writes octal.

So the standard is: a binary file is shown as its bytes, in hex by default, with the other forms one choice away. Garbled text is what an editor shows when it is made to open a binary file as text, not a view anyone picks first.

## E14, set

1. **A text file in any encoding opens as text.** The server already decides this for attachments (round 3 rule 3, sprint 446: a byte-order mark names UTF-8 or UTF-16; with no NUL byte in the first 8 KB, UTF-8, else Latin-1). The file API uses the same rule and names the encoding, which the status line and INFO show. Such a file opens read-only when it is not UTF-8, until saving in its own encoding is built; the status line says so.
2. **A binary file (a NUL byte in its first 8 KB, the server's rule and ripgrep's) opens as its bytes**, read-only, in one of four forms chosen in the status line: **hex** (the default: offset, sixteen bytes in hex, the text column), **binary** (each byte as its eight 0s and 1s, as `xxd -b`: `H` is `01001000`; the Architect asked for this form by name, 2026-11-11), **octal** (as `od -b`), **text** (the bytes as Latin-1, every byte one character, garbled for a picture but complete). The form is kept per file while the editor is open, and each change of form is recorded.
3. **Past the read limit** a file keeps today's line (`over the read limit · N KB`); a hex view of a file that large is a separate piece of work.

Editing bytes, which the Hex Editor extension does, is not part of E14.

## How every common language is highlighted

CodeMirror 6, the editor's component, highlights through a language package per language. `@codemirror/language-data` 6.5.2 (MIT, the same author) describes 143 languages and formats as `LanguageDescription`s: a name, aliases, extensions and file names (Dockerfile matches `/^Dockerfile$/`), and `load()`, which imports the language only when a file needs it. `LanguageDescription.matchFilename(languages, filename)` (`@codemirror/language` 6.13.1, the installed version) picks the one for a file. It brings full parsers for 31, among them C, C++, Go, Java, JavaScript, TypeScript, JSX, TSX, JSON, Rust, PHP, Python, SQL in six dialects, XML, YAML, CSS, Sass, Less, HTML and Markdown, and stream modes (`@codemirror/legacy-modes`, already installed) for the rest, among them Kotlin, Swift, Ruby, C#, Scala, Haskell, Lua, R, TOML, Dockerfile, Shell, Nginx, diff and Protocol Buffers. Each lazy import becomes its own chunk in the Vite build, so the window loads a language the first time a file of it opens.

## E15, set

The centre picks a file's language with `matchFilename` over `@codemirror/language-data`'s list in place of its own seven-way switch, loads it on first use, and names it in the status line and INFO (`type`). The highlight colours stay the editor's own `HighlightStyle`, which the parsers and the stream modes both feed. A file no description matches stays plain text. New dependency: `@codemirror/language-data` 6.5.2 (MIT), recorded in the working agreement's dependency policy when it lands.

## Sources

- Sublime Text default preferences, `enable_hexadecimal_encoding` (quoted on forum.sublimetext.com, "txt file is opened as some hex code" and "sublime opens file with hex view even though it has null bytes").
- `github.com/microsoft/vscode-hexeditor` (README).
- `man xxd` on this machine; `od(1)`.
- `@codemirror/language-data` 6.5.2, its `dist/index.js` and `package.json` (npm); `@codemirror/language` 6.13.1, `dist/index.d.ts` (`LanguageDescription`, `matchFilename`, `load`).
- `server.py` `_decode_any`, `_attachment_text` (sprint 446); `web/app/editor/Centre.tsx`.
