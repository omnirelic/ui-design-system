// Repris de web/src/admin/lib/admin-fetch.ts de Chez la Petite : copie locale automatique de tout GET JSON (relue si le réseau
// tombe) et relecture des ressources liées après une écriture réussie. Les trois dépendances propres à CLP (toast d'erreur,
// signal de connectivité, `engineFetch`) sont injectées par `createAdminFetch` ; la logique est inchangée.
import { invalidateAfterWrite } from "./invalidation";
import { FROM_CACHE_HEADER, isFromCache, readSwr, writeSwrThrottled } from "./swr-store";
import type { AdminFetchFn } from "./resource-config";

export { isFromCache };

/** Exclusions de copie locale de CLP (authentification, accès temporaires, états de téléphone, usages d'article : jamais resservis périmés). */
export const CLP_NOT_CACHED = /^\/api\/(auth\b|support\/access-grants|support\/conversations\/[^/]+\/phone-state|orders\?view=phone_match|menu\/ingredients\/[^/?]+\?usage)/;

/**
 * `invalidate: false` : cette écriture ne change rien d'affiché (aperçu, calcul) : les ressources liées ne se relisent pas.
 * `handleStatuses` : statuts d'erreur que l'appelant traite lui-même : pas de toast, la réponse est rendue telle quelle (`!ok`).
 */
export type AdminFetchInit = RequestInit & { invalidate?: boolean; handleStatuses?: number[] };

export interface AdminFetchDeps {
  /** Pose l'erreur à l'écran (toast) : appelée pour une réponse en erreur non traitée et pour une écriture dont le réseau a échoué. */
  pushError: (e: { context: string; status: number | null; url: string; message: string }) => void;
  /** Signal de connectivité (bandeau hors-ligne). */
  reportNetworkSuccess?: () => void;
  reportNetworkFailure?: () => void;
  /** Exécute la requête (défaut : `fetch`). CLP passe `engineFetch` pour l'engine. */
  fetch?: (url: string, init?: RequestInit) => Promise<Response>;
  /** URL jamais copiées ni resservies depuis la copie locale (défaut : `CLP_NOT_CACHED`). */
  notCached?: RegExp;
}

const isRead = (opts?: RequestInit) => !opts?.method || opts.method.toUpperCase() === "GET";

export function createAdminFetch(deps: AdminFetchDeps): AdminFetchFn {
  const { pushError, reportNetworkSuccess = () => {}, reportNetworkFailure = () => {}, notCached = CLP_NOT_CACHED } = deps;
  const doFetch = deps.fetch ?? ((url: string, init?: RequestInit) => fetch(url, init));

  async function cachedResponse(url: string): Promise<Response | null> {
    const hit = await readSwr<unknown>(url);
    return hit ? new Response(JSON.stringify(hit.data), { status: 200, headers: { "Content-Type": "application/json", [FROM_CACHE_HEADER]: "1" } }) : null;
  }
  function remember(url: string, r: Response, opts?: RequestInit): void {
    if (!r.ok || !isRead(opts) || notCached.test(url) || !(r.headers.get("content-type") ?? "").includes("json")) return;
    void r.clone().json().then((data) => writeSwrThrottled(url, data)).catch(() => {});
  }

  // Échec réseau d'un GET : le bandeau hors-ligne et la copie locale le disent déjà, pas de toast par requête.
  // Une écriture qui échoue reste toujours signalée (rien n'est enregistré hors-ligne).
  async function networkError(context: string, url: string, err: unknown, opts?: RequestInit): Promise<Response | null> {
    reportNetworkFailure();
    if (isRead(opts)) return notCached.test(url) ? null : cachedResponse(url);
    pushError({ context, status: null, url, message: err instanceof Error ? err.message : "Erreur réseau" });
    return null;
  }

  async function handleResponse(context: string, url: string, r: Response, handled: number[] = []): Promise<Response | null> {
    if (!r.ok && handled.includes(r.status)) return r;
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      let message = `HTTP ${r.status}`;
      // NestJS renvoie { statusCode, error: "Conflict", message: "<texte utile>" } : on privilégie `message` (l'explication métier).
      try {
        const j = JSON.parse(text);
        const m = Array.isArray(j.message) ? j.message.join(", ") : j.message;
        message = m || j.error || message;
      } catch { /* not JSON */ }
      pushError({ context, status: r.status, url, message });
      return null;
    }
    return r;
  }

  /** Une écriture réussie relit ce qui est affiché à son sujet : une vue n'a plus à penser à recharger. */
  function refreshAfterWrite(url: string, r: Response, opts?: AdminFetchInit): void {
    if (r.ok && !isRead(opts) && opts?.invalidate !== false && !/[?&]preview=/.test(url)) invalidateAfterWrite(url);
  }
  function fetchInit(opts?: AdminFetchInit): RequestInit | undefined {
    if (!opts || !("invalidate" in opts || "handleStatuses" in opts)) return opts;
    const { invalidate: _invalidate, handleStatuses: _handled, ...init } = opts;
    return init;
  }

  return async function adminFetch(context, url, opts) {
    try {
      const r = await doFetch(url, fetchInit(opts));
      reportNetworkSuccess();
      remember(url, r, opts);
      refreshAfterWrite(url, r, opts);
      return await handleResponse(context, url, r, opts?.handleStatuses);
    } catch (err) {
      return networkError(context, url, err, opts);
    }
  };
}
