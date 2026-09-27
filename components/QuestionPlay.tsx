"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { isChoiceCorrect, officialSeconds, answersMatch, subjectTone } from "@/lib/questions";
import { RATE, praise, speak, stopSpeech } from "@/lib/speech";
import { coachRead } from "@/lib/coach";
import { topicAccuracy } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { sameTopicLabel } from "@/lib/topic-map";
import type { PlayQuestion } from "@/lib/types";
import { CoachInsight } from "./CoachInsight";
import { SpeechBar } from "./SpeechBar";
import { CoachPanel } from "./CoachPanel";

type Phase = "live" | "buzzed" | "revealed" | "done";

export function QuestionPlay({
  questions,
  title,
  timed = true,
}: {
  questions: PlayQuestion[];
  title: string;
  timed?: boolean;
}) {
  const store = useStore();
  const [list] = useState(questions);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("live");
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [seconds, setSeconds] = useState(5);
  const [earned, setEarned] = useState(0);
  const [hits, setHits] = useState(0);
  const [seen, setSeen] = useState(0);
  const [missedTopics, setMissedTopics] = useState<string[]>([]);
  const [clockOn, setClockOn] = useState(!timed);
  const startedAt = useRef(Date.now());
  const loggedRound = useRef(false);
  const answeredId = useRef<string | null>(null);
  const questionGen = useRef(0);
  const timedOut = useRef(false);
  const question = list[index];
  const tone = question ? subjectTone(question.category) : "bio";

  useEffect(() => {
    questionGen.current += 1;
    answeredId.current = null;
    timedOut.current = false;
    setTyped("");
    setPicked(null);
    setCorrect(null);
    setPhase("live");
    setSeconds(question ? officialSeconds(question) : 5);
    setClockOn(!(timed && store.readQuestionsAloud && store.autoReadQuestions && !store.parentReadsAloud));
    stopSpeech();
    if (question && store.readQuestionsAloud && store.autoReadQuestions && !store.parentReadsAloud) {
      const choices = question.choices.map((c) => `${c.key}: ${c.text}`).join(". ");
      void speak(`${question.questionText}. ${choices}`, RATE[store.speechRatePreset], store.speechVoiceURI).then(() => setClockOn(true));
    }
  }, [index, question, store.autoReadQuestions, store.parentReadsAloud, store.readQuestionsAloud, store.speechRatePreset, store.speechVoiceURI, timed]);

  useEffect(() => {
    if (!timed || !clockOn || !question || phase !== "live") return;
    const id = window.setInterval(() => {
      setSeconds((left) => (left <= 1 ? 0 : left - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [clockOn, index, phase, question, timed]);

  useEffect(() => {
    if (!timed || !question || phase !== "live" || seconds > 0 || timedOut.current) return;
    timedOut.current = true;
    grade(false, true);
  }, [phase, question, seconds, timed]);

  useEffect(() => {
    if (!store.buzzerRoomCode || !timed) return;
    let primed = false;
    let lastAt = "";
    const id = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/buzzer/${store.buzzerRoomCode}`);
        if (!res.ok) return;
        const data = await res.json();
        const latest = (data.events as { at: string }[] | undefined)?.at(-1);
        if (!primed) {
          primed = true;
          lastAt = latest?.at ?? "";
          return;
        }
        if (latest?.at && latest.at !== lastAt) {
          lastAt = latest.at;
          setPhase((current) => (current === "live" ? "buzzed" : current));
        }
      } catch {
        /* room may be empty */
      }
    }, 700);
    return () => window.clearInterval(id);
  }, [store.buzzerRoomCode, timed]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!question) return;
      const key = event.key.toLowerCase();
      if (phase === "live" && (event.code === "Space" || key === " ")) {
        event.preventDefault();
        setPhase("buzzed");
        return;
      }
      if ((phase === "live" || phase === "buzzed") && !store.parentReadsAloud) {
        const map: Record<string, string> = { w: "W", x: "X", y: "Y", z: "Z", "1": "W", "2": "X", "3": "Y", "4": "Z" };
        if (question.format === "multipleChoice" && map[key]) {
          pick(map[key]);
        }
      }
      if (phase === "revealed" && (key === "n" || key === "enter")) {
        event.preventDefault();
        next();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!question) {
    return (
      <div className="card stack">
        <p>No questions in this set yet.</p>
        <p className="muted">Try a mixed toss-up or an encyclopedia topic. Import a DOE cache in Settings for the official bank.</p>
        <div className="row">
          <Link className="btn" href="/practice/play?mode=tossup">Mixed toss-up</Link>
          <Link className="btn ghost" href="/learn">Learn</Link>
          <Link className="btn ghost" href="/settings">Import DOE</Link>
        </div>
      </div>
    );
  }

  function grade(isCorrect: boolean, timedOut = false) {
    if (!question || answeredId.current === question.id || phase === "done") return;
    answeredId.current = question.id;
    setCorrect(isCorrect);
    setPhase("revealed");
    setSeen((n) => n + 1);
    if (isCorrect) {
      setHits((n) => n + 1);
      setEarned((n) => n + 10);
    } else {
      setMissedTopics((topics) => (topics.includes(question.topic) ? topics : [...topics, question.topic]));
    }
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
    if (timedOut) setSeconds(0);
  }

  function pick(key: string) {
    setPicked(key);
    grade(isChoiceCorrect(question, key));
  }

  function goTo(jump: number) {
    questionGen.current += 1;
    answeredId.current = null;
    timedOut.current = false;
    setTyped("");
    setPicked(null);
    setCorrect(null);
    setPhase("live");
    setSeconds(list[jump] ? officialSeconds(list[jump]) : 5);
    setIndex(jump);
  }

  function similar() {
    const match = (q: PlayQuestion) => q.id !== question.id && (q.topicId === question.topicId || sameTopicLabel(q.topic, question.topic));
    const later = list.findIndex((q, i) => i > index && match(q));
    const any = list.findIndex((q) => match(q));
    if (later >= 0) goTo(later);
    else if (any >= 0) goTo(any);
  }

  function finishRound() {
    if (!loggedRound.current) {
      loggedRound.current = true;
      store.recordRound({
        title,
        asked: seen,
        correct: hits,
        seconds: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
      });
    }
    setPhase("done");
  }

  function next() {
    let jump = index + 1;
    if (correct === false && question.kind !== "bonus" && list[jump]?.kind === "bonus") {
      jump += 1;
    }
    if (jump >= list.length) {
      finishRound();
      return;
    }
    goTo(jump);
  }

  if (phase === "done") {
    const minutes = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
    const dueNow = store.flashCards.filter((card) => new Date(card.due) <= new Date()).length;
    const acc = seen ? hits / seen : 0;
    const read = coachRead({
      results: store.drillResults,
      rounds: store.practiceRounds,
      missionTopic: missedTopics[0] || title,
      sessionMissed: missedTopics,
      sessionHits: hits,
      sessionAsked: seen,
    });
    return (
      <div className="stack">
        <p className="mission-kicker">Session complete</p>
        <div className="mission stack">
          <p className="stem">{hits} / {seen}</p>
          <p>{Math.round(acc * 100)}%</p>
          <CoachInsight kicker={read.kicker} body={read.body} />
          {missedTopics[0] ? (
            <div>
              <p className="mission-kicker">Keep</p>
              <p>Review {missedTopics.length} missed {missedTopics.length === 1 ? "topic" : "topics"}</p>
              <p className="muted">{missedTopics.join(" · ")}</p>
            </div>
          ) : <p className="muted">No misses this round.</p>}
          <div>
            <p className="mission-kicker">Next recommended step</p>
            <p>{missedTopics[0] ? "Try 2 similar questions" : "Keep the streak with a short toss-up"}</p>
          </div>
          <p className="muted">{minutes} min · +{earned} XP</p>
          {dueNow ? <p className="muted">{dueNow} flashcards due now.</p> : null}
          <div className="row">
            {missedTopics[0] ? <Link className="btn mission-cta" href="/learn/review">Review now</Link> : <Link className="btn mission-cta" href="/today">Back to today</Link>}
            {dueNow ? <Link className="btn ghost" href="/learn/flash">Review flashcards</Link> : <Link className="btn ghost" href="/practice">Free practice</Link>}
          </div>
        </div>
      </div>
    );
  }

  const answering = phase === "buzzed" || (!timed && phase === "live") || (store.parentReadsAloud && phase === "revealed");
  const showChoices = question.format === "multipleChoice" && (!store.parentReadsAloud || phase === "revealed");
  const showTyped = question.format === "shortAnswer" && phase !== "revealed" && (answering || !timed || phase === "live");
  const topicRow = topicAccuracy(store.drillResults).find((row) => sameTopicLabel(row.topic, question.topic));

  return (
    <div className="play-stage">
      <div className="play-meta">
        <p className={`play-kicker ${tone}`}>{question.category}</p>
        {timed && (phase === "live" || phase === "buzzed") ? (
          <p className={`timer ${seconds <= 2 && clockOn ? "urgent" : ""}`}>
            {clockOn ? `${String(seconds).padStart(2, "0")}s` : "Listening"}
          </p>
        ) : (
          <p className="faint">{index + 1} / {list.length}</p>
        )}
      </div>
      <div className={`play-card ${tone}`}>
        <p className="stem">{question.questionText}</p>
        {store.parentReadsAloud && phase !== "revealed" ? (
          <p className="faint">Parent is reading. Answers stay hidden until Reveal.</p>
        ) : null}
        {timed && store.buzzerRoomCode ? (
          <p className="faint">Phone room {store.buzzerRoomCode}</p>
        ) : null}
        {showChoices ? (
          <div className="choices">
            {question.choices.map((choice) => {
              const isPicked = picked === choice.key;
              const isRight = isChoiceCorrect(question, choice.key);
              return (
                <button
                  key={choice.key}
                  className={`choice ${phase === "revealed" && isRight ? "correct" : ""} ${phase === "revealed" && isPicked && !isRight ? "wrong" : ""}`}
                  disabled={phase === "revealed"}
                  onClick={() => pick(choice.key)}
                  type="button"
                >
                  <span className="choice-key">{choice.key}</span>
                  <span>{choice.text}</span>
                </button>
              );
            })}
          </div>
        ) : null}
        {showTyped ? (
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              grade(answersMatch(question.answer, typed));
            }}
          >
            <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type your answer" autoFocus />
            <button className="btn" type="submit">Check</button>
            <button className="text-btn" type="button" onClick={() => grade(false)}>I missed it</button>
          </form>
        ) : null}
        {phase === "live" && timed ? (
          <div className="row">
            <button className="btn buzz" type="button" onClick={() => setPhase("buzzed")}>Space · Buzz</button>
          </div>
        ) : null}
        {store.parentReadsAloud && phase !== "revealed" ? (
          <button className="btn" type="button" onClick={() => setPhase("revealed")}>Reveal</button>
        ) : null}
        {phase === "live" ? (
          <CoachPanel
            key={`${question.id}-live`}
            question={question}
            userAnswer={picked ?? typed}
            correct={correct}
            phase="live"
            recentAccuracy={topicRow?.acc}
            weakTopic={Boolean(topicRow && topicRow.acc < 0.7)}
          />
        ) : null}
        {phase === "revealed" ? (
          <div className="reveal-block">
            <p className={`reveal-verdict ${correct ? "ok-text" : "bad-text"}`}>
              {correct ? "✓ Correct" : "✕ Not quite"}
            </p>
            {!correct ? <p className="reveal-note muted">The answer is {question.answer}.</p> : null}
            <div className="reveal-coach">
              <CoachPanel
                key={`${question.id}-revealed`}
                question={question}
                userAnswer={picked ?? typed}
                correct={correct}
                phase="revealed"
                onSimilar={similar}
                recentAccuracy={topicRow?.acc}
                weakTopic={Boolean(topicRow && topicRow.acc < 0.7)}
              />
            </div>
            {index < list.length - 1 || (correct === false && list[index + 1]?.kind === "bonus") ? (
              <button className={`${correct ? "btn mission-cta" : "btn ghost"} reveal-next`} type="button" onClick={next}>Next →</button>
            ) : (
              <button className="btn mission-cta reveal-next" type="button" onClick={finishRound}>See results</button>
            )}
          </div>
        ) : null}
        <SpeechBar text={question.questionText} />
        {seen > 0 ? (
          <button className="text-btn" type="button" onClick={finishRound}>End round</button>
        ) : null}
      </div>
    </div>
  );
}
