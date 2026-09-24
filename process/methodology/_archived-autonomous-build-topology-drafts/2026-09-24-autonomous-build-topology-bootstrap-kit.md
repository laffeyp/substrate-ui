# Substrate-ui sprints 001–018: eight vocabulary-as-contract breaks and the starter code that would have prevented them

*Written 2026-09-24. Supersedes the 2026-09-11 version (`2026-09-11-autonomous-build-topology-bootstrap-kit.md`, originally titled "Bootstrap streamlining — what this build should have had on day one"), which mis-described itself as an input the autonomous build topology consumes. It is not that input. It is the post-mortem that argues the input — five starter files under `sdd-kit-2/starter/` — should be written.*

*One recurring pattern runs under every item: `signals/0.1.json` already defines the contract, and each break is a place substrate-ui re-encoded the contract in code instead of reading it. Emitter should read Layer 2. Harness should read Layer 5. Card linter should read Layer 1. Anchor helper should read Layer 7. This is `PRINCIPLES.md` commitment 1 restated with filenames.*

---

## The eight primitives, ordered by leverage

### 1. Mouth-side payload validation in the Emitter

`src/observability/Emitter.ts` validated tag names from day one and let
payloads pass unread. The Sprint 9 review found five tags emitting
5-field payloads where `signals/0.1.json § layer_2_payload` required
nine. Fourteen sprints of drift, invisible until a review turn.

The fix landed at commit e33f36b. It reads
`layer_2_payload.payload_schemas` at module load and refuses any emit
whose payload is short a required key. It should have been present the
first time `emit()` was called.

`PRINCIPLES.md` commitment 2 says this in one line: *schema enforced at
the speaker's mouth.* When the check runs post-hoc in the harness, the
build has already spent effort on code that emits a broken shape.

### 2. Vocabulary tables sourced from `signals/0.1.json`

`src/observability/vocab.ts` hand-copied roughly ninety tag names out of
the JSON. `bridge/main.py:259 _VISIBLE_KINDS` hand-copied thirteen
envelope kind names substrate already exports. `payload-check.js`
duplicated Layer 2 in a third form.

Three copies of one contract. Any of them can drift from the JSON
silently. All three should read from the JSON at build time; the JSON is
the contract per `PRINCIPLES.md` commitment 1.

The fix at e33f36b handles the TS side. The Python side is still
hand-typed.

### 3. Layer 5 read by the harness

`signals/0.1.json § layer_5_state_transitions` names the allowed
follow-ups per tag. No harness reads it. Each of sprints 001-018 hand-codes
its expected sequence in prose: *PROMPT_SUBMITTED then TURN_SUBMIT_REQUESTED
then TURN_SUBMITTED.*

A generic sequence checker — one file, one function, `assertSequenceOk(emits)`
— reads Layer 5 and validates any trace against it. Adding an ordering rule
to the JSON upgrades every harness at once. As written, each new rule needs
a code change in every harness that touches the tag.

### 4. Harness primitives library

Sprint 047 in the epic plan owned the harness maturity work. Sprints
001-014 each wrote their own `readJsonl`, `check`, `mkdtempSync`, session
cleanup boilerplate — roughly 150 lines per sprint × 14 sprints = 2100
duplicated lines. Every one of those duplicates was a place a small
inconsistency could hide.

The retrofit at commit 8e9f231 collapsed most of that into
`tests/harness/lib/`. If the library had been sprint 001, every subsequent
harness would have been 20 lines instead of 150 and the audit surface
would have been proportionally smaller.

### 5. Pixel-anchor read-back helper

`AnchorPainter.ts:33-42` paints a byte to a 1×1 canvas and fires
`ANCHOR_PAINTED{anchor_id, byte}`. Every harness listens for the tag; not
one reads the pixel back to check the byte matches what the state should
paint.

The steganographic verification is one-way. The whole point of the anchor
is the round trip — the harness sample-reads the canvas via
`page.evaluate` and asserts the returned byte equals what Layer 7 says
the current state encodes. `assertAnchorByte(page, id, expected)` is the
missing helper.

Without the read-back, the harness trusts the shell to report on itself.

### 6. Real fixture from day one

`e2e_fixture_real_record.js` landed at commit 1c8394b, after thirteen
sprints. Roughly forty real Ollama session records sat in
`~/.substrate/sessions/adhoc-*` the whole time. The compaction,
rate-limit, and real park-reason coverage those records enable was
invisible to every sprint through 013.

The bootstrap kit should ship a fixture-mode harness on day one, keyed
off `SUBSTRATE_HARNESS_FIXTURE_SESSION_ID`. Every sprint harness runs in
both modes: synthetic session for coverage of the specific tag chain the
sprint owns, and fixture session for coverage against shapes substrate
actually produces.

### 7. Audit files present from `git init`

`BLACKBOARD.md` and `KIT_DIARY.md` do not exist. Every review turn in
the session reconstructed sprint intent from git log messages and card
headers. `sdd-kit-2/foundations/02-sdd-practice.md` and `PRINCIPLES.md`
commitment 6 make these the load-bearing audit trail — the working
memory a downstream session inherits.

The templates live at `sdd-kit-2/templates/BLACKBOARD.md` and
`sdd-kit-2/templates/KIT_DIARY.md`. The gap is a `cp` command run once
at bootstrap plus a sprint-close discipline that appends to both.

### 8. Card linter against `signals/0.1.json`

Roughly thirty invented tag names shipped in sprint cards before the
drift review caught them. The Emitter refuses them at runtime. Nothing
refused them at card-write time.

A card linter that greps every `process/sprints_v0.1/*.md` for
`\b[A-Z_]{4,}\b` tokens and checks each against `layer_1_lexical.tags`
would have caught these on save. Same linter runs as a pre-commit hook,
same JSON, same authority.

---

## What the starter directory should ship

The five files below are the actual deliverable the eight items argue
for. Today they do not exist. `sdd-kit-2` ships templates and prose; it
should ship code, generic over any `signals/0.1.json`:

- `sdd-kit-2/starter/observability/Emitter.ts` — mouth-side validating
  Emitter.
- `sdd-kit-2/starter/harness/lib/{jsonl,assert,anchor,session}.js` — the
  primitives library.
- `sdd-kit-2/starter/harness/generic_sequence.js` — the Layer 5 reader.
- `sdd-kit-2/starter/scripts/lint_cards.py` — the card linter.
- `sdd-kit-2/starter/scripts/init.sh` — copies `BLACKBOARD.md` and
  `KIT_DIARY.md` templates into the project root.

Adopting the kit becomes: `sdd-kit init`; write `signals/0.1.json`;
write sprint 001. Every downstream sprint inherits the primitives.

---

## Why this compounds

One rule under all eight items: every check that could read from
`signals/0.1.json` should read from it. The Emitter reads Layer 2. The
harness reads Layer 5. The card linter reads Layer 1. The pixel-anchor
helper reads Layer 7. When any of those checks duplicates the JSON in
code, drift becomes a matter of when, not whether.

`PRINCIPLES.md` commitment 1 already says the vocabulary is the contract
between the program and its readers. The eight items restate the same
commitment at a lower altitude: the vocabulary is also the contract
between the vocabulary and its checkers.

---

*Companion document: `2026-09-11-autonomous-build-topology-v5-product-spec.md`.*
