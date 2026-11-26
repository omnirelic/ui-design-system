// Texte de l'admin de CLP (web/src/admin/ui/Text.tsx) pour les composants d'entités : variantes `caption` 12 px, `small` 13,5 px, `body` 15 px, `title` 21 px ; tons
// = jetons du thème. Interne au paquet.
import type { ReactNode } from "react";
import { ACCENT, DIM, MONO, TXT, rem } from "./theme";
import { toneColor } from "./pastille-model";

export type TextTone = "default" | "muted" | "accent" | "success" | "warning" | "danger";
type Variant = "caption" | "small" | "body" | "title";
const SIZE: Record<Variant, string> = { caption: rem(12), small: rem(13.5), body: rem(15), title: rem(21) };
const TONE: Record<TextTone, string> = { default: TXT, muted: DIM, accent: ACCENT, success: toneColor("success"), warning: toneColor("warning"), danger: toneColor("danger") };

export function RefText({ variant = "body", tone = "default", strong, truncate, color, children }: { variant?: Variant; tone?: TextTone; strong?: boolean; truncate?: boolean; /** Couleur propre, remplace le ton. */ color?: string; children?: ReactNode }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: SIZE[variant], color: color ?? TONE[tone], fontWeight: strong ? 700 : 400, ...(truncate ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 } : null) }}>
      {children}
    </span>
  );
}
