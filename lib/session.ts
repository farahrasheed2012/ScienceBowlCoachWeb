import { encyclopediaQuestions } from "./catalogs";
import { encyclopediaToPlay, practiceBank, shuffle } from "./questions";
import { lookupLine } from "./readings";
import { sameTopicLabel } from "./topic-map";
import type { DoeQuestion, EncyclopediaTopic, PlayQuestion, StudyBlock } from "./types";

export type PlaySession = {
  id: string;
  title: string;
  subject: string;
  topic: string;
  kind: "summer" | "keep-sharp";
  recall: PlayQuestion[];
  read: { primary?: string; book?: string; body: string; extra?: string };
  knowCold: string[];
  tossups: PlayQuestion[];
};

function blockQuestions(block: StudyBlock, suffix: string): PlayQuestion[] {
  return block.sampleTossups.map((row, i) => ({
    id: `${block.id}-${suffix}-${i}`,
    source: "curriculum",
    category: block.subject,
    type: "TOSS-UP",
    format: "shortAnswer" as const,
    topic: block.topic,
    questionText: row.question,
    choices: [],
    answer: row.answer,
  }));
}

export function sessionFromBlock(block: StudyBlock): PlaySession {
  return {
    id: block.id,
    title: block.chapterTitle,
    subject: block.subject,
    topic: block.topic,
    kind: "summer",
    recall: blockQuestions(block, "recall").slice(0, 5),
    read: {
      primary: `${block.bookCode} ${block.chapter} — ${block.chapterTitle}`,
      book: block.backupBookLine ?? undefined,
      body: block.focus,
      extra: block.formulasAndTerms,
    },
    knowCold: block.knowCold,
    tossups: blockQuestions(block, "toss"),
  };
}

export function keepSharpSession(input: {
  label: string;
  article?: EncyclopediaTopic;
  importedDoe?: DoeQuestion[];
}): PlaySession {
  const article = input.article;
  const label = input.label || article?.title || "Mixed";
  const bank = practiceBank(input.importedDoe);
  const matched = shuffle(bank.filter((question) => (
    question.kind !== "bonus"
    && (
      sameTopicLabel(question.topic, label)
      || Boolean(article && (question.topicId === article.id || sameTopicLabel(question.topic, article.title)))
    )
  )));
  const encycl = article
    ? encyclopediaQuestions.filter((question) => question.topicId === article.id).map(encyclopediaToPlay)
    : [];
  const fallback = shuffle(bank.filter((question) => question.kind !== "bonus"));
  const recallPool = encycl.length ? encycl : matched.length ? matched : fallback;
  const tossPool = matched.length ? matched : encycl.length ? encycl : fallback;
  const recall = recallPool.slice(0, 5);
  const tossups = shuffle(tossPool).slice(0, 12);
  const books = article ? lookupLine(article.id) : {};
  const knowCold = article
    ? [
        ...article.keyTerms.map((term) => `${term.term}: ${term.definition}`),
        ...article.nsbTraps,
      ].slice(0, 8)
    : [
        "Read the last clause of the stem before you buzz.",
        "Name the precise term, not a nearby process.",
        "If two answers feel close, the trap is usually the related fact.",
      ];

  return {
    id: `keep-${article?.id ?? "mixed"}`,
    title: article?.title ?? label,
    subject: article?.subject ?? "Mixed",
    topic: label,
    kind: "keep-sharp",
    recall: recall.length ? recall : tossups.slice(0, 5),
    read: {
      primary: books.primary,
      book: books.book,
      body: article?.whatIsIt ?? `Keep ${label} cold. Open the assigned section if you have the book, then drill.`,
      extra: article?.howItWorks,
    },
    knowCold,
    tossups: tossups.length ? tossups : recall,
  };
}
