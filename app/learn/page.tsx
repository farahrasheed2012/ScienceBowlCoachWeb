"use client";

import Link from "next/link";
import { encyclopediaQuestions, NSB_SUBJECTS, regionalSprint, topics } from "@/lib/catalogs";
import { dayLine, isSchoolYear, schoolYearFocus, timeGreeting } from "@/lib/schedule";
import { topicAccuracy } from "@/lib/stats";
import { subjectTone } from "@/lib/questions";
import { articleForLabel, practiceSubjectFor } from "@/lib/topic-map";
import { useStore } from "@/lib/store";

export default function LearnPage() {
  const store = useStore();
  const schoolYear = isSchoolYear();
  const today = schoolYearFocus();
  const due = store.flashCards.filter((card) => new Date(card.due) <= new Date()).length;
  const weak = topicAccuracy(store.drillResults).find((row) => row.acc < 0.7);
  const weakArticle = weak ? articleForLabel(weak.topic) : undefined;
  return (
    <div className="learn-page">
      <div>
        <p className="mission-hello">{timeGreeting(store.studentName)}</p>
        <p className="faint">{dayLine()}</p>
      </div>
      {weak ? (
        <section className="learn-hero">
          <p className="mission-kicker">Needs review</p>
          <h1 className="session-title">{weak.topic}</h1>
          <p className="muted">{Math.round(weak.acc * 100)}% after {weak.attempts} {weak.attempts === 1 ? "try" : "tries"}</p>
          <div className="row">
            <Link className="btn" href={`/practice/play?mode=weak&topic=${encodeURIComponent(weak.topic)}`}>Practice this</Link>
            {weakArticle ? <Link className="text-btn" href={`/learn/${weakArticle.id}`}>Read the article</Link> : (
              <Link className="text-btn" href={`/practice/play?mode=subject&subject=${practiceSubjectFor(weak.subject)}`}>Open subject</Link>
            )}
          </div>
        </section>
      ) : schoolYear ? (
        <section className="learn-hero">
          <p className="mission-kicker">Keep sharp</p>
          <h1 className="session-title">{today.label}</h1>
          <p className="muted">
            {today.subject === "earth" || today.subject === "energy"
              ? "Not on the summer pass. Read an article, then drill."
              : "One keep-sharp session. Not a new chapter."}
          </p>
          <Link className="btn" href={today.href}>Practice {today.label}</Link>
        </section>
      ) : (
        <p className="muted">Follow the summer block, then drill.</p>
      )}
      <nav className="secondary-links">
        <Link href="/learn/flash">{due ? `${due} flashcards due` : "Flashcards"}</Link>
        <Link href="/learn/review">Review with books</Link>
        <Link href="/topics">All topics</Link>
        <Link href="/learn/formulas">Formulas</Link>
        <Link href="/elements">Elements</Link>
        <Link href="/weeks">Weeks</Link>
        <Link href="/calendar">Calendar</Link>
        <Link href="/mental-math">Mental math</Link>
      </nav>
      <p className="faint">
        {store.reviewedTopicIds.length} reviewed · {topics.length} topics · {encyclopediaQuestions.length} encyclopedia questions
        {store.encyclopediaStreak ? ` · ${store.encyclopediaStreak} day streak` : ""}
      </p>
      <div className="learn-subjects">
        {NSB_SUBJECTS.map((subject) => {
          const list = topics.filter((t) => t.subject === subject);
          const reviewed = list.filter((t) => store.reviewedTopicIds.includes(t.id)).length;
          const tone = subject === "Energy" ? "energy" : subjectTone(subject);
          return (
            <section key={subject} className={`learn-subject ${tone}`}>
              <header className="learn-subject-head">
                <p className={`play-kicker ${tone}`}>{subject}</p>
                <p className="faint">{reviewed}/{list.length}</p>
              </header>
              {list.slice(0, 6).map((topic) => {
                const seen = store.reviewedTopicIds.includes(topic.id);
                return (
                  <Link
                    key={topic.id}
                    className={seen ? "learn-topic is-reviewed" : "learn-topic"}
                    href={`/learn/${topic.id}`}
                  >
                    <span>{topic.title}</span>
                    {seen ? <span className="faint">Reviewed</span> : null}
                  </Link>
                );
              })}
              {list.length > 6 ? (
                <Link className="learn-topic learn-more" href="/topics">+ {list.length - 6} more</Link>
              ) : null}
            </section>
          );
        })}
      </div>
      <details className="more-help">
        <summary>Regional Sprint</summary>
        <div className="learn-sprint">
          <p className="faint">Texas regional depth — school-year reading, not another summer chapter.</p>
          {regionalSprint.map((pack) => {
            const article = articleForLabel(pack.title, false);
            return (
              <p key={pack.id}>
                <Link href={`/practice/play?mode=sprint&id=${pack.id}`}>{pack.title}</Link>
                <span className="faint"> · {pack.tossups.length} toss-ups</span>
                {article ? <> · <Link href={`/learn/${article.id}`}>Article</Link></> : null}
              </p>
            );
          })}
        </div>
      </details>
    </div>
  );
}
