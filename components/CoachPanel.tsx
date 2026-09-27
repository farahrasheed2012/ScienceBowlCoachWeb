"use client";

import Link from "next/link";
import { useState } from "react";
import { coachBrief, localCoach, type CoachAction } from "@/lib/coach";
import { findTopicArticle } from "@/lib/questions";
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
  const [text, setText] = useState("");
  const [source, setSource] = useState<"local" | "ai" | "">("");
  const [aiError, setAiError] = useState("");
  const [busy, setBusy] = useState(false);
  const article = findTopicArticle(question);
  const tossupId = article ? tossupTopicForEncyclopedia(article.id) : question.topicId;
  const brief = coachBrief(question, userAnswer, correct);

  async function run(action: CoachAction) {
    const local = localCoach({ action, question, userAnswer, correct });
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
          recentAccuracy,
          weakTopic,
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
          <p><strong>Why?</strong> {brief.why}</p>
          <p><strong>Remember this.</strong> {brief.remember}</p>
          <p><strong>Common trap.</strong> {brief.trap}</p>
        </div>
      ) : null}
      <div className="row">
        {phase === "live" ? (
          <button className="btn ghost" type="button" disabled={busy} onClick={() => run("hint")}>Give me a hint</button>
        ) : null}
        {phase === "revealed" ? (
          <>
            <button className="btn ghost" type="button" disabled={busy} onClick={() => run("eighth-grade")}>Explain simpler</button>
            <button className="btn ghost" type="button" disabled={busy} onClick={() => run("teach")}>Teach this topic</button>
          </>
        ) : null}
        {phase === "revealed" && onSimilar ? (
          <button className="btn ghost" type="button" onClick={onSimilar}>Try a similar question</button>
        ) : null}
        {tossupId ? <Link className="btn ghost" href={`/practice/play?mode=topic&topic=${tossupId}`}>Quiz this topic</Link> : null}
        {article ? <Link className="btn ghost" href={`/learn/${article.id}`}>Open the article</Link> : null}
      </div>
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
