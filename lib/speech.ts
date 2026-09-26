export const RATE: Record<string, number> = { slow: 0.7, normal: 0.95, fast: 1.15 };

export function speak(text: string, rate = 0.95, voiceURI?: string | null) {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const voice = voiceURI ? voices.find((v) => v.voiceURI === voiceURI) : voices.find((v) => v.lang.startsWith("en"));
    if (voice) utter.voice = voice;
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}

export function stopSpeech() {
  if (typeof window === "undefined") return;
  window.speechSynthesis.cancel();
}

export function praise(name: string, rate = 0.95, voiceURI?: string | null) {
  const who = name.trim() || "champion";
  const phrases = [
    `Nice buzz, ${who}!`,
    `Great job, ${who}!`,
    `You got it, ${who}!`,
    `Awesome, ${who}!`,
    `Super star, ${who}!`,
  ];
  speak(phrases[Math.floor(Math.random() * phrases.length)], rate, voiceURI);
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined") return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
}
