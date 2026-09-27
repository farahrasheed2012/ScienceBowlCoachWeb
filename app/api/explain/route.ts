import { NextResponse } from "next/server";
import { answerLeaked, localCoach, type CoachAction } from "@/lib/coach";
import type { PlayQuestion } from "@/lib/types";

const ACTIONS: CoachAction[] = ["explain", "why-wrong", "hint", "eighth-grade", "teach"];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = ACTIONS.includes(body.action) ? (body.action as CoachAction) : "explain";
  const question = body.question as PlayQuestion | undefined;
  if (!question?.questionText || !question.answer) {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }
  const history = {
    recentMisses: Number(body.recentMisses) || 0,
    missesWeek: Number(body.missesWeek) || 0,
    lastAt: typeof body.lastPracticed === "string" ? body.lastPracticed : undefined,
    acc: body.recentAccuracy != null ? Number(body.recentAccuracy) : null,
  };
  const fallback = localCoach({
    action,
    question,
    userAnswer: body.userAnswer,
    correct: body.correct,
    history,
  });

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json({ text: fallback, source: "local" });
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        temperature: 0.3,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content: action === "hint"
              ? "You are a middle-school Science Bowl coach. Give ONE short hint. Never state the answer, a synonym, or the correct letter. Do not invent facts."
              : "You are a concise middle-school Science Bowl coach. Explain in 4-8 short sentences. Use 8th-grade language. Do not invent facts. If unsure, say what to review.",
          },
          {
            role: "user",
            content: [
              `Action: ${action}`,
              `Question: ${question.questionText}`,
              `Type: ${question.kind ?? "tossup"} ${question.format}`,
              `Subject: ${body.subject ?? question.category}`,
              `Topic: ${question.topic}`,
              action === "hint" ? "The student has not answered yet. Nudge toward the idea. Do not name the answer." : `Correct answer: ${question.answer}`,
              question.choices.length ? `Choices: ${question.choices.map((c) => `${c.key}) ${c.text}`).join(" / ")}` : "",
              body.userAnswer ? `Student answered: ${body.userAnswer}` : "Student did not answer",
              `Correct?: ${body.correct === true ? "yes" : body.correct === false ? "no" : "unknown"}`,
              body.recentAccuracy != null ? `Recent accuracy on this topic: ${Math.round(Number(body.recentAccuracy) * 100)}%` : "",
              body.weakTopic ? "This topic is currently a weak area for the student." : "",
              history.recentMisses >= 2 ? `The student missed this topic ${history.recentMisses} times in the last 10 tries.` : "",
              history.missesWeek ? `${history.missesWeek} misses on this topic in the last 7 days.` : "",
              `Local notes: ${fallback}`,
              action === "eighth-grade" ? "Use only 8th-grade words. One short paragraph." : "",
              action === "hint"
                ? "Reply with one hint sentence only. Do not explain why an answer is right."
                : "Structure: why the answer is right, one sentence to remember, the common trap. Do not invent facts.",
            ].filter(Boolean).join("\n"),
          },
        ],
      }),
    });
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text || (action === "hint" && answerLeaked(text, question.answer))) {
      return NextResponse.json({
        text: fallback,
        source: "local",
        error: !text
          ? (typeof data?.error?.message === "string" ? data.error.message : `AI ${res.status}`)
          : undefined,
      });
    }
    return NextResponse.json({ text, source: "ai" });
  } catch {
    return NextResponse.json({ text: fallback, source: "local" });
  }
}
