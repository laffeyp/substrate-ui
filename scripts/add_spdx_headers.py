#!/usr/bin/env python3
# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 Peter Laffey
"""Insert SPDX + copyright headers on every source file in substrate-ui/.

Idempotent: a file already carrying `SPDX-License-Identifier` is left alone.
Shebang lines and `<!DOCTYPE html>` stay on line 1; the header lands on line 2.

Usage:
  python scripts/add_spdx_headers.py            # apply
  python scripts/add_spdx_headers.py --check    # report missing; exit 1 if any
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINE_SPDX = "SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0"
LINE_COPY = "Copyright (C) 2026 Peter Laffey"

EXT_HASH = {".py", ".sh"}
EXT_SLASH = {".ts", ".tsx", ".js", ".mjs", ".cjs"}
EXT_HTML = {".html"}

EXCLUDE_DIRS = {
    "node_modules",
    "_deprecated",
    "dist-electron",
    ".pytest_cache",
    "runs",
    "captures",
}
EXCLUDE_SUBSTRINGS = (
    "/build/python/",
    "/build/python-native/",
    "/web/dist/",
    "/.git/",
)


def in_scope(path: Path) -> bool:
    if path.suffix not in EXT_HASH | EXT_SLASH | EXT_HTML:
        return False
    rel = path.relative_to(ROOT).as_posix()
    for part in path.relative_to(ROOT).parts:
        if part in EXCLUDE_DIRS:
            return False
    for s in EXCLUDE_SUBSTRINGS:
        if s.strip("/") in rel:
            return False
    return True


def header_for(suffix: str) -> list[str]:
    if suffix in EXT_HASH:
        return [f"# {LINE_SPDX}", f"# {LINE_COPY}"]
    if suffix in EXT_SLASH:
        return [f"// {LINE_SPDX}", f"// {LINE_COPY}"]
    if suffix in EXT_HTML:
        return [f"<!-- {LINE_SPDX} -->", f"<!-- {LINE_COPY} -->"]
    raise ValueError(suffix)


def is_shebang(line: str) -> bool:
    return line.startswith("#!")


def is_doctype(line: str) -> bool:
    return line.lstrip().lower().startswith("<!doctype")


def already_has_header(text: str) -> bool:
    head = text.splitlines()[:6]
    return any("SPDX-License-Identifier" in line for line in head)


def insert_header(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if already_has_header(text):
        return False
    lines = text.splitlines(keepends=True)
    header = [line + "\n" for line in header_for(path.suffix)]
    first = lines[0] if lines else ""
    if path.suffix == ".html" and is_doctype(first):
        new = [first, *header, *lines[1:]]
    elif path.suffix in EXT_HASH | EXT_SLASH and is_shebang(first):
        new = [first, *header, *lines[1:]]
    else:
        new = [*header, *lines]
    path.write_text("".join(new), encoding="utf-8")
    return True


def iter_files() -> list[Path]:
    out: list[Path] = []
    for p in ROOT.rglob("*"):
        if p.is_file() and in_scope(p):
            out.append(p)
    return sorted(out)


def main() -> int:
    check_only = "--check" in sys.argv
    files = iter_files()
    missing: list[Path] = [p for p in files if not already_has_header(p.read_text(encoding="utf-8"))]
    if check_only:
        for p in missing:
            print(p.relative_to(ROOT))
        print(f"[spdx] {len(missing)} / {len(files)} missing", file=sys.stderr)
        return 1 if missing else 0
    changed = 0
    for p in missing:
        if insert_header(p):
            changed += 1
    print(f"[spdx] applied to {changed} / {len(files)} files", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
