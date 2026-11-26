// Notes vocales (web/src/chat/chat-voice.ts de CLP) : durée affichée, choix du codec, base64 et petit enregistreur autour de MediaRecorder.
// Aucune durée maximale chez CLP : la seule borne est le plancher de 0,5 s et un fichier non vide (`ChatComposer`, `isUsableRecording`).

/** « 1:05 » : secondes arrondies, minutes non bornées ; valeur négative = 0 ; `NaN` donne « NaN:NaN » comme chez CLP. */
export const formatDuration = (sec: number): string => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Codecs essayés dans l'ordre : webm/opus, mp4 (Safari), webm, ogg/opus. */
const MIMES = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"];
export const pickMime = (supports: (t: string) => boolean): string | undefined => MIMES.find(supports);

export const voiceSupported = (): boolean => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

/** Plancher d'une note envoyable (secondes) : en dessous, le geste est pris pour un clic involontaire. */
export const MIN_VOICE_SECONDS = 0.5;

/** Une note à envoyer : au moins `MIN_VOICE_SECONDS` et un fichier non vide (règle de `ChatComposer` de CLP). */
export const isUsableRecording = (durationSec: number, size: number): boolean => durationSec >= MIN_VOICE_SECONDS && size > 0;

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export interface Recording { stop: () => Promise<{ blob: Blob; durationSec: number }>; cancel: () => void }

/** Demande le micro et démarre l'enregistrement ; rejette si l'accès est refusé. `stop` libère le micro et rend la note ; `cancel` jette tout. */
export async function startRecording(): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = pickMime((t) => MediaRecorder.isTypeSupported?.(t) ?? false);
  const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const began = Date.now();
  rec.start();
  const release = () => stream.getTracks().forEach((t) => t.stop());
  return {
    stop: () => new Promise((resolve) => {
      rec.onstop = () => { release(); resolve({ blob: new Blob(chunks, { type: rec.mimeType || mimeType || "audio/webm" }), durationSec: (Date.now() - began) / 1000 }); };
      rec.stop();
    }),
    cancel: () => { rec.onstop = null; try { rec.stop(); } catch { /* déjà arrêté */ } release(); },
  };
}
