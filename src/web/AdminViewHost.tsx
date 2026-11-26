// Hôte de la vue ouverte (rendu de web/src/admin/shell/AdminViews.tsx de Chez la Petite, sans les vues) : fil d'Ariane, barre d'onglets du hub, sélecteur de groupe,
// puis la vue, chargée à la demande. Le choix du composant de chaque vue reste à l'application (`children`, typiquement un `lazy` par vue).
import { Suspense, type ReactNode } from "react";
import type { AdminRegistry } from "./admin-registry";
import { HubContext } from "./admin-hub-context";
import { PageBreadcrumbs } from "./AdminBreadcrumbs";
import { AdminHubRail, AdminHubTabs } from "./AdminHubTabs";

export interface AdminViewHostProps {
  registry: AdminRegistry;
  view: string;
  setView: (v: string) => void;
  canSee: (v: string) => boolean;
  badges?: Readonly<Record<string, number>>;
  /** Interrupteur du fil d'Ariane (CLP : masqué partout). */
  breadcrumbsVisible?: boolean;
  /** Pendant le chargement d'une vue. */
  fallback?: ReactNode;
  children: ReactNode;
}

export function AdminViewHost({ registry, view, setView, canSee, badges, breadcrumbsVisible, fallback, children }: AdminViewHostProps) {
  const hub = registry.HUB_OF_VIEW[view];
  return (
    <HubContext.Provider value={!!hub}>
      <PageBreadcrumbs crumbs={registry.crumbsFor(view)} visible={breadcrumbsVisible} />
      {hub && <AdminHubTabs registry={registry} hub={hub} view={view} canSee={canSee} setView={setView} badges={badges} />}
      <AdminHubRail rail={hub ? registry.railOfView(hub, view, canSee) : null} view={view} setView={setView}>
        <Suspense fallback={fallback ?? <div role="status" aria-live="polite" style={{ padding: 24, opacity: 0.6 }}>Chargement…</div>}>{children}</Suspense>
      </AdminHubRail>
    </HubContext.Provider>
  );
}
