"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { QuestionPlay } from "@/components/QuestionPlay";
import { regionalSprint, studyBlocks } from "@/lib/catalogs";
import {
  buildMockMatch,
  curriculumTossups,
  practiceBank,
  shuffle,
  allEncyclopediaPlay,
} from "@/lib/questions";
import { topicAccuracy } from "@/lib/stats";
import { tossUpHewittPairs } from "@/lib/tossup";
import { useStore } from "@/lib/store";
import type { PlayQuestion } from "@/lib/types";

function matchesSubject(question: PlayQuestion, subject: string) {
  const category = question.category.toLowerCase();
  if (subject === "biology") return category.includes("bio") || category.includes("life");
  if (subject === "chemistry") return category.includes("chem");
  if (subject === "physics") return category.includes("phys") || category.includes("energy");
  if (subject === "earth") return category.includes("earth") || category.includes("space") || category.includes("astro");
  if (subject === "math") return category.includes("math");
  return category.includes(subject.toLowerCase());
}

function PlayInner() {
  const params = useSearchParams();
  const store = useStore();
  const mode = params.get("mode") ?? "quick";
  const subject = params.get("subject") || "";
  const topic = params.get("topic") || "";
  const type = params.get("type") || "";
  const topicId = params.get("topicId") || "";
  const week = params.get("week") || "";
  const id = params.get("id") || "";
  const { title, questions } = useMemo(() => {
    const bank = practiceBank(store.importedDoe);
    if (mode === "quick") return { title: "Quick Practice", questions: shuffle(bank).slice(0, 10) };
    if (mode === "tossup") return { title: "Toss-Up", questions: shuffle(bank.filter((q) => q.kind !== "bonus")).slice(0, 15) };
    if (mode === "bonus") {
      return { title: "Bonus pairs", questions: tossUpHewittPairs.flatMap((pair) => [pair.tossup, ...(pair.bonus ? [pair.bonus] : [])]) };
    }
    if (mode === "subject") {
      const name = subject || "biology";
      const list = shuffle(bank.filter((q) => matchesSubject(q, name) && q.kind !== "bonus")).slice(0, 15);
      return {
        title: name === "earth" ? "Earth & Space" : name[0].toUpperCase() + name.slice(1),
        questions: list.length ? list : shuffle(allEncyclopediaPlay().filter((q) => matchesSubject(q, name))).slice(0, 15),
      };
    }
    if (mode === "topic") {
      const list = shuffle(bank.filter((q) => q.topicId === topic || q.topic === topic)).slice(0, 15);
      const fallback = list.length ? list : shuffle(allEncyclopediaPlay().filter((q) => q.topicId === topic || q.topic === topic)).slice(0, 15);
      return { title: fallback[0]?.topic || topic, questions: fallback };
    }
    if (mode === "weak") {
      const weakTopic = topic || topicAccuracy(store.drillResults).find((row) => row.acc < 0.7)?.topic || "";
      const list = shuffle(bank.filter((q) => q.topic === weakTopic || q.topicId === weakTopic)).slice(0, 12);
      return {
        title: weakTopic ? `Weak · ${weakTopic}` : "Weak areas",
        questions: list.length ? list : shuffle(bank).slice(0, 10),
      };
    }
    if (mode === "mock") return { title: "Mock Match", questions: buildMockMatch(store.importedDoe) };
    if (mode === "week") {
      const weekNumber = Number(week || store.currentWeek);
      return { title: `Week ${weekNumber}`, questions: curriculumTossups({ week: weekNumber, subject: subject as "biology" | undefined }) };
    }
    if (mode === "block") {
      const block = studyBlocks.find((b) => b.id === id);
      return {
        title: block?.chapterTitle ?? "Block",
        questions: block ? curriculumTossups({ week: block.week, subject: block.subject }).filter((q) => q.topic === block.topic) : [],
      };
    }
    if (mode === "encyclopedia") {
      return {
        title: "Encyclopedia",
        questions: allEncyclopediaPlay().filter((q) => (!type || q.type.toLowerCase().includes(type.toLowerCase())) && (!topicId || q.topicId === topicId)),
      };
    }
    if (mode === "sprint") {
      const packs = id ? regionalSprint.filter((p) => p.id === id) : regionalSprint;
      return {
        title: packs.length === 1 ? packs[0].title : "Regional Sprint",
        questions: packs.flatMap((pack) => pack.tossups.map((t, i) => ({
          id: `${pack.id}-${i}`,
          source: "Regional Sprint",
          category: pack.track,
          type: "TOSS-UP" as const,
          format: "shortAnswer" as const,
          topic: pack.title,
          questionText: t.question,
          choices: [],
          answer: t.answer,
          kind: "tossup" as const,
        }))),
      };
    }
    return { title: "Practice", questions: shuffle(bank).slice(0, 10) };
  }, [id, mode, store.currentWeek, store.importedDoe, subject, topic, topicId, type, week]);

  return <QuestionPlay key={`${mode}-${subject}-${topic}-${type}-${topicId}-${week}-${id}`} questions={questions} title={title} timed />;
}

export default function PracticePlayPage() {
  return (
    <Suspense fallback={<p>Loading practice…</p>}>
      <PlayInner />
    </Suspense>
  );
}
