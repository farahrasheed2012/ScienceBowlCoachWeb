#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

REQUIRED = [
    "atomicNumber", "symbol", "name", "atomicMass", "atomicMassLabel",
    "period", "category", "electronConfiguration", "state", "block", "occurrence",
]
CATS = {
    "alkali-metal", "alkaline-earth", "transition-metal", "post-transition",
    "metalloid", "nonmetal", "halogen", "noble-gas", "lanthanide", "actinide", "unknown",
}


def main() -> int:
    path = Path(__file__).resolve().parents[1] / "data" / "periodic_table.json"
    data = json.loads(path.read_text())
    elements = data["elements"]
    errors: list[str] = []
    if len(elements) != 118:
        errors.append(f"expected 118 elements, got {len(elements)}")
    numbers = [el["atomicNumber"] for el in elements]
    if numbers != list(range(1, 119)):
        errors.append("atomic numbers are not 1–118 unique in order")
    symbols = [el["symbol"] for el in elements]
    names = [el["name"].lower() for el in elements]
    if len(set(symbols)) != 118:
        errors.append("duplicate symbols")
    if len(set(names)) != 118:
        errors.append("duplicate names")
    for el in elements:
        for key in REQUIRED:
            if el.get(key) in (None, ""):
                errors.append(f"{el.get('symbol')} missing {key}")
        if el["category"] not in CATS:
            errors.append(f"{el['symbol']} bad category {el['category']}")
        z = el["atomicNumber"]
        period = el["period"]
        group = el["group"]
        if z <= 2 and period != 1:
            errors.append(f"{el['symbol']} period")
        if 57 <= z <= 71 and period != 6:
            errors.append(f"{el['symbol']} lanthanide period")
        if 89 <= z <= 103 and period != 7:
            errors.append(f"{el['symbol']} actinide period")
        if z == 1 and group != 1:
            errors.append("H group")
        if z == 2 and group != 18:
            errors.append("He group")
        if z in (3, 11, 19, 37, 55, 87) and group != 1:
            errors.append(f"{el['symbol']} should be group 1")
        if z in (9, 17, 35, 53, 85, 117) and group not in (17, None):
            errors.append(f"{el['symbol']} should be group 17")
    if errors:
        print("\n".join(errors[:40]))
        print(f"{len(errors)} errors")
        return 1
    print("periodic table ok: 118 unique elements")
    return 0


if __name__ == "__main__":
    sys.exit(main())
