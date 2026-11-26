// Branchement react-router-dom de la coque (peerDependency optionnelle) : liens du fil d'Ariane, fil d'Ariane de l'URL courante, vue courante, redirection des anciennes URL.
import { useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { AdminRegistry } from "./admin-registry";
import { legacyRedirectUrl } from "./admin-legacy";
import { AdminLinkContext, type AdminLinkProps } from "./admin-link";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";

const RouterLink = ({ to, className, style, children }: AdminLinkProps) => <Link to={to} className={className} style={style}>{children}</Link>;

/** Fournit `Link` de react-router-dom aux liens de la coque (sans navigation par rechargement). */
export function AdminRouterLinks({ children }: { children: ReactNode }) {
  return <AdminLinkContext.Provider value={RouterLink}>{children}</AdminLinkContext.Provider>;
}

/** Fil d'Ariane de la vue ouverte (déduite de l'URL), à poser au-dessus du titre d'une fiche ; `entity` ajoute la fiche comme dernière miette. */
export function ViewBreadcrumbs({ registry, entity, visible }: { registry: AdminRegistry; entity?: { kind: string; label: string }; visible?: boolean }) {
  const view = registry.viewFromPathname(useLocation().pathname);
  return view ? <AdminBreadcrumbs crumbs={registry.crumbsFor(view, entity)} visible={visible} /> : null;
}

/** Vue et identifiant de page pleine pour l'URL courante ; une URL inconnue retombe sur `fallback`. */
export function useAdminLocation(registry: AdminRegistry, fallback: string): { view: string; id: string | null } {
  return registry.locate(useLocation().pathname, fallback);
}

/** Ancienne URL (lien enregistré, ancien message…) → remplacée par le chemin actuel, query et hash conservés. Renvoie vrai tant qu'une redirection est en cours (ne rien afficher). */
export function useLegacyRedirect(registry: AdminRegistry): boolean {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const target = legacyRedirectUrl(registry, pathname, search, hash);
  useEffect(() => { if (target) navigate(target, { replace: true }); }, [target, navigate]);
  return target !== null;
}
