// Sous-export `@omnirelic/ui-design-system/search` : recherche stricte de l'admin de Chez la Petite (sous-chaînes, accents et casse ignorés, aucune tolérance de faute,
// tous les mots en ET) et index `libellé + mots-clés` (base de la palette ⌘K). Logique pure, sans React.
export { SEARCH_PAGE_SIZE, filterByWords, foldAccents, mergeSearchResults, needsServerSearch, normalizeSearch, searchKeywordIndex, searchWords } from "./strict-search";
export type { KeywordEntryInterface } from "./strict-search";
