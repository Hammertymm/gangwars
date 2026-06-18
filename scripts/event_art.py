#!/usr/bin/env python3
"""Shared helpers for event popup artwork — trim, enhance, scale to panel height."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

POPUP_ART_HEIGHT = 662
POPUP_PAD = 1  # black border each side; exported PNGs are POPUP_ART_HEIGHT + 2*POPUP_PAD tall
TRIM_THRESHOLD = 18


def trim_black(img: Image.Image, threshold: int = TRIM_THRESHOLD) -> Image.Image:
    """Remove outer black gutter."""
    rgb = img.convert("RGB")
    arr = np.array(rgb)
    mask = arr.max(axis=2) > threshold
    if not mask.any():
        return img
    ys, xs = np.where(mask)
    return img.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def enhance_panel(img: Image.Image) -> Image.Image:
    img = ImageEnhance.Contrast(img).enhance(1.06)
    img = ImageEnhance.Color(img).enhance(1.04)
    img = ImageEnhance.Sharpness(img).enhance(1.2)
    return img.filter(ImageFilter.UnsharpMask(radius=1.1, percent=110, threshold=2))


def pad_on_black(img: Image.Image, border: int = 1) -> Image.Image:
    """Center art on a black canvas one pixel larger on each side."""
    w, h = img.size
    canvas = Image.new("RGB", (w + 2 * border, h + 2 * border), (0, 0, 0))
    canvas.paste(img, (border, border))
    return canvas


def export_panel(panel: Image.Image, target_h: int = POPUP_ART_HEIGHT, pad: int = POPUP_PAD) -> Image.Image:
    """Trim gutter, enhance, scale to popup height; optional 1px black pad (legacy)."""
    panel = trim_black(panel)
    panel = enhance_panel(panel)
    w, h = panel.size
    if h != target_h:
        scale = target_h / h
        panel = panel.resize((max(1, int(w * scale)), target_h), Image.Resampling.LANCZOS)
    if pad > 0:
        return pad_on_black(panel, border=pad)
    return panel


def needs_normalize(path: Path) -> bool:
    im = Image.open(path)
    w, h = im.size
    export_h = POPUP_ART_HEIGHT + 2 * POPUP_PAD
    if h < export_h - 4 or h > export_h + 4:
        return True
    arr = np.array(im.convert("RGB"))
    mask = arr.max(axis=2) > TRIM_THRESHOLD
    if not mask.any():
        return False
    ys, xs = np.where(mask)
    return ys.min() > 2 or xs.min() > 2
