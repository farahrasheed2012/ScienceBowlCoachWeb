export type Subject = "biology" | "chemistry" | "physics" | "math";
export type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
export type Appearance = "dark" | "warmLight" | "system";
export type SpeechRate = "slow" | "normal" | "fast";
export type FlashPace = "normal" | "quick" | "longTerm";
export type ReviewStage = "new" | "learning" | "review" | "mastered";

export type StudyBlock = {
  id: string;
  week: number;
  day: Weekday;
  subject: Subject;
  bookCode: string;
  chapter: string;
  chapterTitle: string;
  pass2BookCode: string | null;
  pass2Chapter: string | null;
  pass2ChapterTitle: string | null;
  backupBookLine: string | null;
  focus: string;
  formulasAndTerms: string;
  knowCold: string[];
  topic: string;
  sampleTossups: { question: string; answer: string }[];
};

export type EncyclopediaTopic = {
  id: string;
  subject: string;
  title: string;
  whatIsIt: string;
  howItWorks: string;
  realWorldExample: string;
  keyTerms: { term: string; definition: string }[];
  nsbTraps: string[];
  didYouKnow: string[];
  relatedTopics: string[];
};

export type EncyclopediaQuestion = {
  id: string;
  subject: string;
  subtopic: string;
  type: string;
  questionText: string;
  answerChoices?: Record<string, string>;
  correctAnswer: string;
  difficulty: string;
  topicId: string;
};

export type DoeQuestion = {
  id: string;
  setNumber?: number;
  roundNumber?: number;
  questionNumber?: number;
  category: string;
  doeCategory?: string;
  packet?: string;
  packetLabel?: string;
  questionType: string;
  format: string;
  questionText: string;
  choices?: string[];
  answer: string;
  sourceFile?: string;
  sourceYear?: number;
};

export type PlayQuestion = {
  id: string;
  source: string;
  category: string;
  type: string;
  format: "multipleChoice" | "shortAnswer";
  topic: string;
  questionText: string;
  choices: { key: string; text: string }[];
  answer: string;
  topicId?: string;
  kind?: "tossup" | "bonus";
  answerKey?: string;
  setNumber?: number;
  roundNumber?: number;
  questionNumber?: number;
  packetLabel?: string;
};

export type TossUpTopic = {
  id: string;
  subject: string;
  name: string;
};

export type DrillKind = "tossup" | "bonus" | "recall";

export type DrillResult = {
  id: string;
  questionId: string;
  topic: string;
  subject: Subject | string;
  correct: boolean;
  at: string;
  kind?: DrillKind;
  format?: "multipleChoice" | "shortAnswer";
  timed?: boolean;
  buzzed?: boolean;
  timedOut?: boolean;
  secondsUsed?: number;
  secondsAllowed?: number;
  buzzedAtSec?: number;
};

export type AnswerLog = {
  questionId: string;
  topic: string;
  subject: string;
  correct: boolean;
  prompt?: string;
  answer?: string;
  kind?: DrillKind;
  format?: "multipleChoice" | "shortAnswer";
  timed?: boolean;
  buzzed?: boolean;
  timedOut?: boolean;
  secondsUsed?: number;
  secondsAllowed?: number;
  buzzedAtSec?: number;
};

export type FlashCard = {
  id: string;
  subject: string;
  topic: string;
  prompt: string;
  answer: string;
  stage: ReviewStage;
  due: string;
};

export type ChecklistItem = {
  id: string;
  subject: string;
  category: string;
  description: string;
  completed: boolean;
};

export type NotebookEntry = {
  id: string;
  text: string;
  at: string;
};

export type PracticeRound = {
  id: string;
  title: string;
  asked: number;
  correct: number;
  seconds: number;
  at: string;
};
