"use client";

import Link from "next/link";

export default function QuickPage() {
  return (
    <div className="stack">
      <div>
        <p className="mission-kicker">On the go</p>
        <h1>Quick</h1>
        <p className="muted">A few minutes. Pick one and start.</p>
      </div>
      <Link className="card stack" href="/practice/play?mode=quick&n=5">
        <h2 className="session-title">Quick Practice</h2>
        <p className="muted">5 mixed questions · about 5 minutes</p>
        <span className="btn mission-cta">Start practice</span>
      </Link>
      <Link className="card stack" href="/practice/play?mode=tossup&n=5">
        <h2 className="session-title">Toss-Up</h2>
        <p className="muted">5 official-clock toss-ups · 5s multiple choice / 20s short answer</p>
        <span className="btn mission-cta">Start toss-ups</span>
      </Link>
      <p className="faint">Need packets, subjects, or competition? Open <Link href="/practice">full Practice</Link>.</p>
    </div>
  );
}
