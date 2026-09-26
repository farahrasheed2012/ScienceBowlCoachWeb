"use client";

import Link from "next/link";
import { useState } from "react";
import { tossUpBundled, tossUpHewittPairs, tossUpTopics } from "@/lib/tossup";
import { regionalSprint } from "@/lib/catalogs";
import { matchesSubject, mergeDoeQuestions, parseQuestionCache, practiceBank } from "@/lib/questions";
import { isSchoolYear, schoolYearFocus } from "@/lib/schedule";
import { topicAccuracy } from "@/lib/stats";
import { useStore } from "@/lib/store";

const MODES = [
  { href: "/practice/play?mode=quick", title: "Quick Practice", detail: "10 mixed questions · about 10 minutes" },
  { href: "/practice/play?mode=tossup", title: "Toss-Up", detail: "Official-style toss-ups · 5s MC / 20s SA" },
  { href: "/practice/play?mode=bonus", title: "Bonus", detail: `${tossUpHewittPairs.length} Hewitt pairs · bonus only after a correct toss-up` },
  { href: "/practice/play?mode=weak", title: "Weak Areas", detail: "Topics under 70% after at least 2 tries" },
  { href: "/practice/play?mode=mock", title: "Mock Match", detail: "8 toss-up/bonus pairs, then toss-ups to 25 · miss a toss-up and the bonus is skipped" },
  { href: "/practice/play?mode=sprint", title: "Regional Sprint", detail: `${regionalSprint.length} know-cold packs · short answer` },
];

const SUBJECTS = [
  { id: "biology", label: "Biology" },
  { id: "chemistry", label: "Chemistry" },
  { id: "physics", label: "Physics" },
  { id: "earth", label: "Earth & Space" },
  { id: "energy", label: "Energy" },
  { id: "math", label: "Math" },
];

export default function PracticePage() {
  const store = useStore();
  const [doeNote, setDoeNote] = useState("");
  const bank = practiceBank(store.importedDoe);
  const weak = topicAccuracy(store.drillResults).filter((row) => row.acc < 0.7);
  const topics = tossUpTopics.filter((t) => !t.id.endsWith("-all"));
  const today = schoolYearFocus();
  const schoolYear = isSchoolYear();
  const earthCount = bank.filter((q) => matchesSubject(q, "earth") && q.kind !== "bonus").length;
  const energyCount = bank.filter((q) => matchesSubject(q, "energy") && q.kind !== "bonus").length;

  return (
    <div className="stack">
      <div>
        <h1>Practice</h1>
        <p className="muted">
          {bank.length} questions ready · {tossUpBundled.length} from TossUp
          {schoolYear ? " · School year keep-sharp" : ""}
        </p>
      </div>
      {schoolYear ? (
        <div className="card stack">
          <h3>Today · {today.label}</h3>
          <p className="muted">
            {today.subject === "earth" || today.subject === "energy"
              ? "Summer skipped this category. Use encyclopedia + DOE if the TossUp bank is thin."
              : "Official 5s / 20s clock. Weak areas stay the first Home card."}
          </p>
          <div className="row">
            <Link className="btn" href={today.href}>Start today&apos;s subject</Link>
            <Link className="btn ghost" href="/learn/review">Review with books</Link>
          </div>
        </div>
      ) : null}
      <div className="card stack">
        <h3>DOE question bank</h3>
        <p className="muted">
          {48 + store.importedDoe.length} DOE questions loaded
          {store.importedDoe.length ? ` · ${store.importedDoe.length} imported` : " · starter 48 only"}.
          Earth {earthCount} · Energy {energyCount}. Import doe_questions_cache.json from the Mac app to thicken those.
        </p>
        <input
          type="file"
          accept="application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const parsed = parseQuestionCache(JSON.parse(await file.text()));
              if (parsed.error) {
                setDoeNote(parsed.error);
                return;
              }
              const merged = mergeDoeQuestions(store.importedDoe, parsed.questions);
              const added = merged.length - store.importedDoe.length;
              store.set({ importedDoe: merged });
              setDoeNote(`${file.name}: ${added} new · ${merged.length} imported total.`);
            } catch {
              setDoeNote("That file is not a DOE or TossUp question cache.");
            }
            e.target.value = "";
          }}
        />
        {doeNote ? <p className={doeNote.includes("not") || doeNote.includes("backup") || doeNote.includes("No DOE") ? "bad-text" : "ok-text"}>{doeNote}</p> : null}
      </div>
      <div className="card">
        <p className="muted">Space buzzes · W X Y Z or 1–4 answers · N or Enter goes to the next question after reveal · End round saves the session.</p>
      </div>
      <div className="grid two">
        {MODES.map((mode) => (
          <Link className="card stack" key={mode.href} href={mode.href}>
            <h3>{mode.title}</h3>
            <p className="muted">{mode.detail}</p>
            <span className="btn">Start</span>
          </Link>
        ))}
      </div>
      <h2>Subject</h2>
      <div className="grid two">
        {SUBJECTS.map((subject) => (
          <Link className="card stack" key={subject.id} href={`/practice/play?mode=subject&subject=${subject.id}`}>
            <h3>{subject.label}</h3>
            <p className="muted">
              {bank.filter((q) => matchesSubject(q, subject.id) && q.kind !== "bonus").length} toss-ups · 15 in a set
            </p>
          </Link>
        ))}
      </div>
      <h2>Topic</h2>
      <div className="row">
        {topics.map((topic) => (
          <Link className="pill" key={topic.id} href={`/practice/play?mode=topic&topic=${topic.id}`}>{topic.name}</Link>
        ))}
      </div>
      {weak[0] ? (
        <div className="card stack">
          <h3>Recommended</h3>
          <p>{weak[0].topic} · {Math.round(weak[0].acc * 100)}% accuracy</p>
          <Link className="btn" href={`/practice/play?mode=weak&topic=${encodeURIComponent(weak[0].topic)}`}>Practice this topic today</Link>
        </div>
      ) : (
        <p className="muted">Answer a few drills and this page will recommend a weak topic.</p>
      )}
    </div>
  );
}
