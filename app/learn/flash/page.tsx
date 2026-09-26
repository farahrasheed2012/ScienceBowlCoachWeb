"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";

export default function FlashReviewPage() {
  const store = useStore();
  const [show, setShow] = useState(false);
  const startedAt = useRef(Date.now());
  const asked = useRef(0);
  const hits = useRef(0);
  const due = store.flashCards.filter((card) => new Date(card.due) <= new Date());
  const card = due[0];
  const later = store.flashCards.length - due.length;

  function grade(correct: boolean) {
    if (!card) return;
    asked.current += 1;
    if (correct) hits.current += 1;
    const lastDue = due.length <= 1 && correct;
    store.reviewFlashCard(card.id, correct);
    setShow(false);
    if (lastDue) {
      store.recordRound({
        title: "Flashcards",
        asked: asked.current,
        correct: hits.current,
        seconds: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
      });
    }
  }

  return (
    <div className="stack">
      <Link href="/learn">Back to Learn</Link>
      <div>
        <h1>Flashcards</h1>
        <p className="muted">{due.length} due · {later} scheduled later · {store.flashCards.length} total</p>
      </div>
      {card ? (
        <div className="card stack">
          <p className="muted">{card.topic} · {card.stage}</p>
          <p className="stem">{show ? card.answer : card.prompt}</p>
          <div className="row">
            <button className="btn ghost" type="button" onClick={() => setShow((value) => !value)}>
              {show ? "Hide" : "Reveal"}
            </button>
            <button className="btn ok" type="button" onClick={() => grade(true)}>
              Correct
            </button>
            <button className="btn bad" type="button" onClick={() => grade(false)}>
              Again
            </button>
          </div>
        </div>
      ) : (
        <div className="card stack">
          <p>None due right now.</p>
          <p className="muted">Missed toss-ups become cards automatically. You can also make cards from key terms on a Learn article. Clearing the pile saves a session to Progress.</p>
          <Link className="btn" href="/learn">Pick an article</Link>
        </div>
      )}
      {due.length > 1 ? (
        <p className="muted">{due.length - 1} more due after this one.</p>
      ) : null}
    </div>
  );
}
