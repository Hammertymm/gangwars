#!/usr/bin/env python3
"""Extract end-screen chrome and normalize rank card PNGs for the portrait layout."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
CARDS = ROOT / "cards"
ASSETS = ROOT / "assets"
MOCK = Path(
    r"C:\Users\jarro\.cursor\projects\c-Projects-gang-wars-GangWars\assets"
    r"\c__Users_jarro_AppData_Roaming_Cursor_User_workspaceStorage_b8abd18152c996897b88164cd8a20284"
    r"_images_image-9edd1224-e59b-43c7-a4b4-c97f6a8a5913.png"
)

CARD_TARGET_W = 400
CARD_PAD = 1


def trim_black(img: Image.Image, threshold: int = 18) -> Image.Image:
    rgb = img.convert("RGB")
    import numpy as np

    arr = np.array(rgb)
    mask = arr.max(axis=2) > threshold
    if not mask.any():
        return img
    ys, xs = np.where(mask)
    return img.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def pad_on_black(img: Image.Image, border: int = 1) -> Image.Image:
    w, h = img.size
    canvas = Image.new("RGB", (w + 2 * border, h + 2 * border), (0, 0, 0))
    canvas.paste(img.convert("RGB"), (border, border))
    return canvas


def normalize_card(path: Path) -> None:
    im = trim_black(Image.open(path).convert("RGB"))
    im = ImageEnhance.Contrast(im).enhance(1.04)
    w, h = im.size
    scale = CARD_TARGET_W / w
    im = im.resize((CARD_TARGET_W, max(1, int(h * scale))), Image.Resampling.LANCZOS)
    im = pad_on_black(im, CARD_PAD)
    im.save(path, optimize=True)
    print(f"  {path.name:20s}  {im.size}")


def extract_guns() -> None:
    if not MOCK.exists():
        print("Mock end-screen not found — skip gun extraction")
        return
    im = Image.open(MOCK).convert("RGBA")
    w, _ = im.size
    boxes = [(30, 95, 75, 145), (w - 75, 95, w - 30, 145)]
    names = ("eos-tommy-left.png", "eos-tommy-right.png")
    ASSETS.mkdir(parents=True, exist_ok=True)
    for box, name in zip(boxes, names):
        gun = im.crop(box)
        gun.save(ASSETS / name, optimize=True)
        print(f"  {name:22s}  {gun.size}")


def main() -> None:
    extract_guns()
    print("\nNormalizing rank cards:")
    for path in sorted(CARDS.glob("*.png")):
        normalize_card(path)
    print("Done.")


if __name__ == "__main__":
    main()
