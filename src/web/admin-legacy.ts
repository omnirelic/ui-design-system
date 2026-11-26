// Redirection des anciennes URL (effet d'AdminPage de Chez la Petite) : l'ancien chemin est remplacé par le chemin actuel, query et hash conservés.
// La cible peut porter sa propre query (`system/settings?group=wallet`) : fusionnée avec celle de l'ancienne URL, la query de l'URL entrante gagnant.
import type { AdminRegistry } from "./admin-registry";

/** Nouvelle adresse (avec « /admin/ ») d'une ancienne URL, ou null si le chemin est déjà le bon. */
export function legacyRedirectUrl(registry: AdminRegistry, pathname: string, search: string, hash: string): string | null {
  const target = registry.resolveLegacyPath(pathname.replace(/^\/admin\/?/, ""));
  if (!target) return null;
  const [targetPath, targetQuery = ""] = target.split("?");
  const merged = new URLSearchParams(targetQuery);
  new URLSearchParams(search).forEach((val, key) => merged.set(key, val));
  const qs = merged.toString();
  return `/admin/${targetPath}${qs ? `?${qs}` : ""}${hash}`;
}
