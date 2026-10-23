import { findTopicArticle, isChoiceCorrect, primaryAnswer } from "./questions";
import { accuracyWindow, improvedTopics, paceSeconds, performanceFor, subjectAccuracy } from "./stats";
import type { DrillResult, EncyclopediaTopic, PlayQuestion, PracticeRound } from "./types";

export type CoachAction = "explain" | "why-wrong" | "hint" | "eighth-grade" | "teach";

export type CoachHistory = {
  /** Misses of this exact question id (not the whole topic). */
  questionMisses?: number;
  recentMisses?: number;
  missesWeek?: number;
  lastAt?: string;
  acc?: number | null;
};

function recentMissLine(history?: CoachHistory) {
  const n = history?.questionMisses ?? 0;
  if (n < 2) return "";
  return n === 2
    ? "You missed this same question twice before."
    : `You missed this same question ${n} times before.`;
}

function keyClue(question: PlayQuestion, article?: EncyclopediaTopic) {
  const stem = question.questionText.toLowerCase();
  const answer = primaryAnswer(question.answer);
  const answerNorm = answer.toLowerCase();
  if (article?.keyTerms?.length) {
    const hit = article.keyTerms.find((term) => {
      const t = term.term.toLowerCase();
      if (t.length < 3) return false;
      return stem.includes(t) || answerNorm.includes(t) || t.includes(answerNorm);
    });
    if (hit) return hit.term;
  }
  return answer || question.answer;
}

function displayAnswer(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function coachBrief(question: PlayQuestion, userAnswer?: string, correct?: boolean | null, history?: CoachHistory) {
  const article = findTopicArticle(question);
  const picked = question.choices.find((choice) => choice.key === userAnswer || choice.text === userAnswer);
  const trap = article?.nsbTraps[0] ?? "Read the last clause of the stem before you buzz. Nearby facts are the usual trap.";
  const missLine = recentMissLine(history);
  const clue = keyClue(question, article);
  const rememberTerm = article?.keyTerms.find((term) => {
    const t = term.term.toLowerCase();
    const answer = primaryAnswer(question.answer).toLowerCase();
    return t && (answer.includes(t) || t.includes(answer) || question.questionText.toLowerCase().includes(t));
  }) ?? article?.keyTerms.find((term) => primaryAnswer(question.answer).toLowerCase().includes(term.term.toLowerCase()));
  const remember = rememberTerm
    ? `${rememberTerm.term}: ${rememberTerm.definition}`
    : `${primaryAnswer(question.answer) || question.answer} — ${question.topic}.`;
  const shown = userAnswer ? displayAnswer(userAnswer) : "";
  const whyMissed = shown
    ? `You answered ${picked ? `${picked.key}) ${picked.text}` : shown}, which is a nearby fact instead of ${question.answer}.`
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

function cleanTopicLabel(label?: string) {
  if (!label) return "";
  return label
    .replace(/^Weak\s*·\s*/i, "")
    .replace(/^Practice this topic$/i, "")
    .replace(/^Toss-ups$/i, "")
    .replace(/^Recall from this topic$/i, "")
    .trim();
}

export function coachRead(input: {
  results: DrillResult[];
  rounds?: PracticeRound[];
  missionTopic?: string;
  missionPlanId?: string;
  flashDue?: number;
  biggestGapLabel?: string;
  sessionMissed?: string[];
  sessionHits?: number;
  sessionAsked?: number;
}): { kicker: string; body: string } {
  const {
    results,
    rounds = [],
    missionTopic,
    missionPlanId,
    flashDue = 0,
    biggestGapLabel,
    sessionMissed = [],
    sessionHits,
    sessionAsked,
  } = input;

  const gapName = cleanTopicLabel(biggestGapLabel) || cleanTopicLabel(missionTopic);

  if (missionPlanId === "flash" && flashDue > 0) {
    return {
      kicker: "Coach's read",
      body: gapName
        ? `${flashDue} flashcards are due. Clear those first — then drill ${gapName}.`
        : `${flashDue} flashcards are due. Clear the pile, then a short toss-up.`,
    };
  }

  if (sessionAsked != null && sessionHits != null) {
    const topic = cleanTopicLabel(sessionMissed[0]) || cleanTopicLabel(missionTopic);
    if (sessionAsked === 0) {
      return { kicker: "Coach's read", body: "No answers logged this session. Start the toss-ups so I can see the gap." };
    }
    if (sessionHits / sessionAsked >= 0.8) {
      return {
        kicker: "Coach's read",
        body: topic
          ? `Solid round on ${topic}. Keep it cold with a short timed toss-up next.`
          : "Clean session. Keep this cold tomorrow.",
      };
    }
    if (topic) {
      return { kicker: "Coach's read", body: `You're still missing questions about ${topic}. Review that, then try two similar ones.` };
    }
    return { kicker: "Coach's read", body: "The misses are the lesson. Review those topics, then try two similar questions." };
  }

  if (missionTopic) {
    const row = performanceFor(results, missionTopic);
    if (row.last5 >= 3 && row.last5Correct / row.last5 <= 0.4) {
      return {
        kicker: "Don't move on yet",
        body: `You're ${row.last5Correct}/${row.last5} on recent ${row.topic} questions. Today's mission targets that gap.`,
      };
    }
    if (row.missedLast3 >= 2 && row.last5 >= 3) {
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
      const gap = gapName || "today's topic";
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

export function answerLeaked(text: string, answer: string) {
  const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const hay = norm(text);
  const main = norm(primaryAnswer(answer) || answer);
  if (!hay || !main) return false;
  if (main.length >= 3 && hay.includes(main)) return true;
  const words = main.split(" ").filter((word) => word.length > 3);
  return words.length > 0 && words.every((word) => hay.includes(word));
}

export function localCoach(input: {
  action: CoachAction;
  question: PlayQuestion;
  userAnswer?: string;
  correct?: boolean | null;
  history?: CoachHistory;
}) {
  const article = findTopicArticle(input.question, input.action !== "hint");
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
    parts.push(`Your answer (${displayAnswer(userAnswer)}) is close to a related idea, but it does not match what the stem asked.`);
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
  const label = picked ? `${picked.key}) ${picked.text}` : displayAnswer(userAnswer);
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

function hintAnswerShape(answer: string) {
  const main = primaryAnswer(answer);
  const words = main.split(/\s+/).filter(Boolean);
  return { words: words.length, letter: words[0]?.[0]?.toUpperCase() ?? "" };
}

function hint(question: PlayQuestion, article?: EncyclopediaTopic) {
  const trap = article?.nsbTraps[0];
  if (trap && !answerLeaked(trap, question.answer)) return `Hint: ${trap}`;
  const clue = keyClue(question, article);
  if (clue && !answerLeaked(clue, question.answer)) {
    return `Hint: think about ${clue}.`;
  }
  if (question.format === "multipleChoice") {
    const wrong = question.choices.find((choice) => !isChoiceCorrect(question, choice.key) && !answerLeaked(choice.text, question.answer));
    if (wrong) return `Hint: it is not ${wrong.key}) ${wrong.text}. Re-read the last clause of the stem.`;
    return "Hint: re-read the last clause. Cross out any choice that is true but not what was asked.";
  }
  const shape = hintAnswerShape(question.answer);
  if (shape.words && shape.letter && shape.letter.length === 1 && !/^\d$/.test(shape.letter)) {
    return `Hint: this is a ${question.category} toss-up. The answer is ${shape.words} word${shape.words === 1 ? "" : "s"} and starts with ${shape.letter}.`;
  }
  return `Hint: this ${question.category} toss-up wants a precise term. Re-read the last clause.`;
}

function teach(question: PlayQuestion, article?: EncyclopediaTopic) {
  const clue = keyClue(question, article);
  return [
    article?.whatIsIt ?? `${question.topic} shows up a lot in middle-school Science Bowl.`,
    article?.howItWorks,
    clue ? `Hold onto: ${clue}.` : "",
    article?.nsbTraps[0] ? `Trap to watch: ${article.nsbTraps[0]}` : "Read the last clause before you buzz.",
  ].filter(Boolean).join(" ");
}

function eighthGrade(question: PlayQuestion, article?: EncyclopediaTopic) {
  return [
    article?.whatIsIt ?? `In plain words: the answer is ${question.answer}.`,
    article?.realWorldExample,
    `For this toss-up, say ${question.answer}.`,
  ].filter(Boolean).join(" ");
}

function choiceReview(question: PlayQuestion, userAnswer?: string) {
  const right = question.choices.find((choice) => isChoiceCorrect(question, choice.key));
  if (!right) return "";
  if (!userAnswer) return `The correct choice is ${right.key}) ${right.text}.`;
  if (isChoiceCorrect(question, userAnswer) || question.choices.some((c) => c.text === userAnswer && isChoiceCorrect(question, c.key))) {
    return `Yes — ${right.key}) ${right.text}.`;
  }
  return `Correct choice: ${right.key}) ${right.text}.`;
}
