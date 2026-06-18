#!/usr/bin/env python3
"""Validate GW Style event replacement."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
EVENTS = ROOT / "events"
BACKUP = EVENTS / "_backup_originals"
REPORT = ROOT / "docs" / "review" / "gw-style-event-replacement.json"

EXPECTED = sorted(
    [
        "ambushed_rolled.png",
        "buying_frenzy.png",
        "dead_drop.png",
        "flooded_market.png",
        "godlike_celebration.png",
        "godlike_golden.png",
        "godlike_history.png",
        "godlike_in_town.png",
        "godlike_interest.png",
        "godlike_move.png",
        "packing_iron.png",
        "rare_armstrong.png",
        "rare_capone.png",
        "rare_ellington.png",
        "rare_event_intel.png",
        "rare_lansky.png",
        "rare_luciano.png",
        "rare_madden.png",
        "rare_midnight.png",
        "rare_rothstein.png",
        "rare_rumrow.png",
        "rare_schultz.png",
        "shortage.png",
        "super_dempsey.png",
        "super_hollywood.png",
        "super_kkrevue.png",
        "super_lindbergh.png",
        "super_mauretania.png",
        "super_rare_event.png",
        "super_ruth.png",
        "super_wales.png",
        "super_walker.png",
        "super_wallst.png",
        "super_ziegfeld.png",
        "the_feds.png",
        "upgrade_available.png",
    ]
)

report = json.loads(REPORT.read_text(encoding="utf-8"))
mapping = {entry["filename"]: entry for entry in report["mapping"]}
replaced_names = set(mapping)

issues: list[str] = []
on_disk = sorted(p.name for p in EVENTS.glob("*.png") if not p.name.startswith("_"))

missing = [name for name in EXPECTED if name not in on_disk]
extra = [name for name in on_disk if name not in EXPECTED]
if missing:
    issues.append(f"Missing expected files: {missing}")
if extra:
    issues.append(f"Unexpected extra files: {extra}")
if len(on_disk) != len(set(on_disk)):
    issues.append("Duplicate filenames on disk")

backup_files = sorted(p.name for p in BACKUP.glob("*.png"))
if len(backup_files) != 30:
    issues.append(f"Backup count {len(backup_files)} != 30")

for name in replaced_names:
    if name not in backup_files:
        issues.append(f"{name}: missing from backup")

for name in [n for n in EXPECTED if n.startswith("godlike_")]:
    if (BACKUP / name).exists():
        issues.append(f"{name}: unexpectedly in backup (should be unchanged)")

changed = 0
dim_notes: list[str] = []
for name in sorted(replaced_names):
    current_path = EVENTS / name
    backup_path = BACKUP / name
    with Image.open(current_path) as current:
        current.load()
        entry = mapping[name]
        if list(current.size) != entry["new_size"]:
            issues.append(f"{name}: on-disk size {current.size} != report {entry['new_size']}")
        if current.mode != entry["new_mode"]:
            issues.append(f"{name}: mode {current.mode} != report {entry['new_mode']}")
        dim_notes.append(
            f"{name}: {entry['original_size']} -> {list(current.size)} ({current.mode})"
        )
    if current_path.read_bytes() != backup_path.read_bytes():
        changed += 1
    else:
        issues.append(f"{name}: identical to backup (not replaced)")

for name in EXPECTED:
    with Image.open(EVENTS / name) as img:
        img.load()

print("VALIDATION SUMMARY")
print(f"Expected assets: {len(EXPECTED)}")
print(f"On disk: {len(on_disk)}")
print(f"Backed up: {len(backup_files)}")
print(f"Replaced (content changed): {changed}/30")
print(f"Issues: {len(issues)}")
for issue in issues:
    print(f"  ISSUE: {issue}")
if not issues:
    print("All checks passed.")
print()
print("Dimension changes (replaced only):")
for line in dim_notes:
    print(f"  {line}")
