import { regionalSprint } from "./catalogs";
import { matchesSubject } from "./questions";
import { blocksForWeek, isSchoolYear, schoolYearFocus, todayBlocks, weekdayFromDate } from "./schedule";
import { topicAccuracy } from "./stats";
import type { DrillResult, StudyBlock } from "./types";

export type PlanItem = {
  id: string;
  minutes: number;
  title: string;
  detail: string;
  href: string;
  done: boolean;
};

export function featuredBlock(week: number, date = new Date()): StudyBlock | null {
  const today = todayBlocks(week, date);
  if (today[0]) return today[0];
  for (let w = week; w >= 1; w--) {
    const list = blocksForWeek(w);
    if (list.length) return list[list.length - 1];
  }
  return null;
}

function sameDay(iso: string, date = new Date()) {
  return new Date(iso).toDateString() === date.toDateString();
}

function tossupFinished(answeredToday: DrillResult[], subject: string) {
  if (subject === "mixed") {
    const subjects = new Set(answeredToday.map((row) => String(row.subject).toLowerCase()));
    return answeredToday.length >= 5 && subjects.size >= 2;
  }
  return answeredToday.filter((row) => matchesSubject({ category: String(row.subject) }, subject)).length >= 5;
}

export function buildTodayPlan(input: {
  week: number;
  drillResults: DrillResult[];
  dueCount: number;
  completedSessionIds: string[];
  extraDone: string[];
  date?: Date;
}): PlanItem[] {
  const date = input.date ?? new Date();
  const block = featuredBlock(input.week, date);
  const weekday = weekdayFromDate(date);
  const weak = topicAccuracy(input.drillResults).find((row) => row.acc < 0.7);
  const answeredToday = input.drillResults.filter((row) => sameDay(row.at, date));
  const sessionDone = Boolean(block && input.completedSessionIds.includes(block.id));
  const tossDone = answeredToday.some((row) => !block || String(row.subject).toLowerCase().includes(block.subject));
  const weakDone = Boolean(weak && answeredToday.some((row) => row.topic === weak.topic));
  const sprintHits = answeredToday.filter((row) => regionalSprint.some((pack) => pack.title === row.topic)).length;
  const sprintDone = input.extraDone.includes("sprint") || sprintHits >= 5;

  if (isSchoolYear(date)) {
    const focus = schoolYearFocus(date);
    return [
      {
        id: "weak",
        minutes: 15,
        title: weak ? `Weak area · ${weak.topic}` : "Weak-area practice",
        detail: weak ? `${Math.round(weak.acc * 100)}% accuracy — this is the school-year priority.` : "Answer a few questions and this slot will fill in.",
        href: weak ? `/practice/play?mode=weak&topic=${encodeURIComponent(weak.topic)}` : "/practice/play?mode=weak",
        done: weakDone || input.extraDone.includes("weak"),
      },
      {
        id: "tossup",
        minutes: 15,
        title: `Toss-up · ${focus.label}`,
        detail: focus.subject === "earth" || focus.subject === "energy"
          ? "Summer skipped this category. Short official clock."
          : "Buzz, answer, next. Official 5s / 20s clock.",
        href: focus.href,
        done: input.extraDone.includes("tossup") || tossupFinished(answeredToday, focus.subject),
      },
      {
        id: "sprint",
        minutes: 10,
        title: "Regional sprint",
        detail: "Know-cold packs for Texas regionals — deeper than the summer MS pass.",
        href: "/practice/play?mode=sprint",
        done: sprintDone,
      },
      {
        id: "flash",
        minutes: 5,
        title: "Flashcards",
        detail: input.dueCount ? `${input.dueCount} due today` : "None due — keep the streak.",
        href: "/learn/flash",
        done: input.dueCount === 0,
      },
    ];
  }

  const scienceHref = block ? `#session-${block.id}` : "/learn";
  const items: PlanItem[] = [
    {
      id: "science",
      minutes: weekday ? 25 : 10,
      title: block ? `${weekday ? "Science block" : "Review"} · ${block.chapterTitle}` : "Open Learn",
      detail: block
        ? `${block.bookCode} ${block.chapter} · ${block.topic}`
        : "No summer block left — pick an encyclopedia topic.",
      href: scienceHref,
      done: sessionDone || input.extraDone.includes("science"),
    },
    {
      id: "tossup",
      minutes: 15,
      title: block ? `Toss-up · ${block.subject}` : "Toss-up drill",
      detail: "Buzz, answer, next. Official 5s / 20s clock.",
      href: block ? `/practice/play?mode=subject&subject=${block.subject}` : "/practice/play?mode=tossup",
      done: tossDone || input.extraDone.includes("tossup"),
    },
    {
      id: "weak",
      minutes: 10,
      title: weak ? `Weak area · ${weak.topic}` : "Weak-area practice",
      detail: weak ? `${Math.round(weak.acc * 100)}% accuracy — practice this today.` : "Answer a few questions and this slot will fill in.",
      href: weak ? `/practice/play?mode=weak&topic=${encodeURIComponent(weak.topic)}` : "/practice/play?mode=weak",
      done: weakDone || input.extraDone.includes("weak"),
    },
    {
      id: "flash",
      minutes: 5,
      title: "Flashcards",
      detail: input.dueCount ? `${input.dueCount} due today` : "None due — keep the streak.",
      href: "/learn/flash",
      done: input.dueCount === 0,
    },
  ];
  return items;
}
