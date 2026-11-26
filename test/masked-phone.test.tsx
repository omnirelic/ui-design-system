// Tests miroir de MaskedPhone.test.tsx, ui/flags/__tests__/CountryFlag.test.tsx et address-ref.test.tsx de Chez la Petite (rendu serveur ; interactions : masked-phone-dom.test.tsx).
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AddressQuoteProvider, AddressRef, type AddressQuoteTarget, type RoadQuote } from "../src/web/AddressRef";
import { CountryFlag, FLAG_DIALS } from "../src/web/CountryFlag";
import { MaskedPhone } from "../src/web/MaskedPhone";
import { PhoneRevealProvider, createPhoneReveal } from "../src/web/phone-reveal";
import { PhoneRef } from "../src/web/PhoneRef";

describe("MaskedPhone — drapeau, opérateur, 2 derniers chiffres", () => {
  const html = (el: React.ReactElement) => renderToStaticMarkup(el);
  it("numéro camerounais Orange : drapeau du Cameroun, ORANGE, 2 derniers chiffres, plus d'indicatif écrit", () => {
    const out = html(<MaskedPhone phone="+237690000011" />);
    expect(out).toContain('aria-label="Cameroun"');
    expect(out).toContain("ORANGE");
    expect(out).toContain(">11<");
    expect(out).not.toContain("+237");
    expect(out).not.toContain("6900");
  });
  it("numéro camerounais MTN", () => {
    const out = html(<MaskedPhone phone="+237677000019" />);
    expect(out).toContain('aria-label="Cameroun"');
    expect(out).toContain("MTN");
    expect(out).toContain(">19<");
  });
  it("autre pays dont on dessine le drapeau : son drapeau, INCONNU, pas de drapeau du Cameroun", () => {
    const out = html(<MaskedPhone phone="+33600000078" />);
    expect(out).toContain('aria-label="France"');
    expect(out).toContain("INCONNU");
    expect(out).toContain(">78<");
    expect(out).not.toContain("Cameroun");
    expect(out).not.toContain("+33");
  });
  it("pays sans drapeau dessiné (ou indicatif partagé comme +1) : un globe, jamais un faux drapeau", () => {
    const out = html(<MaskedPhone phone="+14155550123" />);
    expect(out).not.toContain('aria-label="Cameroun"');
    expect(out).toContain("INCONNU");
    expect(out).toContain(">23<");
    expect(out).not.toMatch(/aria-label="(France|Belgique|Suisse)"/);
  });
  it("déjà masqué par le serveur (nouveau format) : même rendu qu'un numéro en clair", () => {
    expect(html(<MaskedPhone phone="+237 ORANGE 11" />)).toBe(html(<MaskedPhone phone="+237690000011" />));
  });
  it("ancien format : le drapeau et les points, pas d'opérateur inventé", () => {
    const out = html(<MaskedPhone phone="+237•••••••11" />);
    expect(out).toContain('aria-label="Cameroun"');
    expect(out).toContain("••• •• •• 11");
    expect(out).not.toMatch(/ORANGE|MTN|INCONNU/);
  });
  it("drapeau éteint : l'indicatif s'écrit, plus de drapeau", () => {
    const out = html(<MaskedPhone phone="+237690000011" flag={false} />);
    expect(out).toContain("+237 ORANGE 11");
    expect(out).not.toContain("Cameroun");
  });
  it("sans numéro : rien", () => {
    expect(html(<MaskedPhone phone={null} />)).toBe("");
  });
  it("couleurs d'opérateur : trois classes, aucune couleur en ligne", () => {
    for (const [p, c] of [["+237690000011", "orange"], ["+237677000019", "mtn"], ["+33600000078", "inconnu"]]) expect(html(<MaskedPhone phone={p} />)).toContain(`omni-masked-op--${c}`);
    expect(html(<MaskedPhone phone="+237690000011" />)).not.toMatch(/style="[^"]*color/);
  });
});

describe("MaskedPhone — révélation superadmin", () => {
  it("avec un profil, le rendu initial reste masqué et ne déclenche aucun appel", () => {
    let calls = 0;
    const reveal = createPhoneReveal({ transport: async () => { calls++; return null; } });
    reveal.setViewer({ role: "superadmin" });
    const out = renderToStaticMarkup(<PhoneRevealProvider value={reveal}><MaskedPhone phone="+237690000011" profileId="p1" /></PhoneRevealProvider>);
    expect(calls).toBe(0);
    expect(out).toContain("ORANGE");
    expect(out).not.toContain("6900");
    expect(out).not.toContain("690 00");
  });
  it("hors superadmin, avec ou sans profil : même rendu qu'avant", () => {
    const reveal = createPhoneReveal({ transport: async () => null });
    reveal.setViewer({ role: "admin" });
    const withProfile = renderToStaticMarkup(<PhoneRevealProvider value={reveal}><MaskedPhone phone="+237690000011" profileId="p1" /></PhoneRevealProvider>);
    expect(withProfile).toBe(renderToStaticMarkup(<MaskedPhone phone="+237690000011" />));
  });
});

describe("CountryFlag — le drapeau d'un indicatif, en SVG", () => {
  it("+237 : le drapeau du Cameroun", () => {
    expect(renderToStaticMarkup(<CountryFlag dial="+237" />)).toContain('aria-label="Cameroun"');
    expect(renderToStaticMarkup(<CountryFlag dial="237" />)).toContain('aria-label="Cameroun"');
  });
  it("un pays dessiné : son drapeau, nommé pour les lecteurs d'écran", () => {
    expect(renderToStaticMarkup(<CountryFlag dial="+33" />)).toContain('aria-label="France"');
    expect(renderToStaticMarkup(<CountryFlag dial="+225" />)).toContain('aria-label="Côte d&#x27;Ivoire"');
    expect(renderToStaticMarkup(<CountryFlag dial="+44" />)).toContain('aria-label="Royaume-Uni"');
  });
  it("chaque drapeau dessiné est un SVG 3:2 avec son propre masque", () => {
    expect(FLAG_DIALS).toHaveLength(13);
    for (const dial of FLAG_DIALS) {
      const out = renderToStaticMarkup(<CountryFlag dial={`+${dial}`} />);
      expect(out).toContain('viewBox="0 0 30 20"');
      expect(out).toContain(`omni-flag-${dial}`);
    }
  });
  it("indicatif partagé (+1) ou sans drapeau dessiné : un globe neutre, jamais un faux drapeau", () => {
    for (const dial of ["+1", "+86", "+971"]) {
      const out = renderToStaticMarkup(<CountryFlag dial={dial} />);
      expect(out).not.toContain("aria-label=");
      expect(out).toContain("<svg");
    }
  });
  it("sans indicatif : rien", () => {
    expect(renderToStaticMarkup(<CountryFlag dial="" />)).toBe("");
  });
});

describe("PhoneRef — rendu serveur", () => {
  it("numéro masqué ou inexploitable : du texte, ni bouton ni lien", () => {
    const out = renderToStaticMarkup(<PhoneRef phone="+237 6•• •• 12 34" onOpen={() => undefined} />);
    expect(out).not.toContain("<button");
    expect(out).not.toContain("<a");
  });
  it("sans fonction d'ouverture : du texte", () => {
    expect(renderToStaticMarkup(<PhoneRef phone="+237691000019" />)).not.toContain("<button");
  });
});

describe("AddressRef — lieu | distance | frais | durée", () => {
  const road: { result: { quote: RoadQuote | null; loading: boolean }; target: AddressQuoteTarget | undefined } = { result: { quote: null, loading: false }, target: undefined };
  const quote: RoadQuote = { fee: 1000, distanceKm: 3.4, etaMin: 17, outOfRange: false };
  const html = (el: React.ReactElement) => renderToStaticMarkup(<AddressQuoteProvider useRoadQuote={(t) => { road.target = t; return road.result; }}>{el}</AddressQuoteProvider>);

  it("avec devis : le lieu, la distance, le frais et la durée estimée", () => {
    road.result = { quote, loading: false };
    const out = html(<AddressRef address={{ neighborhoodId: "bona", label: "Bonamoussadi" }} />);
    for (const t of ["Bonamoussadi", "3,4 km", "≈ 17 min"]) expect(out).toContain(t);
    expect(out).toMatch(/1\s000\sXAF/);
    expect(out).toContain("omni-pst-lead");
    expect(road.target).toEqual({ neighborhoodId: "bona" });
  });
  it("calcul en cours : le lieu seul et des points de chargement, jamais un frais inventé", () => {
    road.result = { quote: null, loading: true };
    const out = html(<AddressRef address={{ lat: 4.05, lng: 9.7, label: "Position GPS (4.05, 9.7)" }} />);
    expect(out).toContain("Position GPS");
    expect(out).toContain("···");
    expect(out).not.toContain("XAF");
  });
  it("hors zone : « Hors zone » et la distance, en rouge, sans frais", () => {
    road.result = { quote: { ...quote, distanceKm: 16.2, outOfRange: true }, loading: false };
    const out = html(<AddressRef address={{ neighborhoodId: "akwa", label: "Akwa" }} />);
    expect(out).toContain("omni-pst-q--red");
    expect(out).toContain("Hors zone");
    expect(out).toContain("16,2 km");
    expect(out).not.toContain("XAF");
  });
  it("quartier sans devis (serveur injoignable) : le lieu seul", () => {
    road.result = { quote: null, loading: false };
    const out = html(<AddressRef address={{ neighborhoodId: "akwa", label: "Akwa" }} />);
    expect(out).toContain("Akwa");
    expect(out).not.toContain("km");
  });
  it("indications seules : pas de devis demandé, les indications en infobulle", () => {
    road.result = { quote: null, loading: false };
    const out = html(<AddressRef address={{ instructions: "Devant la pharmacie" }} />);
    expect(road.target).toBeNull();
    expect(out).toContain("Indications");
    expect(out).toContain('title="Devant la pharmacie"');
  });
  it("adresse par défaut : repérée par l'étoile (aria) ; sinon l'épingle", () => {
    road.result = { quote: null, loading: false };
    expect(html(<AddressRef address={{ neighborhoodId: "akwa", label: "Akwa" }} isDefault />)).toContain("Adresse par défaut");
    expect(html(<AddressRef address={{ neighborhoodId: "akwa", label: "Akwa" }} />)).not.toContain("Adresse par défaut");
  });
  it("durée absente (0) : le segment disparaît ; frais figé d'une commande : il l'emporte sur le devis", () => {
    road.result = { quote: { ...quote, etaMin: 0 }, loading: false };
    expect(html(<AddressRef address={{ neighborhoodId: "bona", label: "Bonamoussadi" }} />)).not.toContain("≈");
    road.result = { quote, loading: false };
    expect(html(<AddressRef address={{ neighborhoodId: "bona", label: "Bonamoussadi" }} fee={2500} />)).toMatch(/2\s500\sXAF/);
  });
  it("adresse enregistrée « Ma localisation: X » : X seul", () => {
    road.result = { quote: null, loading: false };
    const out = html(<AddressRef address={{ label: "Ma localisation: Bonamoussadi", lat: 4.05, lng: 9.7 }} />);
    expect(out).toContain("Bonamoussadi");
    expect(out).not.toContain("Ma localisation");
  });
  it("sans fournisseur de devis : jamais de devis, le lieu seul", () => {
    const out = renderToStaticMarkup(<AddressRef address={{ neighborhoodId: "akwa", label: "Akwa" }} />);
    expect(out).toContain("Akwa");
    expect(out).not.toContain("km");
  });
});
