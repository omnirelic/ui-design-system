// Marque omnirelic — port fidèle de chezlapetite/omnirelic/logo.svg (lu
// seul, jamais modifié). Anneau d'orbite + 6 nœuds + clé de voûte losange,
// dégradé teal→cyan. `spin` fait tourner lentement le mark (32s/tour),
// jamais appliqué au logo de header.
//
// Contrairement à la version historique (web/src/components/LogoMark.tsx,
// à retirer une fois toutes les vues migrées ici) : l'id de gradient est
// unique par instance (`useId`) — plusieurs LogoMark sur une même page
// (header + hero + QR) ne se marchent plus dessus — et l'animation est
// injectée en `<style>` scopé, sans dépendre d'une classe globale
// `.logomark-spin` définie par l'app consommatrice (ce package doit rester
// autonome pour être réutilisable par n'importe quel provider).
import { useId } from "react";

export type LogoMarkProps = { size?: number; spin?: boolean };

export function LogoMark({ size = 32, spin = false }: LogoMarkProps) {
  const gid = useId().replace(/:/g, "");
  const spinClass = `omnirelic-logomark-spin-${gid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="omnirelic">
      {spin && (
        <style>{`
          @keyframes ${spinClass} { to { transform: rotate(360deg); } }
          .${spinClass} { transform-origin: 32px 32px; transform-box: view-box; animation: ${spinClass} 32s linear infinite; }
        `}</style>
      )}
      <defs>
        <linearGradient id={`omnirelic-orb-${gid}`} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5eead4" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="22" stroke="#3f3f46" strokeWidth="1.25" />
      <g className={spin ? spinClass : undefined}>
        <g stroke={`url(#omnirelic-orb-${gid})`} strokeWidth="1.25" strokeLinecap="round" opacity="0.45">
          <path d="M32 32L32 10" />
          <path d="M32 32L51 21" />
          <path d="M32 32L51 43" />
          <path d="M32 32L32 54" />
          <path d="M32 32L13 43" />
          <path d="M32 32L13 21" />
        </g>
        <g fill={`url(#omnirelic-orb-${gid})`}>
          <circle cx="32" cy="10" r="3" />
          <circle cx="51" cy="21" r="3" />
          <circle cx="51" cy="43" r="3" />
          <circle cx="32" cy="54" r="3" />
          <circle cx="13" cy="43" r="3" />
          <circle cx="13" cy="21" r="3" />
        </g>
      </g>
      <rect x="20.5" y="20.5" width="23" height="23" rx="6" transform="rotate(45 32 32)" fill={`url(#omnirelic-orb-${gid})`} />
      <circle cx="32" cy="32" r="5" fill="#0a0a0b" />
    </svg>
  );
}
