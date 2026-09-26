"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BUZZER_SLOTS } from "@/lib/catalogs";
import { QuestionPlay } from "@/components/QuestionPlay";
import { SpeechBar } from "@/components/SpeechBar";
import { buildTodayPlan, featuredBlock } from "@/lib/plan";
import { blockTime, isSchoolYear, schoolYearFocus, seasonLabel, subjectLabel, todayBlocks, weekdayFromDate } from "@/lib/schedule";
import { studyMinutes } from "@/lib/stats";
import { useStore } from "@/lib/store";
import type { StudyBlock } from "@/lib/types";

export default function TodayPage() {
  const store = useStore();
  const day = weekdayFromDate();
  const schoolYear = isSchoolYear();
  const blocks = schoolYear ? [] : todayBlocks(store.currentWeek);
  const todayFocus = schoolYearFocus();
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
        {stage === 0 ? <QuestionPlay questions={recallQs} title="Recall from this topic" timed={false} /> : null}
        {stage === 1 ? (
          <div className="card stack">
            <p><strong>{session.bookCode}</strong> {session.chapter} — {session.chapterTitle}</p>
            {session.backupBookLine ? <p className="muted">Backup: {session.backupBookLine}</p> : null}
            <p>{session.focus}</p>
            <p className="muted">{session.formulasAndTerms}</p>
            <SpeechBar text={`${session.chapterTitle}. ${session.focus}. ${session.formulasAndTerms}`} />
          </div>
        ) : null}
        {stage === 2 ? (
          <div className="card stack">
            {session.knowCold.map((line) => <p key={line}>{line}</p>)}
            <SpeechBar text={session.knowCold.join(". ")} />
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
          {stage < 3 ? <button className="btn" type="button" onClick={() => setStage((s) => s + 1)}>Next stage</button> : (
            <button
              className="btn"
              type="button"
              onClick={() => {
                store.completeSession(session.id);
                setSession(null);
                setStage(0);
              }}
            >
              Finish session
            </button>
          )}
        </div>
      </div>
    );
  }

  const focus = featuredBlock(store.currentWeek);
  const extraDone = store.planExtraDate === new Date().toDateString() ? store.planExtraDone : [];
  const plan = buildTodayPlan({
    week: store.currentWeek,
    drillResults: store.drillResults,
    dueCount: due.length,
    completedSessionIds: store.completedSessionIds,
    extraDone,
  });
  const finished = plan.filter((item) => item.done).length;

  return (
    <div>
      <h1>Home</h1>
      <p className="muted">{seasonLabel(store.currentWeek)}</p>
      <p className="muted">
        {schoolYear
          ? `Hi, ${store.studentName}. Summer reading is done. Today is keep-sharp, not a new chapter hour.`
          : `Hi, ${store.studentName}. What should you do today?`}
      </p>
      {store.studyStreak > 0 ? <p>Study streak: {store.studyStreak} day{store.studyStreak === 1 ? "" : "s"} · {store.xp} XP</p> : null}
      {store.practiceRounds?.[0] ? (
        <p className="muted">
          Last session: {store.practiceRounds[0].title} · {store.practiceRounds[0].correct}/{store.practiceRounds[0].asked}
          {" · "}
          {studyMinutes(store.practiceRounds)} min studied
        </p>
      ) : null}
      <h2>Today&apos;s plan · {finished} / {plan.length} done</h2>
      <div className="grid two">
        {plan.map((item) => (
          <div className="card stack" key={item.id} id={item.id === "science" && focus ? `session-${focus.id}` : undefined}>
            <div className="row">
              <input type="checkbox" checked={item.done} onChange={() => store.togglePlanItem(item.id)} />
              <p className="muted">{item.minutes} min</p>
            </div>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
            {item.id === "science" && focus && !schoolYear ? (
              <button className="btn" type="button" onClick={() => { setSession(focus); setStage(0); }}>Start session</button>
            ) : (
              <Link className="btn" href={item.href}>{item.done ? "Open again" : "Start"}</Link>
            )}
          </div>
        ))}
      </div>
      {schoolYear ? (
        <p className="muted">The 12-week summer blocks are finished. Reopen one from Weeks if you want a chapter hour. Thursday and Friday fill Earth &amp; Energy, which the summer pass skipped.</p>
      ) : blocks.length === 0 ? (
        <p className="muted">Weekend: the science slot reviews this week&apos;s last assigned block instead of a new weekday hour.</p>
      ) : null}
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
        {schoolYear ? (
          <div className="card stack">
            <p><strong>Today&apos;s subject · {todayFocus.label}</strong> · 15 min</p>
            <p className="muted">School-year slot — not the summer free-period clock.</p>
            <div className="row">
              <Link className="btn" href={todayFocus.href}>Practice {todayFocus.label}</Link>
              <Link className="btn ghost" href="/quiz/buzzer">Phone buzzer</Link>
            </div>
          </div>
        ) : day ? BUZZER_SLOTS.filter((s) => s.weekday === day).map((slot) => (
          <div className="card stack" key={slot.label}>
            <p><strong>{slot.label}</strong> · {slot.duration} · {slot.subject}</p>
            <div className="row">
              <Link className="btn" href={`/practice/play?mode=subject&subject=${slot.subject}`}>Practice {slot.subject}</Link>
              <Link className="btn ghost" href="/quiz/buzzer">Phone buzzer</Link>
            </div>
          </div>
        )) : (
          <div className="card stack">
            <p><strong>Weekend toss-up</strong> · 15 min · mixed</p>
            <p className="muted">Weekday buzzer slots return Monday. Use a mixed toss-up or the phone remote.</p>
            <div className="row">
              <Link className="btn" href="/practice/play?mode=tossup">Start toss-up</Link>
              <Link className="btn ghost" href="/quiz/buzzer">Phone buzzer</Link>
            </div>
          </div>
        )}
      </div>
      {due.length > 0 && !plan.some((item) => item.id === "flash") ? (
        <>
          <h2>Flash cards due</h2>
          <Link className="btn" href="/learn/flash">Review {due.length} cards</Link>
        </>
      ) : null}
    </div>
  );
}
