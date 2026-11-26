// Modèle de la palette de commandes ⌘K (web/src/admin/CommandPalette.tsx de Chez la Petite) : normalisation, score de recherche STRICTE et construction de l'index.
// Logique pure, reprise telle quelle ; les réglages et les fonctions sont des données injectées par l'application (SETTINGS_SECTIONS, ADMIN_FEATURES chez CLP).
import type { NavGroup } from "./admin-registry-types";

export type PaletteEntry =
  | { kind: "view"; key: string; label: string; group: string; keywords?: string[] }
  | { kind: "feature"; key: string; label: string; group: string; keywords: string[] }
  | { kind: "setting"; fieldKey: string; label: string; hint: string; group: string };

/** Fonctionnalité portée par une vue (ADMIN_FEATURES) : visible seulement si le rôle voit la vue. */
export interface PaletteFeature { view: string; label: string; keywords: readonly string[] }
/** Réglage éditable (champ d'une section de paramètres). */
export interface PaletteSetting { fieldKey: string; label: string; hint: string; group: string }

// Normalise : minuscules + sans accents (« Paramètres » → « parametres »).
export const norm = (s: string): string => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const BOUNDARY = /[\s\-/·&()]/;

/**
 * Match STRICT par sous-chaîne contiguë : `q` doit apparaître tel quel dans `text` (accents déjà neutralisés par `norm`). Pas de fuzzy par sous-séquence :
 * « cmd » ne matche PAS « Commandes ». Score (plus haut = meilleur) ou null. Classement : préfixe > début de mot > interne ; bonus de densité.
 */
function substr(text: string, q: string): number | null {
  const idx = text.indexOf(q);
  if (idx === -1) return null;
  let s = 20;
  if (idx === 0) s += 30;
  else if (BOUNDARY.test(text[idx - 1])) s += 18;
  s += Math.max(0, 10 - (text.length - q.length));
  return s;
}

/**
 * Score d'une entrée : meilleur match sur label / hint (réglages) / mots-clés / groupe, avec un poids de base par champ (label ≫ mots-clés ≫ hint ≫ groupe).
 * Requête vide : seuls les menus s'affichent (1) ; réglages et fonctions n'apparaissent qu'à la frappe (0).
 */
export function score(e: PaletteEntry, q: string): number {
  if (!q) return e.kind === "view" ? 1 : 0;
  let best = -Infinity;
  const L = substr(norm(e.label), q);
  if (L !== null) best = Math.max(best, L + 1000);
  if (e.kind === "setting") {
    const H = substr(norm(e.hint), q);
    if (H !== null) best = Math.max(best, H + 300);
  }
  if (e.kind === "feature") {
    for (const kw of e.keywords) {
      const K = substr(norm(kw), q);
      if (K !== null) best = Math.max(best, K + 400);
    }
  }
  if (e.kind === "view" && e.keywords) {
    for (const kw of e.keywords) {
      const K = substr(norm(kw), q);
      if (K !== null) best = Math.max(best, K + 400);
    }
  }
  const Gr = substr(norm(e.group), q);
  if (Gr !== null) best = Math.max(best, Gr + 100);
  return best > -Infinity ? best : 0;
}

/** Index dérivé du menu (permissions déjà appliquées via `hidden`). Les réglages ne sont indexés que si la vue `settingsView` est visible. */
export function buildPaletteEntries(args: { navGroups: NavGroup[]; features?: readonly PaletteFeature[]; settings?: readonly PaletteSetting[]; settingsView?: string }): PaletteEntry[] {
  const { navGroups, features = [], settings = [], settingsView = "settings" } = args;
  const views: PaletteEntry[] = navGroups.flatMap(g =>
    g.items.filter(i => !i.hidden).map(i => ({ kind: "view" as const, key: i.key, label: i.label, group: g.label, keywords: i.keywords })),
  );
  const settingsVisible = navGroups.some(g => g.items.some(i => i.key === settingsView && !i.hidden));
  const settingEntries: PaletteEntry[] = settingsVisible ? settings.map(s => ({ kind: "setting" as const, ...s })) : [];
  const visibleViews = new Map(navGroups.flatMap(g => g.items.filter(i => !i.hidden).map(i => [i.key, g.label] as const)));
  const featureEntries: PaletteEntry[] = features.filter(f => visibleViews.has(f.view)).map(f => (
    { kind: "feature" as const, key: f.view, label: f.label, group: visibleViews.get(f.view)!, keywords: [...f.keywords] }));
  return [...views, ...featureEntries, ...settingEntries];
}

/** Résultats triés pour une saisie : score décroissant (tri stable : à égalité, l'ordre de l'index). */
export function rankPalette(entries: readonly PaletteEntry[], query: string): PaletteEntry[] {
  const q = norm(query.trim());
  return entries.map(e => ({ e, s: score(e, q) })).filter(r => r.s > 0).sort((a, b) => b.s - a.s).map(r => r.e);
}

/** Clé React d'une ligne de la palette (comme CLP : `s:`, `v:`, `f:` + clé ou libellé de la fonction). */
export const paletteKey = (e: PaletteEntry): string => (e.kind === "setting" ? `s:${e.fieldKey}` : `${e.kind[0]}:${e.kind === "feature" ? e.label : e.key}`);
