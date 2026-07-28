// Tokens omnirelic — source de vérité de l'identité visuelle. Valeurs
// brutes (jamais des CSS custom properties type `var(--x)`) : ce package
// doit rester consommable par n'importe quelle app du réseau, y compris un
// futur client React Native (RN ne comprend pas les custom properties CSS,
// ni les balises DOM — seuls des tokens JS plats traversent la frontière
// web ↔ native). `web/src/index.css` (`:root`) doit rester le miroir exact
// de `colors` ci-dessous — ne pas laisser diverger.
export const colors = {
  bg: "#0a0a0b",
  bg2: "#101013",
  panel: "#141417",
  line: "#26262b",
  txt: "#e9e9ec",
  dim: "#a1a1aa",
  dim2: "#71717a",
  t1: "#5eead4",
  t2: "#38bdf8",
  accent: "#7dd3fc",
} as const;

// Nuances dérivées fréquemment utilisées (fond translucide sur `t1`) —
// centralisées ici plutôt que recomposées en chaîne `${ACCENT}22` dans
// chaque composant consommateur.
export const alpha = {
  t1_0a: "#5eead40a",
  t1_14: "#5eead414",
  t1_22: "#5eead422",
  t1_40: "#5eead440",
  t1_55: "#5eead455",
  t1_88: "#5eead488",
  danger_22: "#fb718522",
  danger_55: "#fb718555",
  warn_22: "#fbbf2422",
  warn_55: "#fbbf2455",
} as const;

export const semantic = {
  success: colors.t1,
  warning: "#fbbf24",
  danger: "#fb7185",
  info: colors.t2,
} as const;

// `fontDisplay`/`fontBody` = familles de police seules (le nom, sans
// fallback ni @import) — un consommateur web charge les fichiers de police
// lui-même (voir web/main.tsx, @fontsource), un consommateur RN charge les
// mêmes familles via ses propres assets natifs. Ce package ne charge jamais
// de police lui-même — juste le nom canonique à utiliser.
export const typography = {
  fontDisplay: "Space Grotesk",
  fontBody: "Inter",
  mono: "Space Grotesk, monospace",
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const spacing = (n: number) => n * 4;
