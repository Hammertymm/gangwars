#!/usr/bin/env python3
"""Slice 2×5 event art grid into the 10 standard travel/market event PNGs."""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "event-grid-source.png"
OUT_DIR = ROOT / "events"

# Row-major: top-left → top-right, then bottom row (matches attached sheet layout).
NAMES = [
    "the_feds",
    "ambushed_rolled",
    "dead_drop",
    "packing_iron",
    "upgrade_available",
    "shortage",
    "buying_frenzy",
    "flooded_market",
    "super_rare_event",
    "rare_event_intel",
]

COLS, ROWS = 5, 2
BORDER_TRIM = 5  # px inside each cell — drops orange grid lines


def main():
    if not SOURCE.exists():
        raise SystemExit(f"Source grid not found: {SOURCE}")
    im = Image.open(SOURCE).convert("RGBA")
    w, h = im.size
    cell_w, cell_h = w // COLS, h // ROWS
    idx = 0
    for r in range(ROWS):
        for c in range(COLS):
            left = c * cell_w + BORDER_TRIM
            top = r * cell_h + BORDER_TRIM
            right = (c + 1) * cell_w - BORDER_TRIM
            bottom = (r + 1) * cell_h - BORDER_TRIM
            panel = im.crop((left, top, right, bottom))
            out = OUT_DIR / f"{NAMES[idx]}.png"
            panel.save(out, optimize=True)
            print(f"ok {out.name} {panel.size}")
            idx += 1


if __name__ == "__main__":
    main()
