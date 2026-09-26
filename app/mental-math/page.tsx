"use client";

import { useMemo, useState } from "react";
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
  const problems = useMemo(() => mentalProblems(op, level), [op, level, started]);
  const current = problems[index];

  return (
    <div>
      <h1>Mental Math</h1>
      <p className="muted">20 problems. Same engine idea as the Mac app: addition, subtraction, multiplication, division, squares, mixed.</p>
      {!started ? (
        <div className="card stack">
          <label>Operation</label>
          <select value={op} onChange={(e) => setOp(e.target.value as MentalOp)}>
            {OPS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <label>Level {level}</label>
          <input type="range" min={1} max={6} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
          <button className="btn" type="button" onClick={() => { setStarted(true); setIndex(0); setCorrect(0); }}>Start</button>
        </div>
      ) : current ? (
        <form
          className="card stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (Number(typed) === current.answer) setCorrect((n) => n + 1);
            setTyped("");
            if (index + 1 >= problems.length) {
              store.set({ xp: store.xp + correct * 2 });
              setStarted(false);
            } else {
              setIndex((i) => i + 1);
            }
          }}
        >
          <p className="muted">{index + 1} / {problems.length}</p>
          <h2>{current.prompt}</h2>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          <button className="btn" type="submit">Next</button>
        </form>
      ) : (
        <p>Score {correct} / {problems.length}</p>
      )}
    </div>
  );
}
