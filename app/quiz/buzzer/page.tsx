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
      <p className="muted">Open the phone page, then start Practice on this computer. A phone buzz locks in like Space. Same idea as the Mac remote, not a game.</p>
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
        <h3>Buzzes</h3>
        {events.length === 0 ? <p className="muted">Waiting…</p> : events.map((e) => <p key={e.at}>{e.name} · {new Date(e.at).toLocaleTimeString()}</p>)}
      </div>
      <Link className="btn" href="/practice/play?mode=tossup">Start a toss-up on this computer</Link>
    </div>
  );
}
