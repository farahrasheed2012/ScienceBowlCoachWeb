"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { encyclopediaQuestions, topicReadings, topics } from "@/lib/catalogs";
import { QuestionPlay } from "@/components/QuestionPlay";
import { encyclopediaToPlay } from "@/lib/questions";
import { useStore } from "@/lib/store";

export default function LearnTopicPage() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const topic = topics.find((t) => t.id === id);
  if (!topic) return <p>Topic not found.</p>;
  const questions = encyclopediaQuestions.filter((q) => q.topicId === topic.id).map(encyclopediaToPlay);
  const readings = topicReadings[topic.id] ?? [];
  return (
    <div className="stack">
      <Link href="/learn">Back to Learn</Link>
      <h1>{topic.title}</h1>
      <p className="muted">{topic.subject}</p>
      <button className="btn ghost" type="button" onClick={() => store.markReviewed(topic.id)}>
        {store.reviewedTopicIds.includes(topic.id) ? "Reviewed" : "Mark reviewed"}
      </button>
      <section className="card stack">
        <h3>What is it</h3>
        <p>{topic.whatIsIt}</p>
        <h3>How it works</h3>
        <p>{topic.howItWorks}</p>
        <h3>Real-world example</h3>
        <p>{topic.realWorldExample}</p>
      </section>
      <section className="card stack">
        <h3>Key terms</h3>
        {topic.keyTerms.map((term) => (
          <p key={term.term}><strong>{term.term}.</strong> {term.definition}</p>
        ))}
      </section>
      <section className="card stack">
        <h3>NSB traps</h3>
        {topic.nsbTraps.map((trap) => <p key={trap}>{trap}</p>)}
        <h3>Did you know</h3>
        {topic.didYouKnow.map((fact) => <p key={fact}>{fact}</p>)}
      </section>
      {readings.length > 0 ? (
        <section className="card stack">
          <h3>Assigned reading</h3>
          {readings.map((r) => <p key={r.label}><span className="pill">{r.role}</span> {r.bookCode} — {r.label}</p>)}
        </section>
      ) : null}
      {topic.relatedTopics.length > 0 ? (
        <section className="card stack">
          <h3>Related</h3>
          {topic.relatedTopics.map((rel) => {
            const other = topics.find((t) => t.id === rel);
            return other ? <Link key={rel} href={`/learn/${rel}`}>{other.title}</Link> : <span key={rel}>{rel}</span>;
          })}
        </section>
      ) : null}
      {questions.length > 0 ? <QuestionPlay questions={questions} title="Practice this topic" /> : <p className="muted">No authored drills on this topic yet.</p>}
    </div>
  );
}
