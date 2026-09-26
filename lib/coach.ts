import { findTopicArticle } from "./questions";
import type { EncyclopediaTopic, PlayQuestion } from "./types";

export type CoachAction = "explain" | "why-wrong" | "hint" | "eighth-grade" | "teach";

export function localCoach(input: {
  action: CoachAction;
  question: PlayQuestion;
  userAnswer?: string;
  correct?: boolean | null;
}) {
  const article = findTopicArticle(input.question);
  switch (input.action) {
    case "hint":
      return hint(input.question, article);
    case "why-wrong":
      return whyWrong(input.question, input.userAnswer, article);
    case "teach":
      return teach(input.question, article);
    case "eighth-grade":
      return eighthGrade(input.question, article);
    default:
      return explain(input.question, input.userAnswer, input.correct ?? null, article);
  }
}

function explain(question: PlayQuestion, userAnswer: string | undefined, correct: boolean | null, article?: EncyclopediaTopic) {
  const parts = [
    `The answer is ${question.answer}.`,
    article?.whatIsIt ?? `This is a ${question.kind === "bonus" ? "bonus" : "toss-up"} on ${question.topic}.`,
  ];
  if (question.format === "multipleChoice") {
    parts.push(choiceReview(question, userAnswer));
  }
  if (article?.nsbTraps[0]) {
    parts.push(`NSB trap: ${article.nsbTraps[0]}`);
  }
  if (correct === false && userAnswer) {
    parts.push(`Your answer (${userAnswer}) is close to a related idea, but it does not match what the stem asked.`);
  }
  return parts.filter(Boolean).join(" ");
}

function whyWrong(question: PlayQuestion, userAnswer: string | undefined, article?: EncyclopediaTopic) {
  if (!userAnswer) {
    return `No answer was locked in. The stem wanted ${question.answer}. Read the last clause of the question again before you buzz.`;
  }
  const picked = question.choices.find((c) => c.key === userAnswer || c.text === userAnswer);
  const label = picked ? `${picked.key}) ${picked.text}` : userAnswer;
  return [
    `You chose ${label}. The correct answer is ${question.answer}.`,
    picked ? `That choice is a common mix-up for ${question.topic}.` : `Check the exact wording of the stem.`,
    article?.nsbTraps[0] ?? article?.whatIsIt ?? `Review ${question.topic} and try a similar toss-up.`,
  ].join(" ");
}

function hint(question: PlayQuestion, article?: EncyclopediaTopic) {
  if (article?.nsbTraps[0]) return `Hint: ${article.nsbTraps[0]}`;
  if (article?.keyTerms[0]) return `Hint: think about ${article.keyTerms[0].term} — ${article.keyTerms[0].definition}`;
  if (question.format === "multipleChoice") return "Hint: eliminate any choice that answers a nearby fact instead of the exact stem.";
  return `Hint: this toss-up is about ${question.topic}. Name the precise term, not a related process.`;
}

function eighthGrade(question: PlayQuestion, article?: EncyclopediaTopic) {
  const simple = article?.whatIsIt ?? `This question is about ${question.topic}.`;
  return `In 8th-grade words: ${simple} So the answer they want is ${question.answer}.`;
}

function teach(question: PlayQuestion, article?: EncyclopediaTopic) {
  if (!article) return `${question.topic}: the official answer here is ${question.answer}. Open Learn for a full article on this idea.`;
  return [
    article.whatIsIt,
    article.howItWorks,
    article.realWorldExample,
    article.nsbTraps[0] ? `Watch out: ${article.nsbTraps[0]}` : "",
  ].filter(Boolean).join(" ");
}

function choiceReview(question: PlayQuestion, userAnswer?: string) {
  if (!question.choices.length) return "";
  return question.choices
    .map((choice) => {
      const right = question.answerKey === choice.key || choice.text === question.answer;
      const yours = userAnswer === choice.key || userAnswer === choice.text;
      if (right) return `${choice.key}) ${choice.text} is correct.`;
      if (yours) return `${choice.key}) ${choice.text} is the tempting wrong choice.`;
      return "";
    })
    .filter(Boolean)
    .join(" ");
}
