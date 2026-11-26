// Méta-spec du lot « numéro masqué » : (1) les composants n'ont ni couleur en dur (hexadécimal, rgb(), hsl()) ni emoji, toute couleur est un jeton du thème ;
// (2) règle « zéro numéro en clair » de Chez la Petite (web#1599/#1631) : aucun lien d'appel ni WhatsApp externe, et SEUL le module de révélation formate un numéro lisible.
// Exceptions motivées : `country-flag-data.tsx` (les couleurs y sont celles des drapeaux, des données comme `phone-flags.ts`) ; le noir translucide d'une ombre.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { codeLines } from "../src/web/entity-graph";

const read = (f: string) => readFileSync(join(__dirname, "../src/web", f), "utf8");
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const FUNC = /\b(rgb|rgba|hsl|hsla)\(/;
const SHADOW = /rgba\(0,\s*0,\s*0,/;
const EMOJI = /\p{Extended_Pictographic}/u;

const COMPONENTS = ["MaskedPhone.tsx", "PhoneRef.tsx", "AddressRef.tsx", "CountryFlag.tsx", "FloatingTooltip.tsx", "phone-css.ts", "phone-search-status.tsx", "phone-reveal.tsx"];
const NUMBER_DISPLAY = ["MaskedPhone.tsx", "PhoneRef.tsx", "AddressRef.tsx", "CountryFlag.tsx", "phone-css.ts", "phone-search-status.tsx", "phone-reveal.tsx", "phone-actions.ts"];

describe("numéro masqué — jetons de thème seulement", () => {
  for (const f of COMPONENTS) {
    it(`${f} : aucune couleur en dur, aucun emoji`, () => {
      const bad = codeLines(read(f)).flatMap((l, i) => (HEX.test(l) || (FUNC.test(l) && !SHADOW.test(l)) || EMOJI.test(l) ? [`${f}:${i + 1}  ${l.trim().slice(0, 80)}`] : []));
      expect(bad).toEqual([]);
    });
  }
  it("les couleurs de country-flag-data.tsx sont celles des drapeaux, pas du thème", () => {
    expect(codeLines(read("country-flag-data.tsx")).some((l) => HEX.test(l))).toBe(true);
    expect(codeLines(read("CountryFlag.tsx")).some((l) => HEX.test(l))).toBe(false);
  });
});

describe("numéro masqué — zéro numéro en clair", () => {
  for (const f of NUMBER_DISPLAY) {
    it(`${f} : aucun lien tel: ni wa.me, aucun href`, () => {
      const bad = codeLines(read(f)).flatMap((l, i) => (/\btel:|wa\.me|href=/.test(l) ? [`${f}:${i + 1}  ${l.trim().slice(0, 80)}`] : []));
      expect(bad).toEqual([]);
    });
  }
  it("seul le module de révélation formate un numéro lisible (formatPhoneGrouped)", () => {
    const users = NUMBER_DISPLAY.filter((f) => codeLines(read(f)).some((l) => /formatPhoneGrouped/.test(l)));
    expect(users).toEqual(["phone-reveal.tsx"]);
  });
  it("le numéro en clair n'est jamais mis en cache hors mémoire (aucun stockage navigateur dans la révélation)", () => {
    expect(codeLines(read("phone-reveal.tsx")).some((l) => /localStorage|sessionStorage|indexedDB/.test(l))).toBe(false);
  });
  it("aucune infobulle `title` sur le bouton de PhoneRef (le libellé « Conversation » est visible)", () => {
    expect(codeLines(read("PhoneRef.tsx")).some((l) => /\btitle=/.test(l))).toBe(false);
  });
});
