"use client";

import { RATE, speak, stopSpeech } from "@/lib/speech";
import { useStore } from "@/lib/store";

export function SpeechBar({ text }: { text: string }) {
  const store = useStore();
  return (
    <details className="speech-bar">
      <summary>Listen</summary>
      <div className="row">
        <button
          className="btn ghost"
          type="button"
          onClick={() => speak(text, RATE[store.speechRatePreset], store.speechVoiceURI)}
        >
          Read aloud
        </button>
        <button
          className="btn ghost"
          type="button"
          onClick={() => speak(text, RATE[store.speechRatePreset], store.speechVoiceURI)}
        >
          Replay
        </button>
        <button className="btn ghost" type="button" onClick={stopSpeech}>Stop</button>
        <label className="row">
          <input
            type="checkbox"
            checked={store.readQuestionsAloud && store.autoReadQuestions}
            onChange={(e) => store.set({
              readQuestionsAloud: e.target.checked || store.readQuestionsAloud,
              autoReadQuestions: e.target.checked,
            })}
          />
          Auto-read
        </label>
        <label className="row">
          <input
            type="checkbox"
            checked={store.parentReadsAloud}
            onChange={(e) => store.set({ parentReadsAloud: e.target.checked })}
          />
          Parent reads
        </label>
      </div>
    </details>
  );
}
