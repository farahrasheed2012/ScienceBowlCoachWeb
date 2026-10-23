"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

function nextRoom() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function BuzzerHostPage() {
  const store = useStore();
  const [code, setCode] = useState(() => store.buzzerRoomCode || nextRoom());
  const [events, setEvents] = useState<{ at: string; name: string }[]>([]);

  useEffect(() => {
    if (store.buzzerRoomCode !== code) store.set({ buzzerRoomCode: code });
    const timer = window.setInterval(async () => {
      const res = await fetch(`/api/buzzer/${code}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
      }
    }, 700);
    return () => window.clearInterval(timer);
  }, [code]);

  const url = typeof window !== "undefined" ? `${window.location.origin}/buzzer/${code}` : "";

  return (
    <div className="stack">
      <Link href="/settings">Back to Settings</Link>
      <h1>iPhone buzzer remote</h1>
      <p className="muted">
        Laptop runs the match. Phone is the pad. A phone buzz locks in like Space —
        same idea as the Mac remote.
      </p>
      <div className="card stack">
        <p>Room code</p>
        <h2>{code}</h2>
        {url ? <a href={url}>{url}</a> : null}
        <p className="muted">This code stays in Settings until you make a new room.</p>
        <button className="btn ghost" type="button" onClick={() => setCode(nextRoom())}>
          New room
        </button>
      </div>
      <div className="card stack">
        <h3>How to practice like a match</h3>
        <p className="muted">{`1. Leave this page open (or remember room ${code}).`}</p>
        <p className="muted">2. On your phone, open the room link above and keep the big BUZZ button ready.</p>
        <p className="muted">
          3. On this computer start{" "}
          <Link href="/practice/compete?length=full">Full match</Link>
          {" "}(23 pairs) or a{" "}
          <Link href="/practice/compete?length=half">regional half</Link>.
        </p>
        <p className="muted">
          4. Buzz before you answer. Do not talk on toss-ups — only after you convert one and the 20s bonus starts.
          Wrong interrupt = −4.
        </p>
        <div className="row">
          <Link className="btn" href="/practice/compete?length=full">Start full match</Link>
          <Link className="btn ghost" href="/practice/compete?length=half">Regional half</Link>
        </div>
      </div>
      <div className="card stack">
        <h3>Buzzes</h3>
        {events.length === 0 ? <p className="muted">Waiting…</p> : events.map((e) => <p key={e.at}>{e.name} · {new Date(e.at).toLocaleTimeString()}</p>)}
      </div>
      <Link className="btn ghost" href="/practice/play?mode=tossup">Or short toss-up drill</Link>
    </div>
  );
}
