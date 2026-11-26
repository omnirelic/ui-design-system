// @vitest-environment jsdom
// Tests miroir de web/src/admin/ui/__tests__/PhotoLink.test.tsx de Chez la Petite ; seuls les imports changent.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { PhotoLink } from "../src/web/PhotoLink";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const URL1 = "https://res.cloudinary.com/clp/image/upload/v1/proof/p1.jpg";
let root: Root; let host: HTMLElement;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); });
const mount = () => act(async () => { root.render(createElement(MemoryRouter, null, createElement(PhotoLink, { url: URL1, label: "capture", children: "capture" }))); });
const dialog = () => document.querySelector("[role=dialog]");

describe("PhotoLink — agrandir sur place", () => {
  it("n'est plus un lien externe : un bouton, curseur zoom-in", async () => {
    await mount();
    expect(host.querySelector("a[target=_blank]")).toBeNull();
    const b = host.querySelector("button")!;
    expect(b.style.cursor).toBe("zoom-in");
    expect(b.getAttribute("title")).toBeNull();
  });
  it("le clic ouvre le visionneur, sans nouvel onglet ; Échap/Fermer le referme", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    await mount();
    await act(async () => { host.querySelector("button")!.click(); });
    expect(dialog()).not.toBeNull();
    expect(open).not.toHaveBeenCalled();
    await act(async () => { (document.querySelector("button[aria-label='Fermer']") as HTMLElement).click(); });
    expect(dialog()).toBeNull();
  });
});
