// En-tête unique des vues + gabarit de page (web/src/admin/ui/PageHeader.tsx, PageShell.tsx de Chez la Petite). Sous un hub, l'onglet actif tient lieu de titre :
// on garde le sous-titre et les actions ; sous un onglet à groupe, le sélecteur de vue (HubRail) prend la place du titre, à gauche.
import "./admin-shell-css";
import type { ReactNode } from "react";
import { useHubSwitcher, useInHub } from "./admin-hub-context";
import { DIM, MONO, TXT, rem } from "./theme";
import { typography } from "../tokens";

export interface AdminPageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Boutons d'action de la vue (à droite). */
  actions?: ReactNode;
}

export function AdminPageHeader({ title, subtitle, actions }: AdminPageHeaderProps) {
  const inHub = useInHub();
  const switcher = useHubSwitcher();
  if (inHub && !subtitle && !actions && !switcher) return null;
  return (
    <header className="omni-shell-head">
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: rem(4) }}>
        {switcher}
        {!inHub && <h2 style={{ margin: 0, fontFamily: `${typography.fontDisplay}, sans-serif`, fontSize: rem(21), fontWeight: 300, color: TXT, lineHeight: 1.2 }}>{title}</h2>}
        {subtitle && <div style={{ fontFamily: MONO, fontSize: rem(13.5), color: DIM }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: rem(8), alignItems: "center", flexWrap: "wrap" }}>{actions}</div>}
    </header>
  );
}

export interface AdminPageShellProps extends AdminPageHeaderProps {
  /** Filtres / recherche, sous l'en-tête. */
  toolbar?: ReactNode;
  children: ReactNode;
}

/** Gabarit unique de toutes les vues admin : en-tête, actions, barre de filtres, contenu. */
export function AdminPageShell({ title, subtitle, actions, toolbar, children }: AdminPageShellProps) {
  return (
    <section className="omni-shell-page">
      <AdminPageHeader title={title} subtitle={subtitle} actions={actions} />
      {toolbar && <div className="omni-shell-filters">{toolbar}</div>}
      {children}
    </section>
  );
}
