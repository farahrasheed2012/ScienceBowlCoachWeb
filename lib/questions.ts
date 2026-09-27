import doeCacheJson from "@/data/doe_questions_cache.json";
import { encyclopediaQuestions, studyBlocks, topics } from "./catalogs";
import { packetInfo, practiceSubject } from "./subject-tag";
import { articleForLabel } from "./topic-map";
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

export function parseQuestionCache(data: unknown): { questions: DoeQuestion[]; error?: string } {
  if (!data || typeof data !== "object") return { questions: [], error: "That file is not JSON we can read." };
  const obj = data as Record<string, unknown>;
  if ("flashCards" in obj || "drillResults" in obj || "practiceRounds" in obj) {
    return { questions: [], error: "That file is a progress backup. Use Backup import above." };
  }
  const raw = Array.isArray(data) ? data : Array.isArray(obj.questions) ? obj.questions : [];
  const questions = raw.map(normalizeImportedQuestion).filter((row): row is DoeQuestion => Boolean(row));
  if (!questions.length) return { questions: [], error: "No DOE or TossUp questions in that file." };
  return { questions };
}

export const doeBundled = parseQuestionCache(doeCacheJson).questions;

function normalizeImportedQuestion(row: unknown): DoeQuestion | null {
  if (!row || typeof row !== "object") return null;
  const q = row as Record<string, unknown>;
  const questionText = String(q.questionText ?? "").trim();
  const answer = String(q.answer ?? q.correctAnswer ?? "").trim();
  if (!questionText || !answer) return null;
  const choices = Array.isArray(q.choices) ? q.choices.map(String) : undefined;
  return {
    id: String(q.id || `${questionText.slice(0, 24)}-${answer.slice(0, 12)}`),
    category: String(q.category ?? q.subject ?? "General"),
    questionType: String(q.questionType ?? q.round ?? "TOSS-UP"),
    format: String(q.format ?? q.type ?? (choices?.length ? "Multiple Choice" : "Short Answer")),
    questionText,
    choices,
    answer,
    sourceFile: String(q.sourceFile ?? q.sourcePDF ?? "import"),
    sourceYear: typeof q.sourceYear === "number" ? q.sourceYear : undefined,
    setNumber: typeof q.setNumber === "number" ? q.setNumber : undefined,
    roundNumber: typeof q.roundNumber === "number" ? q.roundNumber : undefined,
    questionNumber: typeof q.questionNumber === "number" ? q.questionNumber : undefined,
    doeCategory: q.doeCategory ? String(q.doeCategory) : undefined,
    packet: q.packet ? String(q.packet) : undefined,
    packetLabel: q.packetLabel ? String(q.packetLabel) : undefined,
  };
}

export function mergeDoeQuestions(current: DoeQuestion[], incoming: DoeQuestion[]) {
  const seen = new Set(current.map((row) => row.id));
  const next = [...current];
  for (const row of incoming) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    next.push(row);
  }
  return next;
}

export function doeToPlay(q: DoeQuestion): PlayQuestion {
  const choices = parseChoices(q.choices);
  const kind = /bonus/i.test(q.questionType) ? "bonus" : "tossup";
  const subject = practiceSubject(q.doeCategory || q.category, q.questionText, q.answer);
  const packet = packetInfo(q.sourceFile, q.setNumber, q.roundNumber);
  return {
    id: q.id,
    source: q.sourceFile ?? "DOE",
    category: subject,
    type: q.questionType || "TOSS-UP",
    format: choices.length ? "multipleChoice" : "shortAnswer",
    topic: subject,
    questionText: q.questionText,
    choices,
    answer: q.answer,
    kind,
    setNumber: packet.setNumber,
    roundNumber: packet.roundNumber,
    questionNumber: q.questionNumber,
    packetLabel: q.packetLabel || packet.label,
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

export function matchesSubject(question: { category: string; questionText?: string; answer?: string }, subject: string) {
  const tagged = practiceSubject(question.category, question.questionText, question.answer).toLowerCase();
  const name = subject.toLowerCase();
  if (name === "biology") return tagged.includes("bio") || tagged.includes("life");
  if (name === "chemistry") return tagged === "chemistry";
  if (name === "physics") return tagged === "physics";
  if (name === "earth") return tagged.includes("earth") || tagged.includes("space") || tagged.includes("astro");
  if (name === "energy") return tagged.includes("energy") || tagged.includes("power") || tagged.includes("fuel");
  if (name === "math") return tagged.includes("math");
  return tagged.includes(name);
}

export function starterDoePlay(): PlayQuestion[] {
  return doeBundled.map(doeToPlay);
}

export function officialPacketGroups(importedDoe: DoeQuestion[] = []) {
  const groups = new Map<string, { label: string; kind: string; setNumber: number; rounds: { round: number; count: number }[] }>();
  for (const row of mergeDoeQuestions(doeBundled, importedDoe).map(doeToPlay)) {
    const label = row.packetLabel || "Official packet";
    const info = packetInfo(row.source, row.setNumber, row.roundNumber);
    const current = groups.get(label) ?? { label, kind: info.kind, setNumber: info.setNumber, rounds: [] };
    const round = row.roundNumber ?? 1;
    const found = current.rounds.find((item) => item.round === round);
    if (found) found.count += 1;
    else current.rounds.push({ round, count: 1 });
    groups.set(label, current);
  }
  return [...groups.values()]
    .map((group) => ({ ...group, rounds: group.rounds.sort((a, b) => a.round - b.round) }))
    .sort((a, b) => {
      const order = { set: 0, "round-robin": 1, "double-elim": 2 };
      const left = order[a.kind as keyof typeof order] ?? 3;
      const right = order[b.kind as keyof typeof order] ?? 3;
      if (left !== right) return left - right;
      return a.setNumber - b.setNumber || a.label.localeCompare(b.label, undefined, { numeric: true });
    });
}

export function officialPacketPlay(importedDoe: DoeQuestion[] = [], packetLabel: string, round?: number) {
  return mergeDoeQuestions(doeBundled, importedDoe)
    .map(doeToPlay)
    .filter((row) => row.packetLabel === packetLabel && (round == null || row.roundNumber === round))
    .sort((a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0) || (a.kind === "bonus" ? 1 : 0) - (b.kind === "bonus" ? 1 : 0));
}

export function practiceBank(importedDoe: DoeQuestion[] = []): PlayQuestion[] {
  return [
    ...tossUpBundled,
    ...allEncyclopediaPlay(),
    ...curriculumTossups(),
    ...mergeDoeQuestions(doeBundled, importedDoe).map(doeToPlay),
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

export function findTopicArticle(question: PlayQuestion, loose = true): EncyclopediaTopic | undefined {
  if (question.topicId) {
    const exact = topics.find((t) => t.id === question.topicId);
    if (exact) return exact;
  }
  const byTopic = articleForLabel(question.topic, loose);
  if (byTopic) return byTopic;
  if (!loose) return undefined;
  return articleForLabel(question.category);
}

export function bonusPool(importedDoe: DoeQuestion[] = []): PlayQuestion[] {
  return [...tossUpHewitt, ...mergeDoeQuestions(doeBundled, importedDoe).map(doeToPlay)].filter((q) => q.kind === "bonus");
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

export function buildCompetitionPairs(importedDoe: DoeQuestion[] = []) {
  const doePairs = pairConsecutive(mergeDoeQuestions(doeBundled, importedDoe).map(doeToPlay)).filter((pair) => pair.bonus);
  const withBonus = shuffle([...tossUpHewittPairs.filter((pair) => pair.bonus), ...doePairs]);
  const used = new Set(withBonus.flatMap((pair) => [pair.tossup.id, pair.bonus?.id ?? ""]));
  const fill = shuffle(
    practiceBank(importedDoe).filter((question) => question.kind !== "bonus" && !used.has(question.id)),
  );
  const pairs = [...withBonus];
  for (const tossup of fill) {
    if (pairs.length >= 16) break;
    pairs.push({ tossup });
  }
  return pairs.slice(0, 16);
}

export function buildMockMatch(importedDoe: DoeQuestion[] = []): PlayQuestion[] {
  const doePairs = pairConsecutive(mergeDoeQuestions(doeBundled, importedDoe).map(doeToPlay)).filter((pair) => pair.bonus);
  const pairs = shuffle([...tossUpHewittPairs.filter((pair) => pair.bonus), ...doePairs]);
  const chain = pairs.slice(0, 8).flatMap((pair) => [pair.tossup, ...(pair.bonus ? [pair.bonus] : [])]);
  const used = new Set(chain.map((question) => question.id));
  const fill = shuffle(
    practiceBank(importedDoe).filter((question) => question.kind !== "bonus" && !used.has(question.id)),
  ).slice(0, Math.max(0, 25 - chain.length));
  return [...chain, ...fill];
}

export { tossUpHewitt };
