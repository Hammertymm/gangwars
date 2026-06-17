#!/usr/bin/env python3
"""Split Crime Ledger achievement icon grids into individual PNGs."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CURSOR_ASSETS = Path(
    r"C:\Users\jarro\.cursor\projects\c-Projects-gang-wars-GangWars\assets"
)
LEDGER = ROOT / "assets" / "ledger"
OUT_DIR = LEDGER / "icons"
TARGET = 136
BLACK_THRESHOLD = 18
GUTTER_TRIM = 4

GENERAL_SRC = LEDGER / "general-icons-source.png"
RARE_SRC = LEDGER / "rare-icons-source.png"
SUPER_SRC = LEDGER / "super-rare-icons-source.png"
GODLIKE_SRC = LEDGER / "godlike-icons-source.png"

FALLBACK = {
    GENERAL_SRC: "*33cbb924*",
    RARE_SRC: "*82dc5d70*",
    SUPER_SRC: "*543f3824*",
    GODLIKE_SRC: "*84f462ff*",
}

GENERAL_IDS = [
    "made_man", "debt_survivor", "first_million", "connected", "bootlegger",
    "smoke_merchant", "the_collector", "high_roller", "diamond_hands", "empire_builder",
    "king_of_docks", "smooth_operator", "market_maven", "survivor",
]

RARE_IDS = [
    "luciano", "rumrow", "midnight", "ellington", "armstrong",
    "schultz", "lansky", "capone", "rothstein", "madden",
]

SUPER_IDS = [
    "lindbergh", "mauretania", "dempsey", "kkrevue", "ziegfeld",
    "hollywood", "wales", "wallst", "ruth", "walker",
]

GODLIKE_IDS = [
    "in_town", "interest", "move", "celebration", "history", "golden",
]


def resolve_source(dest: Path, pattern: str) -> Path:
    if dest.exists():
        return dest
    matches = sorted(CURSOR_ASSETS.glob(pattern))
    if not matches:
        raise FileNotFoundError(f"No source for {dest.name} (pattern {pattern})")
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(matches[0], dest)
    return dest


def black_to_alpha(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, _a = px[x, y]
            if r <= BLACK_THRESHOLD and g <= BLACK_THRESHOLD and b <= BLACK_THRESHOLD:
                px[x, y] = (0, 0, 0, 0)
    return rgba


def fit_square(img: Image.Image, size: int = TARGET) -> Image.Image:
    img = black_to_alpha(img)
    w, h = img.size
    scale = min(size / w, size / h)
    nw = max(1, round(w * scale))
    nh = max(1, round(h * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    return out


def trim_crop(img: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    x0, y0, x1, y1 = box
    x0 += GUTTER_TRIM
    y0 += GUTTER_TRIM
    x1 -= GUTTER_TRIM
    y1 -= GUTTER_TRIM
    return img.crop((x0, y0, x1, y1))


def split_grid(
    src: Path,
    ids: list[str],
    cols: int,
    rows: int,
    *,
    last_row_cols: int | None = None,
) -> None:
    im = Image.open(src).convert("RGB")
    w, h = im.size
    row_h = h // rows
    saved = 0
    idx = 0
    for row in range(rows):
        row_cols = last_row_cols if row == rows - 1 and last_row_cols else cols
        col_w = w // row_cols
        y0 = row * row_h
        y1 = h if row == rows - 1 else (row + 1) * row_h
        for col in range(row_cols):
            if idx >= len(ids):
                break
            x0 = col * col_w
            x1 = w if col == row_cols - 1 else (col + 1) * col_w
            panel = trim_crop(im, (x0, y0, x1, y1))
            out = fit_square(panel, TARGET)
            dest = OUT_DIR / f"{ids[idx]}.png"
            out.save(dest, format="PNG", optimize=True)
            print(f"  {dest.name:24s}  {out.size}  crop {panel.size}")
            idx += 1
            saved += 1
    print(f"Saved {saved} icons from {src.name}")


def make_locked_icon() -> None:
    """Simple gold padlock on transparent square."""
    size = TARGET
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    from PIL import ImageDraw

    draw = ImageDraw.Draw(img)
    gold = (201, 168, 90, 255)
    body = [size * 0.28, size * 0.44, size * 0.72, size * 0.82]
    draw.rounded_rectangle(body, radius=6, outline=gold, width=3)
    shackle = [size * 0.36, size * 0.18, size * 0.64, size * 0.52]
    draw.rounded_rectangle(shackle, radius=12, outline=gold, width=3)
    draw.line([(size * 0.36, size * 0.44), (size * 0.36, size * 0.52)], fill=gold, width=3)
    draw.line([(size * 0.64, size * 0.44), (size * 0.64, size * 0.52)], fill=gold, width=3)
    dest = OUT_DIR / "locked.png"
    img.save(dest, format="PNG", optimize=True)
    print(f"  {dest.name}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for dest, pattern in FALLBACK.items():
        resolve_source(dest, pattern)

    print("General icons:")
    split_grid(GENERAL_SRC, GENERAL_IDS, cols=5, rows=3, last_row_cols=4)

    print("Rare icons:")
    split_grid(RARE_SRC, RARE_IDS, cols=5, rows=2)

    print("Super rare icons:")
    split_grid(SUPER_SRC, SUPER_IDS, cols=5, rows=2)

    print("Godlike icons:")
    split_grid(GODLIKE_SRC, GODLIKE_IDS, cols=3, rows=2)

    print("Locked icon:")
    make_locked_icon()
    print(f"\nDone — {len(list(OUT_DIR.glob('*.png')))} PNGs in {OUT_DIR.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
