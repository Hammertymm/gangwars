#!/usr/bin/env python3
"""Normalize Crime Ledger reference PNGs to 473x1024 and generate counter-free -base variants."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / "assets" / "ledger"
DOCS = ROOT / "docs" / "ui-standards"
BLUEPRINT_PATH = ROOT / "scripts" / "ledger-blueprint.json"
CANVAS_W = 473
CANVAS_H = 1024


def load_blueprint() -> dict:
    return json.loads(BLUEPRINT_PATH.read_text(encoding="utf-8-sig"))


def normalize_canvas(img: Image.Image) -> Image.Image:
    """Crop/scale reference art to 473×1024 design canvas."""
    w, h = img.size
    if w == CANVAS_W and h == CANVAS_H:
        return img.convert("RGB")
    if h != CANVAS_H:
        scale = CANVAS_H / h
        nw = max(1, int(round(w * scale)))
        img = img.resize((nw, CANVAS_H), Image.Resampling.LANCZOS)
        w = nw
    if w > CANVAS_W:
        left = (w - CANVAS_W) // 2
        img = img.crop((left, 0, left + CANVAS_W, CANVAS_H))
    elif w < CANVAS_W:
        canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), (0, 0, 0))
        ox = (CANVAS_W - w) // 2
        canvas.paste(img.convert("RGB"), (ox, 0))
        img = canvas
    return img.convert("RGB")


def sample_fill_color(img: Image.Image, rect: dict) -> tuple[int, int, int]:
    sx = max(0, min(CANVAS_W - 1, rect["x"] + rect["w"] // 2))
    sy = max(0, min(CANVAS_H - 1, rect["y"] - 2))
    return img.getpixel((sx, sy))


def inpaint_rects(img: Image.Image, rects: list[dict]) -> Image.Image:
    out = img.copy()
    px = out.load()
    for r in rects:
        fill = sample_fill_color(img, r)
        x1, y1 = r["x"], r["y"]
        x2, y2 = x1 + r["w"], y1 + r["h"]
        for y in range(y1, min(y2, CANVAS_H)):
            for x in range(x1, min(x2, CANVAS_W)):
                px[x, y] = fill
    return out


def gap_rect(counter: dict, list_panel: dict) -> dict | None:
    gap_y = counter["y"] + counter["h"]
    gap_h = list_panel["y"] - gap_y
    if gap_h <= 0:
        return None
    return {"x": list_panel["x"], "y": gap_y, "w": list_panel["w"], "h": gap_h, "label": "gap"}


def sync_blueprint_inpaint(blueprint: dict) -> None:
    """Rebuild inpaint regions from measured counter rects (positions come from blueprint.json)."""
    home = blueprint["home"]
    home["inpaint"] = [
        {**home["totalCounter"], "label": "total"},
        *[{**rc, "label": rc["id"]} for rc in home["rowCounters"]],
    ]

    for key in ["general", "rare", "superRare", "godlike", "goldenGodlike"]:
        spec = blueprint[key]
        counter = spec["counter"]
        gap = gap_rect(counter, spec["listPanel"])
        inpaint = [
            {**counter, "label": "counter"},
            {**spec["listPanel"], "label": "list"},
        ]
        if gap:
            inpaint.insert(1, gap)
        spec["inpaint"] = inpaint


def process_screen(key: str, spec: dict) -> None:
    src = LEDGER / spec["asset"]
    if not src.exists():
        raise FileNotFoundError(src)
    img = normalize_canvas(Image.open(src))
    normalized = LEDGER / spec["asset"]
    img.save(normalized, optimize=True)
    base = inpaint_rects(img, spec.get("inpaint", []))
    base_path = LEDGER / spec["baseAsset"]
    base.save(base_path, optimize=True)
    print(f"{key}: {spec['asset']} + {spec['baseAsset']}")


RUNTIME_SCREEN_KEYS = ["home", "general", "rare", "superRare", "godlike", "goldenGodlike"]
RUNTIME_OMIT = {"asset", "inpaint", "rowCount"}


def runtime_blueprint(blueprint: dict) -> dict:
    """Strip authoring-only fields for in-browser overlay layout."""
    out = {}
    for key in RUNTIME_SCREEN_KEYS:
        spec = {k: v for k, v in blueprint[key].items() if k not in RUNTIME_OMIT}
        out[key] = spec
    return out


def write_ledger_blueprint_js(blueprint: dict) -> None:
    runtime = runtime_blueprint(blueprint)
    path = ROOT / "ledger-blueprint.js"
    body = json.dumps(runtime, indent=2)
    path.write_text(
        "/* AUTO-GENERATED from scripts/ledger-blueprint.json — run prepare-ledger-assets.py */\n"
        f"const LEDGER_BLUEPRINT = {body};\n",
        encoding="utf-8",
    )
    print(f"Wrote {path.relative_to(ROOT)}")


def copy_references_to_docs(blueprint: dict) -> None:
    DOCS.mkdir(parents=True, exist_ok=True)
    mapping = {
        "crime-ledger-home.png": "ledger-home.png",
        "ledger-general.png": "ledger-general.png",
        "ledger-rare.png": "ledger-rare.png",
        "ledger-super-rare.png": "ledger-super-rare.png",
        "ledger-godlike.png": "ledger-godlike.png",
        "ledger-golden-godlike.png": "ledger-golden-godlike.png",
    }
    for src_name, dst_name in mapping.items():
        src = LEDGER / src_name
        if src.exists():
            shutil.copy2(src, DOCS / dst_name)


def main() -> None:
    blueprint = load_blueprint()
    sync_blueprint_inpaint(blueprint)
    BLUEPRINT_PATH.write_text(json.dumps(blueprint, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {BLUEPRINT_PATH.relative_to(ROOT)}")
    for key in RUNTIME_SCREEN_KEYS:
        process_screen(key, blueprint[key])
    copy_references_to_docs(blueprint)
    write_ledger_blueprint_js(blueprint)
    print("Done.")


if __name__ == "__main__":
    main()
