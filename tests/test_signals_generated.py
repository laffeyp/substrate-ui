# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Sprint 363: the vocabulary's generated names match current.json.

Fails when current.json changes and nobody regenerated web/vm/signals.gen.ts,
electron/signals.gen.ts or signals_gen.py (regenerate: `python3 scripts/gen_signals.py`).
"""

from __future__ import annotations

import gen_signals


def test_generated_signal_files_are_current() -> None:
    stale = [str(p) for p, text in gen_signals.outputs().items() if p.read_text() != text]
    assert not stale, f"stale: {stale}; run `python3 scripts/gen_signals.py`"
