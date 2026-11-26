// Entrées du lot « coque admin et palette ⌘K » (portées de Chez la Petite). Un petit registre d'exemple (inventé, pas celui de CLP) montre le moteur ; aucun réseau, aucun routeur.
import { useState } from "react";
import {
  ADMIN_NIGHT_CLASS, AUTO_SCALE_FULL_WIDTH, AUTO_SCALE_MIN, AdminBreadcrumbs, AdminCommandPalette, AdminHubRail, AdminHubTabs, AdminPageHeader, AdminPageShell, AdminPrefsProvider, AdminSearchTrigger, AdminSidebar,
  AdminTopbar, AdminViewHost, FONT_SCALES, FONT_SCALE_PCT, FontScaleControl, FormGrid, HubContext, NightBadge, PageBreadcrumbs, Row, Section, SectionRail, SidebarIdentity, Stack,
  autoScale, buildPaletteEntries, checkAdminRegistry, createAdminRegistry, legacyRedirectUrl, paletteKey, paletteNorm, paletteScore, rankPalette, rootPercent,
} from "../web/entry-admin-shell";
import type { AdminRegistryConfig } from "../web/entry-admin-shell";
import { Contained, Controlled, choices, noop } from "./live";
import type { CatalogEntrySourceInterface, CatalogExampleInterface } from "./types";

const ex = (call: string, result: unknown): CatalogExampleInterface => ({ call, result: typeof result === "string" ? result : JSON.stringify(result) });

const CONFIG: AdminRegistryConfig = {
  groupOrder: ["Ventes", "Catalogue", "Système"],
  views: [
    { id: "orders", path: "orders", label: "Commandes", group: "Ventes", resource: "orders", badge: "orders", roles: ["admin", "ops"] },
    { id: "queue", path: "orders/queue", label: "File d'attente", group: "Ventes", resource: "orders", keywords: ["impression", "étiquette"], roles: ["admin", "ops"] },
    { id: "desk", path: "orders/new", label: "Gérer les commandes", group: "Ventes", resource: "orders", roles: ["admin"] },
    { id: "menu", path: "catalog/menu", label: "Menu", tabLabel: "Plats", group: "Catalogue", resource: "menu", roles: ["admin", "ops"] },
    { id: "recipes", path: "catalog/recipes", label: "Recettes", group: "Catalogue", resource: "menu", roles: ["admin"] },
    { id: "stock", path: "catalog/stock", label: "Stock", group: "Catalogue", resource: "menu", keywords: ["rupture"], roles: ["admin", "ops"] },
    { id: "settings", path: "system/settings", label: "Paramètres", group: "Système", resource: null, gate: "superadmin", keywords: ["frais"], roles: ["admin"] },
  ],
  hubs: [
    { id: "orders", label: "Opérations", icon: "res-orders", group: "Ventes", root: "orders", tabs: ["orders", "queue"], extras: ["desk"], action: { view: "desk", label: "Gérer les commandes", icon: "action-manage" } },
    { id: "catalog", label: "Catalogue", icon: "res-menu", group: "Catalogue", root: "catalog", tabs: ["menu", "recipes", "stock"], groups: [{ id: "menu", label: "Menu", views: ["menu", "recipes"] }] },
    { id: "system", label: "Système", icon: "res-settings", group: "Système", root: "system", tabs: ["settings"] },
  ],
  resources: [{ key: "orders", label: "Commandes" }, { key: "menu", label: "Menu" }],
  legacyPaths: { commandes: "orders", parametres: "system/settings" },
};
const REG = createAdminRegistry(CONFIG);
const canSee = (v: string) => v !== "settings";
const GROUPS = REG.buildNavGroups({ canSee: () => true, gateOk: () => true, badges: { orders: 4 } });
const FEATURES = [{ view: "stock", label: "Alerte de seuil", keywords: ["seuil", "rupture"] }];
const SETTINGS = [{ fieldKey: "fee", label: "Frais de livraison", hint: "montant par défaut", group: "Livraison" }];

function SidebarDemo({ collapsed }: { collapsed: boolean }) {
  const [view, setView] = useState("orders");
  return <div style={{ height: 300, display: "flex" }}><AdminSidebar registry={REG} navGroups={GROUPS} activeView={view} setView={setView} brand={<b>Admin</b>} identity={<SidebarIdentity role="admin" email="equipe@example.test" />} logout={noop} collapsed={collapsed} /></div>;
}

function HostDemo() {
  const [view, setView] = useState("recipes");
  return (
    <AdminViewHost registry={REG} view={view} setView={setView} canSee={canSee} badges={{ orders: 4 }} breadcrumbsVisible>
      <AdminPageHeader title="Recettes" actions={<button type="button">Nouvelle recette</button>} />
      <div style={{ padding: "0 48px" }}>Contenu de la vue « {REG.VIEW_LABEL[view]} ».</div>
    </AdminViewHost>
  );
}

function TabsDemo() {
  const [view, setView] = useState("orders");
  return <AdminHubTabs registry={REG} hub={REG.HUB_OF_VIEW.orders} view={view} canSee={canSee} setView={setView} badges={{ orders: 4 }} />;
}

function PaletteDemo() {
  const [open, setOpen] = useState(true);
  return (
    <Contained height={340}>
      <button type="button" onClick={() => setOpen(true)} style={{ font: "inherit" }}>Ouvrir (⌘K)</button>
      <AdminCommandPalette navGroups={GROUPS} setView={noop} onSelectSetting={noop} open={open} onOpenChange={setOpen} features={FEATURES} settings={SETTINGS} />
    </Contained>
  );
}

const RAIL = [{ key: "general", label: "Général" }, { key: "tarifs", label: "Tarifs", count: 3 }, { key: "alertes", label: "Alertes", count: 1, alert: true }];

export const COQUE_ADMIN_ENTRIES: CatalogEntrySourceInterface[] = [
  { name: "AdminSidebar", group: "coque", kind: "component", wide: true, states: choices(["open", "Ouvert"], ["collapsed", "Replié (grand écran)"]), render: (_v, state) => <SidebarDemo collapsed={state === "collapsed"} /> },
  { name: "SidebarIdentity", group: "coque", kind: "component", render: () => <SidebarIdentity role="admin" email="equipe@example.test" /> },
  { name: "AdminHubTabs", group: "coque", kind: "component", wide: true, render: () => <TabsDemo /> },
  {
    name: "AdminHubRail", group: "coque", kind: "component", wide: true,
    render: () => <HubContext.Provider value><Controlled initial="recipes">{(view, set) => (
      <AdminHubRail rail={REG.railOfView(REG.HUB_OF_VIEW.menu, view, canSee)} view={view} setView={set}><AdminPageHeader title="Vue" actions={<button type="button">Action</button>} /></AdminHubRail>
    )}</Controlled></HubContext.Provider>,
  },
  { name: "AdminViewHost", group: "coque", kind: "component", wide: true, render: () => <HostDemo /> },
  { name: "AdminBreadcrumbs", group: "coque", kind: "component", render: () => <AdminBreadcrumbs crumbs={REG.crumbsFor("recipes", { kind: "order", label: "#0726" })} visible /> },
  { name: "PageBreadcrumbs", group: "coque", kind: "component", render: () => <PageBreadcrumbs crumbs={REG.crumbsFor("queue")} visible /> },
  { name: "AdminPageHeader", group: "coque", kind: "component", wide: true, states: choices(["page", "Page"], ["hub", "Sous un hub"]), render: (_v, state) => <HubContext.Provider value={state === "hub"}><AdminPageHeader title="Commandes" subtitle="Aujourd'hui" actions={<button type="button">Exporter</button>} /></HubContext.Provider> },
  { name: "AdminPageShell", group: "coque", kind: "component", wide: true, render: () => <AdminPageShell title="Clients" toolbar={<input placeholder="Rechercher…" />}>Contenu de la page</AdminPageShell> },
  { name: "SectionRail", group: "coque", kind: "component", wide: true, render: () => <Controlled initial="general">{(v, set) => <SectionRail items={RAIL} value={v} onChange={set} title="Sections">Section « {v} »</SectionRail>}</Controlled> },
  { name: "createRailSectionHook", group: "coque", kind: "function", examples: () => [ex("createRailSectionHook(useQueryParam)", "useRailSection(param, items) → [section, setSection] ; la première section n'écrit rien dans l'URL")] },
  { name: "FormGrid", group: "coque", kind: "component", render: () => <FormGrid><div>Colonne 1</div><div>Colonne 2</div></FormGrid> },
  { name: "Stack", group: "coque", kind: "component", render: () => <Stack gap={8}><div>Un</div><div>Deux</div></Stack> },
  { name: "Row", group: "coque", kind: "component", render: () => <Row><span>Un</span><span>Deux</span></Row> },
  { name: "Section", group: "coque", kind: "component", render: () => <Section><span>Zone séparée par un filet</span></Section> },
  { name: "AdminTopbar", group: "coque", kind: "component", wide: true, render: () => <AdminPrefsProvider><AdminTopbar onOpenPalette={noop} onOpenMobileNav={noop} tools={<NightBadge active label="Mode nuit" />} /></AdminPrefsProvider> },
  { name: "AdminSearchTrigger", group: "coque", kind: "component", render: () => <AdminSearchTrigger onClick={noop} /> },
  { name: "FontScaleControl", group: "coque", kind: "component", render: () => <AdminPrefsProvider><FontScaleControl /></AdminPrefsProvider> },
  { name: "NightBadge", group: "coque", kind: "component", render: () => <NightBadge active label="Mode nuit" /> },
  { name: "AdminCommandPalette", group: "coque", kind: "component", wide: true, render: () => <PaletteDemo /> },

  {
    name: "createAdminRegistry", group: "coque", kind: "function",
    examples: () => [
      ex("VIEW_TO_PATH", REG.VIEW_TO_PATH),
      ex("ROLE_VIEWS.ops", REG.ROLE_VIEWS.ops),
      ex("HUB_OF_VIEW.queue.id", REG.HUB_OF_VIEW.queue.id),
      ex("crumbsFor('recipes')", REG.crumbsFor("recipes")),
      ex("viewFromPathname('/admin/orders/queue/')", REG.viewFromPathname("/admin/orders/queue/")),
      ex("resolveLegacyPath('commandes')", REG.resolveLegacyPath("commandes")),
      ex("sidebarEntries(menu)", REG.sidebarEntries(GROUPS.flatMap((g) => g.items)).map((e) => `${e.label} → ${e.key}`)),
    ],
  },
  {
    name: "checkAdminRegistry", group: "coque", kind: "function",
    examples: () => [
      ex("checkAdminRegistry(registre sain)", checkAdminRegistry(REG)),
      ex("checkAdminRegistry(chemin avec accent)", checkAdminRegistry(createAdminRegistry({ ...CONFIG, views: [...CONFIG.views, { ...CONFIG.views[0], id: "x", path: "éléments" }] }))),
    ],
  },
  {
    name: "legacyRedirectUrl", group: "coque", kind: "function",
    examples: () => [["/admin/commandes", "?order=12", "#haut"], ["/admin/orders", "", ""], ["/admin/parametres", "?x=1", ""]].map(([p, s, h]) => ex(`legacyRedirectUrl(registre, "${p}", "${s}", "${h}")`, legacyRedirectUrl(REG, p, s, h))),
  },
  { name: "paletteNorm", group: "coque", kind: "function", examples: () => ["Paramètres", "Créneaux Été", "ŒUF"].map((s) => ex(`paletteNorm("${s}")`, paletteNorm(s))) },
  {
    name: "paletteScore", group: "coque", kind: "function",
    examples: () => {
      const entries = buildPaletteEntries({ navGroups: GROUPS, features: FEATURES, settings: SETTINGS });
      return [["", "Commandes"], ["comm", "Commandes"], ["cmd", "Commandes"], ["rupture", "Stock"], ["frais", "Frais de livraison"]].map(([q, label]) => ex(`paletteScore(« ${label} », "${q}")`, paletteScore(entries.find((e) => e.label === label)!, paletteNorm(q))));
    },
  },
  {
    name: "buildPaletteEntries", group: "coque", kind: "function",
    examples: () => [ex("buildPaletteEntries({ navGroups, features, settings }).map(paletteKey)", buildPaletteEntries({ navGroups: GROUPS, features: FEATURES, settings: SETTINGS }).map(paletteKey))],
  },
  { name: "paletteKey", group: "coque", kind: "function", examples: () => buildPaletteEntries({ navGroups: GROUPS, features: FEATURES, settings: SETTINGS }).filter((e) => e.kind !== "view").map((e) => ex(`paletteKey(${e.kind})`, paletteKey(e))) },
  {
    name: "rankPalette", group: "coque", kind: "function",
    examples: () => ["", "r", "rupture", "cmd"].map((q) => ex(`rankPalette(entries, "${q}").map(label)`, rankPalette(buildPaletteEntries({ navGroups: GROUPS, features: FEATURES, settings: SETTINGS }), q).map((e) => e.label))),
  },
  { name: "HubContext", group: "coque", kind: "constant", examples: () => [ex("HubContext", "contexte booléen : la vue est sous la barre d'onglets d'un hub (l'onglet actif porte le titre)")] },
  { name: "HubSwitcherContext", group: "coque", kind: "constant", examples: () => [ex("HubSwitcherContext", "contexte du sélecteur de vue posé à gauche de l'en-tête par AdminHubRail")] },
  { name: "AdminLinkContext", group: "coque", kind: "constant", examples: () => [ex("AdminLinkContext", "composant de lien injecté (ancre par défaut ; Link du routeur via AdminRouterLinks)")] },
  { name: "AdminPrefsProvider", group: "coque", kind: "component", render: () => <AdminPrefsProvider><span>Taille du texte et menu replié, mémorisés par appareil</span></AdminPrefsProvider> },
  { name: "FONT_SCALES", group: "coque", kind: "constant", examples: () => [ex("FONT_SCALES", FONT_SCALES)] },
  { name: "FONT_SCALE_PCT", group: "coque", kind: "constant", examples: () => [ex("FONT_SCALE_PCT", FONT_SCALE_PCT)] },
  { name: "AUTO_SCALE_FULL_WIDTH", group: "coque", kind: "constant", examples: () => [ex("AUTO_SCALE_FULL_WIDTH", AUTO_SCALE_FULL_WIDTH)] },
  { name: "AUTO_SCALE_MIN", group: "coque", kind: "constant", examples: () => [ex("AUTO_SCALE_MIN", AUTO_SCALE_MIN)] },
  { name: "autoScale", group: "coque", kind: "function", examples: () => [1920, 1500, 1366, 1000, 800].map((w) => ex(`autoScale(${w})`, autoScale(w))) },
  { name: "rootPercent", group: "coque", kind: "function", examples: () => [["md", 1366], ["sm", 1366], ["xl", 1920], ["md", 800]].map(([s, w]) => ex(`rootPercent("${s}", ${w})`, rootPercent(s as "md", w as number))) },
  { name: "ADMIN_NIGHT_CLASS", group: "coque", kind: "constant", examples: () => [ex("ADMIN_NIGHT_CLASS", ADMIN_NIGHT_CLASS)] },
];
