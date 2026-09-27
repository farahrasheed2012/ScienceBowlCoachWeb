#!/usr/bin/env python3
"""Pull SohaPythonCoach curriculum into JSON. Does not modify the Mac app."""

from __future__ import annotations

import json
import re
from pathlib import Path

MAC = Path("/Users/farah/Documents/FarahRasheed/SohaPythonCoach")
OUT = Path(__file__).resolve().parent.parent / "data" / "python_coach.json"

CAPSTONE_INTRO = (
    "Session capstone — complete the lessons above in this week first, "
    "then finish the project below in Playground.\n\n"
)

DEFAULT_STEPS = [
    "Complete all teach lessons in this week first.",
    "Read the Session capstone checklist in Learn.",
    "Open Playground on the Mac and fill each TODO in the scaffold.",
    "Run often — fix one error at a time.",
    "Run auto-checks, then mark complete.",
]

SESSION_KINDS = {
    "sessionLesson": ("Session", ""),
    "advancedLive": ("Level 2 Session", "\n\n**Level 2** · ~30 min app lesson."),
    "level3Live": ("Level 3 Session", "\n\n**Level 3** · ~30 min app lesson."),
    "level4Live": ("Level 4 Session", "\n\n**Level 4** · ~30 min app lesson."),
    "level4Portfolio": ("Portfolio Lab", "\n\n**Level 4 Portfolio Lab** · Course 4 · Apply Level 4 sessions to a portfolio project."),
}

LEVELS = [
    {"id": "l1", "title": "Level 1", "subtitle": "Foundations", "weeks": list(range(1, 11))},
    {"id": "l2", "title": "Level 2", "subtitle": "Errors, OOP, data", "weeks": list(range(11, 21))},
    {"id": "l3", "title": "Level 3", "subtitle": "GUIs and projects", "weeks": list(range(21, 31))},
    {"id": "l4", "title": "Level 4", "subtitle": "Algorithms and ML", "weeks": list(range(31, 41))},
    {"id": "pf", "title": "Portfolio", "subtitle": "Ship and present", "weeks": list(range(41, 51))},
]


def unescape(text: str) -> str:
    return (
        text.replace(r"\"", '"')
        .replace(r"\n", "\n")
        .replace(r"\t", "\t")
        .replace(r"\\", "\\")
    )


def skip_ws(text: str, i: int) -> int:
    while i < len(text):
        if text[i] in " \t\r\n,":
            i += 1
            continue
        if text.startswith("//", i):
            nl = text.find("\n", i)
            i = len(text) if nl < 0 else nl + 1
            continue
        if text.startswith("/*", i):
            end = text.find("*/", i + 2)
            i = len(text) if end < 0 else end + 2
            continue
        break
    return i


def parse_triple(text: str, i: int) -> tuple[str, int]:
    assert text.startswith('"""', i)
    i += 3
    if i < len(text) and text[i] == "\n":
        i += 1
    start = i
    close = text.find('"""', i)
    if close < 0:
        raise ValueError("unterminated triple string")
    return text[start:close].rstrip("\n"), close + 3


def parse_string(text: str, i: int) -> tuple[str, int]:
    assert text[i] == '"'
    i += 1
    out: list[str] = []
    while i < len(text):
        ch = text[i]
        if text.startswith("\\(", i):
            depth = 1
            i += 2
            out.append("")
            while i < len(text) and depth:
                if text.startswith('"""', i):
                    _, i = parse_triple(text, i)
                    continue
                if text[i] == '"':
                    _, i = parse_string(text, i)
                    continue
                if text[i] == "(":
                    depth += 1
                elif text[i] == ")":
                    depth -= 1
                i += 1
            continue
        if ch == "\\":
            out.append(unescape(text[i : i + 2]))
            i += 2
            continue
        if ch == '"':
            return "".join(out), i + 1
        out.append(ch)
        i += 1
    raise ValueError("unterminated string")


def parse_array(text: str, i: int) -> tuple[list, int]:
    assert text[i] == "["
    i += 1
    items: list = []
    while i < len(text):
        i = skip_ws(text, i)
        if i < len(text) and text[i] == "]":
            return items, i + 1
        value, i = parse_expr(text, i)
        if isinstance(value, dict) and value.get("_skip"):
            continue
        items.append(value)
    raise ValueError("unterminated array")


def parse_ident(text: str, i: int) -> tuple[str, int]:
    start = i
    while i < len(text) and (text[i].isalnum() or text[i] in "._"):
        i += 1
    return text[start:i], i


def parse_value(text: str, i: int):
    i = skip_ws(text, i)
    if i >= len(text):
        raise ValueError("unexpected end")
    if text.startswith('"""', i):
        return parse_triple(text, i)
    if text[i] == '"':
        return parse_string(text, i)
    if text[i] == "[":
        return parse_array(text, i)
    if text.startswith("nil", i) and not (len(text) > i + 3 and text[i + 3].isalnum()):
        return None, i + 3
    if text.startswith("true", i):
        return True, i + 4
    if text.startswith("false", i):
        return False, i + 5
    if text[i] in "-0123456789":
        start = i
        i += 1
        while i < len(text) and (text[i].isdigit() or text[i] == "."):
            i += 1
        raw = text[start:i]
        return (float(raw) if "." in raw else int(raw)), i
    if text[i] == ".":
        ident, j = parse_ident(text, i + 1)
        return f".{ident}", j
    if text[i].isalpha() or text[i] == "_":
        ident, j = parse_ident(text, i)
        j2 = skip_ws(text, j)
        if j2 < len(text) and text[j2] == "(":
            _, end = parse_call_args(text, j2 + 1)
            return {"_skip": True, "ident": ident}, end
        return ident, j
    raise ValueError(f"bad value at {i}: {text[i:i + 40]!r}")


def parse_expr(text: str, i: int):
    value, i = parse_value(text, i)
    while True:
        j = skip_ws(text, i)
        if text.startswith("??", j):
            other, i = parse_value(text, j + 2)
            if value is None:
                value = other
            continue
        if j < len(text) and text[j] == "+":
            other, i = parse_value(text, j + 1)
            if isinstance(value, str) and isinstance(other, str):
                value = value + other
            elif value is None:
                value = other
            continue
        return value, i


def parse_call_args(text: str, i: int) -> tuple[dict, int]:
    args: dict = {}
    while i < len(text):
        i = skip_ws(text, i)
        if i < len(text) and text[i] == ")":
            return args, i + 1
        name, i = parse_ident(text, i)
        i = skip_ws(text, i)
        if i >= len(text) or text[i] != ":":
            # positional leftover — skip a value
            _, i = parse_expr(text, i)
            continue
        i += 1
        value, i = parse_expr(text, i)
        if isinstance(value, dict) and value.get("_skip"):
            args[name] = None
        else:
            args[name] = value
    raise ValueError("unterminated call")


def find_calls(text: str, names: tuple[str, ...]) -> list[tuple[str, dict]]:
    found: list[tuple[str, dict]] = []
    for name in names:
        needle = name + "("
        start = 0
        while True:
            idx = text.find(needle, start)
            if idx < 0:
                break
            before = text[max(0, idx - 8) : idx]
            if re.search(r"\bfunc\s+$", before) or before.rstrip().endswith("func"):
                start = idx + len(needle)
                continue
            args, end = parse_call_args(text, idx + len(needle))
            found.append((name, args))
            start = end
    return found


def parse_scaffolds(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for match in re.finditer(r"static let (week\d+) = \"\"\"\n", text):
        name = match.group(1)
        close = text.find('"""', match.end())
        out[f"SessionScaffolds.{name}"] = text[match.end() : close].rstrip("\n")
    return out


def resolve_code(value, scaffolds: dict[str, str]) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        if value.startswith("SessionScaffolds."):
            return scaffolds.get(value)
        return value
    return None


def lesson_sort_key(lesson_id: str) -> tuple[int, int, int]:
    match = re.match(r"w(\d+)-(live|l)(\d+)?$", lesson_id)
    if not match:
        return (999, 9, 0)
    week = int(match.group(1))
    kind = 1 if match.group(2) == "live" else 0
    num = int(match.group(3) or 0)
    return (week, kind, num)


def as_str_list(value) -> list[str]:
    if not value:
        return []
    return [item for item in value if isinstance(item, str)]


def main() -> None:
    seed = (MAC / "Data" / "CurriculumSeed.swift").read_text()
    teaching = (MAC / "Data" / "SessionTeachingLessons.swift").read_text()
    scaffolds = parse_scaffolds((MAC / "Data" / "SessionScaffolds.swift").read_text())
    blob = seed + "\n" + teaching

    lessons: dict[str, dict] = {}

    for _, args in find_calls(blob, ("LessonStep", "teachingLesson")):
        lesson_id = args.get("id")
        if not isinstance(lesson_id, str) or not re.match(r"w\d+-(live|l\d+)$", lesson_id):
            continue
        lessons[lesson_id] = {
            "id": lesson_id,
            "kind": "lesson",
            "title": args.get("title") or lesson_id,
            "body": args.get("body") or "",
            "teacherScript": args.get("teacherScript") or "",
            "tryItPrompt": args.get("tryItPrompt"),
            "practiceSteps": as_str_list(args.get("practiceSteps")),
            "starterCode": resolve_code(args.get("starterCode"), scaffolds),
            "challengeQuestion": args.get("challengeQuestion"),
            "challengeAnswer": args.get("challengeAnswer"),
            "challengeAcceptedAnswers": as_str_list(args.get("challengeAcceptedAnswers")),
            "durationMinutes": args.get("durationMinutes"),
        }

    for name, args in find_calls(blob, tuple(SESSION_KINDS)):
        week = args.get("week")
        session_number = args.get("sessionNumber") if args.get("sessionNumber") is not None else args.get("labNumber")
        title = args.get("title")
        if not isinstance(week, int) or not isinstance(session_number, int) or not isinstance(title, str):
            continue
        prefix, suffix = SESSION_KINDS[name]
        lesson_id = f"w{week}-live"
        body = CAPSTONE_INTRO + (args.get("body") or "") + suffix
        lessons[lesson_id] = {
            "id": lesson_id,
            "kind": "session",
            "title": f"{prefix} {session_number}: {title}",
            "body": body,
            "teacherScript": args.get("teacherScript") or "",
            "tryItPrompt": args.get("tryItPrompt"),
            "practiceSteps": as_str_list(args.get("practiceSteps")) or DEFAULT_STEPS,
            "starterCode": resolve_code(args.get("starterCode"), scaffolds),
            "challengeQuestion": args.get("challengeQuestion"),
            "challengeAnswer": args.get("challengeAnswer"),
            "challengeAcceptedAnswers": as_str_list(args.get("challengeAcceptedAnswers")),
            "durationMinutes": 30,
        }

    weeks: list[dict] = []
    week_re = re.compile(
        r"private static let week(\d+) = WeekUnit\(\s*"
        r"id:\s*(\d+),\s*"
        r'title:\s*"((?:\\.|[^"\\])*)",\s*'
        r'subtitle:\s*"((?:\\.|[^"\\])*)",\s*'
        r'emoji:\s*"((?:\\.|[^"\\])*)",\s*'
        r'goal:\s*"((?:\\.|[^"\\])*)",\s*'
        r"skills:\s*\[(.*?)\]",
        re.S,
    )
    for match in week_re.finditer(seed):
        week_id = int(match.group(2))
        if week_id < 1 or week_id > 50:
            continue
        weeks.append(
            {
                "id": week_id,
                "title": unescape(match.group(3)),
                "subtitle": unescape(match.group(4)),
                "emoji": unescape(match.group(5)),
                "goal": unescape(match.group(6)),
                "skills": re.findall(r'"((?:\\.|[^"\\])*)"', match.group(7)),
            }
        )
    weeks = sorted({week["id"]: week for week in weeks}.values(), key=lambda row: row["id"])

    games = []
    for _, args in find_calls(seed, ("GameProject",)):
        game_id = args.get("id")
        if not isinstance(game_id, str):
            continue
        games.append(
            {
                "id": game_id,
                "kind": "game",
                "title": args.get("title") or game_id,
                "weekNumber": args.get("weekNumber"),
                "summary": args.get("summary") or "",
                "skills": as_str_list(args.get("skills")),
                "steps": as_str_list(args.get("steps")),
                "starterCode": resolve_code(args.get("starterCode"), scaffolds),
                "stretchGoal": args.get("stretchGoal"),
            }
        )

    ordered = sorted(lessons.values(), key=lambda row: lesson_sort_key(row["id"]))
    by_week: dict[int, list[str]] = {week["id"]: [] for week in weeks}
    for lesson in ordered:
        match = re.match(r"w(\d+)-", lesson["id"])
        if not match:
            continue
        week_id = int(match.group(1))
        by_week.setdefault(week_id, []).append(lesson["id"])
    for week in weeks:
        week["lessonIds"] = by_week.get(week["id"], [])

    payload = {
        "source": "SohaPythonCoach",
        "note": "Read on iPhone. Run in the Mac Python Coach playground.",
        "levels": LEVELS,
        "weeks": weeks,
        "lessons": ordered,
        "games": games,
    }
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    missing_code = sum(1 for lesson in ordered if not lesson.get("starterCode"))
    print(
        f"wrote {OUT.name}: {len(weeks)} weeks, {len(ordered)} lessons, "
        f"{len(games)} games, {missing_code} lessons without starter"
    )


if __name__ == "__main__":
    main()
