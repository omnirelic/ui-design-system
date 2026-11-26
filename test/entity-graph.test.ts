import { describe, expect, it } from "vitest";
import { checkEntityGraph, createEntityGraph, entityParams } from "../src/web/entity-graph";
import { ENTITY_DEFS, ENTITY_KINDS, ENTITY_RELATIONS, VIEW_TO_PATH, clientEntityKey, clpGraph, entityPath, linksFrom, type EntityKind } from "./fixtures/clp-entities";

// Tests de CLP (web/src/admin/shell/__tests__/entity-graph.test.ts) rejoués sur le moteur injecté avec le jeu d'entités de CLP.
const RESERVED = ["tab", "section", "list", "group", "stock_tab", "clientTab"];

describe("graphe des entités — cohérence", () => {
  it("toute entité s'ouvre dans une vue qui existe", () => {
    for (const k of ENTITY_KINDS) expect(VIEW_TO_PATH[ENTITY_DEFS[k].view], k).toBeTruthy();
  });

  it("deux entités ne partagent pas le même couple (vue, paramètre)", () => {
    const seen = new Map<string, EntityKind>();
    for (const k of ENTITY_KINDS) {
      const d = ENTITY_DEFS[k];
      if (!d.param) continue;
      const id = `${d.view}?${d.param}`;
      expect(seen.get(id), `${k} et ${seen.get(id)} ouvrent ${id}`).toBeUndefined();
      seen.set(id, k);
    }
  });

  it("les paramètres ne sont ni des onglets ni des états de vue réservés", () => {
    for (const k of ENTITY_KINDS) expect(RESERVED).not.toContain(ENTITY_DEFS[k].param);
  });

  it("chaque relation relie deux entités connues, distinctes, sans doublon", () => {
    const seen = new Set<string>();
    for (const r of ENTITY_RELATIONS) {
      expect(ENTITY_KINDS).toContain(r.a);
      expect(ENTITY_KINDS).toContain(r.b);
      expect(r.a).not.toBe(r.b);
      const key = [r.a, r.b].sort().join("|") + "|" + r.via;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });

  it("aucune entité orpheline : toutes sont reliées à au moins une autre", () => {
    for (const k of ENTITY_KINDS) expect(linksFrom(k).length, k).toBeGreaterThan(0);
  });

  it("le graphe est connexe : de la commande, on atteint toutes les entités", () => {
    const reach = new Set<EntityKind>(["order"]);
    for (let grew = true; grew;) {
      grew = false;
      for (const k of [...reach]) for (const l of linksFrom(k)) if (!reach.has(l.to)) { reach.add(l.to); grew = true; }
    }
    expect([...ENTITY_KINDS].filter(k => !reach.has(k))).toEqual([]);
  });

  it("une relation se lit dans les deux sens", () => {
    expect(linksFrom("order").find(l => l.to === "client")?.label).toBe("Client");
    expect(linksFrom("client").find(l => l.to === "order")?.label).toBe("Commandes");
  });
});

describe("entityPath — lien profond vers une fiche", () => {
  it("paramètre d'URL", () => {
    expect(entityPath("order", "abc-1")).toBe("/admin/orders?order=abc-1");
    expect(entityPath("courier", 12)).toBe("/admin/delivery/couriers?courier=12");
  });
  it("encode l'identifiant (le « + » d'un téléphone ne doit pas devenir un espace)", () => {
    expect(entityPath("client", "+237686033861")).toBe("/admin/clients?client=%2B237686033861");
  });
  it("paramètres fixes d'onglet interne", () => {
    expect(entityPath("ingredient", "i1")).toBe("/admin/catalog/stock?stock_tab=ingredients&bank_focus=i1");
    expect(entityPath("employee", 5)).toBe("/admin/team?team=employees&emp=5");
  });
  it("page pleine à identifiant dans le chemin", () => {
    expect(entityPath("partner", "p1")).toBe("/admin/partners/p1");
    expect(entityPath("kitchen", "s9")).toBe("/admin/kitchens/s9");
  });
  it("équipement : ?asset= dans Équipements, relié à son établissement et à sa cuisine", () => {
    expect(entityPath("asset", "ab12")).toBe("/admin/assets?asset=ab12");
    expect(linksFrom("asset").map(l => l.to).sort()).toEqual(["kitchen", "store"]);
    expect(linksFrom("store").map(l => l.to)).toContain("asset");
  });
  it("conversation WhatsApp : l'id du fil dans la vue Conversations, distincte du support (même paramètre, autre vue)", () => {
    expect(entityPath("conversation", "c1")).toBe("/admin/messages/whatsapp?thread=c1");
    expect(entityPath("support_thread", "t1")).toBe("/admin/messages/support?thread=t1");
  });
  it("paramètres de vue en plus de l'identifiant (filtre du fil sur une commande)", () => {
    expect(entityPath("conversation", "c1", { order: "o-9" })).toBe("/admin/messages/whatsapp?thread=c1&order=o-9");
    expect(entityPath("conversation", "c1", {})).toBe("/admin/messages/whatsapp?thread=c1");
  });
  it("une commande, un client et un panier mènent à leur conversation WhatsApp, et inversement", () => {
    expect(linksFrom("order").some(l => l.to === "conversation")).toBe(true);
    expect(linksFrom("client").some(l => l.to === "conversation")).toBe(true);
    expect(linksFrom("draft").some(l => l.to === "conversation")).toBe(true);
    expect(linksFrom("conversation").map(l => l.to).sort()).toEqual(["client", "draft", "order"]);
  });
  it("sans identifiant, ou entité sans fiche par identifiant : la vue seule", () => {
    expect(entityPath("order", null)).toBe("/admin/orders");
    expect(entityPath("wallet_tier", "t1")).toBe("/admin/system/settings?group=wallet&tier=t1");
  });
});

describe("clientEntityKey — clé de fiche client", () => {
  it("un numéro masqué n'est jamais une clé de fiche", () => {
    expect(clientEntityKey("+237 ORANGE 56", "Awa")).toBe("name:awa");
  });
  it("téléphone camerounais à 9 chiffres ou déjà indicatif : même clé canonique", () => {
    expect(clientEntityKey("686033861")).toBe("+237686033861");
    expect(clientEntityKey("+237 686 03 38 61")).toBe("+237686033861");
    expect(clientEntityKey("237686033861")).toBe("+237686033861");
  });
  it("avec l'ID du profil : l'ID, jamais le numéro", () => {
    expect(clientEntityKey("686033861", "Adèle", "p_abc123")).toBe("p_abc123");
    expect(clientEntityKey(null, null, "p_abc123")).toBe("p_abc123");
    expect(clientEntityKey("686033861", null, null)).toBe("+237686033861");
  });
  it("sans téléphone : « name: » + nom en minuscules, ou « anonyme »", () => {
    expect(clientEntityKey(null, "Adèle")).toBe("name:adèle");
    expect(clientEntityKey("", "")).toBe("name:anonyme");
  });
});

describe("checkEntityGraph — les règles de cohérence, réutilisables par l'application", () => {
  it("le jeu de CLP n'a aucune violation", () => {
    expect(checkEntityGraph(clpGraph, { reservedParams: RESERVED, root: "order" })).toEqual([]);
  });

  const tiny = (over: { defs?: Record<string, Partial<{ view: string; param: string | null }>>; relations?: { a: string; b: string; ab: string; ba: string; via: string }[]; paths?: Record<string, string> } = {}) => {
    const defs: Record<string, { label: string; view: string; param: string | null; idIs: string }> = {
      a: { label: "A", view: "va", param: "a", idIs: "id" }, b: { label: "B", view: "vb", param: "b", idIs: "id" }, c: { label: "C", view: "vc", param: "c", idIs: "id" },
    };
    for (const [k, v] of Object.entries(over.defs ?? {})) Object.assign(defs[k], v);
    const paths = over.paths ?? { va: "/x/a", vb: "/x/b", vc: "/x/c" };
    return createEntityGraph({ defs, relations: over.relations ?? [{ a: "a", b: "b", ab: "B", ba: "A", via: "1" }, { a: "b", b: "c", ab: "C", ba: "B", via: "2" }], viewPath: (v: string) => paths[v] });
  };

  it("un graphe sain passe", () => { expect(checkEntityGraph(tiny())).toEqual([]); });
  it("vue inconnue", () => { expect(checkEntityGraph(tiny({ paths: { va: "/x/a", vb: "/x/b" } }))).toEqual(["c : la vue « vc » n'existe pas"]); });
  it("collision de paramètre sur la même vue", () => {
    expect(checkEntityGraph(tiny({ defs: { b: { view: "va", param: "a" } }, paths: { va: "/x/a", vc: "/x/c" } }))).toContain("b et a ouvrent va?a");
  });
  it("même paramètre dans deux vues : permis (conversation / support_thread de CLP)", () => {
    expect(checkEntityGraph(tiny({ defs: { b: { param: "a" } } }))).toEqual([]);
  });
  it("paramètre réservé", () => {
    expect(checkEntityGraph(tiny({ defs: { b: { param: "tab" } } }))).toEqual(["b : le paramètre « tab » est réservé à un état de vue"]);
    expect(checkEntityGraph(tiny({ defs: { b: { param: "mode" } } }), { reservedParams: ["mode"] })).toHaveLength(1);
  });
  it("relation vers une entité inconnue, vers elle-même, en double", () => {
    expect(checkEntityGraph(tiny({ relations: [{ a: "a", b: "z", ab: "Z", ba: "A", via: "1" }] })).join("\n")).toContain("« z » n'est pas une entité");
    expect(checkEntityGraph(tiny({ relations: [{ a: "a", b: "a", ab: "A", ba: "A", via: "1" }] })).join("\n")).toContain("ne se relie pas à elle-même");
    const dup = [{ a: "a", b: "b", ab: "B", ba: "A", via: "1" }, { a: "b", b: "a", ab: "A", ba: "B", via: "1" }, { a: "b", b: "c", ab: "C", ba: "B", via: "2" }];
    expect(checkEntityGraph(tiny({ relations: dup }))).toEqual(["relation en double : a|b|1"]);
  });
  it("entité orpheline et graphe non connexe", () => {
    const out = checkEntityGraph(tiny({ relations: [{ a: "a", b: "b", ab: "B", ba: "A", via: "1" }] }));
    expect(out).toContain("c : entité orpheline");
    expect(out).toContain("c : inaccessible depuis a");
    expect(checkEntityGraph(tiny({ relations: [{ a: "a", b: "b", ab: "B", ba: "A", via: "1" }, { a: "c", b: "c", ab: "C", ba: "C", via: "2" }] }))).toContain("c : inaccessible depuis a");
  });
  it("la racine du parcours est au choix", () => {
    expect(checkEntityGraph(tiny(), { root: "c" })).toEqual([]);
  });
});

describe("createEntityGraph — le moteur", () => {
  it("les entités sont celles des définitions, dans l'ordre ; isEntityKind les reconnaît", () => {
    expect(clpGraph.kinds).toEqual([...ENTITY_KINDS]);
    expect(clpGraph.isEntityKind("order")).toBe(true);
    expect(clpGraph.isEntityKind("commande")).toBe(false);
  });
  it("entityParams : les paramètres d'entité, sans doublon ni null", () => {
    const params = entityParams(clpGraph);
    expect(params).toContain("order");
    expect(params).toContain("thread");
    expect(new Set(params).size).toBe(params.length);
    expect(params).not.toContain(null);
  });
  it("le préfixe et la forme des chemins viennent de l'application", () => {
    const g = createEntityGraph({ defs: { order: { label: "Commande", view: "orders", param: "order", idIs: "id" } }, relations: [], viewPath: (v: string) => `/app/${v}` });
    expect(g.entityPath("order", "42")).toBe("/app/orders?order=42");
    expect(g.entityPath("order", "")).toBe("/app/orders");
  });
});
