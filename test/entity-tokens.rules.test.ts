// Méta-spec : les composants d'entités n'ont ni couleur en dur (hexadécimal, rgb(), hsl()) ni emoji ; toute couleur est un jeton du thème.
// Exceptions motivées : legible-color.ts (calcul de contraste sur des valeurs « #hex » reçues en donnée, la couleur réelle d'un sac) ; le noir translucide d'une ombre (comme VEIL de controls.tsx).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { codeLines } from "../src/web/entity-graph";

const FILES = ["entity-css.ts", "entity-text.tsx", "entity-avatar.tsx", "entity-context.tsx", "entity-chip.ts", "capsule-model.ts", "LeadDisc.tsx", "PastilleBody.tsx", "PastilleCapsule.tsx", "HoverCard.tsx", "RefParts.tsx", "EntityRef.tsx"];
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const FUNC = /\b(rgb|rgba|hsl|hsla)\(/;
const SHADOW = /rgba\(0,\s*0,\s*0,/;
const EMOJI = /\p{Extended_Pictographic}/u;

describe("composants d'entités — jetons de thème seulement", () => {
  for (const f of FILES) {
    it(`${f} : aucune couleur en dur, aucun emoji`, () => {
      const src = readFileSync(join(__dirname, "../src/web", f), "utf8");
      const bad = codeLines(src).flatMap((l, i) => (HEX.test(l) || (FUNC.test(l) && !SHADOW.test(l)) || EMOJI.test(l) ? [`${f}:${i + 1}  ${l.trim().slice(0, 80)}`] : []));
      expect(bad).toEqual([]);
    });
  }
  it("le détecteur reconnaît un hexadécimal et ignore un commentaire", () => {
    expect(codeLines("const a = '#C4922A';").some((l) => HEX.test(l))).toBe(true);
    expect(codeLines("// #C4922A\nconst a = 1;").some((l) => HEX.test(l))).toBe(false);
  });
});
