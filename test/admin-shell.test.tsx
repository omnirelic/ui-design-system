// @vitest-environment jsdom
// Coque d'admin : tests miroir de CLP (HubRail.test.tsx, AdminViews-crumbs.test.tsx, CommandPalette.test.ts, prefs-*.test.tsx, NightMoon.test.tsx) rejoués sur les composants du paquet
// avec le jeu de données de CLP, puis les comportements que CLP ne teste pas (menu de gauche, onglets, rail de sections, barre du haut, mise en page).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, lazy, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminHubRail, AdminHubTabs } from "../src/web/AdminHubTabs";
import { AdminPageHeader, AdminPageShell } from "../src/web/AdminPageHeader";
import { HubContext } from "../src/web/admin-hub-context";
import { AdminViewHost } from "../src/web/AdminViewHost";
import { AdminSidebar, SidebarIdentity } from "../src/web/AdminSidebar";
import { AdminCommandPalette } from "../src/web/AdminCommandPalette";
import { buildPaletteEntries, rankPalette } from "../src/web/admin-palette-model";
import { createAdminRegistry } from "../src/web/admin-registry";
import { AdminSearchTrigger } from "../src/web/AdminSearchTrigger";
import { AdminTopbar, FontScaleControl, NightBadge } from "../src/web/AdminTopbar";
import { AdminLayout } from "../src/web/AdminLayout";
import { SectionRail, createRailSectionHook } from "../src/web/AdminSectionRail";
import { AdminBreadcrumbs, PageBreadcrumbs } from "../src/web/AdminBreadcrumbs";
import { AdminLinkContext } from "../src/web/admin-link";
import { FormGrid, Row, Section, Stack } from "../src/web/admin-layout-blocks";
import { AdminPrefsProvider, FONT_SCALES, FONT_SCALE_PCT, autoScale, rootPercent, useAdminPrefs, useViewImmersion } from "../src/web/admin-prefs";
import { ADMIN_NIGHT_CLASS, useAdminNightTheme } from "../src/web/admin-night";
import { CLP_FEATURES, CLP_SETTINGS, clpGateOk, clpRegistry } from "./fixtures/clp-admin";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const r = clpRegistry();
let root: Root; let host: HTMLElement;
beforeEach(() => { localStorage.clear(); document.documentElement.className = ""; document.documentElement.style.fontSize = ""; host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); document.body.innerHTML = ""; vi.useRealTimers(); });
const show = (el: ReactNode) => act(async () => { root.render(el); });
const click = (el: Element | null) => act(async () => { (el as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true })); });
const key = (target: Document | Element, k: string, init: KeyboardEventInit = {}) => act(async () => { target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...init })); });
const allViews = r.config.views.map(v => v.id);
const canAll = () => true;

describe("HubRail — sélecteur de vue dans l'en-tête (mirroir de HubRail.test.tsx)", () => {
  const RAIL = { title: "Menu", items: [{ key: "menu", label: "Plats" }, { key: "menu-recipes", label: "Recettes" }] };
  const page = (rail: typeof RAIL | null, actions?: string) => renderToStaticMarkup(
    <HubContext.Provider value>
      <AdminHubRail rail={rail} view="menu-recipes" setView={() => {}}>
        <div className="omni-shell-page"><AdminPageHeader title="Recettes" actions={actions ? <button>{actions}</button> : undefined} /></div>
      </AdminHubRail>
    </HubContext.Provider>,
  );
  it("pose le menu déroulant (vue courante) dans l'en-tête, avant les actions, sans colonne de rail", () => {
    const html = page(RAIL, "Régénérer");
    expect(html).not.toContain("omni-shell-rail");
    expect(html).toContain('aria-label="Menu"');
    expect(html).toContain("Recettes");
    expect(html.indexOf('aria-label="Menu"')).toBeLessThan(html.indexOf("Régénérer"));
    expect((html.match(/<header/g) ?? []).length).toBe(1);
  });
  it("l'en-tête reste affiché même sans actions ni sous-titre (sinon le sélecteur disparaît)", () => {
    expect(page(RAIL)).toContain("<header");
  });
  it("sans rail (un seul onglet visible) : contenu tel quel, pas de sélecteur", () => {
    expect(page(null)).not.toContain("<header");
  });
});

describe("AdminViewHost — fil d'Ariane et onglets (mirroir de AdminViews-crumbs.test.tsx)", () => {
  const host_ = (view: string, { children = "contenu", ...extra }: Partial<Parameters<typeof AdminViewHost>[0]> = {}) => show(
    <AdminViewHost registry={r} view={view} setView={() => {}} canSee={canAll} breadcrumbsVisible {...extra}>{children}</AdminViewHost>,
  );
  const trail = () => host.querySelector('nav[aria-label="Fil d\'Ariane"]');
  it("une vue d'un menu à onglets : Menu › Onglet, le menu est un lien, l'onglet courant n'en est pas un", async () => {
    await host_("order-desk");
    expect(trail()!.textContent).toBe("Opérations›Gérer les commandes");
    expect(trail()!.querySelectorAll("a")).toHaveLength(1);
    expect(trail()!.querySelector('[aria-current="page"]')?.textContent).toBe("Gérer les commandes");
  });
  it("il suit la vue affichée ; une vue hors hub en a un aussi", async () => {
    await host_("orders");
    expect(trail()!.textContent).toContain("Opérations");
    expect(trail()!.textContent).not.toContain("Gérer les commandes");
  });
  it("placé AU-DESSUS de la barre d'onglets", async () => {
    await host_("order-desk");
    const bar = host.querySelector(".omni-shell-bar")!;
    expect(trail()!.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it("masqué par défaut, comme chez CLP (interrupteur éteint) : ni fil d'Ariane, ni lien", async () => {
    await host_("orders", { breadcrumbsVisible: false });
    expect(trail()).toBeNull();
    expect(host.querySelector(".omni-shell-bar")).not.toBeNull();
  });
  it("un lien du fil d'Ariane passe par le composant de lien injecté (le routeur dans l'application)", async () => {
    await show(
      <AdminLinkContext.Provider value={({ to, children }) => <a data-routed href={to}>{children}</a>}>
        <AdminBreadcrumbs crumbs={[{ label: "A", to: "/x" }, { label: "B", to: null }]} visible />
      </AdminLinkContext.Provider>,
    );
    expect(host.querySelector("a[data-routed]")?.getAttribute("href")).toBe("/x");
  });
  it("sans hub : pas de barre d'onglets ; la vue est montée dans un Suspense (chargée à la demande)", async () => {
    const Lazy = lazy(() => Promise.resolve({ default: () => <p>vue chargée</p> }));
    await host_("settings", { children: <Lazy /> });
    await act(async () => { await Promise.resolve(); });
    expect(host.textContent).toContain("vue chargée");
  });
  it("pendant le chargement : « Chargement… » annoncé poliment", async () => {
    const never = lazy(() => new Promise<{ default: () => ReactNode }>(() => {}));
    await host_("settings", { children: createElement(never) });
    const status = host.querySelector('[role="status"]');
    expect(status?.textContent).toBe("Chargement…");
    expect(status?.getAttribute("aria-live")).toBe("polite");
  });
  it("une vue hors de tout hub : ni onglets, et l'en-tête de la vue garde son titre (le contexte de hub est éteint)", async () => {
    const solo = createAdminRegistry({ groupOrder: ["G"], hubs: [], views: [{ id: "solo", path: "solo", label: "Seule", group: "G", resource: "x", roles: [] }] });
    await show(<AdminViewHost registry={solo} view="solo" setView={() => {}} canSee={canAll}><AdminPageHeader title="Titre seul" /></AdminViewHost>);
    expect(host.querySelector(".omni-shell-bar")).toBeNull();
    expect(host.querySelector("h2")?.textContent).toBe("Titre seul");
  });
  it("PageBreadcrumbs : gouttière de page", async () => {
    await show(<PageBreadcrumbs crumbs={[{ label: "A", to: null }]} visible />);
    expect((host.firstChild as HTMLElement).style.padding).toBe("0.625rem 1.25rem 0px");
  });
});

describe("AdminHubTabs — barre d'onglets du hub", () => {
  const tabs = (view: string, canSee: (v: string) => boolean, setView = vi.fn(), badges?: Record<string, number>, hubId = "orders") =>
    show(<AdminHubTabs registry={r} hub={r.config.hubs.find(h => h.id === hubId)!} view={view} canSee={canSee} setView={setView} badges={badges} />);
  it("un onglet par vue visible, l'actif porte aria-selected, un clic ouvre la vue", async () => {
    const setView = vi.fn();
    await tabs("orders", canAll, setView);
    const list = [...host.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(list.map(t => t.textContent)).toEqual(["Commandes", "File d'attente", "Paniers", "Transactions", "Pool anticipé"]);
    expect(list.map(t => t.getAttribute("aria-selected"))).toEqual(["true", "false", "false", "false", "false"]);
    await click(list[1]);
    expect(setView).toHaveBeenCalledWith("queue");
  });
  it("pastille par vue (99+ au-delà), bouton d'action principal avec son icône", async () => {
    const setView = vi.fn();
    await tabs("orders", canAll, setView, { orders: 120, queue: 3 });
    const badges = [...host.querySelectorAll(".omni-shell-badge")].map(b => b.textContent);
    expect(badges).toEqual(["99+", "3"]);
    const action = [...host.querySelectorAll("button")].find(b => b.textContent === "Gérer les commandes")!;
    expect(action.className).toContain("omni-btn--primary");
    expect(action.querySelector("svg")).not.toBeNull();
    await click(action);
    expect(setView).toHaveBeenCalledWith("order-desk");
  });
  it("un seul onglet visible et pas d'action : rien (le menu de gauche suffit)", async () => {
    await tabs("queue", v => v === "queue");
    expect(host.firstChild).toBeNull();
  });
  it("un seul onglet mais une action visible : la barre reste (bouton seul)", async () => {
    await tabs("queue", v => v === "queue" || v === "order-desk");
    expect(host.querySelectorAll('[role="tab"]')).toHaveLength(1);
    expect(host.textContent).toContain("Gérer les commandes");
  });
  it("hub à groupe : un onglet « Menu » pour Plats/Catégories/Variations/Recettes, actif sur toutes ses vues", async () => {
    await tabs("menu-recipes", canAll, vi.fn(), undefined, "catalog");
    const t = [...host.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(t[0].textContent).toBe("Menu");
    expect(t[0].getAttribute("aria-selected")).toBe("true");
  });
  it("la barre porte le nom du hub (tablist étiquetée)", async () => {
    await tabs("orders", canAll);
    expect(host.querySelector('[role="tablist"]')?.getAttribute("aria-label")).toBe("Opérations");
  });
});

describe("AdminSidebar — menu de gauche", () => {
  const groups = (role: string, manage = true) => r.buildNavGroups({ canSee: v => r.ROLE_VIEWS[role].includes(v), gateOk: clpGateOk(role, manage), badges: { orders: 120, support: 2 } });
  const side = (extra: Partial<Parameters<typeof AdminSidebar>[0]> = {}) => show(
    <AdminSidebar registry={r} navGroups={groups("superadmin")} activeView="queue" setView={extra.setView ?? vi.fn()} logout={vi.fn()} brand={<b>Admin</b>} identity={<SidebarIdentity role="superadmin" email="a@b.test" />} {...extra} />,
  );
  it("11 entrées pour le superadmin, dans l'ordre des hubs, sous la navigation étiquetée", async () => {
    await side();
    const nav = host.querySelector('nav[aria-label="Menus de l\'espace admin"]')!;
    const labels = [...nav.querySelectorAll("button")].map(b => b.querySelector("span")?.textContent);
    expect(labels).toEqual(["Validations", "Catalogue", "Contenu", "Équipe", "Affaires", "Messages", "Utilisateurs", "Opérations", "Logistique", "Analytiques", "Système"]);
  });
  it("la page courante (n'importe quelle vue du hub) porte aria-current ; un clic ouvre l'onglet par défaut", async () => {
    const setView = vi.fn(); const close = vi.fn();
    await side({ setView, onMobileClose: close });
    const items = [...host.querySelectorAll<HTMLElement>("nav button")];
    expect(items.filter(b => b.getAttribute("aria-current") === "page").map(b => b.textContent)).toEqual(["Opérations99+"]);
    await click(items.find(b => b.textContent?.startsWith("Messages"))!);
    expect(setView).toHaveBeenCalledWith("whatsapp");
    expect(close).toHaveBeenCalled(); // le menu hors-champ se referme après le choix
  });
  it("pastille rouge : somme du hub, 99+ au-delà", async () => {
    await side();
    expect(host.textContent).toContain("99+");
  });
  it("rôle limité : les entrées sans accès disparaissent (cuisinier : Catalogue et Opérations seulement)", async () => {
    await side({ navGroups: groups("cook", false) });
    expect([...host.querySelectorAll("nav button")].map(b => b.querySelector("span")?.textContent)).toEqual(["Catalogue", "Opérations"]);
  });
  it("replié et ouvert sont des classes ; la fermeture ne s'affiche que sur téléphone", async () => {
    await side({ collapsed: true, mobileOpen: true, onMobileClose: vi.fn() });
    const el = host.firstElementChild!;
    expect(el.className).toContain("omni-shell-sidebar--collapsed");
    expect(el.className).toContain("omni-shell-sidebar--open");
    expect(el.querySelector("button.omni-shell-only-mobile")?.getAttribute("aria-label")).toBe("Fermer le menu");
  });
  it("marque cliquable : retour à l'accueil ; sans onHome, pas cliquable ; identité et déconnexion", async () => {
    const onHome = vi.fn(); const logout = vi.fn();
    await side({ onHome, logout });
    const brand = [...host.querySelectorAll<HTMLElement>("div")].find(d => d.style.cursor === "pointer")!;
    await click(brand);
    expect(onHome).toHaveBeenCalled();
    expect(host.textContent).toContain("SUPERADMIN");
    expect(host.querySelector("[title='a@b.test']")).not.toBeNull();
    await click([...host.querySelectorAll("button")].find(b => b.textContent === "Déconnexion")!);
    expect(logout).toHaveBeenCalled();
    await side({ onHome: undefined });
    expect([...host.querySelectorAll<HTMLElement>("div")].some(d => d.style.cursor === "pointer")).toBe(false);
  });
});

describe("boutons icône seule : nom accessible", () => {
  it("menu de gauche (fermeture) et barre du haut (menu) : chaque bouton sans texte porte un aria-label", async () => {
    await show(<AdminPrefsProvider><AdminSidebar registry={r} navGroups={r.buildNavGroups({ canSee: canAll, gateOk: () => true })} activeView="orders" setView={() => {}} logout={() => {}} onMobileClose={() => {}} /><AdminTopbar onOpenPalette={() => {}} onOpenMobileNav={() => {}} /></AdminPrefsProvider>);
    const iconOnly = [...host.querySelectorAll("button")].filter(b => !b.textContent?.trim());
    expect(iconOnly.length).toBeGreaterThanOrEqual(2);
    for (const b of iconOnly) expect(b.getAttribute("aria-label"), b.outerHTML.slice(0, 80)).toBeTruthy();
  });
});

describe("palette ⌘K (mirroir de CommandPalette.test.ts + clavier)", () => {
  const groups = r.buildNavGroups({ canSee: () => true, gateOk: () => true });
  const setView = vi.fn(); const onSelectSetting = vi.fn();
  let seq = 0;
  const Harness = ({ open = true }: { open?: boolean }) => {
    const [o, setO] = useState(open);
    return <><span data-open={String(o)} /><AdminCommandPalette navGroups={groups} setView={setView} onSelectSetting={onSelectSetting} open={o} onOpenChange={setO} features={CLP_FEATURES} settings={CLP_SETTINGS} /></>;
  };
  const input = () => host.querySelector("input")!;
  const type = (v: string) => act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input(), v); input().dispatchEvent(new Event("input", { bubbles: true }));
  });
  const rows = () => [...host.querySelectorAll<HTMLElement>("[data-idx]")];
  beforeEach(() => { setView.mockClear(); onSelectSetting.mockClear(); });

  it("requête vide : seulement les menus de la navigation (pas de réglages ni de fonctions)", async () => {
    await show(<Harness key={++seq} />);
    expect(rows()).toHaveLength(groups.flatMap(g => g.items).length);
    expect(rows().some(x => x.textContent?.includes("Réglage"))).toBe(false);
  });
  it("recherche STRICTE : « cmd » ne trouve pas « Commandes » ; « comm » le trouve ; accents ignorés", async () => {
    await show(<Harness key={++seq} />);
    await type("cmd");
    expect(host.textContent).toContain("Aucun résultat.");
    await type("comm");
    expect(rows().some(x => x.textContent?.startsWith("Commandes"))).toBe(true);
    await type("equipe");
    expect(rows()[0].textContent).toContain("Équipe");
  });
  it("mot-clé : « influenceur » mène à la vue Influenceurs ; un réglage porte « Réglage », une fonction « Fonction »", async () => {
    await show(<Harness key={++seq} />);
    await type("influenceur");
    expect(rows().some(x => x.textContent?.includes("Influenceurs"))).toBe(true);
    await type("gluten");
    expect(rows().some(x => x.textContent?.endsWith("Fonction"))).toBe(true);
    await type("livraison");
    expect(rows().some(x => x.textContent?.endsWith("Réglage"))).toBe(true);
  });
  it("flèches puis Entrée ouvrent la ligne choisie et ferment ; Entrée sur un réglage appelle onSelectSetting", async () => {
    await show(<Harness key={++seq} />);
    await type("comm");
    const first = rows()[0].textContent;
    await key(input(), "ArrowDown");
    await key(input(), "ArrowUp");
    await key(input(), "Enter");
    expect(setView).toHaveBeenCalledTimes(1);
    expect(first).toBeTruthy();
    expect(host.querySelector("[data-open]")?.getAttribute("data-open")).toBe("false");
    await show(<Harness key={++seq} />);
    await type("frais");
    const idx = rows().findIndex(x => x.textContent?.endsWith("Réglage"));
    for (let i = 0; i < idx; i++) await key(input(), "ArrowDown");
    await key(input(), "Enter");
    expect(onSelectSetting).toHaveBeenCalledTimes(1);
  });
  it("souris : survol sélectionne, clic ouvre ; la sélection reste dans les bornes (flèche bas au-delà du dernier)", async () => {
    await show(<Harness key={++seq} />);
    await type("comm");
    const n = rows().length;
    for (let i = 0; i < n + 3; i++) await key(input(), "ArrowDown");
    await key(input(), "Enter"); // la dernière ligne (un réglage ou une fonction) est ouverte, pas de sortie de liste
    expect(setView.mock.calls.length + onSelectSetting.mock.calls.length).toBe(1);
    await show(<Harness key={++seq} />);
    setView.mockClear();
    await act(async () => { rows()[2].dispatchEvent(new MouseEvent("mouseover", { bubbles: true })); });
    await key(input(), "Enter"); // le survol a déplacé la sélection
    expect(setView).toHaveBeenCalledWith(groups.flatMap(g => g.items)[2].key);
    setView.mockClear();
    await show(<Harness key={++seq} />);
    await click(rows()[1]); // requête vide : seulement des menus
    expect(setView).toHaveBeenCalledTimes(1);
  });
  it("taper remet la sélection sur la première ligne", async () => {
    await show(<Harness key={++seq} />);
    await key(input(), "ArrowDown"); await key(input(), "ArrowDown");
    await type("c");
    await key(input(), "Enter");
    expect(setView.mock.calls.length + onSelectSetting.mock.calls.length).toBe(1);
    const best = rankPalette(buildPaletteEntries({ navGroups: groups, features: CLP_FEATURES, settings: CLP_SETTINGS }), "c")[0];
    if (best.kind === "setting") expect(onSelectSetting).toHaveBeenCalledWith(best.fieldKey); else expect(setView).toHaveBeenCalledWith(best.key);
  });
  it("Échap ferme ; clic sur le fond ferme ; clic dans la fenêtre ne ferme pas", async () => {
    await show(<Harness key={++seq} />);
    await click(input());
    expect(host.querySelector("[data-open]")?.getAttribute("data-open")).toBe("true");
    await key(document, "Escape");
    expect(host.querySelector("[data-open]")?.getAttribute("data-open")).toBe("false");
    await show(<Harness key={++seq} />);
    await click(host.querySelector<HTMLElement>("input")!.closest("div[style*='position: fixed']"));
    expect(host.querySelector("[data-open]")?.getAttribute("data-open")).toBe("false");
  });
  it("⌘K et Ctrl+K basculent l'ouverture ; réouverture = saisie remise à zéro", async () => {
    await show(<Harness key={++seq} open={false} />);
    expect(host.querySelector("input")).toBeNull();
    await key(document, "k", { metaKey: true });
    expect(host.querySelector("input")).not.toBeNull();
    await type("comm");
    await key(document, "K", { ctrlKey: true });
    expect(host.querySelector("input")).toBeNull();
    await key(document, "k", { ctrlKey: true });
    expect(input().value).toBe("");
    await key(document, "k"); // sans modificateur : rien
    expect(host.querySelector("input")).not.toBeNull();
  });
  it("les réglages ne sont indexés que si la vue Paramètres est visible pour le rôle", async () => {
    const noSettings = r.buildNavGroups({ canSee: v => v !== "settings", gateOk: () => false });
    await show(<AdminCommandPalette navGroups={noSettings} setView={setView} open onOpenChange={() => {}} features={CLP_FEATURES} settings={CLP_SETTINGS} />);
    await type("frais");
    expect(rows().some(x => x.textContent?.endsWith("Réglage"))).toBe(false);
  });
  it("le champ est focalisé à l'ouverture", async () => {
    vi.useFakeTimers();
    await show(<Harness key={++seq} />);
    await act(async () => { vi.advanceTimersByTime(5); });
    expect(document.activeElement).toBe(input());
  });
  it("le déclencheur de la barre : libellé et ⌘K, clic = ouverture", async () => {
    const onClick = vi.fn();
    await show(<AdminSearchTrigger onClick={onClick} />);
    expect(host.textContent).toContain("Rechercher…");
    expect(host.textContent).toContain("⌘K");
    await click(host.querySelector("button"));
    expect(onClick).toHaveBeenCalled();
  });
});

describe("SectionRail — second niveau d'onglets", () => {
  const items = [{ key: "a", label: "A", count: 3 }, { key: "b", label: "B", count: 1, alert: true }, { key: "c", label: "C" }];
  it("avec une seule section, le rail disparaît ; sinon onglets verticaux, comptes, alerte, volet", async () => {
    await show(<SectionRail items={[items[0]]} value="a" onChange={() => {}}>contenu</SectionRail>);
    expect(host.querySelector("nav")).toBeNull();
    const onChange = vi.fn();
    await show(<SectionRail items={items} value="b" onChange={onChange} title="Tableaux" titleActions={<i>aide</i>}>contenu</SectionRail>);
    const tabs = [...host.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(tabs.map(t => t.getAttribute("aria-selected"))).toEqual(["false", "true", "false"]);
    expect(host.querySelector('nav')?.getAttribute("aria-label")).toBe("Tableaux");
    expect(host.querySelector(".alert")?.textContent).toBe("1");
    expect(host.querySelector('[role="tabpanel"]')?.textContent).toBe("contenu");
    expect(host.textContent).toContain("aide");
    await click(tabs[2]);
    expect(onChange).toHaveBeenCalledWith("c");
  });
  it("le hook : valeur inconnue → première section ; la première n'écrit rien dans l'URL, les autres l'écrivent", async () => {
    let url: string | null = "zzz"; const setRaw = vi.fn((v: string | null) => { url = v; });
    const useRailSection = createRailSectionHook(() => [url, setRaw]);
    let api!: ReturnType<typeof useRailSection<"a" | "b" | "c">>;
    const Probe = () => { api = useRailSection("section", items as { key: "a" | "b" | "c"; label: string }[]); return null; };
    await show(<Probe />);
    expect(api[0]).toBe("a");
    api[1]("a"); expect(setRaw).toHaveBeenLastCalledWith(null);
    api[1]("c"); expect(setRaw).toHaveBeenLastCalledWith("c");
    url = "b"; await show(<Probe />);
    expect(api[0]).toBe("b");
  });
});

describe("AdminPageHeader et AdminPageShell", () => {
  it("hors hub : titre en h2 + sous-titre + actions ; sous un hub : pas de titre (l'onglet le porte), rien si ni sous-titre ni actions", async () => {
    await show(<AdminPageHeader title="Titre" subtitle="Sous" actions={<button>Go</button>} />);
    expect(host.querySelector("h2")?.textContent).toBe("Titre");
    expect(host.textContent).toContain("Sous");
    await show(<HubContext.Provider value><AdminPageHeader title="Titre" subtitle="Sous" /></HubContext.Provider>);
    expect(host.querySelector("h2")).toBeNull();
    expect(host.textContent).toBe("Sous");
    await show(<HubContext.Provider value><AdminPageHeader title="Titre" /></HubContext.Provider>);
    expect(host.firstChild).toBeNull();
  });
  it("PageShell : en-tête, barre de filtres seulement si fournie, contenu", async () => {
    await show(<AdminPageShell title="T" toolbar={<input />}>corps</AdminPageShell>);
    expect(host.querySelector(".omni-shell-filters input")).not.toBeNull();
    expect(host.querySelector("section")?.textContent).toContain("corps");
    await show(<AdminPageShell title="T">corps</AdminPageShell>);
    expect(host.querySelector(".omni-shell-filters")).toBeNull();
  });
  it("blocs de mise en page : grille, pile, rangée, section à filet", async () => {
    await show(<><FormGrid>g</FormGrid><Stack gap={20}>s</Stack><Row justify="space-between" wrap={false}>r</Row><Section>x</Section></>);
    expect(host.querySelector(".omni-shell-grid2")).not.toBeNull();
    const [stack, row, section] = [...host.children].slice(1) as HTMLElement[];
    expect(stack.style.gap).toBe("1.25rem");
    expect(row.style.flexWrap).toBe("nowrap");
    expect(row.style.justifyContent).toBe("space-between");
    expect(section.style.borderTop).toContain("1px solid");
  });
});

describe("AdminTopbar, taille du texte, pastille de nuit, mise en page", () => {
  it("« Agrandir » bascule le menu ; son info-bulle dit l'effet ; ☰ ouvre le menu sur téléphone ; la recherche ouvre la palette ; outils à droite", async () => {
    const onMobile = vi.fn(); const onPalette = vi.fn();
    const Probe = () => { const p = useAdminPrefs(); return <span data-collapsed={String(p.sidebarCollapsed)} />; };
    await show(<AdminPrefsProvider storagePrefix="clp_admin"><Probe /><AdminTopbar onOpenPalette={onPalette} onOpenMobileNav={onMobile} tools={<i id="outil" />} /></AdminPrefsProvider>);
    const seg = host.querySelector<HTMLElement>("button.omni-btn--seg")!;
    expect(seg.textContent).toBe("Agrandir");
    await click(seg);
    expect(host.querySelector("[data-collapsed]")?.getAttribute("data-collapsed")).toBe("true");
    expect(host.querySelector("button.omni-btn--seg")?.textContent).toBe("Réduire");
    expect(localStorage.getItem("clp_admin_sidebar_collapsed")).toBe("1");
    await click(host.querySelector("button[aria-label='Menu']"));
    expect(onMobile).toHaveBeenCalled();
    await click(host.querySelector("button.omni-shell-search"));
    expect(onPalette).toHaveBeenCalled();
    expect(host.querySelector(".omni-shell-tools #outil")).not.toBeNull();
  });
  it("taille du texte : A- · A · A+ · A++, mémorisée", async () => {
    await show(<AdminPrefsProvider storagePrefix="clp_admin"><FontScaleControl /></AdminPrefsProvider>);
    expect(host.querySelector(".omni-shell-fontscale")).not.toBeNull();
    expect(host.querySelector("[aria-label='Taille du texte']")?.textContent).toContain("A");
  });
  it("NightBadge (mirroir de NightMoon.test.tsx) : visible tant qu'actif ; à la sortie fondu puis disparition seule", async () => {
    vi.useFakeTimers();
    const label = "Mode nuit : cuisine fermée";
    await show(<NightBadge active label={label} />);
    expect(host.querySelector(".omni-shell-moon")).not.toBeNull();
    expect(host.querySelector("[role=status]")?.getAttribute("aria-label")).toBe(label);
    await show(<NightBadge active={false} label={label} />);
    expect(host.querySelector(".omni-shell-moon")?.getAttribute("data-leaving")).toBe("true");
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(host.querySelector(".omni-shell-moon")).toBeNull();
  });
  it("NightBadge inactif au départ : rien", async () => {
    await show(<NightBadge active={false} label="x" />);
    expect(host.firstChild).toBeNull();
  });
  it("thème de nuit : classe sur <html> tant qu'actif, retirée au démontage (le site n'hérite jamais du thème admin)", async () => {
    const Probe = ({ on }: { on: boolean }) => { useAdminNightTheme(on); return null; };
    await show(<Probe on />);
    expect(document.documentElement.classList.contains(ADMIN_NIGHT_CLASS)).toBe(true);
    await show(<Probe on={false} />);
    expect(document.documentElement.classList.contains(ADMIN_NIGHT_CLASS)).toBe(false);
    await show(<Probe on />);
    await act(async () => root.render(<i />));
    expect(document.documentElement.classList.contains(ADMIN_NIGHT_CLASS)).toBe(false);
  });
  it("AdminLayout : voile derrière le menu hors-champ, bandeaux collants, hôtes ; classe de survol central sur <body> seulement tant que monté", async () => {
    const close = vi.fn();
    await show(<AdminLayout sidebar={<aside id="s" />} palette={<i id="p" />} topbar={<header id="t" />} banners={<u id="b" />} overlays={<s id="o" />} mobileNavOpen onCloseMobileNav={close}><main id="m" /></AdminLayout>);
    expect(document.body.classList.contains("omni-admin-mode")).toBe(true);
    for (const id of ["s", "p", "t", "b", "o", "m"]) expect(host.querySelector(`#${id}`), id).not.toBeNull();
    await click(host.querySelector(".omni-shell-backdrop"));
    expect(close).toHaveBeenCalled();
    await show(<AdminLayout sidebar={null} topbar={null}>x</AdminLayout>);
    expect(host.querySelector(".omni-shell-backdrop")).toBeNull();
    await act(async () => root.render(<i />));
    expect(document.body.classList.contains("omni-admin-mode")).toBe(false);
  });
});

describe("préférences d'affichage (mirroir de prefs-font-scale.test.tsx et prefs-view-collapse.test.tsx)", () => {
  const mountPrefs = (el: ReactNode) => act(async () => root.render(<AdminPrefsProvider storagePrefix="clp_admin">{el}</AdminPrefsProvider>));
  it("4 paliers croissants, A (md) = 100 %", () => {
    expect(FONT_SCALES).toEqual(["sm", "md", "lg", "xl"]);
    expect(FONT_SCALES.map(k => FONT_SCALE_PCT[k])).toEqual([87.5, 100, 112.5, 125]);
  });
  it("A- mémorisé : la racine passe à 87,5 % tant que l'admin est monté, puis revient", async () => {
    window.innerWidth = 1600;
    localStorage.setItem("clp_admin_font_scale", "sm");
    await mountPrefs(null);
    expect(document.documentElement.style.fontSize).toBe("87.5%");
    await act(async () => root.render(<i />));
    expect(document.documentElement.style.fontSize).toBe("");
  });
  it("échelle automatique : 100 % dès 1500 px, proportionnelle en dessous, plancher 85 %, aucune réduction en mise en page mobile", () => {
    expect(autoScale(1920)).toBe(1);
    expect(autoScale(1500)).toBe(1);
    expect(autoScale(1366)).toBeCloseTo(0.9107, 3);
    expect(autoScale(1000)).toBe(0.85);
    expect(autoScale(800)).toBe(1);
    expect(autoScale(Number.NaN)).toBe(1);
    expect(rootPercent("md", 1366)).toBe(91.1);
    expect(rootPercent("sm", 1366)).toBe(79.7);
    expect(rootPercent("xl", 1920)).toBe(125);
  });
  it("la racine suit le redimensionnement ; valeur inconnue en stockage → taille normale", async () => {
    window.innerWidth = 1366;
    localStorage.setItem("clp_admin_font_scale", "xxl");
    await mountPrefs(null);
    expect(document.documentElement.style.fontSize).toBe("91.1%");
    await act(async () => { window.innerWidth = 1800; window.dispatchEvent(new Event("resize")); });
    expect(document.documentElement.style.fontSize).toBe("100%");
  });
  it("clé de stockage préfixée par l'application (défaut omni_admin) ; stockage indisponible : jamais d'erreur", async () => {
    let api!: ReturnType<typeof useAdminPrefs>;
    const Probe = () => { api = useAdminPrefs(); return null; };
    await act(async () => root.render(<AdminPrefsProvider><Probe /></AdminPrefsProvider>));
    await act(async () => api.setSidebarCollapsed(true));
    expect(localStorage.getItem("omni_admin_sidebar_collapsed")).toBe("1");
    const boom = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("plein"); });
    await act(async () => api.setFontScale("lg"));
    expect(api.fontScale).toBe("lg");
    boom.mockRestore();
    const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("refusé"); });
    try {
      await act(async () => root.render(<AdminPrefsProvider key="neuf"><Probe /></AdminPrefsProvider>));
      expect(api.sidebarCollapsed).toBe(false);
    } finally { get.mockRestore(); }
  });
  it("hors fournisseur : valeurs neutres, jamais d'erreur", async () => {
    let api!: ReturnType<typeof useAdminPrefs>;
    const Probe = () => { api = useAdminPrefs(); return null; };
    await show(<Probe />);
    expect(api).toMatchObject({ fontScale: "md", sidebarCollapsed: false });
    expect(() => { api.setFontScale("lg"); api.toggleSidebar(); api.setSidebarCollapsed(true); api.setViewCollapsed(true); }).not.toThrow();
  });
  describe("mode immersif d'une vue", () => {
    const KEY = "clp_admin_sidebar_collapsed";
    let prefs!: ReturnType<typeof useAdminPrefs>;
    const Probe = ({ immersive }: { immersive: boolean }) => { useViewImmersion(immersive); prefs = useAdminPrefs(); return null; };
    const render = (immersive: boolean) => mountPrefs(<Probe immersive={immersive} />);
    it("entrer replie le menu ; la préférence mémorisée n'est pas écrite", async () => {
      await render(false); expect(prefs.sidebarCollapsed).toBe(false);
      await render(true); expect(prefs.sidebarCollapsed).toBe(true);
      expect(localStorage.getItem(KEY)).toBeNull();
    });
    it("« Réduire » pendant la visite rouvre le menu sans rien mémoriser ; un second clic le replie", async () => {
      await render(true);
      await act(async () => prefs.toggleSidebar()); expect(prefs.sidebarCollapsed).toBe(false);
      await act(async () => prefs.toggleSidebar()); expect(prefs.sidebarCollapsed).toBe(true);
      expect(localStorage.getItem(KEY)).toBeNull();
    });
    it("quitter la vue retrouve la préférence de l'appareil ; à chaque ouverture le menu est replié", async () => {
      await render(true); await render(false); expect(prefs.sidebarCollapsed).toBe(false);
      await act(async () => prefs.setSidebarCollapsed(true));
      await render(true); await render(false); expect(prefs.sidebarCollapsed).toBe(true);
      await act(async () => prefs.setSidebarCollapsed(false));
      await render(true); await act(async () => prefs.toggleSidebar()); expect(prefs.sidebarCollapsed).toBe(false);
      await render(false); await render(true); expect(prefs.sidebarCollapsed).toBe(true);
    });
    it("hors de la vue, « Agrandir » mémorise le réglage de l'appareil", async () => {
      await render(false);
      await act(async () => prefs.toggleSidebar());
      expect(prefs.sidebarCollapsed).toBe(true);
      expect(localStorage.getItem(KEY)).toBe("1");
    });
  });
});
