# Delegation research — 2026-09-22

*One memo. Three research passes in order — substrate audit, design
mapping, commercial prior art — then a design proposal built from
what the passes surface. Written as it's done. Live document; new
findings land under their section.*

## Purpose

The vocabulary lock cannot ratify until the delegation model in
substrate + reveal-shell matches what the shell direction design
carries. Section 20g of `handoff_latest/sheets/Substrate Shell
Directions v3.dc.html` shows one delegate operation producing three
children in parallel, each on a different model, each with its own
record, all grouped under one `⑂ delegate → 3 children` line the
user can expand. Today's `delegate` tool is one-call → one-child. The
reveal shell renders every `ToolCall` as its own row. The gap is
real; the fix is not obvious.

The subphase also carries a broader question: what SHAPES of
delegation does substrate need to support? The Architect named three
that must land:

1. **Same task, N models in parallel.** 20g's shape.
2. **Different tasks, N children in parallel.** A true fan-out over
   distinct sub-tasks.
3. **Nested delegation with caller-set style.** Each child can
   itself delegate further, bounded by depth and child caps. The
   caller (parent or grandchild) chooses the shape at call time.

Plus a legibility constraint: this must not become a hidden auto-mode
that spins up 20 agents behind a spinner. Every child is a named
record with a driver, a status, and a descend affordance.

## Pass 1 — Substrate audit

Read: `substrate/src/substrate/topologies/tool_loop/delegate.py`
(684 lines); `substrate/src/substrate/topologies/tool_loop/agency.py`
(199 lines); `substrate/src/substrate/topologies/session/__init__.py`
(delegate-side propagation only); `substrate/src/substrate/topologies/
applications/fanout_review.py`; `substrate/src/substrate/topologies/
code_review/__init__.py`; `substrate/src/substrate/kernel/
composition.py` (`embedded_substrate`).

### What `delegate` does today

The tool signature (`delegate.py` line 619-680): `delegate(task,
[model], [child_session_name], [context], [baseline],
[timeout_seconds]) -> {answer, child_root, steps}`. One call, one
task, one child, blocking on the parent's turn until the child hits
FinalAnswer or times out. Return payload cites the child record so
the parent record links to the child at run granularity.

The call closure at `run(a)` (line 412) branches four ways on the
per-call args:

1. **Standing session** (`child_session_name`). Routes the task to
   an existing named session via `SessionRegistry.turn_sync`.
   Reuses a session's history — the reviewer's next turn.
2. **Different-driver child** (`model`). Fresh child spawned with
   a named model resolved via `model_resolver`
   (daemon-injected on the substrate-ui side, else
   `_default_model_resolver`).
3. **Same-driver child with context slice** (`context`). Fresh
   child on the parent's driver, task prefixed with a bounded
   slice of the parent's record.
4. **Fresh child on parent driver** (default). One-shot child, no
   session, no context slice.

### The blocking contract

Docstring line 11-15 states the design intent plainly: `Tool.run` is
synchronous. The child runs on a worker thread with its own asyncio
loop (`_run_child_to_answer`). The parent's turn blocks on the
child. Cancellation is cooperative — a `TimeoutError` triggers
`call_soon_threadsafe(task.cancel)` across the thread boundary; the
child's `Runtime.run` finally seals the record so the parent's
timeout and the child's record agree. Line 15 is explicit that "a
concurrent child (running alongside the parent's other work) would
be the `embedded_substrate` Producer path instead; that is a
separate, later shape." Parallel from a tool call is deliberately
out of scope.

### Caps

`max_depth: int = 2` (line 353). Bounds the delegation chain. At
depth ≥ max_depth the call raises `ValueError` which the tool_loop
turns into `ToolResult(ok=False)`. `_default_child_factory` folds
`delegate` back into the child suite only when `depth + 1 <
max_depth` (line 163), so the chain is `parent → child →
grandchild` at most under the default.

`max_children: int = 4` (line 354). Per-instance counter on
`spawned["n"]` in the closure. Bounds fan-out across ALL delegate
calls the parent makes across its whole run — not per-turn, per-
instance. A parent that calls delegate five times in one run raises
on the fifth.

`child_max_steps: int = 6` (line 355). Bounds the child's own
tool-loop steps. `timeout_seconds: float = 600.0` (line 356) is the
child's wall-clock ceiling; a cooperative-cancel safety net, not
the primary bound.

### Provenance

Every child carries `parent_session_id` + `parent_seq_at_call` in
its `TopologyBuilder.baseline` via `_with_baseline`. Downstream
`api.trace_ancestry` walks the chain from a child record back to
the parent. Reserved keys — `parent_session_id`,
`parent_seq_at_call` — cannot be spoofed by a per-call `baseline`
arg (line 592-598 strips them before merging).

### Record layout

Each child spawns into `delegate-runs/d<depth>-c<n>/workspace/`
(its tool workspace) with a sibling `delegate-runs/d<depth>-c<n>/
record/` (its record). Unique-child-root probing at
`_unique_child_root` (line 332) walks the counter until a free
slot on disk. The cockpit path (`server.py` line 2390) can
override the child's record root via `child_record_root(n)` so the
child's record lands as a flat served record under
`RUNS/delegate_child_<uuid>_c<n>.record` — the UI's descend
affordance needs a served path, not a nested one.

### Envelopes on delegation

A delegate call produces this envelope shape on the PARENT record:
`ToolCall(tool="delegate", args=[{...}], step=<N>)`, then
`ToolResult(tool="delegate", ok=<bool>, output={answer, child_root,
steps, via?})`. The CHILD record emits its own `RunStarted`,
`ProducerStarted`/`ProducerCompleted` per producer, `TriggerFired`,
`ToolCall`/`ToolResult` for its own tools, `FinalAnswer`, `Park`
(if a session), `SessionEnded` (if a session), `TerminationMatched`,
`RunFinalised`. The `RunStarted.payload.baseline` carries
`parent_session_id` + `parent_seq_at_call`.

### The topology-based parallel primitive

`substrate/src/substrate/topologies/code_review/__init__.py` line
129-158 is the shape substrate already uses for parallel agents:
one Producer kind PER PARALLEL WORKER, hard-wired at
topology-build time. `code_review_topology(code, responders={...},
judge=..., roles=(...), quorum=K)` builds N Producer kinds
`reviewer-<role>`, each with its own Responder from
`responders[role]`. A KindBuffer view collects Critiques; a
trigger fires the judge when quorum critiques land; a
`cancel_all_others` termination policy stops the lingerers.
Parallelism is natural because Producers run concurrently under
the runtime. `fanout_review_topology` composes this over a git
diff.

The characterising difference:

- **Topology-based fan-out (`code_review`, `fanout_review`)** —
  authored up front, N distinct Producer kinds baked into the
  topology, parallel by design, cannot be reshaped mid-run.
- **Tool-based delegate** — dynamic, model-driven at call time,
  but sequential and blocking per parent turn.

### `embedded_substrate` — the composition primitive

`substrate/src/substrate/kernel/composition.py` line 87.
`embedded_substrate(topology, exports=...)` builds a PRODUCER that
runs an inner substrate topology and exports mapped inner event
kinds onto the outer bus. Each embedded_substrate Producer has its
own inner record root — run-granularity provenance identical to
delegate's. Multiple embedded_substrate Producers can run in
parallel because they are Producers, and Producers run
concurrently.

This is the primitive `delegate.py` line 15 named as "the separate,
later shape" for concurrent children. The building block for
model-driven parallel fan-out already exists; what does not exist
is a way for a model to declare a new embedded_substrate Producer
at call time.

### The three shapes the Architect named, against what exists

1. **Same task, N models in parallel** (20g's shape). No current
   primitive. A model calls `delegate(task, model=X)` three times
   sequentially, each blocks. Parallel same-task fan-out is only
   reachable today by authoring a bespoke topology with N
   Producers running the model call.
2. **Different tasks, N children in parallel.** Same gap. The
   topology-based approach (`code_review_topology`) is the closest
   existing shape but expects the tasks to share a common kind
   (Critique) and gate on quorum, not "collect all N answers."
3. **Nested delegation with caller-set style.** Nesting works
   today, sequential, bounded by `max_depth=2`. Caller-set style
   at each level does not exist beyond the four per-call branches
   already in the tool.

### Legibility posture

Every child record is a first-class substrate record. The reveal
shell can descend into any child via `attachRecordRoot`. The
reveal shell's tool card renders one ToolCall per row.
Grouping siblings under one expandable line (20g's `⑂ delegate →
3 children`) is a UI aggregation that does not exist.

### Sprint-053-mode gotcha (recent, in the audit)

The tool's arg-parsing sits at line 420: `if a and isinstance(a[0],
Mapping)`. The runtime seals dicts as MappingProxyType before the
closure sees them; the previous `isinstance(a[0], dict)` check
was False for the sealed mapping and the else branch coerced the
whole mapping to `str`, dropping every kwarg past `task`
(including `child_session_name`). Sprint 053 widened to `Mapping`.
Same class of bug as the substrate_tools fix at sprint 049. Named
because the delegate contract is fragile at this seam — any new
kwarg needs to survive both the dict and Mapping paths.

## Pass 2 — Design mapping

Sources: `handoff_latest/sheets/Substrate Shell Directions v3.dc.html`
(sections 20a-g, 19j) and `handoff_latest/docs/DESIGN-DECISIONS
-through 2026-09-01-.md` (D3, D38, D41, D44, D70, D72; also P2 in
the same file).

### The design's delegate contract, load-bearing lines

- **D3.** "`delegate` is a model tool, never a user command."
  Meaning: no `/delegate` slash. The palette does not carry
  delegate. The model calls it via its tool schema.
- **D38.** "A delegate call renders as the ⑂ line; while the child
  runs, an attached inset opens under it (child record id ·
  standing/one-shot · depth n/2 · live mini-stream); when the
  answer folds back the inset collapses to one line with the
  folded text; click re-expands; earlier children stay as folded
  single lines. Children are never loose rail entries."
- **D41.** "Delegate depth. The inline child inset nests to the
  engine cap (`max_depth=2`): a child's child renders as one
  deeper inset, then delegate refuses. Any child at any depth is
  clickable through to its own record."
- **D70.** "Talking to a delegate — DESCENDS focus into the child,
  in place — no new pane, no new window: the transcript shows
  ONLY the child — its ⑂ delegate line + inset; NO parent lines.
  Prompt line re-colors to the delegate accent with a left border.
  Depth shifts the hue: session `#82a5c8`, then `#93a0cb · #9a9bce
  · #a096d0 · #ac92d4 · #b88fd9` at depths 1–5. Nested view is a
  SETTING (⌘, · appearance). TALKABILITY IS A TOPOLOGY PROPERTY:
  a child whose topology accepts `UserMessage` gets the prompt
  box; one that doesn't (tool-only runners) shows no prompt box at
  all — you watch its stream, the path row says 'watching'."
- **D72 (2026-09-06). Delegate to many (20g).** The load-bearing
  spec for the fan-out shape: "A fan-out delegate renders as ONE
  ⑂ line ('⑂ delegate → 3 children · 2 running · 1 parked'); click
  (or ↵) expands it to a child list inside the standard inset —
  one row per child: name, driver, record id, event count, live
  status with its latest headline. ↑↓ walks the rows, ↵ descends
  into the selected child exactly as 20a. **Each child is its own
  record; results fold back as one ToolResult when all children
  finish.** Depth hue rule (D70) applies unchanged."
- **P2.** "Delegation made visible. A delegate call opens an
  attached inset child pane under its turn (own record id, depth
  badge, live mini-stream), folds to one line when the answer
  returns. Depth cap 2 shown as `depth 1/2`."

### Section-by-section map

| Section | Design | Substrate today | Reveal shell today | Gap |
|---|---|---|---|---|
| 20a — descend one level, child only | attachRecordRoot on click; parent lines hidden; path row above prompt | substrate primitive exists (`CHILD_RECORD_ATTACH_REQUESTED` + child stream via `streamRecordByPath`) | Descent affordance wired at the controller. Path row + hiding parent lines: not implemented. Prompt-recolor with depth accent: not implemented. | Reveal-shell UI work only. |
| 20b — two levels down, path row grows, esc climbs one | Same, chain grows | Depth-2 chain exists (child can delegate once more, capped by `max_depth=2`) | Same as 20a plus esc-key handler that climbs one level per press | Reveal-shell UI work only. |
| 20c — non-talkable child (tool-only), no prompt box | Prompt hides when child topology accepts no UserMessage | Substrate can build such a topology, but `delegate`'s default is `tool_loop_topology(..., walkthrough=True)` which is talkable | Prompt always present regardless of child topology | Design underspec: today's delegate hard-codes a talkable child factory. To reach 20c the caller would need to pick a non-tool_loop child factory. |
| 20d, 20e — nested view (parent dimmed, kept visible) | Setting-toggle in ⌘, appearance | N/A — this is UI-only | Not implemented; would require a rendering mode toggle | Reveal-shell UI + preference storage. |
| 20f — depth ramp five levels, hue blue → violet | Illustrates the D70 hue rule stacked | Substrate cannot reach five levels — `max_depth=2` refuses at depth 2 | N/A | Substrate cap gap: five-level demo requires lifting `max_depth`. The design shows five levels as visual illustration; the cap decision needs its own ruling. |
| 20g / D72 — delegate to many | ONE ToolCall envelope, N children in parallel, ONE folded ToolResult when all finish | **Not possible.** Today's `delegate` is one call → one child, blocking. Three parallel children require three sequential `delegate` calls, three separate ToolCall envelopes, three separate ToolResults. | Tool card renders one ToolCall per row. No aggregation of sibling delegate calls into one expandable line. | **Substrate + reveal-shell gap.** The tool needs a call shape that accepts N children (task-list or model-list), spawns them in parallel, waits for all, folds one answer. The UI needs a card variant that renders the ⑂ line, the count line, the child list, and the ↑↓/↵ walk. |
| 19j — delegate at depth cap | Refusal rendered as ordinary failed ToolResult inline | Substrate raises `ValueError` at cap; `tool_loop` folds to `ToolResult(ok=False)` | Tool card renders ToolResult error text | Green. |

### Findings from Pass 2

**F1. D72 is the design of record.** It names the exact contract:
one ToolCall on the parent, N children each with their own record,
one ToolResult folded back when ALL finish. Not N ToolResults.
Not sequential.

**F2. Fan-out semantics are wait-all, not first-answer.** D72:
"results fold back as one ToolResult when all children finish."
This rules out early-termination-on-quorum (which is what
`code_review_topology` does with `cancel_all_others`). Fan-out
delegate does not race. It waits.

**F3. The palette + slash discipline is settled.** D3 rules out a
`/delegate` slash. The parent agent must make the call through its
tool schema; the user cannot spawn a delegate. Delegation style is
NOT a palette setting today; it belongs in the delegate tool's own
parameter shape.

**F4. Talkability is a topology property, not a delegate-tool
argument.** D70 makes this explicit. To match 20c the caller has
to pick a non-tool_loop child factory. `delegate.py`'s
`_default_child_factory` builds a talkable child. The tool accepts
a `child_factory` override but the model can't currently choose
non-talkable from the tool schema — no parameter for it.

**F5. Depth cap. The design shows five levels. Substrate stops at
two.** D41 says the cap is 2 and the design accepts that (the
five-level 20f is illustrative). Lifting the cap needs its own
ruling separate from this subphase; the fan-out itself does not
require deeper nesting.

**F6. Live mini-stream in the inset (D38, P2).** While a child
runs, the parent's inset shows a live view of the child's stream.
The reveal shell's `attachRecordRoot` already supports streaming
by path; wiring it into a tool-card inset is UI work not present
today.

**F7. Reveal shell has none of the aggregation UI.** Every
`ToolCall(tool="delegate")` renders as its own row today. No `⑂`
symbol, no expandable child list, no per-child status line, no
↑↓/↵ walk. D72 needs all of these.

## Pass 3 — Commercial prior art

Five systems examined: Anthropic's Claude Agent SDK + Claude Code
subagents, LangGraph's Send API, OpenAI's Responses parallel tool
calls, Microsoft's AutoGen, and CrewAI. Each solved the "run N
agents in parallel" problem; the approaches diverge in whether the
fan-out is a tool call, a graph edge, an inline message list, or a
declarative role definition.

### Anthropic — Claude Agent SDK (`Task` / `Agent` tool)

Claude Code v2.1.63 (Feb 2026) renamed the primitive from `Task`
to `Agent`; both names still resolve. A coordinator emits **one or
more** `Agent` tool calls **in a single response**. Each call
spawns a subagent with its own context window, its own system
prompt, its own tool access, and its own permissions. Independent
subagent calls in the same response run in parallel. Subagents can
themselves spawn subagents up to depth 5. "Dynamic Workflows"
extends this to tens or hundreds of parallel subagents from one
lead's plan. Results return as ordinary `tool_result` blocks; the
coordinator resumes after all parallel calls complete.

Substrate's `delegate` is exactly this primitive in shape, minus
the parallel semantic. Claude Code's mechanism: multiple tool
calls per response, executed concurrently by the runtime. Not one
tool call with a list argument.

### LangGraph — Send API

`Send(node_name, state)` from within a graph node emits N messages
that each kick off an independent subgraph run. Fan-out is
**dynamic** — the sending node decides N at runtime. LangGraph
groups the resulting subgraph runs into a "superstep"; the outer
graph waits until every branch completes before proceeding.
State reducers (typically `operator.add` for lists) fold parallel
results back into the shared state. Use cases named in the docs:
document summaries, batch labeling, parallel tool calls,
multi-source research.

The fan-out is a graph-authoring construct, not a model-driven
tool call. The graph author decides where a Send can happen; the
model does not spawn parallel branches from within its own
reasoning.

### OpenAI — Responses / Chat Completions `parallel_tool_calls`

A boolean field on the request. When `true`, the model may emit
**multiple `tool_calls`** in a single response. The application
layer executes them concurrently and returns all results in one
follow-up. Native to the API. Same tool can appear more than once
per response — a `read_file(path=A)` and `read_file(path=B)` in
one round. Limitation: gateway-owned tools like `web_search_preview`
or `mcp` reject `parallel_tool_calls: true`.

Same shape as Claude Agent SDK. Multiple tool calls per response.
Not one call with a list.

### Microsoft — AutoGen

Conversational pattern. Agents pass typed messages in a
`GroupChat` abstraction. Fan-out is not a primitive; parallelism
emerges when the group's message-passing schedule permits
multiple agents to run without waiting on each other. Message
passing is async. Group chat models a conversation, not a
fan-out.

### CrewAI

Role-based. A `Crew` binds N `Agent`s to `Task`s. A `CrewWorkflow`
can be sequential, parallel, or hierarchical. Parallel-execution
mode runs all bound agents concurrently and gathers their outputs.
The Crew is declared up front — closer to substrate's
`code_review_topology` than to a model-driven fan-out.

### Patterns across the field

- **Model emits N tool calls per response.** Claude Agent SDK,
  OpenAI Responses. The runtime executes concurrently. The model
  decides the shape at reasoning time.
- **Author declares N parallel branches.** LangGraph Send (graph
  author), CrewAI Crew (system builder). Fan-out at authoring
  time.
- **Message-passing async.** AutoGen. Parallelism as a byproduct
  of scheduler independence.
- **Depth caps vary widely.** Claude Code: 5. Substrate:
  `max_depth=2`. LangGraph, CrewAI, AutoGen: no built-in cap.
- **Fan-in.** LangGraph uses reducers over shared state. Claude
  Agent SDK / OpenAI return each subagent's result as its own
  tool_result. CrewAI collects agent outputs into a Crew result.
  D72 specifies the reduce as "one ToolResult when all children
  finish" — closer to a CrewAI collect than to OpenAI's per-call
  independent returns.

### Where D72 sits in the landscape

D72's shape — **one delegate call, N children spawned in parallel,
one folded ToolResult** — is not one of the dominant patterns.

The dominant "model-driven parallel" pattern (Claude Agent SDK,
OpenAI) is many-tool-calls-per-response, each returning its own
result. That's the Option-A shape from Pass 1's audit.

D72 instead specifies a one-call-many-children semantic. That's
closer to the CrewAI collect shape (a Crew of agents runs, one
Crew result) but exposed at the tool seam rather than at
topology-build time. This is a genuinely-substrate design
decision, not a match to any commercial API.

The reason to hold D72's shape rather than adopt many-tool-calls-
per-response: substrate's tool_loop enforces one tool call per
step. Multiple tool_calls per turn would require lifting that
constraint, which touches the loop invariant, not just the tool.
Keeping the "one call, N children" contract lets the fan-out live
purely inside the `delegate` tool without changing how the loop
runs. And D72's UI aggregation ("one ⑂ line expanding to N
children") reads cleanly onto one ToolCall envelope; N sibling
ToolCall envelopes would need UI-level grouping that D72 does
not name.

### Sources

- [Claude Code Subagents and Multi-Agent Orchestration Guide — Delegation, Parallel Fan-Out, and Custom Agent Definitions](https://hidekazu-konishi.com/entry/claude_code_subagents_and_orchestration_guide.html)
- [Fan Out Sub-Agents in Claude Code for 3x Output](https://www.aibuilderclub.com/blog/claude-code-sub-agents-guide)
- [Claude Code Parallel Agents & Workflows — MCP.Directory](https://mcp.directory/blog/claude-code-parallel-subagents-workflows-2026)
- [Claude Code Task Management: Distribute Work Across Agents](https://claudefa.st/blog/guide/agents/task-distribution)
- [LangGraph Map-Reduce: Parallel Execution with Send API](https://machinelearningplus.com/gen-ai/langgraph-map-reduce-parallel-execution/)
- [Best practices for parallel nodes (fanouts) — LangChain Forum](https://forum.langchain.com/t/best-practices-for-parallel-nodes-fanouts/1900)
- [LangGraph Parallel Execution: Fan-Out and Fan-In Patterns](https://markaicode.com/langgraph-parallel-fan-out-fan-in/)
- [OpenAI Function Calling docs](https://developers.openai.com/api/docs/guides/function-calling)
- [Parallel function calls: multiple tools at once](https://theneuralbase.com/openai/learn/intermediate/parallel-function-calls-multiple-tools-at-once/)
- [CrewAI vs LangGraph vs AutoGen: Choosing the Right Multi-Agent AI Framework — DataCamp](https://www.datacamp.com/tutorial/crewai-vs-langgraph-vs-autogen)
- [CrewAI vs AutoGen: Which One Is the Best Framework to Build AI Agents — ZenML Blog](https://www.zenml.io/blog/crewai-vs-autogen)

## Design proposal — questions, options, tradeoffs

Not a set of decisions. A structured set of design questions the
subphase has to answer before code lands. Each question names the
options surfaced by Passes 1-3 and the tradeoff. The Architect
rules.

### Q1. Call shape at the tool seam

D72 says one delegate call, N children, one folded ToolResult.
Three call shapes could produce this:

- **Q1-A. Optional `children: list` parameter on the existing
  `delegate` tool.** `delegate(task, [children], [model], ...)`.
  When `children` is present, spawn each in parallel and fold; when
  absent, current one-child behavior. Same tool, one extra
  parameter.
- **Q1-B. `models: list` variant of the existing parameter.**
  `delegate(task, [models: list[str]], ...)`. Same task on each
  listed model. Simpler than Q1-A. Does not cover the
  different-tasks-per-child case the Architect named.
- **Q1-C. Some list-of-pairs shape (`children: [{task, model},
  ...]`).** Covers both same-task-many-models AND different-tasks
  in one field. More general than Q1-B, more constrained than
  Q1-A.

Tradeoffs: Q1-A is the most general and matches Q1-C at the shape
level. Q1-B matches 20g exactly but leaves the "different tasks"
shape uncovered. Q1-C is the middle path — one field that carries
both same-task and different-task fan-outs.

The design at D72 shows three children named `floor_a`, `floor_b`,
`floor_c` on models `glm-4.6`, `qwen3:8b`, and a third — the task
in the caption reads "derive the stripe floor independently"
(one task, three models). That is Q1-B's exact case; Q1-C carries
it too. Q1-A carries it plus the different-tasks case.

### Q2. Envelope shape on the parent record

D72 is explicit: **one ToolCall envelope, one folded ToolResult**.
Not N ToolCalls, not N ToolResults. What the folded ToolResult
carries is the design question:

- **Q2-A. Answers as a list keyed by child name.** `{answers:
  {floor_a: "...", floor_b: "...", floor_c: "..."}, child_roots:
  {...}, steps: {...}}`. The caller can address answers by name.
- **Q2-B. Answers as an ordered list.** `{answers: [...],
  child_roots: [...], steps: [...]}`. Order matches the input
  `children` list.
- **Q2-C. A single synthesized answer plus per-child records.**
  The tool synthesizes one text from the N answers (concat,
  summarize, first-nonempty) and returns child_roots for
  descend. Less general — some callers want the raw N answers.

Q2-A + Q2-B are equivalent in expressive power. Q2-A is clearer
to the model when it reads the ToolResult back.

### Q3. Fan-in policy

D72 says "one ToolResult when all children finish." That is
wait-all. Two variants a caller might want:

- **Q3-A. Wait-all (D72 default).** Every child finishes; then
  fold. One child hangs → parent hangs to the timeout.
- **Q3-B. Wait-quorum.** Fold when K of N children have finished;
  cancel the rest. Mirrors `code_review_topology`'s pattern. Not
  in D72, but a plausible caller opt-in.
- **Q3-C. Wait-first.** First answer wins; cancel the rest.
  Race pattern. Not in D72.

If the answer is D72 default only, keep it simple. If the caller
should be able to opt into quorum/first, that's another parameter
in Q1's call shape.

### Q4. Failure semantics

One or more children fails. What does the folded ToolResult look
like?

- **Q4-A. Fold-partial.** Successful children's answers are
  present; failed children are marked with `{ok: false, error}`
  in the same result. Overall `ok: true` unless every child
  failed.
- **Q4-B. Fold-all-or-nothing.** Any child failure fails the
  whole ToolResult. Overall `ok: false`.
- **Q4-C. Fold-partial with a threshold.** Configurable minimum
  successful count.

Q4-A matches how humans reason about a fan-out ("give me answers
from three, if one flakes report it and use the other two"). Q4-B
is stricter — closer to `all_completed` termination.

### Q5. Depth counting under fan-out

Today `max_depth=2` bounds a linear chain. Under fan-out the
question splits:

- **Q5-A. Depth is chain length.** A fan-out at depth 1 puts each
  child at depth 2. Each child's own delegate call would be at
  depth 3 — over the cap, refused. Chain-depth is unchanged from
  today.
- **Q5-B. Depth counts fan-outs separately from chain steps.**
  Fan-out is a horizontal step, not a vertical one. Each child is
  still at depth 1 for chain purposes; the child can itself
  fan-out at depth 2. More permissive.
- **Q5-C. Lift `max_depth`.** Section 20f shows five nested
  levels. If the design's intent is five is normal, the cap
  should rise. Separate ruling from fan-out itself.

Q5-A is the least surprising given current substrate. Q5-B invites
the "spin up three, each spins up three" tree the Architect
described — 9 grandchildren, all at depth 2 chain but depth 4
fan-out. Q5-C is the wider cap question.

The Architect's own words: "the child that is qwen 3a b actually
is like okay I will spin up three parallel separate ones." That
reads as Q5-B — a child receiving a delegate can itself fan-out.
Under Q5-A the child cannot delegate further because it is at
`max_depth`. Q5-B is needed to support the case.

### Q6. Talkability under fan-out

D70 makes talkability a topology property. `delegate`'s default
child factory produces a talkable child (`tool_loop_topology(...,
walkthrough=True)`). Fan-out inherits this default. Section 20c
shows a non-talkable child (tool-only runner, no prompt box). The
question: does the fan-out call accept a per-child talkability
flag, or is talkability fixed to the parent's default?

- **Q6-A. Fixed.** All children are talkable (or all not),
  inherited from the parent's tool.
- **Q6-B. Per-child override.** The `children` entries can carry
  `talkable: false` to build a non-tool_loop child factory.
  Matches 20c's design intent.

### Q7. Vocabulary additions in v0.1

The current lock at `web/vm/signals/versions/0.1.json` has 30
tags. Fan-out delegation adds:

- Something like **`DELEGATE_FAN_OUT_STARTED`** on the parent —
  fires when the delegate ToolCall is a fan-out. Payload: number
  of children, driver-per-child list. Distinct from the plain
  `STREAM_ENVELOPE_APPENDED` on the ToolCall.
- Something like **`DELEGATE_CHILD_UPDATED`** on the parent —
  fires when a child's status transitions (running → parked,
  parked → done). Payload: child index, new status. Feeds D72's
  "2 running · 1 parked" status line.
- Something like **`DELEGATE_FAN_OUT_COMPLETED`** on the parent —
  fires when the fold lands. Payload: success count, failure
  count.

Whether these are locked in v0.1 (before ratification) or v0.2
(after ratification) is a discipline call. Adding to v0.1 delays
ratification; adding to v0.2 ratifies v0.1 knowing the fan-out
tags come next.

### Q8. Reveal-shell UI

The tool card today renders one ToolCall per row. D72 says one
`⑂` line, expandable to a child list, `↑↓` walks the rows, `↵`
descends. The engineering work:

- New tool-card variant when `ToolCall.tool === "delegate"` AND
  payload.args carries `children`.
- Per-child sub-row rendering: name, driver, record id, event
  count, live status, latest headline.
- Keyboard binding: `↑↓` walks children; `↵` calls
  `attachRecordRoot(children[selected].child_root)`.
- Depth-hue accent per D70 rule.
- Live mini-stream: the inset can either poll `/api/records/by-
  path/events` per child or aggregate the multi-child streams
  into one merged event view. D38 shows the per-child mini-
  stream; that argues per-child polling.

### Q9. Palette exposure

D3 rules out `/delegate` as a user slash. The palette should NOT
carry a delegate command. But the user asked for "documentation
on in the command palette as well. Right? Setting the delegation
style." That reads as **discoverability of delegation shapes**,
not a slash to invoke them. The palette's `/help` could carry a
section describing the fan-out shapes available to the model, so
the user knows what to ask the agent to do. Not a command, a
reference.

### Q10. Nested fan-out

If Q5-B (fan-out is not a chain step), a child spawned by fan-out
can itself fan-out. The parent's ToolResult then contains N
children, some of which have their own N grandchildren. The
folded answer's structure grows a level. The reveal shell's card
needs to render a nested expandable — 20e is exactly this shape,
two levels of nested view. Substrate already supports the record
structure (child records at any depth); the UI would need
recursive rendering.

### Q11. Assay flows

Once the shape is settled, the shakeout gets three new flows:

- `tool_delegate_many_same_task` — one call, N models, all park.
- `tool_delegate_many_different_tasks` — one call, N tasks (Q1-A
  or Q1-C shape).
- `tool_delegate_many_nested` — one call, each child itself
  fan-outs (Q5-B / Q10 shape).

Plus additions to existing flows:

- `tool_delegate` grows an assertion that D72's envelope shape
  landed: one ToolCall, one ToolResult with N answers.
- `stream_reconnect` might need a variant against a fan-out
  in-flight — killing the server while three children are running.

### Recommended reading order for the Architect ruling

Q1 (call shape), then Q5 (depth counting), then Q2/Q3/Q4 (envelope
+ fan-in + failure). The rest fall out once those four are ruled.
Q11 (assay flows) is the shakeout wiring after the shape is set.

## What lands after this memo

- Architect rules on Q1-Q10 in `## Decisions` on the substrate-ui
  BLACKBOARD.
- Sprint cards land under `sprints/`: one for the substrate-side
  delegate signature change, one for the reveal-shell UI card,
  one for the vocabulary additions, one for the shakeout Axis-C
  flows.
- Only after those close does v0.1 ratify (or a v0.2 lock replaces
  v0.1 if the vocabulary bumps).
