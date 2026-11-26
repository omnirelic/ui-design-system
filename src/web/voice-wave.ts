// Onde d'une note vocale (web/src/chat/chat-wave.ts de CLP) : hauteurs de barres pseudo-aléatoires mais stables par message (le moteur n'envoie aucun pic réel).
export const BARS = 40;
export const SPEEDS = [1, 1.5, 2] as const;

export function waveBars(seed: string, count = BARS): number[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Array.from({ length: count }, () => {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return 0.25 + (h % 1000) / 1000 * 0.75;
  });
}

export const nextSpeed = (s: number): number => SPEEDS[(SPEEDS.indexOf(s as (typeof SPEEDS)[number]) + 1) % SPEEDS.length];
export const speedLabel = (s: number): string => `${String(s).replace(".", ",")}×`;
/** Fraction (0 à 1) d'un clic dans l'onde. */
export const seekRatio = (x: number, left: number, width: number): number => (width <= 0 ? 0 : Math.min(1, Math.max(0, (x - left) / width)));
