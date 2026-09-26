"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { encyclopediaQuestions, FORMULAS, regionalSprint, studyBlocks } from "@/lib/catalogs";
import { allEncyclopediaPlay, curriculumTossups, starterDoePlay } from "@/lib/questions";
import { useStore } from "@/lib/store";

export default function QuizPage() {
  const store = useStore();
  const [q, setQ] = useState("");
  const doe = [
    ...starterDoePlay(),
    ...store.importedDoe.map((item) => ({
      id: item.id,
      source: item.sourceFile ?? "DOE",
      category: item.category,
      type: item.questionType,
      format: (item.choices?.length ? "multipleChoice" : "shortAnswer") as "multipleChoice" | "shortAnswer",
      topic: item.category,
      questionText: item.questionText,
      choices: (item.choices ?? []).map((line) => {
        const m = line.match(/^([WXYZ])\)\s*(.*)$/i);
        return m ? { key: m[1].toUpperCase(), text: m[2] } : { key: "", text: line };
      }),
      answer: item.answer,
    })),
  ];
  const searchable = useMemo(() => [...allEncyclopediaPlay(), ...curriculumTossups(), ...doe], [doe]);
  const hits = q.trim().length < 2 ? [] : searchable.filter((item) => item.questionText.toLowerCase().includes(q.toLowerCase())).slice(0, 20);
  const weak = Object.entries(
    store.drillResults.reduce<Record<string, { t: number; c: number }>>((acc, r) => {
      acc[r.topic] = acc[r.topic] ?? { t: 0, c: 0 };
      acc[r.topic].t += 1;
      if (r.correct) acc[r.topic].c += 1;
      return acc;
    }, {}),
  ).map(([topic, v]) => ({ topic, acc: v.c / v.t, n: v.t })).filter((x) => x.n >= 2 && x.acc < 0.7).sort((a, b) => a.acc - b.acc);

  return (
    <div>
      <h1>Drill</h1>
      <p className="muted">Same quiz home as the Mac app: plan drills, encyclopedia, toss-ups, DOE, sprint, search, weak areas, formulas, buzzer.</p>
      <section className="card stack">
        <h3>This week&apos;s plan</h3>
        <p>Week {store.currentWeek}</p>
        <Link className="btn" href={`/quiz/play?mode=week&week=${store.currentWeek}`}>Quiz all subjects</Link>
        {["biology", "chemistry", "physics"].map((s) => (
          <Link key={s} href={`/quiz/play?mode=week&week=${store.currentWeek}&subject=${s}`}>{s} only</Link>
        ))}
        {studyBlocks.filter((b) => b.week === store.currentWeek).slice(0, 5).map((b) => (
          <Link key={b.id} href={`/quiz/play?mode=block&id=${b.id}`}>Quiz today · {b.subject} · {b.chapterTitle}</Link>
        ))}
      </section>
      <section className="card stack">
        <h3>Encyclopedia practice</h3>
        <p className="muted">{encyclopediaQuestions.length} questions · MC · toss-up · free response</p>
        <Link href="/quiz/play?mode=encyclopedia&type=multipleChoice">Multiple Choice</Link>
        <Link href="/quiz/play?mode=encyclopedia&type=tossUp">Toss-Up</Link>
        <Link href="/quiz/play?mode=encyclopedia&type=freeResponse">Free Response</Link>
        {weak[0] ? <Link href={`/quiz/play?mode=encyclopedia&weak=1`}>Practice weak encyclopedia topics</Link> : null}
      </section>
      <section className="card stack">
        <h3>Toss-up / topic / mock</h3>
        <Link href="/quiz/play?mode=tossup">Start toss-up drill</Link>
        <Link href="/quiz/play?mode=topic">Start topic quiz</Link>
        <Link href="/quiz/play?mode=mock">Start 25-question mock round</Link>
      </section>
      <section className="card stack">
        <h3>DOE official questions</h3>
        <p className="muted">{doe.length} loaded · starter bank plus any imported Mac cache</p>
        <Link href="/quiz/play?mode=doe">Random DOE drill</Link>
        <Link href="/quiz/play?mode=doe-mock">Full DOE mock</Link>
        <Link href="/settings">Import doe_questions_cache.json from the Mac app</Link>
      </section>
      <section className="card stack">
        <h3>Hewitt Ch 17</h3>
        <Link href="/quiz/play?mode=hewitt">59 NSB pairs · Elements of Chemistry</Link>
      </section>
      <section className="card stack">
        <h3>Texas Regional Sprint</h3>
        {regionalSprint.map((pack) => (
          <Link key={pack.id} href={`/quiz/play?mode=sprint&id=${pack.id}`}>{pack.title} · {pack.tossups.length} toss-ups</Link>
        ))}
        <Link href="/quiz/play?mode=sprint">Mixed regional drill</Link>
      </section>
      <section className="card stack">
        <h3>Buzzer</h3>
        <Link href="/quiz/buzzer">Phone buzzer remote</Link>
        <p className="muted">Open the host page on the computer and the phone page on the same site.</p>
      </section>
      <section className="card stack">
        <h3>Search questions</h3>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
        {hits.map((hit) => <p key={hit.id}>{hit.questionText}</p>)}
      </section>
      <section className="card stack">
        <h3>Weak areas</h3>
        {weak.length === 0 ? <p className="muted">Answer more drills to identify weak topics.</p> : weak.slice(0, 5).map((w) => (
          <Link key={w.topic} href={`/quiz/play?mode=weak&topic=${encodeURIComponent(w.topic)}`}>{w.topic} · {Math.round(w.acc * 100)}%</Link>
        ))}
      </section>
      <section className="card stack">
        <h3>Formula reference</h3>
        {Object.entries(FORMULAS).map(([subject, items]) => (
          <div key={subject}>
            <strong>{subject}</strong>
            {items.map((f) => <p key={f.text}>{f.text} — {f.use}</p>)}
          </div>
        ))}
      </section>
    </div>
  );
}
