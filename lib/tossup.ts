import bioJson from "@/data/tossup-bio.json";
import bioCellsJson from "@/data/tossup-bio-cells.json";
import chemJson from "@/data/tossup-chem.json";
import mathJson from "@/data/tossup-math.json";
import hewittJson from "@/data/tossup-hewitt.json";
import topicsJson from "@/data/tossup-topics.json";
import type { PlayQuestion, TossUpTopic } from "./types";

export type TossUpRaw = {
  id: string;
  subject: string;
  topicId?: string;
  round: string;
  type: string;
  questionText: string;
  choices: string[] | null;
  correctAnswer: string;
  sourcePDF: string;
};

export const tossUpTopics = topicsJson as TossUpTopic[];

const topicName = new Map(tossUpTopics.map((t) => [t.id, t.name]));

export function parseChoices(lines: string[] | null | undefined) {
  return (lines ?? [])
    .map((line) => {
      const match = line.match(/^([WXYZ])\)\s*(.*)$/i);
      return match ? { key: match[1].toUpperCase(), text: match[2] } : { key: "", text: line };
    })
    .filter((choice) => choice.text);
}

export function tossupToPlay(raw: TossUpRaw): PlayQuestion {
  const choices = parseChoices(raw.choices);
  const kind = /bonus/i.test(raw.round) ? "bonus" : "tossup";
  const key = raw.correctAnswer.trim().toUpperCase();
  const answerKey = /^[WXYZ]$/.test(key) ? key : undefined;
  const answer = (answerKey && choices.find((c) => c.key === answerKey)?.text) || raw.correctAnswer;
  return {
    id: raw.id,
    source: raw.sourcePDF || "TossUp",
    category: raw.subject,
    type: kind === "bonus" ? "BONUS" : "TOSS-UP",
    format: raw.type === "multipleChoice" || choices.length ? "multipleChoice" : "shortAnswer",
    topic: (raw.topicId && topicName.get(raw.topicId)) || raw.subject,
    questionText: raw.questionText,
    choices,
    answer,
    topicId: raw.topicId,
    kind,
    answerKey,
  };
}

export const tossUpBundled = [
  ...(bioJson as TossUpRaw[]),
  ...(bioCellsJson as TossUpRaw[]),
  ...(chemJson as TossUpRaw[]),
  ...(mathJson as TossUpRaw[]),
].map(tossupToPlay);

export const tossUpHewitt = (hewittJson as TossUpRaw[]).map(tossupToPlay);

export const tossUpHewittPairs = tossUpHewitt.reduce<{ tossup: PlayQuestion; bonus?: PlayQuestion }[]>((pairs, question, index, list) => {
  if (question.kind === "bonus") return pairs;
  const next = list[index + 1];
  pairs.push({ tossup: question, bonus: next?.kind === "bonus" ? next : undefined });
  return pairs;
}, []);
