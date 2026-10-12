"""UI sprint 162: PATCH /api/session/<id> keeps two lists of its fields, the allow-list
(`_PATCHABLE`) and the `if "<field>" in body` branches that handle them. U161 added a branch for
`guidance` and not the allow-list entry, so every `/guidance` was refused as an unknown field. This
test reads both from the source and holds them equal.
"""

from __future__ import annotations

import re
from pathlib import Path

SOURCE = (Path(__file__).resolve().parents[1] / "server.py").read_text()


def _patch_section() -> str:
    start = SOURCE.index("_PATCHABLE = {")
    end = SOURCE.index("self._json(", SOURCE.index('if "driver_params" in body:', start))
    return SOURCE[start:end]


def test_every_handled_field_is_patchable_and_every_patchable_field_is_handled() -> None:
    section = _patch_section()
    allow_block = section[: section.index("}") + 1]
    allowed = set(re.findall(r'^\s+"(\w+)",', allow_block, re.MULTILINE))
    handled = set(re.findall(r'if "(\w+)" in body', section))
    assert allowed == handled, f"allow-list only: {allowed - handled}; handled only: {handled - allowed}"
    # The Length and Tone controls are both allowed and handled through the Control enum.
    assert "*Control," in allow_block and "control in body for control in Control" in section
