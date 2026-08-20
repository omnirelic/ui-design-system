// Thème React Native — dérivé des mêmes tokens bruts que web/theme.ts
// (tokens.ts), jamais une couleur réinventée ici. Remplace en drop-in les
// copies locales `theme.ts` qui existaient dans chaque app mobile
// (courier/producer/packager avant ce package — voir omnirelic/mobile) :
// mêmes clés (bg/bg2/panel/line/text/dim/dim2/t1/t2/accent/danger/success/
// warn/onAccent), une seule fois. `dangerBg`/`onAccent` n'ont pas
// d'équivalent dans tokens.ts (pas de fond translucide "rouge sombre" ni de
// "texte sur accent" cross-platform) — dérivés ici, RN uniquement, comme
// web/theme.ts dérive ses propres alias `var()`.
import { colors, semantic, shades } from "../tokens";

export const theme = {
  bg: colors.bg,
  bg2: colors.bg2,
  panel: colors.panel,
  panelElevated: shades.panelElevated,
  line: colors.line,
  text: colors.txt,
  dim: colors.dim,
  dim2: colors.dim2,
  t1: colors.t1,
  t2: colors.t2,
  accent: colors.accent,
  accentDark: shades.accentDark,
  danger: semantic.danger,
  dangerBg: "#3f1d1d",
  success: semantic.success,
  successDark: shades.successDark,
  warn: semantic.warning,
  onAccent: "#06181c",
  overlay: shades.overlay,
} as const;

export type Theme = typeof theme;
