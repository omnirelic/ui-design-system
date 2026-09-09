// Composant typographique — point d'entrée UNIQUE pour du texte stylé dans
// web/ : chaque variant fixe taille (rem, voir FONT dans theme.ts), poids,
// couleur et transformation par défaut selon la convention ci-dessous.
// Jamais de `fontSize: 12` en dur dans un composant consommateur — passer
// par `variant` (un style ponctuel reste possible via `style`, mais reste
// l'exception, pas la règle).
import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { FONT, TXT, DIM, ACCENT, MONO } from "./theme";

export type TextVariant =
  | "caption" // eyebrow/meta en majuscules — ESPACE PARTENAIRE, OMNIRELIC
  | "label" // titres de section, labels de champ — TES GAINS PAR JOUR
  | "body" // texte secondaire — descriptions, sous-titres de ligne
  | "base" // texte UI principal — titres de ligne, items de nav
  | "lg" // emphase — montants de ligne, initiales avatar
  | "xl" // sous-titre / titre de page mobile
  | "xxl" // titre de page desktop
  | "display1" // gros chiffres secondaires
  | "display2" // hero mobile
  | "display3" // hero desktop
  | "mono"; // code partenaire, montants tabulaires — Space Grotesk

export type TextProps = {
  variant?: TextVariant;
  as?: ElementType;
  color?: string;
  children?: ReactNode;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLElement>, "color">;

const VARIANT_STYLE: Record<TextVariant, CSSProperties> = {
  caption: { fontSize: FONT.caption, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: DIM, fontFamily: MONO },
  label: { fontSize: FONT.label, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: DIM },
  body: { fontSize: FONT.body, fontWeight: 500, color: DIM },
  base: { fontSize: FONT.base, fontWeight: 700, color: TXT },
  lg: { fontSize: FONT.lg, fontWeight: 800, color: TXT },
  xl: { fontSize: FONT.xl, fontWeight: 800, color: TXT },
  xxl: { fontSize: FONT.xxl, fontWeight: 800, color: TXT },
  display1: { fontSize: FONT.display1, fontWeight: 800, color: TXT, fontFamily: MONO },
  display2: { fontSize: FONT.display2, fontWeight: 800, color: TXT, fontFamily: MONO },
  display3: { fontSize: FONT.display3, fontWeight: 800, color: TXT, fontFamily: MONO },
  mono: { fontSize: FONT.base, fontWeight: 700, color: ACCENT, fontFamily: MONO },
};

export function Text({ variant = "base", as, color, children, style, ...rest }: TextProps) {
  const Tag = as ?? "div";
  return (
    <Tag style={{ ...VARIANT_STYLE[variant], ...(color ? { color } : null), ...style }} {...rest}>
      {children}
    </Tag>
  );
}
