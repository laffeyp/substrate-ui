"""Build build/icon.icns from the canonical mascot (UI sprint 097; review 2026-09-28 F10).

The packaged app shipped Electron's default icon. Source: ../substrate-art/MASCOT-canonical-oref.png
(1024 x 1024). macOS does not round app icons itself, so the artwork is placed on Apple's icon grid:
an 824 x 824 rounded rectangle (corner radius ~185) centred on a transparent 1024 canvas, then
`iconutil` packs the ten standard sizes into an .icns.

Needs Pillow (`python3 -m pip install pillow`) and macOS `iconutil`. The output is committed, so a
release build does not depend on either.

  python3 scripts/make_icon.py
"""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

REPO = Path(__file__).resolve().parent.parent
SRC = REPO.parent / "substrate-art" / "MASCOT-canonical-oref.png"
OUT = REPO / "build" / "icon.icns"
CANVAS, ART, RADIUS = 1024, 824, 185


def master() -> Image.Image:
    art = Image.open(SRC).convert("RGBA").resize((ART, ART), Image.LANCZOS)
    mask = Image.new("L", (ART, ART), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, ART - 1, ART - 1), radius=RADIUS, fill=255)
    art.putalpha(mask)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    off = (CANVAS - ART) // 2
    canvas.paste(art, (off, off), art)
    return canvas


def main() -> None:
    img = master()
    with tempfile.TemporaryDirectory() as d:
        iconset = Path(d) / "icon.iconset"
        iconset.mkdir()
        for size in (16, 32, 128, 256, 512):
            img.resize((size, size), Image.LANCZOS).save(iconset / f"icon_{size}x{size}.png")
            img.resize((size * 2, size * 2), Image.LANCZOS).save(iconset / f"icon_{size}x{size}@2x.png")
        OUT.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["iconutil", "-c", "icns", str(iconset), "-o", str(OUT)], check=True)
    img.save(REPO / "build" / "icon-1024.png")
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes) from {SRC.name}")


if __name__ == "__main__":
    if shutil.which("iconutil") is None:
        raise SystemExit("make_icon: iconutil not found (macOS only)")
    main()
