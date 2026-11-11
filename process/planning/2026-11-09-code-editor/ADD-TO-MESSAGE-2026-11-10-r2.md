# Add to the message (round 2)

*2026-11-10. Replaces `ADD-TO-MESSAGE-2026-11-10.md`, which restated D94 and three documentation pages without asking how an attachment reaches a model. This round starts from that question. Events from the meta pane are out of scope (the Architect, 2026-11-10). Sources are listed at the end; what no source settled is marked as a decision.*

## What the feature is for

You point at things while you work, then ask about them: a file, a folder, a few lines, an image. Pointing has to give the model three things:

1. **What you pointed at.** The path and, for a selection, the range. The model needs this in every case. It costs a few tokens and never goes stale.
2. **What it contains, when the model cannot get that itself.** A selection's exact text, and anything with unsaved edits, exist only in the editor. A file on disk the model can read with its own tools.
3. **A record of what was sent.** The session's record keeps the message with its attachments, so anyone reading the session later sees what the model saw.

So the reference is the attachment, and content is a convenience on top of it. Content is sent only where it gives the model something it could not fetch, or saves a tool call at a cost worth paying. The prototype got this backwards: it treated content as the attachment, and refused the message when the content would not come.

## Where a message goes: the facts

Substrate sends a message to a model by one of two paths. Each fixes what an attachment can be.

**The kernel's own loop** (models through Ollama, such as the roster's default `kimi-k2.7-code:cloud`):
- The prompt is text. No responder in `adapters/models.py` sends images.
- **Every turn rebuilds the prompt from the whole record.** `transcript.py` writes each earlier message again with `attachment_lines`: `[attached <kind> <label>]`, the text, `[end attached]`. Content inlined into one message is therefore sent again on every later turn, until the history window drops that turn. The window is priced at four characters a token (`_est_tokens`), so a 256 KB attachment costs about 64,000 tokens on every turn it stays in view.
- The model's `read_file` tool opens files with `path.read_text(encoding="utf-8")` (`topologies/tool_loop/tools.py`). A file in any other encoding fails even when the model is handed its path.

**The coding harnesses** (Claude Code, Codex, Cursor, run as CLIs by `CliResponder`):
- The whole prompt, history included, is one command-line argument, and stdin is closed. The system caps arguments and environment together at 1,048,576 bytes here (`getconf ARG_MAX`). Inlined content counts against that cap on every turn it stays in history. Past it, the harness does not start.
- The harness reads files itself. Claude Code's Read tool opens text in pages (25,000 tokens a call; a whole file only up to 256 KB). It sees PNG, JPEG, GIF and WebP images, reads PDFs (in page ranges past 10 pages), and refuses binary types such as `.xlsx` and `.zip`. Codex takes images on its command line (`codex exec -i <path>`, repeatable). For Cursor's CLI, no source read here said.

**What the models take:**
- **Claude:** JPEG, PNG, GIF and WebP, up to 8000×8000 px, costing ⌈w/28⌉×⌈h/28⌉ visual tokens; up to 600 images and 128 MB a request. PDFs go as document blocks, up to 600 pages, at 1,500–3,000 tokens a page.
- **Ollama:** multimodal models take base64 images in an `images` field. Others take text only.

## The rules that follow

1. **The reference always goes.** Every attachment carries its workspace path, plus its range for a selection. The chip's label is how you see it; the reference is what the model gets.
2. **A message is never refused for what it carries.** An attachment that cannot go as content goes as its reference, with one line saying why, for example `(not inlined: 3.2 MB audio, media/1979.m4a; read it with your file tools)`. This is Claude Code's own rule: a mentioned file its Read tool refuses reaches the model as its path, not its contents. The only refusals left are real errors: a path outside the session's workspace, or a request the server cannot parse.
3. **Any text is text.** A file with no NUL byte in its first 8 KB is text (ripgrep's rule). It decodes as UTF-8; with a UTF-16 byte-order mark, as UTF-16; otherwise byte for byte as Latin-1, so every text file reads. A file with a NUL byte is binary: its reference goes, and its content never does.
4. **Inline only what is small, because inlined content is paid again every turn.**
   - **A file:** inlined up to 64 KB, about 16,000 tokens, under Claude Code's per-read 25,000; over that, its reference with its size and line count.
   - **A message:** at most 256 KB of inlined content, a quarter of the harness's 1 MB argument cap. Past that, the rest go as references.

   Both numbers are the settings this round chooses, from those facts.
5. **A selection's text always goes with its range,** because it may exist only in the buffer. A selection over 64 KB from a saved file goes as its path and range. From a buffer with unsaved edits, its first 64 KB go with a line saying the rest was not sent.
6. **A folder goes as a listing:** the files the search's walk reaches (ignore files applied), up to 200, then a count of the rest. Claude Code's folder references likewise give "file listings, not contents".
7. **An image goes as its reference.** A receiver that sees images then reads it:
   - Claude Code's Read tool opens it from the path as it stands.
   - Codex can be handed it with `-i`, a change to its driver profile.
   - The kernel's loop cannot until a responder sends images (a kernel decision, below).
8. **A missing file goes as its reference,** with the line `(not found when the message was sent)`.
9. **Content is resolved when the message is sent,** and the record keeps it, as the kernel's `Attachment.text` already does. A selection's text comes from the page, the buffer as shown. A file's comes from the disk.

## What you see

- **In the input bar (built):** the chip's label, its path on hover, × and ⌫ to remove it.
- **On the sent message:** the message in the transcript shows its chips beside its text, the same labels, path on hover. A chip sent by reference carries a mark saying so, with its reason on hover.
- **Order:**
  - the page's echo of a message is replaced by the record's message by identity, not by text;
  - a real error leaves the draft and its chips in the bar, and the warning sits under that message.

## Selections

D94 names "cart.ts 85–89". Claude Code's editor integration inserts `@app.ts#5-10` for the current selection with ⌥K, and drops it from context with an × beside the line count. It also sends the selection automatically unless that setting is off.

- **Lines:** a selection of whole lines is a chip "cart.ts 85–89".
- **Inside lines:** a selection inside one line is "cart.ts 85:4–20". Across lines, "cart.ts 85:4–89:12".
- **Sources:** ⌥K, after Claude Code, with the code focused; and right-click › Add to message.
- **The text:** what the buffer shows, unsaved edits included (rule 5).
- **Not sent automatically:** D94 adds things by choice, so a selection becomes a chip only when you add it.

## The prototype's faults, explained

1. **The refusals** came from `server.py` `_attachment_file_text` (sprint 388). It raises on a file over 2 MB and on a file that is not UTF-8, and either refuses the turn. That breaks rules 2 and 3.
2. **The lost chips:** the transcript draws a user message's text only.
3. **The order** came from `session_controller.ts`. A refused turn's echo stays, unconfirmed. When a later message with the same text is accepted, the code finds its echo by text with `findIndex`, which takes the first match: the refused one's echo. It moves that echo to the end, and the refusal's warning row is left stranded above. Seen: "what is that", refused, refused, "what is this", "what is this".
4. **No selections:** only files and folders had a source.

## Decisions for the Architect

- **The kernel's `read_file` reads only UTF-8.** Making it follow rule 3 is a kernel change, which the editor work has kept away from since 2026-11-09. Without it, the kernel's models cannot open a non-UTF-8 text file even from its path.
- **The kernel's responders send no images.** Sending them to multimodal Ollama models is kernel work too.
- **Files from outside the workspace,** dragged in from Finder: the server refuses paths outside the session's workspace, and the kernel's tools are rooted in it. Accepting them means either copying them in or widening the roots.
- **A pasted image** has no file. Keeping one means writing it somewhere: into the workspace, or into the session's record.

## The sprints

Each is one concept with its own card.

1. **Never refuse.** The server applies rules 2–8: any text, the per-file and per-message caps, reference lines, folder listings, missing files. Test: a JPEG, a 3 MB file, a Latin-1 file, a UTF-16 file, a deleted file and a folder each go with the message, and none refuses it.
2. **The sent message shows its chips, in order.** The transcript draws attachments, with the by-reference mark. The echo is matched by identity, and a refused message keeps its warning under it and its chips in the bar.
3. **Selections:** ⌥K and right-click › Add to message; lines and in-line ranges; the buffer's text.
4. **Drag and right-click in the editor:** the tree, the tabs and the search results; the terminal header's hint tooltip (D40).
5. **Images to the receivers that see them:** Codex's `-i` in its driver profile. Claude Code's Read already opens a path. The kernel waits on the decision above.

## Sources

- Claude Code:
  - "Common workflows" (code.claude.com/docs/en/common-workflows): @ includes a file "when it fits the Read tool's token limit, 25,000 tokens by default. A text file larger than 256KB isn't included"; "Directory references show file listings, not contents".
  - "Tools reference", Read tool behavior (code.claude.com/docs/en/tools-reference): images "returned as visual content", PDFs in page ranges, binary extensions refused, and "If you @-mention a file that Read refuses, Claude receives the file's path but not its contents."
  - "VS Code" (code.claude.com/docs/en/vs-code): automatic selection context; ⌥K inserts "@app.ts#5-10"; × drops an attachment.
  - "Run Claude Code programmatically" (code.claude.com/docs/en/headless): piped stdin capped at 10 MB; "write the content to a file and reference the file path in your prompt instead".
- Claude API:
  - "Vision" (platform.claude.com/docs/en/build-with-claude/vision): formats, 8000×8000 px, ⌈w/28⌉×⌈h/28⌉ visual tokens, 600 images, 128 MB.
  - "PDF support" (platform.claude.com/docs/en/build-with-claude/pdf-support): 600 pages, 1,500–3,000 tokens a page.
- Codex CLI reference (developers.openai.com/codex/cli/reference, via search): `codex exec --image`/`-i`, repeatable.
- Ollama API (github.com/ollama/ollama/blob/main/docs/api.md): `images`, base64, for multimodal models.
- VS Code, "Add context to chat" (code.visualstudio.com/docs/copilot/chat/copilot-chat-context): drag from the Explorer, Search and tabs; attachments kept in the draft and sent with the request.
- ripgrep guide: "ripgrep considers any file with a NUL byte to be binary."
- This repository and the kernel: `server.py` `_attachment_file_text`, `_resolve_attachments`; `session_controller.ts` (the echo); `substrate/topologies/session/transcript.py` `attachment_lines`, `_render_turns`, `_est_tokens`; `substrate/topologies/tool_loop/tools.py` `_read_file`; `substrate/adapters/models.py` `CliResponder._argv`; `getconf ARG_MAX` on this machine.
