"use client";

import Link from "next/link";
import { useState } from "react";
import { NSB_SUBJECTS, topics } from "@/lib/catalogs";
import { practiceSubjectFor, tossupTopicForEncyclopedia } from "@/lib/topic-map";
import { useStore } from "@/lib/store";

export default function TopicsPage() {
  const store = useStore();
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();

  return (
    <div className="stack">
      <Link href="/learn">Back to Learn</Link>
      <div>
        <h1>Topics</h1>
        <p className="muted">Official MS NSB topic areas — Life Science, Physical Science, and the rest of the six encyclopedia categories.</p>
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search topics"
        aria-label="Search topics"
      />
      {NSB_SUBJECTS.map((subject) => {
        const list = topics.filter((t) => t.subject === subject && (
          !needle
          || t.title.toLowerCase().includes(needle)
          || t.whatIsIt.toLowerCase().includes(needle)
        ));
        if (!list.length) return null;
        return (
          <section key={subject}>
            <h2>{subject} · {list.length}</h2>
            <div className="stack">
              {list.map((topic) => {
                const tossupId = tossupTopicForEncyclopedia(topic.id);
                const practiceHref = tossupId
                  ? `/practice/play?mode=topic&topic=${tossupId}`
                  : `/practice/play?mode=subject&subject=${practiceSubjectFor(topic.subject)}`;
                const reviewed = store.reviewedTopicIds.includes(topic.id);
                return (
                  <div className="card stack" key={topic.id}>
                    <div className="row">
                      <Link href={`/learn/${topic.id}`}><strong>{topic.title}</strong></Link>
                      {reviewed ? <span className="pill">Reviewed</span> : null}
                    </div>
                    <p className="muted">{topic.whatIsIt}</p>
                    <div className="row">
                      <Link className="btn ghost" href={`/learn/${topic.id}`}>Read</Link>
                      <Link className="btn" href={practiceHref}>Practice</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
