import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import { EntityRef, EntityRefProvider, entityRefFor } from "../src/web/entry-entity";
import { clpGraph, entityPath } from "./fixtures/clp-entities";

// Tests de EntityRef de CLP (web/src/admin/ui/entity/__tests__/entity-refs.test.tsx, item-pill.test.tsx), rejoués avec le graphe de CLP injecté.
// Non repris : OrderRef, ClientRef, TransactionRef, DraftRef, SupportThreadRef, ConversationRef… (données et vues propres à CLP : l'application les écrit autour d'EntityRef).
// La carte au survol est rendue dans un portail : ici son contenu est posé en ligne (test/helpers/inline-hover-card.tsx).
vi.mock("../src/web/HoverCard", async () => ({ ...(await import("./helpers/inline-hover-card")), Z_CARD: 1400 }));
import { triggerOnly } from "./helpers/inline-hover-card";

const html = (el: ReactElement) => renderToStaticMarkup(<MemoryRouter><EntityRefProvider value={{ graph: clpGraph }}>{el}</EntityRefProvider></MemoryRouter>);
const CourierRef = entityRefFor("courier");
const VehicleRef = entityRefFor("vehicle");
const ItemRef = entityRefFor("item");
const AgentRef = entityRefFor("agent", { avatar: {} });

describe("pastille d'entité — la grammaire commune", () => {
  it("toute pastille commence par un disque de tête : la photo d'une personne, l'icône du type pour une chose", () => {
    expect(html(<CourierRef id="c1" label="Bryan" />)).toContain("omni-pst");
    expect(html(<EntityRef kind="vehicle" id="v1" label="Moto" />)).toContain("omni-pst-lead");
    expect(html(<EntityRef kind="vehicle" id="v1" label="Moto" />)).not.toContain("omni-ref-main");
  });
  it("le plat a les couverts, l'article de banque la carotte, le produit intermédiaire une troisième icône", () => {
    const icons = [<EntityRef kind="item" id="1" label="Poulet" />, <EntityRef kind="ingredient" id="2" label="Tomate" />, <EntityRef kind="ingredient" id="3" label="Porc bouilli" intermediate />].map(el => html(el).match(/<svg[^>]*>.*?<\/svg>/s)![0]);
    expect(new Set(icons).size).toBe(3);
  });
  it("aucune infobulle en écho sur la pastille", () => {
    expect(html(<EntityRef kind="vehicle" id="v1" label="Moto" />)).not.toMatch(/\btitle=/);
  });
  it("sans fournisseur : une erreur claire ; une entité hors graphe aussi", () => {
    expect(() => renderToStaticMarkup(<MemoryRouter><EntityRef kind="vehicle" id="v1" label="Moto" /></MemoryRouter>)).toThrow(/EntityRefProvider/);
    expect(() => html(<EntityRef kind="inconnue" id="1" label="x" />)).toThrow(/n'est pas une entité du graphe/);
  });
});

describe("EntityRef et dérivés", () => {
  it("livreur : lien vers sa fiche, précision à côté du nom", () => {
    const out = html(<CourierRef id={12} label="Marc" sub="Moto · LT-123-AB" />);
    expect(out).toContain('href="/admin/delivery/couriers?courier=12"');
    expect(out).toContain("Moto · LT-123-AB");
  });
  it("sans identifiant : texte simple", () => {
    expect(html(<EntityRef kind="vehicle" id={null} label="LT-123-AB" />)).not.toContain("href");
  });
  it("row et card", () => {
    expect(html(<EntityRef kind="item" id="p1" label="Poulet braisé" variant="row" sub="Grillades" />)).toContain("Grillades");
    expect(html(<EntityRef kind="item" id="p1" label="Poulet braisé" variant="card" />)).toContain("/admin/catalog/menu?item=p1");
  });
  it("le lien est celui de entityPath (une seule fabrique)", () => {
    expect(html(<VehicleRef id="v1" label="Moto" variant="num" />)).toContain(`href="${entityPath("vehicle", "v1")}"`);
  });
  it("chip : menu d'actions (ouvrir, copier le nom) ; noMenu et linkless les retirent", () => {
    const out = html(<VehicleRef id="v1" label="Moto" />);
    expect(out).toContain("Ouvrir : véhicule");
    expect(out).toContain("Copier le nom");
    expect(html(<VehicleRef id="v1" label="Moto" noMenu />)).not.toContain("omni-ref-pop");
    const bare = html(<VehicleRef id="v1" label="Moto" linkless />);
    expect(bare).not.toContain("href");
    expect(bare).not.toContain("omni-ref-pop");
  });
  it("compact : disque + libellé ; point : le disque seul avec son point d'état", () => {
    expect(triggerOnly(html(<VehicleRef id="v1" label="Moto" variant="compact" />))).toContain("omni-pst--compact");
    expect(triggerOnly(html(<VehicleRef id="v1" label="Moto" variant="point" dot="#4ADE80" />))).toContain("omni-pst--point");
  });
});

describe("detail — l'en-tête d'un tiroir : on est déjà dans la fiche, donc ni lien ni menu", () => {
  it("entité simple : nom, précision, point d'état, badge", () => {
    const out = html(<CourierRef id={12} label="Marc" sub="Moto · LT-123-AB" dot="#4ADE80" badge={{ label: "En service", color: "green" }} variant="detail" />);
    for (const t of ["Marc", "Moto · LT-123-AB", "En service", "omni-ref-detail"]) expect(out).toContain(t);
    expect(out).not.toContain("href");
    expect(out).not.toContain("omni-ref-pop");
  });
  it("`extra` : les contrôles de la vue sous l'identité", () => {
    expect(html(<CourierRef id={12} label="Marc" variant="detail" extra={<span>Changer la photo</span>} />)).toContain("Changer la photo");
  });
});

describe("EntityRef num — option quiet", () => {
  it("quiet : même lien profond, rendu atténué (mention dans un texte secondaire)", () => {
    const loud = html(<EntityRef kind="item" id="p1" label="Okok sucré" variant="num" />);
    const quiet = html(<EntityRef kind="item" id="p1" label="Okok sucré" variant="num" quiet />);
    expect(quiet).toContain('href="/admin/catalog/menu?item=p1"');
    expect(loud).toContain("font-weight:700");
    expect(quiet).not.toContain("font-weight:700");
  });
});

describe("noms de personnes — toujours « Bill Somen », jamais « BILL SOMEN »", () => {
  it("livreur, influenceur : même règle par le graphe d'entités (drapeau person)", () => {
    expect(html(<CourierRef id="c1" label="MARC KAMGA" variant="num" />)).toContain("Marc Kamga");
    expect(html(<AgentRef id="a1" label="aïcha BELLO" variant="num" />)).toContain("Aïcha Bello");
  });
  it("une chose n'est pas une personne : un plat reste tel quel", () => {
    expect(html(<EntityRef kind="item" id="i1" label="POULET PANÉ" variant="num" />)).toContain("POULET PANÉ");
  });
});

describe("pastilles et noms d'entité — pas d'infobulle qui répète le lien", () => {
  it("le nom d'une entité n'a pas de title « Ouvrir … »", () => {
    for (const out of [html(<EntityRef kind="vehicle" id="v1" label="Moto" variant="num" />), html(<EntityRef kind="vehicle" id="v1" label="Moto" variant="row" />), html(<EntityRef kind="vehicle" id="v1" label="Moto" variant="chip" />)]) expect(out).not.toMatch(/title="Ouvrir/);
  });
  it("le menu d'actions n'a pas non plus d'infobulle en écho (action `run` comprise)", () => {
    const withHere = renderToStaticMarkup(<MemoryRouter><EntityRefProvider value={{ graph: clpGraph, openHere: () => () => {} }}><ItemRef id="eru" label="Eru" /></EntityRefProvider></MemoryRouter>);
    expect(withHere).not.toMatch(/title="Ouvrir/);
  });
});

const pill = (props: Record<string, unknown>) => html(<ItemRef variant="chip" noMenu id="j" label="Jus de Foléré" qty={1} {...props} />);

describe("pastille plat + variation + stock", () => {
  it("sans variation : « 1× », le nom, le stock gris en nombre seul", () => {
    const h = pill({ stock: { level: "ok", count: 7 } });
    expect(h).toContain("1×");
    expect(h).toContain("Jus de Foléré");
    expect(h).not.toContain("omni-pst-var");
    expect(h).toContain("omni-pst-stock--ok");
    expect(h).toContain('aria-label="7 restants"');
    expect(h).toContain('aria-label="1× Jus de Foléré, 7 restants"');
  });
  it("avec variation : puce bleue collée au nom, avant la barre du stock", () => {
    const h = pill({ variation: "M", stock: { level: "ok", count: 7 } });
    expect(h).toContain('<span class="omni-pst-var">M</span>');
    expect(h).toContain('aria-label="1× Jus de Foléré, M, 7 restants"');
    expect(h.indexOf("omni-pst-var")).toBeLessThan(h.indexOf("omni-pst-sg--value"));
  });
  it("variation longue : la contenance reste dans la puce", () => {
    expect(pill({ variation: "M (0,5 l)" })).toContain('<span class="omni-pst-var">M (0,5 l)</span>');
  });
  it("stock bas : badge ambre", () => {
    const h = pill({ variation: "M", stock: { level: "low", count: 2 } });
    expect(h).toContain("omni-pst-stock--low");
    expect(h).toContain('aria-label="Stock bas : 2 restants"');
  });
  it("épuisé : badge rouge à 0, nom atténué", () => {
    const h = pill({ stock: { level: "out", count: 0 } });
    expect(h).toContain("omni-pst-stock--out");
    expect(h).toContain('aria-label="Épuisé"');
    expect(h).toContain("omni-pst--dim");
    expect(h).toContain('aria-label="1× Jus de Foléré, épuisé"');
    expect(pill({ stock: { level: "ok", count: 7 } })).not.toContain("omni-pst--dim");
    expect(pill({}).includes("omni-pst-sg--value")).toBe(false);
  });
  it("à la commande : badge d'accent avec la marmite, sans nombre", () => {
    const h = pill({ stock: { level: "made_to_order" } });
    expect(h).toContain("omni-pst-stock--made_to_order");
    expect(h).toContain('aria-label="À la commande"');
    expect(h).toContain('aria-label="1× Jus de Foléré, à la commande"');
    expect(h).toContain("<svg");
  });
  it("stock non suivi : aucun badge, aucune barre", () => {
    const h = pill({ variation: "M", stock: null });
    expect(h).not.toContain("omni-pst-stock");
    expect(h).toContain('aria-label="1× Jus de Foléré, M"');
    expect(h).not.toContain("omni-pst-sg--value");
  });
  it("aucune infobulle", () => {
    expect(pill({ variation: "M (0,5 l)", stock: { level: "low", count: 2 } })).not.toMatch(/\btitle=/);
  });
});
