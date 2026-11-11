# Add to the message (round 3)

*2026-11-10. Round 2 after an editing pass: the same facts, rules, decisions and sprints, in plainer prose. Round 1 restated D94 and three documentation pages without asking how an attachment reaches a model; round 2 started from that question. Events from the meta pane are out of scope (the Architect, 2026-11-10). Sources are listed at the end; what no source settled is marked as a decision.*

## What the feature is for

You point at a file, a folder, a few lines or an image, then ask about it. The pointing has to carry three things.

First, what you pointed at: the path, and for a selection the range. The model needs it every time, it costs a few tokens, and it never goes stale.

Second, what the thing contains, but only when the model cannot get that itself. A selection's exact text exists only in the editor. So does anything with unsaved edits. A file on disk the model can read with its own tools.

Third, a record of what was sent. The session's record keeps the message with its attachments, so a later reader sees what the model saw.

The reference is the attachment; content rides on it when the model could not fetch it, or when it is small enough to save a tool call. The prototype had this backwards. It treated content as the attachment and refused the message when the content would not come.

## Where a message goes

Substrate reaches a model by one of two paths, and each limits what an attachment can be.

The kernel's own loop serves models through Ollama, among them the roster's default, `kimi-k2.7-code:cloud`. Its prompt is text: no responder in `adapters/models.py` sends images. It rebuilds that prompt from the whole record on every turn, and `transcript.py` writes each earlier message again with `attachment_lines`: `[attached <kind> <label>]`, the text, `[end attached]`. Content inlined into one message is therefore sent again on every later turn until the history window drops that turn. The window prices text at four characters a token (`_est_tokens`), so a 256 KB attachment costs about 64,000 tokens on each turn it stays in view. The model's `read_file` tool opens files with `path.read_text(encoding="utf-8")` (`topologies/tool_loop/tools.py`), so a file in any other encoding fails even when the model is handed its path.

The coding harnesses (Claude Code, Codex, Cursor) run as CLIs under `CliResponder`. The whole prompt, history included, goes as one command-line argument with stdin closed. On this machine arguments and environment together are capped at 1,048,576 bytes (`getconf ARG_MAX`), and inlined content counts against that cap on every turn it stays in history. Past the cap the harness does not start. Each harness reads files itself. Claude Code's Read tool returns text in pages of up to 25,000 tokens and a whole file only up to 256 KB; it sees PNG, JPEG, GIF and WebP images, reads PDFs in page ranges past 10 pages, and refuses binary types such as `.xlsx` and `.zip`. Codex takes images on its command line, `codex exec -i <path>`, repeatable. For Cursor's CLI, no source read here said.

The models set the outer limits. Claude takes JPEG, PNG, GIF and WebP up to 8000×8000 px, at ⌈w/28⌉×⌈h/28⌉ visual tokens an image, with up to 600 images and 128 MB in a request; it reads PDFs as document blocks, up to 600 pages at 1,500–3,000 tokens a page. Ollama's multimodal models take base64 images in an `images` field. Its other models take text only.

## The rules

1. Every attachment carries its workspace path, and a selection its range. The chip's label is what you see; the reference is what the model gets.
2. A message is never refused for what it carries. An attachment that cannot go as content goes as its reference, with one line saying why: `(not inlined: 3.2 MB audio, media/1979.m4a; read it with your file tools)`. Claude Code does the same: a mentioned file its Read tool refuses reaches Claude as the path without the contents. Two refusals remain, both real errors: a path outside the session's workspace, and a request the server cannot parse.
3. Any text is text. A file with no NUL byte in its first 8 KB is text, ripgrep's test. It decodes as UTF-8, or as UTF-16 when it starts with a byte-order mark, or else byte for byte as Latin-1, which reads every text file. A file with a NUL byte is binary, and only its reference goes.
4. Inline little, because inlined content is paid again every turn. A file goes inline up to 64 KB, about 16,000 tokens and under Claude Code's 25,000 a read. A message carries at most 256 KB of inline content, a quarter of the harnesses' 1 MB argument cap. Past either, the reference goes with the size and line count. This round chose both numbers from the facts above.
5. A selection's text always goes with its range, because it may exist only in the buffer. Over 64 KB, a selection from a saved file goes as path and range; one from a buffer with unsaved edits sends its first 64 KB and a line saying the rest stayed behind.
6. A folder goes as a listing of the files the search's walk reaches, ignore files applied: up to 200, then a count of the rest. Claude Code's folder references give "file listings, not contents" too.
7. An image goes as its reference. Claude Code's Read opens it from the path today. Codex can be handed it with `-i`, a change to its driver profile. The kernel's loop cannot see it until a responder sends images, which is a kernel decision below.
8. A missing file goes as its reference, with the line `(not found when the message was sent)`.
9. Content is read when the message is sent, and the record keeps it, as the kernel's `Attachment.text` already does. A selection's text comes from the page, the buffer as shown; a file's comes from the disk.

## What you see

The input bar shows each chip's label, its path on hover, and × and ⌫ to remove it. Sprint 443 built that.

The sent message in the transcript shows its chips beside its text, with the same labels and the path on hover. A chip that went by reference is marked, and its reason shows on hover.

The page's echo of a message is replaced by the record's copy by identity, not by text. A real error leaves the draft and its chips in the bar, and the warning sits under that message.

## Selections

D94 names "cart.ts 85–89". Claude Code's editor integration inserts `@app.ts#5-10` for the current selection with ⌥K, drops it with an × beside the line count, and sends the selection on its own unless a setting turns that off.

Here, a selection of whole lines makes the chip "cart.ts 85–89". One inside a line makes "cart.ts 85:4–20", and one across lines "cart.ts 85:4–89:12". ⌥K adds it, after Claude Code, with the code focused; so does right-click › Add to message. The chip carries the text the buffer shows, unsaved edits included (rule 5). Nothing goes on its own: D94 adds things by choice.

## The prototype's faults

The refusals came from `server.py` `_attachment_file_text`, written in sprint 388. It raises on a file over 2 MB and on a file that is not UTF-8, and either one refuses the turn. Rules 2 and 3 replace it.

The chips vanished from sent messages because the transcript draws a user message's text and nothing else.

The rows went out of order in `session_controller.ts`. A refused turn's echo stays in the transcript, unconfirmed. When a later message with the same text is accepted, the code looks for its echo by text with `findIndex`, takes the first match, the refused one, and moves it to the end. The refusal's warning row stays where it was. You saw "what is that", refused, refused, "what is this", "what is this".

Selections had no source. Only files and folders did.

## Decisions for the Architect

- **The kernel's `read_file` reads only UTF-8.** Rule 3 there is a kernel change, and the editor work has stayed out of the kernel since 2026-11-09. Without it, the kernel's models cannot open a non-UTF-8 text file even from its path.
- **The kernel's responders send no images.** Sending them to multimodal Ollama models is kernel work as well.
- **Files dragged in from Finder, from outside the workspace.** The server refuses paths outside the session's workspace, and the kernel's tools are rooted in it. Taking them means copying them in or widening the roots.
- **A pasted image has no file.** Keeping it means writing it somewhere: the workspace, or the session's record.

## The sprints

Each is one concept with its own card.

1. Never refuse. The server applies rules 2 to 8. Its test sends a JPEG, a 3 MB file, a Latin-1 file, a UTF-16 file, a deleted file and a folder, and every message goes.
2. The sent message shows its chips, in order: the transcript draws attachments with the by-reference mark; the echo is matched by identity; a refused message keeps its warning under it and its chips in the bar.
3. Selections: ⌥K and right-click › Add to message, lines and in-line ranges, the buffer's text.
4. Drag and right-click in the editor, from the tree, the tabs and the search results, and the terminal header's hint tooltip (D40).
5. Images to the receivers that see them. Codex gets `-i` in its driver profile; Claude Code's Read already opens a path; the kernel waits on the decision above.

## Sources

- Claude Code:
  - "Common workflows" (code.claude.com/docs/en/common-workflows): @ includes a file "when it fits the Read tool's token limit, 25,000 tokens by default. A text file larger than 256KB isn't included"; "Directory references show file listings, not contents".
  - "Tools reference", Read tool behavior (code.claude.com/docs/en/tools-reference): images "returned as visual content", PDFs in page ranges, binary extensions refused; "If you @-mention a file that Read refuses, Claude receives the file's path but not its contents."
  - "VS Code" (code.claude.com/docs/en/vs-code): automatic selection context; ⌥K inserts "@app.ts#5-10"; × drops an attachment.
  - "Run Claude Code programmatically" (code.claude.com/docs/en/headless): piped stdin capped at 10 MB; "write the content to a file and reference the file path in your prompt instead".
- Claude API:
  - "Vision" (platform.claude.com/docs/en/build-with-claude/vision): formats, 8000×8000 px, ⌈w/28⌉×⌈h/28⌉ visual tokens, 600 images, 128 MB.
  - "PDF support" (platform.claude.com/docs/en/build-with-claude/pdf-support): 600 pages, 1,500–3,000 tokens a page.
- Codex CLI reference (developers.openai.com/codex/cli/reference, through search): `codex exec --image`/`-i`, repeatable.
- Ollama API (github.com/ollama/ollama/blob/main/docs/api.md): `images`, base64, for multimodal models.
- VS Code, "Add context to chat" (code.visualstudio.com/docs/copilot/chat/copilot-chat-context): drag from the Explorer, Search and tabs; attachments kept in the draft and sent with the request.
- ripgrep's guide: "ripgrep considers any file with a NUL byte to be binary."
- This repository and the kernel: `server.py` `_attachment_file_text`, `_resolve_attachments`; `session_controller.ts`, the echo; `substrate/topologies/session/transcript.py` `attachment_lines`, `_render_turns`, `_est_tokens`; `substrate/topologies/tool_loop/tools.py` `_read_file`; `substrate/adapters/models.py` `CliResponder._argv`; `getconf ARG_MAX` on this machine.
