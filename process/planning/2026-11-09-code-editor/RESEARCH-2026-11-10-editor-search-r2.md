# Editor search: what editors do, what Substrate has (r2)

*2026-11-10. Replaces `RESEARCH-2026-11-10-editor-search.md`, which proposed `git grep -P` and so kept the search tied to git. Sources are listed at the end; anything not confirmed in one is marked unverified.*

Editors have three searches. The open file has find and replace (⌘F). The tree finds files and folders by name. The workspace has find and replace in the text of every file (⇧⌘F). Each is the editor's own code. None of the three runs git.

## 1. In the open file (⌘F)

VS Code's Find control has Match Case, Match Whole Word and Regular Expression; its Replace control adds Preserve Case. Find in Selection is ⌥⌘L. Matches show in the editor, the overview ruler and the minimap. IntelliJ has Words, Match case and Regex; Preserve Case; Search In Selection; Replace, Replace all and Exclude; ⌥↓ for previous searches.

Substrate's inspector FIND / REPLACE has Aa, .*, the count `1 of 4`, ↵ next, ⇧↵ previous, ↵ replace one, and all. It lacks whole word, preserve case and in selection. It runs on CodeMirror 6.7.2, whose `SearchQuery` already takes `wholeWord`.

## 2. Names in the tree

**VS Code.** With the Explorer focused, ⌥⌘F opens a Find control on the tree, added in 1.70. A Filter button switches between highlighting matches and filtering the tree down to them. While highlighting, a folder that holds matches shows a badge. Down steps through the matches. A button switches between fuzzy and continuous matching on any part of a file or folder name. Quick Open, ⌘P, opens any file by name. Unverified: whether the tree's Find reaches into folders never opened.

**IntelliJ.** Speed search starts when typing in the Project tree. The matched characters are lit, Up and Down move between matches, Enter opens, and Escape closes. It works on expanded nodes only. Ctrl+Shift+N finds any file or directory by name, CamelCase and snake_case included.

**Substrate** has no name search in the tree. The tree reads each folder only when it is opened, so a search that reaches closed folders needs the workspace's whole file list from the server. Quick open (roadmap r10 E9) needs the same list, and E9 names `git ls-files` for it, the same mistake as the text search.

## 3. Text in every file (⇧⌘F)

### VS Code

The Search view has Match Case, Match Whole Word and regex. It takes "files to include" and "files to exclude" globs, comma-separated. A toggle applies or ignores `.gitignore` and the exclude settings, and another searches only changed files. Replace works across all files, in one file, or on a single match, and a Search Editor shows the results with one line of context. Results start expanded (`search.collapseResults: alwaysExpand`) as a list (`search.defaultViewMode`).

The engine is ripgrep, bundled with VS Code. Its source (`ripgrepTextSearchEngine.ts`) passes:
- `--hidden --no-require-git` always, so hidden files are searched and `.gitignore` applies whether or not the folder is a git repository;
- `--engine auto` for a regex, so ripgrep moves to PCRE2 when a pattern needs it;
- `--case-sensitive` or `--ignore-case`; `--fixed-strings` for plain text; whole word built into the pattern;
- `-g` and `-g !` for the include and exclude globs; `--no-ignore` when ignore files are turned off; `--follow` for symlinks when set; `--max-filesize`; `--encoding`; `--multiline`.

`files.exclude` defaults to `.git`, `.svn`, `.hg`, `.jj`, `.DS_Store` and `Thumbs.db`. A VS Code bug report lists `search.exclude` adding `node_modules`, `bower_components` and `*.code-search`; that comes from a report, not the source.

### The regex flavours

| Engine | Used by | Lookaround, backreferences | `\d` | Named group |
|---|---|---|---|---|
| Rust regex | ripgrep's default | none (they break its O(m·n) time bound) | any script's digits (`\p{Nd}`) | `(?P<n>)`, `(?<n>)` |
| PCRE2 | ripgrep `--engine auto` fallback | yes | — | — |
| JavaScript | CodeMirror (Substrate's ⌘F) | yes | 0–9 only, even with `u` | `(?<n>)` |
| Python `re` 3.14 | Substrate's server | yes | any script's digits | `(?P<n>)` only; `(?<n>)` fails |
| git grep `-E` (POSIX) | Substrate today | none | no `\d`, `\b` or `\s` at all | none |

Every engine but POSIX accepts `\d`, `\b`, `\s`. Python also refuses `\p{L}`, which JavaScript accepts with `u`. These rows were checked by running each pattern on this machine, apart from the Rust row, which comes from the regex crate's docs, and the PCRE2 row.

### IntelliJ

Find in Files has Words, Match case and Regex. It takes a file mask (`*`, `?`, `,`, `!`) and a scope of project, module, directory or a custom set, and can skip comments or search only them. Matches can be replaced from the preview, and Open in Find Window groups and sorts the results.

### Replace across files

VS Code replaces across all files, in one file, or one match at a time. Visual Studio, the separate IDE, has an option to keep each changed file open after Replace All so the change can be undone before saving. Unverified for VS Code: whether its search reads unsaved edits in open editors, and whether one undo reverts a replace across files.

## Substrate today, against this

Sprint 434's search runs `git grep` on the server. It fails these:

- It needs git installed, even in a folder that is not a git project.
- Outside git it reads no `.gitignore`, so `node_modules` and build output are searched.
- With .* on, `\d`, `\b`, `\s` and lookaround do not work.
- It has no whole word, no include or exclude globs, and no replace in one file or of one match.
- Replace all runs JavaScript without the `m` flag, so `^` and `$` replace only at the start and end of each file.
- It lights matches with JavaScript but finds them with POSIX, so the two can disagree.

What it gets right: results grouped by file with the matches lit, case and regex toggles, a click or ↵ opening the line, and each replaced file written through the file API as one FileWritten.

## What the standard design is for Substrate

The server walks the workspace itself, as ripgrep walks it for VS Code. It applies `.gitignore` (and `.ignore`) whether or not the folder is a git repository, skips the `files.exclude` names, skips binary files (a NUL byte, as ripgrep decides) and files over a size cap, and searches hidden files. The same walk gives the tree's name search and quick open their file list, so git leaves all three.

Matching runs in one place per search. The server matches with Python `re` and returns each match's columns, so the page lights exactly what the server found. Replace across files runs on the server with the same pattern and goes through the existing write path, one FileWritten per file. The page accepts `$1` in a replacement, as editors do, and the server reads it as Python's `\1`. The open file's find stays on CodeMirror's JavaScript regex. The two engines differ in the cases the table names, and none of those differences touches `\d`, `\b`, `\s` or lookaround.

`.gitignore` matching has no home in the runtime the app ships. `pathspec` 1.1.1 is on this machine only as a dependency of mypy, in the kernel's dev extras. Adding it would change the kernel's dependencies; on 2026-11-09 the editor's kernel changes were undone on the ruling that the editor is just an editor, and a kernel dependency for the editor goes against that. The matcher is written in `server.py` against the gitignore(5) rules, and its tests compare it with `git check-ignore` (git in the tests only).

The features to build, from the sections above:

- **Tree:** a find on the tree (highlight or filter, folder badges, ↓ through matches, fuzzy or exact) over the server's file list. ⌥⌘F is the editor's replace-in-file key (sprint 428); VS Code splits it by focus, and Substrate takes the tree when the tree has focus.
- **Workspace:** whole word; include and exclude globs; replace all, all in one file, one match; regex as above; the `m`-flag fault gone with the move to the server.
- **Open file:** whole word, preserve case, in selection.

## Sources

- VS Code docs, "Basic editing": https://code.visualstudio.com/docs/editing/codebasics
- VS Code docs, "User interface": https://code.visualstudio.com/docs/getstarted/userinterface
- VS Code release notes 1.94 and 1.70: https://code.visualstudio.com/updates/v1_94, https://github.com/microsoft/vscode-docs/blob/vnext/release-notes/v1_70.md
- VS Code source: https://raw.githubusercontent.com/microsoft/vscode/main/src/vs/workbench/services/search/node/ripgrepTextSearchEngine.ts, .../contrib/files/browser/files.contribution.ts, .../contrib/search/browser/search.contribution.ts
- VS Code bug report with the search configuration: https://github.com/microsoft/vscode/issues/148357
- IntelliJ docs: https://www.jetbrains.com/help/idea/finding-and-replacing-text-in-file.html, https://www.jetbrains.com/help/idea/finding-and-replacing-text-in-project.html, https://www.jetbrains.com/help/idea/searching-everywhere.html, https://www.jetbrains.com/help/idea/speed-search-in-the-tool-windows.html
- ripgrep guide: https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md
- Rust regex crate: https://docs.rs/regex/latest/regex/
- Visual Studio, Replace in Files: https://learn.microsoft.com/en-us/previous-versions/visualstudio/visual-studio-2012/a40ywt0a(v=vs.110)
- Run on this machine: git 2.50.1 (`-E` and `-P` patterns), Python 3.14.4 `re`, Node's RegExp, `uv tree --invert --package pathspec`.
