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
  ReviewStage,
  SpeechRate,
} from "./types";

const KEY = "sbc-web-state-v1";

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
  pot6CatchUpCompleted: string[];
  pot6GeoCompleted: string[];
  importedDoe: DoeQuestion[];
  xp: number;
  studyStreak: number;
  lastStudyDate: string | null;
  elementMastered: string[];
  mathCountsLevel: number;
  mathCountsStreak: number;
  mathCountsSessions: number;
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
  checklist: CHECKLIST_SEED.map((item) => ({ ...item, completed: false })),
  drillResults: [],
  flashCards: [],
  notebook: [],
  reviewedTopicIds: [],
  encyclopediaWrong: {},
  encyclopediaStreak: 0,
  pot6CatchUpCompleted: [],
  pot6GeoCompleted: [],
  importedDoe: [],
  xp: 0,
  studyStreak: 0,
  lastStudyDate: null,
  elementMastered: [],
  mathCountsLevel: 1,
  mathCountsStreak: 0,
  mathCountsSessions: 0,
});

type Store = State & {
  set: (patch: Partial<State>) => void;
  recordAnswer: (input: { questionId: string; topic: string; subject: string; correct: boolean; prompt?: string; answer?: string }) => void;
  markReviewed: (topicId: string) => void;
  toggleChecklist: (id: string) => void;
  addNotebook: (text: string) => void;
  reviewFlashCard: (id: string, correct: boolean) => void;
  clearProgress: () => void;
  importBackup: (data: Partial<State>) => void;
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<State>;
        setState({ ...defaultState(), ...parsed, checklist: parsed.checklist?.length ? parsed.checklist : defaultState().checklist });
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
          flashCards = [
            ...flashCards,
            {
              id: crypto.randomUUID(),
              subject,
              topic,
              prompt,
              answer,
              stage: "new",
              due: addDays(INTERVALS[prev.flashCardReviewPace].new),
            },
          ];
        }
        const today = new Date().toDateString();
        const last = prev.lastStudyDate ? new Date(prev.lastStudyDate).toDateString() : null;
        let studyStreak = prev.studyStreak;
        if (last !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          studyStreak = last === yesterday.toDateString() ? prev.studyStreak + 1 : 1;
        }
        return {
          ...prev,
          drillResults: [...prev.drillResults, result],
          flashCards,
          xp: prev.xp + (correct ? 10 : 0),
          studyStreak,
          lastStudyDate: new Date().toISOString(),
        };
      });
    },
    markReviewed: (topicId) => {
      setState((prev) => ({
        ...prev,
        reviewedTopicIds: prev.reviewedTopicIds.includes(topicId)
          ? prev.reviewedTopicIds
          : [...prev.reviewedTopicIds, topicId],
      }));
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
    clearProgress: () => {
      const keep = {
        appAppearance: state.appAppearance,
        showSessionTimer: state.showSessionTimer,
        parentReadsAloud: state.parentReadsAloud,
        studentName: state.studentName,
      };
      setState({ ...defaultState(), ...keep });
    },
    importBackup: (data) => setState((prev) => ({ ...prev, ...data })),
  }), [state]);

  if (!ready) return <div className="boot">Loading Science Bowl Coach…</div>;
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
