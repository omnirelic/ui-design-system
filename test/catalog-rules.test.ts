// Méta-spec : le catalogue reste à jour par construction.
// Chaque export de valeur (racine et /phone) a une entrée de catalogue ou une exclusion motivée ; rien d'inventé ; version à jour.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CATALOG } from "../src/catalog";
// @ts-expect-error module .mjs partagé avec la génération
import { listValueExports } from "../scripts/catalog-exports.mjs";

const ROOT = join(__dirname, "..");
const exported = Object.keys(listValueExports(ROOT) as Record<string, string>);
const entryNames = CATALOG.entries.map((e) => e.name);
const excludedNames = CATALOG.excluded.map((e) => e.export);

describe("catalogue — méta-spec", () => {
  it("lit bien les exports publics", () => {
    expect(exported.length).toBeGreaterThan(60);
    expect(exported).toContain("Badge");
    expect(exported).toContain("PhoneInput");
  });
  it("chaque export public a une entrée de catalogue ou une exclusion motivée", () => {
    expect(exported.filter((n) => !entryNames.includes(n) && !excludedNames.includes(n))).toEqual([]);
  });
  it("une exclusion a un motif et ne double pas une entrée", () => {
    expect(CATALOG.excluded.filter((e) => e.reason.trim().length < 5)).toEqual([]);
    expect(excludedNames.filter((n) => entryNames.includes(n))).toEqual([]);
  });
  it("aucune entrée ni exclusion ne correspond à un export inexistant", () => {
    expect([...entryNames, ...excludedNames].filter((n) => !exported.includes(n))).toEqual([]);
  });
  it("pas de doublon", () => {
    expect(new Set(entryNames).size).toBe(entryNames.length);
  });
  it("chaque entrée a un groupe déclaré et une signature générée", () => {
    const groups = CATALOG.groups.map((g) => g.id);
    expect(CATALOG.entries.filter((e) => !groups.includes(e.group))).toEqual([]);
    expect(CATALOG.entries.filter((e) => !e.signature)).toEqual([]);
  });
  it("une entrée montre quelque chose (rendu ou exemples calculés)", () => {
    expect(CATALOG.entries.filter((e) => !e.render && !e.examples).map((e) => e.name)).toEqual([]);
  });
  it("la version du manifeste est celle de package.json", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    expect(CATALOG.version).toBe(pkg.version);
    expect(CATALOG.package).toBe(pkg.name);
  });
});
