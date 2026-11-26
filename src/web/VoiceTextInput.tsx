// Champ « note » avec micro (web/src/ui/VoiceTextInput.tsx de CLP) : zone de texte + enregistrement d'une note vocale par MediaRecorder (pause, reprise, annulation, envoi),
// téléversement par le transport injecté (`onUpload`, déjà une prop chez CLP), relecture par VoicePlayer, suppression.
// États : repos, enregistrement (VoiceRecordingBar), envoi, note enregistrée, erreur (micro indisponible ou refusé, échec d'envoi).
// Comportements de CLP conservés tels quels : pas de durée maximale ; le blob est étiqueté `audio/webm` quelle que soit la sortie du navigateur.
import { useState, useRef, useEffect, type CSSProperties } from "react";
import { ACCENT, BG, BORDER, CARD, DIM, MONO, TXT } from "./theme";
import { toneColor } from "./pastille-model";
import { fieldFocusStyle, useFieldFocus } from "./field-focus";
import { VoicePlayer } from "./VoicePlayer";
import { VoiceRecordingBar } from "./VoiceRecordingBar";
import "./voice-css";

export interface VoiceTextInputProps {
  text: string;
  onTextChange: (v: string) => void;
  voiceUrl: string | null;
  onVoiceChange: (url: string | null) => void;
  /** Téléverse l'audio et renvoie l'URL publique (ou null si échec). */
  onUpload: (blob: Blob) => Promise<string | null>;
  placeholder?: string;
  /** Textarea qui remplit tout l'espace vertical disponible (pas de plafond 110 px) au lieu de l'auto-redimensionnement sur 2 lignes. */
  grow?: boolean;
}

const RED = toneColor("danger");

const Mic = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v1a7 7 0 0 0 14 0v-1" /><line x1="12" y1="18" x2="12" y2="22" />
  </svg>
);
const Trash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export function VoiceTextInput({ text, onTextChange, voiceUrl, onVoiceChange, onUpload, placeholder, grow = false }: VoiceTextInputProps) {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const focus = useFieldFocus(); // focus visible (bordure d'accent + halo) sur la barre texte

  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => () => cleanup(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function startTimer() { stopTimer(); timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000); }
  function stopTimer() { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }
  function cleanup() {
    stopTimer();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mrRef.current = null;
  }

  async function start() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Micro indisponible sur ce navigateur.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      cancelledRef.current = false;
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        cleanup();
        setRecording(false);
        setPaused(false);
        const wasCancelled = cancelledRef.current;
        setElapsed(0);
        if (wasCancelled) return;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (!blob.size) return;
        setUploading(true);
        try {
          const url = await onUpload(blob);
          if (url) onVoiceChange(url);
          else setError("Échec de l'envoi. Réessayez.");
        } catch {
          setError("Échec de l'envoi. Réessayez.");
        } finally {
          setUploading(false);
        }
      };
      mr.start();
      mrRef.current = mr;
      setElapsed(0);
      setRecording(true);
      setPaused(false);
      startTimer();
    } catch {
      setError("Accès micro refusé. Autorisez le microphone.");
      cleanup();
    }
  }

  function togglePause() {
    const mr = mrRef.current;
    if (!mr) return;
    if (paused) { try { mr.resume(); } catch { /* noop */ } setPaused(false); startTimer(); }
    else { try { mr.pause(); } catch { /* noop */ } setPaused(true); stopTimer(); }
  }
  function send() { cancelledRef.current = false; mrRef.current?.stop(); }
  function cancel() { cancelledRef.current = true; mrRef.current?.stop(); }

  const bar: CSSProperties = {
    display: "flex", alignItems: "center", gap: 8,
    background: CARD, border: `1px solid ${BORDER}`,
    borderRadius: 24, padding: "6px 8px 6px 14px", minHeight: 48, boxSizing: "border-box",
  };
  const iconBtn = (color: string): CSSProperties => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
    background: "transparent", border: "none", color, cursor: "pointer", padding: 0,
  });
  const circleBtn = (bg: string, color: string): CSSProperties => ({ ...iconBtn(color), background: bg });

  if (recording) {
    return <VoiceRecordingBar elapsed={elapsed} paused={paused} onCancel={cancel} onTogglePause={togglePause} onSend={send} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: grow ? 1 : undefined, minHeight: grow ? 0 : undefined }}>
      {/* 2 lignes par défaut (auto-redimensionnement, plafond 110 px) : boîte moins arrondie, micro aligné en bas. `grow` : remplit tout l'espace vertical. */}
      <div style={{ ...bar, borderRadius: 14, alignItems: grow ? "stretch" : "flex-end", transition: "border-color 0.15s ease, box-shadow 0.15s ease", flex: grow ? 1 : undefined, minHeight: grow ? 0 : undefined, ...fieldFocusStyle(focus.focused) }}>
        <textarea
          value={text}
          onChange={(e) => {
            onTextChange(e.target.value);
            if (grow) return;
            const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(Math.max(t.scrollHeight, 46), 110) + "px";
          }}
          onFocus={focus.onFocus}
          onBlur={focus.onBlur}
          placeholder={placeholder ?? "Ajouter une note…"}
          rows={2}
          style={{
            flex: 1, resize: "none", background: "transparent", border: "none", outline: "none",
            color: TXT, fontSize: 13, fontFamily: "inherit", lineHeight: 1.5,
            minHeight: grow ? 0 : 46, maxHeight: grow ? "none" : 110, padding: "8px 0",
          }}
        />
        <button type="button" onClick={start} disabled={uploading} aria-label="Enregistrer une note vocale"
          onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.filter = "brightness(1.12)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
          style={{ ...circleBtn(uploading ? BORDER : ACCENT, uploading ? DIM : BG), transition: "filter 0.15s" }}>
          {uploading
            ? <span style={{ fontSize: 11, fontFamily: MONO }}>…</span>
            : <Mic />}
        </button>
      </div>

      {uploading && (
        <div style={{ fontSize: 10, color: ACCENT, paddingLeft: 14, letterSpacing: 0.5, animation: "omni-pulse 1.2s ease-in-out infinite" }}>
          Envoi de la note vocale…
        </div>
      )}

      {voiceUrl && !uploading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "6px 8px 6px 12px" }}>
          <VoicePlayer src={voiceUrl} />
          <button type="button" onClick={() => onVoiceChange(null)} aria-label="Supprimer la note vocale"
            onMouseEnter={(e) => { e.currentTarget.style.color = TXT; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = DIM; }}
            style={{ ...iconBtn(DIM), transition: "color 0.15s" }}><Trash /></button>
        </div>
      )}

      {error && <div style={{ fontSize: 10, color: RED, paddingLeft: 14, letterSpacing: 0.5 }}>{error}</div>}
    </div>
  );
}
