#!/usr/bin/env python3
"""Extract the travel header car art from the locked travel reference screenshot."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / "docs" / "ui-standards" / "travel.png"
FALLBACK = Path(
    r"C:\Users\jarro\.cursor\projects\c-Projects-gang-wars-GangWars\assets"
    r"\c__Users_jarro_AppData_Roaming_Cursor_User_workspaceStorage_b8abd18152c996897b88164cd8a20284"
    r"_images_image-2d2fef29-0c2b-419a-adba-a589a1b974b5.png"
)
OUT = ROOT / "assets" / "travel-car.png"

# Crop box tuned to the reference travel screen (car only, no title text).
HEAD_BOX = (18, 115, 130, 200)
SCALE = 2


def main() -> None:
    src = REF if REF.exists() else FALLBACK
    if not src.exists():
        raise SystemExit(f"Reference travel screenshot not found: {src}")

    head = Image.open(src).convert("RGB").crop(HEAD_BOX)
    # Trim black margins around the car.
    px = head.load()
    w, h = head.size
    mask = [[max(px[x, y]) > 30 for x in range(w)] for y in range(h)]
    ys = [y for y in range(h) if any(mask[y][x] for x in range(w))]
    xs = [x for x in range(w) if any(mask[y][x] for y in range(h))]
    car = head.crop((min(xs), min(ys), max(xs) + 1, max(ys) + 1))
    car = car.resize((car.width * SCALE, car.height * SCALE), Image.Resampling.LANCZOS)
    car = ImageEnhance.Sharpness(car).enhance(1.1)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    car.save(OUT, optimize=True)
    print(f"Saved {OUT.relative_to(ROOT)}  {car.size}")


if __name__ == "__main__":
    main()
