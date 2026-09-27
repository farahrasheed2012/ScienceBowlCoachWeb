import { findTopicArticle } from "./questions";
import { accuracyWindow, improvedTopics, paceSeconds, performanceFor, subjectAccuracy } from "./stats";
import type { DrillResult, EncyclopediaTopic, PlayQuestion, PracticeRound } from "./types";

export type CoachAction = "explain" | "why-wrong" | "hint" | "eighth-grade" | "teach";

export type CoachHistory = {
  recentMisses?: number;
  missesWeek?: number;
  lastAt?: string;
  acc?: number | null;
};

function recentMissLine(history?: CoachHistory) {
  const n = history?.recentMisses ?? 0;
  if (n < 2) return "";
  return n === 2
    ? "You missed this twice recently."
    : `You missed this ${n} times recently.`;
}

export function coachBrief(question: PlayQuestion, userAnswer?: string, correct?: boolean | null, history?: CoachHistory) {
  const article = findTopicArticle(question);
  const picked = question.choices.find((choice) => choice.key === userAnswer || choice.text === userAnswer);
  const trap = article?.nsbTraps[0] ?? "Read the last clause of the stem before you buzz. Nearby facts are the usual trap.";
  const missLine = recentMissLine(history);
  const clue = article?.keyTerms[0]?.term ?? question.topic;
  const remember = article?.keyTerms[0]
    ? `${article.keyTerms[0].term}: ${article.keyTerms[0].definition}`
    : `${question.answer} — ${question.topic}.`;
  const whyMissed = userAnswer
    ? `You answered ${picked ? `${picked.key}) ${picked.text}` : userAnswer}, which is a nearby fact instead of ${question.answer}.`
    : `The stem wanted ${question.answer}. Read the last clause before you buzz.`;
  const why = [
    `The correct answer is ${question.answer}.`,
    article?.whatIsIt,
    correct === false ? whyMissed : "",
    correct === true && missLine ? "Lock this one in." : "",
  ].filter(Boolean).join(" ");
  return {
    why,
    whyMissed,
    remember,
    trap,
    missLine,
    clue,
    nextStep: correct ? "Go to the next question." : "Try one similar question.",
  };
}

export function coachRead(input: {
  results: DrillResult[];
  rounds?: PracticeRound[];
  missionTopic?: string;
  sessionMissed?: string[];
  sessionHits?: number;
  sessionAsked?: number;
}): { kicker: string; body: string } {
  const { results, rounds = [], missionTopic, sessionMissed = [], sessionHits, sessionAsked } = input;
  if (sessionAsked != null && sessionHits != null) {
    const topic = sessionMissed[0] || missionTopic;
    if (sessionAsked === 0) {
      return { kicker: "Coach's read", body: "No answers logged this session. Start the toss-ups so I can see the gap." };
    }
    if (sessionHits / sessionAsked >= 0.8) {
      return { kicker: "Coach's read", body: topic ? `You know the basics on ${topic}. Keep it cold with a short timed toss-up next.` : "Clean session. Keep this topic cold tomorrow." };
    }
    if (topic) {
      return { kicker: "Coach's read", body: `You know the basic concepts, but you're still missing questions about ${topic}.` };
    }
    return { kicker: "Coach's read", body: "The misses are the lesson. Review those topics, then try two similar questions." };
  }

  if (missionTopic) {
    const row = performanceFor(results, missionTopic);
    if (row.last5 >= 5 && row.last5Correct <= 2) {
      return { kicker: "Don't move on yet", body: `You know the vocabulary, but you're only ${row.last5Correct}/5 on recent ${row.topic} questions. Today's mission targets that gap.` };
    }
    if (row.missedLast3 >= 2) {
      return { kicker: "Coach's read", body: `You missed ${row.missedLast3} of your last 3 on ${row.topic}. Today's mission is built around that gap.` };
    }
  }

  const subjects = ["chemistry", "biology", "physics", "earth", "energy"];
  for (const subject of subjects) {
    const last7 = subjectAccuracy(results, subject, 7);
    const prior = accuracyWindow(
      results.filter((row) => String(row.subject).toLowerCase().includes(subject)),
      14,
      7,
    );
    if (last7 != null && prior != null && last7 - prior > 0.08) {
      const gap = missionTopic ?? "today's topic";
      return { kicker: "Coach's read", body: `You've improved in ${subject[0].toUpperCase()}${subject.slice(1)} this week, but you're still missing questions involving ${gap}. Today's mission targets that gap.` };
    }
  }

  const lifted = improvedTopics(results)[0];
  if (lifted && missionTopic && lifted.topic !== missionTopic) {
    return { kicker: "Coach's read", body: `You've improved in ${lifted.topic}, but ${missionTopic} is still the gap. Today's mission targets that.` };
  }

  const recent = rounds.slice(0, 3);
  const older = rounds.slice(3, 6);
  const nowPace = paceSeconds(recent);
  const oldPace = paceSeconds(older);
  if (nowPace != null && oldPace != null && oldPace - nowPace >= 1.5) {
    return { kicker: "You're getting faster", body: `Your average toss-up response time dropped from ${oldPace.toFixed(1)}s to ${nowPace.toFixed(1)}s this week.` };
  }

  if (missionTopic) {
    return { kicker: "Coach's read", body: `Today's mission targets ${missionTopic} because that's the highest-priority gap right now.` };
  }
  return { kicker: "Coach's read", body: "Answer a few questions and I'll name the next gap." };
}

export function localCoach(input: {
  action: CoachAction;
  question: PlayQuestion;
  userAnswer?: string;
  correct?: boolean | null;
  history?: CoachHistory;
}) {
  const article = findTopicArticle(input.question);
  switch (input.action) {
    case "hint":
      return hint(input.question, article);
    case "why-wrong":
      return whyWrong(input.question, input.userAnswer, article, input.history);
    case "teach":
      return teach(input.question, article);
    case "eighth-grade":
      return eighthGrade(input.question, article);
    default:
      return explain(input.question, input.userAnswer, input.correct ?? null, article, input.history);
  }
}

function explain(question: PlayQuestion, userAnswer: string | undefined, correct: boolean | null, article?: EncyclopediaTopic, history?: CoachHistory) {
  const trap = article?.nsbTraps[0];
  const missLine = recentMissLine(history);
  const parts = [
    correct === false && missLine ? `${missLine} The trap you're falling into is ${trap ?? "confusing a nearby fact with what the stem asked."}` : "",
    `The answer is ${question.answer}.`,
    article?.whatIsIt ?? `This is a ${question.kind === "bonus" ? "bonus" : "toss-up"} on ${question.topic}.`,
  ];
  if (question.format === "multipleChoice") {
    parts.push(choiceReview(question, userAnswer));
  }
  if (trap && !(correct === false && missLine)) {
    parts.push(`NSB trap: ${trap}`);
  }
  if (correct === false && userAnswer) {
    parts.push(`Your answer (${userAnswer}) is close to a related idea, but it does not match what the stem asked.`);
  }
  return parts.filter(Boolean).join(" ");
}

function whyWrong(question: PlayQuestion, userAnswer: string | undefined, article?: EncyclopediaTopic, history?: CoachHistory) {
  const trap = article?.nsbTraps[0] ?? article?.whatIsIt ?? `Review ${question.topic} and try a similar toss-up.`;
  const missLine = recentMissLine(history);
  if (!userAnswer) {
    return [
      missLine,
      `No answer was locked in. The stem wanted ${question.answer}.`,
      missLine ? `The trap you're falling into is ${trap}` : "Read the last clause of the question again before you buzz.",
    ].filter(Boolean).join(" ");
  }
  const picked = question.choices.find((c) => c.key === userAnswer || c.text === userAnswer);
  const label = picked ? `${picked.key}) ${picked.text}` : userAnswer;
  return [
    missLine,
    `You chose ${label}. The correct answer is ${question.answer}.`,
    missLine
      ? `The trap you're falling into is ${trap}`
      : picked
        ? `That choice is a common mix-up for ${question.topic}. ${trap}`
        : `Check the exact wording of the stem. ${trap}`,
  ].filter(Boolean).join(" ");
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
