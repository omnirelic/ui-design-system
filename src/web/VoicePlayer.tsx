// Lecteur de note vocale (web/design-system/components/VoicePlayer.tsx de CLP, qui remplace le <audio controls> natif) : bouton lecture/pause, barre de progression
// cliquable (seek), minutage. `compact` : barre fine ; `light` : sur fond clair (bulle de l'expéditeur), couleurs inversées. Couleurs = jetons du thème.
// Piège de Chrome conservé : un blob `audio/webm` de MediaRecorder n'a pas de durée dans l'en-tête (`loadedmetadata` rapporte Infinity) ;
// un saut en fin de piste force le calcul de la vraie durée, puis retour à 0.
import { useRef, useState, useEffect, type CSSProperties, type MouseEvent } from "react";
import { ACCENT, BG, BORDER, CARD, DIM, MONO, TXT } from "./theme";
import { tint } from "./controls";
import "./voice-css";

export interface VoicePlayerProps {
  src: string;
  /** Style compact (barre fine) pour les contextes denses. */
  compact?: boolean;
  /** Rendu sur un fond clair (ex. bulle dorée de l'expéditeur) : inverse les couleurs. */
  light?: boolean;
}

const Play = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="7 4 20 12 7 20 7 4" /></svg>
);
const Pause = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
);

function fmt(total: number): string {
  if (!Number.isFinite(total) || total < 0) total = 0;
  const m = Math.floor(total / 60);
  const s = String(Math.floor(total % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

export function VoicePlayer({ src, compact, light }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  // Remise à zéro quand la source change (nouvel enregistrement).
  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
  }, [src]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
    else { a.pause(); setPlaying(false); }
  }

  function seek(e: MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !Number.isFinite(duration) || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setCurrent(a.currentTime);
  }

  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  const h = compact ? 30 : 36;

  // Sur fond clair (bulle dorée) : bouton sombre, piste et curseur en fond du thème translucide.
  const trackBg = light ? tint(BG, 22) : BORDER;
  const fillBg = light ? BG : ACCENT;
  const timeColor = light ? tint(BG, 80) : DIM;

  const playBtn: CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: h, height: h, borderRadius: "50%", flexShrink: 0,
    background: light ? BG : ACCENT, border: "none", color: light ? TXT : BG, cursor: "pointer", padding: 0,
    paddingLeft: playing ? 0 : 2, // optique : décale le triangle play
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          if (!Number.isFinite(a.duration)) {
            const onSeeked = () => {
              a.removeEventListener("timeupdate", onSeeked);
              setDuration(a.duration);
              a.currentTime = 0;
            };
            a.addEventListener("timeupdate", onSeeked);
            a.currentTime = 1e101;
          } else {
            setDuration(a.duration);
          }
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
        style={{ display: "none" }}
      />
      <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Lire la note vocale"}
        onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.12)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
        style={{ ...playBtn, transition: "filter 0.15s" }}>
        {playing ? <Pause /> : <Play />}
      </button>
      <div
        onClick={seek}
        role="slider"
        aria-label="Progression de la note vocale"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(current)}
        style={{ flex: 1, height: 6, borderRadius: 3, background: trackBg, cursor: "pointer", position: "relative", minWidth: 40 }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: fillBg, borderRadius: 3, transition: "width 0.1s linear" }} />
        <div style={{ position: "absolute", left: `${pct}%`, top: "50%", transform: "translate(-50%, -50%)", width: 11, height: 11, borderRadius: "50%", background: fillBg, boxShadow: `0 0 0 2px ${light ? `color-mix(in srgb, ${ACCENT} 70%, ${BG})` : CARD}` }} />
      </div>
      <span style={{ fontFamily: MONO, fontSize: 11, color: timeColor, minWidth: 34, textAlign: "right", flexShrink: 0 }}>
        {fmt(playing || current > 0 ? current : duration)}
      </span>
    </div>
  );
}
