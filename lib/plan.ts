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

export type TodayMission = {
  subject: string;
  topic: string;
  reason: string;
  minutes: number;
  activities: string;
  outcome: string;
  href: string;
  planId: string;
  startSession: boolean;
};

function lastMissAt(results: DrillResult[], topic: string) {
  const miss = [...results].reverse().find((row) => row.topic === topic && !row.correct);
  return miss ? new Date(miss.at) : null;
}

export function todaysMission(input: {
  week: number;
  drillResults: DrillResult[];
  dueCount: number;
  completedSessionIds: string[];
  extraDone: string[];
  date?: Date;
}): TodayMission {
  const date = input.date ?? new Date();
  const plan = buildTodayPlan({ ...input, date });
  const weak = topicAccuracy(input.drillResults).find((row) => row.acc < 0.7);
  const block = featuredBlock(input.week, date);
  const next = plan.find((item) => !item.done) ?? plan[plan.length - 1];
  const flashUrgent = input.dueCount >= 8;
  const stillWeak = Boolean(weak);
  const pick = flashUrgent
    ? plan.find((item) => item.id === "flash") ?? next
    : stillWeak
      ? plan.find((item) => item.id === "weak") ?? next
      : next;

  if (pick.id === "flash") {
    return {
      subject: "Review",
      topic: input.dueCount ? `${input.dueCount} flashcards due` : "Flashcards",
      reason: input.dueCount
        ? `${input.dueCount} cards are due now — missed toss-ups and key terms.`
        : "The pile is clear. A short flip keeps the streak.",
      minutes: pick.minutes,
      activities: "Spaced recall",
      outcome: "Clear the due pile",
      href: pick.href,
      planId: pick.id,
      startSession: false,
    };
  }

  if (pick.id === "weak") {
    const miss = weak ? lastMissAt(input.drillResults, weak.topic) : null;
    const recent = miss && Date.now() - miss.getTime() < 36 * 3600 * 1000;
    const checkedOff = Boolean(plan.find((item) => item.id === "weak")?.done);
    return {
      subject: weak?.subject || "Mixed",
      topic: weak?.topic || "Weak-area practice",
      reason: weak
        ? `${Math.round(weak.acc * 100)}% after ${weak.attempts} tries${recent ? " · you missed this recently" : ""}${checkedOff ? " · still under 70% even if you checked it off" : ""}. Open the assigned section, then drill.`
        : "Answer a few questions and this slot will name a weak topic.",
      minutes: pick.minutes,
      activities: "Recall → Read → Know Cold → Toss-ups",
      outcome: weak ? "Get this topic moving toward 70%" : "Find today's weak spot",
      href: pick.href,
      planId: pick.id,
      startSession: isSchoolYear(date),
    };
  }

  if (pick.id === "science") {
    return {
      subject: block?.subject || "Science",
      topic: block?.chapterTitle || "Science block",
      reason: block
        ? `${block.bookCode} ${block.chapter} · today's assigned hour.`
        : "No summer block left — pick an encyclopedia topic.",
      minutes: pick.minutes,
      activities: "Recall → Read → Know Cold → Toss-ups",
      outcome: "Leave knowing the assigned section cold",
      href: pick.href,
      planId: pick.id,
      startSession: Boolean(block),
    };
  }

  if (pick.id === "sprint") {
    return {
      subject: "Regional",
      topic: "Texas Regional Sprint",
      reason: "Deeper than the summer MS pass — know-cold packs for regionals.",
      minutes: pick.minutes,
      activities: "Short-answer know-cold",
      outcome: "5 sprint answers",
      href: pick.href,
      planId: pick.id,
      startSession: false,
    };
  }

  const focus = isSchoolYear(date) ? schoolYearFocus(date) : null;
  return {
    subject: focus?.label || block?.subject || "Mixed",
    topic: pick.title,
    reason: pick.done
      ? "Today's plan is done. A short toss-up keeps the streak."
      : pick.detail,
    minutes: pick.minutes,
    activities: pick.id === "flash" || pick.id === "sprint" ? pick.detail : "Recall → Read → Know Cold → Toss-ups",
    outcome: focus?.subject === "mixed" ? "5 answers across 2 subjects" : "5 answers in today's subject",
    href: pick.href,
    planId: pick.id,
    startSession: isSchoolYear(date) && pick.id !== "flash" && pick.id !== "sprint",
  };
}

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
        detail: weak ? `${Math.round(weak.acc * 100)}% accuracy — open the assigned section, then drill.` : "Answer a few questions and this slot will fill in.",
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
