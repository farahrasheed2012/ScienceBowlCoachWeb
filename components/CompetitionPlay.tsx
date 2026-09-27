"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { answersMatch, buildCompetitionPairs, isChoiceCorrect, subjectTone } from "@/lib/questions";
import { pct, studentReadiness } from "@/lib/readiness";
import { useStore } from "@/lib/store";
import type { DoeQuestion, PlayQuestion } from "@/lib/types";

type Scene = "tossup" | "bonus" | "dead" | "half" | "final";
type Phase = "live" | "buzzed" | "revealed";

function fieldTakes(neg: boolean) {
  const toss = Math.random() < (neg ? 0.6 : 0.45);
  if (!toss) return { toss: false, bonus: false };
  return { toss: true, bonus: Math.random() < 0.32 };
}

export function CompetitionPlay({ importedDoe }: { importedDoe: DoeQuestion[] }) {
  const store = useStore();
  const pairs = useMemo(() => buildCompetitionPairs(importedDoe), [importedDoe]);
  const [index, setIndex] = useState(0);
  const [scene, setScene] = useState<Scene>("tossup");
  const [phase, setPhase] = useState<Phase>("live");
  const [seconds, setSeconds] = useState(5);
  const [you, setYou] = useState(0);
  const [field, setField] = useState(0);
  const [negs, setNegs] = useState(0);
  const [tossupHits, setTossupHits] = useState(0);
  const [tossupAsked, setTossupAsked] = useState(0);
  const [bonusHits, setBonusHits] = useState(0);
  const [bonusAsked, setBonusAsked] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [fieldNote, setFieldNote] = useState("");
  const [sawHalf, setSawHalf] = useState(false);
  const startedAt = useRef(Date.now());
  const clockStartedAt = useRef(Date.now());
  const buzzedAtSec = useRef<number | null>(null);
  const didBuzz = useRef(false);
  const logged = useRef(false);
  const timedOut = useRef(false);
  const pair = pairs[index];
  const question: PlayQuestion | undefined = scene === "bonus" ? pair?.bonus : pair?.tossup;
  const half = index < 8 ? 1 : 2;
  const inHalf = index < 8 ? index + 1 : index - 7;

  function elapsed() {
    return (Date.now() - clockStartedAt.current) / 1000;
  }

  function resetClock(limit: number) {
    timedOut.current = false;
    clockStartedAt.current = Date.now();
    setSeconds(limit);
  }

  function log(target: PlayQuestion, isCorrect: boolean, kind: "tossup" | "bonus", timedOutFlag: boolean, allowed: number) {
    store.recordAnswer({
      questionId: target.id,
      topic: target.topic,
      subject: target.category,
      correct: isCorrect,
      prompt: target.questionText,
      answer: target.answer,
      kind,
      format: target.format,
      timed: true,
      buzzed: kind === "tossup" ? didBuzz.current : false,
      timedOut: timedOutFlag,
      secondsUsed: elapsed(),
      secondsAllowed: allowed,
      buzzedAtSec: buzzedAtSec.current ?? undefined,
    });
  }

  function applyField(neg: boolean) {
    const take = fieldTakes(neg);
    if (!take.toss) {
      setFieldNote("The field let it die.");
      return;
    }
    setField((score) => score + 4 + (take.bonus && pair?.bonus ? 10 : 0));
    setFieldNote(take.bonus && pair?.bonus ? "The field converted the toss-up and the bonus." : "The field converted the toss-up.");
  }

  function nextPair() {
    const next = index + 1;
    if (next === 8 && !sawHalf) {
      setSawHalf(true);
      setScene("half");
      return;
    }
    if (next >= pairs.length) {
      finish();
      return;
    }
    setIndex(next);
    didBuzz.current = false;
    buzzedAtSec.current = null;
    setPicked(null);
    setTyped("");
    setCorrect(null);
    setFieldNote("");
    setScene("tossup");
    setPhase("live");
    resetClock(5);
  }

  function finish() {
    if (!logged.current) {
      logged.current = true;
      store.recordRound({
        title: "Competition Mode",
        asked: tossupAsked + bonusAsked,
        correct: tossupHits + bonusHits,
        seconds: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
      });
    }
    setScene("final");
  }

  function leaveHalf() {
    setIndex(8);
    didBuzz.current = false;
    buzzedAtSec.current = null;
    setPicked(null);
    setTyped("");
    setCorrect(null);
    setFieldNote("");
    setScene("tossup");
    setPhase("live");
    resetClock(5);
  }

  function buzz() {
    if (scene !== "tossup" || phase !== "live") return;
    didBuzz.current = true;
    buzzedAtSec.current = elapsed();
    setPhase("buzzed");
    resetClock(5);
  }

  function gradeTossup(isCorrect: boolean, timedOutFlag = false) {
    if (!pair || phase === "revealed") return;
    setCorrect(isCorrect);
    setPhase("revealed");
    setTossupAsked((n) => n + 1);
    log(pair.tossup, isCorrect, "tossup", timedOutFlag, 5);
    if (isCorrect) {
      setYou((score) => score + 4);
      setTossupHits((n) => n + 1);
      setFieldNote("");
    } else {
      if (didBuzz.current) {
        setYou((score) => score - 4);
        setNegs((n) => n + 1);
        applyField(true);
      } else {
        applyField(false);
      }
    }
  }

  function gradeBonus(isCorrect: boolean, timedOutFlag = false) {
    if (!pair?.bonus || phase === "revealed") return;
    setCorrect(isCorrect);
    setPhase("revealed");
    setBonusAsked((n) => n + 1);
    log(pair.bonus, isCorrect, "bonus", timedOutFlag, 20);
    if (isCorrect) {
      setYou((score) => score + 10);
      setBonusHits((n) => n + 1);
    }
  }

  function continueAfterReveal() {
    if (scene === "tossup" && correct && pair?.bonus) {
      setPicked(null);
      setTyped("");
      setCorrect(null);
      setScene("bonus");
      setPhase("live");
      resetClock(20);
      return;
    }
    nextPair();
  }

  useEffect(() => {
    if (scene !== "tossup" && scene !== "bonus") return;
    if (phase === "revealed") return;
    const id = window.setInterval(() => {
      setSeconds((left) => (left <= 1 ? 0 : left - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [scene, phase, index]);

  useEffect(() => {
    if (seconds > 0 || timedOut.current || !pair) return;
    if (scene === "tossup" && phase === "live") {
      timedOut.current = true;
      setScene("dead");
      setTossupAsked((n) => n + 1);
      log(pair.tossup, false, "tossup", true, 5);
      applyField(false);
    } else if (scene === "tossup" && phase === "buzzed") {
      timedOut.current = true;
      gradeTossup(false, true);
    } else if (scene === "bonus" && phase === "live") {
      timedOut.current = true;
      gradeBonus(false, true);
    }
  }, [seconds, scene, phase, index]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (scene === "tossup" && phase === "live" && (event.code === "Space" || event.key === " ")) {
        event.preventDefault();
        buzz();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!pair) {
    return (
      <div className="learn-page">
        <p>Not enough toss-up/bonus pairs for a match.</p>
        <Link href="/practice">Back to Practice</Link>
      </div>
    );
  }

  if (scene === "half") {
    return (
      <div className="learn-page view-in">
        <p className="mission-kicker">Halftime</p>
        <h1 className="session-title">You {you} · Field {field}</h1>
        <p className="muted">Second half · 8 toss-ups. Official 5s buzz window, 20s bonus.</p>
        <button className="btn mission-cta" type="button" onClick={leaveHalf}>Start second half</button>
      </div>
    );
  }

  if (scene === "final") {
    const ready = studentReadiness(store.drillResults);
    return (
      <div className="learn-page view-in">
        <p className="mission-kicker">Final</p>
        <h1 className="session-title">You {you} · Field {field}</h1>
        <p className="muted">
          Toss-ups {tossupHits}/{tossupAsked}
          {bonusAsked ? ` · bonuses ${bonusHits}/${bonusAsked}` : ""}
          {negs ? ` · ${negs} neg${negs === 1 ? "" : "s"}` : ""}
        </p>
        {ready.overall != null ? <p className="faint">Readiness {pct(ready.overall)}</p> : null}
        <div className="row">
          <Link className="btn mission-cta" href="/practice/compete">Play again</Link>
          <Link className="btn ghost" href="/progress">Progress</Link>
        </div>
      </div>
    );
  }

  if (scene === "dead") {
    return (
      <div className="learn-page view-in">
        <p className="faint">You {you} · Field {field}</p>
        <p className="reveal-verdict">No buzz</p>
        <p className="muted">{fieldNote || "The toss-up died."}</p>
        <p className="muted">The answer is {pair.tossup.answer}.</p>
        <button className="btn mission-cta" type="button" onClick={nextPair}>Next toss-up</button>
      </div>
    );
  }

  const tone = question ? subjectTone(question.category) : "bio";
  const answering = scene === "bonus" || phase === "buzzed" || phase === "revealed";
  const showChoices = Boolean(question && question.format === "multipleChoice" && answering);
  const showTyped = Boolean(question && question.format === "shortAnswer" && answering && phase !== "revealed");

  return (
    <div className="learn-page view-in">
      <Link className="text-btn session-leave" href="/practice">Leave</Link>
      <div className="compete-bar">
        <p className="stem">You {you}</p>
        <p className="stem">Field {field}</p>
      </div>
      <p className="faint">Half {half} · toss-up {inHalf}/8 · +4 / −4 / +10</p>
      {question ? (
        <div className={`play-card q-enter ${tone}`} data-phase={phase}>
          <div className="play-meta">
            <p className={`play-kicker ${tone}`}>{scene === "bonus" ? "Bonus" : "Toss-up"} · {question.category}</p>
            {phase !== "revealed" ? (
              <p className={`timer ${seconds <= 2 ? "urgent" : ""}`}>{String(seconds).padStart(2, "0")}s</p>
            ) : null}
          </div>
          <p className="stem">{question.questionText}</p>
          {scene === "tossup" && phase === "live" ? (
            <button className="btn buzz" type="button" onClick={buzz}>Space · Buzz</button>
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
                    onClick={() => {
                      setPicked(choice.key);
                      if (scene === "bonus") gradeBonus(isRight);
                      else gradeTossup(isRight);
                    }}
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
              onSubmit={(event) => {
                event.preventDefault();
                const ok = answersMatch(question.answer, typed);
                if (scene === "bonus") gradeBonus(ok);
                else gradeTossup(ok);
              }}
            >
              <input value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="Answer" autoFocus />
              <button className="btn" type="submit">Answer</button>
            </form>
          ) : null}
          {phase === "revealed" ? (
            <div className="reveal-block">
              <p className={`reveal-verdict ${correct ? "ok-text" : "bad-text"}`}>
                {correct ? (scene === "bonus" ? "Bonus" : "+4") : scene === "tossup" && didBuzz.current ? "Neg" : "Not quite"}
              </p>
              {!correct ? <p className="reveal-note muted">The answer is {question.answer}.</p> : null}
              {fieldNote ? <p className="muted">{fieldNote}</p> : null}
              {scene === "tossup" && correct && pair.bonus ? (
                <p className="muted">Your team earned this bonus. 20 seconds. 10 points.</p>
              ) : null}
              <button className="btn mission-cta reveal-next" type="button" onClick={continueAfterReveal}>
                {scene === "tossup" && correct && pair.bonus ? "Start bonus" : "Next toss-up"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
