# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 096: web/vm/envelope_kinds.gen.ts matches what the kernel registers.

Fails when the kernel adds, renames or removes an envelope kind and nobody regenerated the
client's list (regenerate: `python scripts/gen_kinds.py`). tsc then forces the new kind to be
classified in session_controller.ts's KIND_DISPOSITION table.
"""

from __future__ import annotations


import gen_kinds  # noqa: E402


def test_generated_kinds_file_is_current() -> None:
    assert gen_kinds.OUT.read_text() == gen_kinds.render(gen_kinds.session_kinds()), (
        "web/vm/envelope_kinds.gen.ts is stale: run `python scripts/gen_kinds.py`"
    )


def test_generated_statuses_file_is_current() -> None:
    """UI sprint 107: SessionStatus and TaskStatus come from the kernel's enums too."""
    assert gen_kinds.STATUS_OUT.read_text() == gen_kinds.render_statuses(), (
        "web/vm/statuses.gen.ts is stale: run `python scripts/gen_kinds.py`"
    )


def test_generated_controls_file_is_current() -> None:
    """UI sprint 143 / kernel K296: the Length and Tone positions come from the kernel's enums."""
    assert gen_kinds.CONTROLS_OUT.read_text() == gen_kinds.render_controls(), (
        "web/vm/controls.gen.ts is stale: run `python scripts/gen_kinds.py`"
    )


def test_lifecycle_kinds_carry_the_reserved_prefix() -> None:
    kinds = gen_kinds.session_kinds()
    assert "substrate.RunFinalised" in kinds
    assert "RunFinalised" not in kinds  # the Sep 23 – Oct 1 drift
    assert "ToolProgress" in kinds  # injected, not registered (tool_loop.INJECTED_EVENT_KINDS)


def test_language_measures_gen_is_current() -> None:
    # UI sprint 168: the kernel's language catalog, watched measures and intents.
    assert gen_kinds.LANGUAGE_OUT.read_text() == gen_kinds.render_language_measures(), (
        "web/vm/language_measures.gen.ts is stale: run `python scripts/gen_kinds.py`"
    )
