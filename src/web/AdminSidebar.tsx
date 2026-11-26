// Menu de gauche (web/src/admin/AdminSidebar.tsx de Chez la Petite) : une seule liste de menus (un hub = une entrée), icône + libellé + pastille ; repliable sur grand écran,
// hors-champ sous 900 px. La marque, l'identité de l'utilisateur et la déconnexion sont des données de l'application.
import "./admin-shell-css";
import type { ReactNode } from "react";
import type { AdminRegistry } from "./admin-registry";
import type { NavGroup } from "./admin-registry-types";
import { Icon } from "./Icon";
import { FloatingTooltip } from "./FloatingTooltip";
import { ControlButton } from "./controls";
import { toneColor } from "./pastille-model";
import { ACCENT, BORDER, DIM, MONO, rem } from "./theme";

export interface AdminSidebarProps {
  registry: AdminRegistry;
  navGroups: NavGroup[];
  activeView: string;
  setView: (v: string) => void;
  /** Marque en tête : logo + mot (CLP : logo rond + « Admin »). */
  brand?: ReactNode;
  /** Clic sur la marque (CLP : retour à l'accueil) ; absent : la marque n'est pas cliquable. */
  onHome?: () => void;
  /** Pied du menu au-dessus de la déconnexion : rôle et adresse de la personne connectée (CLP : rôle en majuscules + e-mail, ou l'emblème superadmin). */
  identity?: ReactNode;
  logout: () => void;
  /** Off-canvas sous 900 px — repliée par défaut. */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  /** Replié sur grand écran (plein écran de travail). */
  collapsed?: boolean;
}

/** Identité par défaut : rôle en capitales espacées + adresse tronquée (le superadmin de CLP a son propre emblème, à passer en `identity`). */
export function SidebarIdentity({ role, email }: { role?: string; email?: string }) {
  return (
    <div style={{ padding: `${rem(16)} ${rem(16)} 0`, fontFamily: MONO }}>
      <div style={{ fontSize: rem(12), color: ACCENT, letterSpacing: "0.08em", marginBottom: 2 }}>{role?.toUpperCase()}</div>
      <div title={email} style={{ width: 0, minWidth: "100%", fontSize: rem(12), color: DIM, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
    </div>
  );
}

export function AdminSidebar({ registry, navGroups, activeView, setView, brand, onHome, identity, logout, mobileOpen, onMobileClose, collapsed }: AdminSidebarProps) {
  const selectView = (v: string) => { setView(v); onMobileClose?.(); };
  const entries = navGroups.flatMap(g => registry.sidebarEntries(g.items)).filter(e => !e.hidden).sort((a, b) => registry.hubRank(a.key) - registry.hubRank(b.key));
  const brandNode = brand && (onHome
    ? <FloatingTooltip content="Retour à l'accueil" placement="right"><div onClick={onHome} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: rem(10) }}>{brand}</div></FloatingTooltip>
    : <div style={{ display: "flex", alignItems: "center", gap: rem(10) }}>{brand}</div>);

  return (
    <div className={`omni-shell-sidebar${mobileOpen ? " omni-shell-sidebar--open" : ""}${collapsed ? " omni-shell-sidebar--collapsed" : ""}`} style={{ fontFamily: MONO }}>
      <div style={{ padding: `${rem(20)} ${rem(16)} ${rem(14)}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: rem(10) }}>
        {brandNode}
        {onMobileClose && (
          <FloatingTooltip content="Fermer le menu">
            <ControlButton variant="bare" className="omni-shell-only-mobile" aria-label="Fermer le menu" onClick={onMobileClose} icon={<Icon name="action-close" size={16} />} />
          </FloatingTooltip>
        )}
      </div>

      <nav aria-label="Menus de l'espace admin" className="omni-shell-nav" style={{ flex: 1, overflowY: "auto", padding: `${rem(4)} 0` }}>
        {entries.map(item => {
          const active = item.members.includes(activeView);
          return (
            <ControlButton key={item.key} variant="nav" size="raw" className="omni-shell-navitem" aria-current={active ? "page" : undefined}
              onClick={() => selectView(item.key)}
              icon={item.icon ? <Icon name={item.icon} size={18} weight={active ? "regular" : "light"} /> : undefined}>
              <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
              {item.badge ? (
                <span style={{ background: toneColor("danger"), color: "white", borderRadius: rem(3), fontSize: rem(12), fontWeight: 700, padding: `2px ${rem(5)}`, minWidth: rem(14), textAlign: "center", lineHeight: 1.4 }}>
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </ControlButton>
          );
        })}
      </nav>

      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        {identity}
        <div style={{ padding: `${rem(12)} ${rem(16)} ${rem(16)}` }}>
          <ControlButton variant="ghost" style={{ width: "100%" }} onClick={logout}>Déconnexion</ControlButton>
        </div>
      </div>
    </div>
  );
}
