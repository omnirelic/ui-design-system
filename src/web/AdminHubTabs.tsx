// Barre d'onglets d'un menu à onglets (web/src/admin/shell/HubTabs.tsx, HubRail.tsx de Chez la Petite) : un onglet par vue visible pour le rôle + bouton d'action principal ;
// les vues d'un onglet à groupe (Menu : Plats, Catégories…) se choisissent dans un menu déroulant posé par l'en-tête de la vue.
import "./admin-shell-css";
import type { ReactNode } from "react";
import type { AdminRegistry } from "./admin-registry";
import type { AdminHubDef, RailEntry } from "./admin-registry-types";
import { HubSwitcherContext } from "./admin-hub-context";
import { ControlButton } from "./controls";
import { Icon } from "./Icon";
import { Select } from "./Select";

export interface AdminHubTabsProps {
  registry: AdminRegistry;
  hub: AdminHubDef;
  view: string;
  canSee: (v: string) => boolean;
  setView: (v: string) => void;
  /** Pastilles par vue (ex. commandes non lues). */
  badges?: Readonly<Record<string, number>>;
}

export function AdminHubTabs({ registry, hub, view, canSee, setView, badges }: AdminHubTabsProps) {
  const tabs = registry.hubTabEntries(hub, view, canSee);
  const action = hub.action && canSee(hub.action.view) ? hub.action : null;
  if (tabs.length <= 1 && !action) return null;
  return (
    <div className="omni-shell-bar" role="tablist" aria-label={hub.label}>
      <div className="omni-shell-tabs">
        {tabs.map(t => {
          const badge = badges?.[t.target];
          return (
            <ControlButton key={t.key} role="tab" aria-selected={t.active} aria-pressed={t.active} variant="seg" onClick={() => setView(t.target)}>
              {t.label}{badge ? <span className="omni-shell-badge">{badge > 99 ? "99+" : badge}</span> : null}
            </ControlButton>
          );
        })}
      </div>
      {action && (
        <ControlButton variant="primary" icon={<Icon name={action.icon ?? "action-add"} size={14} />} onClick={() => setView(action.view)}>
          {action.label}
        </ControlButton>
      )}
    </div>
  );
}

/**
 * Onglet de hub à groupe : les vues du groupe se choisissent dans un menu déroulant que l'en-tête de la vue (AdminPageHeader) pose à gauche, sur la ligne de ses actions,
 * sans colonne dédiée. Sans groupe à choisir, le contenu passe tel quel.
 */
export function AdminHubRail({ rail, view, setView, children }: {
  rail: { title: string; items: RailEntry[] } | null; view: string; setView: (v: string) => void; children: ReactNode;
}) {
  if (!rail) return <>{children}</>;
  const switcher = (
    // 220 px = largeur de l'ancien rail ; la cellule d'en-tête est en shrink-to-fit, d'où la largeur posée ici.
    <div style={{ width: 220, maxWidth: "100%" }}>
      <Select ariaLabel={rail.title} value={view} onChange={setView} options={rail.items.map(i => ({ value: i.key, label: i.label }))} />
    </div>
  );
  return <div className="omni-shell-hubpane"><HubSwitcherContext.Provider value={switcher}>{children}</HubSwitcherContext.Provider></div>;
}
