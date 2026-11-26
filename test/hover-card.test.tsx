// Tests de web/src/admin/ui/entity/__tests__/hover-card.test.tsx de CLP, tels quels (Z.card de CLP = Z_CARD).
// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { HoverCard, Z_CARD } from "../src/web/entry-entity";
import { Z } from "../src/web/controls";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Floating UI interroge `:popover-open` / `:modal` sur chaque ancêtre ; jsdom (nwsapi) ne connaît pas ces sélecteurs et met ~1 s à
// chaque refus : un test passait de 4 ms à 4 s. Les navigateurs, eux, répondent tout de suite — on court-circuite ici seulement.
const nativeMatches = Element.prototype.matches;
beforeAll(() => {
  Element.prototype.matches = function (this: Element, selector: string) { return selector === ":popover-open" || selector === ":modal" ? false : nativeMatches.call(this, selector); };
});
afterAll(() => { Element.prototype.matches = nativeMatches; });

let host: HTMLDivElement;
let root: Root;
const NO_DELAY = { open: 0, close: 0 };

beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const mount = (ui: ReactNode) => act(() => { root.render(ui); });
const trigger = () => host.querySelector<HTMLElement>("[data-hover-card]")!;
const hover = () => act(() => { trigger().dispatchEvent(new MouseEvent("mouseenter", { bubbles: false })); });
const card = () => document.body.querySelector<HTMLElement>("[data-hover-card-panel]");

describe("HoverCard — carte au survol d'une pastille", () => {
  it("le contenu n'est pas monté avant le premier survol (listes et chiffres du livreur ne se chargent pas)", () => {
    let mounts = 0;
    const Probe = () => { mounts++; return <span>fiche</span>; };
    mount(<HoverCard delay={NO_DELAY} content={<Probe />}><b>Naza</b></HoverCard>);
    expect(mounts).toBe(0);
    expect(card()).toBeNull();
    hover();
    expect(mounts).toBeGreaterThan(0);
    expect(card()?.textContent).toBe("fiche");
  });

  it("la carte est rendue dans un portail du <body>, au niveau Z_CARD : au-dessus des tiroirs et des modales, sous les infobulles", () => {
    mount(<div style={{ overflow: "hidden" }}><HoverCard delay={NO_DELAY} content={<span>fiche</span>}><b>Naza</b></HoverCard></div>);
    hover();
    const panel = card()!;
    expect(host.contains(panel)).toBe(false);
    expect(panel.style.zIndex).toBe(String(Z_CARD));
    expect(Z.drawer).toBeLessThan(Z_CARD);
    expect(Z.modal).toBeLessThan(Z_CARD);
    expect(Z_CARD).toBeLessThan(9999); // infobulle de CLP (Z.tooltip) ; popup (10000) recouvre tout
    expect(Z_CARD).toBeLessThan(Z.popup);
  });

  it("le déclencheur reçoit `open` : il coupe sa propre infobulle tant que la carte est ouverte", () => {
    mount(<HoverCard delay={NO_DELAY} content={<span>fiche</span>}>{open => <a title={open ? undefined : "Ouvrir : livreur"}>Julien</a>}</HoverCard>);
    expect(host.querySelector("a")!.getAttribute("title")).toBe("Ouvrir : livreur");
    hover();
    expect(host.querySelector("a")!.hasAttribute("title")).toBe(false);
  });

  it("Échap referme la carte", () => {
    mount(<HoverCard delay={NO_DELAY} content={<span>fiche</span>}><b>Naza</b></HoverCard>);
    hover();
    expect(card()).not.toBeNull();
    act(() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect(card()).toBeNull();
  });

  it("`disabled` : aucune carte, même au survol (rien à ouvrir)", () => {
    mount(<HoverCard disabled delay={NO_DELAY} content={<span>fiche</span>}><b>Naza</b></HoverCard>);
    hover();
    expect(card()).toBeNull();
  });

  it("un clic dans la carte ne remonte pas à la carte parente (la carte commande ouvrirait son tiroir)", () => {
    let parentClicks = 0;
    mount(<div onClick={() => { parentClicks++; }}><HoverCard delay={NO_DELAY} content={<button type="button">Ouvrir la fiche</button>}><b>Naza</b></HoverCard></div>);
    hover();
    act(() => { card()!.querySelector("button")!.click(); });
    expect(parentClicks).toBe(0);
  });

  it("`stopClicks` : un clic sur le déclencheur ne remonte pas non plus", () => {
    let parentClicks = 0;
    mount(<div onClick={() => { parentClicks++; }}><HoverCard stopClicks delay={NO_DELAY} content={<span>fiche</span>}><b>Naza</b></HoverCard></div>);
    act(() => { trigger().click(); });
    expect(parentClicks).toBe(0);
  });

  it("la carte est un dialogue nommé", () => {
    mount(<HoverCard delay={NO_DELAY} label="Fiche rapide de Naza" content={<span>fiche</span>}><b>Naza</b></HoverCard>);
    hover();
    expect(card()!.getAttribute("role")).toBe("dialog");
    expect(card()!.getAttribute("aria-label")).toBe("Fiche rapide de Naza");
  });

  it("`anchor` : la carte se place sur l'ancêtre désigné (la ligne client entière), pas sur le nom seul", () => {
    function Row() {
      const [, force] = useState(0);
      return <div className="row" ref={el => { if (el) (el as HTMLElement & { _f?: () => void })._f = () => force(n => n + 1); }}>
        <HoverCard anchor=".row" delay={NO_DELAY} content={<span>fiche</span>}><b>Naza</b></HoverCard>
      </div>;
    }
    mount(<Row />);
    const row = host.querySelector<HTMLElement>(".row")!;
    row.getBoundingClientRect = () => ({ x: 10, y: 20, left: 10, top: 20, right: 410, bottom: 60, width: 400, height: 40, toJSON() {} });
    hover();
    expect(card()).not.toBeNull();
    expect(trigger().closest(".row")).toBe(row);
  });
});
