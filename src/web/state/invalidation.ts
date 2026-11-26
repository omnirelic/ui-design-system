// Registre des ressources admin montées (`useAdminResource`) : l'écriture qui réussit leur demande de se relire.
// Module sans dépendance — `admin-fetch` l'appelle, `useAdminResource` s'y inscrit, sans cycle d'imports.

const mounted = new Set<{ url: string; reload: () => void }>();

/** Inscrit une ressource lue à `url` ; retourne la désinscription (démontage). */
export function registerResource(url: string, reload: () => void): () => void {
  const entry = { url, reload };
  mounted.add(entry);
  return () => { mounted.delete(entry); };
}

const pathOf = (url: string) => url.split(/[?#]/)[0];

/** Écrire `written` change `resource` : même chemin, ou l'un est la fiche de l'autre (`/x` ↔ `/x/<id>`). Requête et ancre ignorées. */
export function isRelatedWrite(resource: string, written: string): boolean {
  const r = pathOf(resource); const w = pathOf(written);
  return r === w || w.startsWith(`${r}/`) || r.startsWith(`${w}/`);
}

/** Après une écriture : relit toutes les ressources montées dont l'URL commence par `prefix` (cas explicite, ex. un effet de bord sur un autre domaine). */
export function invalidateAdminResource(prefix: string): void {
  [...mounted].filter(e => e.url.startsWith(prefix)).forEach(e => e.reload());
}

/** Appelé par `adminFetch` après toute écriture réussie : les ressources liées à l'URL écrite se relisent, sans que la vue y pense. */
export function invalidateAfterWrite(writtenUrl: string): void {
  [...mounted].filter(e => isRelatedWrite(e.url, writtenUrl)).forEach(e => e.reload());
}
