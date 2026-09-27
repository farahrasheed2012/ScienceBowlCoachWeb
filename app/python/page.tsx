"use client";

import Link from "next/link";
import {
  currentPythonTrack,
  firstOpenLesson,
  nextPythonLesson,
  pythonDoneCount,
  pythonGames,
  pythonLessons,
  pythonLevelTracks,
} from "@/lib/python";
import { useStore } from "@/lib/store";

export default function PythonHubPage() {
  const store = useStore();
  const done = new Set(store.pythonDoneIds);
  const next = nextPythonLesson(store.pythonDoneIds);
  const finished = pythonDoneCount(store.pythonDoneIds);
  const tracks = pythonLevelTracks(store.pythonDoneIds);
  const current = currentPythonTrack(store.pythonDoneIds);
  const week = next ? current.weeks.find((row) => row.lessonIds.includes(next.id)) : undefined;

  return (
    <div className="py-page">
      <div>
        <Link className="text-btn session-leave" href="/learn">Learn</Link>
        <p className="mission-kicker">Python Coach</p>
        <h1 className="session-title">{current.level.title} · {current.level.subtitle}</h1>
        <p className="muted">Read here. Type and Run on the Mac.</p>
        <p className="faint">{finished}/{pythonLessons.length} lessons</p>
      </div>

      {next ? (
        <section className="py-continue">
          <p className="mission-kicker">Continue</p>
          <h2 className="mission-hello">{week?.title ?? next.title}</h2>
          <p className="muted">{week?.goal ?? next.title}</p>
          {next.durationMinutes ? <p className="faint">~{next.durationMinutes} min</p> : null}
          <Link className="btn mission-cta" href={`/python/${next.id}`}>Continue lesson</Link>
        </section>
      ) : (
        <p className="muted">Every lesson is marked done. Open any week to review.</p>
      )}

      <section>
        <p className="mission-kicker">Your path</p>
        <div className="py-path">
          {tracks.map((track) => {
            const now = track.level.id === current.level.id && !track.complete;
            const mark = track.complete ? "✓" : now ? "●" : "○";
            const state = track.complete ? "is-done" : now ? "is-now" : "is-next";
            return (
              <a key={track.level.id} className={state} href={`#${track.level.id}`}>
                <span>{track.level.title}</span>
                <span className="faint">{mark} {track.marked}/{track.total}</span>
              </a>
            );
          })}
        </div>
      </section>

      {tracks.map((track) => {
        const now = track.level.id === current.level.id && !track.complete;
        const weeks = (
          <>
            {track.weeks.map((row) => {
              const count = row.lessonIds.filter((id) => done.has(id)).length;
              const href = `/python/${firstOpenLesson(row.lessonIds, store.pythonDoneIds)}`;
              const finishedWeek = count === row.lessonIds.length;
              return (
                <Link key={row.id} className={finishedWeek ? "learn-topic is-reviewed" : "learn-topic"} href={href}>
                  <span>{row.emoji} {row.title}</span>
                  <span className="faint">{count}/{row.lessonIds.length}</span>
                </Link>
              );
            })}
          </>
        );
        return (
          <section key={track.level.id} id={track.level.id} className="py-level">
            {now ? (
              <>
                <header className="learn-subject-head">
                  <p className="play-kicker">{track.level.title}</p>
                  <p className="faint">{track.level.subtitle} · {track.marked}/{track.total}</p>
                </header>
                {weeks}
              </>
            ) : (
              <details className="more-help">
                <summary>{track.level.title} · {track.level.subtitle}</summary>
                {weeks}
              </details>
            )}
          </section>
        );
      })}

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
