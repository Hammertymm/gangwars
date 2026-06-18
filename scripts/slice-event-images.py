#!/usr/bin/env python3
"""Slice 2×5 event art grid into the 10 standard travel/market event PNGs."""

import runpy
from pathlib import Path

if __name__ == "__main__":
    runpy.run_path(str(Path(__file__).with_name("split-event-grid.py")), run_name="__main__")
