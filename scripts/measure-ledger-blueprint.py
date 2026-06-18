#!/usr/bin/env python3
"""Measure Crime Ledger reference PNGs and print blueprint rects (473├ù1024 canvas)."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / "assets" / "ledger"
CANVAS_W = 473
CANVAS_H = 1024

# Hard-coded rects from visual measurement of reference art (px on 473├ù1024).
BLUEPRINT = {
    "canvas": {"width": CANVAS_W, "height": CANVAS_H},
    "achievementCounts": {
        "general": 14,
        "rare": 10,
        "superRare": 10,
        "godlike": 5,
        "goldenGodlike": 1,
        "total": 40,
    },
    "home": {
        "asset": "crime-ledger-home.png",
        "baseAsset": "crime-ledger-home-base.png",
        "scroll": False,
        "totalCounter": {"x": 130, "y": 486, "w": 213, "h": 20},
        "rowCounters": [
            {"id": "general", "x": 300, "y": 548, "w": 70, "h": 14},
            {"id": "rare", "x": 270, "y": 600, "w": 70, "h": 14},
            {"id": "superRare", "x": 368, "y": 654, "w": 70, "h": 14},
            {"id": "godlike", "x": 288, "y": 706, "w": 56, "h": 14},
            {"id": "goldenGodlike", "x": 388, "y": 760, "w": 44, "h": 14},
        ],
        "rowHits": [
            {"id": "general", "x": 17, "y": 508, "w": 439, "h": 54},
            {"id": "rare", "x": 17, "y": 562, "w": 439, "h": 54},
            {"id": "superRare", "x": 17, "y": 616, "w": 439, "h": 54},
            {"id": "godlike", "x": 17, "y": 670, "w": 439, "h": 54},
            {"id": "goldenGodlike", "x": 17, "y": 724, "w": 439, "h": 54},
        ],
        "back": {"x": 20, "y": 934, "w": 433, "h": 48},
        "inpaint": [
            {"x": 130, "y": 486, "w": 213, "h": 20, "label": "total"},
            {"x": 300, "y": 548, "w": 70, "h": 14, "label": "general"},
            {"x": 270, "y": 600, "w": 70, "h": 14, "label": "rare"},
            {"x": 368, "y": 654, "w": 70, "h": 14, "label": "superRare"},
            {"x": 288, "y": 706, "w": 56, "h": 14, "label": "godlike"},
            {"x": 388, "y": 760, "w": 44, "h": 14, "label": "goldenGodlike"},
        ],
    },
    "general": {
        "asset": "ledger-general.png",
        "baseAsset": "ledger-general-base.png",
        "scroll": True,
        "counter": {"x": 60, "y": 338, "w": 353, "h": 28},
        "listPanel": {"x": 17, "y": 382, "w": 439, "h": 528},
        "rowHeight": 38,
        "rowCount": 14,
        "back": {"x": 20, "y": 934, "w": 433, "h": 48},
        "inpaint": [
            {"x": 60, "y": 338, "w": 353, "h": 28, "label": "counter"},
            {"x": 17, "y": 382, "w": 439, "h": 528, "label": "list"},
        ],
    },
    "rare": {
        "asset": "ledger-rare.png",
        "baseAsset": "ledger-rare-base.png",
        "scroll": False,
        "counter": {"x": 60, "y": 328, "w": 353, "h": 28},
        "listPanel": {"x": 17, "y": 382, "w": 439, "h": 528},
        "rowHeight": 53,
        "rowCount": 10,
        "back": {"x": 20, "y": 934, "w": 433, "h": 48},
        "inpaint": [
            {"x": 60, "y": 328, "w": 353, "h": 28, "label": "counter"},
            {"x": 17, "y": 382, "w": 439, "h": 528, "label": "list"},
        ],
    },
    "superRare": {
        "asset": "ledger-super-rare.png",
        "baseAsset": "ledger-super-rare-base.png",
        "scroll": False,
        "counter": {"x": 60, "y": 328, "w": 353, "h": 28},
        "listPanel": {"x": 17, "y": 382, "w": 439, "h": 528},
        "rowHeight": 53,
        "rowCount": 10,
        "back": {"x": 20, "y": 934, "w": 433, "h": 48},
        "inpaint": [
            {"x": 60, "y": 328, "w": 353, "h": 28, "label": "counter"},
            {"x": 17, "y": 382, "w": 439, "h": 528, "label": "list"},
        ],
    },
    "godlike": {
        "asset": "ledger-godlike.png",
        "baseAsset": "ledger-godlike-base.png",
        "scroll": False,
        "counter": {"x": 60, "y": 328, "w": 353, "h": 28},
        "listPanel": {"x": 17, "y": 382, "w": 439, "h": 528},
        "rowHeight": 106,
        "rowCount": 5,
        "back": {"x": 20, "y": 934, "w": 433, "h": 48},
        "inpaint": [
            {"x": 60, "y": 328, "w": 353, "h": 28, "label": "counter"},
            {"x": 17, "y": 382, "w": 439, "h": 528, "label": "list"},
        ],
    },
    "goldenGodlike": {
        "asset": "ledger-golden-godlike.png",
        "baseAsset": "ledger-golden-godlike-base.png",
        "scroll": False,
        "counter": {"x": 60, "y": 388, "w": 353, "h": 28},
        "listPanel": {"x": 17, "y": 432, "w": 439, "h": 478},
        "rowHeight": 72,
        "rowCount": 1,
        "back": {"x": 20, "y": 934, "w": 433, "h": 48},
        "inpaint": [
            {"x": 60, "y": 388, "w": 353, "h": 28, "label": "counter"},
            {"x": 17, "y": 432, "w": 439, "h": 478, "label": "list"},
        ],
    },
}


def pct_rect(r: dict) -> dict:
    return {
        **r,
        "leftPct": round(r["x"] / CANVAS_W * 100, 3),
        "topPct": round(r["y"] / CANVAS_H * 100, 3),
        "widthPct": round(r["w"] / CANVAS_W * 100, 3),
        "heightPct": round(r["h"] / CANVAS_H * 100, 3),
    }


def main() -> None:
    out = ROOT / "scripts" / "ledger-blueprint.json"
    out.write_text(json.dumps(BLUEPRINT, indent=2), encoding="utf-8")
    print(f"Wrote {out}")
    for key in ["home", "general", "rare", "superRare", "godlike", "goldenGodlike"]:
        p = LEDGER / BLUEPRINT[key]["asset"]
        if p.exists():
            im = Image.open(p)
            print(f"{key}: {im.size}")


if __name__ == "__main__":
    main()
