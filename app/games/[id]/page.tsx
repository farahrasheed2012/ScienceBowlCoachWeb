"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FIRST20 } from "@/lib/elements";
import { CELL_PARTS, MOLECULES, TRUE_FALSE, WORDLE_BANK } from "@/lib/games";
import { useStore } from "@/lib/store";

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  if (id === "wordle") return <Wordle />;
  if (id === "truefalse") return <TrueFalse />;
  if (id === "elements") return <ElementBlitz />;
  if (id === "molecules") return <Molecules />;
  if (id === "cell") return <CellBuilder />;
  return <p>Unknown game. <Link href="/games">Back</Link></p>;
}

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="stack">
      <Link href="/games">Back to games</Link>
      <h1>{title}</h1>
      {children}
    </div>
  );
}

function Wordle() {
  const target = useMemo(() => WORDLE_BANK[new Date().getDate() % WORDLE_BANK.length], []);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  function submit() {
    if (current.length !== 5) return;
    setGuesses((g) => [...g, current.toUpperCase()]);
    setCurrent("");
  }
  return (
    <Shell title="Science Wordle">
      <div className="wordle">
        {guesses.map((guess) => (
          <div className="wordle-row" key={guess}>
            {guess.split("").map((ch, i) => {
              const cls = target[i] === ch ? "hit" : target.includes(ch) ? "near" : "miss";
              return <div className={`tile ${cls}`} key={`${guess}-${i}`}>{ch}</div>;
            })}
          </div>
        ))}
      </div>
      {guesses.includes(target) ? <p>Got it: {target}</p> : (
        <form className="row" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <input maxLength={5} value={current} onChange={(e) => setCurrent(e.target.value.replace(/[^a-z]/gi, ""))} />
          <button className="btn" type="submit">Guess</button>
        </form>
      )}
    </Shell>
  );
}

function TrueFalse() {
  const store = useStore();
  const deck = useMemo(() => [...TRUE_FALSE].sort(() => Math.random() - 0.5).slice(0, 15), []);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const item = deck[i];
  if (!item) return <Shell title="True or False Blitz"><p>Score {score} / {deck.length}</p></Shell>;
  return (
    <Shell title="True or False Blitz">
      <div className="card stack">
        <p>{item.statement}</p>
        <div className="row">
          <button className="btn ok" type="button" onClick={() => { if (item.isTrue) setScore((s) => s + 1); else store.recordAnswer({ questionId: item.id, topic: item.subject, subject: item.subject, correct: false, prompt: item.statement, answer: item.hint }); setI((n) => n + 1); }}>True</button>
          <button className="btn bad" type="button" onClick={() => { if (!item.isTrue) setScore((s) => s + 1); setI((n) => n + 1); }}>False</button>
        </div>
        <p className="muted">{item.hint}</p>
      </div>
    </Shell>
  );
}

function ElementBlitz() {
  const [seconds, setSeconds] = useState(90);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [typed, setTyped] = useState("");
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const el = FIRST20[i % FIRST20.length];
  return (
    <Shell title="Element Blitz">
      <p className="timer">{seconds}s · {score} correct</p>
      {seconds === 0 ? <p>Time. Score {score}.</p> : (
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); if (typed.trim().toLowerCase() === el.name.toLowerCase()) setScore((s) => s + 1); setTyped(""); setI((n) => n + 1); }}>
          <h2>{el.symbol}</h2>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Name" />
          <button className="btn" type="submit">Go</button>
        </form>
      )}
    </Shell>
  );
}

function Molecules() {
  const cards = useMemo(() => {
    const raw = MOLECULES.flatMap((m) => [
      { id: `${m.id}-f`, pair: m.id, label: m.formula },
      { id: `${m.id}-n`, pair: m.id, label: m.name },
    ]);
    return raw.sort(() => Math.random() - 0.5);
  }, []);
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  function click(id: string, pair: string) {
    if (matched.includes(pair) || open.includes(id)) return;
    const next = [...open, id];
    if (next.length === 2) {
      const a = cards.find((c) => c.id === next[0]);
      const b = cards.find((c) => c.id === next[1]);
      if (a && b && a.pair === b.pair) setMatched((m) => [...m, a.pair]);
      setTimeout(() => setOpen([]), 500);
    } else {
      setOpen(next);
    }
  }
  return (
    <Shell title="Molecule Match">
      <div className="grid two">
        {cards.map((card) => {
          const show = open.includes(card.id) || matched.includes(card.pair);
          return (
            <button className="card" key={card.id} type="button" onClick={() => click(card.id, card.pair)}>
              {show ? card.label : "?"}
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

function CellBuilder() {
  const [plant, setPlant] = useState(true);
  const parts = CELL_PARTS.filter((p) => plant || !p.plantOnly);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [pool, setPool] = useState(parts.map((p) => p.id));
  return (
    <Shell title="Cell Builder">
      <div className="row">
        <button className="btn ghost" type="button" onClick={() => { setPlant(false); setPlaced({}); setPool(CELL_PARTS.filter((p) => !p.plantOnly).map((p) => p.id)); }}>Animal</button>
        <button className="btn ghost" type="button" onClick={() => { setPlant(true); setPlaced({}); setPool(CELL_PARTS.map((p) => p.id)); }}>Plant</button>
      </div>
      <div className="grid two">
        {parts.map((part) => (
          <div className="card" key={part.id}>
            <strong>{part.name}</strong>
            <select value={placed[part.id] ?? ""} onChange={(e) => setPlaced((p) => ({ ...p, [part.id]: e.target.value }))}>
              <option value="">Place…</option>
              {pool.map((id) => <option key={id} value={id}>{CELL_PARTS.find((p) => p.id === id)?.name}</option>)}
            </select>
            {placed[part.id] ? <p>{placed[part.id] === part.id ? "Correct" : "Try again"}</p> : null}
          </div>
        ))}
      </div>
    </Shell>
  );
}
