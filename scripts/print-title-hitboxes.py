#!/usr/bin/env python3
"""Print title-screen hitbox CSS from scripts/title-blueprint.json."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLUEPRINT = ROOT / "scripts" / "title-blueprint.json"

data = json.loads(BLUEPRINT.read_text(encoding="utf-8"))
W = data["canvas"]["width"]
H = data["canvas"]["height"]
classes = {
    "new": "title-hit-new",
    "continue": "title-hit-cont",
    "ledger": "title-hit-ledger",
    "scores": "title-hit-scores",
}
for key, cls in classes.items():
    r = data["hits"][key]
    print(
        f".{cls}{{left:{r['x']/W*100:.3f}%;top:{r['y']/H*100:.3f}%;"
        f"width:{r['w']/W*100:.3f}%;height:{r['h']/H*100:.3f}%;}}"
    )
