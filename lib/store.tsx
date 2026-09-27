"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

export type State = {
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
  syncCode: string | null;
  savedAt: string | null;
  profileId: string;
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
  syncCode: null,
  savedAt: null,
  profileId: "",
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
  importBackup: (data: Partial<State> | ProfileBag) => void;
  mergeRemote: (data: Partial<State>) => void;
  exportState: () => State;
  exportBag: () => ProfileBag;
  profiles: { id: string; name: string }[];
  switchProfile: (id: string) => void;
  addProfile: (name: string) => void;
  removeProfile: (id: string) => void;
};

export type ProfileBag = {
  bag: 1;
  activeId: string;
  profiles: Record<string, State>;
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

function snapshotState(state: State): State {
  const base = defaultState();
  return Object.fromEntries(
    Object.keys(base).map((key) => [key, state[key as keyof State]]),
  ) as State;
}

function hydrateState(raw: Partial<State> | undefined, profileId: string): State {
  const parsed = raw ?? {};
  return {
    ...defaultState(),
    ...parsed,
    profileId: typeof parsed.profileId === "string" && parsed.profileId ? parsed.profileId : profileId,
    studentName: parsed.studentName?.trim() || "Student",
    checklist: mergeChecklist(parsed.checklist),
    flashCards: mergeFlashCards(parsed.flashCards ?? []),
    drillResults: mergeDrillResults(parsed.drillResults ?? []),
    pythonDoneIds: Array.isArray(parsed.pythonDoneIds) ? parsed.pythonDoneIds : [],
    syncCode: typeof parsed.syncCode === "string" ? parsed.syncCode : null,
    savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : null,
  };
}

function isBag(value: unknown): value is ProfileBag {
  if (!value || typeof value !== "object") return false;
  const bag = value as ProfileBag;
  return bag.bag === 1 && Boolean(bag.profiles) && typeof bag.profiles === "object";
}

function profileList(active: State, bag: Record<string, State>) {
  const all = { ...bag, [active.profileId]: active };
  return Object.values(all)
    .filter((profile) => profile.profileId)
    .map((profile) => ({ id: profile.profileId, name: profile.studentName.trim() || "Student" }));
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
  const bagRef = useRef<Record<string, State>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (isBag(parsed)) {
          const profiles: Record<string, State> = {};
          for (const [id, value] of Object.entries(parsed.profiles)) {
            profiles[id] = hydrateState(value, id);
          }
          const activeId = profiles[parsed.activeId] ? parsed.activeId : Object.keys(profiles)[0];
          if (activeId && profiles[activeId]) {
            bagRef.current = profiles;
            setState(profiles[activeId]);
            setReady(true);
            return;
          }
        } else {
          const migrated = hydrateState(parsed as Partial<State>, crypto.randomUUID());
          bagRef.current = { [migrated.profileId]: migrated };
          setState(migrated);
          setReady(true);
          return;
        }
      }
      const first = hydrateState({ studentName: "Soha" }, crypto.randomUUID());
      bagRef.current = { [first.profileId]: first };
      setState(first);
    } catch {
      const first = hydrateState({ studentName: "Soha" }, crypto.randomUUID());
      bagRef.current = { [first.profileId]: first };
      setState(first);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !state.profileId) return;
    bagRef.current = { ...bagRef.current, [state.profileId]: snapshotState(state) };
    localStorage.setItem(KEY, JSON.stringify({
      bag: 1,
      activeId: state.profileId,
      profiles: bagRef.current,
    } satisfies ProfileBag));
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
        syncCode: state.syncCode,
        profileId: state.profileId,
      };
      setState({ ...defaultState(), ...keep, savedAt: new Date().toISOString() });
    },
    importBackup: (data) => {
      if (isBag(data)) {
        const profiles: Record<string, State> = {};
        for (const [id, value] of Object.entries(data.profiles)) {
          profiles[id] = hydrateState(value, id);
        }
        const activeId = profiles[data.activeId] ? data.activeId : Object.keys(profiles)[0];
        if (!activeId) return;
        bagRef.current = profiles;
        setState(profiles[activeId]);
        return;
      }
      const allowed = defaultState();
      const patch = Object.fromEntries(
        Object.keys(allowed)
          .filter((key) => data[key as keyof State] !== undefined)
          .map((key) => [key, data[key as keyof State]]),
      ) as Partial<State>;
      if (patch.checklist) patch.checklist = mergeChecklist(patch.checklist);
      setState((prev) => ({ ...prev, ...patch, profileId: prev.profileId }));
    },
    mergeRemote: (data) => {
      setState((prev) => {
        const incoming = data as Partial<State>;
        const union = (left: string[] | undefined, right: string[] | undefined) =>
          [...new Set([...(left ?? []), ...(right ?? [])])];
        return {
          ...prev,
          ...incoming,
          checklist: mergeChecklist(incoming.checklist ?? prev.checklist),
          flashCards: mergeFlashCards([...(prev.flashCards ?? []), ...(incoming.flashCards ?? [])]),
          drillResults: mergeDrillResults([...(prev.drillResults ?? []), ...(incoming.drillResults ?? [])]),
          pythonDoneIds: union(prev.pythonDoneIds, incoming.pythonDoneIds),
          reviewedTopicIds: union(prev.reviewedTopicIds, incoming.reviewedTopicIds),
          completedSessionIds: union(prev.completedSessionIds, incoming.completedSessionIds),
          elementMastered: union(prev.elementMastered, incoming.elementMastered),
          syncCode: prev.syncCode ?? incoming.syncCode ?? null,
          savedAt: new Date().toISOString(),
        };
      });
    },
    exportState: () => snapshotState(state),
    exportBag: () => ({
      bag: 1 as const,
      activeId: state.profileId,
      profiles: { ...bagRef.current, [state.profileId]: snapshotState(state) },
    }),
    profiles: profileList(state, bagRef.current),
    switchProfile: (id) => {
      if (!id || id === state.profileId) return;
      const next = bagRef.current[id];
      if (!next) return;
      bagRef.current = { ...bagRef.current, [state.profileId]: snapshotState(state) };
      setState(hydrateState(next, id));
    },
    addProfile: (name) => {
      const next = hydrateState({
        studentName: name.trim() || "Student",
        appAppearance: state.appAppearance,
        showSessionTimer: state.showSessionTimer,
        parentReadsAloud: state.parentReadsAloud,
      }, crypto.randomUUID());
      bagRef.current = { ...bagRef.current, [state.profileId]: snapshotState(state), [next.profileId]: next };
      setState(next);
    },
    removeProfile: (id) => {
      const remaining = Object.values({ ...bagRef.current, [state.profileId]: snapshotState(state) })
        .filter((profile) => profile.profileId !== id);
      if (remaining.length === 0) return;
      const nextBag: Record<string, State> = {};
      for (const profile of remaining) nextBag[profile.profileId] = profile;
      bagRef.current = nextBag;
      if (state.profileId === id) setState(remaining[0]);
      else setState((prev) => ({ ...prev }));
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
