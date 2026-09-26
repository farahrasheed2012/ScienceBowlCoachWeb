"use client";

import Link from "next/link";
import { NSB_SUBJECTS, topics } from "@/lib/catalogs";

export default function TopicsPage() {
  return (
    <div>
      <h1>Topics</h1>
      <p className="muted">Official MS NSB topic areas — Life Science, Physical Science, and the rest of the six encyclopedia categories.</p>
      {NSB_SUBJECTS.map((subject) => {
        const list = topics.filter((t) => t.subject === subject);
        return (
          <section key={subject}>
            <h2>{subject} · {list.length}</h2>
            <div className="stack">
              {list.map((topic) => (
                <Link className="card" key={topic.id} href={`/learn/${topic.id}`}>
                  <strong>{topic.title}</strong>
                  <p className="muted">{topic.whatIsIt}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
