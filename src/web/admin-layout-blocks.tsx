// Blocs de mise en page des vues (web/src/admin/ui/Layout.tsx de Chez la Petite) : grille 2 colonnes (1 sur téléphone), pile, rangée, section à filet.
import "./admin-shell-css";
import type { ReactNode } from "react";
import { BORDER, rem } from "./theme";

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="omni-shell-grid2">{children}</div>;
}

export function Stack({ gap = 14, children }: { gap?: number; children: ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: rem(gap) }}>{children}</div>;
}

export function Row({ gap = 10, wrap = true, justify, children }: { gap?: number; wrap?: boolean; justify?: "space-between" | "flex-end"; children: ReactNode }) {
  return <div style={{ display: "flex", alignItems: "center", gap: rem(gap), flexWrap: wrap ? "wrap" : "nowrap", justifyContent: justify }}>{children}</div>;
}

/** Bloc séparé par un filet (zone « danger », actions secondaires d'un formulaire). */
export function Section({ children }: { children: ReactNode }) {
  return <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: rem(14), display: "flex", flexDirection: "column", gap: rem(12) }}>{children}</div>;
}
