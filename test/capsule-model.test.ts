import { describe, expect, it } from "vitest";
import { MAX_SEGMENTS, arrangeSegments, leadFor } from "../src/web/capsule-model";
import { ENTITY_DEFS, ENTITY_KINDS } from "./fixtures/clp-entities";

// Tests de web/src/admin/ui/pastille/__tests__/pastille-model.test.ts de CLP. Non repris : segmentsText, QUALIFIERS, clientIdentity, DIMENSIONS (propres à CLP).
const lead = (kind: (typeof ENTITY_KINDS)[number], opts?: Parameters<typeof leadFor>[1]) => leadFor(ENTITY_DEFS[kind], opts);

describe("arrangeSegments : la grammaire Libellé | État | Valeur | Quand", () => {
  it("range les segments dans l'ordre de la grammaire, quel que soit l'ordre d'entrée", () => {
    const out = arrangeSegments([
      { role: "when", text: "hier" },
      { role: "value", money: 19000 },
      { role: "label", text: "#0765" },
      { role: "state", text: "En attente" },
    ]);
    expect(out.map(s => s.role)).toEqual(["label", "state", "value", "when"]);
  });

  it("une donnée absente est un segment absent, jamais un « — » ni un zéro inventé", () => {
    const out = arrangeSegments([
      { role: "label", text: "#0765" },
      { role: "state", text: "   " },
      { role: "value", money: null },
      { role: "value", text: undefined },
      { role: "when", text: null },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].text).toBe("#0765");
  });

  it("un montant nul reste un segment (livraison offerte) ; un montant masqué disparaît", () => {
    const out = arrangeSegments([
      { role: "label", text: "Livraison" },
      { role: "value", money: 0 },
      { role: "value", money: 19000, hidden: true },
    ]);
    expect(out.map(s => s.money?.value ?? s.text)).toEqual(["Livraison", 0]);
  });

  it("ne dépasse jamais 4 segments : un seul libellé, un seul état, un seul « quand »", () => {
    const out = arrangeSegments([
      { role: "label", text: "a" }, { role: "label", text: "b" },
      { role: "state", text: "c" }, { role: "state", text: "d" },
      { role: "value", text: "e" }, { role: "value", text: "f" }, { role: "value", text: "g" },
      { role: "when", text: "h" }, { role: "when", text: "i" },
    ]);
    expect(out.length).toBeLessThanOrEqual(MAX_SEGMENTS);
    expect(out.filter(s => s.role === "label")).toHaveLength(1);
    expect(out.filter(s => s.role === "state")).toHaveLength(1);
    expect(out.filter(s => s.role === "when")).toHaveLength(1);
  });

  it("sans état, la valeur peut occuper deux places (lieu | distance | frais | durée) ; avec un état, une seule", () => {
    const noState = arrangeSegments([{ role: "label", text: "Domicile" }, { role: "value", text: "1,2 km" }, { role: "value", money: 1500 }, { role: "when", text: "≈ 25 min" }]);
    expect(noState).toHaveLength(4);
    const withState = arrangeSegments([{ role: "label", text: "Domicile" }, { role: "state", text: "Par défaut" }, { role: "value", text: "1,2 km" }, { role: "value", money: 1500 }]);
    expect(withState.filter(s => s.role === "value")).toHaveLength(1);
  });

  it("une valeur déjà composée (numéro masqué) est un segment ; absente, pas de segment", () => {
    const withNode = arrangeSegments([{ role: "label", text: "Joel" }, { role: "value", node: "••• 12" }]);
    expect(withNode.map(s => s.role)).toEqual(["label", "value"]);
    expect(withNode[1].node).toBe("••• 12");
    expect(arrangeSegments([{ role: "label", text: "Joel" }, { role: "value", node: null }])).toHaveLength(1);
  });

  it("garde la position (1 à 4) de chaque segment : la base des paliers de compacité", () => {
    const out = arrangeSegments([{ role: "label", text: "a" }, { role: "value", text: "b" }, { role: "when", text: "c" }]);
    expect(out.map(s => s.pos)).toEqual([1, 2, 3]);
  });

  it("donne une teinte par défaut : l'argent en vert, le reste neutre ; l'or et les alertes se demandent", () => {
    const [label, money, gold] = arrangeSegments([{ role: "label", text: "x" }, { role: "value", money: 100 }, { role: "value", text: "×4", tone: "gold" }]);
    expect([label.tone, money.tone, gold.tone]).toEqual(["default", "money", "gold"]);
  });
});

describe("leadFor : le disque de tête de chaque entité", () => {
  it("couvre toutes les entités du graphe", () => {
    for (const kind of ENTITY_KINDS) expect(lead(kind).icon, kind).toBeTruthy();
  });
  it("une personne montre sa photo, une chose son icône", () => {
    for (const kind of ["client", "courier", "agent", "employee", "admin_user", "conversation"] as const) expect(lead(kind).kind, kind).toBe("photo");
    for (const kind of ["order", "vehicle", "bag", "item", "kitchen", "store", "promo"] as const) expect(lead(kind).kind, kind).toBe("icon");
  });
  it("le sac prend sa vraie couleur", () => {
    expect(lead("bag", { color: "#2BB673" })).toMatchObject({ kind: "icon", tint: "#2BB673" });
    expect(lead("bag").tint).toBeUndefined();
  });
  it("plat, ingrédient et produit intermédiaire ont trois icônes différentes", () => {
    const icons = [lead("item").icon, lead("ingredient").icon, lead("ingredient", { intermediate: true }).icon];
    expect(icons).toEqual(["res-dish", "res-ingredient", "action-produce"]); // CLP : res-intermediate (icône maison absente du registre du paquet)
    expect(new Set(icons).size).toBe(3);
  });
  it("un article de banque (produit intermédiaire) prend l'icône de la viande, un plat reste un plat", () => {
    expect(lead("item", { intermediate: true }).icon).toBe("action-produce");
    expect(lead("item", { intermediate: false }).icon).toBe("res-dish");
  });
});


describe("leadFor : lu dans la définition injectée", () => {
  it("une conversation du support est une personne pour la casse du nom, mais son disque est l'icône (photo: false)", () => {
    expect(ENTITY_DEFS.support_thread.person).toBe(true);
    expect(lead("support_thread")).toEqual({ kind: "icon", icon: "res-support" });
  });
  it("sans icône dans la définition : l'icône de repli", () => {
    expect(leadFor({})).toEqual({ kind: "icon", icon: "ui-tag" });
    expect(leadFor({ person: true }).kind).toBe("photo");
    expect(leadFor({ person: true, photo: false, icon: "res-support" }).kind).toBe("icon");
  });
});
