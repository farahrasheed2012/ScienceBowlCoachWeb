"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NSB_SUBJECTS, topics } from "@/lib/catalogs";
import { isSchoolYear, schoolYearEncyclopediaSubject, schoolYearFocus } from "@/lib/schedule";
import { topicAccuracy } from "@/lib/stats";
import { practiceSubjectFor, tossupTopicForEncyclopedia } from "@/lib/topic-map";
import { useStore } from "@/lib/store";

export default function TopicsPage() {
  const store = useStore();
  const schoolYear = isSchoolYear();
  const todaySubject = schoolYearEncyclopediaSubject();
  const today = schoolYearFocus();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(schoolYear ? (todaySubject ?? "") : "");
  const needle = q.trim().toLowerCase();
  const stats = topicAccuracy(store.drillResults);

  const coverage = useMemo(() => {
    if (!schoolYear) return [];
    return topics.filter((topic) => {
      const gap = topic.subject === "Earth & Space Science" || topic.subject === "Energy";
      return gap && !store.reviewedTopicIds.includes(topic.id);
    });
  }, [schoolYear, store.reviewedTopicIds]);

  function rowFor(title: string) {
    const needleTitle = title.toLowerCase();
    return stats.find((row) => row.topic.toLowerCase() === needleTitle)
      ?? stats.find((row) => row.topic.toLowerCase().includes(needleTitle) && title.length > 4);
  }

  const subjects = filter ? NSB_SUBJECTS.filter((subject) => subject === filter) : NSB_SUBJECTS;

  return (
    <div className="stack">
      <Link href="/learn">Back to Learn</Link>
      <div>
        <h1>Topics</h1>
        <p className="muted">
          {schoolYear
            ? "School year · pin Earth & Energy (summer skipped them) or today's subject."
            : "Official MS NSB topic areas — Life Science, Physical Science, and the rest of the six encyclopedia categories."}
        </p>
        <Link className="btn ghost" href="/learn/review">Review with books</Link>
      </div>
      {schoolYear && !todaySubject ? (
        <div className="card stack">
          <h3>Weekend coverage · Earth & Energy</h3>
          <p className="muted">{coverage.length} articles not marked reviewed yet.</p>
          <div className="row">
            <button className="btn" type="button" onClick={() => setFilter("Earth & Space Science")}>Earth & Space</button>
            <button className="btn ghost" type="button" onClick={() => setFilter("Energy")}>Energy</button>
            <Link className="btn ghost" href={today.href}>Mixed toss-up</Link>
          </div>
        </div>
      ) : null}
      <div className="row">
        <button className={`btn ${filter === "" ? "" : "ghost"}`} type="button" onClick={() => setFilter("")}>All</button>
        {NSB_SUBJECTS.map((subject) => (
          <button
            key={subject}
            className={`btn ${filter === subject ? "" : "ghost"}`}
            type="button"
            onClick={() => setFilter(subject)}
          >
            {subject}{todaySubject === subject ? " · today" : ""}
          </button>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search topics"
        aria-label="Search topics"
      />
      {subjects.map((subject) => {
        const list = topics
          .filter((t) => t.subject === subject && (
            !needle
            || t.title.toLowerCase().includes(needle)
            || t.whatIsIt.toLowerCase().includes(needle)
          ))
          .sort((a, b) => {
            const aRow = rowFor(a.title);
            const bRow = rowFor(b.title);
            const aWeak = aRow && aRow.acc < 0.7 ? 0 : 1;
            const bWeak = bRow && bRow.acc < 0.7 ? 0 : 1;
            if (aWeak !== bWeak) return aWeak - bWeak;
            const aRev = store.reviewedTopicIds.includes(a.id) ? 1 : 0;
            const bRev = store.reviewedTopicIds.includes(b.id) ? 1 : 0;
            return aRev - bRev;
          });
        if (!list.length) return null;
        return (
          <section key={subject}>
            <h2>{subject} · {list.length}{todaySubject === subject ? " · today" : ""}</h2>
            <div className="stack">
              {list.map((topic) => {
                const tossupId = tossupTopicForEncyclopedia(topic.id);
                const practiceHref = tossupId
                  ? `/practice/play?mode=topic&topic=${tossupId}`
                  : `/practice/play?mode=subject&subject=${practiceSubjectFor(topic.subject)}`;
                const reviewed = store.reviewedTopicIds.includes(topic.id);
                const row = rowFor(topic.title);
                return (
                  <div className="card stack" key={topic.id}>
                    <div className="row">
                      <Link href={`/learn/${topic.id}`}><strong>{topic.title}</strong></Link>
                      {row && row.acc < 0.7 ? <span className="pill">{Math.round(row.acc * 100)}% · needs drill</span> : null}
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
