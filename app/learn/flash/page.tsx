"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";

export default function FlashReviewPage() {
  const store = useStore();
  const [show, setShow] = useState(false);
  const due = store.flashCards.filter((card) => new Date(card.due) <= new Date());
  const card = due[0];
  const later = store.flashCards.length - due.length;

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
            <button
              className="btn ok"
              type="button"
              onClick={() => {
                store.reviewFlashCard(card.id, true);
                setShow(false);
              }}
            >
              Correct
            </button>
            <button
              className="btn bad"
              type="button"
              onClick={() => {
                store.reviewFlashCard(card.id, false);
                setShow(false);
              }}
            >
              Again
            </button>
          </div>
        </div>
      ) : (
        <div className="card stack">
          <p>None due right now.</p>
          <p className="muted">Missed toss-ups become cards automatically. You can also make cards from key terms on a Learn article.</p>
          <Link className="btn" href="/learn">Pick an article</Link>
        </div>
      )}
      {due.length > 1 ? (
        <p className="muted">{due.length - 1} more due after this one.</p>
      ) : null}
    </div>
  );
}
