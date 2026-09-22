# SPIKE — read_file pagination vs the tool byte cap · 2026-09-15

## The user's report

A live session called `read_file` on a 14169-byte file. The client
saw `[read_file output was 14169 bytes — too large to inline; narrow
the request]`. The user's expectation is that read_file paginates and
just works for a 14KB file.

## Read the code

`read_file` is paginated. `substrate/src/substrate/topologies/tool_loop/tools.py:148`.
The signature is `read_file(path, offset=1, limit=2000)`. When the
window does not reach EOF, the tool emits a trailing marker:

```
… <N> more line(s); read_file(path, <next_line>) for the rest
```

That marker is actionable — the model can call `read_file(path,
<next_line>)` to page. Default line window is 2000 lines
(`_MAX_READ_LINES`).

The outer tool-loop wraps every ToolResult in a byte cap.
`substrate/src/substrate/topologies/tool_loop/__init__.py:335`:

```python
_MAX_RESULT_BYTES = 12_000
...
if len(raw) > _MAX_RESULT_BYTES:
    output = f"[{tool} output was {len(raw)} bytes — too large to inline; narrow the request]"
```

The comment on the cap: keep the ToolResult under the 16 KiB
blob-offload threshold so the loop-control fields (step) stay on the
frame.

## Where the tension lives

read_file's `_MAX_READ_LINES = 2000` and the loop's
`_MAX_RESULT_BYTES = 12_000` are inconsistent. Every read_file output
is prefixed by a `<line-number>\t` (5–7 bytes of overhead per line).
A 2000-line window of six-character lines already exceeds 12 KiB.
read_file's own line pagination fires only when the window is
shorter than the file; the outer byte cap fires when the total
serialized output exceeds 12 KiB. The two caps target the same
resource with different units and are not aligned.

Effect on the model:
- The read_file marker read `read_file(path, <next_line>)` — a
  concrete next call.
- The outer cap's stub reads `narrow the request` — no verb, no
  parameter, no path forward. The user (and the model) is stuck.

## The three fixes

Numbered by how invasive each is.

**1. Lower `_MAX_READ_LINES`.** `_MAX_READ_LINES = 500` fits a typical
7-byte-per-line window under 12 KiB. read_file's own pagination
marker fires more often; the outer cap fires almost never on
read_file output. One-line change. Ships now.

**2. Make the byte-cap message tool-aware.** When the tripping tool
is read_file, the stub reads:
```
[read_file output was <N> bytes — too large to inline. Retry with a
smaller limit: read_file(path, 1, 500)]
```
That is actionable for a model that has just seen its call bounce.
Cheap change to the cap site.

**3. Have every tool self-cap by bytes with an actionable marker.**
The outer cap becomes a safety net that never fires under normal use.
read_file grows a byte-aware truncation inside its body — walks the
window until it approaches ~10 KiB, emits the pagination marker with
a concrete next offset. Every other tool grows the same discipline.
Substantial. Sprint-sized.

## Recommendation

Land 1 and 2 together this afternoon. Track 3 as a follow-up sprint
that touches every tool.

## Land order

1. `_MAX_READ_LINES = 500` in `tools.py`.
2. The byte-cap stub in `tool_loop/__init__.py` grows a
   `if tool == "read_file":` branch with the actionable retry syntax.
3. A tool_loop test that exercises a `read_file` on a file whose
   full output would exceed 12 KiB and asserts the model sees the
   pagination marker, not the byte-cap stub.

## Not doing

- Raising `_MAX_RESULT_BYTES`. The 16 KiB blob-offload threshold is
  a substrate-kernel property; the 12 KiB cap sits under it with a
  safety margin. Moving it up risks a payload that gets offloaded and
  wedges the loop (the original bug the cap was designed for).
- Chunk-streaming read_file. ToolProgress is queued for phase 8
  item 8 and can carry chunks. read_file today should not depend on
  that infrastructure.
