"use client";

import Link from "next/link";
import { CoachInsight } from "@/components/CoachInsight";
import { coachRead } from "@/lib/coach";
import { pickPriorityTopic } from "@/lib/plan";
import { pct, studentReadiness } from "@/lib/readiness";
import { isSchoolYear } from "@/lib/schedule";
import { articleForLabel } from "@/lib/topic-map";
import { studyMinutes } from "@/lib/stats";
import { useStore } from "@/lib/store";

function when(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ProgressPage() {
  const store = useStore();
  const due = store.flashCards.filter((card) => new Date(card.due) <= new Date());
  const results = store.drillResults;
  const rounds = store.practiceRounds ?? [];
  const ready = studentReadiness(results);
  const minutes = studyMinutes(rounds) || Math.round((store.studySeconds ?? 0) / 60);
  const priority = pickPriorityTopic(results);
  const weakArticle = priority ? articleForLabel(priority.topic) : undefined;
  const insight = coachRead({
    results,
    rounds,
    missionTopic: priority?.topic,
  });

  return (
    <div className="learn-page">
      <div>
        <p className="mission-kicker">Science Bowl readiness</p>
        <h1 className="session-title">{pct(ready.overall)}</h1>
        <p className="muted">{ready.sentence}</p>
        <p className="faint">
          {store.studyStreak > 0 ? `${store.studyStreak} day streak` : "Start a streak"}
          {minutes ? ` · ${minutes} min studied` : ""}
          {store.xp ? ` · ${store.xp} XP` : ""}
        </p>
      </div>
      <CoachInsight kicker={insight.kicker} body={insight.body} />
      <section className="stack">
        {ready.subjects.map((row) => (
          <p key={row.id}>
            {row.label}
            <span className="faint">
              {" · "}
              {pct(row.readiness)}
              {row.knowledge != null ? ` · know ${Math.round(row.knowledge * 100)}%` : ""}
              {row.speed != null ? ` · speed ${Math.round(row.speed * 100)}%` : row.attempts ? " · no timed toss-ups yet" : ""}
            </span>
          </p>
        ))}
      </section>
      {ready.buzz ? (
        <p className="muted">
          Buzz profile · early {Math.round(ready.buzz.early * 100)}% · middle {Math.round(ready.buzz.middle * 100)}% · late {Math.round(ready.buzz.late * 100)}%
        </p>
      ) : (
        <p className="faint">Buzz timing shows after a few official-clock toss-ups.</p>
      )}
      <p className="muted">
        Toss-ups {pct(ready.tossup)}
        {ready.bonus != null ? ` · bonuses ${pct(ready.bonus)}` : ""}
      </p>
      {ready.prescription.steps.length ? (
        <p className="muted">{ready.prescription.diagnosis} {ready.prescription.steps.join(" → ")}</p>
      ) : null}
      {priority ? (
        <div className="row">
          <Link className="btn" href={`/practice/play?mode=weak&topic=${encodeURIComponent(priority.topic)}`}>Practice {priority.topic}</Link>
          {weakArticle ? <Link className="text-btn" href={`/learn/${weakArticle.id}`}>Read the article</Link> : null}
        </div>
      ) : null}
      {isSchoolYear() ? (
        <p className="faint">School year · keep-sharp. Earth and Energy were not on the summer pass.</p>
      ) : null}
      <h2>Recent sessions</h2>
      {rounds[0] ? (
        <div className="stack">
          {rounds.slice(0, 6).map((round) => (
            <p key={round.id}>
              {round.title}
              <span className="faint"> · {round.correct}/{round.asked} · {when(round.at)}</span>
            </p>
          ))}
        </div>
      ) : (
        <p className="muted">Finish a practice round and it will land here.</p>
      )}
      {due.length ? <Link className="text-btn" href="/learn/flash">{due.length} flashcards due</Link> : null}
    </div>
  );
}
