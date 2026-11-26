// Parité avec le VRAI code de Chez la Petite (chezlapetite origin/dev bb247c29) : les sorties de test/golden/clp-admin-shell.json ont été produites en exécutant ses fonctions
// (registry, hubs, hub-groups, navGroups, breadcrumbs, routes, role-views, CommandPalette ; générateur : test/golden/generate-clp-golden-lot9.ts.txt) ; le moteur est rejoué contre elles,
// cas par cas, avec le jeu de données de CLP en entrée (test/fixtures/clp-admin.ts). Aucune donnée personnelle : des rôles, des chemins et des libellés d'écran.
import { describe, expect, it } from "vitest";
import { buildPaletteEntries, norm, rankPalette, score, type PaletteEntry } from "../src/web/admin-palette-model";
import { CLP_FEATURES, CLP_SETTINGS, clpGateOk, clpRegistry } from "./fixtures/clp-admin";
import { golden, json } from "./golden/lot7";

const g = golden("clp-admin-shell.json");
const r = clpRegistry();
const views = r.config.views.map(v => v.id);

describe("registre — dérivations identiques à CLP", () => {
  it("chemins, libellés, groupes, ressources, accès par rôle, hub de chaque vue", () => {
    expect(json(r.VIEW_TO_PATH)).toEqual(g.derived.VIEW_TO_PATH);
    expect(json(r.PATH_TO_VIEW)).toEqual(g.derived.PATH_TO_VIEW);
    expect(json(r.VIEW_LABEL)).toEqual(g.derived.VIEW_LABEL);
    expect(json(r.VIEW_TAB_LABEL)).toEqual(g.derived.VIEW_TAB_LABEL);
    expect(json(r.NAV_GROUP_MAP)).toEqual(g.derived.NAV_GROUP_MAP);
    expect(json(r.RESOURCE_VIEWS)).toEqual(g.derived.RESOURCE_VIEWS);
    expect(json(r.ROLE_VIEWS)).toEqual(g.derived.ROLE_VIEWS);
    expect(json(Object.fromEntries(Object.entries(r.HUB_OF_VIEW).map(([k, h]) => [k, h.id])))).toEqual(g.derived.HUB_OF_VIEW);
  });
  it(`rang de hub : ${Object.keys(g.hubRanks).length} clés dont une inconnue et la vide`, () => {
    for (const [k, v] of Object.entries(g.hubRanks)) expect(r.hubRank(k), k).toBe(v);
  });
});

describe("menu et entrées du menu de gauche — parité avec CLP", () => {
  it(`${g.nav.length} scénarios (jeu de vues × rôle × compteurs)`, () => {
    expect(g.nav.length).toBeGreaterThan(80);
    for (const c of g.nav) {
      const allowed = new Set(g.nav.length ? scenarioSet(c.set) : []);
      const groups = r.buildNavGroups({
        canSee: v => allowed.has(v), gateOk: clpGateOk(c.role, c.manage),
        badges: { orders: c.badges.ordersBadge, support: c.badges.supportBadge, emails: c.badges.emailsBadge, validations: c.badges.validationsBadge ?? 0, conversations: c.badges.conversationsBadge ?? 0 },
      });
      const label = `${c.set} / ${c.role} / ${c.badges.ordersBadge}`;
      expect(json(groups.map(x => ({ label: x.label, items: x.items.map(i => ({ key: i.key, label: i.label, hidden: i.hidden, badge: i.badge, kw: i.keywords?.length ?? null })) }))), label).toEqual(c.groups);
      expect(json(groups.map(x => r.sidebarEntries(x.items))), label).toEqual(c.entries);
    }
  });
});

function scenarioSet(name: string): string[] {
  if (name === "all") return views;
  if (name === "none") return [];
  if (name === "sans-menu") return views.filter(v => v !== "menu");
  if (name === "sans-premiers-onglets") return views.filter(v => !r.config.hubs.some(h => h.tabs[0] === v));
  return r.ROLE_VIEWS[name.replace("role:", "")];
}

describe("onglets de hub et sélecteur de vue — parité avec CLP", () => {
  it(`${g.tabs.length} cas (hub × vue × jeu de vues)`, () => {
    for (const c of g.tabs) {
      const hub = r.config.hubs.find(h => h.id === c.hub)!;
      const allowed = new Set(scenarioSet(c.set));
      const canSee = (v: string) => allowed.has(v);
      const label = `${c.hub} / ${c.view} / ${c.set}`;
      expect(json(r.hubTabEntries(hub, c.view, canSee)), label).toEqual(c.tabs);
      expect(json(r.railOfView(hub, c.view, canSee)), label).toEqual(c.rail);
    }
  });
});

describe("fil d'Ariane et vue d'une URL — parité avec CLP", () => {
  it("miettes de chaque vue, seule puis avec une fiche (commande, partenaire, cuisine)", () => {
    for (const [v, c] of Object.entries(g.crumbs.plain)) expect(json(r.crumbsFor(v)), v).toEqual(c);
    for (const [k, c] of Object.entries(g.crumbs.entity)) {
      const [v, kind] = k.split("|");
      expect(json(r.crumbsFor(v, { kind, label: "#0726" })), k).toEqual(c);
    }
  });
  it(`vue d'un chemin : ${g.pathResults.length} chemins (slash final, pages à identifiant, inconnus)`, () => {
    for (const c of g.pathResults) expect(r.viewFromPathname(c.p), c.p).toBe(c.viewFromPathname);
  });
});

describe("anciennes URL — parité avec CLP", () => {
  it(`${g.legacy.length} chemins`, () => {
    for (const c of g.legacy) {
      // Seul écart voulu : `constructor` et `toString` donnent une FONCTION chez CLP (table avec prototype : /admin/constructor plante l'admin) ; le moteur renvoie null (test dédié).
      if (c.i === "constructor" || c.i === "toString") { expect(r.resolveLegacyPath(c.i), c.i).toBeNull(); continue; }
      expect(json(r.resolveLegacyPath(c.i)), JSON.stringify(c.i)).toEqual(c.out.ok);
    }
  });
});

describe("permissions — parité avec CLP", () => {
  it("vues d'après la matrice et repli codé en dur", () => {
    for (const c of g.perms.fromMatrix) expect(r.viewsFromPermissions(g.perms.matrix, c.roles), c.roles.join()).toEqual(c.views);
    for (const c of g.perms.hardcoded) expect(r.viewsFromHardcodedRoles(c.roles), c.roles.join()).toEqual(c.views);
  });
});

describe("palette ⌘K — parité avec CLP", () => {
  const entries: PaletteEntry[] = [
    ...r.config.views.map(d => ({ kind: "view" as const, key: d.id, label: d.navLabel ?? d.label, group: d.group, keywords: d.keywords ? [...d.keywords] : undefined })),
    ...CLP_FEATURES.map(f => ({ kind: "feature" as const, key: f.view, label: f.label, group: r.NAV_GROUP_MAP[f.view], keywords: [...f.keywords] })),
    ...CLP_SETTINGS.map(s => ({ kind: "setting" as const, ...s })),
  ];
  it("norm : accents, casse, ligatures, vide", () => {
    for (const c of g.palette.normInputs) expect(norm(c.i), c.i).toBe(c.o);
  });
  it(`score de ${g.palette.entryCount} entrées × ${g.palette.queries.length} requêtes`, () => {
    expect(entries).toHaveLength(g.palette.entryCount);
    for (const c of g.palette.scores) expect(entries.map(e => score(e, norm(c.q.trim()))), c.q).toEqual(c.scores);
  });
  it("ordre des résultats (tri stable à égalité)", () => {
    for (const c of g.palette.ranked) expect(rankPalette(entries, c.q).map(e => entries.indexOf(e)), c.q).toEqual(c.order);
  });
  it("l'index construit à partir du menu a les mêmes entrées que celui de CLP (vues visibles, fonctions des vues visibles, réglages si Paramètres est visible)", () => {
    const groups = r.buildNavGroups({ canSee: () => true, gateOk: () => true });
    const built = buildPaletteEntries({ navGroups: groups, features: CLP_FEATURES, settings: CLP_SETTINGS });
    expect(built).toHaveLength(g.palette.entryCount - r.config.views.filter(v => v.inNav === false).length);
    expect(built.filter(e => e.kind === "setting")).toHaveLength(CLP_SETTINGS.length);
    const noSettings = r.buildNavGroups({ canSee: v => v !== "settings", gateOk: () => false });
    expect(buildPaletteEntries({ navGroups: noSettings, features: CLP_FEATURES, settings: CLP_SETTINGS }).filter(e => e.kind === "setting")).toEqual([]);
  });
});
