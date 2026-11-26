// @vitest-environment jsdom
// ProofField de Chez la Petite (web/src/admin/ui/ProofField.tsx) : vide, envoi, photo prête, erreur, retrait, remplacement, dépôt et collage sur toute la zone ; useProofUpload à transport injecté.
// CLP n'a pas de test pour ces deux : les cas sont écrits d'après son code. Aucun envoi réseau : le transport est un double.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { ProofField } from "../src/web/ProofField";
import { useProofUpload } from "../src/web/use-proof-upload";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const URL1 = "https://res.cloudinary.com/demo/image/upload/v1/proof/p1.jpg";
let root: Root; let host: HTMLElement;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); });

type Props = Parameters<typeof ProofField>[0];
const base: Props = { url: null, uploading: false, error: "", onPick: vi.fn(), addLabel: "Ajouter la capture" };
const mount = (p: Partial<Props> = {}) => act(async () => { root.render(createElement(MemoryRouter, null, createElement(ProofField, { ...base, ...p }))); });
const fileInput = () => host.querySelector<HTMLInputElement>("input[type=file]")!;
const png = () => new File(["x"], "capture.png", { type: "image/png" });

describe("ProofField — états", () => {
  it("vide : bouton pointillé, mention « glisser ou coller », aide sous le bouton", async () => {
    await mount({ tip: "Capture du paiement" });
    expect(host.textContent).toContain("Ajouter la capture");
    expect(host.textContent).toContain("· glisser ou coller");
    expect(host.textContent).toContain("Capture du paiement");
    expect(fileInput().accept).toBe("image/*");
    expect(host.querySelector("img")).toBeNull();
  });
  it("envoi : « Envoi… », champ désactivé, curseur d'attente, plus de mention de dépôt", async () => {
    await mount({ uploading: true, tip: "aide" });
    expect(host.textContent).toContain("Envoi…");
    expect(host.textContent).not.toContain("glisser ou coller");
    expect(fileInput().disabled).toBe(true);
    expect(host.querySelector("label")!.style.cursor).toBe("wait");
  });
  it("photo prête : miniature 56 px, libellé par défaut, « Remplacer », l'aide disparaît", async () => {
    await mount({ url: URL1, tip: "aide" });
    const img = host.querySelector("img")!;
    expect(img.src).toBe(URL1);
    expect(img.alt).toBe("preuve");
    expect(img.style.width).toBe("3.5rem");
    expect(host.textContent).toContain("Photo ajoutée");
    expect(host.textContent).toContain("Remplacer");
    expect(host.textContent).not.toContain("aide");
  });
  it("libellé de la ligne « photo prête » personnalisable ; erreur en rouge sous le champ", async () => {
    await mount({ url: URL1, doneLabel: "Preuve envoyée par le client", error: "Échec" });
    expect(host.textContent).toContain("Preuve envoyée par le client");
    expect(host.textContent).toContain("Échec");
  });
  it("corbeille seulement si `clear` est fourni ; elle le déclenche, sans titre en écho", async () => {
    await mount({ url: URL1 });
    expect(host.querySelector("button[aria-label='Retirer l\\'image']")).toBeNull();
    const clear = vi.fn();
    await mount({ url: URL1, clear });
    const b = host.querySelector<HTMLButtonElement>("button[aria-label=\"Retirer l'image\"]")!;
    await act(async () => { b.click(); });
    expect(clear).toHaveBeenCalledTimes(1);
  });
  it("la miniature ouvre l'image en grand sur place (visionneuse), sans nouvel onglet", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    await mount({ url: URL1 });
    await act(async () => { host.querySelector<HTMLButtonElement>("button[aria-label='Agrandir la photo']")!.click(); });
    expect(document.querySelector("[role=dialog]")).not.toBeNull();
    expect(open).not.toHaveBeenCalled();
  });
});

describe("ProofField — choix du fichier", () => {
  it("un fichier choisi part vers onPick", async () => {
    const onPick = vi.fn();
    await mount({ onPick });
    const input = fileInput();
    const f = png();
    Object.defineProperty(input, "files", { value: [f], configurable: true });
    await act(async () => { input.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(onPick).toHaveBeenCalledWith(f);
  });
  it("une image déposée sur toute la zone (pas seulement le bouton) est transmise ; un PDF est ignoré", async () => {
    const onPick = vi.fn();
    await mount({ url: URL1, onPick });
    const zone = host.firstElementChild as HTMLElement;
    const drop = (files: File[]) => {
      const e = new Event("drop", { bubbles: true, cancelable: true }) as Event & { dataTransfer: unknown };
      e.dataTransfer = { types: ["Files"], files };
      return act(async () => { zone.dispatchEvent(e); });
    };
    await drop([new File(["x"], "c.pdf", { type: "application/pdf" })]);
    expect(onPick).not.toHaveBeenCalled();
    await drop([png()]);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect((onPick.mock.calls[0][0] as File).name).toBe("capture.png");
  });
  it("une image collée (Ctrl/⌘ V) alimente le champ", async () => {
    const onPick = vi.fn();
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList); // jsdom : rien n'est « affiché » sans mise en page
    await mount({ onPick });
    const paste = new Event("paste", { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown };
    paste.clipboardData = { files: [png()] };
    await act(async () => { document.dispatchEvent(paste); });
    expect(paste.defaultPrevented).toBe(true);
    expect(onPick).toHaveBeenCalledTimes(1);
  });
});

describe("useProofUpload — transport injecté", () => {
  function Harness({ upload, initial }: { upload: (f: File) => Promise<string | null>; initial?: string | null }) {
    const p = useProofUpload(upload, initial ?? null);
    const [log] = useState<string[]>([]);
    void log;
    return createElement("div", null,
      createElement("button", { id: "pick", onClick: () => void p.pick(png()) }),
      createElement("button", { id: "none", onClick: () => void p.pick(undefined) }),
      createElement("button", { id: "clear", onClick: p.clear }),
      createElement("button", { id: "reset", onClick: p.reset }),
      createElement("output", { id: "o" }, JSON.stringify({ url: p.url, uploading: p.uploading, error: p.error })));
  }
  const out = () => JSON.parse(host.querySelector("#o")!.textContent!);
  const click = (id: string) => act(async () => { host.querySelector<HTMLElement>(`#${id}`)!.click(); });

  it("succès : l'URL rendue par le transport devient la valeur, pas d'erreur", async () => {
    const upload = vi.fn(async () => URL1);
    await act(async () => { root.render(createElement(Harness, { upload })); });
    await click("pick");
    expect(upload).toHaveBeenCalledTimes(1);
    expect(out()).toEqual({ url: URL1, uploading: false, error: "" });
  });
  it("échec (null) : message de CLP, valeur inchangée", async () => {
    await act(async () => { root.render(createElement(Harness, { upload: async () => null, initial: "https://x.test/a.jpg" })); });
    await click("pick");
    expect(out()).toEqual({ url: "https://x.test/a.jpg", uploading: false, error: "Échec de l'envoi de la photo — réessayez." });
  });
  it("sans fichier : aucun envoi ; clear vide l'URL ; reset revient à la valeur initiale", async () => {
    const upload = vi.fn(async () => URL1);
    await act(async () => { root.render(createElement(Harness, { upload, initial: "https://x.test/a.jpg" })); });
    await click("none");
    expect(upload).not.toHaveBeenCalled();
    await click("clear");
    expect(out().url).toBeNull();
    await click("pick");
    expect(out().url).toBe(URL1);
    await click("reset");
    expect(out().url).toBe("https://x.test/a.jpg");
  });
  it("envoi en cours : `uploading` vrai tant que le transport n'a pas rendu", async () => {
    let done!: (u: string | null) => void;
    await act(async () => { root.render(createElement(Harness, { upload: () => new Promise<string | null>((r) => { done = r; }) })); });
    await click("pick");
    expect(out().uploading).toBe(true);
    await act(async () => { done(URL1); });
    expect(out().uploading).toBe(false);
  });
});
