// Tests miroir de CLP (web/src/admin/shell/__tests__/registry.test.ts, routes.test.ts, hubs.test.ts, breadcrumbs.test.ts) rejoués sur le moteur avec le jeu de données de CLP,
// plus les invariants du moteur (`checkAdminRegistry`) et le seul écart voulu (clés du prototype).
import { describe, expect, it } from "vitest";
import { checkAdminRegistry } from "../src/web/admin-registry-check";
import { createAdminRegistry } from "../src/web/admin-registry";
import { legacyRedirectUrl } from "../src/web/admin-legacy";
import { ICONS } from "../src/web/icon-registry";
import { CLP_CONFIG, clpGateOk, clpRegistry } from "./fixtures/clp-admin";

const r = clpRegistry();
const { views: DEFS, hubs: HUBS, resources } = r.config;
const nav = (role: string, manage: boolean, allowed: ReadonlySet<string>) => r.buildNavGroups({ canSee: v => allowed.has(v), gateOk: clpGateOk(role, manage) });
const visible = (g: ReturnType<typeof nav>) => g.flatMap(x => x.items).filter(i => !i.hidden).map(i => i.key);

describe("registre des vues admin (mirroir de registry.test.ts)", () => {
  it("le jeu de CLP passe tous les invariants du moteur", () => {
    expect(checkAdminRegistry(r)).toEqual([]);
  });
  it("les vues absentes du menu sont des pages ouvertes depuis une autre vue", () => {
    expect(DEFS.filter(d => d.inNav === false).map(d => d.id).sort()).toEqual(["add", "edit", "promo"]);
  });
  it("le menu : un cuisinier ne voit que Stock et Calendrier côté catalogue, un superadmin voit Rôles et Paramètres", () => {
    expect(visible(nav("cook", false, new Set(r.ROLE_VIEWS.cook)))).toEqual(["menu-calendar", "menu-stock", "orders", "queue"]);
    const sup = visible(nav("superadmin", true, new Set(r.ROLE_VIEWS.superadmin)));
    expect(sup).toEqual(expect.arrayContaining(["roles", "settings", "users", "tracking"]));
    expect(visible(nav("admin", true, new Set(r.ROLE_VIEWS.admin)))).not.toContain("roles");
  });
  it("« Gérer les commandes » : la vue et le bouton du hub Opérations portent le même libellé et une icône qui existe au registre", () => {
    expect(r.VIEW_LABEL["order-desk"]).toBe("Gérer les commandes");
    const hub = HUBS.find(h => h.id === "orders");
    expect(hub?.action).toMatchObject({ view: "order-desk", label: "Gérer les commandes", icon: "action-manage" });
    expect(Object.keys(ICONS)).toContain(hub?.action?.icon);
  });
  it("Équipements : un onglet du hub Affaires, 11 menus en tout, accès superadmin, admin, ops, stock_manager et finance", () => {
    expect(HUBS.find(h => h.id === "places")?.tabs).toContain("assets");
    expect(HUBS).toHaveLength(11);
    expect([...DEFS.find(v => v.id === "assets")!.roles].sort()).toEqual(["admin", "finance", "ops", "stock_manager", "superadmin"]);
    expect(r.ROLE_VIEWS.marketing).not.toContain("assets");
  });
  it("toute icône de hub existe au registre d'icônes du paquet", () => {
    for (const h of HUBS) expect(Object.keys(ICONS), h.id).toContain(h.icon);
  });
});

describe("menu à onglets (mirroir de hubs.test.ts)", () => {
  const all = () => new Set(DEFS.map(d => d.id));
  const entries = (role: string) => nav(role, true, all()).flatMap(g => r.sidebarEntries(g.items)).filter(e => !e.hidden);
  it("ordre du menu : validations, catalogue, contenu, équipe, affaires, messages, utilisateurs, opérations, logistique, analytiques, système", () => {
    const ranks = ["validations", "menu", "documents", "users", "list", "support", "clients", "orders", "bags", "analytics", "settings"].map(r.hubRank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(new Set(ranks).size).toBe(11);
  });
  it("le menu Messages s'ouvre sur Conversations (premier onglet), pas sur Support", () => {
    const items = ["support", "whatsapp", "emails"].map(key => ({ key, label: key }));
    expect(r.sidebarEntries(items).find(e => e.label === "Messages")?.key).toBe("whatsapp");
  });
  it("11 menus pour le superadmin et l'admin, 10 pour tout autre rôle (Validations est leur tableau de bord)", () => {
    expect(entries("superadmin")).toHaveLength(11);
    expect(entries("admin")).toHaveLength(11);
    for (const role of ["ops", "finance", "marketing", "dev", "support", "stock_manager"]) {
      expect(entries(role).map(e => e.label), role).not.toContain("Validations");
      expect(entries(role), role).toHaveLength(10);
    }
  });
  it("la pastille du menu Validations compte les demandes en attente ; celle des commandes remonte sur l'entrée du hub", () => {
    const g = r.buildNavGroups({ canSee: () => true, gateOk: () => true, badges: { validations: 4, orders: 6 } });
    const e = g.flatMap(x => r.sidebarEntries(x.items));
    expect(e.find(x => x.label === "Validations")?.badge).toBe(4);
    expect(e.find(x => x.label === "Opérations")?.badge).toBe(6);
  });
  it("un rôle sans la 1re vue du hub arrive sur son premier onglet visible (cuisinier : File d'attente seulement), sans aucune vue il ne voit pas l'entrée", () => {
    const ventes = (allowed: string[]) => r.sidebarEntries(nav("ops", false, new Set(allowed)).find(x => x.label === "Ventes")!.items).find(x => x.label === "Opérations")!;
    expect(ventes(["queue"])).toMatchObject({ hidden: false, key: "queue" });
    expect(ventes(["clients"]).hidden).toBe(true);
  });
  it("hub Logistique : onglets dans l'ordre, chacun son chemin /admin/delivery/…", () => {
    const hub = r.HUB_OF_VIEW.bags;
    expect(hub.tabs).toEqual(["bags", "dispatch", "vehicles", "couriers", "weather", "delivery-fees"]);
    expect(hub.tabs.map(t => r.VIEW_TO_PATH[t])).toEqual(["delivery/bags", "delivery/dispatch", "delivery/vehicles", "delivery/couriers", "delivery/weather", "delivery/fees"]);
  });
  it("onglets à rail : un seul « Menu » dans la barre du haut ; le sélecteur liste Plats, Catégories, Variations, Recettes ; une seule vue visible = pas de sélecteur", () => {
    const catalog = HUBS.find(h => h.id === "catalog")!;
    const all2 = () => true;
    expect(r.hubTabEntries(catalog, "menu", all2).map(t => t.label)).toEqual(["Menu", "Stock", "Allergènes", "Calendrier", "Emballages", "Conformité"]);
    expect(r.railOfView(catalog, "menu-recipes", all2)?.items.map(i => i.label)).toEqual(["Plats", "Catégories", "Variations", "Recettes"]);
    expect(r.railOfView(catalog, "menu-recipes", v => v === "menu-recipes")).toBeNull();
    expect(r.railOfView(catalog, "menu-stock", all2)).toBeNull();
    expect(r.hubTabEntries(catalog, "menu-categories", v => v !== "menu")[0]).toMatchObject({ label: "Menu", target: "menu-categories", active: true });
  });
});

describe("routes (mirroir de routes.test.ts)", () => {
  it("pages à identifiant : /partenaires/:id et /cuisines/:id redirigent, l'identifiant actuel non ; slash final toléré", () => {
    expect(r.resolveLegacyPath("partenaires/abc123")).toBe("partners/abc123");
    expect(r.resolveLegacyPath("cuisines/site-9")).toBe("kitchens/site-9");
    expect(r.resolveLegacyPath("partners/abc123")).toBeNull();
    expect(r.resolveLegacyPath("kitchens/site-9")).toBeNull();
    expect(r.resolveLegacyPath("commandes/")).toBe("orders");
  });
  it("les anciennes vues fusionnées redirigent", () => {
    expect(r.resolveLegacyPath("catalog/accompaniments")).toBe("catalog/categories");
    expect(r.resolveLegacyPath("forfaits-portefeuille")).toBe("system/settings?group=wallet");
  });
});

describe("fil d'Ariane (mirroir de breadcrumbs.test.ts)", () => {
  it("vue d'un chemin : simples, pages pleines, inconnu", () => {
    expect(r.viewFromPathname("/admin/orders")).toBe("orders");
    expect(r.viewFromPathname("/admin/orders/")).toBe("orders");
    expect(r.viewFromPathname("/admin/partners/p1")).toBe("edit");
    expect(r.viewFromPathname("/admin/kitchens/s9")).toBe("cuisines");
    expect(r.viewFromPathname("/admin/nimporte")).toBeNull();
  });
  it("Menu › Onglet [› Fiche] ; avec rubrique de groupe : Catalogue › Menu › Recettes", () => {
    expect(r.crumbsFor("orders")).toEqual([{ label: "Opérations", to: "/admin/orders" }, { label: "Commandes", to: null }]);
    expect(r.crumbsFor("orders", { kind: "order", label: "#0726" })).toEqual([
      { label: "Opérations", to: "/admin/orders" }, { label: "Commandes", to: "/admin/orders" }, { label: "Commande #0726", to: null },
    ]);
    expect(r.crumbsFor("menu-recipes").map(c => c.label)).toEqual(["Catalogue", "Menu", "Recettes"]);
    expect(r.crumbsFor("menu-recipes")[1].to).toBe("/admin/catalog/menu");
  });
});

describe("écart voulu : les clés du prototype ne sont jamais des vues ni des anciennes URL", () => {
  it("/admin/constructor et /admin/toString : aucune vue, aucune redirection (CLP : une fonction, et l'admin plante)", () => {
    for (const k of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      expect(r.viewFromPathname(`/admin/${k}`), k).toBeNull();
      expect(r.resolveLegacyPath(k), k).toBeNull();
      expect(r.locate(`/admin/${k}`, "documents"), k).toEqual({ view: "documents", id: null });
      expect(legacyRedirectUrl(r, `/admin/${k}`, "", ""), k).toBeNull();
    }
  });
});

describe("locate (vue + identifiant de page pleine, comme AdminPage)", () => {
  it("pages à identifiant, chemins fixes, inconnu → repli ; le slash final n'est pas purgé (comme CLP)", () => {
    expect(r.locate("/admin/partners/p1", "documents")).toEqual({ view: "edit", id: "p1" });
    expect(r.locate("/admin/partners/new", "documents")).toEqual({ view: "add", id: null });
    expect(r.locate("/admin/partners/edit", "documents")).toEqual({ view: "edit", id: null });
    expect(r.locate("/admin/kitchens/s9", "documents")).toEqual({ view: "cuisines", id: "s9" });
    expect(r.locate("/admin/kitchens", "documents").view).toBe("cuisines");
    expect(r.locate("/admin/orders", "documents")).toEqual({ view: "orders", id: null });
    expect(r.locate("/admin/orders/", "documents")).toEqual({ view: "documents", id: null });
    expect(r.locate("/admin", "documents").view).toBe("documents");
  });
});

describe("redirection d'une ancienne URL (effet d'AdminPage)", () => {
  it("query de la cible et de l'URL entrante fusionnées (l'entrante gagne), hash conservé", () => {
    expect(legacyRedirectUrl(r, "/admin/commandes", "?order=12", "#top")).toBe("/admin/orders?order=12#top");
    expect(legacyRedirectUrl(r, "/admin/parametres", "", "")).toBe("/admin/system/settings");
    expect(legacyRedirectUrl(r, "/admin/forfaits-portefeuille", "?x=1", "")).toBe("/admin/system/settings?group=wallet&x=1");
    expect(legacyRedirectUrl(r, "/admin/forfaits-portefeuille", "?group=autre", "")).toBe("/admin/system/settings?group=autre");
    expect(legacyRedirectUrl(r, "/admin/partenaires/p1", "?tab=a", "")).toBe("/admin/partners/p1?tab=a");
  });
  it("chemin actuel ou inconnu : rien", () => {
    expect(legacyRedirectUrl(r, "/admin/orders", "?a=1", "")).toBeNull();
    expect(legacyRedirectUrl(r, "/admin", "", "")).toBeNull();
    expect(legacyRedirectUrl(r, "/admin/nimporte", "", "")).toBeNull();
  });
});

describe("checkAdminRegistry détecte une donnée mal formée", () => {
  const mutate = (fn: (c: typeof CLP_CONFIG) => typeof CLP_CONFIG) => checkAdminRegistry(createAdminRegistry(fn(CLP_CONFIG)));
  const first = CLP_CONFIG.views[0];
  it("identifiant ou chemin en double", () => {
    expect(mutate(c => ({ ...c, views: [...c.views, { ...first }] })).join("\n")).toMatch(/en double/);
  });
  it("chemin avec accent ou majuscule", () => {
    expect(mutate(c => ({ ...c, views: [...c.views, { ...first, id: "x", path: "catalogue/Éléments" }] })).join("\n")).toMatch(/slug/);
  });
  it("vue sans ressource ni gate", () => {
    expect(mutate(c => ({ ...c, views: [...c.views, { ...first, id: "x", path: "x", resource: null }] })).join("\n")).toMatch(/ouverte à tous/);
  });
  it("ressource non déclarée, groupe inconnu", () => {
    const out = mutate(c => ({ ...c, views: [...c.views, { ...first, id: "x", path: "x", resource: "inconnue", group: "Autre" }] })).join("\n");
    expect(out).toMatch(/non déclarée/);
    expect(out).toMatch(/groupe inconnu/);
  });
  it("ancienne URL qui vise un chemin inexistant, ou chemin actuel pris pour une ancienne URL", () => {
    expect(mutate(c => ({ ...c, legacyPaths: { ...c.legacyPaths, vieux: "nulle/part" } })).join("\n")).toMatch(/cible inconnue/);
    expect(mutate(c => ({ ...c, legacyPaths: { ...c.legacyPaths, orders: "orders/queue" } })).join("\n")).toMatch(/boucle/);
  });
  it("vue dans deux hubs, hub hors du groupe ou de la racine, action hors du hub", () => {
    const hubs = CLP_CONFIG.hubs;
    expect(mutate(c => ({ ...c, hubs: [...hubs, { ...hubs[0], id: "dup" }] })).join("\n")).toMatch(/plusieurs hubs/);
    expect(mutate(c => ({ ...c, hubs: hubs.map(h => (h.id === "orders" ? { ...h, root: "ailleurs" } : h)) })).join("\n")).toMatch(/hors de la racine/);
    expect(mutate(c => ({ ...c, hubs: hubs.map(h => (h.id === "orders" ? { ...h, action: { view: "menu", label: "x" } } : h)) })).join("\n")).toMatch(/hors du hub/);
  });
  it("entrée de menu hors de tout hub", () => {
    expect(mutate(c => ({ ...c, views: [...c.views, { ...first, id: "x", path: "x", resource: "menu" }] })).join("\n")).toMatch(/hors de tout hub/);
  });
});
