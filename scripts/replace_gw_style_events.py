#!/usr/bin/env python3
"""Split GW Style event composites, backup originals, and replace event PNGs."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CURSOR_ASSETS = Path(
    r"C:\Users\jarro\.cursor\projects\c-Projects-gang-wars-GangWars\assets"
)
EVENTS_DIR = ROOT / "events"
BACKUP_DIR = EVENTS_DIR / "_backup_originals"

COMPOSITES = [
    {
        "source": CURSOR_ASSETS
        / "c__Users_jarro_AppData_Roaming_Cursor_User_workspaceStorage_b8abd18152c996897b88164cd8a20284_images_image-d53c13d4-e54f-408b-ae5f-ea8e36f044d1.png",
        "label": "standard",
        "events": [
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
        ],
    },
    {
        "source": CURSOR_ASSETS
        / "c__Users_jarro_AppData_Roaming_Cursor_User_workspaceStorage_b8abd18152c996897b88164cd8a20284_images_image-0014eee9-5031-4789-8c1a-851ec252c190.png",
        "label": "super_rare",
        "events": [
            "super_ruth.png",
            "super_lindbergh.png",
            "super_dempsey.png",
            "super_wales.png",
            "super_kkrevue.png",
            "super_mauretania.png",
            "super_ziegfeld.png",
            "super_wallst.png",
            "super_walker.png",
            "super_hollywood.png",
        ],
    },
    {
        "source": CURSOR_ASSETS
        / "c__Users_jarro_AppData_Roaming_Cursor_User_workspaceStorage_b8abd18152c996897b88164cd8a20284_images_image-b2e019f8-bbe3-4933-a59c-33301ccced1f.png",
        "label": "rare",
        "events": [
            "rare_capone.png",
            "rare_luciano.png",
            "rare_schultz.png",
            "rare_madden.png",
            "rare_rothstein.png",
            "rare_lansky.png",
            "rare_ellington.png",
            "rare_armstrong.png",
            "rare_rumrow.png",
            "rare_midnight.png",
        ],
    },
]

GUTTER_THRESHOLD = 10
GUTTER_DENSITY = 0.95
COLS = 5
ROWS = 2


def gutter_ranges(mask: np.ndarray, axis_size: int) -> list[tuple[int, int]]:
    """Return contiguous index ranges where mask is True (gutter pixels)."""
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
    """Regions between gutters, excluding gutter pixels."""
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

    col_gutters = gutter_ranges(col_dark, im.width)
    row_gutters = gutter_ranges(row_dark, im.height)

    col_regions = panel_regions(im.width, col_gutters)
    row_regions = panel_regions(im.height, row_gutters)

    if len(col_regions) != COLS or len(row_regions) != ROWS:
        raise ValueError(
            f"Expected {COLS}x{ROWS} panels, got {len(col_regions)} cols x {len(row_regions)} rows "
            f"(col_gutters={col_gutters}, row_gutters={row_gutters})"
        )
    return col_regions, row_regions


def split_composite(source: Path, event_names: list[str]) -> list[dict]:
    im = Image.open(source)
    cols, rows = detect_grid_bounds(im)
    records: list[dict] = []
    idx = 0
    for row_idx, (y0, y1) in enumerate(rows):
        for col_idx, (x0, x1) in enumerate(cols):
            panel = im.crop((x0, y0, x1, y1))
            name = event_names[idx]
            records.append(
                {
                    "filename": name,
                    "grid": f"r{row_idx}c{col_idx}",
                    "crop": [x0, y0, x1, y1],
                    "size": list(panel.size),
                    "mode": panel.mode,
                    "panel": panel,
                }
            )
            idx += 1
    return records


def backup_originals(filenames: list[str]) -> list[str]:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backed_up: list[str] = []
    for name in filenames:
        src = EVENTS_DIR / name
        if not src.is_file():
            raise FileNotFoundError(f"Missing event asset to back up: {src}")
        dst = BACKUP_DIR / name
        if not dst.exists():
            shutil.copy2(src, dst)
        backed_up.append(name)
    return backed_up


def main() -> None:
    all_events = [name for composite in COMPOSITES for name in composite["events"]]
    if len(all_events) != len(set(all_events)):
        raise ValueError("Duplicate filenames in mapping")

    backed_up = backup_originals(all_events)
    print(f"Backed up {len(backed_up)} files to {BACKUP_DIR.relative_to(ROOT)}/")

    mapping: list[dict] = []
    for composite in COMPOSITES:
        source = composite["source"]
        if not source.is_file():
            raise FileNotFoundError(f"Composite not found: {source}")
        panels = split_composite(source, composite["events"])
        for record in panels:
            name = record["filename"]
            original = Image.open(EVENTS_DIR / name)
            panel: Image.Image = record.pop("panel")
            out_path = EVENTS_DIR / name
            panel.save(out_path, format="PNG")
            mapping.append(
                {
                    "composite": composite["label"],
                    "filename": name,
                    "grid": record["grid"],
                    "crop": record["crop"],
                    "new_size": record["size"],
                    "original_size": list(original.size),
                    "original_mode": original.mode,
                    "new_mode": panel.mode,
                }
            )
            print(f"  [{composite['label']}] {record['grid']} -> {name}  {record['size']}")

    report = {
        "backup_dir": str(BACKUP_DIR.relative_to(ROOT)),
        "backed_up": len(backed_up),
        "panels_extracted": len(mapping),
        "replaced": len(mapping),
        "unchanged_godlike": sorted(
            p.name for p in EVENTS_DIR.glob("godlike_*.png") if p.name not in all_events
        ),
        "mapping": mapping,
    }
    report_path = ROOT / "docs" / "review" / "gw-style-event-replacement.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"\nWrote report to {report_path.relative_to(ROOT)}")
    print(f"Extracted and replaced {len(mapping)} panels.")


if __name__ == "__main__":
    main()
