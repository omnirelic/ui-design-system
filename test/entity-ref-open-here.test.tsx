// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { EntityRefProvider, entityRefFor } from "../src/web/entry-entity";
import { clpGraph, entityPath } from "./fixtures/clp-entities";

// Tests de entity/__tests__/item-open-here.test.tsx de CLP : l'`ItemOpenContext` de la messagerie devient `openHere(kind, id)` du fournisseur.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
vi.mock("../src/web/HoverCard", async () => ({ ...(await import("./helpers/inline-hover-card")), Z_CARD: 1400 }));

let host: HTMLDivElement;
let root: Root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const Where = () => <i data-testid="where">{useLocation().pathname}</i>;
const ItemRef = entityRefFor("item");
const openOnly = (spy: (id: string) => void) => (kind: string, id: string) => (kind === "item" ? () => spy(id) : undefined);

describe("pastille de plat : ouverture sur place", () => {
  it("avec un hôte de tiroir, le clic ouvre le plat ici et ne change pas de vue", () => {
    const open = vi.fn();
    act(() => root.render(
      <MemoryRouter initialEntries={["/admin/orders"]}>
        <EntityRefProvider value={{ graph: clpGraph, openHere: openOnly(open) }}><ItemRef variant="chip" noMenu id="eru" label="Eru" /></EntityRefProvider><Where />
      </MemoryRouter>));
    act(() => { host.querySelector("a")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); });
    expect(open).toHaveBeenCalledWith("eru");
    expect(host.querySelector("[data-testid=where]")!.textContent).toBe("/admin/orders");
  });
  it("sans hôte, le lien profond vers le catalogue reste", () => {
    act(() => root.render(<MemoryRouter><EntityRefProvider value={{ graph: clpGraph }}><ItemRef variant="chip" noMenu id="eru" label="Eru" /></EntityRefProvider></MemoryRouter>));
    expect(host.querySelector("a")!.getAttribute("href")).toBe(entityPath("item", "eru"));
  });
  it("le menu d'actions propose « Ouvrir » sur place quand l'hôte existe", () => {
    const open = vi.fn();
    act(() => root.render(<MemoryRouter><EntityRefProvider value={{ graph: clpGraph, openHere: openOnly(open) }}><ItemRef variant="chip" id="eru" label="Eru" /></EntityRefProvider></MemoryRouter>));
    const item = [...host.querySelectorAll<HTMLElement>("[role=menuitem]")].find(b => b.textContent?.includes("Ouvrir"))!;
    expect(item.tagName).toBe("BUTTON");
    act(() => { item.click(); });
    expect(open).toHaveBeenCalledWith("eru");
  });
  it("une autre entité n'est pas ouverte sur place (l'hôte choisit par type)", () => {
    const open = vi.fn();
    act(() => root.render(<MemoryRouter><EntityRefProvider value={{ graph: clpGraph, openHere: openOnly(open) }}>{entityRefFor("vehicle")({ variant: "chip", noMenu: true, id: "v1", label: "Moto" })}</EntityRefProvider></MemoryRouter>));
    act(() => { host.querySelector("a")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); });
    expect(open).not.toHaveBeenCalled();
  });
});
