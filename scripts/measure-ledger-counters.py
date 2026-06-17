#!/usr/bin/env python3
"""Measure inline counter rects on Crime Ledger reference PNGs (473×1024)."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
STANDARDS = ROOT / "docs" / "ui-standards"
BLUEPRINT_PATH = ROOT / "scripts" / "ledger-blueprint.json"
CANVAS_W = 473
CANVAS_H = 1024

# Row bands (y0, y1, x_min, x_max) — scan only the inline numeric region after category names.
HOME_ROWS = [
    ("general", 508, 562, 228, 310),
    ("rare", 562, 616, 255, 310),
    ("superRare", 616, 670, 235, 280),
    ("godlike", 670, 724, 255, 320),
    ("goldenGodlike", 724, 778, 350, 410),
]

CATEGORY_SPECS = {
    "general": ("ledger-general.png", 336, 358, 90, 400),
    "rare": ("ledger-rare.png", 334, 356, 90, 400),
    "superRare": ("ledger-super-rare.png", 334, 356, 90, 400),
    "godlike": ("ledger-godlike.png", 334, 356, 90, 400),
    "goldenGodlike": ("ledger-golden-godlike.png", 384, 406, 90, 400),
}

MIN_ROW_W = 44
MIN_ROW_H = 14


def is_counter_pixel(rgb: tuple[int, int, int]) -> bool:
    r, g, b = rgb
    return r + g + b > 300 and r > 110 and g > 90


def bbox_counter_band(im: Image.Image, y0: int, y1: int, x_min: int, x_max: int = 420) -> dict | None:
    pts: list[tuple[int, int]] = []
    for y in range(y0, y1):
        for x in range(x_min, min(x_max, CANVAS_W)):
            if is_counter_pixel(im.getpixel((x, y))):
                pts.append((x, y))
    if len(pts) < 5:
        return None
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    rect = {
        "x": max(0, min(xs) - 1),
        "y": max(0, min(ys) - 1),
        "w": min(CANVAS_W, max(xs) - min(xs) + 3),
        "h": min(CANVAS_H, max(ys) - min(ys) + 3),
    }
    if rect["w"] < MIN_ROW_W:
        pad = (MIN_ROW_W - rect["w"] + 1) // 2
        rect["x"] = max(0, rect["x"] - pad)
        rect["w"] = min(CANVAS_W - rect["x"], MIN_ROW_W)
    if rect["h"] < MIN_ROW_H:
        pad = (MIN_ROW_H - rect["h"] + 1) // 2
        rect["y"] = max(0, rect["y"] - pad)
        rect["h"] = min(CANVAS_H - rect["y"], MIN_ROW_H)
    return rect


def measure_home() -> dict:
    im = Image.open(STANDARDS / "ledger-home.png").convert("RGB")
    total = bbox_counter_band(im, 488, 508, 130, 260)
    if not total:
        total = {"x": 141, "y": 491, "w": 115, "h": 16}
    rows = []
    for row_id, y0, y1, x_min, x_max in HOME_ROWS:
        rect = bbox_counter_band(im, y0, y1, x_min, x_max)
        if not rect:
            raise RuntimeError(f"Could not measure home row counter: {row_id}")
        rows.append({"id": row_id, **rect})
    return {"totalCounter": total, "rowCounters": rows}


def measure_category(key: str) -> dict:
    filename, y0, y1, x_min, x_max = CATEGORY_SPECS[key]
    im = Image.open(STANDARDS / filename).convert("RGB")
    rect = bbox_counter_band(im, y0, y1, x_min, x_max)
    if not rect:
        raise RuntimeError(f"Could not measure category counter: {key}")
    if rect["w"] < 120:
        rect["w"] = 120
    if rect["h"] < 16:
        rect["y"] = max(0, rect["y"] - 1)
        rect["h"] = 16
    return rect


def apply_to_blueprint(blueprint: dict) -> dict:
    home = measure_home()
    blueprint["home"]["totalCounter"] = home["totalCounter"]
    blueprint["home"]["rowCounters"] = home["rowCounters"]
    blueprint["home"]["inpaint"] = [
        {**home["totalCounter"], "label": "total"},
        *[{**rc, "label": rc["id"]} for rc in home["rowCounters"]],
    ]
    for key in CATEGORY_SPECS:
        counter = measure_category(key)
        spec = blueprint[key]
        spec["counter"] = counter
        gap_y = counter["y"] + counter["h"]
        gap_h = spec["listPanel"]["y"] - gap_y
        inpaint = [{**counter, "label": "counter"}, {**spec["listPanel"], "label": "list"}]
        if gap_h > 0:
            inpaint.insert(
                1,
                {"x": spec["listPanel"]["x"], "y": gap_y, "w": spec["listPanel"]["w"], "h": gap_h, "label": "gap"},
            )
        spec["inpaint"] = inpaint
    return blueprint


def main() -> None:
    home = measure_home()
    print("HOME totalCounter:", home["totalCounter"])
    for rc in home["rowCounters"]:
        print(f"  {rc['id']}: x={rc['x']} y={rc['y']} w={rc['w']} h={rc['h']}")
    print()
    for key in CATEGORY_SPECS:
        c = measure_category(key)
        print(f"{key} counter:", c)

    blueprint = json.loads(BLUEPRINT_PATH.read_text(encoding="utf-8-sig"))
    apply_to_blueprint(blueprint)
    BLUEPRINT_PATH.write_text(json.dumps(blueprint, indent=2) + "\n", encoding="utf-8")
    print(f"\nUpdated {BLUEPRINT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
