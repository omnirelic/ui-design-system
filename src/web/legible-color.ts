// Garde-fou de contraste d'une icône qui garde la couleur réelle d'une chose (véhicule, sac) sur le disque d'une pastille : repris de web/src/admin/lib/legible-color.ts de CLP.
// Un bleu marine ou un noir y disparaissent : la couleur est mélangée vers le blanc, par petits pas, jusqu'au ratio voulu (WCAG).

const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

type Rgb = [number, number, number];

function parse(color: string): Rgb | null {
  const c = color.trim();
  if (!hex.test(c)) return null;
  const h = c.length === 4 ? [...c.slice(1)].map(x => x + x).join("") : c.slice(1);
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

const toHex = (rgb: Rgb): string => `#${rgb.map(v => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

function luminance([r, g, b]: Rgb): number {
  const lin = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Ratio de contraste WCAG entre deux couleurs « #rgb » / « #rrggbb » (1 à 21) ; 1 si l'une est illisible. */
export function contrastRatio(a: string, b: string): number {
  const pa = parse(a), pb = parse(b);
  if (!pa || !pb) return 1;
  const [hi, lo] = [luminance(pa), luminance(pb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Gris foncé du disque d'une pastille (31, 31, 31 : le « #1f1f1f » de CLP), sur lequel la teinte est mélangée à 16 %. Calcul de contraste seulement : le disque, lui, suit le thème. */
const DISC_BASE: Rgb = [31, 31, 31];

/** Fond réel du disque teinté (cf. `.omni-pst-lead--tint` : 16 % de la couleur sur le gris foncé du disque). */
export function tintedDiscBackground(tint: string): string {
  const p = parse(tint);
  return toHex(p ? p.map((v, i) => v * 0.16 + DISC_BASE[i] * 0.84) as Rgb : DISC_BASE);
}

/**
 * La couleur lisible sur `background` : inchangée si le ratio est déjà atteint, sinon mélangée vers le blanc jusqu'à `min` (4,5:1 par
 * défaut, jamais sous 3:1). Une valeur qui n'est pas un « #hex » reste telle quelle.
 */
export function legibleColor(color: string, background: string, min = 4.5): string {
  const p = parse(color);
  if (!p || !parse(background) || contrastRatio(color, background) >= min) return color;
  for (let t = 0.05; t < 1; t += 0.05) {
    const mixed = toHex(p.map(v => v + (255 - v) * t) as Rgb);
    if (contrastRatio(mixed, background) >= min) return mixed;
  }
  return "#ffffff";
}
