// Mise en page de l'espace admin (rendu de web/src/AdminPage.tsx de Chez la Petite) : menu de gauche + fond voilé sous 900 px, zone principale qui défile
// (réserve le pied de page sur téléphone), barre du haut, palette. Les éléments propres à l'application (bandeaux d'alerte, hôtes de modales) se passent en slots.
import "./admin-shell-css";
import { useEffect, type ReactNode } from "react";

export interface AdminLayoutProps {
  sidebar: ReactNode;
  palette?: ReactNode;
  topbar: ReactNode;
  /** Bandeaux collés en haut de la zone principale (hors ligne, alarme…). */
  banners?: ReactNode;
  /** Hôtes montés une fois pour toute la page (messages d'erreur, confirmations). */
  overlays?: ReactNode;
  mobileNavOpen?: boolean;
  onCloseMobileNav?: () => void;
  onClick?: () => void;
  children: ReactNode;
}

export function AdminLayout({ sidebar, palette, topbar, banners, overlays, mobileNavOpen, onCloseMobileNav, onClick, children }: AdminLayoutProps) {
  // Active le survol central de l'admin (admin-shell-css.ts) y compris pour les portails (modales, tiroirs).
  useEffect(() => {
    document.body.classList.add("omni-admin-mode");
    return () => document.body.classList.remove("omni-admin-mode");
  }, []);
  return (
    <div onClick={onClick} className="omni-shell-root">
      {mobileNavOpen && <div className="omni-shell-backdrop" onClick={onCloseMobileNav} />}
      {sidebar}
      {palette}
      <div className="omni-shell-main">
        {banners && <div style={{ position: "sticky", top: 0, zIndex: 9000 }}>{banners}</div>}
        {topbar}
        {children}
      </div>
      {overlays}
    </div>
  );
}
