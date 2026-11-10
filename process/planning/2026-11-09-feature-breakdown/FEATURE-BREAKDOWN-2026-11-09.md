# Feature breakdown — from the design spec to separate projects

*2026-11-09. Replaces the approach in `2026-11-05-editor-shared-work/`, which front-loaded shared infrastructure across all editor modes. Each feature below becomes its own project with its own plan, traced to design spec sections and decisions. No project builds groundwork for a later project.*

*Source: `design/received/handoff 5/docs/DESIGN-SPEC -2026-11-04- r6.md`, `DESIGN-DECISIONS -through 2026-11-04-.md`, `EDITOR-INSPECTOR-PLAN-RATIONALE -2026-11-04-.md`.*

---

## The rule

One project per feature. Each project's plan names the design spec sections and decisions it implements, lists its work items, and closes when its tags fire in the packaged app. Shared infrastructure (the inspector spine, the column layout, add-to-message) is built inside the first project that needs it, and subsequent projects inherit what exists. A later project never appears as a line item in an earlier project's plan.

---

## The document sequence

Each project follows the planning sequence from D89. The documents live in the project's folder under `process/planning/<date>-<name>/` and are written in order:

1. **ROADMAP** — prose: why this project, what it delivers, what is out of scope, preconditions, technical decisions, order of work, risks. The roadmap is approved before the next step.
2. **REQUIREMENTS** — numbered items traced to design spec sections and decisions. Each names its type (functional, non-functional, constraint), its source, and what the code does today.
3. **BREAKDOWN** — work breakdown structure: work items grouped by area, each naming its files, the requirements it meets, and what it depends on. Estimates in story points (1, 2, 3, 5, 8; anything above 5 is split or justified).
4. **Sprint cards** — one per work item, ≤2 files, one concept, with scope, context files, and its contracts (signal, artifact, observation). Written one at a time, each before its sprint runs.

The board (execution by status) is the project's sprint cards read by their frontmatter status. No separate board document.

---

## The projects

### 1. Code editor

**Status:** planned — `2026-11-09-code-editor/PLAN-2026-11-09-code-editor.md`, 12 items.

**Design source:** spec §4 (editor view), §5 "Code", §5.0 (common inspector spine), §5.1 (left column and configurations), §8 (keyboard map). Decisions D51, D53, D63, D81, D82, D85, D86, D92, D93, D94.

**What it builds that later projects inherit:** the editor view layout (three columns + bottom panel), the inspector spine (ACTIVITY / HISTORY / INFO as the common tail, collapsible sections), the column configuration machinery (collapse to rail, dock position, side swap, remembered widths), quick open ⌘P, workspace search ⌘⇧F, add-to-message for files and line ranges, the "editor follows the session" pattern (D93).

---

### 2. Documents

**Design source:** spec §5 "Documents", §5.0 (inspector spine — inherited). Decisions D52 (write mode: rendered by default, markdown underneath, one toggle to source), D82 (inspector sections: outline, paragraph styles, selection formatting, document), D85 (sections drawn open).

**Scope:** the documents mode in the editor's centre pane. Opens when a markdown file is selected. Rendered editing by default (direct inline, the Google-Docs feel from D52), source toggle, the document inspector sections. Add-to-message extends to document selections. The session edits documents through existing write_file/edit_file tools; the inspector's Activity and History show those edits attributed.

**Depends on:** project 1 (the editor view, inspector spine, column layout).

---

### 3. Plain shell

**Design source:** spec §5 "Plain shell". Decisions D49 (⌘⇧T opens a shell tab, rooted at workspace, configurable), D59 (a pane can be just the user's shell — minimal header with shell name + cwd, "no record", no session, no logo dot).

**Scope:** a commodity OS shell as a tab in the editor view. No session, no record, no inspector (the right column follows the editor's file per D82). The header reads the shell name and cwd. Rooted at the session's workspace.

**Depends on:** project 1 (the editor view's tab mechanism).

---

### 4. Images

**Design source:** spec §5 "Images". Decisions D50 (crop, resize, annotate, convert, analyze, "ask the session about this image"), D59 (tools as overlays — dimmed surround, handles, docked action bar above), D82 (inspector: tools, adjust, info, history, activity), D83 (real renders), D85 (sections drawn open), D92 (tool parity: bash with magick), D93 (the image redraws when the command finishes), D94 (add-to-message: the file or a region).

**Scope:** the images mode in the editor's centre pane. Opens when an image file is selected. Viewing, plus the tool set: crop, resize, annotate, convert (png/jpg/webp), analyze (histogram, channels, EXIF). Each tool is an overlay on the viewer (D59's pattern: dimmed surround, handles, thirds grid for crop, docked action bar). The session does the same through bash + ImageMagick; every tool call lands in Activity. Add-to-message extends to image files and regions.

**Depends on:** project 1 (the editor view, inspector spine). Introduces the tool-overlay pattern that video and audio reuse.

---

### 5. Video

**Design source:** spec §5 "Video". Decisions D50 (timeline with in/out handles, split-at-playhead, cut list, export via ffmpeg), D54 (bimodal: manual + session tools; the cut list attributes every edit to its author), D58 (single-file; segments renameable), D59 (tools as overlays), D82 (inspector: clip, edits with authors, export, activity, info), D92 (tool parity: bash with ffprobe/ffmpeg — probe, cut, trim, concat, export), D93 (cuts appear on the timeline when the command finishes), D94 (add-to-message: the file or a time range).

**Scope:** the video mode. Opens when a video file is selected. Transport (play, pause, scrub), a timeline with segments, split at playhead, trim handles, ripple delete, reorder, mute, speed, snap, linked audio track, fades, export. Every edit attributed ("by hand" or "by the session · seq N"). The session operates through ffmpeg tools. Add-to-message extends to the file and time ranges.

**Depends on:** project 1 (the editor view, inspector spine). Shares the tool-overlay pattern from project 4 if built after it.

---

### 6. Audio

**Design source:** spec §5 "Audio". Decisions D58 (single-file; mixing pulled back to exploration — no tracks, no routing), D82 (inspector: selection, effects chain from scanned AU/VST plugins, file loudness, activity, history), D83 (waveform drawn from samples: per-column min/max peaks with RMS core, symmetric about zero), D92 (tool parity: bash with ffmpeg — probe, mix, eq, compress, loudnorm, export), D93 (the waveform updates on command finish), D94 (add-to-message: the file or a time range).

**Scope:** the audio mode. Opens when an audio file is selected. Waveform display (real samples, per D83), split, trim, fade, gain, normalize, denoise, plus simple insert-style effects with plugins scanned from the machine (AU/VST). File loudness in the inspector (LUFS). No mixer, no tracks (D58). The session operates through ffmpeg tools. Add-to-message extends to the file and time ranges.

**Depends on:** project 1 (the editor view, inspector spine). The waveform and timeline share structural patterns with video.

---

### 7. Plan surface

**Design source:** spec §6.1 (plan surface). Decisions D84 (the plan as a surface), D87 (card/title/summary columns), D88 (no blackboard or diary views — those open in the editor), D89 (the standard planning sequence: roadmap → requirements → breakdown → estimates → sprints → board).

**Scope:** ⌘4 opens the plan surface. A lens over the repo's `planning/<plan>/` files: roadmaps as prose, cards by status on the board, card inspector with frontmatter and the sprint-card checklist. The session drafts roadmaps and cards as files. Board columns are the repo's real statuses. The substrate terminal is present (D90 — the prompt is primary everywhere). Jira as a one-way mirror with proposals back (D89 §5.4).

**Depends on:** project 1 built the ⌘⇧E view-switching pattern. Plan surface uses the same pattern (⌘4, same key or esc returns to pane). No dependency on the media modes.

---

### 8. Design

**Design source:** spec §5 "Design". Decisions D71 (chat left third, canvas right two-thirds; flat design sheets as live HTML/CSS on a pannable/zoomable canvas; id badges referenceable in chat; file/zoom/browse-comment-edit mode switch; comment pins attach to elements and travel with the next message; edit mode is direct manipulation of HTML/CSS), D82 (inspector: element, type, box, comments, activity, history, info), D92 (the session writes sheets via write_file), D94 (add-to-message: an element — the comment pin is the same mechanism).

**Scope:** the design mode. The most speculative mode (D71 is explicitly speculative). Chat on the left, a pannable/zoomable canvas on the right displaying design sheets as live HTML/CSS. Comment pins, element selection, direct-manipulation editing. The session writes and edits sheets through ordinary tool calls. Add-to-message extends to elements.

**Depends on:** project 1 (the editor view, inspector spine). This mode introduces the most new infrastructure (the canvas, the pan/zoom, the browse/comment/edit mode switch) and carries the most design risk.

---

### 9. Collection and state restore

**Design source:** spec §3.5 (the collection). Decisions D57 (the collection: every window, each window's pane grid, which session is bound to each pane, each pane's view, lens choices, collapsed states, focus), D66 (app-state store: SQLite), D68 (collections are ephemeral: membership is automatic; quit-and-relaunch restores the collection exactly as last seen).

**Scope:** persistence of the full UI configuration across quit and relaunch. SQLite stores the collection. Relaunch rebinds panes to their sessions (sessions are durable objects on disk). No save/browse dialog (D68 — collections are ephemeral). This is the meta-level: it wraps whatever views exist at the time it ships.

**Depends on:** the pane/window system. Independent of the editor modes. Can be built at any point after the pane mechanics are stable.

---

### 10. Display emulation and skins

**Design source:** Decisions D95 (display emulation and skins: scanlines, aperture-grille mask, vignette, glass, phosphor glow, curved-tube corners; monitor emulation as presets with shared parameters; skins as folders: skin.json + textures/ + shaders/; the skin editor; tool parity), D96 (three families: CRT, film stocks, modern panels), D97 (display models computed from published data; geometry only on CRTs), D98 (image fills on any surface token).

**Scope:** the cosmetic rendering layer. Default look is the app on a subtle CRT (D95). Presets from flat panel through Trinitron, consumer CRT, broadcast monitor, monochrome, film stocks, QD-OLED, mini-LED, e-ink. Skins as folders with palette tokens, type, metrics, textures, display preset, optional shader. The skin editor (substrate inside substrate: a live copy, click to select a token, the inspector shows the colour and contrast checks). Image fills on surface tokens (D98).

**Depends on:** nothing mode-specific. A rendering layer over the whole app. Ships whenever the base UI is stable enough to skin.

---

## Build order

The table states the recommended sequence. Projects with no dependency between them (marked ‖) can run in parallel if capacity allows.

| Order | Project | Why here |
|---|---|---|
| 1 | Code editor | Builds the editor view infrastructure every mode inherits. Already planned. |
| 2 | Documents | Closest to the code editor — same text infrastructure, adds rendered editing. |
| 3 | Plain shell | Simplest mode. High daily-driver value (the "enough that nobody flees to iTerm" bar). |
| 4 | Images | Introduces the tool-overlay pattern. Moderate complexity. |
| 5 | Video | Timeline + ffmpeg. Builds on the tool-overlay pattern. |
| 6 | Audio | Waveform + effects + ffmpeg. Same shape as video. |
| 7 ‖ | Plan surface | Independent axis — reads process files, no dependency on media modes. Can move earlier. |
| 8 | Design | Most speculative. Most new infrastructure (canvas, pan/zoom, mode switch). Last of the editor modes. |
| 9 ‖ | Collection / state restore | Meta-level. Wraps whatever exists. Independent of modes. |
| 10 ‖ | Display emulation / skins | Cosmetic layer. Independent. Ships when the base UI is stable. |

Projects 7, 9, and 10 have no dependency on the media modes (4–6, 8) and can slot in wherever they deliver the most value. The plan surface in particular could move to position 4 if managing the work through the app matters sooner than editing images.

---

## What is NOT a separate project

These are distributed across the projects that use them, not front-loaded:

- **The common inspector spine** (ACTIVITY / HISTORY / INFO, collapsible sections) — built in project 1, inherited by all.
- **Column configurations** (collapse, dock, swap, widths) — built in project 1, inherited by all.
- **Add-to-message** — the framework (chips in the input bar) is built in project 1; each mode extends it for its own content types within its own project.
- **Tool parity** (D92: everything by hand has a tool behind it) — verified per mode within each mode's project.
- **"The editor follows the session"** (D93: tool events move the view live) — the pattern is built in project 1; each mode implements it for its own file type.

---

## Open items from `OPEN-ITEMS-2026-10-10.md` that belong in a project

| Open item | Project |
|---|---|
| #19 child runs / depth view | Already designed (D70–D72, D38, D41). Delegation visibility is part of the pane/reveal, not the editor modes. Separate project if built. |
| #25 ⌘T terminal tab | Project 3 (plain shell). |
| #29 multi-session windows | Pane mechanics, not an editor mode. Separate project. |
| #31–35 (open from spec) | Each belongs to the project whose mode it touches, or to a new project if it spans modes. |

Items already closed or deferred in OPEN-ITEMS stay as they are.
