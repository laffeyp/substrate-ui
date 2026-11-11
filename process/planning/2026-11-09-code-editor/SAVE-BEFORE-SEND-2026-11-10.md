# Save before send

*2026-11-10. The Architect's ruling: what is on screen is what the model sees. Every unsaved buffer is saved when a message is sent, before the model starts. This document says why, how it hooks into Substrate, and every case it meets. Roadmap item E10.0. Sources at the end.*

## Why

Today the model reads the disk, and the person sees the buffer. When the two differ, the model works from text the person has already changed.

Three facts in the code make it so:

1. The editor's unsaved text lives only in the page: `BUFFERS` and the CodeMirror state in `web/app/editor/Centre.tsx`. The server never receives it. The search bar is the one exception, since the page sends the buffers with each search (sprint 436).
2. Every model reads the disk. The kernel's `read_file` opens the file there (`substrate/topologies/tool_loop/tools.py`). Claude Code, Codex and Cursor each run as a separate program (`CliResponder`) and read the disk with their own tools.
3. The editor saves only on command (sprint 425): ⌘S, `:w`, ⌃O. Each save puts one FileWritten on the record.

## What the others do

VS Code's Copilot reads through the editor. Its read-file tool takes a file's text from `workspaceService.openTextDocument` (`readFileTool.tsx`). VS Code's API says `openTextDocument` "will return early if this document is already open", returning the open document with its unsaved edits.

Claude Code in VS Code saves first. The extension's `autosave` setting: "Auto-save files before Claude reads or writes them."

Cursor's agent works on the disk, and its users report the gap. Its edit tools write the disk while the editor keeps its own buffer, and a later save overwrites the agent's edit. A forum request asks for the fix.

Reading through the editor cannot work here. Claude Code, Codex and Cursor read the disk themselves, and nothing Substrate does reaches inside them. Saving first works for every model Substrate drives, so this plan takes Claude Code's way.

## How it hooks in

**The page.** A message is sent from the input bar (`state/input_bar.ts` `submit`), which hands the line to the pane's session controller (`vm/session_controller.ts` `submitLine`, then `sendTurn`).
- **The hook:** before the controller posts the turn, the page saves every unsaved buffer of that pane's session. The editor already has the parts:
  - `unsavedBuffers(sessionId)` lists the buffer shown and the buffers kept for other tabs;
  - `writeBuffer(sessionId, path, text)` saves one through `PUT …/file` with the hash the buffer read, the file's own line endings, and the buffer's undo history kept (sprints 425 and 436).
- **The wiring:** the session controller is in `web/vm` and must not import the editor, so App, which knows both, registers the save as the input bar's step before a send. The registration is one function in `state/input_bar.ts`.
- **The order:** the echo appears at once, the saves run, then the turn is posted. The post waits for the saves, so the model never starts before them.
- **Which buffers:** every unsaved buffer of the session, whether or not the editor is open. A buffer kept from an earlier visit counts, because it is what the person last saw.

**The server.** No new route. Each save is the existing `PUT …/file`: one FILE_WRITTEN in the server's trace, and one FileWritten on the record through `SessionRegistry.append_event`.

**The record and the kernel.** `append_event` writes the save between turns (`append_at_rest`) or into a running turn (`Runtime.inject_event`). Between turns, the saves land on the record before the message's UserMessage, so the record shows the files as the model found them. FileWritten is recorded only: "no trigger subscribes, so the model's turn does not change". The model learns of a saved file by reading it, and reads what the person saw.

**The view field.** FileWritten carries `view`. A save made for a message is written with view `send`, so HISTORY can draw it as "saved with the message" and the activity tab can tell it from a save by hand. The kernel's field is free text, so no kernel change is needed.

**Signals.** One new editor tag, EDITOR_SAVED_FOR_SEND `{files, refused}`, written once per message that had unsaved buffers. TURN_SUBMITTED gains `saved`, the count. The server's FILE_WRITTEN already covers each save.

## Every case

- **No unsaved buffer:** nothing is saved, and the message goes as today.
- **Between turns:** the saves are at rest, on the record before the message.
- **A turn is running:** the saves inject into it. The new message posts after them and waits its turn as messages do today.
- **The session has ended:** the saves are written off the record (sprint 427), and the message resumes the session as it does today.
- **The file changed on disk since the buffer read it:** the save is refused as stale (409), so the file is not overwritten. The message still goes, since no attachment, and no save, refuses a message. The editor shows its offer to reload or overwrite for that file, as for any stale save (sprint 425). The transcript shows one warning row under the message, naming the file as not saved.
- **A slash command** (`/model`, `/help`) starts no model turn and saves nothing. A command passed to the driver (`//context`) does start one, and saves.
- **The undo boundary moves.** ⌘Z undoes in the buffer while it has unsaved edits, and steps through HISTORY after a save (BLACKBOARD 2026-11-09, the undo boundary). A save at send moves that line to the moment of sending. ⌘Z after a message steps the file's HISTORY, where the save is a row.
- **The model edits a file while the person types in it again:** unchanged from today. The follow marks show the edit (sprint 431), and the next save meets the stale offer.
- **Chips and selections:** round 3 of `ADD-TO-MESSAGE` said a selection with unsaved text sends its first 64 KB and leaves the rest behind. With this in place, the buffer is saved before the model starts, so a selection's range always names text on disk. A selection still carries its own text, the range pointed at, under the same caps.

## How it is tested

- **The page's spec:** the step runs before the post, waits for it, saves only the pane's session, and counts refusals.
- **The gate, `editor_save_on_send.ts`,** on a repository the gate writes, with the deterministic driver, then with the live model:
  - type in two files without saving, one shown and one in a tab behind;
  - send a message;
  - the disk holds both buffers before the turn's first event;
  - the record shows two FileWritten with view `send` before the UserMessage;
  - EDITOR_SAVED_FOR_SEND counts two;
  - with the live model, asked to read the shown file, the read returns the typed text.

  A third file, changed on disk behind its buffer, is refused, offered, warned of, and the message still goes.

## Scope

The model is told nothing about the person's saves (the Architect, 2026-11-10). The work saves the buffers and records the saves; the kernel's prompt stays as it is. Claude Code tells its own model about files changed since it read them, but only within one run, and Substrate starts a new `claude -p` for every call, with no `--resume` (the driver profile in `server.py`).

## Sources

- `microsoft/vscode-copilot-chat`, `src/extension/tools/node/readFileTool.tsx`: `TextDocumentSnapshot.create(await this.workspaceService.openTextDocument(uri))`.
- VS Code API reference (code.visualstudio.com/api/references/vscode-api), `workspace.openTextDocument`: "Opens a document. Will return early if this document is already open."
- Claude Code in VS Code (code.claude.com/docs/en/vs-code), the extension settings: `autosave`, "Auto-save files before Claude reads or writes them."
- Cursor forum: "Agent edits should sync with the open editor buffer" (forum.cursor.com/t/…/160123); "Agent edits sometimes not saving file to disk" (forum.cursor.com/t/…/134528). These are user reports, not Cursor's documentation.
- This repository and the kernel:
  - `web/app/editor/Centre.tsx`: `BUFFERS`, `unsavedBuffers`, `writeBuffer`, the save;
  - `web/app/state/input_bar.ts` `submit`;
  - `web/vm/session_controller.ts` `submitLine`, `sendTurn`;
  - `server.py` `_session_file_write`;
  - `substrate/topologies/session_registry.py` `append_event`;
  - `substrate/topologies/session/__init__.py` `FileWritten`;
  - `substrate/topologies/tool_loop/tools.py` `_read_file`;
  - `substrate/adapters/models.py` `CliResponder`;
  - `server.py`, the `claude` driver profile: `["claude", "-p"]`, no `--resume`, no `--bare`.
