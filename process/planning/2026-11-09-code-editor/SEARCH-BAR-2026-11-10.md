# The search bar

*2026-11-10. Supersedes, for search, the design spec r6 §5.1's search tab, the roadmap r10's E8 search and E9 quick open, and the build list of `RESEARCH-2026-11-10-editor-search-r2.md`. The Architect's ruling of this date: one search bar.*

## What the search bar is

The search bar is the one box in the editor for finding anything that can be found with text. It sits in the left column's search tab. A click on the tab, or ⌘⇧F from anywhere in the editor, puts the cursor in it with its text selected. You type whatever you want.

It searches, in one pass over the whole workspace, folders never opened included:

- **file names**, extensions included: `jpeg` finds `photo.jpeg`;
- **folder names**: `lib` finds `src/lib/`;
- **paths**: `lib/cart` finds `src/lib/cart.ts`;
- **the text inside files**: `priceCents` finds every line that holds it, in unsaved edits as well as on disk.

One rule decides a match everywhere. The query is matched as typed, case ignored unless **Aa** is on, whole words only when **ab** is on, as a regular expression when **.\*** is on. A name and a line of text pass or fail by the same rule.

The walk follows the workspace's ignore files (`.gitignore`, `.ignore`) in or out of a git repository, leaves out `.git`, `.DS_Store`, `node_modules` and the like, and searches hidden files. A binary file, a JPEG or a PDF, has no lines to match, but its name is matched like any other. Files to include and to exclude narrow the walk (globs behind `…`).

### Results

- **Names first.** The files and folders whose name or path matches, the match lit, each with its folder dim beside it. Name matches rank above path matches, and a shorter path above a longer one.
- **Then text.** The lines that match, grouped by file, each with its line number and the match lit, one row per match.
- One count line over both: `3 names · 12 matches in 4 files`.

A click or ↵ on a file opens it with the cursor in the code. On a folder it shows the files tab with the tree opened to that folder. On a line it opens the file at that line. ↓ and ↑ step through every result.

### Replace

Replace acts on the text matches only: one match, every match in one file, or every match (⌘⇧↵). A name match is never renamed by a replace. The last replace undoes in one step. Each file is written through the file API, one FileWritten each, and an open file with unsaved edits is replaced in its buffer and saved.

### Staying current

The results run again when the query or a toggle changes, when the shown buffer is edited, and when files change on disk (the watch stream), so a file the session writes appears without retyping.

## Why it supersedes quick open and the tree's find

Once the bar finds names, two other boxes find the same things.

| Box | What it finds | What else it gives | Does the bar cover it? |
|---|---|---|---|
| Quick open, ⌘P (sprint 441) | file names and paths | a box over the code when the left column is folded; recent files | Yes. ⌘⇧F unfolds the column and focuses the bar; the open tab lists the open files. |
| The tree's find, ⌥⌘F (sprint 437) | file and folder names | filters or highlights the tree itself | Yes. The bar lists the matching files and folders, and a folder result opens the tree to it. |

Three ways to find a file by name, and a search bar that could not find one, is duplication. Both boxes come out.

## What comes out, and what changes

- **Quick open, sprint 441:** `editor/QuickOpen.tsx`, `derive/quick_open.ts` and its spec, the Go menu, ⌘P in the keymap, the recent list in the store, `openFile`'s keep-the-shown-tab option, `editor_quick_open.ts`. The server's file list (`GET …/files/list`) stays only if the bar's name matching uses it. Vocabulary: FILES_LISTED_ALL and EDITOR_QUICK_OPENED retired, EDITOR_FILE_OPENED.how quick_open retired.
- **The tree's find, sprint 437:** its find box, filter and highlight in `editor/FileTree.tsx`, `derive/tree_find.ts` and its spec, ⌥⌘F's tree meaning (it is replace in the open file everywhere again), `GET …/files/find`, `editor_tree_find.ts`. Vocabulary: FILES_FOUND and EDITOR_TREE_FOUND retired.
- **The files tab:** the `⌘⇧F search workspace` text above the tree comes out. The tree is for files; the key stays.
- **The search bar:** gains name and path matches, the names-first results, the count over both, folder results that open the tree, and re-running on disk changes. Vocabulary: FILES_SEARCHED and EDITOR_SEARCH_QUERIED carry the name matches' count.

## Why it went wrong

1. **The research asked what editors have, not what a search bar is for.** It catalogued VS Code's boxes, the search panel, the Explorer's find and quick open, and the build list copied all three. VS Code splits finding by name from finding text because its search panel cannot find names. That limit was copied as if it were the standard.
2. **Each box was built to its own gate, and each gate tested the copy against itself.** The search gate checked text matches, the tree gate checked names, quick open checked names again. Every gate passed. No gate typed a file's name into the search bar, the first thing you did with it.
3. **A frame's text was built without asking what it was for.** Frame 24j's `⌘⇧F search workspace` went above the file tree because the frame drew it there. It took up the files tab to describe a key.
4. **"Done" was reported against the build list, not against the search bar working.** The list was finished; the bar still could not find a JPEG by name.

## The test of the bar

The bar works when, in a workspace it has never seen: typing a file's name lists that file first; typing its extension lists every file of that kind; typing a folder's name lists the folder; typing words lists the lines that hold them; and ↵ opens the first result. The gate for it types those things and checks them against the files the gate wrote.
