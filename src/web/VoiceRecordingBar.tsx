// Barre d'enregistrement vocal (web/src/ui/VoiceRecordingBar.tsx de CLP) : corbeille, pastille qui pulse, minuteur, onde animée, pause, envoi.
// Même rendu partout (champ de note, chat de commande) : une seule source visuelle. Couleurs = jetons du thème (le rouge est le ton « danger »).
import type { CSSProperties } from "react";
import { ACCENT, BG, CARD, DIM, MONO, TXT } from "./theme";
import { tint } from "./controls";
import { toneColor } from "./pastille-model";
import "./voice-css";

const BARS = Array.from({ length: 30 });
const RED = toneColor("danger");

function fmt(total: number): string {
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

const Trash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const Send = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="4" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" />
  </svg>
);
const Pause = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
);
const Play = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="7 4 20 12 7 20 7 4" /></svg>
);

export interface VoiceRecordingBarProps {
  /** Secondes écoulées. */
  elapsed: number;
  paused: boolean;
  onCancel: () => void;
  onTogglePause: () => void;
  onSend: () => void;
}

export function VoiceRecordingBar({ elapsed, paused, onCancel, onTogglePause, onSend }: VoiceRecordingBarProps) {
  const bar: CSSProperties = {
    display: "flex", alignItems: "center", gap: 8,
    background: CARD, border: `1px solid ${tint(RED, 40)}`,
    borderRadius: 24, padding: "6px 8px 6px 14px", minHeight: 48, boxSizing: "border-box",
  };
  const iconBtn = (color: string): CSSProperties => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
    background: "transparent", border: "none", color, cursor: "pointer", padding: 0,
  });
  const circleBtn = (bg: string, color: string): CSSProperties => ({ ...iconBtn(color), background: bg });

  return (
    <div>
      <div style={bar}>
        <button type="button" onClick={onCancel} aria-label="Annuler" style={iconBtn(DIM)}><Trash /></button>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: RED, flexShrink: 0, animation: paused ? "none" : "omni-pulse 1.2s ease-in-out infinite" }} />
        <span style={{ fontFamily: MONO, fontSize: 13, color: TXT, minWidth: 42, flexShrink: 0 }}>{fmt(elapsed)}</span>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 2, height: 24, overflow: "hidden" }}>
          {BARS.map((_, i) => (
            <span key={i} style={{
              width: 2, height: 20, borderRadius: 1, background: ACCENT, flexShrink: 0, transformOrigin: "center",
              animation: `omni-wave ${480 + (i * 53) % 520}ms ease-in-out ${(i * 37) % 600}ms infinite`,
              animationPlayState: paused ? "paused" : "running",
              opacity: paused ? 0.4 : 1,
            }} />
          ))}
        </div>
        <button type="button" onClick={onTogglePause} aria-label={paused ? "Reprendre" : "Pause"} style={iconBtn(paused ? ACCENT : TXT)}>
          {paused ? <Play /> : <Pause />}
        </button>
        <button type="button" onClick={onSend} aria-label="Envoyer la note" style={circleBtn(ACCENT, BG)}><Send /></button>
      </div>
    </div>
  );
}
