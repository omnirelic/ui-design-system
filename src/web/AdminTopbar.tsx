// Barre du haut (web/src/admin/shell/AdminTopbar.tsx, ui/FontScaleControl.tsx, ui/NightMoon.tsx de Chez la Petite) : « Agrandir » (grand écran) ou ☰ (téléphone) à gauche,
// recherche ⌘K au centre, outils à droite. Les outils propres à l'application (notifications, devise, paiements en attente) se passent en `tools`.
import "./admin-shell-css";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { FloatingTooltip } from "./FloatingTooltip";
import { ControlButton } from "./controls";
import { Select } from "./Select";
import { AdminSearchTrigger } from "./AdminSearchTrigger";
import { FONT_SCALES, useAdminPrefs, type FontScale } from "./admin-prefs";
import { BG, BORDER, rem } from "./theme";

export interface AdminTopbarProps {
  onOpenPalette: () => void;
  onOpenMobileNav: () => void;
  /** Outils à droite, dans l'ordre (CLP : lune de nuit, paiements en attente, devise, taille du texte, notifications). */
  tools?: ReactNode;
}

export function AdminTopbar({ onOpenPalette, onOpenMobileNav, tools }: AdminTopbarProps) {
  const { sidebarCollapsed, toggleSidebar } = useAdminPrefs();
  const tip = sidebarCollapsed ? "Réduire : afficher le menu" : "Agrandir : masquer le menu de gauche";
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 60, display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${rem(8)} ${rem(20)}`, background: BG, borderBottom: `1px solid color-mix(in srgb, ${BORDER} 13%, transparent)`, gap: rem(10) }}>
      <div style={{ display: "flex", alignItems: "center", gap: rem(8) }}>
        <FloatingTooltip content="Menu" placement="bottom">
          <ControlButton className="omni-shell-only-mobile" variant="bare" aria-label="Menu" icon={<Icon name="action-menu" size={20} />} onClick={onOpenMobileNav} />
        </FloatingTooltip>
        <FloatingTooltip content={tip} placement="bottom">
          <ControlButton className="omni-shell-only-desktop" variant="seg" aria-pressed={sidebarCollapsed} icon={<Icon name={sidebarCollapsed ? "action-exit-fullscreen" : "action-fullscreen"} size={16} />} onClick={toggleSidebar}>
            {sidebarCollapsed ? "Réduire" : "Agrandir"}
          </ControlButton>
        </FloatingTooltip>
      </div>
      <AdminSearchTrigger onClick={onOpenPalette} />
      <div className="omni-shell-tools" style={{ display: "flex", alignItems: "center", gap: rem(10) }}>{tools}</div>
    </div>
  );
}

const GLYPH: Record<FontScale, string> = { sm: "A-", md: "A", lg: "A+", xl: "A++" };
const SCALE_OPTIONS = FONT_SCALES.map(key => ({ value: key, label: GLYPH[key] }));

/** Réglage d'accessibilité : 4 tailles (A- · A · A+ · A++) en menu déroulant, la normale étant la taille actuelle de l'admin. */
export function FontScaleControl() {
  const { fontScale, setFontScale } = useAdminPrefs();
  return (
    <div className="omni-shell-fontscale">
      <Select options={SCALE_OPTIONS} value={fontScale} onChange={v => setFontScale(v as FontScale)} ariaLabel="Taille du texte" uiSize="sm" width={76} />
    </div>
  );
}

const LEAVE_MS = 400; // durée de omni-night-out (admin-shell-css.ts)

/**
 * Pastille « nuit » de la barre du haut : visible tant que `active`. Apparaît et disparaît seule (fondu + rotation), la lune flotte doucement ;
 * prefers-reduced-motion coupe l'animation. Le signal (CLP : cuisine fermée) et le libellé viennent de l'application.
 */
export function NightBadge({ active, label }: { active: boolean; label: string }) {
  const [mounted, setMounted] = useState(active);
  useEffect(() => {
    if (active) { setMounted(true); return; }
    const t = setTimeout(() => setMounted(false), LEAVE_MS);
    return () => clearTimeout(t);
  }, [active]);
  if (!mounted) return null;
  return (
    <FloatingTooltip content={label} placement="bottom">
      <span className="omni-shell-moon" data-leaving={!active} role="status" aria-label={label}>
        <Icon name="ui-moon" size={18} weight="fill" />
      </span>
    </FloatingTooltip>
  );
}
