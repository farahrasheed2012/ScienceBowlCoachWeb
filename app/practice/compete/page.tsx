"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { CompetitionPlay } from "@/components/CompetitionPlay";
import { competitionPairCount, type CompetitionLength } from "@/lib/questions";
import { useStore } from "@/lib/store";

function parseLength(raw: string | null): CompetitionLength | null {
  if (raw === "half" || raw === "full") return raw;
  return null;
}

function CompeteLobby() {
  const store = useStore();
  return (
    <div className="stack">
      <Link href="/practice">Back to Practice</Link>
      <div>
        <p className="mission-kicker">Match practice</p>
        <h1>Full match practice</h1>
        <p className="muted">
          Buzz in → +4 for the toss-up → bonus for +10 → interrupt wrong and you get −4.
          You vs the field. No talking on toss-ups — only after you earn the bonus.
        </p>
      </div>
      <div className="grid two">
        <Link className="card stack" href="/practice/compete?length=full">
          <h3>Full match · 23 pairs</h3>
          <p className="muted">DOE-style length · halftime after 12 · ~30–40 min</p>
          <span className="btn">Start full match</span>
        </Link>
        <Link className="card stack" href="/practice/compete?length=half">
          <h3>Regional half · 12 pairs</h3>
          <p className="muted">Shorter run · halftime after 6 · ~15–20 min</p>
          <span className="btn ghost">Start half</span>
        </Link>
      </div>
      <div className="card stack">
        <h3>Practice like a real match</h3>
        <p className="muted">
          1. Open the <Link href="/quiz/buzzer">phone buzzer</Link> on this computer
          {store.buzzerRoomCode ? ` (room ${store.buzzerRoomCode})` : ""}.
        </p>
        <p className="muted">2. On your phone, open the room link and keep it ready.</p>
        <p className="muted">3. Start a match here — Space or the phone pad buzzes you in. Do not talk until you convert a toss-up and the bonus clock starts.</p>
        <div className="row">
          <Link className="btn ghost" href="/quiz/buzzer">Set up phone buzzer</Link>
        </div>
      </div>
    </div>
  );
}

function CompeteInner() {
  const store = useStore();
  const params = useSearchParams();
  const length = useMemo(() => parseLength(params.get("length")), [params]);

  if (!length) return <CompeteLobby />;

  return (
    <div className="stack">
      <p className="faint">
        {length === "full" ? "Full match" : "Regional half"} · {competitionPairCount(length)} toss-up/bonus pairs
        {" · "}
        <Link href="/practice/compete">Change length</Link>
      </p>
      <CompetitionPlay importedDoe={store.importedDoe} length={length} />
    </div>
  );
}

export default function CompetePage() {
  return (
    <Suspense fallback={<p className="muted">Loading match…</p>}>
      <CompeteInner />
    </Suspense>
  );
}
