"use client";

import Link from "next/link";
import { encyclopediaQuestions, NSB_SUBJECTS, regionalSprint, topics } from "@/lib/catalogs";
import { isSchoolYear, schoolYearFocus } from "@/lib/schedule";
import { topicAccuracy } from "@/lib/stats";
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
    <div>
      <h1>Learn</h1>
      <p>Hi, {store.studentName}!</p>
      <p className="muted">
        {schoolYear
          ? "School year · Regional prep. Weak spots and Earth/Energy first — summer chapters live in Weeks."
          : "Follow the summer block, then drill."}
      </p>
      <p className="muted">{topics.length} NSB topics · 6 categories · {encyclopediaQuestions.length} encyclopedia questions plus TossUp drills in Practice.</p>
      {schoolYear ? (
        <div className="card stack">
          <h3>Today · {today.label}</h3>
          <p className="muted">
            {today.subject === "earth" || today.subject === "energy"
              ? "Not on the summer pass. Read an article, then drill."
              : "Keep facts cold. Open Weeks only if you want a chapter hour."}
          </p>
          <div className="row">
            <Link className="btn" href={today.href}>Practice {today.label}</Link>
            <Link className="btn ghost" href="/topics">All topics</Link>
          </div>
        </div>
      ) : null}
      <p className="muted">{store.reviewedTopicIds.length} reviewed · {store.encyclopediaStreak} day encyclopedia streak</p>
      <div className="row">
        <Link className="btn" href="/learn/flash">{due ? `Review ${due} flashcards` : "Flashcards"}</Link>
        <Link className="btn ghost" href="/topics">All topics</Link>
        <Link className="btn ghost" href="/elements">Elements</Link>
        <Link className="btn ghost" href="/learn/formulas">Formulas</Link>
        <Link className="btn ghost" href="/learn/review">Review with books</Link>
        <Link className="btn ghost" href="/weeks">Weeks</Link>
        <Link className="btn ghost" href="/calendar">Calendar</Link>
        <Link className="btn ghost" href="/mental-math">Mental Math</Link>
      </div>
      {weak ? (
        <div className="card stack">
          <h3>Needs review</h3>
          <p>{weak.topic} · {Math.round(weak.acc * 100)}% after {weak.attempts} tries</p>
          <div className="row">
            <Link className="btn" href={`/practice/play?mode=weak&topic=${encodeURIComponent(weak.topic)}`}>Practice this</Link>
            <Link className="btn ghost" href="/learn/review">Review with books</Link>
            {weakArticle ? <Link className="btn ghost" href={`/learn/${weakArticle.id}`}>Read the article</Link> : (
              <Link className="btn ghost" href={`/practice/play?mode=subject&subject=${practiceSubjectFor(weak.subject)}`}>Open subject</Link>
            )}
          </div>
        </div>
      ) : null}
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
      <p className="muted">Texas regional depth — this is the school-year reading, not another summer chapter.</p>
      <div className="grid two">
        {regionalSprint.map((pack) => {
          const article = articleForLabel(pack.title, false);
          return (
            <div className="card stack" key={pack.id}>
              <h3>{pack.title}</h3>
              <p className="muted">{pack.subtitle}</p>
              <div className="row">
                <Link className="btn" href={`/practice/play?mode=sprint&id=${pack.id}`}>Drill {pack.tossups.length}</Link>
                {article ? <Link className="btn ghost" href={`/learn/${article.id}`}>Read the article</Link> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
