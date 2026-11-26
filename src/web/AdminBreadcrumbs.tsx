// Fil d'Ariane de l'admin (web/src/admin/ui/Breadcrumbs.tsx de Chez la Petite) : chaque miette est un lien, la dernière marque la page courante.
// CLP le masque partout (interrupteur BREADCRUMBS_VISIBLE = false) : ici `visible` vaut false par défaut, et le fil reste entier en dessous.
import type { Crumb } from "./admin-registry-types";
import { useAdminLink } from "./admin-link";
import { DIM, MONO, TXT, rem } from "./theme";

const caption = { fontFamily: MONO, fontSize: rem(12) } as const;

export function AdminBreadcrumbs({ crumbs, visible = false }: { crumbs: Crumb[]; visible?: boolean }) {
  const LinkTo = useAdminLink();
  if (!visible || !crumbs.length) return null;
  return (
    <nav aria-label="Fil d'Ariane" style={{ display: "flex", alignItems: "center", gap: rem(6), flexWrap: "wrap" }}>
      {crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: rem(6) }}>
          {i > 0 && <span style={{ ...caption, color: DIM }}>›</span>}
          {c.to ? <LinkTo to={c.to} style={{ textDecoration: "none" }}><span style={{ ...caption, color: DIM }}>{c.label}</span></LinkTo>
            : <span aria-current="page" style={{ ...caption, color: TXT }}>{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

/** Fil d'Ariane de la vue affichée, en tête de page (au-dessus des onglets du menu) : Menu › Onglet. */
export function PageBreadcrumbs({ crumbs, visible = false }: { crumbs: Crumb[]; visible?: boolean }) {
  if (!visible) return null;
  return <div style={{ padding: `${rem(10)} ${rem(20)} 0` }}><AdminBreadcrumbs crumbs={crumbs} visible /></div>;
}
