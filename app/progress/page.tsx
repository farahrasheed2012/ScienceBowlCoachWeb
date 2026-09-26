"use client";

import Link from "next/link";
import { isSchoolYear } from "@/lib/schedule";
import { accuracyWindow, improvedTopics, studyMinutes, subjectAccuracy, topicAccuracy } from "@/lib/stats";
import { useStore } from "@/lib/store";

const SUBJECTS = ["biology", "chemistry", "physics", "earth", "energy", "math"];

function pct(value: number | null) {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

function when(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ProgressPage() {
  const store = useStore();
  const due = store.flashCards.filter((c) => new Date(c.due) <= new Date());
  const results = store.drillResults;
  const rounds = store.practiceRounds ?? [];
  const topics = topicAccuracy(results);
  const weak = topics.filter((t) => t.acc < 0.7);
  const strong = [...topics].sort((a, b) => b.acc - a.acc).filter((t) => t.acc >= 0.8);
  const correct = results.filter((r) => r.correct).length;
  const overall = results.length ? correct / results.length : 0;
  const last7 = accuracyWindow(results, 7, 0);
  const prior7 = accuracyWindow(results, 14, 7);
  const weekDelta = last7 != null && prior7 != null ? last7 - prior7 : null;
  const lifted = improvedTopics(results);
  const minutes = studyMinutes(rounds) || Math.round((store.studySeconds ?? 0) / 60);

  return (
    <div className="stack">
      <div>
        <h1>Progress</h1>
        <p className="muted">
          {isSchoolYear()
            ? "School year · keep-sharp. Earth and Energy were not on the summer pass — check those off here."
            : "Accuracy, study time, weak topics, and recent sessions."}
        </p>
      </div>
      <div className="grid three">
        <div className="card"><p className="stem">{pct(overall)}</p><p className="muted">Overall accuracy</p></div>
        <div className="card"><p className="stem">{results.length}</p><p className="muted">{correct} correct</p></div>
        <div className="card"><p className="stem">{store.xp}</p><p className="muted">XP · streak {store.studyStreak}</p></div>
        <div className="card"><p className="stem">{minutes}</p><p className="muted">Study minutes</p></div>
        <div className="card">
          <p className="stem">{pct(last7)}</p>
          <p className="muted">Last 7 days{weekDelta == null ? "" : weekDelta >= 0 ? ` · +${Math.round(weekDelta * 100)} vs prior` : ` · ${Math.round(weekDelta * 100)} vs prior`}</p>
        </div>
        <div className="card"><p className="stem">{rounds.length}</p><p className="muted">Saved sessions</p></div>
      </div>
      <h2>Accuracy by subject</h2>
      <div className="stack">
        {SUBJECTS.map((subject) => {
          const acc = subjectAccuracy(results, subject);
          return <p key={subject}>{subject}: {pct(acc)}</p>;
        })}
      </div>
      {weak[0] ? (
        <div className="card stack">
          <h3>Recommended for you</h3>
          <p>{weak[0].topic}</p>
          <p className="muted">Accuracy: {pct(weak[0].acc)} · {weak[0].attempts} tries</p>
          <div className="row">
            <Link className="btn" href={`/practice/play?mode=weak&topic=${encodeURIComponent(weak[0].topic)}`}>Practice this topic today</Link>
            <Link className="btn ghost" href="/learn/review">Review with books</Link>
          </div>
        </div>
      ) : null}
      <h2>Getting better</h2>
      {lifted[0] ? (
        <div className="stack">
          {lifted.slice(0, 5).map((row) => (
            <p key={row.topic}>
              {row.topic} · {pct(row.before)} → {pct(row.after)}
              <span className="muted"> · +{Math.round(row.delta * 100)} points</span>
            </p>
          ))}
        </div>
      ) : (
        <p className="muted">Topics with at least four tries will show improvement here.</p>
      )}
      <h2>Recent sessions</h2>
      {rounds[0] ? (
        <div className="stack">
          {rounds.slice(0, 8).map((round) => (
            <div className="card row" key={round.id}>
              <div>
                <strong>{round.title}</strong>
                <p className="muted">{when(round.at)}</p>
              </div>
              <span className="pill">{round.correct} / {round.asked}</span>
              <span className="muted">{Math.max(1, Math.round(round.seconds / 60))} min</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">Finish a practice round and it will land here.</p>
      )}
      <h2>Weak / strong</h2>
      <p className="muted">Weak: {weak.slice(0, 5).map((t) => `${t.topic} ${pct(t.acc)}`).join(" · ") || "Keep drilling."}</p>
      <p className="muted">Strong: {strong.slice(0, 5).map((t) => `${t.topic} ${pct(t.acc)}`).join(" · ") || "Not yet."}</p>
      <h2>Category checklist</h2>
      {["biology", "chemistry", "physics", "earth", "energy"].map((subject) => {
        const items = store.checklist.filter((item) => item.subject === subject);
        if (!items.length) return null;
        const done = items.filter((item) => item.completed).length;
        return (
          <section className="stack" key={subject}>
            <h3>{subject} · {done} / {items.length}</h3>
            {items.map((item) => (
              <label key={item.id} className="row">
                <input type="checkbox" checked={item.completed} onChange={() => store.toggleChecklist(item.id)} />
                <span>{item.description}</span>
              </label>
            ))}
          </section>
        );
      })}
      <h2>Flash cards due today</h2>
      {due.length ? (
        <Link className="btn" href="/learn/flash">Review {due.length} cards</Link>
      ) : (
        <p className="muted">None due — great job!</p>
      )}
      <Link className="btn ghost" href="/learn/formulas">Formulas & know-cold</Link>
      <h2>Notebook</h2>
      {store.notebook.map((n) => <p key={n.id}>{n.text}</p>)}
    </div>
  );
}
