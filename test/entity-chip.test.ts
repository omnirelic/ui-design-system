import { describe, expect, it } from "vitest";
import { entityChipModel } from "../src/web/entity-chip";
import { ENTITY_DEFS } from "./fixtures/clp-entities";

// Tests de web/src/admin/ui/pastille/__tests__/entity-chip.test.ts de CLP : `kind` devient la définition injectée.
const d = ENTITY_DEFS;

describe("entityChipModel : ce que la pastille d'une entité à nom simple affiche", () => {
  it("toujours un disque de tête et le libellé en premier segment", () => {
    const { lead, segments } = entityChipModel({ def: d.vehicle, label: "Moto LT-123-AB" });
    expect(lead).toMatchObject({ kind: "icon", icon: "res-vehicles" });
    expect(segments).toMatchObject([{ role: "label", text: "Moto LT-123-AB", pos: 1 }]);
  });
  it("une personne a une photo (initiales à défaut) ; le plat a les couverts", () => {
    expect(entityChipModel({ def: d.courier, label: "Marc" }).lead.kind).toBe("photo");
    expect(entityChipModel({ def: d.item, label: "Poulet Pané" }).lead.icon).toBe("res-dish");
  });
  it("un article de banque devient produit intermédiaire quand on le dit", () => {
    expect(entityChipModel({ def: d.ingredient, label: "Porc bouilli", intermediate: true }).lead.icon).toBe("action-produce");
    expect(entityChipModel({ def: d.ingredient, label: "Tomate" }).lead.icon).toBe("res-ingredient");
  });
  it("le sac prend sa vraie couleur ; sans couleur, le disque reste neutre", () => {
    expect(entityChipModel({ def: d.bag, label: "Sac vert", swatch: "#2BB673" }).lead.tint).toBe("#2BB673");
    expect(entityChipModel({ def: d.bag, label: "Sac", swatch: null }).lead.tint).toBeUndefined();
  });
  it("la précision sans point d'état est une valeur, en gris par défaut", () => {
    const { segments } = entityChipModel({ def: d.vehicle, label: "Moto", sub: "2/4 commandes" });
    expect(segments.map(s => [s.role, s.text, s.tone])).toEqual([["label", "Moto", "default"], ["value", "2/4 commandes", "muted"]]);
  });
  it("avec un point d'état et une précision, c'est l'état : « point + mot »", () => {
    const { segments } = entityChipModel({ def: d.item, label: "Ndolé", sub: "Bas · 3 restants", subTone: "warning", dot: "#FF9800" });
    expect(segments.map(s => [s.role, s.dot, s.tone])).toEqual([["label", undefined, "default"], ["state", "#FF9800", "warn"]]);
  });
  it("un point d'état sans mot reste devant le libellé", () => {
    const { segments } = entityChipModel({ def: d.draft, label: "AB12CD", dot: "#4CAF50" });
    expect(segments).toHaveLength(1);
    expect(segments[0].dot).toBe("#4CAF50");
  });
  it("une précision vide ne crée pas de segment", () => {
    expect(entityChipModel({ def: d.store, label: "Chez Mama Lili", sub: "  " }).segments).toHaveLength(1);
  });
});
