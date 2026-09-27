"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CHECKLIST_SEED } from "./catalogs";
import { weekNumber } from "./schedule";
import type {
  Appearance,
  ChecklistItem,
  DoeQuestion,
  DrillResult,
  FlashCard,
  FlashPace,
  NotebookEntry,
  PracticeRound,
  ReviewStage,
  SpeechRate,
} from "./types";

const KEY = "sbc-web-state-v1";

function mergeChecklist(saved?: ChecklistItem[]): ChecklistItem[] {
  const seed = CHECKLIST_SEED.map((item) => ({ ...item, completed: false }));
  if (!saved?.length) return seed;
  const byId = new Map(saved.map((item) => [item.id, item]));
  return seed.map((item) => byId.get(item.id) ?? item);
}

type State = {
  currentWeek: number;
  weekManuallySet: boolean;
  showSessionTimer: boolean;
  parentReadsAloud: boolean;
  readQuestionsAloud: boolean;
  autoReadQuestions: boolean;
  speechRatePreset: SpeechRate;
  studentName: string;
  speechVoiceURI: string | null;
  flashCardReviewPace: FlashPace;
  appAppearance: Appearance;
  checklist: ChecklistItem[];
  drillResults: DrillResult[];
  flashCards: FlashCard[];
  notebook: NotebookEntry[];
  reviewedTopicIds: string[];
  encyclopediaWrong: Record<string, number>;
  encyclopediaStreak: number;
  lastEncyclopediaDate: string | null;
  importedDoe: DoeQuestion[];
  xp: number;
  studyStreak: number;
  lastStudyDate: string | null;
  elementMastered: string[];
  completedSessionIds: string[];
  pythonDoneIds: string[];
  planExtraDate: string | null;
  planExtraDone: string[];
  practiceRounds: PracticeRound[];
  studySeconds: number;
  buzzerRoomCode: string | null;
};

const defaultState = (): State => ({
  currentWeek: weekNumber(),
  weekManuallySet: false,
  showSessionTimer: true,
  parentReadsAloud: false,
  readQuestionsAloud: false,
  autoReadQuestions: true,
  speechRatePreset: "normal",
  studentName: "Soha",
  speechVoiceURI: null,
  flashCardReviewPace: "normal",
  appAppearance: "dark",
  checklist: mergeChecklist(),
  drillResults: [],
  flashCards: [],
  notebook: [],
  reviewedTopicIds: [],
  encyclopediaWrong: {},
  encyclopediaStreak: 0,
  lastEncyclopediaDate: null,
  importedDoe: [],
  xp: 0,
  studyStreak: 0,
  lastStudyDate: null,
  elementMastered: [],
  completedSessionIds: [],
  pythonDoneIds: [],
  planExtraDate: null,
  planExtraDone: [],
  practiceRounds: [],
  studySeconds: 0,
  buzzerRoomCode: null,
});

type Store = State & {
  set: (patch: Partial<State>) => void;
  recordAnswer: (input: { questionId: string; topic: string; subject: string; correct: boolean; prompt?: string; answer?: string }) => void;
  markReviewed: (topicId: string) => void;
  toggleChecklist: (id: string) => void;
  addNotebook: (text: string) => void;
  reviewFlashCard: (id: string, correct: boolean) => void;
  addFlashCards: (cards: { subject: string; topic: string; prompt: string; answer: string }[]) => number;
  completeSession: (blockId: string) => void;
  togglePythonDone: (id: string) => void;
  togglePlanItem: (id: string) => void;
  recordRound: (input: { title: string; asked: number; correct: number; seconds: number }) => void;
  clearProgress: () => void;
  importBackup: (data: Partial<State>) => void;
  exportState: () => State;
};

const StoreContext = createContext<Store | null>(null);

const INTERVALS: Record<FlashPace, Record<ReviewStage, number>> = {
  normal: { new: 1, learning: 3, review: 7, mastered: 14 },
  quick: { new: 1, learning: 2, review: 4, mastered: 7 },
  longTerm: { new: 2, learning: 5, review: 14, mastered: 30 },
};

function advance(stage: ReviewStage): ReviewStage {
  return stage === "new" ? "learning" : stage === "learning" ? "review" : "mastered";
}

function regress(stage: ReviewStage): ReviewStage {
  return stage === "mastered" ? "review" : stage === "review" ? "learning" : "new";
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const STAGE_RANK: Record<ReviewStage, number> = { new: 0, learning: 1, review: 2, mastered: 3 };

function flashKey(card: { prompt: string; answer: string }) {
  return `${card.prompt.trim()}::${card.answer.trim()}`;
}

function mergeDrillResults(rows: DrillResult[]): DrillResult[] {
  const out: DrillResult[] = [];
  for (const row of rows) {
    const at = new Date(row.at).getTime();
    const dup = out.some((prev) => (
      prev.questionId === row.questionId
      && prev.correct === row.correct
      && Math.abs(new Date(prev.at).getTime() - at) < 1500
    ));
    if (!dup) out.push(row);
  }
  return out;
}

function mergeFlashCards(cards: FlashCard[]): FlashCard[] {
  const seen = new Map<string, FlashCard>();
  for (const card of cards) {
    const key = flashKey(card);
    const prev = seen.get(key);
    if (!prev) {
      seen.set(key, card);
      continue;
    }
    seen.set(key, {
      ...prev,
      due: new Date(card.due) < new Date(prev.due) ? card.due : prev.due,
      stage: STAGE_RANK[card.stage] < STAGE_RANK[prev.stage] ? card.stage : prev.stage,
    });
  }
  return [...seen.values()];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<State>;
        setState({
          ...defaultState(),
          ...parsed,
          checklist: mergeChecklist(parsed.checklist),
          flashCards: mergeFlashCards(parsed.flashCards ?? []),
          drillResults: mergeDrillResults(parsed.drillResults ?? []),
          pythonDoneIds: Array.isArray(parsed.pythonDoneIds) ? parsed.pythonDoneIds : [],
        });
      }
    } catch {
      /* keep defaults */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const store = useMemo<Store>(() => ({
    ...state,
    set: (patch) => setState((prev) => ({ ...prev, ...patch })),
    recordAnswer: ({ questionId, topic, subject, correct, prompt, answer }) => {
      setState((prev) => {
        const recent = prev.drillResults.at(-1);
        if (recent && recent.questionId === questionId && Date.now() - new Date(recent.at).getTime() < 1500) {
          return prev;
        }
        const result: DrillResult = {
          id: crypto.randomUUID(),
          questionId,
          topic,
          subject,
          correct,
          at: new Date().toISOString(),
        };
        let flashCards = prev.flashCards;
        if (!correct && prompt && answer) {
          const key = flashKey({ prompt, answer });
          const existing = flashCards.find((card) => flashKey(card) === key);
          if (existing) {
            flashCards = flashCards.map((card) =>
              card.id === existing.id
                ? { ...card, stage: regress(card.stage), due: new Date().toISOString() }
                : card,
            );
          } else {
            flashCards = [
              ...flashCards,
              {
                id: crypto.randomUUID(),
                subject,
                topic,
                prompt,
                answer,
                stage: "new",
                due: new Date().toISOString(),
              },
            ];
          }
        }
        const today = new Date().toDateString();
        const last = prev.lastStudyDate ? new Date(prev.lastStudyDate).toDateString() : null;
        let studyStreak = prev.studyStreak;
        if (last !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          studyStreak = last === yesterday.toDateString() ? prev.studyStreak + 1 : 1;
        }
        const encyclopediaWrong = correct
          ? prev.encyclopediaWrong
          : { ...prev.encyclopediaWrong, [topic]: (prev.encyclopediaWrong[topic] ?? 0) + 1 };
        return {
          ...prev,
          drillResults: [...prev.drillResults, result],
          flashCards,
          encyclopediaWrong,
          xp: prev.xp + (correct ? 10 : 0),
          studyStreak,
          lastStudyDate: new Date().toISOString(),
        };
      });
    },
    markReviewed: (topicId) => {
      setState((prev) => {
        const already = prev.reviewedTopicIds.includes(topicId);
        const today = new Date().toDateString();
        const last = prev.lastEncyclopediaDate ? new Date(prev.lastEncyclopediaDate).toDateString() : null;
        let encyclopediaStreak = prev.encyclopediaStreak;
        if (!already && last !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          encyclopediaStreak = last === yesterday.toDateString() ? prev.encyclopediaStreak + 1 : 1;
        }
        return {
          ...prev,
          reviewedTopicIds: already ? prev.reviewedTopicIds : [...prev.reviewedTopicIds, topicId],
          encyclopediaStreak,
          lastEncyclopediaDate: already ? prev.lastEncyclopediaDate : new Date().toISOString(),
        };
      });
    },
    toggleChecklist: (id) => {
      setState((prev) => ({
        ...prev,
        checklist: prev.checklist.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
      }));
    },
    addNotebook: (text) => {
      setState((prev) => ({
        ...prev,
        notebook: [...prev.notebook, { id: crypto.randomUUID(), text, at: new Date().toISOString() }],
      }));
    },
    reviewFlashCard: (id, correct) => {
      setState((prev) => ({
        ...prev,
        flashCards: prev.flashCards.map((card) => {
          if (card.id !== id) return card;
          const stage = correct ? advance(card.stage) : regress(card.stage);
          return { ...card, stage, due: addDays(INTERVALS[prev.flashCardReviewPace][stage]) };
        }),
      }));
    },
    addFlashCards: (cards) => {
      const seen = new Set(state.flashCards.map(flashKey));
      const next = cards
        .filter((card) => card.prompt && card.answer && !seen.has(flashKey(card)))
        .map((card) => {
          seen.add(flashKey(card));
          return {
            id: crypto.randomUUID(),
            subject: card.subject,
            topic: card.topic,
            prompt: card.prompt,
            answer: card.answer,
            stage: "new" as const,
            due: new Date().toISOString(),
          };
        });
      if (next.length) {
        setState((prev) => ({ ...prev, flashCards: [...prev.flashCards, ...next] }));
      }
      return next.length;
    },
    completeSession: (blockId) => {
      setState((prev) => ({
        ...prev,
        completedSessionIds: prev.completedSessionIds.includes(blockId)
          ? prev.completedSessionIds
          : [...prev.completedSessionIds, blockId],
      }));
    },
    togglePythonDone: (id) => {
      setState((prev) => ({
        ...prev,
        pythonDoneIds: prev.pythonDoneIds.includes(id)
          ? prev.pythonDoneIds.filter((item) => item !== id)
          : [...prev.pythonDoneIds, id],
      }));
    },
    togglePlanItem: (id) => {
      const today = new Date().toDateString();
      setState((prev) => {
        const current = prev.planExtraDate === today ? prev.planExtraDone : [];
        return {
          ...prev,
          planExtraDate: today,
          planExtraDone: current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        };
      });
    },
    recordRound: ({ title, asked, correct, seconds }) => {
      setState((prev) => ({
        ...prev,
        studySeconds: (prev.studySeconds ?? 0) + seconds,
        practiceRounds: [
          {
            id: crypto.randomUUID(),
            title,
            asked,
            correct,
            seconds,
            at: new Date().toISOString(),
          },
          ...(prev.practiceRounds ?? []),
        ].slice(0, 40),
      }));
    },
    clearProgress: () => {
      const keep = {
        appAppearance: state.appAppearance,
        showSessionTimer: state.showSessionTimer,
        parentReadsAloud: state.parentReadsAloud,
        studentName: state.studentName,
      };
      setState({ ...defaultState(), ...keep });
    },
    importBackup: (data) => {
      const allowed = defaultState();
      const patch = Object.fromEntries(
        Object.keys(allowed)
          .filter((key) => data[key as keyof State] !== undefined)
          .map((key) => [key, data[key as keyof State]]),
      ) as Partial<State>;
      if (patch.checklist) patch.checklist = mergeChecklist(patch.checklist);
      setState((prev) => ({ ...prev, ...patch }));
    },
    exportState: () => {
      const snapshot = { ...defaultState(), ...state };
      return Object.fromEntries(
        Object.keys(defaultState()).map((key) => [key, snapshot[key as keyof State]]),
      ) as State;
    },
  }), [state]);

  if (!ready) return <div className="boot">Loading Science Bowl Coach…</div>;
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
