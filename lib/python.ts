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

export function pythonDoneCount(doneIds: string[]) {
  const known = new Set(pythonLessons.map((lesson) => lesson.id));
  return doneIds.filter((id) => known.has(id)).length;
}

export function firstOpenLesson(lessonIds: string[], doneIds: string[]) {
  const done = new Set(doneIds);
  return lessonIds.find((id) => !done.has(id)) ?? lessonIds[0];
}

export function splitPythonBody(body: string) {
  const text = body.replace(/\r\n/g, "\n").trim();
  const fence = text.indexOf("```");
  if (fence <= 0) return { learn: text, see: "" };
  return { learn: text.slice(0, fence).trim(), see: text.slice(fence).trim() };
}

export function pythonLevelTracks(doneIds: string[]) {
  const done = new Set(doneIds);
  return pythonLevels.map((level) => {
    const weeks = pythonWeeks.filter((week) => level.weeks.includes(week.id));
    const lessonIds = weeks.flatMap((week) => week.lessonIds);
    const marked = lessonIds.filter((id) => done.has(id)).length;
    return {
      level,
      weeks,
      marked,
      total: lessonIds.length,
      complete: lessonIds.length > 0 && marked === lessonIds.length,
    };
  });
}

export function currentPythonTrack(doneIds: string[]) {
  const tracks = pythonLevelTracks(doneIds);
  return tracks.find((track) => !track.complete) ?? tracks[tracks.length - 1];
}

export function pythonLessonStages(lesson: PythonLesson) {
  const { learn, see } = splitPythonBody(lesson.body);
  const raw = [
    { id: "learn", label: "Learn", present: Boolean(learn) },
    { id: "see", label: "See it", present: Boolean(see) },
    { id: "try", label: "Try it", present: Boolean(lesson.tryItPrompt) },
    { id: "build", label: "Build it", present: Boolean(lesson.starterCode) || lesson.practiceSteps.length > 0 },
    { id: "prove", label: "Prove it", present: Boolean(lesson.challengeQuestion) },
    { id: "finish", label: "Finish", present: true },
  ].filter((stage) => stage.present);
  return {
    learn,
    see,
    stages: raw.map((stage, index) => ({
      ...stage,
      n: String(index + 1).padStart(2, "0"),
    })),
  };
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
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
    .map(normalizeAnswer)
    .filter(Boolean);
  const text = normalizeAnswer(guess);
  if (!text || !answers.length) return false;
  return answers.includes(text);
}
