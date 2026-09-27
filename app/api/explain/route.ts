import { NextResponse } from "next/server";
import { localCoach, type CoachAction } from "@/lib/coach";
import type { PlayQuestion } from "@/lib/types";

const ACTIONS: CoachAction[] = ["explain", "why-wrong", "hint", "eighth-grade", "teach"];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = ACTIONS.includes(body.action) ? (body.action as CoachAction) : "explain";
  const question = body.question as PlayQuestion | undefined;
  if (!question?.questionText || !question.answer) {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }
  const fallback = localCoach({
    action,
    question,
    userAnswer: body.userAnswer,
    correct: body.correct,
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
            content: "You are a concise middle-school Science Bowl coach. Explain in 4-8 short sentences. Use 8th-grade language. Do not invent facts. If unsure, say what to review.",
          },
          {
            role: "user",
            content: [
              `Action: ${action}`,
              `Question: ${question.questionText}`,
              `Type: ${question.kind ?? "tossup"} ${question.format}`,
              `Subject: ${body.subject ?? question.category}`,
              `Topic: ${question.topic}`,
              `Correct answer: ${question.answer}`,
              question.choices.length ? `Choices: ${question.choices.map((c) => `${c.key}) ${c.text}`).join(" / ")}` : "",
              body.userAnswer ? `Student answered: ${body.userAnswer}` : "Student did not answer",
              `Correct?: ${body.correct === true ? "yes" : body.correct === false ? "no" : "unknown"}`,
              body.recentAccuracy != null ? `Recent accuracy on this topic: ${Math.round(Number(body.recentAccuracy) * 100)}%` : "",
              body.weakTopic ? "This topic is currently a weak area for the student." : "",
              `Local notes: ${fallback}`,
              action === "eighth-grade" ? "Use only 8th-grade words. One short paragraph." : "",
              "Structure: why the answer is right, one sentence to remember, the common trap. Do not invent facts.",
            ].filter(Boolean).join("\n"),
          },
        ],
      }),
    });
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({
        text: fallback,
        source: "local",
        error: typeof data?.error?.message === "string" ? data.error.message : `AI ${res.status}`,
      });
    }
    return NextResponse.json({ text, source: "ai" });
  } catch {
    return NextResponse.json({ text: fallback, source: "local" });
  }
}
