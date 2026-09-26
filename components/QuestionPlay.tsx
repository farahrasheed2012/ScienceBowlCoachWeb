"use client";

import { useEffect, useMemo, useState } from "react";
import { answersMatch } from "@/lib/questions";
import { RATE, praise, speak } from "@/lib/speech";
import { useStore } from "@/lib/store";
import type { PlayQuestion } from "@/lib/types";
import { SpeechBar } from "./SpeechBar";

export function QuestionPlay({
  questions,
  title,
}: {
  questions: PlayQuestion[];
  title: string;
}) {
  const store = useStore();
  const list = useMemo(() => questions, [questions]);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const question = list[index];

  useEffect(() => {
    setTyped("");
    setRevealed(false);
    setPicked(null);
    setCorrect(null);
    if (question && store.readQuestionsAloud && store.autoReadQuestions && !store.parentReadsAloud) {
      const choices = question.choices.map((c) => `${c.key}: ${c.text}`).join(". ");
      speak(`${question.questionText}. ${choices}`, RATE[store.speechRatePreset], store.speechVoiceURI);
    }
  }, [index, question, store.autoReadQuestions, store.parentReadsAloud, store.readQuestionsAloud, store.speechRatePreset, store.speechVoiceURI]);

  if (!question) {
    return <div className="card muted">No questions in this set yet.</div>;
  }

  function grade(isCorrect: boolean) {
    setCorrect(isCorrect);
    setRevealed(true);
    store.recordAnswer({
      questionId: question.id,
      topic: question.topic,
      subject: question.category,
      correct: isCorrect,
      prompt: question.questionText,
      answer: question.answer,
    });
    if (isCorrect && store.readQuestionsAloud) {
      praise(store.studentName, RATE[store.speechRatePreset], store.speechVoiceURI);
    }
  }

  function next() {
    setIndex((i) => Math.min(list.length - 1, i + 1));
  }

  return (
    <div className="stack">
      <div className="row">
        <h2 style={{ margin: 0 }}>{title}</h2>
        <span className="pill">{index + 1} / {list.length}</span>
        <span className="pill">{question.type}</span>
        <span className="pill">{question.category}</span>
      </div>
      <div className="card stack">
        <p>{question.questionText}</p>
        <SpeechBar text={question.questionText} />
        {store.parentReadsAloud && !revealed ? (
          <button className="btn" type="button" onClick={() => setRevealed(true)}>Reveal</button>
        ) : null}
        {(!store.parentReadsAloud || revealed) && question.format === "multipleChoice" ? (
          <div className="stack">
            {question.choices.map((choice) => {
              const isPicked = picked === choice.key;
              const isRight = choice.text.toLowerCase() === question.answer.toLowerCase() || choice.key === question.answer;
              return (
                <button
                  key={choice.key}
                  className={`choice ${revealed && isRight ? "correct" : ""} ${revealed && isPicked && !isRight ? "wrong" : ""}`}
                  disabled={revealed}
                  onClick={() => {
                    setPicked(choice.key);
                    grade(isRight || answersMatch(question.answer, choice.text));
                  }}
                  type="button"
                >
                  {choice.key}) {choice.text}
                </button>
              );
            })}
          </div>
        ) : null}
        {(!store.parentReadsAloud || revealed) && question.format === "shortAnswer" && !revealed ? (
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              grade(answersMatch(question.answer, typed));
            }}
          >
            <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type your answer" />
            <button className="btn" type="submit">Check</button>
            <button className="btn ghost" type="button" onClick={() => grade(false)}>I missed it</button>
          </form>
        ) : null}
        {revealed ? (
          <div className="stack">
            <p><strong>{correct ? "Correct" : "Not quite"}.</strong> {question.answer}</p>
            {index < list.length - 1 ? (
              <button className="btn" type="button" onClick={next}>Next</button>
            ) : (
              <p className="muted">End of this drill.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
