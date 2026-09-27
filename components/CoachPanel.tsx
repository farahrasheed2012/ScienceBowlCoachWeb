"use client";

import Link from "next/link";
import { useState } from "react";
import { coachBrief, localCoach, type CoachAction } from "@/lib/coach";
import { findTopicArticle } from "@/lib/questions";
import { topicHistory } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { tossupTopicForEncyclopedia } from "@/lib/topic-map";
import type { PlayQuestion } from "@/lib/types";

export function CoachPanel({
  question,
  userAnswer,
  correct,
  phase,
  onSimilar,
  recentAccuracy,
  weakTopic,
}: {
  question: PlayQuestion;
  userAnswer?: string;
  correct: boolean | null;
  phase: "live" | "buzzed" | "revealed" | "done";
  onSimilar?: () => void;
  recentAccuracy?: number | null;
  weakTopic?: boolean;
}) {
  const store = useStore();
  const [text, setText] = useState("");
  const [source, setSource] = useState<"local" | "ai" | "">("");
  const [aiError, setAiError] = useState("");
  const [busy, setBusy] = useState(false);
  const article = findTopicArticle(question);
  const tossupId = article ? tossupTopicForEncyclopedia(article.id) : question.topicId;
  const history = topicHistory(store.drillResults, question.topic);
  const brief = coachBrief(question, userAnswer, correct, history);

  async function run(action: CoachAction) {
    const local = localCoach({ action, question, userAnswer, correct, history });
    setText(local);
    setSource("local");
    setAiError("");
    setBusy(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          question,
          userAnswer,
          correct,
          recentAccuracy: recentAccuracy ?? history.acc,
          weakTopic,
          recentMisses: history.recentMisses,
          missesWeek: history.missesWeek,
          lastPracticed: history.lastAt,
          subject: question.category,
        }),
      });
      const data = await res.json();
      if (data.text) {
        setText(data.text);
        setSource(data.source === "ai" ? "ai" : "local");
        setAiError(data.source === "ai" ? "" : String(data.error ?? ""));
      }
    } catch {
      /* keep local */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack coach">
      {phase === "revealed" ? (
        <div className="coach-brief">
          {correct ? (
            <p className="coach-clue">Exactly. The key clue was {brief.clue}.</p>
          ) : (
            <p className="coach-clue">{brief.whyMissed}</p>
          )}
          {brief.missLine ? <p className="coach-history">{brief.missLine}</p> : null}
        </div>
      ) : null}
      {phase === "live" ? (
        <button className="text-btn" type="button" disabled={busy} onClick={() => run("hint")}>Hint</button>
      ) : null}
      {phase === "revealed" ? (
        <details className="more-help">
          <summary>More help</summary>
          <div className="stack">
            {!correct ? <p className="muted">Watch for: {brief.trap}</p> : null}
            <p className="muted">Remember: {brief.remember}</p>
            <div className="row">
              {!correct && onSimilar ? (
                <button className="btn" type="button" onClick={onSimilar}>Try similar</button>
              ) : null}
              <button className="btn ghost" type="button" disabled={busy} onClick={() => run("eighth-grade")}>Explain more</button>
              <button className="btn ghost" type="button" disabled={busy} onClick={() => run("teach")}>Teach this topic</button>
              {correct && onSimilar ? (
                <button className="btn ghost" type="button" onClick={onSimilar}>Similar question</button>
              ) : null}
              {tossupId ? <Link className="btn ghost" href={`/practice/play?mode=topic&topic=${tossupId}`}>Quiz this topic</Link> : null}
              {article ? <Link className="btn ghost" href={`/learn/${article.id}`}>Study topic</Link> : null}
            </div>
          </div>
        </details>
      ) : null}
      {text ? (
        <div className="card stack">
          <p className="muted">{busy ? "Checking a fuller explanation…" : source === "ai" ? "Simpler explanation" : "Coach notes"}</p>
          {aiError ? <p className="muted">AI did not run: {aiError}</p> : null}
          <p>{text}</p>
        </div>
      ) : null}
    </div>
  );
}
