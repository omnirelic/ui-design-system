import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PhoneField } from "../src/web/PhoneField";
import { PHONE_COUNTRIES } from "../src/web/phone-intl";
import { PHONE_FLAGS } from "../src/web/phone-flags";

const cm = PHONE_COUNTRIES.find(c => c.iso === "CM")!;
const fr = PHONE_COUNTRIES.find(c => c.iso === "FR")!;
const noop = () => {};
const html = (p: Partial<Parameters<typeof PhoneField>[0]> = {}) =>
  renderToStaticMarkup(<PhoneField country={cm} value="" onCountry={noop} onChange={noop} {...p} />);

describe("PhoneField — mêmes props, états et tailles que Chez la Petite", () => {
  it("bouton d'indicatif : libellé accessible, drapeau 24×18, +NNN, liste fermée", () => {
    const h = html();
    expect(h).toContain('aria-label="Indicatif : Cameroun +237"');
    expect(h).toContain('aria-haspopup="listbox"');
    expect(h).toContain('aria-expanded="false"');
    expect(h).toContain('width="24" height="18"');
    expect(h).toContain("+237");
    expect(h).not.toContain('role="listbox"');
  });
  it("champ numéro : clavier tel, tel-national, libellé « Numéro WhatsApp »", () => {
    const h = html();
    expect(h).toContain('inputMode="tel"');
    expect(h).toContain('autoComplete="tel-national"');
    expect(h).toContain('aria-label="Numéro WhatsApp"');
  });
  it("placeholder : « 6 50 00 00 00 » au Cameroun, « Numéro » ailleurs", () => {
    expect(html()).toContain('placeholder="6 50 00 00 00"');
    expect(html({ country: fr })).toContain('placeholder="Numéro"');
  });
  it("valeur affichée telle quelle (le parent la tient)", () => {
    expect(html({ value: "6 99 12" })).toContain('value="6 99 12"');
  });
  it("invalide : aria-invalid, aria-describedby = errorId, bordure d'erreur ; valide : rien de tout ça", () => {
    const bad = html({ invalid: true, errorId: "err-1" });
    expect(bad).toContain('aria-invalid="true"');
    expect(bad).toContain('aria-describedby="err-1"');
    expect(bad).toContain("#e66");
    const ok = html({ errorId: "err-1" });
    expect(ok).not.toContain("aria-invalid");
    expect(ok).not.toContain("aria-describedby");
    expect(ok).not.toContain("#e66");
  });
  it("autoFocus transmis sans erreur de rendu", () => {
    expect(() => html({ autoFocus: true })).not.toThrow();
  });
  it("hauteur de liste 130, ouverture vers le haut : constantes du composant", async () => {
    const src = (await import("node:fs")).readFileSync(new URL("../src/web/PhoneField.tsx", import.meta.url), "utf8");
    expect(src).toContain("maxHeight: 130");
    expect(src).toContain('bottom: "calc(100% + 6px)"');
  });
});

describe("drapeaux intégrés", () => {
  it("un drapeau par pays de la liste, en data URI SVG, pas d'emoji", () => {
    for (const c of PHONE_COUNTRIES) expect(PHONE_FLAGS[c.iso.toLowerCase()], c.iso).toMatch(/^data:image\/svg\+xml,%3Csvg/);
    expect(Object.keys(PHONE_FLAGS)).toHaveLength(PHONE_COUNTRIES.length);
  });
});
