"""Split 2×5 goods icon composite into individual market PNGs.

Grid layout (1024×512 source):
  moonshine | cigars | bathgin | art | scotch
  counterfeits | cognac | furcoats | champagne | diamonds

Exports square PNGs at 4× max UI display size (34px → 136px).
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = ROOT / "assets" / "goods-grid-source.png"
OUT_DIR = ROOT / "assets" / "goods"
TARGET = 136  # 4× clamp(26px, 6.5vw, 34px) max display
BLACK_THRESHOLD = 18

# (filename_stem, column, row) — top row 0, bottom row 1
ICONS = [
    ("moonshine", 0, 0),
    ("cigars", 1, 0),
    ("bathgin", 2, 0),
    ("art", 3, 0),
    ("scotch", 4, 0),
    ("counterfeits", 0, 1),
    ("cognac", 1, 1),
    ("furcoats", 2, 1),
    ("champagne", 3, 1),
    ("diamonds", 4, 1),
]


def column_bounds(col: int, width: int) -> tuple[int, int]:
    col_w = width // 5
    x0 = col * col_w
    x1 = width if col == 4 else (col + 1) * col_w
    # Normalise last column width to match others (center crop)
    cell_w = x1 - x0
    if cell_w > col_w:
        trim = (cell_w - col_w) // 2
        x0 += trim
        x1 = x0 + col_w
    return x0, x1


def black_to_alpha(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r <= BLACK_THRESHOLD and g <= BLACK_THRESHOLD and b <= BLACK_THRESHOLD:
                px[x, y] = (0, 0, 0, 0)
    return rgba


def fit_square(img: Image.Image, size: int = TARGET) -> Image.Image:
    """Contain icon in square canvas without cropping artwork."""
    img = black_to_alpha(img)
    w, h = img.size
    scale = min(size / w, size / h)
    nw = max(1, round(w * scale))
    nh = max(1, round(h * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    return out


def split_composite(src: Path, out_dir: Path = OUT_DIR) -> None:
    img = Image.open(src).convert("RGB")
    w, h = img.size
    row_h = h // 2

    for name, col, row in ICONS:
        x0, x1 = column_bounds(col, w)
        y0 = row * row_h
        y1 = h if row == 1 else row_h
        panel = img.crop((x0, y0, x1, y1))
        out = fit_square(panel, TARGET)
        dest = out_dir / f"{name}.png"
        out.save(dest, format="PNG", optimize=True, compress_level=9)
        print(f"Saved {dest.name}: {out.size} (from crop {panel.size})")


if __name__ == "__main__":
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src.is_file():
        raise SystemExit(f"Source not found: {src}")
    split_composite(src)
    print("Done")
