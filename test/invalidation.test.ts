import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Test miroir de web/src/admin/lib/__tests__/invalidation.test.ts de Chez la Petite (mêmes cas, mêmes assertions).
import { invalidateAdminResource, invalidateAfterWrite, isRelatedWrite, registerResource } from "../src/web/state/invalidation";
import { createAdminFetch } from "../src/web/state/admin-fetch";
import { clearSwrCache, setSwrScope } from "../src/web/state/swr-store";

// CLP importe `adminFetch` câblé en dur ; ici la même fonction est fabriquée avec ses dépendances injectées.
const adminFetch = createAdminFetch({ pushError: vi.fn() });

describe("isRelatedWrite — quelle ressource lue dépend d'une écriture", () => {
  it("la liste et la fiche de ce qu'on écrit, jamais un voisin", () => {
    expect(isRelatedWrite("/api/menu/purchase-lists", "/api/menu/purchase-lists")).toBe(true);
    expect(isRelatedWrite("/api/menu/purchase-lists", "/api/menu/purchase-lists/pl1")).toBe(true); // écrire la fiche relit la liste
    expect(isRelatedWrite("/api/menu/purchase-lists/pl1", "/api/menu/purchase-lists/pl1")).toBe(true);
    expect(isRelatedWrite("/api/menu/purchase-lists/pl1", "/api/menu/purchase-lists")).toBe(true); // écrire la liste relit la fiche
    expect(isRelatedWrite("/api/menu/items", "/api/menu/purchase-lists/pl1")).toBe(false);
    expect(isRelatedWrite("/api/menu/purchase-lists-archive", "/api/menu/purchase-lists")).toBe(false); // frontière de segment
  });
  it("les paramètres de requête ne comptent pas", () => {
    expect(isRelatedWrite("/api/orders?limit=50", "/api/orders/42?x=1")).toBe(true);
    expect(isRelatedWrite("/api/menu/purchase-lists?me=1", "/api/menu/purchase-lists/pl1?action=publish")).toBe(true);
  });
});

describe("invalidateAdminResource / invalidateAfterWrite", () => {
  it("préfixe : relit les ressources montées dont l'URL commence par lui", () => {
    const reload = vi.fn(); const other = vi.fn();
    const off1 = registerResource("/api/menu/ingredients?kind=container", reload);
    const off2 = registerResource("/api/orders", other);
    invalidateAdminResource("/api/menu/ingredients");
    expect(reload).toHaveBeenCalledTimes(1);
    expect(other).not.toHaveBeenCalled();
    off1(); off2();
    invalidateAdminResource("/api/menu/ingredients");
    expect(reload).toHaveBeenCalledTimes(1); // désabonnée au démontage
  });
  it("après écriture : relit les ressources liées", () => {
    const reload = vi.fn();
    const off = registerResource("/api/menu/purchase-lists", reload);
    invalidateAfterWrite("/api/menu/purchase-lists/pl1?action=publish");
    expect(reload).toHaveBeenCalledTimes(1);
    off();
  });
});

describe("adminFetch — une écriture réussie relit ce qu'elle a changé", () => {
  const reload = vi.fn(); let off: () => void;
  beforeEach(async () => { setSwrScope(7); await clearSwrCache(); reload.mockClear(); off = registerResource("/api/menu/purchase-lists", reload); });
  afterEach(() => { off(); vi.unstubAllGlobals(); });
  const ok = () => vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } })));

  it("POST réussi : la liste est relue", async () => {
    ok();
    await adminFetch("Fiche d'achat", "/api/menu/purchase-lists", { method: "POST", body: "{}" });
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it("PUT / PATCH / DELETE réussis aussi", async () => {
    ok();
    for (const method of ["PUT", "PATCH", "DELETE"]) await adminFetch("x", "/api/menu/purchase-lists/pl1", { method });
    expect(reload).toHaveBeenCalledTimes(3);
  });
  it("un GET ne relit rien", async () => {
    ok();
    await adminFetch("x", "/api/menu/purchase-lists");
    expect(reload).not.toHaveBeenCalled();
  });
  it("une écriture refusée ne relit rien", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 409 })));
    await adminFetch("x", "/api/menu/purchase-lists", { method: "POST" });
    expect(reload).not.toHaveBeenCalled();
  });
  it("un aperçu (POST sans effet) ou `invalidate: false` ne relit rien", async () => {
    ok();
    await adminFetch("Aperçu", "/api/menu/purchase-lists?preview=1", { method: "POST" });
    await adminFetch("x", "/api/menu/purchase-lists", { method: "POST", invalidate: false });
    expect(reload).not.toHaveBeenCalled();
  });
  it("une écriture sur un autre domaine ne relit pas cette liste", async () => {
    ok();
    await adminFetch("x", "/api/menu/items/i1", { method: "PATCH" });
    expect(reload).not.toHaveBeenCalled();
  });
});
