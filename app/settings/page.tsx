"use client";

import { useEffect, useState } from "react";
import { listVoices, RATE, speak } from "@/lib/speech";
import { useStore } from "@/lib/store";
import type { Appearance, DoeQuestion, FlashPace, SpeechRate } from "@/lib/types";

export default function SettingsPage() {
  const store = useStore();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const load = () => setVoices(listVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  return (
    <div className="stack">
      <h1>Settings</h1>
      <section className="card stack">
        <h3>Appearance</h3>
        <select value={store.appAppearance} onChange={(e) => store.set({ appAppearance: e.target.value as Appearance })}>
          <option value="dark">Dark (One Bee)</option>
          <option value="warmLight">Warm light</option>
          <option value="system">System</option>
        </select>
      </section>
      <section className="card stack">
        <label className="row"><input type="checkbox" checked={store.showSessionTimer} onChange={(e) => store.set({ showSessionTimer: e.target.checked })} /> Show countdown timer during Study Session</label>
        <label className="row"><input type="checkbox" checked={store.parentReadsAloud} onChange={(e) => store.set({ parentReadsAloud: e.target.checked })} /> Parent reads toss-ups aloud</label>
        <p className="muted">When enabled, answers stay hidden until you tap Reveal.</p>
      </section>
      <section className="card stack">
        <h3>Speech & review</h3>
        <label className="row"><input type="checkbox" checked={store.readQuestionsAloud} onChange={(e) => store.set({ readQuestionsAloud: e.target.checked })} /> Read questions aloud</label>
        <label className="row"><input type="checkbox" checked={store.autoReadQuestions} onChange={(e) => store.set({ autoReadQuestions: e.target.checked })} /> Auto-read each new question</label>
        <label>Student name (for praise)</label>
        <input value={store.studentName} onChange={(e) => store.set({ studentName: e.target.value })} />
        <label>Speech speed</label>
        <select value={store.speechRatePreset} onChange={(e) => store.set({ speechRatePreset: e.target.value as SpeechRate })}>
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </select>
        <label>Voice</label>
        <select value={store.speechVoiceURI ?? ""} onChange={(e) => store.set({ speechVoiceURI: e.target.value || null })}>
          <option value="">Browser default</option>
          {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
        </select>
        <button className="btn ghost" type="button" onClick={() => speak("Nice buzz, champion!", RATE[store.speechRatePreset], store.speechVoiceURI)}>Preview voice</button>
        <label>Flash card review pace</label>
        <select value={store.flashCardReviewPace} onChange={(e) => store.set({ flashCardReviewPace: e.target.value as FlashPace })}>
          <option value="normal">Normal</option>
          <option value="quick">Quick review</option>
          <option value="longTerm">Long retention</option>
        </select>
      </section>
      <section className="card stack">
        <h3>Study plan</h3>
        <label>Current week</label>
        <select value={store.currentWeek} onChange={(e) => store.set({ currentWeek: Number(e.target.value), weekManuallySet: true })}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => <option key={w} value={w}>Week {w}</option>)}
        </select>
      </section>
      <section className="card stack">
        <h3>Backup</h3>
        <p className="muted">Same idea as the Mac JSON backup. No account. Stored in this browser unless you export.</p>
        <button
          className="btn"
          type="button"
          onClick={() => {
            const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "science-bowl-coach-backup.json";
            a.click();
          }}
        >
          Export progress
        </button>
        <input
          type="file"
          accept="application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const data = JSON.parse(await file.text());
            store.importBackup(data);
          }}
        />
        <button className="btn ghost" type="button" onClick={() => store.clearProgress()}>Clear all progress</button>
      </section>
      <section className="card stack">
        <h3>DOE question bank</h3>
        <p className="muted">{48 + store.importedDoe.length} questions loaded (48 starter + imports). On the Mac app, PDFKit parses 251 official MS PDFs. Export that cache from the Mac Documents folder as doe_questions_cache.json and import it here to keep the full bank.</p>
        <input
          type="file"
          accept="application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const data = JSON.parse(await file.text()) as DoeQuestion[] | { questions: DoeQuestion[] };
            store.set({ importedDoe: Array.isArray(data) ? data : data.questions ?? [] });
          }}
        />
      </section>
      <section className="card stack">
        <h3>About</h3>
        <p>Science Bowl Coach — Soha. Middle School only. Not affiliated with or endorsed by the U.S. Department of Energy.</p>
      </section>
    </div>
  );
}
