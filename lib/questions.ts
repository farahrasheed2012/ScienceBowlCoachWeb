import { doeStarter, encyclopediaQuestions, studyBlocks } from "./catalogs";
import type { DoeQuestion, EncyclopediaQuestion, PlayQuestion } from "./types";

export function encyclopediaToPlay(q: EncyclopediaQuestion): PlayQuestion {
  const entries = q.answerChoices ? Object.entries(q.answerChoices).sort(([a], [b]) => a.localeCompare(b)) : [];
  const choices = entries.map(([key, text]) => ({ key, text }));
  const answer = q.answerChoices?.[q.correctAnswer] ?? q.correctAnswer;
  return {
    id: q.id,
    source: "encyclopedia",
    category: q.subject,
    type: q.type === "bonus" ? "BONUS" : q.type === "freeResponse" ? "FREE-RESPONSE" : "TOSS-UP",
    format: choices.length ? "multipleChoice" : "shortAnswer",
    topic: q.subtopic,
    questionText: q.questionText,
    choices,
    answer,
    topicId: q.topicId,
  };
}

export function doeToPlay(q: DoeQuestion): PlayQuestion {
  const choices = (q.choices ?? []).map((line) => {
    const match = line.match(/^([WXYZ])\)\s*(.*)$/i);
    return match ? { key: match[1].toUpperCase(), text: match[2] } : { key: "", text: line };
  }).filter((c) => c.text);
  return {
    id: q.id,
    source: q.sourceFile ?? "DOE",
    category: q.category,
    type: q.questionType || "TOSS-UP",
    format: choices.length ? "multipleChoice" : "shortAnswer",
    topic: q.category,
    questionText: q.questionText,
    choices,
    answer: q.answer,
  };
}

export function curriculumTossups(filter?: { subject?: string; week?: number }): PlayQuestion[] {
  return studyBlocks
    .filter((b) => (!filter?.subject || b.subject === filter.subject) && (!filter?.week || b.week === filter.week))
    .flatMap((b) =>
      b.sampleTossups.map((t, i) => ({
        id: `${b.id}-${i}`,
        source: "Soha Curriculum",
        category: b.subject,
        type: "TOSS-UP",
        format: "shortAnswer" as const,
        topic: b.topic,
        questionText: t.question,
        choices: [],
        answer: t.answer,
      })),
    );
}

export function allEncyclopediaPlay(): PlayQuestion[] {
  return encyclopediaQuestions.map(encyclopediaToPlay);
}

export function starterDoePlay(): PlayQuestion[] {
  return doeStarter.map(doeToPlay);
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function answersMatch(expected: string, given: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const a = norm(expected);
  const b = norm(given);
  if (!b) return false;
  return a === b || a.includes(b) || b.includes(a);
}
