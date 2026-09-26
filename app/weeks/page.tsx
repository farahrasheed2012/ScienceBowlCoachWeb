"use client";

import Link from "next/link";
import { blocksForWeek, dayLabel, subjectLabel, weekTheme } from "@/lib/schedule";
import { useStore } from "@/lib/store";

export default function WeeksPage() {
  const store = useStore();
  const weeks = Array.from({ length: 12 }, (_, i) => i + 1);
  return (
    <div>
      <h1>Weeks</h1>
      <p className="muted">12-week summer plan · 50 science blocks · Jun 8 – Aug 28</p>
      {weeks.map((week) => (
        <section key={week}>
          <h2>Week {week} · {weekTheme(week)} {week === store.currentWeek ? "· now" : ""}</h2>
          <div className="grid two">
            {blocksForWeek(week).map((block) => (
              <div className="card" key={block.id}>
                <div className="row">
                  <span className={`pill ${block.subject}`}>{subjectLabel(block.subject)}</span>
                  <span className="muted">{dayLabel(block.day)}</span>
                </div>
                <h3>{block.chapterTitle}</h3>
                <p className="muted">{block.bookCode} {block.chapter}</p>
                <p>{block.focus}</p>
                <Link className="btn" href={`/practice/play?mode=block&id=${block.id}`}>Practice this block</Link>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
