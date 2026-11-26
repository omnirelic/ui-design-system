// Test miroir de web/src/admin/lib/query-params.test.ts de Chez la Petite (mêmes cas, mêmes assertions).
import { describe, it, expect } from "vitest";
import { withQueryParam } from "../src/web/state/query-params";

describe("withQueryParam", () => {
  it("pose le paramètre sans toucher aux autres (un tiroir ouvert ne doit pas effacer la sélection de la vue)", () => {
    expect(withQueryParam(new URLSearchParams("recipe=a"), "item", "b").toString()).toBe("recipe=a&item=b");
  });

  it("remplace une valeur existante", () => {
    expect(withQueryParam(new URLSearchParams("recipe=a"), "recipe", "c").toString()).toBe("recipe=c");
  });

  it("retire le paramètre pour une valeur vide ou nulle, et garde le reste", () => {
    expect(withQueryParam(new URLSearchParams("recipe=a&item=b"), "item", null).toString()).toBe("recipe=a");
    expect(withQueryParam(new URLSearchParams("recipe=a"), "recipe", "").toString()).toBe("");
  });

  it("ne modifie pas l'objet d'origine", () => {
    const prev = new URLSearchParams("recipe=a");
    withQueryParam(prev, "item", "b");
    expect(prev.toString()).toBe("recipe=a");
  });
});
