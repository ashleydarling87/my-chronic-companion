/**
 * Cozy sound effects using the Web Audio API (zero dependencies, no audio files).
 * All sounds are generated with oscillators for a warm, soft feel.
 */

const STORAGE_KEY = "cozy_sounds_enabled";

export const isSoundEnabled = (): boolean => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "true"; // default ON
  } catch {
    return true;
  }
};

export const setSoundEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {}
};

let audioCtx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
  } catch {
    return null;
  }
};

/**
 * Soft two-note chime — like Animal Crossing furniture placement.
 * ~300ms, gentle sine waves with quick fade-out.
 */
export const playLogComplete = () => {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = ctx.createGain();
  vol.gain.setValueAtTime(0.12, now);
  vol.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  vol.connect(ctx.destination);

  // Note 1: C5 (523 Hz)
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(523, now);
  osc1.connect(vol);
  osc1.start(now);
  osc1.stop(now + 0.35);

  // Note 2: E5 (659 Hz), starts slightly later for a warm chime feel
  const vol2 = ctx.createGain();
  vol2.gain.setValueAtTime(0.1, now + 0.08);
  vol2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  vol2.connect(ctx.destination);

  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(659, now + 0.08);
  osc2.connect(vol2);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.4);
};

/**
 * Soft woodblock-like tap — short triangle wave burst, ~80ms.
 * Used for notification sounds.
 */
export const playNotificationTap = () => {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = ctx.createGain();
  vol.gain.setValueAtTime(0.08, now);
  vol.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  vol.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
  osc.connect(vol);
  osc.start(now);
  osc.stop(now + 0.1);
};
