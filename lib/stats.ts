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
