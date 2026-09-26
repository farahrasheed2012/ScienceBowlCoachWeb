"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { findTopicArticle, isChoiceCorrect, officialSeconds, answersMatch, subjectTone } from "@/lib/questions";
import { lookupLine } from "@/lib/readings";
import { RATE, praise, speak, stopSpeech } from "@/lib/speech";
import { topicAccuracy } from "@/lib/stats";
import { useStore } from "@/lib/store";
import type { PlayQuestion } from "@/lib/types";
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
  const question = list[index];
  const limit = question ? officialSeconds(question) : 5;
  const tone = question ? subjectTone(question.category) : "bio";
  const article = question ? findTopicArticle(question) : undefined;
  const books = article ? lookupLine(article.id) : {};

  useEffect(() => {
    questionGen.current += 1;
    answeredId.current = null;
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
    const startedGen = questionGen.current;
    const id = window.setInterval(() => {
      setSeconds((left) => {
        if (left <= 1) {
          window.clearInterval(id);
          if (questionGen.current === startedGen) grade(false, true);
          return 0;
        }
        return left - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [clockOn, index, phase, question, timed]);

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
    setTyped("");
    setPicked(null);
    setCorrect(null);
    setPhase("live");
    setSeconds(list[jump] ? officialSeconds(list[jump]) : 5);
    setIndex(jump);
  }

  function similar() {
    const match = (q: PlayQuestion) => q.id !== question.id && (q.topicId === question.topicId || q.topic === question.topic);
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
    return (
      <div className="stack">
        <h2>Session complete</h2>
        <div className="mission stack">
          <p className="stem">{hits} / {seen} correct</p>
          <p className="muted">{Math.round(acc * 100)}% · {minutes} min · +{earned} XP · streak {store.studyStreak}</p>
          {missedTopics[0] ? <p>Needs review: {missedTopics.join(" · ")}</p> : <p className="muted">No misses this round.</p>}
          {dueNow ? <p className="muted">{dueNow} flashcards due now.</p> : null}
          <div className="row">
            {missedTopics[0] ? <Link className="btn" href="/learn/review">Review missed topics</Link> : <Link className="btn" href="/today">Continue today&apos;s plan</Link>}
            {dueNow ? <Link className="btn ghost" href="/learn/flash">Review flashcards</Link> : <Link className="btn ghost" href="/practice">Free practice</Link>}
          </div>
        </div>
      </div>
    );
  }

  const answering = phase === "buzzed" || (!timed && phase === "live") || (store.parentReadsAloud && phase === "revealed");
  const showChoices = question.format === "multipleChoice" && (!store.parentReadsAloud || phase === "revealed");
  const showTyped = question.format === "shortAnswer" && phase !== "revealed" && (answering || !timed || phase === "live");
  const topicRow = topicAccuracy(store.drillResults).find((row) => row.topic === question.topic);

  return (
    <div className="stack">
      <div className="play-meta">
        <p className={`play-kicker ${tone}`}>
          {question.category} · {question.kind === "bonus" ? "Bonus" : "Toss-up"} · {question.format === "multipleChoice" ? "MC" : "SA"}
        </p>
        <p className="muted">{title} · {index + 1} / {list.length}{question.topic ? ` · ${question.topic}` : ""}</p>
        {seen > 0 ? (
          <button className="btn ghost" type="button" onClick={finishRound}>End round</button>
        ) : null}
      </div>
      <div className={`play-card ${tone}`}>
        <p className="stem">{question.questionText}</p>
        {timed && phase === "live" ? (
          <p className={`timer ${seconds <= 2 ? "urgent" : ""}`}>
            {clockOn ? `${seconds}s · ${limit}s official` : "Listening… clock starts after the read-aloud"}
          </p>
        ) : null}
        {!timed && phase !== "revealed" ? (
          <p className="muted">Study mode · no official clock.</p>
        ) : null}
        {store.parentReadsAloud && phase !== "revealed" ? (
          <p className="muted">Parent is reading. Answers stay hidden until Reveal.</p>
        ) : null}
        {timed && store.buzzerRoomCode ? (
          <p className="muted">Phone room {store.buzzerRoomCode} · remote buzz = Space</p>
        ) : null}
        <SpeechBar text={question.questionText} />
        {phase === "live" && timed ? (
          <div className="row">
            <button className="btn buzz" type="button" onClick={() => setPhase("buzzed")}>Buzz</button>
            <span className="muted">Space</span>
          </div>
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
        {store.parentReadsAloud && phase !== "revealed" ? (
          <button className="btn" type="button" onClick={() => setPhase("revealed")}>Reveal</button>
        ) : null}
        {showChoices ? (
          <div className="stack">
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
                  {choice.key}) {choice.text}
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
            <button className="btn ghost" type="button" onClick={() => grade(false)}>I missed it</button>
          </form>
        ) : null}
        {phase === "revealed" ? (
          <div className="stack">
            <p className={correct ? "ok-text" : "bad-text"}>
              <strong>{correct ? "Correct" : "Not quite"}.</strong> {question.answer}
            </p>
            {!correct ? <p className="muted">This miss is on your flashcards — due now, not a second copy.</p> : null}
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
            {article ? (
              <div className="card stack">
                <h3>Why this matters</h3>
                <p>{article.whatIsIt}</p>
                {books.primary ? <p className="muted">{books.primary}</p> : null}
                {books.book ? <p className="muted">{books.book}</p> : null}
                <div className="row">
                  <Link href={`/learn/${article.id}`}>Open {article.title}</Link>
                  <Link href="/learn/review">Review with books</Link>
                </div>
              </div>
            ) : null}
            {index < list.length - 1 || (correct === false && list[index + 1]?.kind === "bonus") ? (
              <button className="btn" type="button" onClick={next}>Next</button>
            ) : (
              <button className="btn" type="button" onClick={finishRound}>See results</button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
