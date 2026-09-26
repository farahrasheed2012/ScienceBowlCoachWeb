import { blocksForWeek, todayBlocks, weekdayFromDate } from "./schedule";
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
  const flashDone = input.dueCount === 0 || input.extraDone.includes("flash");

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
      done: input.dueCount === 0 || flashDone,
    },
  ];
  return items;
}
