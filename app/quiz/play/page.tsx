"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { encyclopediaQuestions, regionalSprint, studyBlocks } from "@/lib/catalogs";
import { QuestionPlay } from "@/components/QuestionPlay";
import { allEncyclopediaPlay, curriculumTossups, encyclopediaToPlay, shuffle, starterDoePlay } from "@/lib/questions";
import { useStore } from "@/lib/store";
import type { PlayQuestion } from "@/lib/types";

function PlayInner() {
  const params = useSearchParams();
  const store = useStore();
  const mode = params.get("mode") ?? "tossup";
  const doeImported: PlayQuestion[] = store.importedDoe.map((item) => ({
    id: item.id,
    source: "DOE",
    category: item.category,
    type: item.questionType,
    format: item.choices?.length ? "multipleChoice" : "shortAnswer",
    topic: item.category,
    questionText: item.questionText,
    choices: (item.choices ?? []).map((line) => {
      const m = line.match(/^([WXYZ])\)\s*(.*)$/i);
      return m ? { key: m[1].toUpperCase(), text: m[2] } : { key: "", text: line };
    }),
    answer: item.answer,
  }));
  const doe = [...starterDoePlay(), ...doeImported];

  let title = "Drill";
  let questions: PlayQuestion[] = [];

  if (mode === "week") {
    const week = Number(params.get("week") || store.currentWeek);
    const subject = params.get("subject") || undefined;
    questions = curriculumTossups({ week, subject: subject as "biology" | undefined });
    title = `Week ${week}${subject ? ` · ${subject}` : ""}`;
  } else if (mode === "block") {
    const block = studyBlocks.find((b) => b.id === params.get("id"));
    questions = block ? curriculumTossups({ week: block.week, subject: block.subject }).filter((q) => q.topic === block.topic) : [];
    title = block?.chapterTitle ?? "Block";
  } else if (mode === "encyclopedia") {
    const type = params.get("type");
    questions = encyclopediaQuestions
      .filter((q) => !type || q.type === type)
      .map(encyclopediaToPlay);
    title = "Encyclopedia practice";
  } else if (mode === "hewitt") {
    questions = encyclopediaQuestions.filter((q) => q.id.startsWith("hewitt") || q.topicId.includes("chem")).map(encyclopediaToPlay);
    title = "Hewitt Ch 17";
  } else if (mode === "tossup") {
    questions = shuffle(curriculumTossups());
    title = "Toss-up drill";
  } else if (mode === "topic") {
    questions = shuffle(allEncyclopediaPlay().filter((q) => q.format === "multipleChoice"));
    title = "Topic quiz";
  } else if (mode === "mock") {
    questions = shuffle([...curriculumTossups(), ...doe]).slice(0, 25);
    title = "Mock round";
  } else if (mode === "doe" || mode === "doe-mock") {
    questions = shuffle(doe).slice(0, mode === "doe-mock" ? 50 : 25);
    title = mode === "doe-mock" ? "DOE mock" : "DOE drill";
  } else if (mode === "sprint") {
    const packs = params.get("id") ? regionalSprint.filter((p) => p.id === params.get("id")) : regionalSprint;
    questions = packs.flatMap((pack) => pack.tossups.map((t, i) => ({
      id: `${pack.id}-${i}`,
      source: "Regional Sprint",
      category: pack.track,
      type: "TOSS-UP",
      format: "shortAnswer" as const,
      topic: pack.title,
      questionText: t.question,
      choices: [],
      answer: t.answer,
    })));
    title = packs.length === 1 ? packs[0].title : "Mixed regional drill";
  } else if (mode === "weak") {
    const topic = params.get("topic") ?? "";
    questions = [...curriculumTossups(), ...allEncyclopediaPlay()].filter((q) => q.topic === topic);
    title = `Weak area · ${topic}`;
  }

  return <QuestionPlay questions={questions} title={title} />;
}

export default function PlayPage() {
  return (
    <Suspense fallback={<p>Loading drill…</p>}>
      <PlayInner />
    </Suspense>
  );
}
