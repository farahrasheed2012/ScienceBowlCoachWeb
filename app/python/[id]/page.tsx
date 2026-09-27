"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { PythonBody } from "@/components/PythonBody";
import {
  challengeMatches,
  levelForWeek,
  neighbors,
  pythonGame,
  pythonLesson,
  pythonLessonStages,
  weekForLesson,
} from "@/lib/python";
import { useStore } from "@/lib/store";

function BackToHub() {
  return <Link className="text-btn session-leave" href="/python">Back</Link>;
}

function CopyCode({ code }: { code: string }) {
  const [note, setNote] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setNote("Copied. Paste in Python Coach on the Mac.");
    } catch {
      setNote("Select the code and copy it.");
    }
  }
  return (
    <div className="stack">
      <pre><code>{code}</code></pre>
      <div className="row">
        <button className="btn ghost" type="button" onClick={copy}>Copy starter</button>
        {note ? <p className="faint">{note}</p> : null}
      </div>
    </div>
  );
}

function Challenge({
  question,
  lesson,
}: {
  question: string;
  lesson: NonNullable<ReturnType<typeof pythonLesson>>;
}) {
  const [guess, setGuess] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "bad">("idle");
  const [show, setShow] = useState(false);
  function check() {
    setState(challengeMatches(guess, lesson) ? "ok" : "bad");
  }
  return (
    <div className="stack">
      <p>{question}</p>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          check();
        }}
      >
        <input
          value={guess}
          onChange={(event) => {
            setGuess(event.target.value);
            setState("idle");
          }}
          placeholder="Type an answer"
        />
        <div className="row">
          <button className="btn" type="submit">Check</button>
          <button className="text-btn" type="button" onClick={() => setShow((value) => !value)}>
            {show ? "Hide answer" : "Show answer"}
          </button>
        </div>
      </form>
      {state === "ok" ? <p className="coach-history">Exactly.</p> : null}
      {state === "bad" ? <p className="muted">Not quite — try again, or peek the answer.</p> : null}
      {show && lesson.challengeAnswer ? <p className="muted">{lesson.challengeAnswer}</p> : null}
    </div>
  );
}

function Stage({
  id,
  n,
  label,
  children,
}: {
  id: string;
  n: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="py-stage" id={id}>
      <p className="play-kicker"><span className="py-stage-n">{n}</span> {label}</p>
      {children}
    </section>
  );
}

export default function PythonLessonPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const store = useStore();
  const lesson = pythonLesson(id);
  const game = pythonGame(id);

  if (game) {
    return (
      <div className="py-page">
        <div>
          <BackToHub />
          <p className="mission-kicker">Game</p>
          <h1 className="session-title">{game.title}</h1>
          <p className="muted">{game.summary}</p>
          <p className="faint">Read here. Run on the Mac.{game.weekNumber ? ` Week ${game.weekNumber}.` : ""}</p>
        </div>
        {game.skills.length ? <p className="faint">{game.skills.join(" · ")}</p> : null}
        {game.steps.length ? (
          <Stage id="try" n="01" label="Try it">
            <ol>
              {game.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </Stage>
        ) : null}
        {game.starterCode ? (
          <Stage id="build" n="02" label="Build it">
            <CopyCode code={game.starterCode} />
          </Stage>
        ) : null}
        {game.stretchGoal ? <p className="muted">Stretch: {game.stretchGoal}</p> : null}
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="py-page">
        <BackToHub />
        <p>Lesson not found.</p>
      </div>
    );
  }

  const week = weekForLesson(lesson.id);
  const level = week ? levelForWeek(week.id) : undefined;
  const done = store.pythonDoneIds.includes(lesson.id);
  const { prev, next } = neighbors(lesson.id);
  const { learn, see, stages } = pythonLessonStages(lesson);
  const num = (id: string) => stages.find((stage) => stage.id === id)?.n ?? "";

  return (
    <div className="py-page">
      <div>
        <BackToHub />
        <p className="mission-kicker">
          {level ? `${level.title} · ` : ""}
          {week ? week.title : "Lesson"}
        </p>
        <h1 className="session-title">{lesson.title}</h1>
        <p className="faint">Read here. Type and Run on the Mac.{lesson.durationMinutes ? ` · ~${lesson.durationMinutes} min` : ""}</p>
      </div>
      <nav className="py-steps" aria-label="Lesson steps">
        {stages.map((stage) => (
          <a key={stage.id} className="py-step" href={`#${stage.id}`}>
            {stage.n} {stage.label}
          </a>
        ))}
      </nav>
      {learn ? (
        <Stage id="learn" n={num("learn")} label="Learn">
          <PythonBody text={learn} />
        </Stage>
      ) : null}
      {see ? (
        <Stage id="see" n={num("see")} label="See it">
          <PythonBody text={see} />
        </Stage>
      ) : null}
      {lesson.tryItPrompt ? (
        <Stage id="try" n={num("try")} label="Try it">
          <p>{lesson.tryItPrompt}</p>
        </Stage>
      ) : null}
      {lesson.starterCode || lesson.practiceSteps.length ? (
        <Stage id="build" n={num("build")} label="Build it">
          {lesson.practiceSteps.length ? (
            <ol>
              {lesson.practiceSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          ) : null}
          {lesson.starterCode ? (
            <CopyCode code={lesson.starterCode} />
          ) : (
            <p className="muted">No starter file — this one is reading and paper first.</p>
          )}
        </Stage>
      ) : null}
      {lesson.challengeQuestion ? (
        <Stage id="prove" n={num("prove")} label="Prove it">
          <Challenge key={lesson.id} question={lesson.challengeQuestion} lesson={lesson} />
        </Stage>
      ) : null}
      <Stage id="finish" n={num("finish")} label="Finish">
        {lesson.teacherScript ? (
          <details className="more-help">
            <summary>Coach note</summary>
            <p className="muted">{lesson.teacherScript}</p>
          </details>
        ) : null}
        <div className="row">
          <button className="btn" type="button" onClick={() => store.togglePythonDone(lesson.id)}>
            {done ? "Done" : "Mark complete"}
          </button>
          {next ? <Link className="btn ghost" href={`/python/${next.id}`}>Next</Link> : <Link className="btn ghost" href="/python">Your path</Link>}
        </div>
        {prev ? <Link className="text-btn" href={`/python/${prev.id}`}>Previous · {prev.title}</Link> : null}
      </Stage>
    </div>
  );
}
