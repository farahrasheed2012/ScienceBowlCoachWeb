"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export default function ProgressPage() {
  const store = useStore();
  const [cardIndex, setCardIndex] = useState(0);
  const [show, setShow] = useState(false);
  const due = store.flashCards.filter((c) => new Date(c.due) <= new Date());
  const card = due[cardIndex];
  const subjects = ["biology", "chemistry", "physics"];
  function accuracy(subject: string, days: number) {
    const since = Date.now() - days * 86400000;
    const rows = store.drillResults.filter((r) => String(r.subject).toLowerCase().includes(subject) && new Date(r.at).getTime() >= since);
    if (!rows.length) return 0;
    return rows.filter((r) => r.correct).length / rows.length;
  }
  const topicStats = Object.entries(
    store.drillResults.reduce<Record<string, { t: number; c: number }>>((acc, r) => {
      acc[r.topic] = acc[r.topic] ?? { t: 0, c: 0 };
      acc[r.topic].t += 1;
      if (r.correct) acc[r.topic].c += 1;
      return acc;
    }, {}),
  ).map(([topic, v]) => ({ topic, acc: v.c / v.t, n: v.t })).filter((x) => x.n >= 2);

  return (
    <div>
      <h1>Progress</h1>
      <p>Your NSB Journey</p>
      <p>XP {store.xp} · streak {store.studyStreak} · {store.drillResults.length} questions answered</p>
      <h2>This week</h2>
      {subjects.map((s) => (
        <p key={s}>{s}: {Math.round(accuracy(s, 7) * 100)}%</p>
      ))}
      <h2>Lifetime</h2>
      {subjects.map((s) => (
        <p key={s}>{s}: {Math.round(accuracy(s, 3650) * 100)}%</p>
      ))}
      <h2>Weakest / strongest</h2>
      <p className="muted">Weak: {topicStats.sort((a, b) => a.acc - b.acc).slice(0, 5).map((t) => `${t.topic} ${Math.round(t.acc * 100)}%`).join(" · ") || "Keep drilling."}</p>
      <p className="muted">Strong: {topicStats.sort((a, b) => b.acc - a.acc).slice(0, 5).map((t) => `${t.topic} ${Math.round(t.acc * 100)}%`).join(" · ")}</p>
      <h2>Category checklist</h2>
      <div className="stack">
        {store.checklist.map((item) => (
          <label key={item.id} className="row">
            <input type="checkbox" checked={item.completed} onChange={() => store.toggleChecklist(item.id)} />
            <span>{item.description}</span>
          </label>
        ))}
      </div>
      <h2>Flash cards due today</h2>
      {card ? (
        <div className="card stack">
          <p>{show ? card.answer : card.prompt}</p>
          <div className="row">
            <button className="btn ghost" type="button" onClick={() => setShow((s) => !s)}>Reveal</button>
            <button className="btn ok" type="button" onClick={() => { store.reviewFlashCard(card.id, true); setShow(false); setCardIndex(0); }}>Correct</button>
            <button className="btn bad" type="button" onClick={() => { store.reviewFlashCard(card.id, false); setShow(false); }}>Again</button>
          </div>
        </div>
      ) : <p className="muted">None due — great job!</p>}
      <h2>Notebook</h2>
      {store.notebook.map((n) => <p key={n.id}>{n.text}</p>)}
    </div>
  );
}
