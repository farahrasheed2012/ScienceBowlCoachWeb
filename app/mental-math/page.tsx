"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { mentalProblems, type MentalOp } from "@/lib/mental-math";
import { useStore } from "@/lib/store";

const OPS: MentalOp[] = ["addition", "subtraction", "multiplication", "division", "squares", "mixed"];

export default function MentalMathPage() {
  const store = useStore();
  const [op, setOp] = useState<MentalOp>("mixed");
  const [level, setLevel] = useState(2);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [started, setStarted] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());
  const problems = useMemo(() => mentalProblems(op, level), [op, level, started]);
  const current = problems[index];

  function finish(hits: number) {
    const seconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    store.recordRound({ title: `Mental Math · ${op}`, asked: problems.length, correct: hits, seconds });
    store.set({ xp: store.xp + hits * 2 });
    setCorrect(hits);
    setStarted(false);
    setDone(true);
  }

  return (
    <div className="stack">
      <Link href="/learn">Back to Learn</Link>
      <div>
        <h1>Mental Math</h1>
        <p className="muted">20 problems. Same engine as the Mac app: addition, subtraction, multiplication, division, squares, mixed.</p>
      </div>
      {done && !started ? (
        <div className="card stack">
          <p className="stem">{correct} / {problems.length}</p>
          <p className="muted">Saved to Progress · +{correct * 2} XP</p>
          <div className="row">
            <button className="btn" type="button" onClick={() => { setDone(false); setCorrect(0); }}>Practice again</button>
            <Link className="btn ghost" href="/progress">See progress</Link>
          </div>
        </div>
      ) : null}
      {!started && !done ? (
        <div className="card stack">
          <label>Operation</label>
          <select value={op} onChange={(e) => setOp(e.target.value as MentalOp)}>
            {OPS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <label>Level {level}</label>
          <input type="range" min={1} max={6} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
          <button
            className="btn"
            type="button"
            onClick={() => {
              startedAt.current = Date.now();
              setStarted(true);
              setIndex(0);
              setCorrect(0);
              setDone(false);
            }}
          >
            Start
          </button>
        </div>
      ) : null}
      {started && current ? (
        <form
          className="card stack"
          onSubmit={(e) => {
            e.preventDefault();
            const hits = correct + (Number(typed) === current.answer ? 1 : 0);
            setTyped("");
            if (index + 1 >= problems.length) {
              finish(hits);
            } else {
              setCorrect(hits);
              setIndex((i) => i + 1);
            }
          }}
        >
          <p className="muted">{index + 1} / {problems.length}</p>
          <h2>{current.prompt}</h2>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus inputMode="numeric" />
          <button className="btn" type="submit">Next</button>
        </form>
      ) : null}
    </div>
  );
}
