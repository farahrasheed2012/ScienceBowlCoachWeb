import { canonicalTopic } from "./topic-map";
import type { DrillResult, PracticeRound } from "./types";

export function topicAccuracy(results: DrillResult[]) {
  return topicPerformances(results)
    .filter((row) => row.attempts >= 2)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map((row) => ({
      topic: row.topic,
      subject: row.subject,
      attempts: row.attempts,
      correct: row.correct,
      acc: row.accuracy,
    }));
}

export type TopicPerformance = {
  topic: string;
  subject: string;
  attempts: number;
  correct: number;
  accuracy: number;
  lastAttemptAt: string | null;
  lastMissAt: string | null;
  attempts7d: number;
  correct7d: number;
  accuracy7d: number | null;
  misses7d: number;
  currentStreak: number;
  missesLast10: number;
  missedLast3: number;
  last5Correct: number;
  last5: number;
};

export function topicPerformances(results: DrillResult[]): TopicPerformance[] {
  const byTopic = new Map<string, DrillResult[]>();
  for (const row of results) {
    const topic = canonicalTopic(row.topic);
    const list = byTopic.get(topic) ?? [];
    list.push(row);
    byTopic.set(topic, list);
  }
  return [...byTopic.entries()].map(([topic, rows]) => performanceFromRows(topic, rows));
}

export function performanceFor(results: DrillResult[], topic: string): TopicPerformance {
  const key = canonicalTopic(topic);
  const rows = results.filter((row) => canonicalTopic(row.topic) === key);
  return performanceFromRows(key, rows);
}

function performanceFromRows(topic: string, raw: DrillResult[]): TopicPerformance {
  const rows = [...raw].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const weekAgo = Date.now() - 7 * 86400000;
  const week = rows.filter((row) => new Date(row.at).getTime() >= weekAgo);
  const last10 = rows.slice(-10);
  const last3 = rows.slice(-3);
  const last5 = rows.slice(-5);
  const correct = rows.filter((row) => row.correct).length;
  const correct7d = week.filter((row) => row.correct).length;
  let currentStreak = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (!rows[i].correct) break;
    currentStreak += 1;
  }
  return {
    topic,
    subject: String(rows.at(-1)?.subject ?? ""),
    attempts: rows.length,
    correct,
    accuracy: rows.length ? correct / rows.length : 0,
    lastAttemptAt: rows.at(-1)?.at ?? null,
    lastMissAt: [...rows].reverse().find((row) => !row.correct)?.at ?? null,
    attempts7d: week.length,
    correct7d,
    accuracy7d: week.length ? correct7d / week.length : null,
    misses7d: week.length - correct7d,
    currentStreak,
    missesLast10: last10.filter((row) => !row.correct).length,
    missedLast3: last3.filter((row) => !row.correct).length,
    last5Correct: last5.filter((row) => row.correct).length,
    last5: last5.length,
  };
}

export function topicHistory(results: DrillResult[], topic: string) {
  const row = performanceFor(results, topic);
  return {
    topic: row.topic,
    attempts: row.attempts,
    correct: row.correct,
    acc: row.attempts ? row.accuracy : null,
    missesWeek: row.misses7d,
    attemptsWeek: row.attempts7d,
    accWeek: row.accuracy7d,
    recentMisses: row.missesLast10,
    lastAt: row.lastAttemptAt ?? undefined,
  };
}

export function daysAgoLabel(iso?: string | null, now = Date.now()) {
  if (!iso) return null;
  const days = Math.floor((now - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export function weekdaySince(iso?: string | null) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return null;
  if (days === 1) return "yesterday";
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long" });
}

export function whyToday(row: TopicPerformance) {
  const bullets: string[] = [];
  if (row.attempts) {
    bullets.push(`${Math.round(row.accuracy * 100)}% accuracy over ${row.attempts} ${row.attempts === 1 ? "attempt" : "attempts"}`);
  }
  const missed = daysAgoLabel(row.lastMissAt);
  if (missed) bullets.push(`Last missed ${missed}`);
  if (row.misses7d) {
    bullets.push(`${row.misses7d} miss${row.misses7d === 1 ? "" : "es"} in the last 7 days`);
  }
  if (row.missedLast3 >= 2 && row.last5 >= 3) {
    bullets.push(`Missed ${row.missedLast3} of the last 3`);
  }
  const reviewed = weekdaySince(row.lastAttemptAt);
  if (reviewed) bullets.push(`This topic hasn't been reviewed since ${reviewed}`);
  if (!bullets.length) bullets.push("Not practiced yet — start here so I can see what you miss.");
  return bullets;
}

export function todayGoal(row?: TopicPerformance | null) {
  if (!row || row.last5 < 3) return "Get to 4/5 correct on this topic.";
  if (row.last5Correct >= 4) return "Stay at 4/5 or better on this topic.";
  return "Get to 4/5 correct on this topic.";
}

export function subjectAccuracy(results: DrillResult[], subject: string, days = 3650) {
  const since = Date.now() - days * 86400000;
  const rows = results.filter((r) => String(r.subject).toLowerCase().includes(subject.toLowerCase()) && new Date(r.at).getTime() >= since);
  if (!rows.length) return null;
  return rows.filter((r) => r.correct).length / rows.length;
}

export function accuracyWindow(results: DrillResult[], daysAgoStart: number, daysAgoEnd = 0) {
  const now = Date.now();
  const start = now - daysAgoStart * 86400000;
  const end = now - daysAgoEnd * 86400000;
  const rows = results.filter((r) => {
    const t = new Date(r.at).getTime();
    return t >= start && t < end;
  });
  if (!rows.length) return null;
  return rows.filter((r) => r.correct).length / rows.length;
}

export function improvedTopics(results: DrillResult[]) {
  const byTopic = new Map<string, DrillResult[]>();
  for (const row of results) {
    const topic = canonicalTopic(row.topic);
    const list = byTopic.get(topic) ?? [];
    list.push(row);
    byTopic.set(topic, list);
  }
  return [...byTopic.entries()]
    .filter(([, list]) => list.length >= 4)
    .map(([topic, list]) => {
      const mid = Math.floor(list.length / 2);
      const before = list.slice(0, mid).filter((r) => r.correct).length / mid;
      const after = list.slice(mid).filter((r) => r.correct).length / (list.length - mid);
      return { topic, before, after, delta: after - before };
    })
    .filter((row) => row.delta > 0.05)
    .sort((a, b) => b.delta - a.delta);
}

export function studyMinutes(rounds: PracticeRound[]) {
  return Math.round(rounds.reduce((sum, round) => sum + round.seconds, 0) / 60);
}

export function paceSeconds(rounds: PracticeRound[]) {
  const asked = rounds.reduce((sum, round) => sum + round.asked, 0);
  const seconds = rounds.reduce((sum, round) => sum + round.seconds, 0);
  if (!asked) return null;
  return seconds / asked;
}
