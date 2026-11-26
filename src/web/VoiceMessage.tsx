// Message vocal d'une conversation (web/src/chat/ChatAudio.tsx de CLP) : lecture/pause rondes, onde (clic = saut, flèches = ±5 s), durée restante, avatar et pastille micro.
// Écarts : `ChatAudio` s'appelle ici `VoiceMessage` ; l'avatar de l'interlocuteur (CLP : `/logo.svg`) et celui de l'expéditeur (CLP : icône « utilisateur ») sont injectés
// (`avatar`, `mineAvatar`) ; les classes `clpc-*` du chat deviennent `omni-vn*` (styles dans `voice-css.ts`), l'état « envoyé » passe par `mine`.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { Icon } from "./Icon";
import { formatDuration } from "./voice";
import { seekRatio, waveBars } from "./voice-wave";
import "./voice-css";

const MIC = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></svg>;
const PLAY = <svg viewBox="0 0 24 24" aria-hidden><path d="M8 5l12 7-12 7z" fill="currentColor" /></svg>;
const PAUSE = <svg viewBox="0 0 24 24" aria-hidden><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" /></svg>;
/** Hauteur d'une barre en px : 4 au minimum, 24 au maximum. */
const barPx = (h: number) => Math.round(4 + ((h - 0.25) / 0.75) * 20);

export interface VoiceMessageProps {
  src: string;
  /** Durée annoncée (secondes) : affichée avant le chargement, remplacée par la durée réelle. */
  durationSec?: number | null;
  /** Graine de l'onde (défaut : `src`) : deux messages ont deux ondes, le même message garde la sienne. */
  seed?: string;
  /** Message envoyé par nous (bulle d'accent, encre inversée). */
  mine?: boolean;
  /** Pied de bulle à droite de la durée (heure, coches). */
  meta?: ReactNode;
  /** Avatar de l'interlocuteur (défaut : aucun). */
  avatar?: ReactNode;
  /** Avatar de l'expéditeur quand `mine` (défaut : icône « utilisateur »). */
  mineAvatar?: ReactNode;
}

export function VoiceMessage({ src, durationSec, seed, mine = false, meta, avatar, mineAvatar }: VoiceMessageProps) {
  const el = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const [total, setTotal] = useState(durationSec ?? 0);
  useEffect(() => { setTotal(durationSec ?? 0); }, [durationSec]);
  const bars = useMemo(() => waveBars(seed ?? src), [seed, src]);
  const ratio = total ? Math.min(1, at / total) : 0;
  const toggle = () => { const a = el.current; if (!a) return; if (a.paused) void a.play(); else a.pause(); };
  const seek = (e: MouseEvent<HTMLDivElement>) => {
    const a = el.current; if (!a || !total) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = seekRatio(e.clientX, r.left, r.width) * total;
    setAt(a.currentTime);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const a = el.current; if (!a || !total) return;
    if (e.key === "ArrowRight") a.currentTime = Math.min(total, a.currentTime + 5);
    else if (e.key === "ArrowLeft") a.currentTime = Math.max(0, a.currentTime - 5);
    else return;
    e.preventDefault(); setAt(a.currentTime);
  };
  const shown = playing || at > 0 ? Math.ceil(Math.max(0, total - at)) : total;
  return (
    <div className="omni-vn" data-mine={mine ? "" : undefined}>
      <div className="omni-vn-av">{mine ? (mineAvatar ?? <Icon name="ui-user" size={28} weight="fill" />) : avatar}<span className="omni-vn-badge">{MIC}</span></div>
      <button type="button" className="omni-aud-b" aria-label={playing ? "Pause" : "Lecture"} onClick={toggle}>{playing ? PAUSE : PLAY}</button>
      <div className="omni-aud-w" role="slider" tabIndex={0} aria-label="Position dans le message vocal" aria-valuemin={0} aria-valuemax={Math.round(total)} aria-valuenow={Math.round(at)} aria-valuetext={`${formatDuration(at)} sur ${formatDuration(total)}`} onClick={seek} onKeyDown={onKey}>
        {bars.map((h, i) => <i key={i} className={i / bars.length < ratio ? "on" : undefined} style={{ height: barPx(h) }} />)}
        <b style={{ left: `calc(${ratio * 100}% - ${ratio * 10}px)` }} />
      </div>
      <div className="omni-vm"><span className="omni-aud-t">{formatDuration(shown)}</span>{meta}</div>
      <audio
        ref={el} src={src} preload="metadata"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setAt(0); }}
        onTimeUpdate={(e) => setAt(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (Number.isFinite(d) && d > 0) setTotal(d); }}
      />
    </div>
  );
}
