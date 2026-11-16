import { describe, expect, it } from "vitest";
import { displayPhone, flagOf, formatNational, isValidPhone, parseStoredPhone, phoneCountries, searchCountries, toE164 } from "../src/web/phone";

describe("lecture des numéros déjà stockés", () => {
  it("« 641785415 » s'ouvre comme +237 641785415", () => {
    expect(parseStoredPhone("641785415")).toEqual({ country: "CM", national: "641785415" });
    expect(toE164("CM", "641785415")).toBe("+237641785415");
  });
  it("237641785415 sans « + » est reconnu", () => {
    expect(parseStoredPhone("237641785415").national).toBe("641785415");
  });
  it("E.164 d'un autre pays", () => {
    expect(parseStoredPhone("+33612345678")).toEqual({ country: "FR", national: "612345678" });
  });
  it("vide", () => {
    expect(parseStoredPhone("")).toEqual({ country: "CM", national: "" });
    expect(toE164("CM", "")).toBe("");
  });
});

describe("validation par pays", () => {
  it("valide un mobile camerounais, refuse un numéro trop court", () => {
    expect(isValidPhone("CM", "641785415")).toBe(true);
    expect(isValidPhone("CM", "6417")).toBe(false);
    expect(isValidPhone("FR", "612345678")).toBe(true);
  });
});

describe("affichage", () => {
  it("format international", () => {
    expect(displayPhone("641785415")).toMatch(/^\+237 6 ?41 ?78 ?54 ?15$/);
    expect(displayPhone("")).toBe("");
    expect(displayPhone("n'importe quoi")).toBe("n'importe quoi");
  });
  it("mise en forme à la frappe", () => {
    expect(formatNational("CM", "641785415").replace(/\s/g, "")).toBe("641785415");
  });
});

describe("pays", () => {
  it("Cameroun en tête, avec drapeau et indicatif", () => {
    const [first] = phoneCountries();
    expect(first.code).toBe("CM");
    expect(first.dial).toBe("+237");
    expect(first.flag).toBe(flagOf("CM"));
  });
  it("recherche par nom (sans accent), indicatif ou code", () => {
    const all = phoneCountries();
    expect(searchCountries(all, "camer").map(c => c.code)).toContain("CM");
    expect(searchCountries(all, "+237").map(c => c.code)).toContain("CM");
    expect(searchCountries(all, "cote d'ivoire").map(c => c.code)).toContain("CI");
    expect(searchCountries(all, "")).toBe(all);
  });
});
