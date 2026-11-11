# Add to the message

*2026-11-10. The Architect, after using sprint 443: what was built is a prototype; this feature restarts from here. Grounds: D94 and D71 (`design/received/handoff 5/docs/DESIGN-DECISIONS -through 2026-11-04-.md`), the design spec r6's "Add to the message", frame 24k, the kernel's `Attachment` (`substrate/topologies/session/vocabulary.py`) and its prompt lines (`transcript.py` `attachment_lines`), and the precedents D94 names, as their docs state them (sources at the end).*

## What the prototype did, and what was wrong with it

Sprint 443 built chips in the input bar, one source (⌥-click a file or folder in the tree), and the message's `attachments`. Used on real files, four things failed.

1. **A message was refused because of what it carried.** The server's attachment reader (`server.py` `_attachment_file_text`, sprint 388) raises on a file over 2 MB (`'1979.m4a' is over 2097152 bytes`) and on a file that is not UTF-8 (`'1994_Helmet_revised_4472x (1).webp' is not UTF-8 text`). Either refuses the whole turn. Accepting only small UTF-8 text and failing everything else is happy-path engineering: it breaks the robustness principle (be liberal in what you accept) and fails where it should degrade.
2. **The sent message lost its chips.** The record's UserMessage holds the attachments, but the transcript draws only the text.
3. **Rows went out of order.** A refused turn's echo stays in the transcript, unconfirmed. When a later message with the same text is accepted, `session_controller.ts` finds its echo by text with `findIndex`, the first match, takes the refused one's, and moves it to the end; that refusal's warning row is left stranded above. Seen: "what is that", refused, refused, "what is this", "what is this".
4. **A selection could not be added.** D94 names "cart.ts 85–89" for a selection; only whole files and folders had a source.

## What an attachment is

A thing from any view, handed to the next message as context and recorded with it. D94 lists them by view: code and documents (a file, a folder, a line range); images (the file or a region); video and audio (the file or a time range); design (an element); planning (a section, requirement, work item or card); the record lenses (an event by seq).

Every attachment carries a **reference** and, when it has one that fits, its **content**:

| Kind | Reference | Content sent with the message |
|---|---|---|
| File, any type | its workspace path | its text, when the file is text and within the inline budget |
| Selection | path and range: lines 85–89, or 85:4–85:20 inside lines | the selected text as the buffer shows it, unsaved edits included |
| Folder | its path | a listing of its files, as Claude Code's folder references give |
| Image | its path (a region: its rectangle) | the path; the image itself when the model takes images |
| Audio, video | its path (a time range: its start and end) | the path |
| Record event | `seq:<n>` | the event's kind and payload |

### The rules

- **A message is never refused for an attachment.** An attachment that cannot be inlined goes by reference, with one line saying why: its size, that it is binary, or that it was not found when the message was sent. The model has file tools and reads it if it needs to. Claude Code has the same mode: with file mentions off, "Claude then receives the paths you referenced with a note to read them using its file tools". The only refusals left are real errors: a path outside the session's workspace, or a request the server cannot parse.
- **Any text is text.** A file with no NUL byte in its first 8 KB is text (ripgrep's rule for binary). It decodes as UTF-8; with a UTF-16 byte-order mark, as UTF-16; otherwise byte for byte (Latin-1), so every text file reads. A file with a NUL byte is binary and goes by reference.
- **The inline budget is 256 KB of text.** Claude Code includes a file "when it fits the Read tool's token limit, 25,000 tokens by default", and "a text file larger than 256KB isn't included". Over the budget, the file goes by reference with its size and line count.
- **Content is resolved when the message is sent.** The record holds what the model saw, as the kernel's `Attachment.text` already does. A selection's text comes from the page, the buffer as shown. A file's comes from the disk.
- **The kernel stays as it is.** `Attachment` has `kind`, `label`, `ref`, `span` and `text`, and `attachment_lines` writes `[attached <kind> <label>]`, the text, and `[end attached]`. A reference-only attachment's `text` is its one line, for example `(not inlined: 3.2 MB audio; read it at media/1979.m4a with your file tools)`. No kernel change is needed.

## How chips look and behave

- **In the input bar** (built in sprint 443): the label ("cart.ts", "tests/", "cart.ts 85–89"), the path on hover, × to remove, ⌫ at the start of an empty draft to remove the last. The same thing added twice is one chip.
- **On the sent message:** the message in the transcript shows its chips beside its text, the same labels with the path on hover. The page's echo shows them at once, and the record's message replaces the echo by identity, not by text.
- **A refused message:** a real error leaves the draft and its chips in the bar, so nothing is lost, and the warning sits under that message.

## Sources

D94 lists ⌥-click, drag and right-click › Add to message, in any view.
- **Tree:** ⌥-click (built), right-click › Add to message, and drag into the prompt.
- **Tabs and search results:** drag and right-click.
- **Editor selection:** right-click › Add to message, and a key, giving "cart.ts 85–89" or "cart.ts 85:4–85:20".
- **The meta pane's events:** right-click › Add to message, giving "seq 240".
- **Images, media, design, planning:** with their views, which wait behind the Claude Design SDD process.

D40 puts the hint "⌥-click or drag to add · right-click › Add to message · ⌫ removes the last chip" in the terminal header's tooltip.

## The sprints

Each is one concept with its own card.

1. **Never refuse.** The server reads attachments by the rules above: any text, the 256 KB budget, reference-only lines for large, binary, image, audio, video and missing files, and folder listings. Files: `server.py`. Test: a JPEG, a 3 MB file, a Latin-1 file, a UTF-16 file and a deleted file each go with the message.
2. **The sent message shows its chips, in order.** The transcript draws a user message's attachments. The echo is matched by identity, and a refused echo keeps its warning under it. Files: `session_controller.ts`, the transcript row.
3. **Selections.** An editor selection becomes a chip, whole lines or inside lines, with the buffer's text as shown. Sources: right-click › Add to message and a key. Files: `Centre.tsx`, `input_bar.ts`, `server.py` (a selection's text from the page).
4. **Drag and right-click everywhere in the editor.** The tree, tabs and search results gain drag and right-click; the terminal header gains the hint tooltip.
5. **Events from the meta pane.** Right-click › Add to message on an event.

Images by region, media by time range, design elements and planning items come with their views.

## Sources

- Claude Code, "Common workflows" (code.claude.com/docs/en/common-workflows): @ includes a file "when it fits the Read tool's token limit, 25,000 tokens by default. A text file larger than 256KB isn't included"; "Directory references show file listings, not contents"; with `CLAUDE_CODE_DISABLE_FILE_MENTIONS`, "Claude then receives the paths you referenced with a note to read them using its file tools"; images by drag and drop, paste, or a path.
- VS Code, "Add context to chat" (code.visualstudio.com/docs/copilot/chat/copilot-chat-context): files and folders dragged "from the Explorer view, Search view, or editor tabs onto the Chat view"; "Add Context" for files and symbols; images through vision; "The attachments are preserved in a draft and included when you send the request."
- Cursor, "@ mentions and context" (cursor.com/help/customization/context): files and folders, terminals, chats, git diffs, browser; "Type @ multiple times to attach several files, folders, or other context items." Not stated there: large files, images, how sent attachments show.
- ripgrep's guide (github.com/BurntSushi/ripgrep/blob/master/GUIDE.md): "ripgrep considers any file with a NUL byte to be binary."
