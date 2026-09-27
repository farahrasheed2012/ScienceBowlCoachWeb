#!/usr/bin/env python3
"""Download official DOE middle-school Science Bowl PDFs and parse them into
data/doe_questions_cache.json. Does not invent questions. Skips high-school files.
"""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts" / ".doe-pdfs"
OUT = ROOT / "data" / "doe_questions_cache.json"

UA = "ScienceBowlCoachWeb/1.0 (official DOE MS sample import; educational)"

YEAR = {
    0: None,
    1: 2009,
    2: 2008,
    3: 2007,
    4: 2010,
    5: 2011,
    6: 2012,
    7: 2013,
    8: 2014,
    9: 2015,
    10: 2016,
    11: 2017,
    12: 2018,
    13: 2019,
    14: 2020,
    15: 2021,
    16: 2022,
}

BASE = "https://science.osti.gov/-/media/wdts/nsb/pdf/MS-Sample-Questions"


def add_set(entries: list, set_num: int, folder: str, urls: list[str]) -> None:
    for i, url in enumerate(urls, start=1):
        name = url.rsplit("/", 1)[-1]
        if "-HS-" in name or "/HS-" in url:
            continue
        entries.append((set_num, i, folder, name, url))


def catalog() -> list[tuple[int, int, str, str, str]]:
    entries: list[tuple[int, int, str, str, str]] = []
    add_set(entries, 1, "Set-1", [f"{BASE}/Sample-Set-1/m_round{n:02d}.pdf" for n in range(1, 19)])
    add_set(entries, 2, "Set-2", [f"{BASE}/Sample-Set-2/sample_questions_r{n}.pdf" for n in range(1, 11)])
    set3 = [f"{BASE}/Sample-Set-3/Round-{n}C-MS.pdf" for n in range(1, 16)]
    set3.append(f"{BASE}/Sample-Set-3/Energy-Category.pdf")
    add_set(entries, 3, "Set-3", set3)
    add_set(entries, 4, "Set-4", [f"{BASE}/Sample-Set-4/Round{n}.pdf" for n in range(1, 18)])
    add_set(entries, 5, "Set-5", [f"{BASE}/Sample-Set-5/Round{n}.pdf" for n in range(1, 17)])
    add_set(entries, 6, "Set-6", [f"{BASE}/Sample-Set-6/Round{n}.pdf" for n in range(1, 18)])
    add_set(entries, 7, "Set-7", [f"{BASE}/Sample-Set-7/MS_Round-{n}.pdf" for n in range(1, 16)])
    add_set(entries, 8, "Set-8", [f"{BASE}/Sample-Set-8/Round-{n}-A.pdf" for n in range(1, 18)])
    set9 = ["RegionalMS_1.pdf", "RegionalMS_2.pdf"] + [f"RegionalMS_{n}A.pdf" for n in range(3, 18)]
    add_set(entries, 9, "Set-9", [f"{BASE}/Sample-Set-9/{name}" for name in set9])
    add_set(entries, 10, "Set-10", [f"{BASE}/Sample-Set-10/{n}A_MS_Reg_2016.pdf" for n in range(1, 18)])
    set11 = ["MS_1.pdf", "MS_2.pdf"] + [f"MS_{n}A.pdf" for n in range(3, 18)]
    add_set(entries, 11, "Set-11", [f"{BASE}/Sample-set-11/{name}" for name in set11])
    add_set(entries, 12, "Set-12", [f"{BASE}/Sample-Set-12/MSRound-{n}.pdf" for n in range(1, 18)])
    add_set(entries, 13, "Set-13", [f"{BASE}/Sample-Set-13/2019-NSB-MSR-Round-{n}A.pdf" for n in range(1, 18)])
    add_set(
        entries,
        0,
        "Sample-Rounds",
        [
            f"{BASE}/Sample-Rounds/rr2_for_web.pdf",
            f"{BASE}/Sample-Rounds/rr5_for_web.pdf",
            f"{BASE}/Sample-Rounds/de1_for_web.pdf",
            f"{BASE}/Sample-Rounds/de3_for_web.pdf",
        ],
    )
    add_set(entries, 14, "Set-14", [f"{BASE}/Sample-Set-14/2020-MS-Rd{n}.pdf" for n in range(1, 18)])
    set15 = [
        "Set-1-MS-2021.pdf",
        "Set-2-MS-2021.pdf",
        "Set-3-MS-2021.pdf",
        "Set-4-MS-2021.pdf",
        "Set-5-MS-2021.pdf",
        "Set-6-MS-2021.pdf",
        "Set-8-MS-2021.pdf",
        "Set-9-MS-2021.pdf",
        "Set-10-MS-2021.pdf",
    ]
    add_set(entries, 15, "Set-15", [f"{BASE}/Sample-Set-15/{name}" for name in set15])
    add_set(entries, 16, "Set-16", [f"{BASE}/Sample-Set-16/2022-MS-{n}.pdf" for n in range(1, 10)])
    return entries


def download(url: str, dest: Path) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 800:
        return True
    for attempt in range(3):
        try:
            result = subprocess.run(
                ["curl", "-fsSL", "-A", UA, "-o", str(dest), url],
                capture_output=True,
                text=True,
                timeout=60,
            )
            if result.returncode == 0 and dest.exists() and dest.stat().st_size > 800:
                data = dest.read_bytes()[:5]
                if data.startswith(b"%PDF"):
                    return True
                dest.unlink(missing_ok=True)
                print(f"  skip (not pdf) {dest.name}")
                return False
            print(f"  retry {dest.name}: {result.stderr.strip() or result.returncode}")
        except Exception as exc:
            print(f"  retry {dest.name}: {exc}")
        time.sleep(1.2 * (attempt + 1))
    print(f"  fail {dest.name}")
    return False


def pdf_text(path: Path) -> str:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    pages = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    return "\n".join(pages)


HEADER = re.compile(
    r"^(?P<num>\d+)\)\s*(?P<cat>.+?)\s*[–—\-]\s*(?P<fmt>Short Answer|Multiple Choice)\s*(?P<stem>.*)$",
    re.I,
)
HEADER_SPACE = re.compile(
    r"^(?P<num>\d+)\)\s*(?P<cat>.+?)\s+(?P<fmt>Short Answer|Multiple Choice)\s+(?P<stem>.*)$",
    re.I,
)
CHOICE = re.compile(r"^([WXYZ])\)\s*(.+)$", re.I)
SKIP = re.compile(
    r"^(page\s+\d+|middle school|round\s+\d|[~\-]{3,}|national science bowl|doe|sample questions|set\s+\d+)",
    re.I,
)


def map_category(raw: str) -> str:
    upper = raw.upper()
    if "LIFE" in upper or "BIO" in upper:
        return "Biology"
    if "CHEM" in upper:
        return "Chemistry"
    if "EARTH" in upper or "SPACE" in upper or "ASTRO" in upper:
        return "Earth and Space"
    if "ENERGY" in upper:
        return "Energy"
    if "MATH" in upper:
        return "Math"
    if "PHYS" in upper:
        return "Physics"
    if "GENERAL" in upper:
        return "General Science"
    return "General Science"


def clean(text: str) -> str:
    text = text.replace("\u00ad", "")
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    text = text.replace("\r", "\n")
    lines = []
    for line in text.splitlines():
        line = re.sub(r"\s+", " ", line).strip()
        if not line or SKIP.match(line):
            continue
        lines.append(line)
    return "\n".join(lines)


def parse_header(line: str):
    for pattern in (HEADER, HEADER_SPACE):
        match = pattern.match(line)
        if match:
            return {
                "number": int(match.group("num")),
                "category": map_category(match.group("cat")),
                "format": "Multiple Choice" if "multiple" in match.group("fmt").lower() else "Short Answer",
                "stem": match.group("stem").strip(),
            }
    return None


def explode_lines(lines: list[str]) -> list[str]:
    out: list[str] = []
    for line in lines:
        parts = re.split(r"(?=\b(?:TOSS-UP|BONUS)\b)", line, flags=re.I)
        for part in parts:
            part = part.strip(" \t-—_")
            part = re.sub(r"^ROUND\s+\d+\s*", "", part, flags=re.I).strip()
            if part:
                out.append(part)
    return out


INLINE_BLOCK = re.compile(
    r"(TOSS-UP|BONUS)\s+(\d+)\)\s+(.+?)\s+(Short Answer|Multiple Choice)\s+(.*?)\s+ANSWER:\s*(.+?)(?=(?:TOSS-UP|BONUS|\Z))",
    re.I | re.S,
)


def question_from_parts(
    kind: str,
    number: int,
    category: str,
    fmt: str,
    stem: str,
    answer: str,
    set_number: int,
    round_number: int,
    source_file: str,
    source_year: int | None,
) -> dict | None:
    stem_lines = [part.strip() for part in re.split(r"\n+", stem) if part.strip()]
    choices: list[str] = []
    question_parts: list[str] = []
    for part in stem_lines:
        for chunk in re.split(r"(?=\b[WXYZ]\))", part):
            chunk = chunk.strip()
            if not chunk:
                continue
            choice = CHOICE.match(chunk)
            if choice:
                choices.append(f"{choice.group(1).upper()}) {choice.group(2).strip()}")
            else:
                question_parts.append(chunk)
    question = re.sub(r"\s+", " ", " ".join(question_parts)).strip()
    answer = re.sub(r"\s+", " ", answer).strip()
    if len(question) < 12 or len(answer) < 1:
        return None
    digest = hashlib.sha1(f"{question}|{answer}".encode()).hexdigest()[:12]
    qtype = "TOSS-UP" if kind.upper().startswith("TOSS") else "BONUS"
    return {
        "id": f"doe-ms-s{set_number}-r{round_number}-q{number}-{qtype[0].lower()}-{digest}",
        "setNumber": set_number,
        "roundNumber": round_number,
        "questionNumber": number,
        "category": map_category(category),
        "questionType": qtype,
        "format": "Multiple Choice" if choices or "multiple" in fmt.lower() else "Short Answer",
        "questionText": question,
        "choices": choices,
        "answer": answer,
        "sourceFile": source_file,
        "sourceYear": source_year,
    }


def parse_inline_blocks(text: str, set_number: int, round_number: int, source_file: str, source_year: int | None) -> list[dict]:
    blob = re.sub(r"\s+", " ", clean(text))
    rows: list[dict] = []
    for match in INLINE_BLOCK.finditer(blob):
        row = question_from_parts(
            match.group(1),
            int(match.group(2)),
            match.group(3),
            match.group(4),
            match.group(5),
            match.group(6),
            set_number,
            round_number,
            source_file,
            source_year,
        )
        if row:
            rows.append(row)
    return rows


def parse_text(text: str, set_number: int, round_number: int, source_file: str, source_year: int | None) -> list[dict]:
    lines = explode_lines(clean(text).splitlines())
    questions: list[dict] = []
    kind = "TOSS-UP"
    number = 0
    category = "General Science"
    fmt = "Short Answer"
    stem = ""
    choices: list[str] = []

    def flush(answer: str) -> None:
        nonlocal stem, choices
        question = re.sub(r"\s+", " ", stem).strip()
        answer = re.sub(r"\s+", " ", answer).strip()
        if len(question) < 12 or len(answer) < 1:
            stem = ""
            choices = []
            return
        digest = hashlib.sha1(f"{question}|{answer}".encode()).hexdigest()[:12]
        qtype = kind
        questions.append(
            {
                "id": f"doe-ms-s{set_number}-r{round_number}-q{number}-{qtype[0].lower()}-{digest}",
                "setNumber": set_number,
                "roundNumber": round_number,
                "questionNumber": number,
                "category": category,
                "questionType": qtype,
                "format": "Multiple Choice" if choices else fmt,
                "questionText": question,
                "choices": choices,
                "answer": answer,
                "sourceFile": source_file,
                "sourceYear": source_year,
            }
        )
        stem = ""
        choices = []

    i = 0
    while i < len(lines):
        line = lines[i]
        upper = line.upper()
        if upper == "TOSS-UP" or upper.startswith("TOSS-UP ") and not re.match(r"TOSS-UP\s+\d+\)", upper):
            kind = "TOSS-UP"
            i += 1
            continue
        if upper == "BONUS" or (upper.startswith("BONUS ") and not re.match(r"BONUS\s+\d+\)", upper)):
            kind = "BONUS"
            i += 1
            continue
        inline = re.match(r"^(TOSS-UP|BONUS)\s+(\d+\).+)$", line, re.I)
        if inline:
            kind = "TOSS-UP" if inline.group(1).upper().startswith("TOSS") else "BONUS"
            line = inline.group(2)
        if upper.startswith("ANSWER:"):
            flush(line.split(":", 1)[1])
            i += 1
            continue
        header = parse_header(line)
        if header:
            number = header["number"]
            category = header["category"]
            fmt = header["format"]
            stem = header["stem"]
            choices = []
            i += 1
            while i < len(lines):
                nxt = lines[i]
                nxt_u = nxt.upper()
                if nxt_u.startswith("ANSWER:") or nxt_u in {"TOSS-UP", "BONUS"} or parse_header(nxt) or re.match(r"^(TOSS-UP|BONUS)\s+\d+\)", nxt, re.I):
                    break
                choice = CHOICE.match(nxt)
                if choice:
                    choices.append(f"{choice.group(1).upper()}) {choice.group(2).strip()}")
                    fmt = "Multiple Choice"
                elif stem:
                    stem += " " + nxt
                i += 1
            continue
        i += 1
    if len(questions) >= 10:
        return questions
    return parse_inline_blocks(text, set_number, round_number, source_file, source_year)


def main() -> None:
    try:
        import pypdf  # noqa: F401
    except ImportError:
        raise SystemExit("Install pypdf first: python3 -m pip install pypdf")

    entries = catalog()
    print(f"Official MS packets listed: {len(entries)}")
    questions: list[dict] = []
    seen: set[str] = set()
    ok_pdfs = 0
    parsed_pdfs = 0
    for set_num, round_num, folder, name, url in entries:
        dest = CACHE / folder / name
        if not download(url, dest):
            continue
        ok_pdfs += 1
        try:
            text = pdf_text(dest)
        except Exception as exc:
            print(f"  unreadable {name}: {exc}")
            continue
        rows = parse_text(text, set_num, round_num, name, YEAR.get(set_num))
        added = 0
        for row in rows:
            key = re.sub(r"[^a-z0-9]+", "", (row["questionText"] + row["answer"]).lower())
            if key in seen or len(key) < 16:
                continue
            seen.add(key)
            questions.append(row)
            added += 1
        if added:
            parsed_pdfs += 1
        print(f"  {folder}/{name}: {added} questions")

    OUT.write_text(json.dumps(questions, ensure_ascii=False) + "\n", encoding="utf-8")
    cats: dict[str, int] = {}
    for row in questions:
        cats[row["category"]] = cats.get(row["category"], 0) + 1
    print(f"\nPDFs downloaded: {ok_pdfs}")
    print(f"PDFs with questions: {parsed_pdfs}")
    print(f"Official MS questions: {len(questions)}")
    print("By category:", dict(sorted(cats.items())))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
