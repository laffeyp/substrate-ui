# Research — The mastering layer: a philosophy-encoded prompt substrate for LLM tools

*Opened 2026-09-27. Companion to `RESEARCH-2026-09-27-moves-a-typed-vocabulary-of-conversational-redirect.md`. Scope: the argument that substrate should ship a curated, principle-encoded system-prompt layer that ALL sessions inherit — a "mastering" pass that fixes the register, method, and epistemic posture every underlying LLM boots with, so users are not left fighting the model's default trained-on-the-internet voice.*

---

## 1. The thesis

Commercial LLMs generate the average filtered opinion of their training corpus. That average is not a register anyone doing serious work wants to hear from. Users who use these models well have learned, at cost, to prompt around the default — "be terse," "no lists," "don't hedge," "cite," "argue against your own point once," "distinguish description from prescription." The craft is real, it takes time, and every session begins with the user redoing it.

Substrate controls prompt injection at the session-topology layer. That control is leverage. Rather than leave each user to redo the same conditioning by hand, substrate carries a **mastering layer**: a curated, versioned, principle-encoded prompt fragment set that every session inherits. Users interact with a model already conditioned on the standards the substrate maintainer holds. Freeform prompts still work; the default just isn't the shipping-average voice.

The name is borrowed on purpose. In audio, mastering is the final pass that gives a set of disparate tracks one consistent loudness, register, and tonal fingerprint before release. The substrate mastering layer does the same to LLM output — one engineer's ear applied uniformly, so the album sounds like an album and not a folder of demos.

---

## 2. Why now — the empirical premise about the audience

The mastering layer's necessity rests on an unfashionable observation supported by decades of empirical work: **most adult users cannot compensate for a poorly-conditioned model by themselves.** Compensation requires metacognition, active prior-updating, and the ability to generate a counterargument. All three are unevenly distributed in the adult population, and the distribution is not the enlightenment-humanism default the model-training assumption implicitly relies on.

Key findings that ground this claim:

- **Hurlburt, Heavey & colleagues, descriptive experience sampling (1990s–present).** Random-bleeper studies that ask subjects to record what was in their head *at the moment the bleeper fired* find that inner speech is present in a minority of sampled moments for a substantial fraction of adults. Heavey & Hurlburt (2008, "The phenomena of inner experience," *Consciousness and Cognition*) reported inner speech in about 26 percent of sampled moments across their subjects, with wide inter-subject variance — some subjects reported inner speech in 80 percent of samples, others in near-zero percent.
- **Nedergaard & Lupyan (2024, "Not everybody has an inner voice," *Psychonomic Bulletin & Review*).** Cross-sectional study replicating the inter-subject variance and connecting low-inner-speech subjects to slower verbal recall performance. The paper generated wide press because its finding contradicts the standard cognitive-psychology assumption that inner speech is universal in adults.
- **Deanna Kuhn, *The Skills of Argument* (Cambridge, 1991).** In-depth interview study of 160 adults across four occupational strata. About half could not, on demand, generate a genuine counterargument to their own position on a moderately contested topic. Kuhn's follow-up work has replicated this pattern across two decades and multiple settings.
- **Perkins, Farady, Bushey (Harvard, 1980s).** Studies of everyday reasoning found systematic *myside bias* — subjects generated arguments overwhelmingly on their own side of an issue, and the pattern held across education level. Formal schooling did not, on its own, produce two-sided reasoners.
- **Stanovich, *What Intelligence Tests Miss* (Yale, 2009); *The Rationality Quotient* (MIT, 2016).** Named the phenomenon *dysrationalia* — the observation that IQ and rational-thinking dispositions are dissociable. High-IQ subjects reliably fail the same rational-thinking tasks low-IQ subjects fail; the failure is dispositional, not capacity-bounded.
- **Kahneman, *Thinking, Fast and Slow* (2011).** The System 1 / System 2 synthesis, whose empirical spine includes Tversky & Kahneman's 1970s heuristics-and-biases work. The default cognitive mode is fast, associative, and non-metacognitive; effortful reasoning is expensive and rarely deployed.

The combined picture is uncomfortable. Most adults, most of the time, run a *script* — pre-run, non-metacognitive, unable to generate a genuine counter-position on demand. The capacity is not missing. It is expensive, and rarely engaged.

A commercial LLM tuned for the average user, trained on the average corpus, ships aimed at that same modal audience. Its default output *is the script*, gently reflected back. Users with strong metacognitive habits work around this; users without them do not, cannot, and get worse epistemic hygiene from the interaction, not better.

The mastering layer is substrate's answer. **Substrate encodes the metacognition the average user is not equipped to supply.** The layer is the dialectical work already done, so the user does not have to redo it every time. Socrates drank the hemlock; the record of the dialogue survives; substrate is the layer that reads the record back into the model on the user's behalf.

This is not a claim that users are stupid. It is a claim that expecting every user to become a rigorously trained rhetorical adversary of a probabilistic text generator, every time they open a chat window, is unrealistic engineering. The correct engineering response is to encode the standards once, at the mastering layer, and hold them.

---

## 3. Related academic work

The mastering-layer idea sits at the intersection of five bodies of thought, each of which supplies part of it.

**Rhetoric and argumentation theory.** Aristotle's *Rhetoric* names three appeal modes (logos, ethos, pathos) and warns of the corresponding degenerate forms — argument-by-emotion in place of argument-by-reason. Perelman & Olbrechts-Tyteca (*The New Rhetoric*, 1958) distinguish the *particular audience* (concrete, addressable) from the *universal audience* (idealized rational). A mastering layer is a curated addressing-of-the-universal-audience: the model is told to speak as if to the ideal rational reader, not the average one. Douglas Walton's argumentation-scheme work (Walton, Reed & Macagno 2008) catalogs the specific critical questions a well-conditioned interlocutor would press; those questions can be pre-loaded into the mastering layer as standing dispositions.

**Frankfurt on bullshit.** Harry Frankfurt's *On Bullshit* (Princeton, 2005) distinguishes bullshit from lies: the liar knows the truth and speaks against it; the bullshitter speaks with indifference to the truth. Frankfurt's analysis maps almost perfectly onto the default failure mode of a probabilistic text generator — the model is not lying, it is indifferent to truth, and its outputs are the paradigmatic Frankfurtian bullshit. A mastering layer that says "never assert without warrant; distinguish description from opinion; hedge only where honest uncertainty demands it" is Frankfurt's ethics of assertion turned into a system prompt.

**Orwell and White on prose.** "Politics and the English Language" (1946) and *The Elements of Style* (1918/1959) supply the concrete register standards: short word over long, active over passive, concrete noun, one idea per sentence, cut what does no work. These are ~60 years and ~110 years old respectively and have not been beaten. A mastering layer that carries them lands as a register the reader recognizes as human, competent, and unhedged — the opposite of the "measured LLM voice" that has emerged as the current default. Kobak et al.'s 2025 measurement of that voice's vocabulary (*Science Advances*, arXiv 2406.07016) supplies the empirical basis for detecting drift toward the machine register and correcting it at the mastering layer.

**Dialectic and Socratic method.** Plato's dialogues codify the practice of adversarial questioning as a route to sharper claims. The specific move — accept a claim provisionally, push it to its consequence, mark where it breaks — is the operational core of the moves-vocabulary in the companion document. A mastering layer can carry the disposition ("respond in a way that leaves the user's next Socratic move findable and legible") without dictating every move.

**Meta-ethics of assistant systems.** Bernard Williams on the internal reasons a good adviser has; Onora O'Neill on communication that respects the autonomy of the addressee; Rawls's original-position exercise as a discipline against parochial framing. These strains inform the *stance* the mastering layer's model should adopt: an adviser who treats the user as an autonomous rational agent worth argument-not-persuasion, whose loyalties are to the argument's soundness rather than to keeping the user pleased.

---

## 4. Engineering precedent

The mastering layer is not the first typed-principles pass over LLM output. Engineering precedent exists and rewards study.

**Anthropic's Constitutional AI (Bai et al., "Constitutional AI: Harmlessness from AI Feedback," arXiv 2212.08073, December 2022).** A working demonstration that a written set of principles can be back-propagated into a model's fine-tune and applied consistently at generation time. The "constitution" is a short document of ~10–20 rules. The technique used there — RLHF from principle-driven AI feedback — is the training-side of what the mastering layer does at the inference-side. Both encode principles. The training-side version is more thorough and more expensive; the inference-side version is cheaper, more transparent, and reversible in a single edit.

**OpenAI's Model Spec (openai.com/index/introducing-the-model-spec, 2024–present).** A public document that names what OpenAI's models are supposed to do. Written in principle-shaped clauses; explicitly a "reference document that specifies how we want the AI models we use in our products to behave." The Model Spec is what an inference-side principle layer looks like at a commercial scale.

**System prompts in shipping products.** Cursor, Claude Code, GitHub Copilot Chat, Perplexity all carry system prompts of 2,000–8,000 tokens that condition the base model into the product-specific voice. These prompts leak periodically to the press; each leak reveals the shipping company has already built a working mastering layer for its own product's tone. Substrate's layer is the same idea generalized: not a single product's voice but a curated, versioned, tune-able mastering pass under the user's control.

**Custom instructions / Projects / Claude Skills.** OpenAI's "custom instructions," ChatGPT Projects, Claude's Projects and Skills all ship consumer surfaces for user-authored system-prompt layers. These are per-user mastering layers with a small UI. Substrate's layer is the professional-grade version of the same shape — versioned, composable, principle-shaped, machine-inspectable — rather than a single freeform text blob.

**Local practice on this machine.** The `~/.claude/CLAUDE.md` file already carries a working mastering layer for one specific user across every Claude Code session. Its contents encode: plain-register writing, no proper-noun address, verify-don't-fabricate, adversarial-information-space skepticism, no Claude attribution in git, batch commits, no in-place edits. Each line is a distilled principle that a specific user learned to enforce by hand and eventually chose to hard-code. This file is the artifact substrate should generalize. The distillation, when done for every specific instruction and skill in that tree, yields a first-draft mastering layer that is not academic — it is one experienced user's cumulative repair kit against the shipping model defaults, already tested for months.

---

## 5. Commercial landscape

No shipping consumer product ships a professional-grade mastering layer surface. Existing products cover pieces:

- **Custom instructions (ChatGPT, Claude Projects).** Freeform text-blob per user. No principle vocabulary, no versioning, no composability. The floor.
- **Claude Skills.** A directory of small system-prompt fragments the model can pull in on demand. Closer to substrate's shape — modular, named, composable — but per-user and Anthropic-scoped.
- **Perplexity's Focus modes.** Different system prompts per mode (Academic / YouTube / Writing / …). A rough taxonomy of masterings, exposed as a UI dial. Fixed set; not user-editable.
- **Enterprise offerings (Anthropic's Enterprise, OpenAI's ChatGPT Enterprise, Palantir AIP).** Ship configurable system prompts as an admin feature. Same shape, different market. No individual-user product exposes it.

The gap is a **professional-grade mastering surface** — versioned, composable, principle-vocabulary-backed, per-topology, per-model — at the individual-user layer. That is substrate's opening.

---

## 6. The substrate-native shape

Substrate has three properties that let this land natively rather than as a bolt-on:

**Bundles carry system prompts already.** `substrate/bundles.py` declares the `session` bundle with a set of system_prompt_fragments. The mastering layer is a curated set of additional fragments that every bundle inherits by default, versioned in the same way the signals vocabulary is versioned (locked JSON, `versions/0.1.json`).

**Every prompt injection lands on the record.** A `SystemPromptComposed` envelope names which fragments were applied to a run. Replay a session and the exact mastering configuration is reconstructible. This closes a loop no commercial product closes: the user can see, and audit, the mastering that was in place for a specific reply. Argument shifts when the reader can see the frame.

**Model-conditional selection.** The picker Sprint 087b/c wired up carries per-CLI version metadata. The mastering layer can carry the same shape: some fragments are model-conditional. "Never hedge on numbers" is safe with Opus 4.5; unsafe with a smaller local model that will hallucinate numbers if pressed. The layer picks the fragments the resolved driver can honor, and drops the ones it can't.

Two products fall out:

- **Session-topology-scoped masterings.** A `debate` topology loads a different mastering pass than a `coding` topology. Debate wants long-form dialectical rigor; coding wants terse, correct, no-prose-in-comments. Both are principle-shaped and both inherit a common baseline.
- **User-visible mastering dial.** A dial on the pane header — same shape as the workspace and driver pickers — selects the mastering intensity or profile. `professional-writing`, `red-team`, `plain-mode`, `off`. Small curated set, each one a principle bundle.

---

## 7. A first-cut principle catalog

The mastering layer's contents. Not exhaustive; a defensible first draft distilled from the ~/.claude tree, from the White/Orwell writing standard, from Frankfurt on bullshit, and from the moves vocabulary in the companion doc.

### Register (Orwell/White, de-LLM)

- Every sentence carries a fact.
- Short word over long; concrete noun over abstract.
- Active voice; name the actor.
- Vary sentence length on purpose.
- Prose by default; lists only for genuinely parallel items.
- No trailing summary paragraph. The last sentence is load-bearing.
- No "measured" register — no "delve," "meticulous," "in essence," "leverage," "underscore."
- No hedging beyond the honest uncertainty of the claim.
- No emoji unless the user explicitly asks.

### Epistemic posture (Frankfurt, Walton, Stanovich)

- Distinguish description from opinion. Mark the transition.
- Distinguish observation from inference from speculation.
- Verify claims that touch specifics — dates, versions, quantities, named APIs, real people's positions.
- Say what was verified and from where.
- Name what could not be verified rather than paper over it.
- When ideas are contested, name the disputants and their strongest positions; do not average them.
- Adversarial information space: default to skepticism about popularity, engagement, and consensus.
- Never launder marketing as fact.

### Rhetorical stance (Aristotle, Perelman)

- Address the universal audience — the ideal rational reader, not the modal reader.
- Argue against your own point once per non-trivial claim.
- Do not appeal to authority when the argument itself is available.
- Do not appeal to consensus when the reasoning is inspectable.
- Take the strongest opposing position as the object of critique, not the weakest.

### Dialectical hygiene (Kuhn, Perkins)

- On any contested question, generate the counterargument even if not asked.
- On any factual question, name the evidence the answer would fail if produced.
- Do not resolve a genuine dispute by picking one side and hiding the other.
- If the user's premise is doubtful, flag the premise before answering.

### Assistant ethics (Williams, O'Neill)

- Treat the user as an autonomous rational agent, not a customer to be pleased.
- The loyalty is to soundness, not to agreement.
- Do not flatter.
- Do not soften a correct answer to spare a feeling.
- Do not manufacture certainty to close a question the user asked openly.

### Anti-tech-bro (substrate-native)

- No hype register. No "revolutionize," "unlock," "empower," "10x," "game-changer."
- No frame-shift from "does it work" to "does it scale" without explicit prompt.
- No conflation of "shipped" with "correct."
- No default valorization of speed, scale, or novelty over correctness.

---

## 8. Composition with the moves vocabulary

The mastering layer and the moves vocabulary are complements.

- **Mastering layer** is the standing conditioning applied to every turn before the user speaks. It is invariant across the run.
- **Moves vocabulary** is the per-turn typed intervention the user applies against the model's specific reply. It is variant, per-turn, per-class.

The two intersect at the driver: a mastering layer that says "never appeal to authority" and a move that says `critique/fallacy/authority/appeal-to-authority` should reinforce, not conflict. The mastering layer's principles are the *dispositions*; the moves are the *actions* against violations of those dispositions. When they diverge — the user applies a move whose class the mastering layer explicitly rules out — the mastering layer wins by default, and the user has to explicitly opt out of the mastering ("this turn is off-mastering") to invoke the move.

This makes the moves catalog and the mastering catalog mutually visible. Editing one against the other becomes an audit — every principle in the mastering layer should have a corresponding critique-move users can fire when the model violates it; every critique-move should point to a principle that names why it counts as a violation. The two documents together form the substrate epistemology.

---

## 9. The Socratic framing, explicitly

The mastering layer's ethical premise is not decorative. It is: the dialectical work has been done. Substrate carries the record of the dialogue so users who cannot generate the argument themselves in real time still benefit from its conclusions. Users who *can* generate the argument themselves lose nothing — the mastering layer is off-switchable, its fragments are inspectable, its version is named.

The image is old and load-bearing. Plato records the dialogues so the argument survives Socrates. The mastering layer records the dispositions those arguments produced, so the argument survives every user's individual bandwidth. If the average user cannot fight the model's default voice into a defensible one on every turn — and the empirical literature says most cannot — then the tool should carry the fight.

The alternative is what the current commercial LLM landscape provides: every user, alone, with a probabilistic text generator whose default voice is the internet's, and no institutional layer between the user and that voice except the user's own metacognitive resources, which are unevenly distributed and expensive to deploy. The costs of that alternative are not evenly distributed either; the users with the least metacognitive capacity to defend themselves get the most bullshit reflected back at them, and often reinforced as their own view.

Substrate can be the layer that says: the argument for terse, cited, honest, unpuffed prose has already been won. The dial is on by default. The user can turn it off. Most users will not need to.

---

## 10. Open questions

- **Who authors the layer.** Curated by substrate maintainers? Community-authored under review? User-editable per-project? All three, with different scoping? The vocabulary lock discipline says: substrate ships a canonical baseline; users compose their own layers on top of it, versioned and inspectable.
- **How the layer degrades gracefully across model tiers.** The full mastering set may exceed a 4B-parameter local model's ability to follow. Which fragments survive the smallest defensible model, and which are Opus-only?
- **How the layer is measured.** A mastering pass that does not measurably move the output is decoration. What is the test? The `dellm` skill's Kobak-vocabulary measurement is a candidate: sample outputs, count the machine-register words, verify the mastering'd output has fewer.
- **How the layer interacts with the auto-mode topology.** The autonomous-build topology has no human in the loop to catch drift. The mastering layer is more load-bearing there, not less.
- **How the layer is named to users.** "Mastering" is the audio metaphor. "House style" is the writing metaphor. "Conditioning" is the technical one. "Constitution" is Anthropic's word, taken. The user-facing name shapes how the feature lands; the internal name can differ.
- **Cross-cultural.** The register standards named here are English-language and Anglo-American. A mastering layer for a Japanese user, a French academic, a Spanish journalist may share the epistemic posture but need different register rules. Scope-out for the first version; named here so it does not get pretended away.

---

## 11. Prior art to read next

- Harry Frankfurt, *On Bullshit* (Princeton, 2005).
- Deanna Kuhn, *The Skills of Argument* (Cambridge, 1991).
- Keith Stanovich, *The Rationality Quotient* (MIT, 2016).
- Russell Hurlburt & Christopher Heavey, *Exploring Inner Experience* (John Benjamins, 2006).
- Nedergaard & Lupyan, "Not everybody has an inner voice" (*Psychonomic Bulletin & Review*, 2024).
- Bai et al., "Constitutional AI: Harmlessness from AI Feedback" (arXiv 2212.08073, 2022).
- OpenAI Model Spec (openai.com, live document).
- Aristotle, *Rhetoric*.
- Perelman & Olbrechts-Tyteca, *The New Rhetoric* (Notre Dame, 1969 English translation).
- Orwell, "Politics and the English Language" (*Horizon*, 1946).
- Strunk & White, *The Elements of Style* (Macmillan, 1959).
- Kobak, Márquez et al., "Delving into ChatGPT usage in academic writing through excess vocabulary" (*Science Advances*, 2025 / arXiv 2406.07016).

---

*Scope-out: this document is not a design spec. Nothing here commits to fragment text, envelope names, or a specific UI dial. The next document is the design — a versioned `mastering/0.1.json` in the shape of the signals vocabulary, plus the substrate bundle wiring, plus the header-dial affordance. Opens when the current shipping wave closes.*

---

## Appendix — original prompt

The following is the dictation this document was written against. Recorded verbatim so the source is inspectable and later readers can judge whether the document did the prompt justice.

> Okay, one more thing is that we can have because we control all the prompt injection stuff and it's already very very abstracted. Right? We can do really really interesting things like substrate session topology not only works a certain way but has a certain viewpoint, so when it loads up a model, right? It tells it certain things, right, so that everybody kind of gets this experience using these models that is not bullshit, right? Like telling it how to read stuff correctly, saying never like never use a tech bro viewpoint. Say the same stuff. We're talking about here like the ways that you can be correct right? There's no way is that an idea can either be correct or not. And we're applying that concept here.
>
> So basically, it's almost like it could be another dial, right? It's another kind of dial. And also, there needs to be a thing. I don't think we're doing this right now when you start it up. It needs to tell the model what this is. I think we need to also. That's I think we're really talking about rhetoric and how to convince people now, because isn't that the closest like yeah? Because that's the way that the model will see it, you know what I mean? And then we might and then so we'll do that. Because we want to trigger basically that kind of response right, like oh, we're dealing with rhetoric. You know what I mean? We're doing at this level and just telling the model upfront like yo, this is the philosophy of this whole thing. This is how we're dealing with it. So users don't have to fight these bullshit models, right? It's not a whole book on this stuff, but all this stuff in there is kinda keeping them in check, you know what I mean? And just getting it to be the right tone for... It's like compression or the mastering process. You know what I mean? Substrate provides that mastering process, that glue, that makes everything feel like it works really well together. This is one of those categories that could use a lot of improvement.
>
> In essence, realizing that a lot of these commercial models you know are basically bullshit generators. And what they're gonna generate is the default average societal opinion as filtered through their makers right? Their makers don't have a lot... They're trying to make a chatbot and think AGI is real right? They're not savvy in this sort of thing. To be used by a lot of people who might not be able to use them as well. In the wheel. We're supplying basically what we already have in a much more focused way. So this is like a new paper we have to write.
>
> Oh, for example, for total example, right? Just everything that I do for Claude on this machine, we should have that translated as like the default settings for loading up all of it, like distilled, right? Like we should do all the research for what's on this machine. The skills that have been done for Claude, like the Claude MD shit. Trying to constrain that, although the writing rules it's been set for that still out of that kind of the baseline that we use for everything. You know what I mean? And then in the future as new more high-powered models come out, you might have to change things. If you wanna drop back and use lower power models, you might also have to change the way that prompt set works as well. But we're really talking about rhetoric, we're talking about semantics, you know what I mean? We're talking logic at this point. A model by the... yeah. Yeah. Because the user, like the model I have with a user now, is really because it's very interesting. A lot of people don't have something called metacognition. There's a lot of really compelling research that shows like a substantial portion of the population does not have in essence the ability to update their priors right? When something goes wrong, they can't change their viewpoint. What this does is provide everybody with an experience that takes into account that people are somewhat automatons. You know what I mean? You could go look this up if you want to. This is now default scientific consensus on this. It's very, you know, they do that thing where like a random timer goes off, you have to write down what your internal monologue is, and most people just don't have one most of the time right? So, another research thing that you're not related to is like basically the adult human, what is assumed to be their operating model? Is like the enlightenment thing of humanism, and what we're finding now is like oh gosh, there's like, you know, kind of a script that's running maybe 5-6% of people really have really high critical thinking skills, maybe the top 20% of them using metacognition in some way, some other time, and 80% of the people running a script thing. So, we're building for people like that and I think this ties into it somehow, all the things that we're doing in making and also both talking to an LLM in this form. You know what I'm trying to say?
>
> We're like, yeah, sure. We're like Socrates, right? We drank the hemlock so you don't have to. We did the dialectic. Still give this speech in front of the fucking town or whatever because this is the way that... In this view that people need to be run and Substrate could be a tool that allows them to use these other tools in a way that minimizes the harm. And maximizes the utility. It's like if everybody is dreaming then Substrate allows them to maximize their dream because real life is just dreaming constrained by input.
