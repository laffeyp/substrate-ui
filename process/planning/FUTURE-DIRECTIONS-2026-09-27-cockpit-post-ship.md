# Future directions — cockpit, post-ship

*2026-09-27. Peter's dictated notes, captured during the Sprint 087c CLI-version work. Everything below is post-packaging work: nothing here blocks the current ship, and nothing here is a sprint yet. Each thread becomes a card when the current wave lands.*

---

## 1. Studio rewrite — from freeform typing to a topology viewer

The current Studio surface is a relic. It presents free text inputs for topology name, producer names, and other fields the user cannot actually change in a meaningful way. It looks composeable and is not.

Direction:

- **Topology name is a dropdown**, populated from the existing topology catalog (whatever `/api/topologies` returns). No typing.
- Once a topology is picked, Studio **displays the topology's shape** — producers, views, routes, terminations — as read-only structured info. It is a form-of-a-structure display, not an editor.
- Only fields the user can meaningfully change stay editable. Everything else is display.
- **Remove every mention of `deterministic`** from Studio's text, defaults, and the model picker. The reveal-shell driver picker is where deterministic still lives (harness pin).
- The Studio model picker is a hardcoded `LLAMA 3.2` string today. Wire it to the same driver picker the terminal uses — the sectioned CLI + Ollama roster with per-CLI version tree (Sprint 087c).
- **Build + Launch attaches to the calling session.** Today, a Studio build-and-launch runs somewhere else — no context back to the session that spawned it. Instead, the session that opened Studio owns the resulting run. The session that clicked "build + launch" then behaves as if the model in that session had asked to run the same topology directly.
- **Ship gate:** if the rewrite is not ready when the packaging window closes, hide the Studio button entirely for the first release. Better a smaller surface than a misleading one.

## 2. Records surface — arrow-key navigation

Records already renders as a scrollable list of workspaces, each expandable into its sessions. Add keyboard control:

- Up / Down moves the selection across workspace rows.
- Enter on a workspace row **opens** it (expands the sessions list).
- Once inside an opened workspace, Up / Down moves across its sessions, Enter **attaches** to that session.
- Escape collapses the current level.

## 3. Workspace picker (per-pane) — immediate arrow-key control + autocomplete

Two issues, both about the picker that appears when a pane is unbound.

- **Arrow keys should work without clicking into the text box.** When the workspace picker is showing (pane is opening), Up / Down navigates the row list immediately — no focus dance required. The pane being in "picker" mode is the signal.
- **Text-box autocomplete against the real filesystem.** Today the input says "type a path"; a typed path has no completion. Add tab or inline completion of directories under the current prefix.
- **Drop the "fills nearest recent" language and its glyph.** Nothing on the server implements it. Placeholder shrinks to: *"type a path · ↑↓ picks · ↵ binds"*.

## 4. Every existing topology, session-runnable and correct

After the ship lands, sweep every topology in the substrate catalog and verify:

- It runs correctly under the session topology (opens, produces, terminates cleanly).
- It emits the envelopes the reveal-shell views expect.
- It respects the observation contract — behaviour tests hit it end-to-end.

Then design the software-engineering topologies proper. The list of correct SWE topologies lives elsewhere in the process notes; that list drives the second wave.

## 5. Long-term — the terminal pane as ultimate topology viewer

The end state is that a session pane can spin up other topologies and each one opens as its own pane, with a topology-appropriate viewer on the left half. Concretely:

- In a session, the model (or the user in the prompt) asks: *build me a pair-coding topology with adversarial review at each stage, run it on X.*
- The session spins up that topology. A **new pane** appears alongside the session pane, dedicated to that topology's execution.
- The new pane's **left half is the topology's own view** — pair coding renders differently from adversarial-review, which renders differently from a debate. Some topologies take no user input; some (like pair-coding-with-human) do. Custom views per topology, or per topology-shape.
- The new pane's **right half stays the standard reveal — stream, graph, IO, scene**. Every topology gets the same read surfaces on that side.
- **Control still lives in the session pane.** The new pane is primarily a viewer + optional input channel; the parent session drives orchestration. Splitting control across panes overcomplicates the model.
- Automatic vs. interactive is a per-topology switch at spawn time. Automatic pair-coding runs on its own; interactive pair-coding accepts the user as one of the participants.

The terminal-pane surface therefore evolves from "chat with one session" into "the ultimate topology viewer." Every named-topology shape gets its rendering module; the framework routes envelopes into that module by kind + payload.

## 6. Auto-mode as a session-topology switch

The autonomous-build topology under active development is, in shape, the session topology with the human loop replaced by an auto-driver. Corollary: the ordinary session topology can carry a **button that flips it into auto mode**. Same topology, same views, same records — one toggle in the header. Every session becomes optionally autonomous without duplicating the shape.

## 7. First-run demo mode

Every first-time user needs a way in. The workspace picker gets an extra top row: **Demo mode**. It stays there until the user actually picks it — never auto-dismissed, never hidden after N sessions. Sticky by design so the escape hatch is always visible.

What happens on pick: substrate loads a scripted interaction. It types a real prompt into the session's own input — something like *"What is this? What is substrate? What tools do you have?"* — and hits send. Whatever agent the user chose in the session topology answers, which means the user immediately watches the model itself explain the surface they're looking at, in the same chat box they'll use for real work. The demo is *them*, running for the first time.

After that first scripted turn lands the user drops straight into a normal session — same pane, same driver, same workspace (whatever demo mode used). No hand-off screen, no "welcome" modal.

Future refinement (research thread, not scope): per-model prompt variants. One prompt won't land equally across Claude / GPT / open-source; there's real work in figuring out the shape of an explanation prompt that works uniformly. For the first ship, one prompt is fine.

---

*These are direction, not scope. When the current shipping wave closes, they become sprint cards.*
