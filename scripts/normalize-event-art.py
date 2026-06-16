#!/usr/bin/env python3
"""Normalize rare, super-rare, godlike, and golden event art for full-bleed popups."""

from __future__ import annotations

import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVENTS = ROOT / "events"

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from event_art import export_panel, needs_normalize  # noqa: E402

GLOBS = ("rare_*.png", "super_*.png", "godlike_*.png")
STANDARD = (
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
)


def collect_paths(all_events: bool) -> list[Path]:
    if all_events:
        paths = sorted(
            p
            for p in EVENTS.glob("*.png")
            if not p.name.startswith("_") and p.name in STANDARD
            or any(p.match(g) for g in GLOBS)
        )
        return paths
    paths: list[Path] = []
    for pattern in GLOBS:
        paths.extend(EVENTS.glob(pattern))
    return sorted(set(paths))


def main() -> None:
    all_events = "--all" in sys.argv
    paths = collect_paths(all_events)
    todo = paths if all_events else [p for p in paths if needs_normalize(p)]
    if not todo:
        print("All event popup art already normalized.")
        return

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    backup = EVENTS / f"_backup-tier-{stamp}"
    backup.mkdir(parents=True)
    for path in todo:
        shutil.copy2(path, backup / path.name)
    print(f"Backed up {len(todo)} files to {backup.relative_to(ROOT)}")

    for path in todo:
        im = export_panel(Image.open(path).convert("RGB"))
        im.save(path, optimize=True, compress_level=9)
        print(f"  {path.name:28s}  {im.size}")

    print(f"\nNormalized {len(todo)} tier event images.")


if __name__ == "__main__":
    main()
