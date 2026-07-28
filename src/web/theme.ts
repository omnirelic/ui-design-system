// Alias ergonomiques pour les vues publiques web (hero/QR/cartes) — dérivés
// des tokens bruts (tokens.ts), jamais une nouvelle couleur inventée ici.
import { colors, alpha, typography } from "../tokens";

export const BG = colors.bg;
export const BG2 = colors.bg2;
export const CARD = colors.panel;
export const TXT = colors.txt;
export const DIM = colors.dim;
export const DIM2 = colors.dim2;
export const BORDER = colors.line;
export const ACCENT = colors.t1;
export const ACCENT_LIGHT = alpha.t1_22;
export const MONO = `${typography.fontDisplay}, monospace`;
