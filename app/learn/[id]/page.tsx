"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { encyclopediaQuestions, topics } from "@/lib/catalogs";
import { QuestionPlay } from "@/components/QuestionPlay";
import { encyclopediaToPlay } from "@/lib/questions";
import { readingRoleLabel, readingsFor } from "@/lib/readings";
import { missesForArticle, practiceSubjectFor, tossupTopicForEncyclopedia } from "@/lib/topic-map";
import { useStore } from "@/lib/store";

export default function LearnTopicPage() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const [cardNote, setCardNote] = useState("");
  const topic = topics.find((t) => t.id === id);
  if (!topic) return <p>Topic not found.</p>;
  const article = topic;
  const questions = encyclopediaQuestions.filter((q) => q.topicId === article.id).map(encyclopediaToPlay);
  const readings = readingsFor(article.id);
  const tossupId = tossupTopicForEncyclopedia(article.id);
  const practiceHref = tossupId
    ? `/practice/play?mode=topic&topic=${tossupId}`
    : `/practice/play?mode=subject&subject=${practiceSubjectFor(article.subject)}`;
  const reviewed = store.reviewedTopicIds.includes(article.id);
  const missCount = missesForArticle(article.title, store.encyclopediaWrong, article.id);
  const existing = new Set(store.flashCards.map((card) => `${card.prompt}::${card.answer}`));
  const newTerms = article.keyTerms.filter((term) => !existing.has(`${term.term}::${term.definition}`));

  function makeCards() {
    const added = store.addFlashCards(
      article.keyTerms.map((term) => ({
        subject: article.subject,
        topic: article.title,
        prompt: term.term,
        answer: term.definition,
      })),
    );
    setCardNote(added ? `Added ${added} card${added === 1 ? "" : "s"}.` : "Those cards are already in your deck.");
    store.markReviewed(article.id);
  }

  return (
    <div className="stack">
      <Link href="/learn">Back to Learn</Link>
      <h1>{topic.title}</h1>
      <p className="muted">{topic.subject}</p>
      {missCount ? (
        <p className="muted">{missCount} misses on this title — drill it before marking reviewed.</p>
      ) : null}
      <div className="row">
        <button className="btn ghost" type="button" onClick={() => store.markReviewed(article.id)}>
          {reviewed ? "Reviewed" : "Mark reviewed"}
        </button>
        <Link className="btn" href={practiceHref}>Practice this topic</Link>
        {questions.length > 0 ? <Link className="btn ghost" href={`/practice/play?mode=encyclopedia&topicId=${topic.id}`}>Quiz the article</Link> : null}
        <button className="btn ghost" type="button" onClick={makeCards}>
          {newTerms.length ? `Make ${newTerms.length} flashcards` : "Flashcards added"}
        </button>
        <Link className="btn ghost" href="/learn/flash">Review cards</Link>
      </div>
      {cardNote ? <p className="muted">{cardNote}</p> : null}
      {readings.length > 0 ? (
        <section className="card stack">
          <h3>Assigned reading</h3>
          <p className="muted">Open the section, then drill. Not the whole chapter unless that is the section.</p>
          {readings.map((reading) => (
            <p key={`${reading.role}-${reading.label}`}>
              <span className="pill">{readingRoleLabel(reading.role)}</span> {reading.bookCode} — {reading.label}
            </p>
          ))}
        </section>
      ) : null}
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
      {topic.relatedTopics.length > 0 ? (
        <section className="card stack">
          <h3>Related</h3>
          {topic.relatedTopics.map((rel) => {
            const other = topics.find((t) => t.id === rel);
            return other ? <Link key={rel} href={`/learn/${rel}`}>{other.title}</Link> : <span key={rel}>{rel}</span>;
          })}
        </section>
      ) : null}
      {questions.length > 0 ? <QuestionPlay questions={questions} title="Practice this topic" timed={false} /> : <p className="muted">No authored article drills yet. Use Practice this topic for TossUp questions.</p>}
      <section className="card stack">
        <h3>Review</h3>
        <p className="muted">{reviewed ? "You marked this topic reviewed. Next: practice, then a related article." : "Read the article, practice, then mark it reviewed."}</p>
        {!reviewed ? <button className="btn" type="button" onClick={() => store.markReviewed(topic.id)}>I understand this topic</button> : null}
        {topic.relatedTopics[0] ? (
          <Link className="btn ghost" href={`/learn/${topic.relatedTopics[0]}`}>
            Next article{topics.find((t) => t.id === topic.relatedTopics[0]) ? ` · ${topics.find((t) => t.id === topic.relatedTopics[0])?.title}` : ""}
          </Link>
        ) : null}
        <Link href="/learn/review">Review with books</Link>
        <Link href="/progress">See what you are weak at</Link>
        <Link href="/learn/flash">Review flashcards</Link>
      </section>
    </div>
  );
}
