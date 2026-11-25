import { describe, it, expect } from "vitest";
import { PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY, filterCountries, resolvePhone } from "../src/web/phone-intl";

const byIso = (iso: string) => PHONE_COUNTRIES.find(c => c.iso === iso)!;

describe("PHONE_COUNTRIES", () => {
  it("est triée par nom (ordre alphabétique français)", () => {
    const names = PHONE_COUNTRIES.map(c => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "fr")));
  });

  it("a le Cameroun par défaut", () => {
    expect(DEFAULT_PHONE_COUNTRY).toBe("CM");
    expect(byIso("CM").dial).toBe("237");
  });
});

describe("filterCountries", () => {
  it("renvoie tout sans requête", () => {
    expect(filterCountries(PHONE_COUNTRIES, "  ")).toHaveLength(PHONE_COUNTRIES.length);
  });

  it("filtre par nom sans tenir compte des accents ni de la casse", () => {
    expect(filterCountries(PHONE_COUNTRIES, "COTE").map(c => c.iso)).toEqual(["CI"]);
    expect(filterCountries(PHONE_COUNTRIES, "benin").map(c => c.iso)).toEqual(["BJ"]);
  });

  it("filtre par indicatif, avec ou sans +", () => {
    expect(filterCountries(PHONE_COUNTRIES, "+33").map(c => c.iso)).toContain("FR");
    expect(filterCountries(PHONE_COUNTRIES, "237").map(c => c.iso)).toEqual(["CM"]);
  });

  it("renvoie une liste vide si rien ne correspond", () => {
    expect(filterCountries(PHONE_COUNTRIES, "zzz")).toEqual([]);
  });
});

describe("resolvePhone", () => {
  it("Cameroun : 9 chiffres commençant par 6 → +237…", () => {
    expect(resolvePhone(byIso("CM"), "650 00 00 00")).toMatchObject({ e164: "+237650000000" });
    expect(resolvePhone(byIso("CM"), "6 50 00 00 0")).toMatchObject({ e164: null }); // 8 chiffres seulement
    expect(resolvePhone(byIso("CM"), "750000000")).toMatchObject({ e164: null });
  });

  it("retire le zéro de tête national et les séparateurs", () => {
    expect(resolvePhone(byIso("FR"), "06 12 34 56 78")).toMatchObject({ e164: "+33612345678" });
    expect(resolvePhone(byIso("FR"), "06.12-34 56 78").e164).toBe("+33612345678");
  });

  it("un numéro collé avec + change le pays", () => {
    const r = resolvePhone(byIso("CM"), "+33 6 12 34 56 78");
    expect(r.country.iso).toBe("FR");
    expect(r.e164).toBe("+33612345678");
  });

  it("un numéro collé avec 00 change aussi le pays", () => {
    const r = resolvePhone(byIso("CM"), "0033612345678");
    expect(r.country.iso).toBe("FR");
    expect(r.e164).toBe("+33612345678");
  });

  it("préfère l'indicatif le plus long (+243 RDC avant +24x)", () => {
    expect(resolvePhone(byIso("CM"), "+243812345678").country.iso).toBe("CD");
  });

  it("autre pays : 6 à 14 chiffres nationaux, sinon invalide", () => {
    expect(resolvePhone(byIso("FR"), "12345").e164).toBeNull();
    expect(resolvePhone(byIso("FR"), "1234567890123456").e164).toBeNull();
  });

  it("saisie vide → invalide", () => {
    expect(resolvePhone(byIso("CM"), "").e164).toBeNull();
  });
});

import { PHONE_CASES } from "./phone-parity-cases";
import { resolvePhone as resolveCase, PHONE_COUNTRIES as COUNTRIES } from "../src/web/phone-intl";

describe("resolvePhone — jeu de cas commun avec le serveur", () => {
  const cm = COUNTRIES.find(c => c.iso === "CM")!;
  for (const c of PHONE_CASES) {
    it(`${JSON.stringify(c.input)} -> ${c.e164}`, () => {
      expect(resolveCase(cm, c.input).e164).toBe(c.e164);
    });
  }
});

describe("liste de pays de Chez la Petite : reprise à l'identique", () => {
  it("25 pays, mêmes indicatifs", () => {
    expect(PHONE_COUNTRIES).toHaveLength(25);
    const dials = Object.fromEntries(PHONE_COUNTRIES.map(c => [c.iso, c.dial]));
    expect(dials).toMatchObject({ CM: "237", FR: "33", CD: "243", CG: "242", US: "1", CA: "1", GQ: "240", CI: "225" });
  });
  it("ancien numéro camerounais à 8 chiffres : ni accepté ni réparé (spec #105)", () => {
    const cm = PHONE_COUNTRIES.find(c => c.iso === "CM")!;
    expect(resolvePhone(cm, "+23790397489").e164).toBeNull();
    expect(resolvePhone(cm, "90397489").e164).toBeNull();
  });
});
