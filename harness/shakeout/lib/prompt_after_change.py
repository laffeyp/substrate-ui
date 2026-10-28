# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""For each SessionChanged in a session record, whether the prompt built for that message carries
the text the change wrote (UI sprint 167; kernel K299, vocabulary § V).

Prints one JSON line: [{"field", "old", "new", "message", "written", "new_text_in_prompt",
"old_text_in_prompt"}]. `written`: the non-empty fragments the change wrote (a generation from the
message's seq up to the next message's). `new_text_in_prompt`: each appears in the first
PromptComposed after the change. `old_text_in_prompt`: a non-empty
fragment of the same source written before the change appears in it.
"""

from __future__ import annotations

import json
import sys

from substrate import api


def main(root: str) -> None:
    events = list(api.read_record(root, resolve_blobs=True))
    out = []
    for i, e in enumerate(events):
        if e["kind"] != "SessionChanged":
            continue
        msg = next(x for x in reversed(events[:i]) if x["kind"] == "UserMessage")
        prompt = next((x for x in events[i:] if x["kind"] == "PromptComposed"), None)
        whole = ((prompt or {}).get("payload") or {})
        text = str(whole.get("system") or "") + "\n" + str(whole.get("text") or "")
        # The text this change wrote, however its generation was tagged (the message's seq from
        # K299; the change's own seq before): a generation from this message up to the next one.
        nxt = next((x["seq"] for x in events[i:] if x["kind"] == "UserMessage"), float("inf"))
        written = [
            x["payload"] for x in events
            if x["kind"] == "PromptFragment"
            and isinstance((x["payload"].get("provenance") or {}).get("generation"), int)
            and msg["seq"] <= x["payload"]["provenance"]["generation"] < nxt
        ]
        sources = {f["source"] for f in written}
        older = [
            x["payload"]["text"] for x in events[:i]
            if x["kind"] == "PromptFragment" and x["payload"]["source"] in sources and x["payload"]["text"]
            and x["payload"]["text"] not in {f["text"] for f in written}
        ]
        out.append({
            "field": e["payload"]["field"], "old": e["payload"]["old"], "new": e["payload"]["new"],
            "message": msg["payload"].get("text", ""),
            "written": len([f for f in written if f["text"]]),
            "new_text_in_prompt": prompt is not None and all(f["text"] in text for f in written if f["text"]),
            "old_text_in_prompt": any(t in text for t in older),
        })
    print(json.dumps(out))


if __name__ == "__main__":
    main(sys.argv[1])
