"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doeBundled, mergeDoeQuestions, parseQuestionCache } from "@/lib/questions";
import { listVoices, RATE, speak } from "@/lib/speech";
import { useStore } from "@/lib/store";
import { formatSyncCode, isSyncCode, normalizeSyncCode } from "@/lib/sync-code";
import type { Appearance, FlashPace, SpeechRate } from "@/lib/types";

export default function SettingsPage() {
  const store = useStore();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [doeNote, setDoeNote] = useState("");
  useEffect(() => {
    const load = () => setVoices(listVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  return (
    <div className="stack">
      <h1>Settings</h1>
      <ProfilesCard />
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
        <label>This kid&apos;s name</label>
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
        <p className="muted">After Aug 28, Home uses a school-year keep-sharp plan. This picker only marks a summer week when you browse Weeks.</p>
        <label>Summer week (archive)</label>
        <select value={store.currentWeek} onChange={(e) => store.set({ currentWeek: Number(e.target.value), weekManuallySet: true })}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => <option key={w} value={w}>Week {w}</option>)}
        </select>
      </section>
      <DeviceSync />
      <section className="card stack">
        <h3>Backup</h3>
        <p className="muted">Same idea as the Mac JSON backup. A file is enough if you do not want the phone and Mac linked.</p>
        <button
          className="btn"
          type="button"
          onClick={() => {
            const blob = new Blob([JSON.stringify(store.exportBag(), null, 2)], { type: "application/json" });
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
            try {
              const data = JSON.parse(await file.text());
              store.importBackup(data);
            } catch {
              window.alert("That file is not a Science Bowl Coach backup.");
            }
          }}
        />
        <button className="btn ghost" type="button" onClick={() => store.clearProgress()}>Clear this kid&apos;s progress</button>
      </section>
      <section className="card stack">
        <h3>DOE question bank</h3>
        <p className="muted">
          {doeBundled.length} official DOE middle-school questions are already in Practice
          {store.importedDoe.length ? ` · ${store.importedDoe.length} extra imported` : ""}, on top of TossUp’s 634 bundled questions.
          Physical Science is split into Chemistry vs Physics. Import another cache only if you have a newer file.
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
        {store.importedDoe.length ? (
          <button className="btn ghost" type="button" onClick={() => { store.set({ importedDoe: [] }); setDoeNote("Extra imported DOE cleared. The bundled official MS bank stays."); }}>
            Clear imported DOE
          </button>
        ) : null}
        {doeNote ? <p className={doeNote.includes("not") || doeNote.includes("backup") || doeNote.includes("No DOE") ? "bad-text" : "ok-text"}>{doeNote}</p> : null}
      </section>
      <section className="card stack">
        <h3>Phone buzzer</h3>
        <p className="muted">Open a room on this computer, then buzz from a phone on the same site. A phone buzz locks in like Space during Practice.</p>
        {store.buzzerRoomCode ? <p className="muted">Current room {store.buzzerRoomCode}</p> : null}
        <Link className="btn" href="/quiz/buzzer">Open buzzer room</Link>
      </section>
      <section className="card stack">
        <h3>About</h3>
        <p>Science Bowl Coach — Soha. Middle School only. Not affiliated with or endorsed by the U.S. Department of Energy.</p>
      </section>
    </div>
  );
}

function ProfilesCard() {
  const store = useStore();
  const [name, setName] = useState("");
  return (
    <section className="card stack">
      <h3>Who is studying</h3>
      <p className="muted">Each kid has their own Science Bowl, Python, and sync code. Switch before they start.</p>
      <select value={store.profileId} onChange={(event) => store.switchProfile(event.target.value)}>
        {store.profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>{profile.name}</option>
        ))}
      </select>
      <label>Add a kid</label>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />
      <div className="row">
        <button
          className="btn"
          type="button"
          onClick={() => {
            const next = name.trim();
            if (!next) return;
            store.addProfile(next);
            setName("");
          }}
        >
          Add kid
        </button>
        {store.profiles.length > 1 ? (
          <button className="btn ghost" type="button" onClick={() => store.removeProfile(store.profileId)}>
            Remove {store.studentName}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function DeviceSync() {
  const store = useStore();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/sync")
      .then((res) => res.json())
      .then((data: { available?: boolean }) => setAvailable(Boolean(data.available)))
      .catch(() => setAvailable(false));
  }, []);

  async function createCode() {
    setBusy(true);
    setNote("");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: store.exportState() }),
      });
      const data = await res.json() as { code?: string; error?: string };
      if (!res.ok || !data.code) {
        setNote(data.error || "Could not create a sync code.");
        return;
      }
      store.set({ syncCode: data.code, savedAt: new Date().toISOString() });
      setNote("Code created. Type it on the other device.");
    } catch {
      setNote("Could not reach sync.");
    } finally {
      setBusy(false);
    }
  }

  async function joinCode() {
    const code = normalizeSyncCode(codeInput);
    if (!isSyncCode(code)) {
      setNote("Use the 8-character code from the other device.");
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const res = await fetch(`/api/sync?code=${encodeURIComponent(code)}`);
      const data = await res.json() as { state?: Record<string, unknown>; error?: string };
      store.set({ syncCode: code, savedAt: new Date().toISOString() });
      if (res.ok && data.state) {
        store.mergeRemote({ ...data.state, syncCode: code });
        setNote("This device is linked. Progress will stay in sync.");
      } else {
        setNote("Linked. This device will start sharing from here.");
      }
    } catch {
      setNote("Could not reach sync.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card stack">
      <h3>Phone and Mac</h3>
      {available === false ? (
        <p className="muted">This browser still saves progress. Add DATABASE_URL in Vercel to share it between iPhone and MacBook.</p>
      ) : (
        <p className="muted">
          No account. One code is for <strong>{store.studentName}</strong> only.
          Switch kid first, then make or enter that kid&apos;s code.
        </p>
      )}
      {store.syncCode ? (
        <>
          <p className="session-title">{formatSyncCode(store.syncCode)}</p>
          <p className="faint">Type this on the other device under Settings.</p>
          <button className="btn ghost" type="button" onClick={() => store.set({ syncCode: null })}>Unlink this device</button>
        </>
      ) : (
        <>
          <button className="btn" type="button" disabled={busy || available === false} onClick={createCode}>
            Make a sync code
          </button>
          <label>Already have a code?</label>
          <input
            value={codeInput}
            onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
            placeholder="ABCD-EFGH"
          />
          <button className="btn ghost" type="button" disabled={busy || available === false} onClick={joinCode}>
            Link this device
          </button>
        </>
      )}
      {note ? <p className="muted">{note}</p> : null}
    </section>
  );
}
