"""Split 2x3 district composite into six location PNGs.

Grid layout (682x1024 source):
  little-italy       | dock-13
  kitty-kat-club     | uptown
  warehouse-district | city-hall

Exports square panels matching the UI aspect-ratio (1:1, 341px).
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = ROOT / "assets" / "district-grid-source.png"
OUT_DIR = ROOT / "assets"
TARGET = 341

PANELS = [
    ("little-italy", 0, 0),
    ("dock-13", 1, 0),
    ("kitty-kat-club", 0, 1),
    ("uptown", 1, 1),
    ("warehouse-district", 0, 2),
    ("city-hall", 1, 2),
]


def square_panel(panel: Image.Image, size: int = TARGET) -> Image.Image:
    """Center-crop to square, then pad or crop to exact target size without scaling."""
    w, h = panel.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    cropped = panel.crop((left, top, left + side, top + side))
    if side == size:
        return cropped
    if side > size:
        trim = (side - size) // 2
        return cropped.crop((trim, trim, trim + size, trim + size))
    # side < size: pad with edge black (should not happen on equal 2x3 split)
    out = Image.new("RGB", (size, size), (0, 0, 0))
    offset = (size - side) // 2
    out.paste(cropped, (offset, offset))
    return out


def split_composite(src: Path, out_dir: Path = OUT_DIR) -> None:
    img = Image.open(src).convert("RGB")
    w, h = img.size
    col_w = w // 2
    row_h = h // 3

    for name, col, row in PANELS:
        x0 = col * col_w
        y0 = row * row_h
        x1 = w if col == 1 else col_w
        y1 = h if row == 2 else (row + 1) * row_h
        panel = img.crop((x0, y0, x1, y1))
        out = square_panel(panel, TARGET)
        dest = out_dir / f"{name}.png"
        out.save(dest, optimize=True)
        print(f"Saved {dest.name}: {out.size} (from crop {panel.size})")


if __name__ == "__main__":
    import sys

    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src.is_file():
        raise SystemExit(f"Source not found: {src}")
    split_composite(src)
    print("Done")
