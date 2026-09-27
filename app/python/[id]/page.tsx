"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PythonBody } from "@/components/PythonBody";
import {
  challengeMatches,
  levelForWeek,
  neighbors,
  pythonGame,
  pythonLesson,
  weekForLesson,
} from "@/lib/python";
import { useStore } from "@/lib/store";

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
    <section className="stack">
      <p className="mission-kicker">Quick check</p>
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
      <div className="learn-page">
        <div>
          <Link href="/python">Python</Link>
          <p className="mission-kicker">Game</p>
          <h1 className="session-title">{game.title}</h1>
          <p className="muted">{game.summary}</p>
          <p className="faint">Read here. Run in Python Coach on the Mac.{game.weekNumber ? ` Week ${game.weekNumber}.` : ""}</p>
        </div>
        {game.skills.length ? <p className="faint">{game.skills.join(" · ")}</p> : null}
        {game.steps.length ? (
          <ol>
            {game.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        ) : null}
        {game.starterCode ? <CopyCode code={game.starterCode} /> : null}
        {game.stretchGoal ? <p className="muted">Stretch: {game.stretchGoal}</p> : null}
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="learn-page">
        <p>Lesson not found.</p>
        <Link href="/python">Back to Python</Link>
      </div>
    );
  }

  const week = weekForLesson(lesson.id);
  const level = week ? levelForWeek(week.id) : undefined;
  const done = store.pythonDoneIds.includes(lesson.id);
  const { prev, next } = neighbors(lesson.id);

  return (
    <div className="learn-page">
      <div>
        <Link href="/python">Python</Link>
        <p className="mission-kicker">
          {level ? `${level.title} · ` : ""}
          {week ? `${week.emoji} ${week.title}` : "Lesson"}
        </p>
        <h1 className="session-title">{lesson.title}</h1>
        <p className="faint">Read here. Type and Run on the Mac.{lesson.durationMinutes ? ` · ~${lesson.durationMinutes} min` : ""}</p>
      </div>
      <PythonBody text={lesson.body} />
      {lesson.tryItPrompt ? (
        <section>
          <p className="mission-kicker">Try it</p>
          <p>{lesson.tryItPrompt}</p>
        </section>
      ) : null}
      {lesson.practiceSteps.length ? (
        <section>
          <p className="mission-kicker">Do this</p>
          <ol>
            {lesson.practiceSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </section>
      ) : null}
      {lesson.starterCode ? (
        <section className="stack">
          <p className="mission-kicker">Starter · Mac Playground</p>
          <CopyCode code={lesson.starterCode} />
        </section>
      ) : (
        <p className="muted">No starter file — this one is reading and paper first.</p>
      )}
      {lesson.challengeQuestion ? (
        <Challenge key={lesson.id} question={lesson.challengeQuestion} lesson={lesson} />
      ) : null}
      {lesson.teacherScript ? (
        <details className="more-help">
          <summary>Coach note</summary>
          <p className="muted">{lesson.teacherScript}</p>
        </details>
      ) : null}
      <div className="row">
        <button className="btn" type="button" onClick={() => store.togglePythonDone(lesson.id)}>
          {done ? "Done" : "Mark done"}
        </button>
        {next ? <Link className="btn ghost" href={`/python/${next.id}`}>Next</Link> : <Link className="btn ghost" href="/python">All weeks</Link>}
      </div>
      {prev ? <Link href={`/python/${prev.id}`}>Previous · {prev.title}</Link> : null}
    </div>
  );
}
