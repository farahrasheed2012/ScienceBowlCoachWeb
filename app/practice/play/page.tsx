"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { CompetitionPlay } from "@/components/CompetitionPlay";
import { QuestionPlay } from "@/components/QuestionPlay";
import { regionalSprint, studyBlocks } from "@/lib/catalogs";
import {
  curriculumTossups,
  officialPacketPlay,
  practiceBank,
  shuffle,
  allEncyclopediaPlay,
  matchesSubject,
  type CompetitionLength,
} from "@/lib/questions";
import { topicAccuracy } from "@/lib/stats";
import { sameTopicLabel } from "@/lib/topic-map";
import { tossUpHewittPairs } from "@/lib/tossup";
import { useStore } from "@/lib/store";

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
  const packet = params.get("packet") || "";
  const round = params.get("round") || "";
  const asked = Number(params.get("n"));
  const take = Number.isFinite(asked) && asked > 0 ? Math.min(Math.floor(asked), 25) : 0;
  const { title, questions, topicLabel } = useMemo(() => {
    const bank = practiceBank(store.importedDoe);
    if (mode === "quick") return { title: "Quick Practice", questions: shuffle(bank).slice(0, take || 10) };
    if (mode === "tossup") return { title: "Toss-Up", questions: shuffle(bank.filter((q) => q.kind !== "bonus")).slice(0, take || 15) };
    if (mode === "bonus") {
      return { title: "Bonus pairs", questions: tossUpHewittPairs.flatMap((pair) => [pair.tossup, ...(pair.bonus ? [pair.bonus] : [])]) };
    }
    if (mode === "subject") {
      const name = subject || "biology";
      const list = shuffle(bank.filter((q) => matchesSubject(q, name) && q.kind !== "bonus")).slice(0, 15);
      const label = name === "earth" ? "Earth & Space" : name === "energy" ? "Energy" : name[0].toUpperCase() + name.slice(1);
      return {
        title: label,
        questions: list.length ? list : shuffle(allEncyclopediaPlay().filter((q) => matchesSubject(q, name))).slice(0, 15),
        topicLabel: label,
      };
    }
    if (mode === "topic") {
      const list = shuffle(bank.filter((q) => q.topicId === topic || sameTopicLabel(q.topic, topic))).slice(0, 15);
      const fallback = list.length ? list : shuffle(allEncyclopediaPlay().filter((q) => q.topicId === topic || sameTopicLabel(q.topic, topic))).slice(0, 15);
      const label = fallback[0]?.topic || topic;
      return { title: label, questions: fallback, topicLabel: label };
    }
    if (mode === "weak") {
      const weakTopic = topic || topicAccuracy(store.drillResults).find((row) => row.acc < 0.7)?.topic || "";
      const list = shuffle(bank.filter((q) => q.topicId === weakTopic || sameTopicLabel(q.topic, weakTopic))).slice(0, 12);
      return {
        title: weakTopic ? `Weak area · ${weakTopic}` : "Weak areas",
        questions: list.length ? list : shuffle(bank).slice(0, 10),
        topicLabel: weakTopic || undefined,
      };
    }
    if (mode === "packet") {
      const roundNumber = round ? Number(round) : undefined;
      const list = officialPacketPlay(store.importedDoe, packet, Number.isFinite(roundNumber) ? roundNumber : undefined);
      return {
        title: packet ? `${packet}${roundNumber ? ` · Round ${roundNumber}` : ""}` : "Official packet",
        questions: list,
      };
    }
    if (mode === "mock" || mode === "compete") return { title: "Competition Mode", questions: [] };
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
      const list = allEncyclopediaPlay().filter((q) => (!type || q.type.toLowerCase().includes(type.toLowerCase())) && (!topicId || q.topicId === topicId));
      return {
        title: list[0]?.topic || "Encyclopedia",
        questions: list,
        topicLabel: list[0]?.topic,
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
    return { title: "Practice", questions: shuffle(bank).slice(0, take || 10) };
  }, [id, mode, packet, round, store.currentWeek, store.importedDoe, subject, take, topic, topicId, type, week]);

  if (mode === "mock" || mode === "compete") {
    const lengthParam = params.get("length");
    const length: CompetitionLength | null =
      lengthParam === "half" || lengthParam === "full" ? lengthParam : null;
    if (!length) {
      return (
        <div className="stack">
          <p className="muted">Pick a match length in the lobby.</p>
          <Link className="btn" href="/practice/compete">Open match lobby</Link>
        </div>
      );
    }
    return <CompetitionPlay importedDoe={store.importedDoe} length={length} />;
  }

  return (
    <QuestionPlay
      key={`${mode}-${subject}-${topic}-${type}-${topicId}-${week}-${id}-${packet}-${round}-${take}`}
      questions={questions}
      title={title}
      topicLabel={topicLabel}
      timed
    />
  );
}

export default function PracticePlayPage() {
  return (
    <Suspense fallback={<p>Loading practice…</p>}>
      <PlayInner />
    </Suspense>
  );
}
