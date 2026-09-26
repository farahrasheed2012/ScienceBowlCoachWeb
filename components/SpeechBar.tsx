"use client";

import { RATE, speak } from "@/lib/speech";
import { useStore } from "@/lib/store";

export function SpeechBar({ text }: { text: string }) {
  const store = useStore();
  if (!store.readQuestionsAloud) return null;
  return (
    <button
      className="btn ghost"
      type="button"
      onClick={() => speak(text, RATE[store.speechRatePreset], store.speechVoiceURI)}
    >
      Replay
    </button>
  );
}
