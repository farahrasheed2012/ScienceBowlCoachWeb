"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BUZZER_SLOTS, topics } from "@/lib/catalogs";
import { CoachInsight } from "@/components/CoachInsight";
import { QuestionPlay } from "@/components/QuestionPlay";
import { SpeechBar } from "@/components/SpeechBar";
import { coachRead } from "@/lib/coach";
import { buildTodayPlan, featuredBlock, pickPriorityTopic, todaysMission } from "@/lib/plan";
import { lookupLine, topicForWeakTitle } from "@/lib/readings";
import { dayLine, isSchoolYear, schoolYearEncyclopediaSubject, schoolYearFocus, subjectLabel, timeGreeting, todayBlocks, weekdayFromDate } from "@/lib/schedule";
import { keepSharpSession, sessionFromBlock, type PlaySession } from "@/lib/session";
import { performanceFor, studyMinutes, todayGoal, whyToday } from "@/lib/stats";
import { useStore } from "@/lib/store";

const MISSION_STAGES = [
  { label: "Recall", minutes: 5 },
  { label: "Learn", minutes: 8 },
  { label: "Know Cold", minutes: 5 },
  { label: "Toss-ups", minutes: 10 },
] as const;

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
  const weak = pickPriorityTopic(store.drillResults);
  const todaySubject = schoolYearEncyclopediaSubject();
  const weakArticle = weak
    ? topicForWeakTitle(weak.topic)
    : todaySubject
      ? topics.find((topic) => topic.subject === todaySubject && !store.reviewedTopicIds.includes(topic.id))
        ?? topics.find((topic) => topic.subject === todaySubject)
      : topics.find((topic) => (
        (topic.subject === "Earth & Space Science" || topic.subject === "Energy")
        && !store.reviewedTopicIds.includes(topic.id)
      )) ?? topics.find((topic) => topic.id === "ls-photosynthesis");
  const weakBooks = weakArticle ? lookupLine(weakArticle.id) : {};
  const earthEnergyLeft = topics.filter((topic) => (
    (topic.subject === "Earth & Space Science" || topic.subject === "Energy")
    && !store.reviewedTopicIds.includes(topic.id)
  )).length;
  const focus = featuredBlock(store.currentWeek);
  const missionLabel = weakArticle?.title ?? mission.topic;
  const missionTopic = weak?.topic || weakArticle?.title || mission.topic;
  const history = performanceFor(store.drillResults, missionTopic);
  const whyBullets = mission.planId === "flash"
    ? [
        due.length ? `${due.length} cards due now` : "The pile is clear",
        "Missed toss-ups become one card, due now",
      ]
    : whyToday(history);
  const whyLead = mission.planId === "flash"
    ? whyBullets[0]
    : history.missedLast3 >= 2
      ? `You missed ${history.missedLast3} of your last 3 questions on this topic.`
      : whyBullets[0];
  const recent = store.drillResults.slice(-20);
  const recentAvg = recent.length
    ? Math.round((recent.filter((row) => row.correct).length / recent.length) * 100)
    : null;
  const insight = coachRead({
    results: store.drillResults,
    rounds: store.practiceRounds,
    missionTopic,
  });

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

  function leaveSession() {
    setSession(null);
    setStage(0);
    setSessionWrap(false);
  }

  if (session && sessionWrap) {
    const answered = store.drillResults.filter((row) => new Date(row.at).getTime() >= sessionStartedAt.current);
    const hits = answered.filter((row) => row.correct).length;
    const minutes = Math.max(1, Math.round((Date.now() - sessionStartedAt.current) / 60000));
    const missed = [...new Set(answered.filter((row) => !row.correct).map((row) => row.topic))];
    const read = coachRead({
      results: store.drillResults,
      rounds: store.practiceRounds,
      missionTopic: session.topic,
      sessionMissed: missed,
      sessionHits: hits,
      sessionAsked: answered.length,
    });
    return (
      <div className="stack mission-page view-in">
        <p className="mission-kicker">Session complete</p>
        <h1 className="mission-title">{session.title}</h1>
        <section className="mission stack">
          <p className="stem">{hits} / {answered.length}</p>
          <p>{answered.length ? `${Math.round((hits / answered.length) * 100)}%` : "No answers logged"}</p>
          <CoachInsight kicker={read.kicker} body={read.body} />
          {missed[0] ? (
            <div>
              <p className="mission-kicker">Keep</p>
              <p>Review {missed.length} missed {missed.length === 1 ? "topic" : "topics"}</p>
              <p className="muted">{missed.join(" · ")}</p>
            </div>
          ) : <p className="muted">No misses logged this session.</p>}
          <div>
            <p className="mission-kicker">Next recommended step</p>
            <p>{missed[0] ? "Try 2 similar questions" : "A short toss-up keeps this cold"}</p>
          </div>
          <p className="muted">{minutes} min · streak {store.studyStreak}</p>
          {due.length ? <p className="muted">{due.length} flashcards due now.</p> : null}
          <div className="row">
            {missed[0] ? <Link className="btn mission-cta" href="/learn/review">Review now</Link> : (
              <button className="btn mission-cta" type="button" onClick={leaveSession}>Back to today</button>
            )}
            {due.length ? <Link className="btn ghost" href="/learn/flash">Review flashcards</Link> : <Link className="btn ghost" href="/practice">Free practice</Link>}
          </div>
        </section>
      </div>
    );
  }

  if (session) {
    const current = MISSION_STAGES[stage];
    const leftMin = MISSION_STAGES.slice(stage).reduce((sum, item) => sum + item.minutes, 0);
    return (
      <div className="stack mission-page session-page view-in">
        <div className="session-chrome">
          <button className="text-btn session-leave" type="button" onClick={leaveSession}>Leave</button>
          <h1 className="session-title">{session.title}</h1>
          <div className="stage-nav">
            <ol className="stage-rail">
              {MISSION_STAGES.map((item, i) => (
                <li key={item.label} className={i === stage ? "current" : i < stage ? "done" : "upcoming"}>
                  <button type="button" onClick={() => setStage(i)} aria-label={item.label} aria-current={i === stage ? "step" : undefined}>
                    <span className="stage-mark" />
                  </button>
                </li>
              ))}
            </ol>
            <div className="stage-track" aria-hidden="true">
              <div className="stage-fill" style={{ width: `${(stage / (MISSION_STAGES.length - 1)) * 100}%` }} />
            </div>
          </div>
          <p className="stage-now">{current.label}{store.showSessionTimer ? ` · ${leftMin} min left` : ""}</p>
        </div>
        <div key={stage} className="stage-pane">
          {stage === 0 ? <QuestionPlay questions={session.recall} title="Recall from this topic" timed={false} /> : null}
          {stage === 1 ? (
            <div className="read-card stack">
              {session.read.primary ? <p><strong>{session.read.primary}</strong></p> : null}
              {session.read.book ? <p className="muted">{session.read.book}</p> : null}
              <p>{session.read.body}</p>
              {session.read.extra ? <p className="muted">{session.read.extra}</p> : null}
              <SpeechBar text={`${session.title}. ${session.read.body}. ${session.read.extra ?? ""}`} />
              {session.kind === "keep-sharp" && weakArticle ? <Link href={`/learn/${weakArticle.id}`}>Open the full article</Link> : null}
            </div>
          ) : null}
          {stage === 2 ? (
            <div className="know-card stack">
              {session.knowCold.map((line) => <p key={line}>{line}</p>)}
              <SpeechBar text={session.knowCold.join(". ")} />
            </div>
          ) : null}
          {stage === 3 ? (
            <>
              <QuestionPlay questions={session.tossups} title="Toss-ups" />
              <details className="notebook">
                <summary>Notebook</summary>
                <form
                  className="stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    const text = String(data.get("note") || "").trim();
                    if (text) store.addNotebook(text);
                    e.currentTarget.reset();
                  }}
                >
                  <textarea name="note" rows={3} placeholder="Write what you want to remember" />
                  <button className="btn ghost" type="submit">Save note</button>
                </form>
              </details>
            </>
          ) : null}
        </div>
        <div className="row">
          {stage < 3 ? (
            <button className="btn mission-cta" type="button" onClick={() => setStage((s) => s + 1)}>
              Continue
            </button>
          ) : (
            <button
              className="btn mission-cta"
              type="button"
              onClick={() => {
                store.completeSession(session.id);
                setSessionWrap(true);
              }}
            >
              Finish mission
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mission-page view-in">
      <p className="mission-hello">{timeGreeting(store.studentName)}</p>
      <p className="faint">{dayLine()}</p>
      <section className="mission stack">
        <h1 className="mission-title">{mission.planId === "flash" ? mission.topic : missionLabel}</h1>
        <p className="mission-why">{whyLead}</p>
        <p className="mission-goal">{mission.planId === "flash" ? mission.outcome : todayGoal(history)}</p>
        <p className="mission-time">{mission.minutes} min</p>
        {mission.startSession ? (
          <button className="btn mission-cta" type="button" onClick={beginMission}>Start mission</button>
        ) : (
          <Link className="btn mission-cta" href={mission.href}>Start mission</Link>
        )}
      </section>
      <div className="mission-progress">
        <p className="muted">
          {store.studyStreak > 0 ? `${store.studyStreak} day streak` : "Start a streak today"}
          {recentAvg != null ? ` · ${recentAvg}% avg` : store.xp ? ` · ${store.xp} XP` : ""}
          {store.practiceRounds?.[0] ? ` · last ${store.practiceRounds[0].correct}/${store.practiceRounds[0].asked}` : ""}
          {studyMinutes(store.practiceRounds ?? []) ? ` · ${studyMinutes(store.practiceRounds ?? [])} min studied` : ""}
        </p>
        <CoachInsight kicker={insight.kicker} body={insight.body} />
      </div>
      <nav className="secondary-links">
        <Link href="/learn/flash">{due.length ? `${due.length} flashcards due` : "Flashcards"}</Link>
        <Link href="/practice/play?mode=sprint">Regional Sprint</Link>
        <Link href="/practice">Free Practice</Link>
        <Link href="/progress">Progress</Link>
      </nav>
      <button className="text-btn" type="button" onClick={() => setShowPlan((value) => !value)}>
        {showPlan ? "Hide the rest of today" : `More of today · ${finished} / ${plan.length} done`}
      </button>
      {showPlan ? (
        <div className="stack rest-today">
          {plan.map((item) => (
            <div className="rest-item stack" key={item.id} id={item.id === "science" && focus ? `session-${focus.id}` : undefined}>
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
              {blocks.map((block) => (
                <div className="rest-item stack" key={block.id}>
                  <p className="muted">{subjectLabel(block.subject)} · {block.bookCode} {block.chapter}</p>
                  <h3>{block.chapterTitle}</h3>
                  <p>{block.focus}</p>
                  <button className="btn" type="button" onClick={() => begin(sessionFromBlock(block))}>Start session</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
