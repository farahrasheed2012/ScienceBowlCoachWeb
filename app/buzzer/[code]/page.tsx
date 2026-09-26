"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";

export default function BuzzerPhonePage() {
  const { code } = useParams<{ code: string }>();
  const store = useStore();
  const [status, setStatus] = useState("Ready");
  return (
    <div className="stack" style={{ minHeight: "70vh", placeItems: "center" }}>
      <h1>Buzz</h1>
      <p className="muted">Room {code}</p>
      <button
        className="btn"
        style={{ width: 220, height: 220, borderRadius: "50%", fontSize: 28 }}
        type="button"
        onClick={async () => {
          await fetch(`/api/buzzer/${code}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: store.studentName }),
          });
          setStatus("Buzzed");
        }}
      >
        BUZZ
      </button>
      <p>{status}</p>
    </div>
  );
}
