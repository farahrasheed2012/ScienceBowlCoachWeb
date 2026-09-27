import { canonicalTopic } from "./topic-map";
import type { DrillResult, PracticeRound } from "./types";

export function topicAccuracy(results: DrillResult[]) {
  return Object.entries(
    results.reduce<Record<string, { t: number; c: number; subject: string }>>((acc, row) => {
      const topic = canonicalTopic(row.topic);
      acc[topic] = acc[topic] ?? { t: 0, c: 0, subject: String(row.subject) };
      acc[topic].t += 1;
      if (row.correct) acc[topic].c += 1;
      return acc;
    }, {}),
  )
    .map(([topic, v]) => ({ topic, subject: v.subject, attempts: v.t, correct: v.c, acc: v.c / v.t }))
    .filter((row) => row.attempts >= 2)
    .sort((a, b) => a.acc - b.acc);
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

export type TopicHistory = {
  topic: string;
  attempts: number;
  correct: number;
  acc: number | null;
  missesWeek: number;
  attemptsWeek: number;
  accWeek: number | null;
  recentMisses: number;
  lastAt?: string;
};

export function topicHistory(results: DrillResult[], topic: string): TopicHistory {
  const key = canonicalTopic(topic);
  const rows = results
    .filter((row) => canonicalTopic(row.topic) === key)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const weekAgo = Date.now() - 7 * 86400000;
  const week = rows.filter((row) => new Date(row.at).getTime() >= weekAgo);
  const last10 = rows.slice(-10);
  return {
    topic: key,
    attempts: rows.length,
    correct: rows.filter((row) => row.correct).length,
    acc: rows.length ? rows.filter((row) => row.correct).length / rows.length : null,
    missesWeek: week.filter((row) => !row.correct).length,
    attemptsWeek: week.length,
    accWeek: week.length ? week.filter((row) => row.correct).length / week.length : null,
    recentMisses: last10.filter((row) => !row.correct).length,
    lastAt: rows.at(-1)?.at,
  };
}

export function daysAgoLabel(iso?: string, now = Date.now()) {
  if (!iso) return null;
  const days = Math.floor((now - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export function missionWhy(results: DrillResult[], topic: string) {
  const history = topicHistory(results, topic);
  const bullets: string[] = [];
  if (history.accWeek != null) {
    bullets.push(`${Math.round(history.accWeek * 100)}% accuracy this week`);
  } else if (history.acc != null) {
    bullets.push(`${Math.round(history.acc * 100)}% after ${history.attempts} ${history.attempts === 1 ? "try" : "tries"}`);
  }
  if (history.missesWeek) {
    bullets.push(`${history.missesWeek} miss${history.missesWeek === 1 ? "" : "es"} this week`);
  } else if (history.recentMisses) {
    bullets.push(`${history.recentMisses} miss${history.recentMisses === 1 ? "" : "es"} in the last 10 tries`);
  }
  const when = daysAgoLabel(history.lastAt);
  if (when) bullets.push(`Last practiced ${when}`);
  else bullets.push("Not practiced yet — start here so I can see what you miss.");
  return bullets;
}
