#!/usr/bin/env python3
"""Validate standard event replacement."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
EVENTS = ROOT / "events"
BACKUP = EVENTS / "_backup_originals"
REPORT_PATH = ROOT / "docs" / "review" / "standard-event-replacement.json"

report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
standard = [entry["filename"] for entry in report["mapping"]]

issues: list[str] = []
dim_notes: list[str] = []

for entry in report["mapping"]:
    name = entry["filename"]
    path = EVENTS / name
    backup_path = BACKUP / name

    if not path.is_file():
        issues.append(f"{name}: missing on disk")
        continue
    if not backup_path.is_file():
        issues.append(f"{name}: missing from backup")

    with Image.open(path) as current:
        current.load()
        if list(current.size) != entry["new_size"]:
            issues.append(f"{name}: size {current.size} != report {entry['new_size']}")
        dim_notes.append(f"{name}: {entry['previous_size']} -> {list(current.size)}")

    if path.read_bytes() == backup_path.read_bytes():
        issues.append(f"{name}: identical to backup (not replaced)")

if len(standard) != len(set(standard)):
    issues.append("Duplicate filenames in mapping")

print("VALIDATION")
print(f"Extracted: {report['panels_extracted']}")
print(f"Replaced: {report['files_replaced']}")
print(f"Backup: {report['backup_dir']}")
print(f"Manual matches: {report.get('manual_matches') or 'none'}")
print(f"Issues: {len(issues)}")
for issue in issues:
    print(f"  ISSUE: {issue}")
print("Dimension changes vs pre-replacement:")
for note in dim_notes:
    print(f"  {note}")
if not issues:
    print("All checks passed.")
