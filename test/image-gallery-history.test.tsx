// @vitest-environment jsdom
// Historique de la galerie (comportement de web/src/admin/ui/ImageGallery.tsx de CLP, commenté chez elle mais sans test) : ouvrir ajoute une entrée (« Retour » ferme),
// changer de photo et fermer REMPLACENT l'entrée (aucune photo périmée à rouvrir en revenant en arrière).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { ImageGallery } from "../src/web/ImageGallery";
import { ImageThumb } from "../src/web/ImageThumb";
import { useOpenImage } from "../src/web/gallery-context";
import type { GalleryImage } from "../src/web/image-urls";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const IMAGES: GalleryImage[] = ["m1", "m2", "m3"].map((id, i) => ({ id, url: `https://example.test/${id}.jpg`, at: `2026-10-28T0${i}:00:00Z` }));
let root: Root; let host: HTMLElement; let where = ""; let back: () => void = () => undefined;
function Probe() { const l = useLocation(); const nav = useNavigate(); where = l.pathname + l.search; back = () => nav(-1); return null; }
function Thumbs() { const open = useOpenImage(); return createElement("div", null, IMAGES.map((i) => createElement(ImageThumb, { key: i.id, src: i.url, alt: "p", onOpen: (el: HTMLElement) => open?.(i.id, el) }))); }
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const mount = () => act(async () => { root.render(createElement(MemoryRouter, { initialEntries: ["/a", "/admin?x=1"], initialIndex: 1 }, createElement(Probe), createElement(ImageGallery, { images: IMAGES, children: createElement(Thumbs) }))); });
const dialog = () => document.querySelector("[role=dialog]");
const press = (key: string) => act(async () => { document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })); });
const goBack = () => act(async () => { back(); });

describe("galerie — historique", () => {
  it("ouvrir ajoute une entrée : « Retour » referme le visualiseur et retrouve la page", async () => {
    await mount();
    await act(async () => { host.querySelectorAll<HTMLElement>("button.ivw-thumb")[0].click(); });
    expect(where).toBe("/admin?x=1&photo=m1");
    await goBack();
    expect(where).toBe("/admin?x=1");
    expect(dialog()).toBeNull();
  });
  it("changer de photo remplace l'entrée : « Retour » ferme, il ne revient pas à la photo d'avant", async () => {
    await mount();
    await act(async () => { host.querySelectorAll<HTMLElement>("button.ivw-thumb")[0].click(); });
    await press("ArrowRight"); await press("ArrowRight");
    expect(where).toBe("/admin?x=1&photo=m3");
    await goBack();
    expect(where).toBe("/admin?x=1");
    expect(dialog()).toBeNull();
  });
  it("fermer remplace l'entrée : « Retour » après la fermeture ne rouvre pas la photo", async () => {
    await mount();
    await act(async () => { host.querySelectorAll<HTMLElement>("button.ivw-thumb")[1].click(); });
    await press("Escape");
    expect(where).toBe("/admin?x=1");
    await goBack();
    expect(where).toBe("/admin?x=1");
    expect(dialog()).toBeNull();
  });
});
