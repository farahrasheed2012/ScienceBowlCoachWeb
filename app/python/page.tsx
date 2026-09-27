"use client";

import Link from "next/link";
import { firstOpenLesson, nextPythonLesson, pythonDoneCount, pythonGames, pythonLessons, pythonLevels, pythonWeeks } from "@/lib/python";
import { useStore } from "@/lib/store";

export default function PythonHubPage() {
  const store = useStore();
  const done = new Set(store.pythonDoneIds);
  const next = nextPythonLesson(store.pythonDoneIds);
  const finished = pythonDoneCount(store.pythonDoneIds);
  const week = next ? pythonWeeks.find((row) => row.lessonIds.includes(next.id)) : undefined;

  return (
    <div className="learn-page">
      <div>
        <p className="mission-kicker">Python</p>
        <h1 className="session-title">Keep sharp</h1>
        <p className="muted">Read here. Type and Run in Python Coach on the Mac.</p>
        <p className="faint">{finished}/{pythonLessons.length} lessons marked done</p>
      </div>
      {next ? (
        <section className="learn-hero">
          <p className="mission-kicker">{week ? `${week.emoji} ${week.title}` : "Next lesson"}</p>
          <h2 className="session-title">{next.title}</h2>
          <p className="muted">{week?.goal}</p>
          <Link className="btn" href={`/python/${next.id}`}>Open lesson</Link>
        </section>
      ) : (
        <p className="muted">Every lesson is marked done here. Pick any week to review.</p>
      )}
      <div className="learn-subjects">
        {pythonLevels.map((level) => {
          const weeks = pythonWeeks.filter((week) => level.weeks.includes(week.id));
          const total = weeks.reduce((sum, week) => sum + week.lessonIds.length, 0);
          const marked = weeks.reduce((sum, week) => sum + week.lessonIds.filter((id) => done.has(id)).length, 0);
          return (
            <section key={level.id}>
              <p className="mission-kicker">{level.title}</p>
              <p className="faint">{level.subtitle} · {marked}/{total}</p>
              {weeks.map((week) => {
                const count = week.lessonIds.filter((id) => done.has(id)).length;
                const href = `/python/${firstOpenLesson(week.lessonIds, store.pythonDoneIds)}`;
                return (
                  <Link key={week.id} href={href}>
                    {week.emoji} {week.title}
                    <span className="faint"> · {count}/{week.lessonIds.length}</span>
                  </Link>
                );
              })}
            </section>
          );
        })}
      </div>
      <details className="more-help">
        <summary>Games · run on the Mac</summary>
        <div className="learn-sprint">
          <p className="faint">Starter code is here. pygame / Flask need the Mac playground.</p>
          {pythonGames.map((game) => (
            <p key={game.id}>
              <Link href={`/python/${game.id}`}>{game.title}</Link>
              <span className="faint"> · {game.summary}</span>
            </p>
          ))}
        </div>
      </details>
    </div>
  );
}
