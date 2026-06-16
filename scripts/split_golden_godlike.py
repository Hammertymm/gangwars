#!/usr/bin/env python3
"""Process the golden godlike event popup art asset."""

from __future__ import annotations

import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from event_art import export_panel  # noqa: E402

SOURCE = ROOT / "assets" / "godlike-golden-source.png"
FALLBACK_SOURCE = Path(
    r"C:\Users\jarro\.cursor\projects\c-Projects-gang-wars-GangWars\assets"
    r"\c__Users_jarro_AppData_Roaming_Cursor_User_workspaceStorage_b8abd18152c996897b88164cd8a20284"
    r"_images_image-c7d2dbae-0a06-4237-a512-deb618f4cb65.png"
)
OUT = ROOT / "events" / "godlike_golden.png"


def source_path() -> Path:
    if SOURCE.exists():
        return SOURCE
    if FALLBACK_SOURCE.exists():
        return FALLBACK_SOURCE
    raise FileNotFoundError("golden godlike source image not found")


def main() -> None:
    src = source_path()
    if not SOURCE.exists() and src == FALLBACK_SOURCE:
        shutil.copy2(src, SOURCE)

    if OUT.exists():
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        backup = OUT.parent / f"_backup-golden-{stamp}"
        backup.mkdir(parents=True)
        shutil.copy2(OUT, backup / OUT.name)
        print(f"Backed up previous golden godlike to {backup.relative_to(ROOT)}")

    panel = export_panel(Image.open(src).convert("RGB"))
    panel.save(OUT, optimize=True)
    print(f"  {OUT.name:28s}  {panel.size}")
    print(f"\nSaved golden godlike image to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
