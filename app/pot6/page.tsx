"use client";

import { useState } from "react";
import { encyclopediaQuestions, pot6Catchup, pot6Topics } from "@/lib/catalogs";
import { QuestionPlay } from "@/components/QuestionPlay";
import { encyclopediaToPlay } from "@/lib/questions";
import { useStore } from "@/lib/store";

export default function POT6Page() {
  const store = useStore();
  const algebra = pot6Topics.filter((t) => !t.isCompetitionOnly);
  const [open, setOpen] = useState<string | null>(null);
  const topic = algebra.find((t) => t.code === open);
  const practice = encyclopediaQuestions.filter((q) => q.subject === "Math").map(encyclopediaToPlay);
  const days = [...new Set(pot6Catchup.map((i) => i.catchUpDay))].sort((a, b) => a - b);

  return (
    <div>
      <h1>POT 6</h1>
      <p className="muted">Sat 10:30–11:45 (BASIC) or Sun 2:30–3:45 (full POT 6). Jan 7 – Jun 28 catch-up, then summer algebra.</p>
      <p>{store.pot6CatchUpCompleted.length} / {pot6Catchup.length} catch-up codes checked</p>
      <h2>Catch-up</h2>
      {days.map((day) => (
        <section key={day} className="card stack">
          <h3>Day {day}</h3>
          {pot6Catchup.filter((i) => i.catchUpDay === day).map((item) => (
            <label key={item.potCode} className="row">
              <input
                type="checkbox"
                checked={store.pot6CatchUpCompleted.includes(item.potCode)}
                onChange={() => {
                  const next = store.pot6CatchUpCompleted.includes(item.potCode)
                    ? store.pot6CatchUpCompleted.filter((c) => c !== item.potCode)
                    : [...store.pot6CatchUpCompleted, item.potCode];
                  store.set({ pot6CatchUpCompleted: next });
                }}
              />
              <span>{item.potCode} · {item.title} · BFN-A {item.bfnChapters.join(", ")}</span>
            </label>
          ))}
        </section>
      ))}
      <h2>School algebra topics</h2>
      <div className="stack">
        {algebra.map((item) => (
          <button className="card" key={item.code} type="button" onClick={() => setOpen(item.code)} style={{ textAlign: "left" }}>
            <strong>{item.code}</strong> {item.title}
            <div className="muted">{item.category}</div>
          </button>
        ))}
      </div>
      {topic ? (
        <section className="card stack">
          <h2>{topic.code} · {topic.title}</h2>
          <p>{topic.conceptSummary}</p>
          {topic.keyFormulas.map((f) => <p key={f} className="muted">{f}</p>)}
        </section>
      ) : null}
      <h2>Math encyclopedia drills</h2>
      <QuestionPlay questions={practice} title="Math practice" />
    </div>
  );
}
