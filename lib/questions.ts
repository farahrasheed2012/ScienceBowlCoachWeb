import { doeStarter, encyclopediaQuestions, studyBlocks, topics } from "./catalogs";
import { tossUpBundled, tossUpHewitt, tossUpHewittPairs, parseChoices } from "./tossup";
import type { DoeQuestion, EncyclopediaQuestion, EncyclopediaTopic, PlayQuestion } from "./types";

export function encyclopediaToPlay(q: EncyclopediaQuestion): PlayQuestion {
  const entries = q.answerChoices ? Object.entries(q.answerChoices).sort(([a], [b]) => a.localeCompare(b)) : [];
  const choices = entries.map(([key, text]) => ({ key, text }));
  const answerKey = /^[WXYZ]$/i.test(q.correctAnswer) ? q.correctAnswer.toUpperCase() : undefined;
  const answer = (answerKey && q.answerChoices?.[answerKey]) || q.answerChoices?.[q.correctAnswer] || q.correctAnswer;
  const kind = q.type === "bonus" ? "bonus" : "tossup";
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
    kind,
    answerKey,
  };
}

export function doeToPlay(q: DoeQuestion): PlayQuestion {
  const choices = parseChoices(q.choices);
  const kind = /bonus/i.test(q.questionType) ? "bonus" : "tossup";
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
    kind,
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
        kind: "tossup" as const,
      })),
    );
}

export function allEncyclopediaPlay(): PlayQuestion[] {
  return encyclopediaQuestions.map(encyclopediaToPlay);
}

export function starterDoePlay(): PlayQuestion[] {
  return doeStarter.map(doeToPlay);
}

export function practiceBank(importedDoe: DoeQuestion[] = []): PlayQuestion[] {
  return [
    ...tossUpBundled,
    ...allEncyclopediaPlay(),
    ...curriculumTossups(),
    ...starterDoePlay(),
    ...importedDoe.map(doeToPlay),
  ];
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[j], copy[i]] = [copy[i], copy[j]];
  }
  return copy;
}

export function answersMatch(expected: string, given: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const a = norm(expected);
  const b = norm(given);
  if (!b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return a.split(" ").some((word) => word.length > 3 && b.includes(word));
}

export function isChoiceCorrect(question: PlayQuestion, key: string) {
  if (question.answerKey && key.toUpperCase() === question.answerKey) return true;
  const choice = question.choices.find((c) => c.key === key);
  return Boolean(choice && answersMatch(question.answer, choice.text));
}

export function subjectTone(category: string) {
  const value = category.toLowerCase();
  if (value.includes("bio") || value.includes("life")) return "bio";
  if (value.includes("chem")) return "chem";
  if (value.includes("phys") || value.includes("energy")) return "phys";
  if (value.includes("earth") || value.includes("space")) return "earth";
  if (value.includes("math")) return "math";
  return "bio";
}

export function officialSeconds(question: PlayQuestion) {
  return question.format === "multipleChoice" ? 5 : 20;
}

export function findTopicArticle(question: PlayQuestion): EncyclopediaTopic | undefined {
  if (question.topicId) {
    const exact = topics.find((t) => t.id === question.topicId);
    if (exact) return exact;
  }
  const needle = (question.topic || question.category).toLowerCase().trim();
  const exactTitle = topics.find((t) => t.title.toLowerCase() === needle);
  if (exactTitle) return exactTitle;
  const first = needle.split(" ")[0] || "";
  if (first.length < 5 || ["chemistry", "biology", "physics", "math", "science", "earth"].includes(first)) {
    return undefined;
  }
  return topics.find((t) => t.title.toLowerCase().includes(first));
}

export function bonusPool(importedDoe: DoeQuestion[] = []): PlayQuestion[] {
  return [...tossUpHewitt, ...importedDoe.map(doeToPlay), ...starterDoePlay()].filter((q) => q.kind === "bonus");
}

export function pairConsecutive(questions: PlayQuestion[]) {
  const pairs: { tossup: PlayQuestion; bonus?: PlayQuestion }[] = [];
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    if (question.kind === "bonus") continue;
    const next = questions[i + 1];
    const bonus = next?.kind === "bonus" ? next : undefined;
    pairs.push({ tossup: question, bonus });
    if (bonus) i += 1;
  }
  return pairs;
}

export function buildMockMatch(importedDoe: DoeQuestion[] = []): PlayQuestion[] {
  const doePairs = pairConsecutive([...starterDoePlay(), ...importedDoe.map(doeToPlay)]).filter((pair) => pair.bonus);
  const pairs = shuffle([...tossUpHewittPairs.filter((pair) => pair.bonus), ...doePairs]);
  const chain = pairs.slice(0, 8).flatMap((pair) => [pair.tossup, ...(pair.bonus ? [pair.bonus] : [])]);
  const used = new Set(chain.map((question) => question.id));
  const fill = shuffle(
    practiceBank(importedDoe).filter((question) => question.kind !== "bonus" && !used.has(question.id)),
  ).slice(0, Math.max(0, 25 - chain.length));
  return [...chain, ...fill];
}

export { tossUpHewitt };
