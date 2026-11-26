// Parité resolvePhone (PhoneField, client) / parseInternationalPhone (kit @omnirelic/kit, serveur) sur les cas communs.
// Le kit est privé et ce dépôt public : `kit` est la sortie figée de parseInternationalPhone (@omnirelic/kit 0.1.0-alpha.17,
// source packages/kit/src/phone/international-e164.ts d'engine à 92ccadf), relevée en l'exécutant sur chaque saisie.
// Un écart de comportement change une ligne ici : il est voulu et daté, jamais silencieux. Pays sélectionné : Cameroun.
import { describe, expect, it } from "vitest";
import { PHONE_COUNTRIES, resolvePhone } from "../src/web/phone-intl";
import { PHONE_CASES } from "./phone-parity-cases";

const cm = PHONE_COUNTRIES.find((c) => c.iso === "CM")!;
const client = (input: string) => resolvePhone(cm, input).e164;

interface Row { input: string; kit: string | null; client: string | null; gap?: string }

const ROWS: Row[] = [
  // Identiques : cas communs.
  { input: "699123456", kit: "+237699123456", client: "+237699123456" },
  { input: "6 99 12 34 56", kit: "+237699123456", client: "+237699123456" },
  { input: "+237699123456", kit: "+237699123456", client: "+237699123456" },
  { input: "+237 699 12 34 56", kit: "+237699123456", client: "+237699123456" },
  { input: "00237699123456", kit: "+237699123456", client: "+237699123456" },
  { input: "+33612345678", kit: "+33612345678", client: "+33612345678" },
  { input: "0033 6 12 34 56 78", kit: "+33612345678", client: "+33612345678" },
  { input: "0049 171 1234567", kit: "+491711234567", client: "+491711234567" },
  { input: "+1 415 555 2671", kit: "+14155552671", client: "+14155552671" },
  { input: "+212 6 12 34 56 78", kit: "+212612345678", client: "+212612345678" },
  { input: "90397489", kit: null, client: null },
  { input: "12", kit: null, client: null },
  { input: "12ab", kit: null, client: null },
  { input: "", kit: null, client: null },
  { input: "+99912", kit: null, client: null },
  { input: "+1234", kit: null, client: null },
  { input: "+237 5 90 39 74 89", kit: null, client: null },
  // Écarts connus : le kit est plus large (serveur) ou garde le 0 local.
  { input: "+23790397489", kit: "+237690397489", client: null, gap: "kit : ancien numéro à 8 chiffres remonté en 9 ; champ : refusé" },
  { input: "23790397489", kit: "+237690397489", client: null, gap: "idem, sans +" },
  { input: "237699123456", kit: "+237699123456", client: null, gap: "kit : 237 collé nu accepté ; champ : refusé (cas commun PHONE_CASES)" },
  { input: "+237233420000", kit: "+237233420000", client: null, gap: "kit : Cameroun préfixe 2 accepté ; champ : mobile 6 seulement" },
  { input: "(+237) 690-39-74-89", kit: "+237690397489", client: null, gap: "kit : parenthèses et tirets tolérés ; champ : « + » doit être en tête" },
  { input: "0699123456", kit: null, client: "+237699123456", gap: "champ : 0 local retiré (saisie confortable) ; kit : indicatif exigé" },
  { input: "+225 07 12 34 56 78", kit: "+2250712345678", client: "+225712345678", gap: "champ : 0 local retiré après l'indicatif ; kit : conservé" },
  { input: "+242061234567", kit: "+242061234567", client: "+24261234567", gap: "idem (Congo)" },
];

describe("parité resolvePhone / parseInternationalPhone", () => {
  it.each(ROWS)("champ : %j", (row) => { expect(client(row.input)).toBe(row.client); });

  it("les lignes sans écart donnent le même E.164 des deux côtés", () => {
    const same = ROWS.filter((r) => !r.gap);
    expect(same.length).toBeGreaterThanOrEqual(17);
    for (const r of same) expect(client(r.input), r.input).toBe(r.kit);
  });

  it("chaque écart est réel et nommé : sinon il faut le retirer de la liste", () => {
    for (const r of ROWS.filter((x) => x.gap)) expect(client(r.input), r.input).not.toBe(r.kit);
  });

  it("tous les cas communs de PHONE_CASES sont couverts, sans écart sauf ceux nommés", () => {
    for (const c of PHONE_CASES.filter((x) => !x.clientOnly)) {
      const row = ROWS.find((r) => r.input === c.input);
      expect(row, `cas absent de la table : ${c.input}`).toBeDefined();
      expect(client(c.input)).toBe(c.e164);
      if (!row!.gap) expect(row!.kit).toBe(c.e164);
    }
  });
});
