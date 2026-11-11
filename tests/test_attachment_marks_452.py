# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""The reference line's opening words, written by the server and read by the page, are the same (UI sprint 452).
server.py writes them (ATTACH_NOT_INLINED, ATTACH_NOT_FOUND) and web/reveal/transcript/attachments.ts marks a chip
whose text opens with one as sent by reference; a change on one side alone fails here."""

from __future__ import annotations

from pathlib import Path

import server

PAGE = Path(__file__).resolve().parent.parent / "web" / "reveal" / "transcript" / "attachments.ts"


def test_the_page_reads_the_server_s_reference_lines() -> None:
    page = PAGE.read_text()
    assert f'export const NOT_INLINED = "{server.ATTACH_NOT_INLINED}";' in page
    assert f'export const NOT_FOUND = "{server.ATTACH_NOT_FOUND}";' in page
