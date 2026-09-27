import { matchesSubject } from "./questions";
import { topicPerformances } from "./stats";
import { articleForLabel } from "./topic-map";
import type { DrillResult } from "./types";

export const READINESS_SUBJECTS = [
  { id: "biology", label: "Biology" },
  { id: "chemistry", label: "Chemistry" },
  { id: "physics", label: "Physics" },
  { id: "earth", label: "Earth & Space" },
  { id: "energy", label: "Energy" },
  { id: "math", label: "Math" },
] as const;

export type SubjectReadiness = {
  id: string;
  label: string;
  attempts: number;
  knowledge: number | null;
  speed: number | null;
  readiness: number | null;
};

export type BuzzBand = "early" | "middle" | "late";

export type Prescription = {
  diagnosis: string;
  steps: string[];
  href?: string;
};

export type Readiness = {
  overall: number | null;
  subjects: SubjectReadiness[];
  biggest: SubjectReadiness | null;
  sentence: string;
  buzz: { early: number; middle: number; late: number; n: number } | null;
  tossup: number | null;
  bonus: number | null;
  timedAttempts: number;
  prescription: Prescription;
};

function recencyWeight(at: string, now: number) {
  const days = (now - new Date(at).getTime()) / 86400000;
  if (days <= 7) return 1;
  if (days <= 21) return 0.7;
  if (days <= 60) return 0.45;
  return 0.25;
}

function weightedAccuracy(rows: DrillResult[], now: number) {
  let weight = 0;
  let hits = 0;
  for (const row of rows) {
    const w = recencyWeight(row.at, now);
    weight += w;
    if (row.correct) hits += w;
  }
  return weight ? hits / weight : null;
}

function mean(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function knowledgeRows(rows: DrillResult[]) {
  const quiet = rows.filter((row) => row.timed === false || row.kind === "recall");
  return quiet.length >= 3 ? quiet : rows;
}

function speedRows(rows: DrillResult[]) {
  return rows.filter((row) => row.timed && row.kind !== "bonus");
}

function speedScore(rows: DrillResult[], now: number) {
  const acc = weightedAccuracy(rows, now);
  const clocked = rows.filter((row) => row.secondsUsed != null && row.secondsAllowed);
  const pace = mean(clocked.map((row) => 1 - Math.min(1, (row.secondsUsed ?? 0) / (row.secondsAllowed || 1))));
  if (acc == null) return null;
  if (pace == null) return acc;
  return acc * 0.65 + pace * 0.35;
}

function blend(knowledge: number | null, speed: number | null) {
  if (knowledge == null && speed == null) return null;
  if (speed == null) return knowledge;
  if (knowledge == null) return speed;
  return knowledge * 0.6 + speed * 0.4;
}

function bandFor(row: DrillResult): BuzzBand | null {
  const mark = row.buzzedAtSec ?? row.secondsUsed;
  const allowed = row.secondsAllowed;
  if (mark == null || !allowed) return null;
  const frac = mark / allowed;
  if (frac < 0.34) return "early";
  if (frac < 0.67) return "middle";
  return "late";
}

function rate(rows: DrillResult[]) {
  if (!rows.length) return null;
  return rows.filter((row) => row.correct).length / rows.length;
}

function subjectRows(results: DrillResult[], id: string) {
  return results.filter((row) => matchesSubject({ category: String(row.subject) }, id));
}

function sentence(ready: Omit<Readiness, "sentence" | "prescription">) {
  if (ready.overall == null) return "Answer a few questions and I can score readiness.";
  const gap = ready.biggest;
  const knowledge = mean(ready.subjects.map((row) => row.knowledge).filter((value): value is number => value != null));
  const speed = mean(ready.subjects.map((row) => row.speed).filter((value): value is number => value != null));
  if (ready.timedAttempts < 5) return "I need toss-ups before I can score speed.";
  if (knowledge != null && speed != null && knowledge - speed >= 0.12) {
    return gap
      ? `You're accurate on concepts but slow on toss-ups. Biggest gap: ${gap.label}.`
      : "You're accurate on concepts but slow on toss-ups.";
  }
  if (knowledge != null && speed != null && speed - knowledge >= 0.12) {
    return "You buzz quickly but miss the concept. Slow down for the last clause.";
  }
  if (ready.tossup != null && ready.bonus != null && ready.tossup - ready.bonus >= 0.15) {
    return "Toss-up knowledge is strong. Bonus performance is limiting your scoring.";
  }
  if (ready.tossup != null && ready.bonus != null && ready.bonus - ready.tossup >= 0.15) {
    return "Bonuses land. Toss-ups are the leak.";
  }
  if (gap) return `Your biggest opportunity is ${gap.label}.`;
  return "Keep the mix moving. No single subject is pulling you down.";
}

function prescribe(ready: Omit<Readiness, "prescription">, results: DrillResult[]): Prescription {
  const weak = topicPerformances(results)
    .filter((row) => row.attempts >= 2)
    .sort((a, b) => a.accuracy - b.accuracy)[0];
  const article = weak ? articleForLabel(weak.topic) : undefined;
  const gap = ready.biggest;
  const knowledge = mean(ready.subjects.map((row) => row.knowledge).filter((value): value is number => value != null));
  const speed = mean(ready.subjects.map((row) => row.speed).filter((value): value is number => value != null));

  if (ready.overall == null || ready.timedAttempts < 5) {
    return {
      diagnosis: "I need toss-ups before I can score speed.",
      steps: ["5 mixed toss-ups", "Mark what you miss", "Repeat the misses tomorrow"],
      href: "/practice/play?mode=tossup",
    };
  }

  if (knowledge != null && speed != null && knowledge - speed >= 0.12) {
    return {
      diagnosis: gap
        ? `You understand ${gap.label}, but you recognize it too late.`
        : "You understand the ideas, but you recognize them too late.",
      steps: ["5-minute concept review", "3 recognition questions", "5 timed toss-ups"],
      href: gap ? `/practice/play?mode=subject&subject=${gap.id}` : "/practice/play?mode=tossup",
    };
  }

  if (ready.tossup != null && ready.bonus != null && ready.tossup - ready.bonus >= 0.15) {
    return {
      diagnosis: "Your toss-up knowledge is strong. Bonus performance is limiting your scoring.",
      steps: ["2 bonus pairs", "Read the last clause", "One short competition half"],
      href: "/practice/play?mode=bonus",
    };
  }

  if (weak) {
    return {
      diagnosis: `You understand vocabulary but still miss ${weak.topic}.`,
      steps: ["5-minute concept review", "3 recognition questions", "5 toss-ups", "2 short-answer questions"],
      href: article ? `/learn/${article.id}` : `/practice/play?mode=weak&topic=${encodeURIComponent(weak.topic)}`,
    };
  }

  return {
    diagnosis: ready.sentence,
    steps: ["One keep-sharp mission", "5 toss-ups", "Repeat tomorrow"],
    href: "/today",
  };
}

export function studentReadiness(results: DrillResult[], now = Date.now()): Readiness {
  const subjects = READINESS_SUBJECTS.map((subject) => {
    const rows = subjectRows(results, subject.id);
    const knowledge = weightedAccuracy(knowledgeRows(rows), now);
    const speed = speedScore(speedRows(rows), now);
    return {
      id: subject.id,
      label: subject.label,
      attempts: rows.length,
      knowledge,
      speed,
      readiness: rows.length ? blend(knowledge, speed) : null,
    };
  });

  const scored = subjects.filter((row) => row.readiness != null && row.attempts > 0);
  const totalAttempts = results.length;
  const overall = totalAttempts < 4 || !scored.length
    ? null
    : scored.reduce((sum, row) => sum + (row.readiness ?? 0) * row.attempts, 0)
      / scored.reduce((sum, row) => sum + row.attempts, 0);

  const ranked = [...subjects]
    .filter((row) => row.readiness != null)
    .sort((a, b) => (a.readiness ?? 1) - (b.readiness ?? 1));
  const confident = ranked.filter((row) => row.attempts >= 3);
  const biggest = (confident[0] ?? ranked[0]) ?? null;

  const timed = results.filter((row) => row.timed && row.kind !== "bonus");
  const bands = { early: 0, middle: 0, late: 0, n: 0 };
  for (const row of timed) {
    const band = bandFor(row);
    if (!band) continue;
    bands[band] += 1;
    bands.n += 1;
  }

  const tossups = results.filter((row) => row.kind === "tossup" || (row.kind == null && row.timed !== false));
  const bonuses = results.filter((row) => row.kind === "bonus");

  const draft = {
    overall,
    subjects,
    biggest,
    buzz: bands.n ? { early: bands.early / bands.n, middle: bands.middle / bands.n, late: bands.late / bands.n, n: bands.n } : null,
    tossup: rate(tossups),
    bonus: rate(bonuses),
    timedAttempts: timed.length,
    sentence: "",
  };
  const said = { ...draft, sentence: sentence(draft) };
  return { ...said, prescription: prescribe(said, results) };
}

export function pct(value: number | null) {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}
