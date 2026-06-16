#!/usr/bin/env python3
"""Split the 1×5 godlike event grid into individual popup art assets."""

from __future__ import annotations

import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from event_art import export_panel  # noqa: E402

SOURCE = ROOT / "assets" / "godlike-event-grid-source.png"
FALLBACK_SOURCE = Path(
    r"C:\Users\jarro\.cursor\projects\c-Projects-gang-wars-GangWars\assets"
    r"\c__Users_jarro_AppData_Roaming_Cursor_User_workspaceStorage_b8abd18152c996897b88164cd8a20284"
    r"_images_image-bdfac008-4169-4ccf-a975-61ead2dc3c2c.png"
)
OUT_DIR = ROOT / "events"

EVENTS = [
    "godlike_in_town.png",
    "godlike_interest.png",
    "godlike_move.png",
    "godlike_celebration.png",
    "godlike_history.png",
]

V_GUTTERS = [208, 411, 609, 817]
GUTTER_TRIM = 3
EDGE_TRIM = 2


def source_path() -> Path:
    if SOURCE.exists():
        return SOURCE
    if FALLBACK_SOURCE.exists():
        return FALLBACK_SOURCE
    raise FileNotFoundError("godlike event grid source image not found")


def column_bounds(width: int) -> list[tuple[int, int]]:
    edges = [0] + V_GUTTERS + [width]
    return [
        (edges[i] + (GUTTER_TRIM if i > 0 else EDGE_TRIM), edges[i + 1] - (GUTTER_TRIM if i < 4 else EDGE_TRIM))
        for i in range(5)
    ]


def backup_existing() -> Path | None:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    backup = OUT_DIR / f"_backup-godlike-{stamp}"
    existing = [OUT_DIR / name for name in EVENTS if (OUT_DIR / name).exists()]
    if not existing:
        return None
    backup.mkdir(parents=True)
    for path in existing:
        shutil.copy2(path, backup / path.name)
    return backup


def main() -> None:
    src = source_path()
    if not SOURCE.exists() and src == FALLBACK_SOURCE:
        shutil.copy2(src, SOURCE)

    im = Image.open(src).convert("RGB")
    cols = column_bounds(im.width)
    y0, y1 = EDGE_TRIM, im.height - EDGE_TRIM

    backup = backup_existing()
    if backup:
        print(f"Backed up previous godlike events to {backup.relative_to(ROOT)}")

    for idx, (x0, x1) in enumerate(cols):
        panel = export_panel(im.crop((x0, y0, x1, y1)))
        out = OUT_DIR / EVENTS[idx]
        panel.save(out, optimize=True)
        print(f"  {EVENTS[idx]:28s}  {panel.size}  (grid c{idx})")

    print(f"\nSaved {len(EVENTS)} godlike event images to {OUT_DIR.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
