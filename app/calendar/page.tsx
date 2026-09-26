"use client";

import Link from "next/link";
import { useState } from "react";
import { isSchoolYear } from "@/lib/schedule";
import { useStore } from "@/lib/store";

const DOCS = [
  { id: "whiteboard", title: "10-week whiteboard", src: "/schedule/summer-2026-whiteboard.html" },
  { id: "week", title: "Weekly timetable", src: "/schedule/weekly-timetable.html" },
  { id: "prep", title: "Prep guide", src: "/schedule/science-bowl-prep.html" },
  { id: "table", title: "Periodic table", src: "/schedule/periodic-table-study.html" },
  { id: "print", title: "Periodic table print", src: "/schedule/periodic-table-print.html" },
];

export default function CalendarPage() {
  const store = useStore();
  const schoolYear = isSchoolYear();
  const [doc, setDoc] = useState(schoolYear ? DOCS.find((item) => item.id === "prep") ?? DOCS[0] : DOCS[0]);
  return (
    <div>
      <h1>Calendar</h1>
      <p className="muted">
        {schoolYear
          ? "School year lives on Home. These are the bundled summer PDFs — prep guide first, whiteboard is archive."
          : `Bundled summer HTML from the Mac app. Current week ${store.currentWeek}.`}
      </p>
      <div className="row">
        <Link className="btn ghost" href="/today">Home</Link>
        <Link className="btn ghost" href="/learn">Learn</Link>
        <Link className="btn ghost" href="/weeks">Week blocks</Link>
      </div>
      <div className="row">
        {DOCS.map((item) => (
          <button key={item.id} className={`btn ${doc.id === item.id ? "" : "ghost"}`} type="button" onClick={() => setDoc(item)}>
            {item.title}
          </button>
        ))}
      </div>
      <iframe className="schedule" src={doc.src} title={doc.title} />
    </div>
  );
}
