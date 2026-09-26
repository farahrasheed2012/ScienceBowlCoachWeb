"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { BUZZER_SLOTS, topics } from "@/lib/catalogs";
import { QuestionPlay } from "@/components/QuestionPlay";
import { SpeechBar } from "@/components/SpeechBar";
import { buildTodayPlan, featuredBlock, todaysMission } from "@/lib/plan";
import { lookupLine, topicForWeakTitle } from "@/lib/readings";
import { blockTime, isSchoolYear, schoolYearEncyclopediaSubject, schoolYearFocus, seasonLabel, subjectLabel, todayBlocks, weekdayFromDate } from "@/lib/schedule";
import { studyMinutes, topicAccuracy } from "@/lib/stats";
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
  const [sessionWrap, setSessionWrap] = useState(false);
  const sessionStartedAt = useRef(Date.now());
  const due = store.flashCards.filter((c) => new Date(c.due) <= new Date());
  const stages = ["Recall", "Read", "Know Cold", "Toss-ups"] as const;
  const stageMinutes = [6, 8, 5, 6];

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

  if (session && sessionWrap) {
    const answered = store.drillResults.filter((row) => new Date(row.at).getTime() >= sessionStartedAt.current);
    const hits = answered.filter((row) => row.correct).length;
    const minutes = Math.max(1, Math.round((Date.now() - sessionStartedAt.current) / 60000));
    const missed = [...new Set(answered.filter((row) => !row.correct).map((row) => row.topic))];
    return (
      <div className="stack">
        <h1>Session complete</h1>
        <p className="muted">{session.chapterTitle} · {subjectLabel(session.subject)}</p>
        <div className="mission stack">
          <p className="stem">{hits} / {answered.length} correct</p>
          <p>{minutes} min · streak {store.studyStreak} · {store.xp} XP</p>
          {missed[0] ? <p className="muted">Needs review: {missed.join(" · ")}</p> : <p className="muted">No misses logged this hour.</p>}
          {due.length ? <p className="muted">{due.length} flashcards due now.</p> : null}
          <div className="row">
            {missed[0] ? <Link className="btn" href="/learn/review">Review missed topics</Link> : (
              <button className="btn" type="button" onClick={() => { setSession(null); setStage(0); setSessionWrap(false); }}>Continue today&apos;s plan</button>
            )}
            {due.length ? <Link className="btn ghost" href="/learn/flash">Review flashcards</Link> : <Link className="btn ghost" href="/practice">Free practice</Link>}
          </div>
        </div>
      </div>
    );
  }

  if (session) {
    const leftMin = stageMinutes.slice(stage).reduce((sum, n) => sum + n, 0);
    return (
      <div className="stack">
        <button className="btn ghost" type="button" onClick={() => { setSession(null); setStage(0); setSessionWrap(false); }}>Back to Today</button>
        <h1>Study session · {subjectLabel(session.subject)}</h1>
        <p className="muted">{session.chapterTitle}</p>
        <ol className="stage-rail">
          {stages.map((label, i) => (
            <li key={label} className={i === stage ? "current" : i < stage ? "done" : ""}>
              <span className="stage-num">{i + 1}</span>
              <span>{label}</span>
            </li>
          ))}
        </ol>
        <p className="muted">About {leftMin} min left · {stages.length - stage} stage{stages.length - stage === 1 ? "" : "s"} remaining</p>
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
                setSessionWrap(true);
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
  const mission = todaysMission({
    week: store.currentWeek,
    drillResults: store.drillResults,
    dueCount: due.length,
    completedSessionIds: store.completedSessionIds,
    extraDone,
  });
  const weak = topicAccuracy(store.drillResults).find((row) => row.acc < 0.7);
  const weakArticle = weak ? topicForWeakTitle(weak.topic) : undefined;
  const weakBooks = weakArticle ? lookupLine(weakArticle.id) : {};
  const todaySubject = schoolYearEncyclopediaSubject();
  const earthEnergyLeft = topics.filter((topic) => (
    (topic.subject === "Earth & Space Science" || topic.subject === "Energy")
    && !store.reviewedTopicIds.includes(topic.id)
  )).length;

  return (
    <div>
      <h1>Home</h1>
      <p className="muted">{seasonLabel(store.currentWeek)}</p>
      <p className="muted">
        {schoolYear
          ? `Hi, ${store.studentName}. Summer reading is done. Today is keep-sharp, not a new chapter hour.`
          : `Hi, ${store.studentName}. What should you do today?`}
      </p>
      <section className="mission stack">
        <p className="mission-kicker">Today&apos;s mission</p>
        <h2 className="mission-title">{mission.topic}</h2>
        <p className="muted">{mission.subject}</p>
        <p>{mission.reason}</p>
        <p className="muted">{mission.minutes} min · {mission.activities}</p>
        <p className="muted">Goal: {mission.outcome}</p>
        {mission.planId === "weak" && weakBooks.primary ? <p className="muted">{weakBooks.primary}</p> : null}
        {mission.startSession && focus ? (
          <button className="btn mission-cta" type="button" onClick={() => { sessionStartedAt.current = Date.now(); setSession(focus); setStage(0); setSessionWrap(false); }}>
            Start today&apos;s session
          </button>
        ) : (
          <Link className="btn mission-cta" href={mission.href}>Start today&apos;s session</Link>
        )}
      </section>
      {store.studyStreak > 0 ? <p className="muted">Study streak: {store.studyStreak} day{store.studyStreak === 1 ? "" : "s"} · {store.xp} XP</p> : null}
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
            {item.id === "weak" && weakBooks.primary ? <p className="muted">{weakBooks.primary}</p> : null}
            {item.id === "weak" && weakBooks.book ? <p className="muted">{weakBooks.book}</p> : null}
            {item.id === "science" && focus && !schoolYear ? (
              <button className="btn" type="button" onClick={() => { sessionStartedAt.current = Date.now(); setSession(focus); setStage(0); setSessionWrap(false); }}>Start session</button>
            ) : (
              <div className="row">
                <Link className="btn" href={item.href}>{item.done ? "Open again" : "Start"}</Link>
                {item.id === "weak" && weakArticle ? <Link className="btn ghost" href={`/learn/${weakArticle.id}`}>Read the article</Link> : null}
                {item.id === "weak" ? <Link className="btn ghost" href="/learn/review">Review with books</Link> : null}
              </div>
            )}
          </div>
        ))}
      </div>
      {schoolYear && !todaySubject ? (
        <div className="card stack">
          <h3>Weekend coverage · Earth &amp; Energy</h3>
          <p className="muted">
            {earthEnergyLeft
              ? `${earthEnergyLeft} articles not marked reviewed yet. Summer skipped these.`
              : "Earth and Energy articles are marked reviewed."}
          </p>
          <div className="row">
            <Link className="btn" href="/learn/review">Review with books</Link>
            <Link className="btn ghost" href="/topics">All topics</Link>
          </div>
        </div>
      ) : null}
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
            <button className="btn" type="button" onClick={() => { sessionStartedAt.current = Date.now(); setSession(block); setStage(0); setSessionWrap(false); }}>Start session</button>
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
