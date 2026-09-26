"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { FIRST20 } from "@/lib/elements";
import { answersMatch } from "@/lib/questions";
import { useStore } from "@/lib/store";

export default function ElementsPage() {
  const store = useStore();
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"table" | "flash" | "drill">("table");
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [typed, setTyped] = useState("");
  const deck = useMemo(() => FIRST20, []);
  const current = deck[index % deck.length];
  const drillHits = useRef(0);
  const drillStarted = useRef(Date.now());

  function mark(symbol: string, correct: boolean) {
    if (correct && !store.elementMastered.includes(symbol)) {
      store.set({ elementMastered: [...store.elementMastered, symbol] });
    }
  }

  return (
    <div>
      <h1>Elements</h1>
      <p className="muted">{store.elementMastered.length} / {FIRST20.length} first-20 symbols mastered (H–Ca).</p>
      <div className="row">
        <Link href="/learn">Back to Learn</Link>
        <button className="btn ghost" type="button" onClick={() => setMode("table")}>Table</button>
        <button className="btn ghost" type="button" onClick={() => setMode("flash")}>Flash cards</button>
        <button
          className="btn ghost"
          type="button"
          onClick={() => {
            setMode("drill");
            drillHits.current = 0;
            drillStarted.current = Date.now();
          }}
        >
          Drill
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => {
            const added = store.addFlashCards(
              FIRST20.map((el) => ({
                subject: "chemistry",
                topic: "First 20 elements",
                prompt: `${el.symbol} — name this element`,
                answer: `${el.name} · #${el.atomicNumber} · ${el.category}`,
              })),
            );
            setNote(added ? `Added ${added} cards.` : "Those element cards are already in your deck.");
          }}
        >
          Add H–Ca to flashcards
        </button>
        <Link className="btn ghost" href="/learn/flash">Review cards</Link>
      </div>
      {note ? <p className="muted">{note}</p> : null}
      {mode === "table" ? (
        <div className="ptable" style={{ marginTop: 16 }}>
          {FIRST20.map((el) => (
            <div key={el.symbol} className={`el ${store.elementMastered.includes(el.symbol) ? "mastered" : ""}`} style={{ gridColumn: el.group, gridRow: el.period }}>
              <div>{el.atomicNumber}</div>
              <strong>{el.symbol}</strong>
              <div>{el.name}</div>
            </div>
          ))}
        </div>
      ) : null}
      {mode === "flash" ? (
        <div className="card stack" style={{ marginTop: 16 }}>
          <p className="muted">{index + 1} / {deck.length}</p>
          <h2>{show ? `${current.symbol} — ${current.name}` : current.symbol}</h2>
          <p className="muted">{current.category} · #{current.atomicNumber}</p>
          <div className="row">
            <button className="btn ghost" type="button" onClick={() => setShow((s) => !s)}>Reveal</button>
            <button className="btn ok" type="button" onClick={() => { mark(current.symbol, true); setShow(false); setIndex((i) => i + 1); }}>Got it</button>
            <button className="btn bad" type="button" onClick={() => { mark(current.symbol, false); setShow(false); setIndex((i) => i + 1); }}>Again</button>
          </div>
        </div>
      ) : null}
      {mode === "drill" ? (
        <form
          className="card stack"
          style={{ marginTop: 16 }}
          onSubmit={(e) => {
            e.preventDefault();
            const ok = answersMatch(current.name, typed);
            mark(current.symbol, ok);
            if (ok) drillHits.current += 1;
            setTyped("");
            const next = index + 1;
            if (next % deck.length === 0) {
              store.recordRound({
                title: "Elements · H–Ca",
                asked: deck.length,
                correct: drillHits.current,
                seconds: Math.max(1, Math.round((Date.now() - drillStarted.current) / 1000)),
              });
              drillHits.current = 0;
              drillStarted.current = Date.now();
            }
            setIndex(next);
          }}
        >
          <p className="muted">{(index % deck.length) + 1} / {deck.length} · a full pass saves to Progress</p>
          <p>Name the element: <strong>{current.symbol}</strong></p>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Element name" />
          <button className="btn" type="submit">Check</button>
        </form>
      ) : null}
    </div>
  );
}
