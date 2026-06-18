#!/usr/bin/env python3
"""Generate crisp 96×96 goods icons — high detail, palette-optimised PNGs (~1–2 KB each)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "goods"
SIZE = 96

BG = (0, 0, 0, 0)
SHADOW = (12, 8, 4, 255)
DARK = (22, 14, 6, 255)
MID = (88, 56, 18, 255)
BRONZE = (138, 92, 28, 255)
GOLD = (210, 168, 78, 255)
LIGHT = (232, 198, 118, 255)
PALE = (248, 228, 178, 255)
FRAME = (62, 48, 26, 255)
INK = (18, 10, 4, 255)


def new() -> Image.Image:
    return Image.new("RGBA", (SIZE, SIZE), BG)


def frame(d: ImageDraw.ImageDraw) -> None:
    d.rectangle([2, 2, SIZE - 3, SIZE - 3], outline=FRAME, width=2)
    d.rectangle([5, 5, SIZE - 6, SIZE - 6], outline=GOLD, width=2)
    d.rectangle([8, 8, SIZE - 9, SIZE - 9], outline=(48, 34, 18, 255), width=1)


def save(img: Image.Image, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.png"
    # Flat pixel-art colours compress well; quantise to a tight palette.
    alpha = img.split()[3]
    rgb = img.convert("RGB")
    quant = rgb.quantize(colors=32, method=Image.Quantize.MEDIANCUT)
    out = quant.convert("RGBA")
    out.putalpha(alpha)
    out.save(path, format="PNG", optimize=True, compress_level=9)
    print(f"  {name:16s}  {path.stat().st_size:5d} bytes  {out.size}")


def jug(img: Image.Image) -> None:
    d = ImageDraw.Draw(img)
    frame(d)
    d.ellipse([22, 54, 72, 86], fill=MID, outline=GOLD, width=3)
    d.ellipse([26, 58, 68, 82], fill=DARK)
    d.ellipse([30, 62, 44, 76], fill=(32, 20, 8, 180))
    d.rectangle([34, 22, 60, 56], fill=BRONZE, outline=GOLD, width=3)
    d.polygon([(34, 22), (60, 22), (56, 12), (38, 12)], fill=GOLD, outline=LIGHT)
    d.rectangle([38, 14, 56, 18], fill=LIGHT)
    d.arc([56, 32, 80, 64], 270, 90, fill=GOLD, width=3)
    for x in (38, 44, 50):
        d.rectangle([x, 30, x + 4, 40], fill=LIGHT, outline=GOLD)
    d.line([(48, 56), (48, 58)], fill=LIGHT, width=2)


def cigars(img: Image.Image) -> None:
    d = ImageDraw.Draw(img)
    frame(d)
    d.rectangle([12, 46, 82, 84], fill=INK, outline=GOLD, width=3)
    d.rectangle([16, 50, 78, 80], fill=(20, 12, 4, 255))
    d.polygon([(12, 46), (82, 46), (76, 28), (18, 28)], fill=BRONZE, outline=GOLD, width=3)
    d.line([(18, 34), (76, 34)], fill=LIGHT, width=2)
    positions = [(22, 10), (34, 12), (46, 10), (58, 12)]
    for i, (x, y) in enumerate(positions):
        d.rectangle([x, y, x + 12, y + 22], fill=MID, outline=GOLD, width=2)
        d.ellipse([x + 2, y - 4, x + 10, y + 4], fill=LIGHT, outline=GOLD)
        d.line([(x + 2, y + 8), (x + 10, y + 8)], fill=DARK, width=1)


def bathgin(img: Image.Image) -> None:
    d = ImageDraw.Draw(img)
    frame(d)
    d.rectangle([30, 26, 64, 84], fill=MID, outline=GOLD, width=3)
    d.rectangle([32, 30, 62, 80], fill=(16, 26, 38, 255))
    d.line([(38, 34), (38, 76)], fill=(62, 88, 112, 220), width=3)
    d.rectangle([32, 44, 62, 64], fill=PALE, outline=GOLD, width=2)
    for y in (48, 54, 60):
        d.line([(36, y), (58, y)], fill=DARK, width=2)
    d.rectangle([32, 12, 62, 26], fill=GOLD, outline=LIGHT, width=2)
    d.rectangle([36, 6, 58, 14], fill=LIGHT, outline=GOLD, width=2)
    d.ellipse([44, 8, 52, 12], fill=PALE)


def art_icon(img: Image.Image) -> None:
    d = ImageDraw.Draw(img)
    frame(d)
    d.rectangle([10, 12, 84, 82], fill=GOLD, width=3)
    d.rectangle([16, 18, 78, 76], fill=INK, outline=BRONZE, width=2)
    d.rectangle([20, 48, 74, 70], fill=(28, 58, 24, 255))
    d.polygon([(20, 48), (64, 28), (74, 48)], fill=(42, 78, 34, 255), outline=(24, 48, 20, 255))
    d.ellipse([40, 52, 56, 64], fill=(208, 182, 64, 255), outline=GOLD, width=2)
    d.line([(16, 18), (84, 82)], fill=FRAME, width=2)
    d.line([(84, 18), (16, 82)], fill=FRAME, width=2)


def scotch(img: Image.Image) -> None:
    d = ImageDraw.Draw(img)
    frame(d)
    d.polygon([(28, 18), (66, 18), (68, 80), (26, 80)], fill=MID, outline=GOLD, width=3)
    d.polygon([(30, 22), (64, 22), (66, 76), (28, 76)], fill=INK)
    d.rectangle([34, 8, 62, 20], fill=GOLD, outline=LIGHT, width=2)
    d.rectangle([32, 32, 64, 56], fill=PALE, outline=BRONZE, width=3)
    d.rectangle([40, 38, 56, 50], fill=DARK)
    d.line([(42, 40), (54, 48)], fill=LIGHT, width=2)
    d.line([(54, 40), (42, 48)], fill=LIGHT, width=2)
    d.line([(30, 22), (64, 22)], fill=LIGHT, width=1)


def counterfeits(img: Image.Image) -> None:
    d = ImageDraw.Draw(img)
    frame(d)
    stacks = [(0, 0), (8, 6), (16, 12), (24, 18)]
    for ox, oy in stacks:
        x0, y0 = 14 + ox, 18 + oy
        d.rectangle([x0, y0, x0 + 52, y0 + 36], fill=PALE, outline=GOLD, width=3)
        d.ellipse([x0 + 16, y0 + 10, x0 + 36, y0 + 26], fill=MID, outline=BRONZE, width=2)
        d.rectangle([x0 + 24, y0 + 14, x0 + 32, y0 + 22], fill=DARK)
        d.line([(x0 + 4, y0 + 6), (x0 + 48, y0 + 6)], fill=LIGHT, width=1)


def cognac(img: Image.Image) -> None:
    d = ImageDraw.Draw(img)
    frame(d)
    d.ellipse([20, 44, 74, 88], fill=MID, outline=GOLD, width=3)
    d.ellipse([24, 48, 70, 84], fill=(34, 18, 6, 255))
    d.rectangle([32, 14, 62, 48], fill=BRONZE, outline=GOLD, width=3)
    d.arc([28, 8, 66, 28], 0, 180, fill=LIGHT, width=3)
    d.rectangle([38, 4, 56, 14], fill=GOLD, outline=LIGHT, width=2)
    d.arc([28, 48, 52, 80], 200, 320, fill=LIGHT, width=3)
    d.line([(48, 48), (48, 80)], fill=(60, 34, 10, 160), width=2)


def furcoats(img: Image.Image) -> None:
    d = ImageDraw.Draw(img)
    frame(d)
    d.arc([22, 6, 72, 32], 180, 0, fill=GOLD, width=3)
    d.line([(48, 6), (48, 18)], fill=GOLD, width=3)
    d.polygon([(16, 28), (78, 28), (80, 84), (14, 84)], fill=BRONZE, outline=GOLD, width=3)
    d.polygon([(22, 32), (72, 32), (74, 80), (20, 80)], fill=MID)
    for y in range(36, 76, 8):
        d.line([(20, y), (74, y)], fill=DARK, width=2)
    d.line([(48, 32), (36, 68)], fill=DARK, width=3)
    d.line([(48, 32), (60, 68)], fill=DARK, width=3)
    d.line([(22, 32), (72, 32)], fill=LIGHT, width=1)


def champagne(img: Image.Image) -> None:
    d = ImageDraw.Draw(img)
    frame(d)
    d.polygon([(30, 22), (62, 22), (64, 84), (28, 84)], fill=MID, outline=GOLD, width=3)
    d.polygon([(32, 26), (60, 26), (62, 80), (30, 80)], fill=(24, 14, 4, 255))
    d.rectangle([28, 8, 64, 24], fill=GOLD, outline=LIGHT, width=3)
    d.polygon([(28, 8), (64, 8), (58, 2), (34, 2)], fill=LIGHT, outline=GOLD)
    d.line([(30, 26), (62, 26)], fill=LIGHT, width=2)
    d.line([(32, 44), (60, 44)], fill=(48, 28, 8, 255), width=2)
    d.ellipse([40, 50, 52, 62], fill=(255, 255, 255, 40))


def diamonds(img: Image.Image) -> None:
    d = ImageDraw.Draw(img)
    frame(d)
    d.polygon([(48, 6), (84, 42), (48, 88), (12, 42)], fill=GOLD, width=3)
    d.polygon([(48, 12), (78, 42), (48, 82), (18, 42)], fill=LIGHT)
    d.polygon([(48, 12), (78, 42), (48, 42)], fill=PALE)
    d.polygon([(48, 12), (18, 42), (48, 42)], fill=LIGHT)
    d.polygon([(48, 82), (78, 42), (48, 42)], fill=BRONZE)
    d.polygon([(48, 82), (18, 42), (48, 42)], fill=MID)
    d.line([(48, 12), (48, 82)], fill=GOLD, width=3)
    d.line([(18, 42), (78, 42)], fill=GOLD, width=3)
    d.ellipse([42, 20, 54, 32], fill=PALE)
    d.line([(48, 12), (62, 28)], fill=(255, 255, 255, 80), width=1)


ICONS = {
    "moonshine": jug,
    "cigars": cigars,
    "bathgin": bathgin,
    "art": art_icon,
    "scotch": scotch,
    "counterfeits": counterfeits,
    "cognac": cognac,
    "furcoats": furcoats,
    "champagne": champagne,
    "diamonds": diamonds,
}


def main() -> None:
    print(f"Generating {len(ICONS)} goods icons at {SIZE}×{SIZE}…")
    total = 0
    for name, fn in ICONS.items():
        im = new()
        fn(im)
        save(im, name)
        total += (OUT / f"{name}.png").stat().st_size
    print(f"Total: {total} bytes ({total / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
