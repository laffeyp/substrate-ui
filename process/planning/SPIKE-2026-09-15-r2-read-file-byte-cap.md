# SPIKE r2 — read_file, the byte cap, and the lazy-reader design · 2026-09-15

Supersedes r1. r1 read the code and recommended sizing knobs
(`_MAX_READ_LINES = 500`, tool-aware retry message). Both moves missed
the point of the design.

## The philosophy in the current-design-direction docs

`current-design-direction/product-spec/PRODUCT-SPEC-2026-08-17-round12.md`
§5d.1 names the constraint verbatim:

> Models are lazy readers — given a big blob, they skim, decide they
> have enough, and stop. Models also have hard context ceilings —
> feed one 200 KB record dump into a 32 K-token window and the call
> fails. MCP protocol doesn't fix either problem. The tools have to
> be designed for them.

The design response is the *progressive-disclosure gradient*: every
read tool caps output, returns `has_more: true` plus a cursor (or an
actionable next call), and forces the model to keep asking. Reading
the whole thing is possible but never automatic. Budget cap per
call, always. From the same section:

> A lazy model that calls `inspect_record(rec)` and stops there gets
> the cheapest useful answer (counts + status). A model that decides
> it needs more escalates.

The bar for a read tool is not "return more data faster." It is
"never let the model skim past content, never leave the model without
an actionable next call."

## What read_file actually does

`substrate/src/substrate/topologies/tool_loop/tools.py:148`:

```
read_file(path, offset=1, limit=2000) → text
```

Line-numbered output. When the window does not reach EOF, appends:

```
… <N> more line(s); read_file(path, <next_line>) for the rest
```

That marker is exactly the shape the design demands: actionable, names
the next call, forces the model to keep asking.

## What the tool-loop byte cap does

`substrate/src/substrate/topologies/tool_loop/__init__.py:335`:

```
_MAX_RESULT_BYTES = 12_000
if len(raw) > _MAX_RESULT_BYTES:
    output = f"[{tool} output was {len(raw)} bytes — too large to inline; narrow the request]"
```

When tripped, the tool loses ALL content and hands the model a
sentence with no verb, no cursor, no next call. The Kimi K2.7 model's
own review of this failure names it precisely:

> The tool did not return any content, did not tell me what the limit
> is, and did not give me a cursor to continue. Worse, I then
> repeated the same mistake multiple times instead of narrowing.

That is the byte-cap stub violating the design directly.

## Why the byte cap trips

`read_file`'s default window is 2000 lines. A 2000-line window of
typical seven-byte lines already exceeds 12 KB after the
`<line-number>\t` overhead. The line-pagination marker never gets
rendered because the outer byte cap fires first on any moderately
long file.

## The r2 fix

The byte cap keeps its size — 12 KB stays. The point is not to
raise it. The failure mode changes: when the byte cap would trip on
`read_file`, the outer wrap does NOT swallow the content. It
truncates to whatever fits under the cap and appends the same
pagination marker `read_file` emits when its own line window doesn't
reach EOF. One shape for both caps. The model learns one pattern.

Concretely, in `tool_loop/__init__.py:335`, replace the tool-agnostic
stub with a per-tool truncation for `read_file`:

```python
if len(raw) > _MAX_RESULT_BYTES and tool == "read_file":
    # Byte-aware truncation with the same pagination marker read_file
    # emits when its own line window doesn't reach EOF. Never return
    # zero content — the design forces the model to keep asking, not
    # to guess.
    text = str(output)
    lines = text.split("\n")
    kept = []
    running = 0
    for line in lines:
        needed = len(line) + 1  # + newline
        if running + needed > _MAX_RESULT_BYTES - 200:  # leave room for the marker
            break
        kept.append(line)
        running += needed
    last_line_no = int(kept[-1].split("\t", 1)[0]) if kept else 0
    marker = f"… byte cap hit; read_file({args[0]!r}, {last_line_no + 1}) for the rest"
    output = "\n".join(kept + [marker])
```

For every other tool the current stub is honest — the tool did not
paginate itself, and telling the model "narrow the request" is the
right escalation there. Only `read_file` earns the special path
because only `read_file` has a well-defined continuation call.

## What r2 does not do

- Raise `_MAX_RESULT_BYTES`. The design wants the cap tight.
- Lower `_MAX_READ_LINES`. That was the sizing knob r1 chased. The
  contract is what matters, not the window size.
- Rewrite `read_file` to be byte-aware inside its body. Doing so
  duplicates the same logic in two places. The outer wrap is the
  clean seam.
- Add a `format="raw"` option. The Kimi feedback names it; it is a
  real ergonomic win for `edit_file` flows and a separate change.

## Land order

1. Add the per-tool truncation branch in
   `tool_loop/__init__.py`.
2. Update the `read_file` tool docstring (used to build the
   tools-suite prompt fragment) to name the 12 KB inline cap and the
   pagination shape.
3. A tool_loop test that exercises `read_file` on a file whose full
   output exceeds 12 KB and asserts the model sees a truncated
   window plus a `read_file(path, <next>) for the rest` marker,
   never a `[byte cap hit; narrow the request]` stub.

## Sources

- `current-design-direction/product-spec/PRODUCT-SPEC-2026-08-17-round12.md`
  §5d.1 — the lazy-reader design philosophy.
- `substrate/src/substrate/topologies/tool_loop/tools.py:148` —
  `read_file`.
- `substrate/src/substrate/topologies/tool_loop/__init__.py:335` —
  the outer byte cap.
- The Kimi K2.7 model review of the failure mode (in-session, this
  turn).
