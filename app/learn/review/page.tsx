"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { topics } from "@/lib/catalogs";
import { lookupLine, topicForWeakTitle } from "@/lib/readings";
import { isSchoolYear, schoolYearEncyclopediaSubject } from "@/lib/schedule";
import { topicAccuracy } from "@/lib/stats";
import { practiceSubjectFor, tossupTopicForEncyclopedia } from "@/lib/topic-map";
import { useStore } from "@/lib/store";
import type { EncyclopediaTopic } from "@/lib/types";

function practiceHref(topic: EncyclopediaTopic) {
  const tossupId = tossupTopicForEncyclopedia(topic.id);
  return tossupId
    ? `/practice/play?mode=topic&topic=${tossupId}`
    : `/practice/play?mode=subject&subject=${practiceSubjectFor(topic.subject)}`;
}

function TopicRow({
  topic,
  acc,
  attempts,
}: {
  topic: EncyclopediaTopic;
  acc?: number;
  attempts?: number;
}) {
  const books = lookupLine(topic.id);
  return (
    <div className="rest-item stack">
      <div className="row">
        <Link href={`/learn/${topic.id}`}><strong>{topic.title}</strong></Link>
        <span className="pill">{topic.subject}</span>
        {acc != null ? <span className="pill">{Math.round(acc * 100)}% · {attempts} tries</span> : null}
      </div>
      {books.primary ? <p>{books.primary}</p> : <p className="muted">No assigned section in the catalog — use the article, then drill.</p>}
      {books.book ? <p className="muted">{books.book}</p> : null}
      <div className="row">
        <Link className="btn ghost" href={`/learn/${topic.id}`}>Read</Link>
        <Link className="btn" href={practiceHref(topic)}>Practice</Link>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const store = useStore();
  const [showReviewed, setShowReviewed] = useState(false);
  const stats = topicAccuracy(store.drillResults);
  const todaySubject = schoolYearEncyclopediaSubject();

  const groups = useMemo(() => {
    const seen = new Set<string>();
    function take(list: EncyclopediaTopic[]) {
      return list.filter((topic) => {
        if (seen.has(topic.id)) return false;
        seen.add(topic.id);
        return true;
      });
    }

    const weakTopics = stats
      .filter((row) => row.acc < 0.7)
      .map((row) => {
        const topic = topicForWeakTitle(row.topic);
        return topic ? { topic, acc: row.acc, attempts: row.attempts } : null;
      })
      .filter((row): row is { topic: EncyclopediaTopic; acc: number; attempts: number } => Boolean(row));

    const weak = take(weakTopics.map((row) => row.topic));
    const earthEnergy = take(topics.filter((topic) => (
      (topic.subject === "Earth & Space Science" || topic.subject === "Energy")
      && !store.reviewedTopicIds.includes(topic.id)
    )));
    const today = todaySubject
      ? take(topics.filter((topic) => topic.subject === todaySubject && !store.reviewedTopicIds.includes(topic.id)))
      : [];
    const reviewed = topics.filter((topic) => store.reviewedTopicIds.includes(topic.id) && !seen.has(topic.id));

    return { weak, earthEnergy, today, reviewed, weakTopics };
  }, [stats, store.reviewedTopicIds, todaySubject]);

  function statsFor(topic: EncyclopediaTopic) {
    return groups.weakTopics.find((row) => row.topic.id === topic.id);
  }

  return (
    <div className="stack">
      <Link href="/learn">Back to Learn</Link>
      <div>
        <h1>Review</h1>
        <p className="muted">
          {isSchoolYear()
            ? "School year review. Open the section, then drill. Not a new chapter hour."
            : "Open the assigned section, then drill. Textbooks are a lookup tool."}
        </p>
      </div>
      <div className="row">
        <Link className="btn ghost" href="/topics">All topics</Link>
        <Link className="btn ghost" href="/learn/formulas">Formulas</Link>
      </div>
      <h2>Weak areas</h2>
      {groups.weak[0] ? groups.weak.map((topic) => {
        const row = statsFor(topic);
        return <TopicRow key={topic.id} topic={topic} acc={row?.acc} attempts={row?.attempts} />;
      }) : <p className="muted">Answer a few drills and weak topics will land here.</p>}
      <h2>Earth &amp; Energy · not reviewed</h2>
      {groups.earthEnergy[0] ? groups.earthEnergy.map((topic) => <TopicRow key={topic.id} topic={topic} />) : (
        <p className="muted">All Earth and Energy articles are marked reviewed.</p>
      )}
      {todaySubject ? (
        <>
          <h2>{todaySubject} · not reviewed</h2>
          {groups.today[0] ? groups.today.map((topic) => <TopicRow key={topic.id} topic={topic} />) : (
            <p className="muted">Nothing left unmarked in today&apos;s subject.</p>
          )}
        </>
      ) : null}
      {groups.reviewed.length ? (
        <div className="stack">
          <button className="btn ghost" type="button" onClick={() => setShowReviewed((value) => !value)}>
            {showReviewed ? "Hide reviewed" : `Show reviewed · ${groups.reviewed.length}`}
          </button>
          {showReviewed ? groups.reviewed.map((topic) => <TopicRow key={topic.id} topic={topic} />) : null}
        </div>
      ) : null}
    </div>
  );
}
