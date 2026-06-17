#!/usr/bin/env python3
"""Measure inline counter rects on Crime Ledger reference PNGs (473×1024)."""

from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
STANDARDS = ROOT / "docs" / "ui-standards"
BLUEPRINT_PATH = ROOT / "scripts" / "ledger-blueprint.json"
CANVAS_W = 473
CANVAS_H = 1024

HOME_ROW_BANDS = [
    ("general", 508, 562),
    ("rare", 562, 616),
    ("superRare", 616, 670),
    ("godlike", 670, 724),
    ("goldenGodlike", 724, 778),
]

CATEGORY_SPECS = {
    "general": ("ledger-general.png", 336, 358, 90, 400),
    "rare": ("ledger-rare.png", 334, 356, 90, 400),
    "superRare": ("ledger-super-rare.png", 334, 356, 90, 400),
    "godlike": ("ledger-godlike.png", 334, 356, 90, 400),
    "goldenGodlike": ("ledger-golden-godlike.png", 384, 406, 90, 400),
}

MIN_ROW_W = 120
MIN_ROW_H = 18


def is_bright_counter_pixel(rgb: tuple[int, int, int]) -> bool:
    r, g, b = rgb
    return r + g + b > 300 and r > 110 and g > 90


def is_row_text_pixel(rgb: tuple[int, int, int]) -> bool:
    """Category names (bronze) and counters (gold) on home row bands."""
    r, g, b = rgb
    if is_bright_counter_pixel(rgb):
        return True
    return r > 95 and g > 55 and b < 95 and (r + g) > (b + 80)


def gold_clusters(im: Image.Image, y0: int, y1: int, x0: int, x1: int, pixel_test) -> list[dict]:
    seen: set[tuple[int, int]] = set()
    clusters: list[dict] = []
    for y in range(y0, y1):
        for x in range(x0, min(x1, CANVAS_W)):
            if (x, y) in seen or not pixel_test(im.getpixel((x, y))):
                continue
            q: deque[tuple[int, int]] = deque([(x, y)])
            comp: list[tuple[int, int]] = []
            while q:
                cx, cy = q.popleft()
                if (cx, cy) in seen:
                    continue
                if not (x0 <= cx < x1 and y0 <= cy < y1):
                    continue
                if not pixel_test(im.getpixel((cx, cy))):
                    continue
                seen.add((cx, cy))
                comp.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    q.append((cx + dx, cy + dy))
            if comp:
                xs = [p[0] for p in comp]
                ys = [p[1] for p in comp]
                clusters.append({"x0": min(xs), "x1": max(xs), "y0": min(ys), "y1": max(ys)})
    return clusters


def bbox_from_clusters(clusters: list[dict]) -> dict | None:
    if not clusters:
        return None
    x0 = min(c["x0"] for c in clusters)
    x1 = max(c["x1"] for c in clusters)
    y0 = min(c["y0"] for c in clusters)
    y1 = max(c["y1"] for c in clusters)
    rect = {
        "x": max(0, x0 - 2),
        "y": max(0, y0 - 2),
        "w": min(CANVAS_W, x1 - x0 + 5),
        "h": min(CANVAS_H, y1 - y0 + 5),
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


def measure_home_row_label(im: Image.Image, y0: int, y1: int) -> dict:
    clusters = gold_clusters(im, y0, y1, 172, 368, is_row_text_pixel)
    rect = bbox_from_clusters(clusters)
    if not rect:
        raise RuntimeError(f"Could not measure home row label band y={y0}-{y1}")
    return rect


def measure_home() -> dict:
    im = Image.open(STANDARDS / "ledger-home.png").convert("RGB")
    clusters = gold_clusters(im, 488, 508, 130, 260, is_bright_counter_pixel)
    total = bbox_from_clusters(clusters) or {"x": 141, "y": 491, "w": 115, "h": 16}
    rows = []
    for row_id, y0, y1 in HOME_ROW_BANDS:
        rect = measure_home_row_label(im, y0, y1)
        rows.append({"id": row_id, **rect})
    return {"totalCounter": total, "rowLabels": rows}


def measure_category(key: str) -> dict:
    filename, y0, y1, x_min, x_max = CATEGORY_SPECS[key]
    im = Image.open(STANDARDS / filename).convert("RGB")
    clusters = gold_clusters(im, y0, y1, x_min, x_max, is_bright_counter_pixel)
    rect = bbox_from_clusters(clusters)
    if not rect:
        raise RuntimeError(f"Could not measure category counter: {key}")
    if rect["w"] < 120:
        rect["w"] = 120
    if rect["h"] < 16:
        rect["y"] = max(0, rect["y"] - 1)
        rect["h"] = 16
    return rect


def center_row_labels(blueprint: dict, row_labels: list[dict]) -> list[dict]:
    hits = {rh["id"]: rh for rh in blueprint["home"]["rowHits"]}
    centered = []
    for rl in row_labels:
        rh = hits[rl["id"]]
        y = rh["y"] + max(0, (rh["h"] - rl["h"]) // 2)
        centered.append({**rl, "y": y})
    return centered


def home_row_inpaint_strips(blueprint: dict, measured: list[dict], strip_h: int = 32) -> list[dict]:
    """Erase baked labels on the lower edge of each home row (divider-adjacent art text)."""
    hits = {h["id"]: h for h in blueprint["home"]["rowHits"]}
    strips: list[dict] = []
    for rl in measured:
        rh = hits[rl["id"]]
        y = max(0, rh["y"] + rh["h"] - strip_h)
        x = min(rl["x"], 160)
        w = max(rl["w"], 220)
        strips.append({"id": rl["id"], "x": x, "y": y, "w": w, "h": strip_h, "label": rl["id"]})
    return strips


def apply_to_blueprint(blueprint: dict) -> dict:
    home = measure_home()
    measured = home["rowLabels"]
    row_labels = center_row_labels(blueprint, measured)
    row_inpaint = home_row_inpaint_strips(blueprint, measured)
    blueprint["home"]["totalCounter"] = home["totalCounter"]
    blueprint["home"]["rowLabels"] = row_labels
    blueprint["home"]["rowCounters"] = row_labels
    blueprint["home"]["rowInpaint"] = row_inpaint
    blueprint["home"]["inpaint"] = [
        {**home["totalCounter"], "label": "total"},
        *row_inpaint,
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
    for rl in home["rowLabels"]:
        print(f"  {rl['id']}: x={rl['x']} y={rl['y']} w={rl['w']} h={rl['h']}")
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
