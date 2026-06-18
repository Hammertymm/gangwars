#!/usr/bin/env python3
"""Split approved GW Style standard-event composite and replace event PNGs."""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CURSOR_ASSETS = Path(
    r"C:\Users\jarro\.cursor\projects\c-Projects-gang-wars-GangWars\assets"
)
SOURCE = CURSOR_ASSETS / (
    "c__Users_jarro_AppData_Roaming_Cursor_User_workspaceStorage_b8abd18152c996897b88164cd8a20284"
    "_images_image-3ee52ae2-3ecc-4aba-846e-907342ce59cb.png"
)
EVENTS_DIR = ROOT / "events"
BACKUP_DIR = EVENTS_DIR / "_backup_originals"

STANDARD_EVENTS = [
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

GUTTER_THRESHOLD = 10
GUTTER_DENSITY = 0.95
COLS = 5
ROWS = 2


def gutter_ranges(mask: np.ndarray, axis_size: int) -> list[tuple[int, int]]:
    ranges: list[tuple[int, int]] = []
    in_gutter = False
    start = 0
    for i in range(axis_size):
        if mask[i] and not in_gutter:
            start = i
            in_gutter = True
        elif not mask[i] and in_gutter:
            ranges.append((start, i - 1))
            in_gutter = False
    if in_gutter:
        ranges.append((start, axis_size - 1))
    return ranges


def panel_regions(size: int, gutter_ranges_list: list[tuple[int, int]]) -> list[tuple[int, int]]:
    regions: list[tuple[int, int]] = []
    prev_end = 0
    for gutter_start, gutter_end in sorted(gutter_ranges_list, key=lambda pair: pair[0]):
        if gutter_start > prev_end:
            regions.append((prev_end, gutter_start))
        prev_end = gutter_end + 1
    if prev_end < size:
        regions.append((prev_end, size))
    return regions


def detect_grid_bounds(im: Image.Image) -> tuple[list[tuple[int, int]], list[tuple[int, int]]]:
    arr = np.array(im.convert("RGB"))
    col_dark = (arr.max(axis=2) < GUTTER_THRESHOLD).mean(axis=0) > GUTTER_DENSITY
    row_dark = (arr.max(axis=2) < GUTTER_THRESHOLD).mean(axis=1) > GUTTER_DENSITY
    col_regions = panel_regions(im.width, gutter_ranges(col_dark, im.width))
    row_regions = panel_regions(im.height, gutter_ranges(row_dark, im.height))
    if len(col_regions) != COLS or len(row_regions) != ROWS:
        raise ValueError(f"Expected {COLS}x{ROWS} grid, got {len(col_regions)}x{len(row_regions)}")
    return col_regions, row_regions


def backup_existing() -> None:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    for name in STANDARD_EVENTS:
        src = EVENTS_DIR / name
        if not src.is_file():
            raise FileNotFoundError(f"Missing standard event asset: {src}")
        shutil.copy2(src, BACKUP_DIR / name)


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Composite not found: {SOURCE}")

    backup_existing()
    im = Image.open(SOURCE)
    cols, rows = detect_grid_bounds(im)

    mapping: list[dict] = []
    idx = 0
    for row_idx, (y0, y1) in enumerate(rows):
        for col_idx, (x0, x1) in enumerate(cols):
            panel = im.crop((x0, y0, x1, y1))
            name = STANDARD_EVENTS[idx]
            original = Image.open(EVENTS_DIR / name)
            out_path = EVENTS_DIR / name
            panel.save(out_path, format="PNG")
            mapping.append(
                {
                    "filename": name,
                    "grid": f"r{row_idx}c{col_idx}",
                    "crop": [x0, y0, x1, y1],
                    "new_size": list(panel.size),
                    "previous_size": list(original.size),
                    "new_mode": panel.mode,
                    "previous_mode": original.mode,
                    "manual_match": False,
                }
            )
            print(f"  {name:24s}  {list(panel.size)}  ({mapping[-1]['grid']})")
            idx += 1

    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "backup_dir": str(BACKUP_DIR.relative_to(ROOT)),
        "source": str(SOURCE),
        "panels_extracted": len(mapping),
        "files_replaced": len(mapping),
        "manual_matches": [],
        "mapping": mapping,
    }
    report_path = ROOT / "docs" / "review" / "standard-event-replacement.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"\nBacked up to {BACKUP_DIR.relative_to(ROOT)}/")
    print(f"Replaced {len(mapping)} standard event images.")
    print(f"Report: {report_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
