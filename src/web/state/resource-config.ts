// Branchements propres à l'application, que Chez la Petite câble en dur (admin-fetch.ts, useAdminChanges.ts) :
// ici ils s'injectent une fois au démarrage, le reste du cache est repris tel quel.
import type { AdminChangeResource } from "./live-resources";

/** Même contrat que `adminFetch` de CLP : `null` = échec traité (toast déjà posé ou réseau tombé sans copie), réponse `!ok` rendue telle quelle seulement pour `handleStatuses`. */
export type AdminFetchFn = (context: string, url: string, opts?: RequestInit & { invalidate?: boolean; handleStatuses?: number[] }) => Promise<Response | null>;

/** Abonnement temps réel d'une ressource : appelle `onChange` quand un autre auteur l'a écrite. */
export type AdminChangesHook = (resource: AdminChangeResource | readonly AdminChangeResource[] | null, onChange: (id?: string) => void) => void;

/** Lecture seule sans toast ni cache (défaut quand l'application n'a rien injecté). */
const defaultFetch: AdminFetchFn = async (_context, url, opts) => {
  const { invalidate: _i, handleStatuses: handled = [], ...init } = opts ?? {};
  try {
    const r = await fetch(url, init);
    return r.ok || handled.includes(r.status) ? r : null;
  } catch { return null; }
};

let fetcher: AdminFetchFn = defaultFetch;
let changesHook: AdminChangesHook = () => {};

export function setAdminFetch(fn: AdminFetchFn | null): void { fetcher = fn ?? defaultFetch; }
export const adminFetch: AdminFetchFn = (context, url, opts) => fetcher(context, url, opts);

export function setAdminChangesHook(hook: AdminChangesHook | null): void { changesHook = hook ?? (() => {}); }
/** Délègue au hook injecté (aucun abonnement par défaut : jamais de poll de secours ici). */
export const useAdminChanges: AdminChangesHook = (resource, onChange) => changesHook(resource, onChange);
