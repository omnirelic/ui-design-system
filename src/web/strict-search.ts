// Recherche stricte de l'admin de Chez la Petite : sous-chaînes, accents et casse ignorés, AUCUNE tolérance de faute ; tous les mots doivent correspondre
// (ET, ordre libre). Reprend admin/whatsapp/conversation-search.ts (liste des conversations) et admin/item/item-search.ts (index de réglages avec
// `keywords`, base de la palette ⌘K, lot 9). La pliure est `normalize('NFD')` + retrait des marques : « ß », « Œ » et les ligatures ne se
// décomposent pas et disparaissent comme chez CLP (voir les cas épinglés dans les tests de parité).

/** Minuscules, sans accents, sans ponctuation ni puces : « Éloïse » et « eloise » se valent, « +237 ••• 19 » devient « 237 19 ». */
export function normalizeSearch(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Pliure légère de la recherche d'index : accents et casse seulement, la ponctuation reste (item-search.ts de CLP). */
export function foldAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Les mots de la requête, normalisés ; vide si la requête n'a que des espaces ou de la ponctuation. */
export function searchWords(query: string): string[] {
  return normalizeSearch(query).split(" ").filter(Boolean);
}

/**
 * Filtre local (instantané) d'une liste déjà chargée : chaque mot de la requête doit apparaître dans le texte de la ligne (`haystack` : nom, aperçu, numéro
 * masqué, numéro de commande, mots-clés…). Requête vide (ou ponctuation seule) : tout.
 */
export function filterByWords<T>(items: readonly T[], query: string, haystack: (item: T) => readonly string[]): T[] {
  const words = searchWords(query);
  if (words.length === 0) return [...items];
  return items.filter((item) => {
    const hay = normalizeSearch(haystack(item).join(" "));
    return words.every((w) => hay.includes(w));
  });
}

export interface KeywordEntryInterface { label: string; keywords: string }

/** Recherche stricte dans un index `libellé + mots-clés` (réglages d'un formulaire, vues d'une palette) : tous les mots doivent correspondre ; requête vide : rien. */
export function searchKeywordIndex<T extends KeywordEntryInterface>(query: string, index: readonly T[]): T[] {
  const tokens = foldAccents(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return index.filter((e) => {
    const hay = foldAccents(`${e.label} ${e.keywords}`);
    return tokens.every((t) => hay.includes(t));
  });
}

/** Résultats locaux d'abord (inchangés, sans clignotement), puis ce que le serveur trouve en plus, du plus récent au plus ancien (`lastMessageAt`). */
export function mergeSearchResults<T extends { id: string; lastMessageAt: string }>(local: readonly T[], server: readonly T[] | undefined): T[] {
  if (!server?.length) return [...local];
  const seen = new Set(local.map((c) => c.id));
  const extra = server.filter((c) => !seen.has(c.id)).sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  return extra.length ? [...local, ...extra] : [...local];
}

/** Taille d'une page de liste de CLP : au-delà, la liste chargée est peut-être partielle. */
export const SEARCH_PAGE_SIZE = 50;

/** Le serveur ne sert qu'en complément : liste chargée partielle (page pleine) ou numéro entier (le masqué n'en garde que la fin). */
export function needsServerSearch(items: readonly unknown[], query: string, pageSize: number = SEARCH_PAGE_SIZE): boolean {
  if (!query.trim()) return false;
  return items.length >= pageSize || /\d{5,}/.test(query.replace(/[\s.-]/g, ""));
}
