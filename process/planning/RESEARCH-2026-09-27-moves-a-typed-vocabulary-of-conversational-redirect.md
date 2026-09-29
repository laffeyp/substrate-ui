# Research — Moves: a typed vocabulary of conversational redirect

*Opened 2026-09-27. Companion to `RESEARCH-2026-09-25-cli-adapter-login-flow-in-substrate-v2.md` and section 6 of `FUTURE-DIRECTIONS-2026-09-27-cockpit-post-ship.md`. Scope: the "moves" construct — a named, typed vocabulary the user selects from when directing a conversation instead of typing freeform prose. Substrate-native, first-class alongside topologies.*

---

## 1. The construct in one paragraph

A **move** is a named, typed act the user performs on a conversation — not a response, a redirect. The set is small, closed, hierarchical. A top-level class opens onto a deeper class, which opens onto a specific move. The user rotates through the top classes with Up/Down, drills into one with Right, drills again with Right, and lands on a specific move. Left backs up. Freeform typing coexists — the same box takes prose, and the class list narrows to matches as characters arrive.

The picker is a small rectangle at the end of the input box. Not a modal. The user's typing stays visible while the arrow keys walk the tree. Enter commits at any level: a top-level `critique` commit is legal and means "something's wrong here, unspecified"; a leaf commit pins the exact class. Keyboard-first, for the pattern where the user knows the *kind* of move they want to make before the exact phrasing.

Every move that fires writes an envelope with its class path — `Move[critique.fallacy.motte-and-bailey]`. The transcript reads as a mixed stream of freeform turns and move-typed turns. Project the moves over the run's timeline and the argumentative shape of the conversation is legible: which classes recurred, when they clustered, which topologies attract which moves.

---

## 2. Where the idea sits in the academic literature

The construct sits at the intersection of five bodies of work. None of them alone names what the substrate build calls a "move," but each names part of it.

**Argumentation theory** — Toulmin's *The Uses of Argument* (1958) breaks an argument into claim / grounds / warrant / backing / qualifier / rebuttal. Later work by Douglas Walton (*Argumentation Schemes*, Walton, Reed, and Macagno 2008) catalogs ~65 named schemes an argument can instantiate — argument from expert opinion, argument from analogy, argument from consequences. Each scheme carries an associated set of critical questions the opposing party can press. A move-vocabulary that includes "expert opinion" as a redirect class and "critical questions on expert opinion" as its counter is a direct application. Walton's schemes are the closest existing catalog to what a move-set for critique would look like.

**Informal logic and fallacy taxonomy** — Hamblin's *Fallacies* (1970) opened the modern reassessment; Woods & Walton continued through the 1970s–90s. Named fallacies (ad hominem, straw man, appeal to authority, false dilemma, equivocation, motte-and-bailey) form a natural sub-vocabulary. A "redirect: this is a motte-and-bailey" move is a fallacy-flag with a well-defined class. Wikipedia's fallacy taxonomy pages are surprisingly comprehensive; the Internet Encyclopedia of Philosophy's `iep.utm.edu/fallacy/` page carries ~200 named classes. The naming problem — which fallacies belong in a working move-set versus which are academic — is real and unsolved.

**Speech-act theory** — Austin (*How to Do Things with Words*, 1962) and Searle (*Speech Acts*, 1969) named the fundamental illocutionary types: assertive, directive, commissive, expressive, declarative. Every conversational move maps to one of these five illocutionary categories. A move-vocabulary must at minimum distinguish "the user asserts a counter-fact" from "the user directs the model to redirect" — different speech acts with different downstream effects on the topology's next turn.

**Rhetoric** — Aristotle's *Rhetoric* names three appeal modes (logos, ethos, pathos) and inventories the stasis questions (fact / definition / quality / procedure). Perelman & Olbrechts-Tyteca's *The New Rhetoric* (1958/1969) catalogs argumentative techniques by type; Kenneth Burke's *A Grammar of Motives* (1945) introduces the pentad (act / scene / agent / agency / purpose) as a framework for naming rhetorical moves. Any move-vocabulary is a rhetorical taxonomy whether or not it acknowledges the tradition; naming the tradition lets the design borrow from a domain that has spent 2500 years refining these categories.

**Dialogue-game theory** — Charles Hamblin's dialogue games in the 1970s, Mackenzie's DC (*Dialogue Chunks*), Walton & Krabbe's *Commitment in Dialogue* (1995), and more recently the IBIS (Issue-Based Information System) family from Rittel & Kunz (1970s). Each of these formalizes conversation as a sequence of typed moves — Assert, Concede, Retract, Challenge, Withdraw, Question. A working substrate move-vocabulary is a dialogue game whose atoms are the move classes. The academic literature has already solved "how do you compose typed moves into a full argumentative exchange"; the answer is a dialogue game, and there is a mature literature.

No one has combined all four cleanly: Walton's schemes (what the model just did), a fallacy catalog (what went wrong), speech-act types (what the user is doing about it), and a dialogue-game frame (how the moves compose). A working substrate move-set has to do that combination, and hold it in a shape a human can carry.

---

## 3. Technical precedent — how similar surfaces got built

**Command palettes** — Sublime Text popularized the Ctrl-Shift-P palette (~2010); VS Code adopted the shape; Slack, Discord, Linear, Notion, and Figma all followed. The core interaction: fuzzy-match a command name from a closed set, invoke with Enter. Substrate's move wheel is the same interaction with a smaller, better-named vocabulary — the palette is optimized for many rarely-used commands; a move wheel is optimized for a handful of frequently-used ones.

**Slash commands** — Slack's `/remind`, `/topic`, `/dnd` (from ~2013). Claude Code and Cursor now ship this pattern for AI-agent invocation. The named-command surface reduces the working memory the user has to carry — instead of remembering "how do I phrase 'now expand this argument to include the alternative reading'," the user types `/expand`. The substrate move wheel is `/expand` with the words visible so the user can see all options and pick from a rotating list rather than fuzzy-matching from memory.

**Structured / projectional editors** — Lamdu (Yairchu), Hazel (Omar et al., UMich), Cursorless (Pokey Rule): programming editors where the user manipulates AST nodes directly, not text. The moves are typed operations on a typed tree. The line of thinking: freeform text is expressive but low-precision; a set of typed operations is less expressive but perfectly precise. A move vocabulary applies the projectional-editor idea to the argumentative surface: the user manipulates conversation nodes, not conversation text.

**Grammarly / Wordtune / Notion AI's "shorter, longer, professional, casual"** — commercial products that already ship a small enumerated set of transformations applied to model output. This is the shallow end of the move idea: three or four surface transformations that operate on the last reply. The substrate move-set is deeper — it operates on the *argumentative structure* of what was said, not just its length or register. But the UX precedent is directly usable; users already understand "pick a labeled transformation and let the model apply it."

**IDE quick-fix menus** — Eclipse's Ctrl-1 (mid-2000s), IntelliJ's Alt-Enter, VS Code's lightbulb. When the compiler flags a problem, the IDE offers a numbered menu of typed fixes. The move-set for a conversation with an LLM is the same idea: the user (playing the role of the compiler) flags a problem class, and the model applies the associated fix. Fallacy-flags in particular map cleanly to this shape — a move "flag: appeal to authority; redirect with the associated critical questions" is a quick-fix for argumentative bugs.

**Debate / argumentation software** — Kialo (kialo.com) organizes public debate as a typed tree of claims + pro/con branches; DebateGraph (before it wound down) modeled argument as a graph of typed nodes. Rationale (formerly Reason!Able, out of Melbourne) does the same for a classroom setting. These products cover the *tree-view of an argument* but not the *interactive redirect during a conversation*. They are the persistence layer; the substrate move-set is the input surface.

**Roam Research / Obsidian tags and block references** — outliner tools that let a user tag a thought with a type (`#question`, `#claim`, `#counter`). The tag vocabulary is enumerable and grows over use. This is the low-friction end of the move-set: an ad-hoc tag on every turn rather than a rigid selection. The tradeoff between rigid enumerated vocabulary (fewer, better-named types, more machine-usable) and freeform tagging (more expressive, less machine-usable) is a real design axis.

---

## 4. Commercial landscape

No shipping product today implements the exact construct. What ships covers pieces:

- **Grammarly / Wordtune / Notion AI** — three-to-five-item transformation menus over model output. Rewrite, shorten, lengthen. Trivial vocabulary.
- **Cursor / Claude Code / GitHub Copilot Chat** — slash-command surfaces for developer workflows. Named commands, but scoped to code operations (`/explain`, `/fix`, `/tests`), not argumentative redirect.
- **Consensus.app / Elicit / Scite** — research tools that categorize academic claims (support / contradict / mention). Server-side typed classification of prose; not user-side move-selection during a live conversation.
- **Kialo / Loomio / Pol.is** — group deliberation surfaces where users vote on claims or take typed stances. Different surface (public argument, not private LLM chat) but same underlying idea of typed conversational atoms.
- **Palantir Foundry's ontology + AIP threading (2024–2026)** — typed entities and typed workflows; the AIP chat surface accepts typed "actions" against ontology objects. Closest thing shipping in an enterprise LLM product to a typed move-set, but the moves are ontology-CRUD actions, not argumentative moves.

No public product ships "select a rhetorical redirect class from a wheel and the model responds accordingly." The design space is open.

---

## 5. Design axes for the substrate-native move-set

Several dimensions have to get chosen deliberately:

**Size of the vocabulary.** Miller's 7±2 sets a low ceiling for a wheel where the user rotates through options mentally. VS Code's palette accepts 500+ commands; that's a search surface, not a rotate surface. If the wheel is bound to Up/Down keys with no filter, ~10–20 is the working range. If it's grouped (Redirect / Expand / Contract / Reframe / Flag), each group can hold ~5–10 leaves without the user losing the tree.

**The dimension the vocabulary is organized on.** Options that have precedent:

- By *speech act* (assert, direct, commit, express, declare) — Searle's five.
- By *argumentative move* (challenge, concede, question, withdraw, retract) — Walton & Krabbe.
- By *rhetorical intent* (redirect, expand, contract, reframe, flag) — the closest fit to the substrate use case.
- By *fallacy* (motte-and-bailey, ad hominem, appeal to authority, straw man, ...) — a critique-only sub-vocabulary.
- By *scheme* (Walton's ~65) — too many for a wheel; workable for a searchable palette.

Rhetorical intent at the top level (5–7 items) fits best. Each group opens onto fallacy names for the critique branch, scheme names for the redirect branch. Two levels of typed selection.

**Composition.** Do moves stack? Can a turn carry two moves — "expand" AND "reframe as a stasis-of-definition question"? Dialogue-game theory says yes; each move is an atom, and the atoms compose into a full turn. The substrate envelope model already supports multiple envelopes per turn; carrying a `MoveApplied` envelope per move on the same turn falls out for free.

**Input surface.** The wheel is one. Others:

- Slash command with fuzzy autocomplete (`/redirect` → subclasses appear inline).
- Numbered menu on demand (`?` opens a bare list, digit selects).
- Modifier + letter chord (`Ctrl+R` redirect, `Ctrl+E` expand, `Ctrl+F` flag).
- Rotating chip at the end of the input box that cycles labels as the user types.

The wheel with Up/Down is the version described. The numbered menu (`?` opens, digit selects) is the least visual friction — no dropdown, no modal, one keystroke to open and one to pick. Both worth prototyping.

**The output side.** When a move fires, what does the topology do? Options:

- The move's *name* prepends the user's freeform continuation ("[redirect: appeal to authority] your point about the Anthropic paper glosses over…"). Model sees the name; model has been prompt-primed on what each name means.
- The move is a *typed envelope* on the record; the topology's driver reads the envelope kind and dispatches to a different prompt template ("this is a `Move[redirect.authority]` — respond by acknowledging the authority-based framing, giving the actual argument, then continuing").
- The move is a *cursor rule*: it edits the model's system prompt for the next N turns ("the user has flagged sophistical shift; be more direct").

Options one and two are compatible — the envelope carries the name AND the freeform tail, and the driver picks up either signal. Option three (persistent rule) is a separate, larger idea worth its own research thread.

---

## 6. The substrate-native angle

Two things about substrate specifically make the move construct load-bearing rather than decorative:

**Envelope stream + replay.** Every move fires an envelope. `MoveApplied(class="redirect.authority", tail="…")` is a machine-readable trace of the intervention. Freeform text loses this. Move envelopes convert user intent — invisible today — into first-class typed data on the record. Replay a run and the argumentative shape shows: which classes fired, when they clustered, where the conversation converged.

**Typed vocabulary is the discipline.** SDD names typed vocabulary as the hard-rule substrate. A move-set is one more typed vocabulary — every move id is a name on the lock; every driver reads the same names; drift shows as an unknown move id. Not a bolt-on. The same shape as every other typed contract in the system.

Two products fall out:

- **Substrate-native critique metrics.** Over a corpus of runs, count moves by class per topology. A topology that produces high `flag.appeal-to-authority` rates has a rhetorical bug the topology author can name and address. Today that bug is invisible.
- **Move-conditioned drivers.** A topology can declare "this run only accepts moves in {redirect, expand, contract}" and a driver can gate accordingly. Debate topologies open the full set; coding topologies close it.

---

## 7. A proposed first-pass taxonomy

This section proposes a concrete top-to-bottom vocabulary. Each top-level class carries a rationale, and each opens into children the user reaches with Right. The picker's depth is three levels for most classes and four for the fallacy branch. The tree is a draft; every leaf is defensible from the academic literature above, and every leaf has been named the way a professional speaker or writer would recognize it. Grouping is stable; leaves will move as the vocabulary is used.

### `critique/` — flag a defect in the model's last reply

Grounded in Hamblin's fallacy taxonomy and Walton's critical questions. When the user selects `critique/*`, the driver interprets the move as "the previous reply is defective in this specific way; do not continue as if it were sound." The critique branch is the largest branch and the one that most rewards depth.

- `critique/fallacy/formal/` — errors in logical form. `affirming-consequent`, `denying-antecedent`, `undistributed-middle`, `illicit-major`, `illicit-minor`, `four-terms`, `existential-fallacy`.
- `critique/fallacy/relevance/` — the model is arguing beside the point. `ad-hominem`, `tu-quoque`, `straw-man`, `red-herring`, `whataboutism`, `appeal-to-motive`, `genetic-fallacy`.
- `critique/fallacy/authority/` — appeals whose warrant is deference, not evidence. `appeal-to-authority`, `appeal-to-popularity`, `appeal-to-tradition`, `appeal-to-novelty`, `appeal-to-nature`.
- `critique/fallacy/emotion/` — the model is smuggling a feeling in place of an argument. `appeal-to-fear`, `appeal-to-pity`, `appeal-to-outrage`, `loaded-language`, `dysphemism`.
- `critique/fallacy/ambiguity/` — the terms slip. `equivocation`, `amphiboly`, `motte-and-bailey`, `no-true-scotsman`, `definition-shift`, `weasel-word`.
- `critique/fallacy/quantitative/` — misuse of number, base rate, or sample. `hasty-generalization`, `cherry-picking`, `base-rate-neglect`, `texas-sharpshooter`, `survivorship-bias`, `simpson-paradox-error`.
- `critique/fallacy/causal/` — mistaking correlation, sequence, or coincidence for cause. `post-hoc`, `cum-hoc`, `single-cause`, `slippery-slope`, `regression-to-mean-error`.
- `critique/fallacy/structural/` — the argument's shape is broken. `circular`, `begging-the-question`, `false-dilemma`, `false-equivalence`, `false-continuum`, `special-pleading`.
- `critique/soundness/` — the argument's *form* is fine but a premise is false or unwarranted. `premise-unsupported`, `hidden-premise`, `warrant-unstated`, `contradicts-established`.
- `critique/rigor/` — the piece is too loose to evaluate. `too-vague`, `unfalsifiable`, `scope-unclear`, `missing-counterexample`, `misses-obvious-case`.
- `critique/register/` — the writing itself is defective by the White/Orwell standard the project cares about. `hedged`, `padded`, `abstract`, `no-facts`, `machine-register`.

### `expand/` — grow what the model said

Aristotle's stasis theory (fact / definition / quality / procedure) plus the classical progymnasmata expansion techniques. When the user picks `expand/*`, the driver treats the request as "add material of this specific kind."

- `expand/backward/` — origin, mechanism, history. `backfill-history`, `backfill-mechanism`, `first-principles`.
- `expand/forward/` — what it enables, what happens next, what it implies. `downstream-consequence`, `second-order-effect`, `predict-outcome`.
- `expand/inward/` — deeper into the local mechanism. `zoom-in`, `worked-example`, `concrete-instance`.
- `expand/outward/` — parent category, adjacent field, analogy. `zoom-out`, `analogy-from`, `analogy-to`, `cross-domain-mapping`.
- `expand/dialectical/` — the opposing view. `steelman-opposite`, `strongest-objection`, `red-team`, `devil-advocate`.

### `contract/` — cut what the model said

The reverse-explainer's compression movement, plus Strunk & White's "omit needless words." When the user picks `contract/*`, the driver treats the request as "keep only what carries load."

- `contract/summarize/` — one-shot compression. `tl-dr`, `one-sentence`, `three-bullets`.
- `contract/spine/` — preserve the argument, drop the ornament. `argument-spine`, `strongest-claim-only`, `load-bearing-facts`.
- `contract/parent/` — upward scoping into a category. `to-parent-category`, `to-genus`.
- `contract/de-hedge/` — strip qualifiers and register. `de-hedge`, `de-llm`, `just-the-verdict`.

### `redirect/` — change what the model is doing

Speech-act theory — the illocutionary retarget. `redirect/*` says: stop the current line, do this instead.

- `redirect/register/` — same content, different voice. `plainer`, `technical`, `for-domain-expert`, `for-newcomer`.
- `redirect/format/` — same content, different container. `to-prose`, `to-list`, `to-table`, `to-diagram`, `to-code`, `to-argument-tree`.
- `redirect/frame/` — same territory, different question. `reframe-as-fact-question`, `reframe-as-definition-question`, `reframe-as-quality-question`, `reframe-as-procedure-question` (Aristotle's four stases).
- `redirect/stance/` — flip perspective. `from-user`, `from-critic`, `from-outsider`, `from-historical-actor`, `from-future-reader`.
- `redirect/mode/` — argument type. `to-descriptive`, `to-normative`, `to-predictive`, `to-diagnostic`.

### `question/` — probe the model without asserting

Walton's critical questions attached to argument schemes. Each argument scheme carries a small set of legitimate probes; `question/*` fires one.

- `question/warrant/` — "why does that ground support that claim?" `why-warrant`, `alternative-warrant`, `warrant-strength`.
- `question/evidence/` — "what evidence?" `source`, `sample-size`, `replication`, `contrary-evidence`.
- `question/expert/` — Walton's expert-opinion critical questions. `who-said-so`, `expertise-domain`, `expertise-recency`, `expert-consensus`, `expert-conflict-of-interest`.
- `question/scope/` — "does this generalize?" `edge-case`, `boundary`, `counterexample`, `where-does-this-fail`.
- `question/definition/` — "what do you mean by X?" `define-term`, `distinguish-term`, `operationalize-term`.

### `commit/` — the user takes a stance the driver must respect

Speech-act theory again — the commissive. Some conversations require the user to pin down what *they* believe before continuing.

- `commit/agree/` — accept a specific point. `concede-point`, `accept-premise`, `stipulate`.
- `commit/disagree/` — reject a specific point. `deny-premise`, `reject-inference`, `hold-contrary`.
- `commit/uncertainty/` — mark a limit. `uncertain-on`, `willing-to-be-wrong`, `hold-loosely`.

### `meta/` — moves about the conversation itself

Dialogue-game moves about the dialogue. Rare, load-bearing when needed.

- `meta/reset/` — start over on this branch. `retry`, `back-up-one-turn`, `restart-thread`.
- `meta/lock/` — pin a rule for future turns. `stay-in-register`, `keep-under-N-words`, `never-hedge`, `always-cite`.
- `meta/mark/` — annotate the record. `bookmark-turn`, `flag-for-review`, `tag-as-answer`.
- `meta/branch/` — fork the conversation without losing this line. `fork-here`, `hypothetical-branch`.

---

### Structural notes on the taxonomy

- **Miller's 7±2 applies at every level, not overall.** Top-level: 7 classes (critique / expand / contract / redirect / question / commit / meta). Each second level: 3–8 children. Each third level: 3–10 leaves. The user is never scanning more than ~10 siblings at once.
- **Every leaf is a real named concept.** Not invented for symmetry. `motte-and-bailey`, `undistributed-middle`, `Simpson's paradox`, `Texas sharpshooter` — all have Wikipedia pages, all are named in the fallacy literature, all are recognizable to anyone who does argumentative writing.
- **The critique branch dominates.** Roughly 60 leaves under `critique/` vs. 20 each under the other classes. This is intentional and reflects the actual asymmetry — users flag problems more often than they invite growth.
- **The taxonomy is language-bound.** English-only Latin-derived fallacy names. A translation project is out of scope for the first version and named in section 8 as an open question.
- **Register moves (`critique/register/*` and `contract/de-hedge/*`) are the substrate-native additions** the classical literature does not name. They emerge from the White/Orwell standard the project holds and from the "de-LLM" writing skill that already exists as auto-memory. These are the moves that make this taxonomy substrate's own, not just a port of an existing argumentation framework.

### What the picker looks like at each level

Level 0 (before the user presses anything): the picker shows a tiny badge next to the input, e.g. `↕ move`. Up/Down opens the picker with the top-level classes visible.

Level 1: top-level classes stack vertically. The selected row is highlighted. Right on `critique` opens level 2.

Level 2: subcategories of critique stack. The header shows the path (`critique › ...`). Right on `fallacy` opens level 3.

Level 3: the actual leaves. Selecting one commits the move — the class path enters the envelope, the plain-English name enters the input, and the user types their freeform continuation after it if they want.

At every level, typing narrows the visible list to matches on the current level's siblings. Left always climbs back. Enter always commits the current selection at any level (a top-level `critique` commit is legal — it means "something's wrong here, unspecified").

---

## 8. Open questions worth naming

- **Naming.** "Move" is Kenneth Burke's word (*Grammar of Motives*, pentad of act / scene / agent / agency / purpose) and the word chess uses. Both fit. Does substrate call them moves or something else? "Redirects"? "Interventions"? "Gestures"? Naming decides how the concept lands with users.
- **User authoring.** Do users define their own moves? Or is the vocabulary curated and closed? Open catalogs (see: Slack emoji reactions) drift into unusable. Closed catalogs (see: git commit types under Conventional Commits) hold their meaning. Best pattern is likely closed with a versioned schema like the substrate signals contract.
- **Cross-domain.** Move-vocabulary for critique differs from move-vocabulary for creative expansion. A single set for all conversation types will be a compromise. Substrate topologies already carry their own vocabulary — moves may be scoped per-topology, discovered from the topology's declared move-set at open time.
- **Cross-lingual.** Fallacy names have Latin roots and English idiom. "Motte-and-bailey" is untranslatable. A move-set that works only in English is a design failure at product scale; a set that works in every language is a research project of its own.
- **Persistence of a move across turns.** A "flag: sophistical shift" applied on turn 5 — does it stick as a lens through which the user reads turn 6 and beyond, or is it a one-shot on turn 5's reply only? Persistence changes the topology significantly.

---

## 9. Prior art to read next

- Douglas Walton, *Argumentation Schemes* (2008) — the closest existing catalog to a working move-set.
- Charles Hamblin, *Fallacies* (1970) — the ground for the critique branch.
- Walton & Krabbe, *Commitment in Dialogue* (1995) — dialogue-game formalism for how moves compose.
- Kialo (kialo.com) — the shipping product closest to a persistent typed-argument surface.
- Pokey Rule, Cursorless (cursorless.org / Pokey's talks) — projectional editing UX precedent, transferable to text.
- IBIS (Issue-Based Information System), Rittel & Kunz (1970s) — the original typed-node dialogue system, still the shape most argument mapping software uses.

---

*Scope-out: this document is not a design spec. Nothing here commits to a specific vocabulary, wheel key-binding, or envelope shape. The next document is the design — a proposed move-set of 12–20 items, grouped into 4–6 rhetorical-intent categories, with envelope shape and driver contract worked out. Open when the current shipping wave closes.*

---

## Appendix — original prompt

The following is the dictation this document was written against. Recorded verbatim so the source is inspectable and later readers can judge whether the document did the prompt justice.

> And for substrate, not only do we have topologies, but we will have something called "moves right," which is not just what you could respond with, right? But instead of having some auto-complete bullshit at the bottom of a lot of these tools, this would actually be a high-level prompt direction scheme in the conversation. Instead of responding, there's only so many things you tell the thing to do, right? It's like tightening it up or something like that. But then, so like for every one, there could be like a redirect. I'm imagining this in my head. There's like a redirect. You know, because you can complain about their responses sometimes. But then I would have a redirect drop-down. That would then like have a bunch of classifications that would say it would be like the kind of like logical errors that were being made or core rhetorical errors? That's the kind of thing that I want to talk about, like core nameable error classes in human language, like that, right? That's the kind of thing I'm talking about.
>
> So making a "move" is more like making a rhetorical move in the exchange, or is it more like deciding to start to constrain error or deciding to branch out ideas? It's a little bit like the thing you definitely know how to do, which is like the fractal reading thing that I think is part of the Claude MD, or it's like a skill or something, right? It's like how do you... Oh, expansion, right? A reverse explainer. You know? It was like the kind of classes, but then also it's something you can do just in the command line, you can select it with "up" and "down". Oh my god, this is exactly what it is, right? So you go up and down, it's like a wheel and that selects like a class and that word appears in the text entry box, right? So it's up and it's... I don't know what the words would be yet but something like anti-sophist move or it's the redirect to authority move. You know what I mean, literally but core logical moves. So while we wait for this submission, let's spin up a research doc and make this a really core research area. Do professional academic technical and commercial research.
>
> Follow-up: Oh, so not only do you select up and down with a wheel, but then you go right and left to go deeper into concepts in that class of concept. Well, you know, right to go deeper or left to go back.
>
> Follow-up: Well, it's not a wheel, but you know what I mean. It would be circular. That's just like the very first thing... You could type into it or you can start pressing up and down, and it would have these auto kind of incredibly rigorous, rigorously thought out classes of things that you could do, and then you go right arrow into those, right, and that kind of like digs down into that class of things and starts getting more specific. But we really need to really need — this is a really big job to figure out what these things are though. So let's yeah, let's get into it.
