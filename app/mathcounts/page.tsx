"use client";

import { useMemo, useState } from "react";
import { dailyMathCounts, MATHCOUNTS_TOPICS } from "@/lib/mathcounts";
import { answersMatch } from "@/lib/questions";
import { useStore } from "@/lib/store";

export default function MathCountsPage() {
  const store = useStore();
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [correct, setCorrect] = useState(0);
  const questions = useMemo(() => dailyMathCounts(store.mathCountsLevel), [store.mathCountsLevel]);
  const q = questions[index];

  if (started && q) {
    return (
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const ok = answersMatch(q.answer, typed);
          if (ok) setCorrect((n) => n + 1);
          setTyped("");
          if (index + 1 >= questions.length) {
            const acc = (correct + (ok ? 1 : 0)) / questions.length;
            store.set({
              mathCountsSessions: store.mathCountsSessions + 1,
              mathCountsStreak: store.mathCountsStreak + 1,
              mathCountsLevel: acc >= 0.85 ? Math.min(5, store.mathCountsLevel + 1) : acc < 0.5 ? Math.max(1, store.mathCountsLevel - 1) : store.mathCountsLevel,
            });
            setStarted(false);
            setIndex(0);
            setCorrect(0);
          } else {
            setIndex((i) => i + 1);
          }
        }}
      >
        <h1>Daily practice</h1>
        <p className="muted">{index + 1} / {questions.length} · {q.topic}</p>
        <div className="card stack">
          <p>{q.prompt}</p>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} />
          <button className="btn" type="submit">Submit</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <h1>MathCounts</h1>
      <p>Hi, {store.studentName}!</p>
      <p className="muted">Number sense, arithmetic fluency, fractions, percents, ratios, pre-algebra, geometry. Mental math first. Guide thinking, do not just dump answers.</p>
      <p>Level {store.mathCountsLevel} · {store.mathCountsStreak} day streak · {store.mathCountsSessions} sessions</p>
      <button className="btn" type="button" onClick={() => setStarted(true)}>Start daily practice</button>
      <p className="muted">5 warmup · 3 number sense · 3 challenge · 1 stretch</p>
      <h2>Topics</h2>
      <div className="grid two">
        {MATHCOUNTS_TOPICS.map((topic) => <div className="card" key={topic}>{topic}</div>)}
      </div>
    </div>
  );
}
