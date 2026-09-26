"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BUZZER_SLOTS } from "@/lib/catalogs";
import { QuestionPlay } from "@/components/QuestionPlay";
import { blockTime, subjectLabel, todayBlocks, weekTheme, weekdayFromDate } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import type { StudyBlock } from "@/lib/types";

export default function TodayPage() {
  const store = useStore();
  const day = weekdayFromDate();
  const blocks = todayBlocks(store.currentWeek);
  const [session, setSession] = useState<StudyBlock | null>(null);
  const [stage, setStage] = useState(0);
  const due = store.flashCards.filter((c) => new Date(c.due) <= new Date());
  const stages = ["Recall", "Read", "Know Cold", "Toss-ups"];

  const recallQs = useMemo(() => {
    if (!session) return [];
    return session.sampleTossups.slice(0, 5).map((t, i) => ({
      id: `${session.id}-recall-${i}`,
      source: "curriculum",
      category: session.subject,
      type: "TOSS-UP",
      format: "shortAnswer" as const,
      topic: session.topic,
      questionText: t.question,
      choices: [],
      answer: t.answer,
    }));
  }, [session]);

  if (session) {
    return (
      <div className="stack">
        <button className="btn ghost" type="button" onClick={() => { setSession(null); setStage(0); }}>Back to Today</button>
        <h1>Study session · {subjectLabel(session.subject)}</h1>
        <p className="muted">{stages[stage]} · {session.chapterTitle}</p>
        {store.showSessionTimer ? <p className="timer">1 hour science block · stay on this page</p> : null}
        {stage === 0 ? <QuestionPlay questions={recallQs} title="Recall from this topic" /> : null}
        {stage === 1 ? (
          <div className="card stack">
            <p><strong>{session.bookCode}</strong> {session.chapter} — {session.chapterTitle}</p>
            {session.backupBookLine ? <p className="muted">Backup: {session.backupBookLine}</p> : null}
            <p>{session.focus}</p>
            <p className="muted">{session.formulasAndTerms}</p>
          </div>
        ) : null}
        {stage === 2 ? (
          <div className="card stack">
            {session.knowCold.map((line) => <p key={line}>{line}</p>)}
          </div>
        ) : null}
        {stage === 3 ? (
          <>
            <QuestionPlay
              questions={session.sampleTossups.map((t, i) => ({
                id: `${session.id}-toss-${i}`,
                source: "curriculum",
                category: session.subject,
                type: "TOSS-UP",
                format: "shortAnswer" as const,
                topic: session.topic,
                questionText: t.question,
                choices: [],
                answer: t.answer,
              }))}
              title="Toss-ups"
            />
            <form
              className="card stack"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const text = String(data.get("note") || "").trim();
                if (text) store.addNotebook(text);
                e.currentTarget.reset();
              }}
            >
              <label>Notebook</label>
              <textarea name="note" rows={3} placeholder="Write what you want to remember" />
              <button className="btn" type="submit">Save note</button>
            </form>
          </>
        ) : null}
        <div className="row">
          {stage < 3 ? <button className="btn" type="button" onClick={() => setStage((s) => s + 1)}>Next stage</button> : null}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Today</h1>
      <p className="muted">Week {store.currentWeek} · {weekTheme(store.currentWeek)}</p>
      <p className="muted">Hi, {store.studentName}. One hour science. DOE Life / Physical Science topics only — not whole textbooks.</p>
      {store.studyStreak > 0 ? <p>Study streak: {store.studyStreak} day{store.studyStreak === 1 ? "" : "s"}</p> : null}
      {blocks.length === 0 ? <p className="muted">No science block on the weekend. Use Learn or Quiz.</p> : null}
      <div className="grid two">
        {blocks.map((block) => (
          <div className="card stack" key={block.id}>
            <div className="row">
              <span className={`pill ${block.subject}`}>{subjectLabel(block.subject)}</span>
              <span className="muted">{blockTime(block.day, block.subject)}</span>
            </div>
            <h3>{block.chapterTitle}</h3>
            <p className="muted">{block.bookCode} {block.chapter}</p>
            <p>{block.focus}</p>
            <button className="btn" type="button" onClick={() => { setSession(block); setStage(0); }}>Start session</button>
          </div>
        ))}
      </div>
      <h2>Buzzer slots</h2>
      <div className="stack">
        {BUZZER_SLOTS.filter((s) => !day || s.weekday === day).map((slot) => (
          <div className="card" key={slot.label}>
            <strong>{slot.label}</strong> · {slot.duration} · {slot.subject}
          </div>
        ))}
      </div>
      {due.length > 0 ? (
        <>
          <h2>Flash cards due</h2>
          <Link className="btn" href="/progress">Review {due.length} cards</Link>
        </>
      ) : null}
    </div>
  );
}
