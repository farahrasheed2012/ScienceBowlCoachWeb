"use client";

import Link from "next/link";
import { useState } from "react";
import { localCoach, type CoachAction } from "@/lib/coach";
import { findTopicArticle } from "@/lib/questions";
import { tossupTopicForEncyclopedia } from "@/lib/topic-map";
import type { PlayQuestion } from "@/lib/types";

const ACTIONS: { id: CoachAction; label: string; when: "live" | "revealed" | "both" }[] = [
  { id: "hint", label: "Hint", when: "live" },
  { id: "explain", label: "Explain this", when: "revealed" },
  { id: "eighth-grade", label: "Explain like I'm in 8th grade", when: "revealed" },
  { id: "why-wrong", label: "Why was I wrong?", when: "revealed" },
  { id: "teach", label: "Teach this topic", when: "both" },
];

export function CoachPanel({
  question,
  userAnswer,
  correct,
  phase,
  onSimilar,
}: {
  question: PlayQuestion;
  userAnswer?: string;
  correct: boolean | null;
  phase: "live" | "buzzed" | "revealed" | "done";
  onSimilar?: () => void;
}) {
  const [text, setText] = useState("");
  const [source, setSource] = useState<"local" | "ai" | "">("");
  const [busy, setBusy] = useState(false);
  const article = findTopicArticle(question);
  const tossupId = article ? tossupTopicForEncyclopedia(article.id) : question.topicId;

  async function run(action: CoachAction) {
    const local = localCoach({ action, question, userAnswer, correct });
    setText(local);
    setSource("local");
    setBusy(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, question, userAnswer, correct }),
      });
      const data = await res.json();
      if (data.text) {
        setText(data.text);
        setSource(data.source === "ai" ? "ai" : "local");
      }
    } catch {
      /* keep local */
    } finally {
      setBusy(false);
    }
  }

  const visible = ACTIONS.filter((item) => item.when === "both" || (phase === "revealed" ? item.when === "revealed" : item.when === "live" && phase === "live"));

  return (
    <div className="stack">
      <div className="row">
        {visible.map((item) => (
          <button key={item.id} className="btn ghost" type="button" disabled={busy} onClick={() => run(item.id)}>
            {item.label}
          </button>
        ))}
        {onSimilar ? <button className="btn ghost" type="button" onClick={onSimilar}>Similar question</button> : null}
        {tossupId ? <Link className="btn ghost" href={`/practice/play?mode=topic&topic=${tossupId}`}>Quiz me on this topic</Link> : null}
        {article ? <Link className="btn ghost" href={`/learn/${article.id}`}>Open the article</Link> : null}
      </div>
      {text ? (
        <div className="card stack">
          <p className="muted">{busy ? "Checking a fuller explanation…" : source === "ai" ? "Coach" : "Coach notes"}</p>
          <p>{text}</p>
        </div>
      ) : null}
    </div>
  );
}
