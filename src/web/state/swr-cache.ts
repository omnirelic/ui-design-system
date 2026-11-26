// Cache « stale-while-revalidate » des GET admin — le stockage (IndexedDB, cloisonné par admin) vit dans swr-store.ts,
// partagé avec admin-fetch.ts (copie locale automatique de tous les GET JSON, relue hors-ligne).
import { adminFetch } from "./resource-config";
import { isFromCache, readSwr, writeSwr } from "./swr-store";

export { SWR_MAX_AGE_MS, clearSwrCache, readSwr, setSwrScope, writeSwr, writeSwrThrottled } from "./swr-store";

// Requêtes réseau en cours par URL : deux vues (ou deux composants) qui demandent la même ressource
// en même temps partagent UNE requête au lieu de deux.
const inflight = new Map<string, Promise<{ data: unknown; fromCache: boolean } | null>>();

function fetchShared(context: string, url: string, handled?: number[]): Promise<{ data: unknown; fromCache: boolean } | null> {
  let p = inflight.get(url);
  if (!p) {
    p = (async () => {
      const r = await (handled ? adminFetch(context, url, { handleStatuses: handled }) : adminFetch(context, url));
      if (!r || r.ok === false) return null; // statut traité par l'appelant (ex. 404) : aucune donnée, aucun toast
      const data = await r.json().catch(() => undefined);
      return data === undefined ? null : { data, fromCache: isFromCache(r) };
    })().finally(() => { inflight.delete(url); });
    inflight.set(url, p);
  }
  return p;
}

/**
 * GET JSON admin avec cache. `apply(data, stale)` est appelé d'abord avec la copie locale (stale=true,
 * seulement si elle existe ET que la réponse fraîche n'est pas déjà arrivée), puis avec la réponse du
 * réseau (stale=false). Échec réseau : la copie locale reste affichée. Renvoie true si le réseau a répondu.
 * `quietStatuses` : statuts d'erreur attendus (ex. 404 d'une réf. expirée) : pas de toast, simplement aucune donnée.
 * `ttlMs` : une copie locale plus récente que ça est servie comme fraîche, SANS requête (données de
 * référence rarement modifiées) ; une écriture invalide via `reload`/`invalidateAdminResource`, jamais via le TTL.
 */
export async function swrJson<T>(context: string, url: string, apply: (data: T, stale: boolean) => void, opts: { useCache?: boolean; ttlMs?: number; quietStatuses?: number[] } = {}): Promise<boolean> {
  let fresh = false;
  const useCache = opts.useCache !== false;
  if (useCache && opts.ttlMs && opts.ttlMs > 0) {
    const hit = await readSwr<T>(url);
    if (hit && Date.now() - hit.at < opts.ttlMs) { apply(hit.data, false); return true; }
  }
  const cached = useCache ? readSwr<T>(url).then((c) => { if (c && !fresh) apply(c.data, true); }) : Promise.resolve();
  const res = await fetchShared(context, url, opts.quietStatuses);
  if (res && res.fromCache) { fresh = true; await cached; apply(res.data as T, true); return false; } // repli hors-ligne d'admin-fetch : reste « périmé », ne rallonge pas la durée de vie
  if (res) { fresh = true; await cached; writeSwr(url, res.data); apply(res.data as T, false); return true; }
  await cached;
  return false;
}
