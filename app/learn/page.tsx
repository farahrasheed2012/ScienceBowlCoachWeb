"use client";

import Link from "next/link";
import { encyclopediaQuestions, NSB_SUBJECTS, regionalSprint, topics } from "@/lib/catalogs";
import { useStore } from "@/lib/store";

export default function LearnPage() {
  const store = useStore();
  const due = store.flashCards.filter((card) => new Date(card.due) <= new Date()).length;
  return (
    <div>
      <h1>Learn</h1>
      <p>Hi, {store.studentName}!</p>
      <p className="muted">{topics.length} NSB topics · 6 categories · {encyclopediaQuestions.length} encyclopedia questions plus TossUp drills in Practice.</p>
      <p className="muted">{store.reviewedTopicIds.length} reviewed · {store.encyclopediaStreak} day encyclopedia streak</p>
      <div className="row">
        <Link className="btn" href="/learn/flash">{due ? `Review ${due} flashcards` : "Flashcards"}</Link>
        <Link className="btn ghost" href="/topics">All topics</Link>
        <Link className="btn ghost" href="/elements">Elements</Link>
        <Link className="btn ghost" href="/weeks">Weeks</Link>
        <Link className="btn ghost" href="/calendar">Calendar</Link>
        <Link className="btn ghost" href="/mental-math">Mental Math</Link>
      </div>
      <div className="grid two">
        {NSB_SUBJECTS.map((subject) => {
          const list = topics.filter((t) => t.subject === subject);
          const reviewed = list.filter((t) => store.reviewedTopicIds.includes(t.id)).length;
          const withQ = list.filter((t) => encyclopediaQuestions.some((q) => q.topicId === t.id)).length;
          return (
            <div className="card stack" key={subject}>
              <h3>{subject}</h3>
              <p className="muted">{reviewed}/{list.length} reviewed · {withQ} with drills</p>
              {list.slice(0, 6).map((topic) => (
                <Link key={topic.id} href={`/learn/${topic.id}`}>{topic.title}</Link>
              ))}
              {list.length > 6 ? <p className="muted">+ {list.length - 6} more in Topics</p> : null}
            </div>
          );
        })}
      </div>
      <h2>Regional Sprint</h2>
      <p className="muted">Know-cold packs from the summer coach. Short answer, no clock-pressure bonus.</p>
      <div className="grid two">
        {regionalSprint.map((pack) => (
          <Link className="card stack" key={pack.id} href={`/practice/play?mode=sprint&id=${pack.id}`}>
            <h3>{pack.title}</h3>
            <p className="muted">{pack.subtitle}</p>
            <span className="btn">Drill {pack.tossups.length}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
