#!/usr/bin/env python3
"""Split the 2×5 standard-event grid into individual popup art assets."""

from __future__ import annotations

import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from event_art import export_panel  # noqa: E402

SOURCE = ROOT / "assets" / "event-grid-source.png"
OUT_DIR = ROOT / "events"
COLS = 5
ROWS = 2

# row-major: top row L→R, then bottom row L→R
EVENTS = [
    "the_feds.png",
    "ambushed_rolled.png",
    "dead_drop.png",
    "packing_iron.png",
    "upgrade_available.png",
    "shortage.png",
    "buying_frenzy.png",
    "flooded_market.png",
    "super_rare_event.png",
    "rare_event_intel.png",
]


def column_bounds(width: int) -> list[tuple[int, int]]:
    col_w = width // COLS
    bounds: list[tuple[int, int]] = []
    for i in range(COLS):
        x0 = i * col_w
        x1 = width if i == COLS - 1 else (i + 1) * col_w
        bounds.append((x0, x1))
    return bounds


def row_bounds(height: int) -> list[tuple[int, int]]:
    row_h = height // ROWS
    return [(0, row_h), (row_h, height)]


def backup_existing() -> Path | None:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    backup = OUT_DIR / f"_backup-standard-{stamp}"
    existing = [OUT_DIR / name for name in EVENTS if (OUT_DIR / name).exists()]
    if not existing:
        return None
    backup.mkdir(parents=True)
    for path in existing:
        shutil.copy2(path, backup / path.name)
    return backup


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Source not found: {SOURCE}")

    im = Image.open(SOURCE).convert("RGB")
    cols = column_bounds(im.width)
    rows = row_bounds(im.height)

    backup = backup_existing()
    if backup:
        print(f"Backed up previous standard events to {backup.relative_to(ROOT)}")

    idx = 0
    for ry, (y0, y1) in enumerate(rows):
        for cx, (x0, x1) in enumerate(cols):
            panel = im.crop((x0, y0, x1, y1))
            panel = export_panel(panel, pad=0)
            out = OUT_DIR / EVENTS[idx]
            panel.save(out, optimize=True)
            print(f"  {EVENTS[idx]:24s}  {panel.size}  (crop {x1 - x0}x{y1 - y0}, r{ry}c{cx})")
            idx += 1

    print(f"\nSaved {idx} standard event images to {OUT_DIR.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
