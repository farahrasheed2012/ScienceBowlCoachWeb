"use client";

import Link from "next/link";
import { encyclopediaQuestions, NSB_SUBJECTS, topics } from "@/lib/catalogs";
import { useStore } from "@/lib/store";

export default function LearnPage() {
  const store = useStore();
  return (
    <div>
      <h1>Learn</h1>
      <p>Hi, {store.studentName}!</p>
      <p className="muted">{topics.length} NSB topics · 6 categories · {encyclopediaQuestions.length} practice questions including Hewitt Ch 17.</p>
      <p className="muted">{store.reviewedTopicIds.length} reviewed · {store.encyclopediaStreak} day encyclopedia streak</p>
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
    </div>
  );
}
