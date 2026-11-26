// @vitest-environment jsdom
// Tests miroir de web/src/admin/lib/__tests__/phone-search-status.test.tsx de Chez la Petite : retour à l'écran de la recherche par numéro.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PhoneSearchNotice, PhoneSearchProvider, usePhoneMatch } from "../src/web/phone-search-status";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const transport = vi.fn();
let root: Root; let host: HTMLElement; let found: Set<string> | null = null;
function Probe({ term }: { term: string }) { found = usePhoneMatch("orders", term); return createElement(PhoneSearchNotice, { kind: "orders" }); }
const show = (term: string) => act(async () => { root.render(createElement(PhoneSearchProvider, { transport }, createElement(Probe, { term }))); });
const wait = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const notice = () => host.querySelector("[data-testid='phone-search-notice']")?.textContent ?? null;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => { vi.clearAllMocks(); found = null; host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

describe("recherche par numéro — retour à l'écran", () => {
  it("terme court (3 à 5 chiffres) : « 6 chiffres minimum », aucun appel", async () => {
    await show("69000");
    expect(notice()).toBe("6 chiffres minimum");
    await wait(450);
    expect(transport).not.toHaveBeenCalled();
    expect(found).toBeNull();
  });
  it("un nom : aucune mention, aucun appel", async () => {
    await show("Awa");
    expect(notice()).toBeNull();
    await wait(450);
    expect(transport).not.toHaveBeenCalled();
  });
  it("terme assez long : « Recherche… » puis les identifiants rendus par le serveur, en POST sans le terme dans l'URL", async () => {
    transport.mockResolvedValue(json({ ids: [1, 2] }));
    await show("+237 690 000 011");
    expect(notice()).toBe("Recherche…");
    await wait(450);
    expect(notice()).toBeNull();
    expect([...found!]).toEqual(["1", "2"]);
    const [label, url, init] = transport.mock.calls[0];
    expect(label).toBe("Recherche par numéro");
    expect(url).toBe("/api/orders?view=phone_match");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ kind: "orders", q: "690000011" });
    expect(init.invalidate).toBe(false);
    expect(init.handleStatuses).toEqual([400, 429]);
  });
  it("429 : le message du serveur, ensemble vide", async () => {
    transport.mockResolvedValue(json({ message: "Trop de recherches par numéro, réessayez dans une minute." }, 429));
    await show("690000");
    await wait(450);
    expect(notice()).toBe("Trop de recherches par numéro, réessayez dans une minute.");
    expect(found?.size).toBe(0);
  });
  it("400 « terme trop court » : « 6 chiffres minimum » ; tout autre 400 garde son message", async () => {
    transport.mockResolvedValueOnce(json({ error: "search_too_short", message: "Saisissez au moins 6 chiffres." }, 400));
    await show("690000");
    await wait(450);
    expect(notice()).toBe("6 chiffres minimum");
    transport.mockResolvedValueOnce(json({ error: "search_invalid", message: "Numéro invalide." }, 400));
    await show("6900001");
    await wait(450);
    expect(notice()).toBe("Numéro invalide.");
  });
  it("sans fournisseur : aucun appel", async () => {
    act(() => root.render(createElement(Probe, { term: "690000" })));
    await wait(450);
    expect(transport).not.toHaveBeenCalled();
  });
  it("route remplaçable", async () => {
    transport.mockResolvedValue(json({ keys: ["c_1"] }));
    act(() => root.render(createElement(PhoneSearchProvider, { transport, url: "/x" }, createElement(function P() { found = usePhoneMatch("clients", "690000"); return null; }))));
    await wait(450);
    expect(transport.mock.calls[0][1]).toBe("/x");
    expect([...found!]).toEqual(["c_1"]);
  });
});
