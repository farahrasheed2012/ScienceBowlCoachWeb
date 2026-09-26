#!/usr/bin/env python3
"""Pull study catalogs from the Mac ScienceBowlCoach sources into JSON."""

from __future__ import annotations

import json
import re
from pathlib import Path

MAC = Path("/Users/farah/Documents/FarahRasheed/ScienceBowlCoach")
OUT = Path(__file__).resolve().parent.parent / "data"


def write(name: str, payload) -> None:
    path = OUT / name
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {path.name} ({len(payload) if hasattr(payload, '__len__') else 'ok'})")


def parse_study_blocks() -> list[dict]:
    text = "\n".join(
        (MAC / "Data" / name).read_text()
        for name in ("SeedDataWeeks1_4.swift", "SeedDataWeeks5_10.swift")
    )
    blocks: list[dict] = []
    pattern = re.compile(
        r"block\(week:\s*(\d+),\s*day:\s*\.(\w+),\s*subject:\s*\.(\w+),\s*pass:\s*\.(\w+),\s*"
        r'book:\s*"([^"]*)",\s*chapter:\s*"([^"]*)",\s*title:\s*"([^"]*)"',
        re.S,
    )
    for match in pattern.finditer(text):
        start = match.start()
        chunk = text[start : start + 4000]
        end = chunk.find("]),")
        if end == -1:
            end = chunk.find("])")
        chunk = chunk[: end + 2] if end != -1 else chunk

        def field(name: str) -> str | None:
            m = re.search(rf'{name}:\s*"((?:\\.|[^"\\])*)"', chunk)
            return m.group(1) if m else None

        know = re.search(r"knowCold:\s*\[(.*?)\]", chunk, re.S)
        know_cold = re.findall(r'"((?:\\.|[^"\\])*)"', know.group(1)) if know else []
        topic = field("topic") or ""
        tossups = [
            {"question": q, "answer": a}
            for q, a in re.findall(r'\("((?:\\.|[^"\\])*)",\s*"((?:\\.|[^"\\])*)"\)', chunk)
        ]
        week = int(match.group(1))
        day = match.group(2)
        subject = match.group(3)
        blocks.append(
            {
                "id": f"w{week}-{day}-{subject}",
                "week": week,
                "day": day,
                "subject": subject,
                "pass": match.group(4),
                "bookCode": match.group(5),
                "chapter": match.group(6),
                "chapterTitle": match.group(7),
                "pass2BookCode": field("pass2Book"),
                "pass2Chapter": field("pass2Chapter"),
                "pass2ChapterTitle": field("pass2Title"),
                "backupBookLine": field("backupBookLine"),
                "focus": field("focus") or "",
                "formulasAndTerms": field("formulas") or "",
                "knowCold": know_cold,
                "topic": topic,
                "sampleTossups": tossups,
            }
        )
    return blocks


def parse_regional_sprint() -> list[dict]:
    text = (MAC / "Data" / "RegionalSprintCatalog.swift").read_text()
    packs = []
    for pack in re.finditer(
        r'Pack\(\s*id:\s*"([^"]+)",\s*track:\s*\.(\w+),\s*title:\s*"([^"]+)",\s*subtitle:\s*"([^"]+)",\s*topicId:\s*"([^"]+)",',
        text,
    ):
        start = pack.start()
        chunk = text[start : start + 3500]
        know = re.search(r"knowCold:\s*\[(.*?)\]", chunk, re.S)
        know_cold = re.findall(r'"((?:\\.|[^"\\])*)"', know.group(1)) if know else []
        toss_chunk = re.search(r"tossups:\s*\[(.*?)\]\s*\)", chunk, re.S)
        tossups = (
            [
                {"question": q, "answer": a}
                for q, a in re.findall(r'\("((?:\\.|[^"\\])*)",\s*"((?:\\.|[^"\\])*)"\)', toss_chunk.group(1))
            ]
            if toss_chunk
            else []
        )
        packs.append(
            {
                "id": pack.group(1),
                "track": pack.group(2),
                "title": pack.group(3),
                "subtitle": pack.group(4),
                "topicId": pack.group(5),
                "knowCold": know_cold,
                "tossups": tossups,
            }
        )
    return packs


def parse_pot6_topics() -> list[dict]:
    text = (MAC / "Data" / "POT6TopicRegistry.swift").read_text()
    topics = []
    for m in re.finditer(
        r'MathTopic\(\s*id:\s*"([^"]+)",\s*code:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*pot6Category:\s*\.(\w+),\s*isCompetitionOnly:\s*(true|false),\s*conceptSummary:\s*"((?:\\.|[^"\\])*)"',
        text,
        re.S,
    ):
        chunk_start = m.start()
        chunk = text[chunk_start : chunk_start + 8000]
        formulas = re.search(r"keyFormulas:\s*\[(.*?)\]", chunk, re.S)
        key_formulas = re.findall(r'"((?:\\.|[^"\\])*)"', formulas.group(1)) if formulas else []
        topics.append(
            {
                "id": m.group(1),
                "code": m.group(2),
                "title": m.group(3),
                "category": m.group(4),
                "isCompetitionOnly": m.group(5) == "true",
                "conceptSummary": m.group(6).replace("\\n", "\n"),
                "keyFormulas": key_formulas,
            }
        )
    return topics


def parse_pot6_catchup() -> list[dict]:
    text = (MAC / "Data" / "POT6CatchUpCatalog.swift").read_text()
    items = []
    for m in re.finditer(
        r'Item\(potCode:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*catchUpDay:\s*(\d+),\s*bfnChapters:\s*\[([^\]]*)\],\s*practiceTopicIds:\s*\[([^\]]*)\],\s*isJanJune:\s*(true|false)\)',
        text,
    ):
        items.append(
            {
                "potCode": m.group(1),
                "title": m.group(2),
                "catchUpDay": int(m.group(3)),
                "bfnChapters": [int(x) for x in re.findall(r"\d+", m.group(4))],
                "practiceTopicIds": re.findall(r'"([^"]+)"', m.group(5)),
                "isJanJune": m.group(6) == "true",
            }
        )
    return items


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    write("study-blocks.json", parse_study_blocks())
    write("regional-sprint.json", parse_regional_sprint())
    write("pot6-topics.json", parse_pot6_topics())
    write("pot6-catchup.json", parse_pot6_catchup())


if __name__ == "__main__":
    main()
