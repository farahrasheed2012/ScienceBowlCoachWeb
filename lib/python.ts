import catalog from "@/data/python_coach.json";

export type PythonLesson = {
  id: string;
  kind: "lesson" | "session";
  title: string;
  body: string;
  teacherScript: string;
  tryItPrompt: string | null;
  practiceSteps: string[];
  starterCode: string | null;
  challengeQuestion: string | null;
  challengeAnswer: string | null;
  challengeAcceptedAnswers: string[];
  durationMinutes: number | null;
};

export type PythonWeek = {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  goal: string;
  skills: string[];
  lessonIds: string[];
};

export type PythonGame = {
  id: string;
  kind: "game";
  title: string;
  weekNumber: number | null;
  summary: string;
  skills: string[];
  steps: string[];
  starterCode: string | null;
  stretchGoal: string | null;
};

export type PythonLevel = {
  id: string;
  title: string;
  subtitle: string;
  weeks: number[];
};

export const pythonLevels = catalog.levels as PythonLevel[];
export const pythonWeeks = catalog.weeks as PythonWeek[];
export const pythonLessons = catalog.lessons as PythonLesson[];
export const pythonGames = catalog.games as PythonGame[];

const lessonById = new Map(pythonLessons.map((lesson) => [lesson.id, lesson]));
const weekById = new Map(pythonWeeks.map((week) => [week.id, week]));
const gameById = new Map(pythonGames.map((game) => [game.id, game]));

export function pythonLesson(id: string) {
  return lessonById.get(id);
}

export function pythonGame(id: string) {
  return gameById.get(id);
}

export function pythonWeek(id: number) {
  return weekById.get(id);
}

export function weekForLesson(id: string) {
  return pythonWeeks.find((week) => week.lessonIds.includes(id));
}

export function levelForWeek(weekId: number) {
  return pythonLevels.find((level) => level.weeks.includes(weekId));
}

export function nextPythonLesson(doneIds: string[]) {
  const done = new Set(doneIds);
  return pythonLessons.find((lesson) => !done.has(lesson.id));
}

export function neighbors(id: string) {
  const index = pythonLessons.findIndex((lesson) => lesson.id === id);
  return {
    prev: index > 0 ? pythonLessons[index - 1] : undefined,
    next: index >= 0 && index < pythonLessons.length - 1 ? pythonLessons[index + 1] : undefined,
  };
}

export function challengeMatches(guess: string, lesson: PythonLesson) {
  const answers = [lesson.challengeAnswer, ...lesson.challengeAcceptedAnswers]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim().toLowerCase());
  const text = guess.trim().toLowerCase();
  if (!text || !answers.length) return false;
  return answers.some((answer) => text === answer || text.includes(answer) || answer.includes(text));
}
