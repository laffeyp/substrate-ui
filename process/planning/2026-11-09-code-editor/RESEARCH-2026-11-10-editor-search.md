# Editor search: what editors do, what Substrate has

*2026-11-10. Sources: the VS Code docs (code.visualstudio.com, "Basic editing" and "User interface"), the IntelliJ IDEA docs (jetbrains.com/help/idea: "Find and replace text in a file", "Find and replace in project", "Search everywhere"), the ripgrep guide (GUIDE.md), the installed @codemirror/search 6.7.2, and commands run on this machine's git 2.50.1.*

Editors have three searches, not one. The open file has find and replace. The tree finds files and folders by name. The workspace has find and replace in the text of every file. Neither the VS Code page nor the IntelliJ page says the text search matches file names; both editors give names a search of their own.

## 1. In the open file (⌘F)

VS Code: ⌘F opens the Find control with Match Case, Match Whole Word and Regular Expression; the Replace control adds Preserve Case. Find in Selection is ⌥⌘L. Matches show in the editor, the overview ruler and the minimap. Pasted multi-line text searches across lines.

IntelliJ: Ctrl+F, with Words, Match case and Regex; Preserve Case on the replace field; Search In Selection; Replace, Replace all and Exclude for one match; ⌥↓ lists previous searches; next and previous arrows.

Substrate (the inspector's FIND / REPLACE, sprint 428): Aa, .*, the count `1 of 4`, ↵ next, ⇧↵ previous, ↵ replace one, all. It lacks whole word, preserve case and in selection. CodeMirror's `SearchQuery` already takes `wholeWord`.

## 2. File and folder names in the tree

VS Code: with the Explorer focused, ⌥⌘F opens a Find control on the tree. A Filter button switches between highlighting matches and filtering the tree to them; while highlighting, a folder holding matches shows a badge. Down steps to the first match and on. A Fuzzy Match button switches between exact and fuzzy matching on any part of a file or folder name. Quick Open, ⌘P, opens a file by its name.

IntelliJ: Ctrl+Shift+N "finds any file or directory by name (supports CamelCase and snake_case)". The speed-search page for the Project tree returned 404, so typing-to-filter in the tree is not verified here.

Substrate: the tree has no name search. Quick open ⌘P is roadmap r10 E9 (file names from `git ls-files`) and is not built.

## 3. Text in every file (⇧⌘F)

VS Code: ⇧⌘F; Match Case and regex; "files to include" and "files to exclude" globs, comma-separated (`*`, `?`, `**`, `{}`, `[]`); a toggle for `.gitignore` and the exclude settings; "search only in changed files"; replace across all files, all in one file, or a single change; a Search Editor with one context line before and after each result. The search runs on ripgrep. ripgrep's regex syntax is the Rust regex crate's (`\s`, `\w` by Unicode), with `-F` fixed string, `-w` whole word, `-U` multi-line, `-S` smart case, `-g` globs read as `.gitignore` patterns; it skips ignored, hidden and binary files by default.

IntelliJ (Find in Files): Words, Match case, Regex; a file mask (`*`, `?`, `,`, `!` to exclude); a scope of module, directory or a custom one; a filter for comments; a preview to replace in; Open in Find Window to group, exclude directories and sort.

Substrate (sprint 434) has Aa, .*, replace all, results grouped by file with the matches lit, and a click or ↵ to open the line. It lacks:

- **Whole word.**
- **Include and exclude globs.**
- **Replace one match, or all in one file.**
- **The regex editors use.** The server runs `git grep -E`, which is POSIX syntax. On this machine `\d+`, `\bimport` and `import\s+b` find nothing, and `(?=x)` is refused with a fatal error. `git grep -P` (PCRE) finds all three and accepts lookbehind. `-w` and `:(exclude)` pathspecs work too. ripgrep is not installed.
- **A correct replace for anchored patterns.** Replace all runs the pattern over the whole file without JavaScript's `m` flag, so `^` and `$` match only at the file's start and end. Node turned `"import a\nimport b"` into `"from a\nimport b"`.

## What the next sprint builds

1. Tree name search: a find control on the tree, with highlight or filter, folder badges, ↓ through matches, and exact or fuzzy matching. ⌥⌘F is already the editor's replace-in-file key (sprint 428). VS Code splits the same key by focus, and so can Substrate: the tree when the tree has focus, replace in file otherwise.
2. Text search: `git grep -P` in place of `-E` (a git built without PCRE refuses `-P`, and the server should say so); whole word (`-w`); include and exclude globs as git pathspecs; replace one match and all in one file; the `m` flag on replace.
3. Open file: whole word, preserve case, in selection.
