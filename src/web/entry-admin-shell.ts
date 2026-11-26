// Sous-export `@omnirelic/ui-design-system/admin-shell` : coque de l'espace admin de Chez la Petite (registre déclaratif de vues et de hubs, menu de gauche, onglets de hub,
// fil d'Ariane, en-tête de page, rail de sections, barre du haut, palette de commandes ⌘K). Le MOTEUR est ici ; les DONNÉES (vues, ressources, rôles, réglages indexés)
// sont fournies par l'application. Sans routeur : le branchement react-router-dom est dans `/admin-shell-router`.
export { createAdminRegistry } from "./admin-registry";
export type { AdminRegistry, NavContext } from "./admin-registry";
export { checkAdminRegistry } from "./admin-registry-check";
export type {
  AdminHubDef, AdminHubGroup, AdminIdPage, AdminNavGate, AdminRegistryConfig, AdminResourceDef, AdminViewDef, Crumb, HubTabEntry, NavGroup, NavItem, RailEntry, SidebarEntry,
} from "./admin-registry-types";
export { legacyRedirectUrl } from "./admin-legacy";
export { buildPaletteEntries, norm as paletteNorm, paletteKey, rankPalette, score as paletteScore } from "./admin-palette-model";
export type { PaletteEntry, PaletteFeature, PaletteSetting } from "./admin-palette-model";
export { AdminCommandPalette } from "./AdminCommandPalette";
export type { AdminCommandPaletteProps } from "./AdminCommandPalette";
export { AdminSearchTrigger } from "./AdminSearchTrigger";
export { AdminSidebar, SidebarIdentity } from "./AdminSidebar";
export type { AdminSidebarProps } from "./AdminSidebar";
export { AdminHubRail, AdminHubTabs } from "./AdminHubTabs";
export type { AdminHubTabsProps } from "./AdminHubTabs";
export { AdminBreadcrumbs, PageBreadcrumbs } from "./AdminBreadcrumbs";
export { AdminPageHeader, AdminPageShell } from "./AdminPageHeader";
export type { AdminPageHeaderProps, AdminPageShellProps } from "./AdminPageHeader";
export { SectionRail, createRailSectionHook } from "./AdminSectionRail";
export type { RailItem, SectionRailProps } from "./AdminSectionRail";
export { FormGrid, Row, Section, Stack } from "./admin-layout-blocks";
export { AdminTopbar, FontScaleControl, NightBadge } from "./AdminTopbar";
export type { AdminTopbarProps } from "./AdminTopbar";
export { AdminLayout } from "./AdminLayout";
export type { AdminLayoutProps } from "./AdminLayout";
export { AdminViewHost } from "./AdminViewHost";
export type { AdminViewHostProps } from "./AdminViewHost";
export { HubContext, HubSwitcherContext, useHubSwitcher, useInHub } from "./admin-hub-context";
export { AdminLinkContext, useAdminLink } from "./admin-link";
export type { AdminLinkComponent, AdminLinkProps } from "./admin-link";
export { AUTO_SCALE_FULL_WIDTH, AUTO_SCALE_MIN, AdminPrefsProvider, FONT_SCALES, FONT_SCALE_PCT, autoScale, rootPercent, useAdminPrefs, useViewImmersion } from "./admin-prefs";
export type { AdminPrefs, FontScale } from "./admin-prefs";
export { ADMIN_NIGHT_CLASS, useAdminNightTheme } from "./admin-night";
