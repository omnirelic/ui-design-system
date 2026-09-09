// Pastille de statut (ex. "Actif") — teinte sémantique en fond translucide,
// jamais l'accent de marque (réservé à l'identité/CTA, voir tokens.ts).
import type { ReactNode } from "react";
import { FONT } from "./theme";
import { semantic, radius } from "../tokens";

export type BadgeVariant = "success" | "warning" | "danger" | "neutral";

const COLOR: Record<BadgeVariant, string> = {
  success: semantic.success,
  warning: semantic.warning,
  danger: semantic.danger,
  neutral: semantic.info,
};

export type BadgeProps = { variant?: BadgeVariant; children: ReactNode };

export function Badge({ variant = "neutral", children }: BadgeProps) {
  const color = COLOR[variant];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: radius.pill,
        fontSize: FONT.label, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
        color, background: `${color}1a`, border: `1px solid ${color}55`,
      }}
    >
      {children}
    </span>
  );
}
