// @vitest-environment jsdom
// Tests miroir de web/src/ui/__tests__/Drawer.test.tsx de Chez la Petite (mêmes cas, mêmes assertions).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Drawer } from "../src/web/Drawer";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root; let host: HTMLElement;
const raf = () => act(async () => { await new Promise((r) => setTimeout(r, 30)); });
const mount = (props: { onClose?: () => void; veil?: boolean; outsideClose?: boolean; footer?: string; headerExtra?: string } = {}) => act(async () => {
  root.render(createElement(Drawer, { open: true, onClose: props.onClose ?? vi.fn(), title: "Titre", veil: props.veil, outsideClose: props.outsideClose, footer: props.footer, headerExtra: props.headerExtra, children: createElement("div", { "data-testid": "body" }, "contenu") }));
});

beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe("Drawer — voile", () => {
  it("par défaut : fond assombri qui ferme au clic (comportement historique)", async () => {
    const onClose = vi.fn();
    await mount({ onClose }); await raf();
    const overlay = document.body.querySelector<HTMLElement>("[data-drawer-overlay]")!;
    expect(overlay.style.background).toContain("rgba(0, 0, 0, 0.6)");
    expect(overlay.style.pointerEvents).not.toBe("none");
    act(() => { overlay.click(); });
    expect(onClose).toHaveBeenCalled();
  });

  it("veil={false} : aucun assombrissement, le fond laisse passer les clics (le fil derrière reste utilisable), le panneau reste cliquable", async () => {
    const onClose = vi.fn();
    await mount({ onClose, veil: false }); await raf();
    const overlay = document.body.querySelector<HTMLElement>("[data-drawer-overlay]")!;
    expect(overlay.style.background).toMatch(/transparent|none|^$/);
    expect(overlay.style.pointerEvents).toBe("none");
    const panel = document.body.querySelector<HTMLElement>("[data-drawer-panel]")!;
    expect(panel.style.pointerEvents).toBe("auto");
    act(() => { overlay.click(); });
    expect(onClose).not.toHaveBeenCalled(); // pas de fermeture au clic hors du panneau : le fil derrière est utilisé
  });

  it("veil={false} + outsideClose : fond transparent mais un clic hors du panneau ferme, un clic dans le panneau non", async () => {
    const onClose = vi.fn();
    await mount({ onClose, veil: false, outsideClose: true }); await raf();
    const overlay = document.body.querySelector<HTMLElement>("[data-drawer-overlay]")!;
    expect(overlay.style.background).toMatch(/transparent|none|^$/);
    expect(overlay.style.pointerEvents).not.toBe("none");
    act(() => { (document.body.querySelector("[data-drawer-panel]") as HTMLElement).click(); });
    expect(onClose).not.toHaveBeenCalled();
    act(() => { overlay.click(); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("veil={false} : le bouton × et Échap ferment toujours le tiroir", async () => {
    const onClose = vi.fn();
    await mount({ onClose, veil: false }); await raf();
    act(() => { (document.body.querySelector("button[aria-label='Fermer']") as HTMLElement).click(); });
    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect(onClose.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Drawer — pied et en-tête", () => {
  it("footer : un pied fixe hors du corps défilant ; absent par défaut", async () => {
    await mount({}); await raf();
    expect(document.body.querySelector("[data-drawer-footer]")).toBeNull();
    await mount({ footer: "Créer la commande" }); await raf();
    const foot = document.body.querySelector("[data-drawer-footer]")!;
    expect(foot.textContent).toBe("Créer la commande");
    expect(foot.parentElement).toBe(document.body.querySelector("[data-drawer-panel]"));
  });
  it("headerExtra : s'affiche à côté du ×", async () => {
    await mount({ headerExtra: "⋯" }); await raf();
    const close = document.body.querySelector("button[aria-label='Fermer']")!;
    expect(close.parentElement!.textContent).toContain("⋯");
  });
});

describe("Drawer — bare (sans barre de titre) et bodyRef", () => {
  const renderBare = (props: Record<string, unknown>) => act(async () => {
    root.render(createElement(Drawer, { open: true, onClose: () => {}, bare: true, title: "Titre ignoré", ...props } as never, createElement("p", { id: "content" }, "contenu")));
  });
  const closeButtons = () => [...document.querySelectorAll<HTMLButtonElement>("button[aria-label=Fermer]")];

  it("bare : pas de barre de titre — le contenu commence tout en haut — et un seul × qui ferme", async () => {
    const onClose = vi.fn();
    await renderBare({ onClose }); await raf();
    expect(document.body.textContent).not.toContain("Titre ignoré");
    expect(closeButtons()).toHaveLength(1);
    act(() => { closeButtons()[0].click(); });
    expect(onClose).toHaveBeenCalledTimes(1);
    const body = document.querySelector("#content")!.parentElement!;
    expect(body.style.padding).toBe("0px"); // le contenu gère lui-même ses marges
  });
  it("bare + footer : le pied fixe reste sous le corps", async () => {
    await renderBare({ footer: "Enregistrer" }); await raf();
    expect(document.body.querySelector("[data-drawer-footer]")!.textContent).toBe("Enregistrer");
  });
  it("sans bare : barre de titre inchangée", async () => {
    await act(async () => { root.render(createElement(Drawer, { open: true, onClose: () => {}, title: "Fiche livreur" } as never, createElement("p", null, "x"))); }); await raf();
    expect(document.body.textContent).toContain("Fiche livreur");
  });
  it("bodyRef reçoit le conteneur qui défile (pour la parallaxe)", async () => {
    const seen: (HTMLElement | null)[] = [];
    await renderBare({ bodyRef: (el: HTMLElement | null) => { seen.push(el); } }); await raf();
    const el = seen.find(Boolean)!;
    expect(el.style.overflowY).toBe("auto");
    expect(el.contains(document.querySelector("#content"))).toBe(true);
  });
});

describe("Drawer — ajouts du portage (non présents chez CLP)", () => {
  it("fermé : rien dans le DOM ; le titre, les actions et le fil d'Ariane s'affichent ouvert", async () => {
    await act(async () => { root.render(createElement(Drawer, { open: false, onClose: () => {}, title: "T", children: "x" })); }); await raf();
    expect(document.body.querySelector("[data-drawer-overlay]")).toBeNull();
    await act(async () => { root.render(createElement(Drawer, { open: true, onClose: () => {}, title: "Fiche", crumbs: "Livraison › Livreurs", actions: "Assigner", children: "x" })); }); await raf();
    expect(document.body.textContent).toContain("Livraison › Livreurs");
    expect(document.body.querySelector(".omni-drawer-actions")!.textContent).toBe("Assigner");
  });
  it("sortie animée : le panneau glisse hors écran puis se démonte après 280 ms", async () => {
    await mount({}); await raf();
    const panel = () => document.body.querySelector<HTMLElement>("[data-drawer-panel]");
    expect(panel()!.style.transform).toBe("translateX(0)");
    await act(async () => { root.render(createElement(Drawer, { open: false, onClose: () => {}, title: "T", children: "x" })); });
    expect(panel()!.style.transform).toBe("translateX(100%)");
    await act(async () => { await new Promise((r) => setTimeout(r, 320)); });
    expect(panel()).toBeNull();
  });
  it("largeur : min(560px, 100%) par défaut, min(Npx, 100%) sinon ; étage 1200", async () => {
    await mount({}); await raf();
    expect(document.body.querySelector<HTMLElement>("[data-drawer-panel]")!.style.width).toBe("min(560px, 100%)");
    expect(document.body.querySelector<HTMLElement>("[data-drawer-overlay]")!.style.zIndex).toBe("1200");
  });
  it("Échap ne ferme plus une fois fermé (écouteur retiré)", async () => {
    const onClose = vi.fn();
    await act(async () => { root.render(createElement(Drawer, { open: false, onClose, title: "T", children: "x" })); });
    act(() => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect(onClose).not.toHaveBeenCalled();
  });
});
