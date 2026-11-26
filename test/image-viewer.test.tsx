// @vitest-environment jsdom
// Tests miroir de web/src/admin/ui/__tests__/ImageViewer.test.tsx de Chez la Petite (mêmes cas, mêmes assertions) ; seuls les imports changent.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { ImageGallery } from "../src/web/ImageGallery";
import { ImageThumb } from "../src/web/ImageThumb";
import { useOpenImage } from "../src/web/gallery-context";
import type { GalleryImage } from "../src/web/image-urls";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const url = (n: number) => `https://res.cloudinary.com/clp/image/upload/v1/whatsapp/p${n}.jpg`;
const IMAGES: GalleryImage[] = [
  { id: "m1", url: url(1), caption: "Première", at: "2026-10-28T10:00:00Z" },
  { id: "m2", url: url(2), caption: "Capture de paiement", at: "2026-10-28T11:00:00Z" },
  { id: "m3", url: url(3), caption: null, at: "2026-10-28T12:00:00Z" },
];

let root: Root; let host: HTMLElement; let search = "";
function Probe() { search = useLocation().search; return null; }
function Thumbs({ images }: { images: GalleryImage[] }) {
  const open = useOpenImage();
  return <>{images.map((i) => <ImageThumb key={i.id} src={i.url} alt="Photo" onOpen={(el) => open?.(i.id, el)} />)}</>;
}
let mounts = 0;
// Chaque montage repart d'un routeur neuf (un MemoryRouter garde son URL initiale tant qu'il reste monté).
const mount = (entry: string, images: GalleryImage[] = IMAGES) => act(async () => {
  root.render(createElement(MemoryRouter, { key: `m${mounts++}`, initialEntries: [entry] }, createElement(Probe), createElement(ImageGallery, { images, children: createElement(Thumbs, { images }) })));
});
const dialog = () => host.ownerDocument.querySelector<HTMLElement>("[role=dialog]");
const byLabel = (label: string) => host.ownerDocument.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
const press = (key: string) => act(async () => { document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })); });
const click = (el: Element | null) => act(async () => { (el as HTMLElement).click(); });
const viewerImg = () => dialog()?.querySelector<HTMLImageElement>("img.ivw-img") ?? null;

beforeEach(() => { search = ""; host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); });

describe("ImageViewer — ouverture et état dans l'URL", () => {
  it("?photo= ouvre le visualiseur sur CETTE photo : compteur, légende, version large", async () => {
    await mount("/admin?thread=c1&photo=m2");
    expect(dialog()).not.toBeNull();
    expect(dialog()?.textContent).toContain("2 / 3");
    expect(dialog()?.textContent).toContain("Capture de paiement");
    expect(viewerImg()?.src).toContain("/upload/w_1600,c_limit,q_auto,f_auto/");
  });

  it("sans ?photo= ou avec un id inconnu / périmé : fermé, sans erreur, URL intacte", async () => {
    await mount("/admin?thread=c1");
    expect(dialog()).toBeNull();
    await mount("/admin?thread=c1&photo=zzz");
    expect(dialog()).toBeNull();
    expect(search).toBe("?thread=c1&photo=zzz");
  });

  it("cliquer une vignette pose ?photo=<id> sans écraser les autres paramètres, puis ouvre", async () => {
    await mount("/admin?thread=c1&order=o9");
    await click(host.querySelectorAll("button.ivw-thumb")[2]);
    expect(new URLSearchParams(search).get("photo")).toBe("m3");
    expect(new URLSearchParams(search).get("thread")).toBe("c1");
    expect(new URLSearchParams(search).get("order")).toBe("o9");
    expect(dialog()?.textContent).toContain("3 / 3");
  });

  it("fermer (bouton, Échap, fond) retire ?photo= et garde le reste", async () => {
    await mount("/admin?thread=c1&photo=m1");
    await click(byLabel("Fermer"));
    expect(dialog()).toBeNull();
    expect(search).toBe("?thread=c1");
    await mount("/admin?thread=c1&photo=m1");
    await press("Escape");
    expect(dialog()).toBeNull();
    await mount("/admin?thread=c1&photo=m1");
    await click(dialog()!.querySelector(".ivw-stage"));
    expect(dialog()).toBeNull();
    expect(search).toBe("?thread=c1");
  });
});

describe("ImageViewer — navigation", () => {
  it("flèches du clavier et boutons : photo suivante / précédente, URL mise à jour", async () => {
    await mount("/admin?thread=c1&photo=m1");
    await press("ArrowRight");
    expect(new URLSearchParams(search).get("photo")).toBe("m2");
    expect(dialog()?.textContent).toContain("2 / 3");
    await click(byLabel("Photo suivante"));
    expect(dialog()?.textContent).toContain("3 / 3");
    await click(byLabel("Photo précédente"));
    expect(dialog()?.textContent).toContain("2 / 3");
    await press("ArrowLeft");
    expect(dialog()?.textContent).toContain("1 / 3");
  });

  it("pas de boucle : aux bornes les flèches ne font rien et les boutons sont désactivés", async () => {
    await mount("/admin?photo=m1");
    expect(byLabel("Photo précédente")?.disabled).toBe(true);
    await press("ArrowLeft");
    expect(dialog()?.textContent).toContain("1 / 3");
    await mount("/admin?photo=m3");
    expect(byLabel("Photo suivante")?.disabled).toBe(true);
    await press("ArrowRight");
    expect(dialog()?.textContent).toContain("3 / 3");
  });

  it("une seule photo : ni flèches ni compteur", async () => {
    await mount("/admin?photo=m1", [IMAGES[0]]);
    expect(dialog()).not.toBeNull();
    expect(byLabel("Photo suivante")).toBeNull();
    expect(byLabel("Photo précédente")).toBeNull();
    expect(dialog()?.textContent).not.toContain("1 / 1");
  });

  it("balayage tactile horizontal (≥ 50 px) change de photo ; un petit geste ou un balayage vertical, non", async () => {
    await mount("/admin?photo=m2");
    const stage = dialog()!.querySelector(".ivw-stage")!;
    const swipe = (x0: number, y0: number, x1: number, y1: number) => act(async () => {
      const t = (x: number, y: number) => [{ clientX: x, clientY: y }] as unknown as TouchList;
      const start = new Event("touchstart", { bubbles: true }); Object.assign(start, { touches: t(x0, y0) });
      const end = new Event("touchend", { bubbles: true }); Object.assign(end, { changedTouches: t(x1, y1) });
      stage.dispatchEvent(start); stage.dispatchEvent(end);
    });
    await swipe(200, 100, 190, 100);
    await swipe(200, 100, 200, 300);
    expect(dialog()?.textContent).toContain("2 / 3");
    await swipe(200, 100, 100, 110); // vers la gauche : suivante
    expect(dialog()?.textContent).toContain("3 / 3");
    await swipe(100, 100, 220, 100); // vers la droite : précédente
    expect(dialog()?.textContent).toContain("2 / 3");
  });

  it("précharge les photos voisines", async () => {
    const loaded: string[] = [];
    vi.stubGlobal("Image", class { set src(v: string) { loaded.push(v); } });
    await mount("/admin?photo=m2");
    expect(loaded.some((s) => s.includes("p1.jpg"))).toBe(true);
    expect(loaded.some((s) => s.includes("p3.jpg"))).toBe(true);
    vi.unstubAllGlobals();
  });
});

describe("ImageViewer — zoom", () => {
  it("cliquer l'image bascule ajusté ↔ zoomé ; clavier + − 0 ; remis à l'ajustement à chaque photo", async () => {
    await mount("/admin?photo=m1");
    const zoom = () => dialog()?.querySelector<HTMLElement>(".ivw-stage")?.dataset.zoom;
    expect(zoom()).toBe("1");
    await click(viewerImg());
    expect(zoom()).toBe("2");
    await click(viewerImg());
    expect(zoom()).toBe("1");
    await press("+"); expect(zoom()).toBe("1.5");
    await press("+"); expect(zoom()).toBe("2");
    await press("-"); expect(zoom()).toBe("1.5");
    await press("0"); expect(zoom()).toBe("1");
    await press("-"); expect(zoom()).toBe("1"); // borne basse
    await click(byLabel("Zoom avant")); await click(byLabel("Zoom avant")); await click(byLabel("Zoom avant")); await click(byLabel("Zoom avant"));
    expect(zoom()).toBe("3"); // borne haute
    await click(byLabel("Ajuster à l'écran"));
    expect(zoom()).toBe("1");
    await click(viewerImg());
    await press("ArrowRight");
    expect(zoom()).toBe("1");
  });

  it("cliquer l'image ne ferme pas le visualiseur", async () => {
    await mount("/admin?photo=m1");
    await click(viewerImg());
    expect(dialog()).not.toBeNull();
  });
});

describe("ImageViewer — téléchargement, original, erreurs", () => {
  it("Télécharger : l'original en pièce jointe (fl_attachment)", async () => {
    const hrefs: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { hrefs.push(this.href); });
    await mount("/admin?photo=m2");
    await click(byLabel("Télécharger"));
    expect(hrefs).toEqual(["https://res.cloudinary.com/clp/image/upload/fl_attachment/v1/whatsapp/p2.jpg"]);
  });

  it("Ouvrir l'original : nouvel onglet, sans transformation", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    await mount("/admin?photo=m2");
    await click(byLabel("Ouvrir l'original"));
    expect(open).toHaveBeenCalledWith(url(2), "_blank", "noopener,noreferrer");
  });

  it("chargement : squelette jusqu'à l'image ; échec : « Photo indisponible » + lien vers l'original", async () => {
    await mount("/admin?photo=m1");
    expect(dialog()?.querySelector(".ivw-loading")).not.toBeNull();
    await act(async () => { viewerImg()!.dispatchEvent(new Event("load")); });
    expect(dialog()?.querySelector(".ivw-loading")).toBeNull();
    await press("ArrowRight");
    await act(async () => { viewerImg()!.dispatchEvent(new Event("error")); });
    expect(dialog()?.textContent).toContain("Photo indisponible");
    expect(dialog()?.querySelector<HTMLAnchorElement>("a.ivw-fallback")?.href).toBe(url(2));
  });
});

describe("ImageViewer — accessibilité et hors routeur", () => {
  it("rôle dialog nommé, focus dans le visualiseur puis rendu à la vignette à la fermeture", async () => {
    await mount("/admin?thread=c1");
    const thumb = host.querySelectorAll<HTMLButtonElement>("button.ivw-thumb")[1];
    thumb.focus();
    await click(thumb);
    expect(dialog()?.getAttribute("aria-modal")).toBe("true");
    expect(dialog()?.getAttribute("aria-label")).toBeTruthy();
    expect(dialog()?.contains(document.activeElement)).toBe(true);
    await press("Escape");
    expect(document.activeElement).toBe(thumb);
  });

  it("Tab reste piégé dans le visualiseur", async () => {
    await mount("/admin?photo=m2");
    const focusables = [...dialog()!.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]")];
    focusables[focusables.length - 1].focus();
    await act(async () => { dialog()!.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })); });
    expect(document.activeElement).toBe(focusables[0]);
  });

  it("hors routeur (tests, aperçus) : les enfants s'affichent, pas de visualiseur, pas d'erreur", async () => {
    await act(async () => { root.render(createElement(ImageGallery, { images: IMAGES, children: createElement("span", { id: "child" }, "ok") })); });
    expect(host.querySelector("#child")?.textContent).toBe("ok");
    expect(dialog()).toBeNull();
  });
});
