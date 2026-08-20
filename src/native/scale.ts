/**
 * Échelle typographique/spacing native — `rem()`-scalée (voir
 * `responsive.ts`), canonique pour toutes les apps mobiles omnirelic
 * (courier/producer/packager). Port direct de l'échelle de courier (seule
 * app à en avoir eu une jusqu'ici) — DISTINCTE de `radius`/`spacing` de la
 * racine du package (`tokens.ts`), qui ciblent des pixels CSS web
 * statiques, pas du natif responsive par largeur d'écran. Ne pas confondre
 * les deux — chacune sert sa plateforme.
 */
import { rem } from "./responsive";

export const fonts: { regular: string | undefined; mono: string | undefined } = {
  regular: undefined, // police système (Roboto/SF) — propre et sans chargement
  mono: "monospace",
};

export const spacing = {
  xs: rem(4),
  sm: rem(8),
  md: rem(12),
  lg: rem(16),
  xl: rem(24),
  xxl: rem(32),
};

export const radius = {
  sm: rem(8),
  md: rem(14),
  lg: rem(20),
  xl: rem(26),
  full: 999,
};

export const fontSize = {
  tiny: rem(10),
  xs: rem(12),
  sm: rem(14),
  md: rem(15),
  lg: rem(17),
  xl: rem(20),
  xxl: rem(26),
  hero: rem(40),
  giant: rem(72),
};

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  accent: {
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
};
