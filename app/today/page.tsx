"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BUZZER_SLOTS, topics } from "@/lib/catalogs";
import { QuestionPlay } from "@/components/QuestionPlay";
import { SpeechBar } from "@/components/SpeechBar";
import { buildTodayPlan, featuredBlock, todaysMission } from "@/lib/plan";
import { lookupLine, topicForWeakTitle } from "@/lib/readings";
import { blockTime, isSchoolYear, schoolYearEncyclopediaSubject, schoolYearFocus, seasonLabel, subjectLabel, todayBlocks, weekdayFromDate } from "@/lib/schedule";
import { keepSharpSession, sessionFromBlock, type PlaySession } from "@/lib/session";
import { studyMinutes, topicAccuracy } from "@/lib/stats";
import { useStore } from "@/lib/store";

export default function TodayPage() {
  const store = useStore();
  const day = weekdayFromDate();
  const schoolYear = isSchoolYear();
  const blocks = schoolYear ? [] : todayBlocks(store.currentWeek);
  const todayFocus = schoolYearFocus();
  const [session, setSession] = useState<PlaySession | null>(null);
  const [stage, setStage] = useState(0);
  const [sessionWrap, setSessionWrap] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const sessionStartedAt = useRef(Date.now());
  const due = store.flashCards.filter((c) => new Date(c.due) <= new Date());
  const stages = ["Recall", "Read", "Know Cold", "Toss-ups"] as const;
  const stageMinutes = [6, 8, 5, 6];
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
  const todaySubject = schoolYearEncyclopediaSubject();
  const weakArticle = weak
    ? topicForWeakTitle(weak.topic)
    : todaySubject
      ? topics.find((topic) => topic.subject === todaySubject && !store.reviewedTopicIds.includes(topic.id))
        ?? topics.find((topic) => topic.subject === todaySubject)
      : undefined;
  const weakBooks = weakArticle ? lookupLine(weakArticle.id) : {};
  const earthEnergyLeft = topics.filter((topic) => (
    (topic.subject === "Earth & Space Science" || topic.subject === "Energy")
    && !store.reviewedTopicIds.includes(topic.id)
  )).length;
  const focus = featuredBlock(store.currentWeek);

  function begin(next: PlaySession) {
    sessionStartedAt.current = Date.now();
    setSession(next);
    setStage(0);
    setSessionWrap(false);
  }

  function beginMission() {
    if (schoolYear) {
      begin(keepSharpSession({
        label: weak?.topic || mission.topic,
        article: weakArticle,
        importedDoe: store.importedDoe,
      }));
      return;
    }
    if (focus) begin(sessionFromBlock(focus));
  }

  if (session && sessionWrap) {
    const answered = store.drillResults.filter((row) => new Date(row.at).getTime() >= sessionStartedAt.current);
    const hits = answered.filter((row) => row.correct).length;
    const minutes = Math.max(1, Math.round((Date.now() - sessionStartedAt.current) / 60000));
    const missed = [...new Set(answered.filter((row) => !row.correct).map((row) => row.topic))];
    return (
      <div className="stack">
        <h1>Session complete</h1>
        <p className="muted">{session.title} · {subjectLabel(session.subject)}</p>
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
        <p className="muted">{session.title}</p>
        <ol className="stage-rail">
          {stages.map((label, i) => (
            <li key={label} className={i === stage ? "current" : i < stage ? "done" : ""}>
              <span className="stage-num">{i + 1}</span>
              <span>{label}</span>
            </li>
          ))}
        </ol>
        <p className="muted">About {leftMin} min left · {stages.length - stage} stage{stages.length - stage === 1 ? "" : "s"} remaining</p>
        {store.showSessionTimer ? (
          <p className="timer">{session.kind === "summer" ? "1 hour science block · stay on this page" : "Keep-sharp session · stay on this page"}</p>
        ) : null}
        {stage === 0 ? <QuestionPlay questions={session.recall} title="Recall from this topic" timed={false} /> : null}
        {stage === 1 ? (
          <div className="card stack">
            {session.read.primary ? <p><strong>{session.read.primary}</strong></p> : null}
            {session.read.book ? <p className="muted">{session.read.book}</p> : null}
            <p>{session.read.body}</p>
            {session.read.extra ? <p className="muted">{session.read.extra}</p> : null}
            <SpeechBar text={`${session.title}. ${session.read.body}. ${session.read.extra ?? ""}`} />
            {session.kind === "keep-sharp" && weakArticle ? <Link href={`/learn/${weakArticle.id}`}>Open the full article</Link> : null}
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
            <QuestionPlay questions={session.tossups} title="Toss-ups" />
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

  return (
    <div>
      <h1>Home</h1>
      <p className="muted">{seasonLabel(store.currentWeek)}</p>
      <p>
        {schoolYear
          ? `Hi, ${store.studentName}. One keep-sharp session. Not a new chapter.`
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
        {mission.startSession ? (
          <button className="btn mission-cta" type="button" onClick={beginMission}>Start today&apos;s session</button>
        ) : (
          <Link className="btn mission-cta" href={mission.href}>Start today&apos;s session</Link>
        )}
      </section>
      <p className="muted">
        {store.studyStreak > 0 ? `Streak ${store.studyStreak} · ${store.xp} XP` : `${store.xp} XP`}
        {store.practiceRounds?.[0] ? ` · last ${store.practiceRounds[0].correct}/${store.practiceRounds[0].asked}` : ""}
        {studyMinutes(store.practiceRounds ?? []) ? ` · ${studyMinutes(store.practiceRounds ?? [])} min studied` : ""}
      </p>
      <button className="btn ghost" type="button" onClick={() => setShowPlan((value) => !value)}>
        {showPlan ? "Hide the rest of today" : `Rest of today · ${finished} / ${plan.length} done`}
      </button>
      {showPlan ? (
        <div className="stack">
          {plan.map((item) => (
            <div className="card stack" key={item.id} id={item.id === "science" && focus ? `session-${focus.id}` : undefined}>
              <div className="row">
                <input type="checkbox" checked={item.done} onChange={() => store.togglePlanItem(item.id)} />
                <p className="muted">{item.minutes} min</p>
              </div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
              {item.id === "weak" && weakBooks.primary ? <p className="muted">{weakBooks.primary}</p> : null}
              {item.id === "science" && focus && !schoolYear ? (
                <button className="btn" type="button" onClick={() => begin(sessionFromBlock(focus))}>Start session</button>
              ) : (
                <div className="row">
                  <Link className="btn" href={item.href}>{item.done ? "Open again" : "Start"}</Link>
                  {item.id === "weak" && weakArticle ? <Link className="btn ghost" href={`/learn/${weakArticle.id}`}>Read the article</Link> : null}
                </div>
              )}
            </div>
          ))}
          {schoolYear ? (
            <p className="muted">
              {earthEnergyLeft ? `${earthEnergyLeft} Earth/Energy articles not reviewed. ` : ""}
              <Link href="/learn/review">Review with books</Link>
              {" · "}
              <Link href={todayFocus.href}>Practice {todayFocus.label}</Link>
              {" · "}
              <Link href="/quiz/buzzer">Phone buzzer</Link>
              {" · "}
              <Link href="/weeks">Weeks archive</Link>
            </p>
          ) : (
            <div className="stack">
              {day ? BUZZER_SLOTS.filter((slot) => slot.weekday === day).map((slot) => (
                <p key={slot.label} className="muted">
                  {slot.label} · {slot.duration} · {slot.subject}
                  {" · "}
                  <Link href={`/practice/play?mode=subject&subject=${slot.subject}`}>Practice</Link>
                </p>
              )) : (
                <p className="muted">Weekend toss-up · <Link href="/practice/play?mode=tossup">Start</Link> · <Link href="/quiz/buzzer">Phone buzzer</Link></p>
              )}
            </div>
          )}
        </div>
      ) : null}
      {!schoolYear && !showPlan && blocks.length === 0 ? (
        <p className="muted">Weekend: the science slot reviews this week&apos;s last assigned block instead of a new weekday hour.</p>
      ) : null}
      {!schoolYear ? (
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
              <button className="btn" type="button" onClick={() => begin(sessionFromBlock(block))}>Start session</button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
