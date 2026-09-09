// Alias ergonomiques pour les vues publiques web (hero/QR/cartes) — dérivés
// des tokens bruts (tokens.ts), jamais une nouvelle couleur inventée ici.
//
// Chaque alias est enveloppé dans `var(--o-x, fallback)` — le fallback est
// TOUJOURS le token brut (comportement inchangé pour tout consommateur qui
// ne définit rien), mais un ancêtre DOM qui pose la custom property (voir
// LocationPage.tsx: ThemePalette + themeVars) peut la réécrire à
// l'exécution sans que ce composant en sache rien. C'est ce qui permet à
// InfoRow/QrCard/etc. — qui importent ces constantes directement — de
// suivre un changement de thème choisi plus haut dans l'arbre, sans prop
// drilling. Reste spécifique à web/ (tokens.ts, lui, ne doit JAMAIS
// utiliser var() — un futur client React Native ne le comprendrait pas).
import { colors, alpha, typography, fontSize } from "../tokens";

// Conversion rem — SEULE cette couche web convertit les nombres bruts de
// `fontSize` (tokens.ts) en unité CSS ; rem respecte le zoom/la taille de
// police du navigateur (accessibilité), contrairement à px. `FONT.*` est la
// façon canonique de fixer une taille de texte dans web/ — jamais un nombre
// en dur dans un composant (voir Text.tsx, qui les consomme).
export const rem = (px: number) => `${px / 16}rem`;
export const FONT = Object.fromEntries(
  Object.entries(fontSize).map(([key, px]) => [key, rem(px)])
) as Record<keyof typeof fontSize, string>;

export const BG = `var(--o-bg, ${colors.bg})`;
export const BG2 = `var(--o-bg2, ${colors.bg2})`;
export const CARD = `var(--o-card, ${colors.panel})`;
export const TXT = `var(--o-txt, ${colors.txt})`;
export const DIM = `var(--o-dim, ${colors.dim})`;
export const DIM2 = `var(--o-dim2, ${colors.dim2})`;
export const BORDER = `var(--o-border, ${colors.line})`;
export const ACCENT = `var(--o-accent, ${colors.t1})`;
export const ACCENT_LIGHT = `var(--o-accent-light, ${alpha.t1_22})`;
export const MONO = `${typography.fontDisplay}, monospace`;
