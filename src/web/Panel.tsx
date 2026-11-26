// Conteneur bordé/arrondi générique (mockup: .panel/.row-card) — la brique
// de base de la plupart des sections d'un écran self-service (Business,
// Profil, Lieux). `padded=false` pour un conteneur qui gère lui-même son
// padding interne (ex. une liste de lignes avec séparateurs).
import type { CSSProperties, ReactNode } from "react";
import { CARD, BORDER } from "./theme";
import { radius } from "../tokens";

export type PanelProps = { children: ReactNode; padded?: boolean; style?: CSSProperties };

export function Panel({ children, padded = true, style }: PanelProps) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: radius.lg, padding: padded ? 20 : 0, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}
