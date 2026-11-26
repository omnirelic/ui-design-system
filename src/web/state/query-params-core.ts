// État de vue porté par l'URL, repris de web/src/admin/lib/query-params.ts + useQueryParamItem.ts de Chez la Petite.
// Seule différence : la source de `URLSearchParams` est un adaptateur injecté (`createQueryParamHooks`), pour ne
// pas imposer un routeur ni en exiger un dans les tests. Le branchement react-router (celui de CLP) est dans `query-params.ts`.
import { useCallback, useEffect, useState } from "react";

/** Copie de `prev` avec `key` posé (ou retiré si `value` est vide). Les autres paramètres de l'URL sont conservés. */
export function withQueryParam(prev: URLSearchParams, key: string, value: string | null | undefined): URLSearchParams {
  const next = new URLSearchParams(prev);
  if (value) next.set(key, value); else next.delete(key);
  return next;
}

/** Écrit l'URL à partir de la précédente (même contrat que le setter de `useSearchParams` de react-router). */
export type SetQueryParams = (update: (prev: URLSearchParams) => URLSearchParams) => void;
/** Lit et écrit les paramètres de l'URL courante : hook appelé à chaque rendu, comme `useSearchParams`. */
export type QueryParamsAdapter = () => readonly [URLSearchParams, SetQueryParams];

export function createQueryParamHooks(useParams: QueryParamsAdapter) {
  /**
   * État de vue porté par l'URL (`?key=valeur`) : ce que l'écran montre (plat sélectionné, onglet…) doit toujours
   * pouvoir se partager et se rouvrir tel quel. Les autres paramètres de l'URL sont conservés.
   */
  function useQueryParam(key: string): [string | null, (value: string | null) => void] {
    const [params, setParams] = useParams();
    const set = useCallback((value: string | null) => setParams(prev => withQueryParam(prev, key, value)), [setParams, key]);
    return [params.get(key), set];
  }

  /**
   * Pose / retire plusieurs paramètres en UNE mise à jour d'URL. Plusieurs `useQueryParam` appelés à la suite dans le
   * même événement partent tous de la même URL : le dernier écrase les précédents. Ici, un seul `setParams`.
   */
  function useSetQueryParams(): (patch: Record<string, string | null | undefined>) => void {
    const [, setParams] = useParams();
    return useCallback((patch) => setParams(prev => Object.entries(patch).reduce((next, [key, value]) => withQueryParam(next, key, value), prev)), [setParams]);
  }

  /**
   * Élément ouvert (fiche, tiroir d'édition) dont l'identifiant vit dans l'URL (`?key=id`).
   * L'élément est retrouvé dans `items` ; un identifiant inconnu ou périmé donne `null` (jamais d'erreur).
   * L'objet renvoyé est un instantané : un rechargement de la liste ne le remplace pas tant que l'id ne change pas,
   * ce qui évite de réinitialiser un formulaire en cours de saisie.
   * `legacyIds` : anciens identifiants encore reconnus (liens déjà partagés) ; l'URL est alors réécrite avec l'identifiant courant.
   */
  function useQueryParamItem<T>(key: string, items: readonly T[], getId: (item: T) => string, legacyIds?: (item: T) => readonly string[]): [T | null, (item: T | null) => void] {
    const [id, setId] = useQueryParam(key);
    const [snapshot, setSnapshot] = useState<T | null>(null);
    useEffect(() => {
      const next = id ? items.find(i => getId(i) === id) ?? (legacyIds ? items.find(i => legacyIds(i).includes(id)) ?? null : null) : null;
      if (next && id && getId(next) !== id) setId(getId(next));
      setSnapshot(prev => (prev !== null && next !== null && getId(prev) === getId(next) ? prev : next));
    }, [id, items]); // eslint-disable-line react-hooks/exhaustive-deps
    const open = (item: T | null) => { setSnapshot(item); setId(item ? getId(item) : null); };
    return [snapshot, open];
  }

  return { useQueryParam, useSetQueryParams, useQueryParamItem };
}
