// @vitest-environment jsdom
// Test miroir de web/src/admin/lib/__tests__/swr-cache.test.ts de Chez la Petite (mêmes cas, mêmes assertions).
// Pas d'IndexedDB sous jsdom : on teste la voie « repli mémoire » (c'est aussi celle de l'admin en mode privé).
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setAdminFetch } from "../src/web/state/resource-config";
import { SWR_MAX_AGE_MS, clearSwrCache, readSwr, setSwrScope, swrJson, writeSwr } from "../src/web/state/swr-cache";

// CLP mocke `../admin-fetch` ; ici le même double est injecté par `setAdminFetch` (aucun autre changement dans les cas).
const adminFetch = vi.fn();
setAdminFetch((...a) => adminFetch(...a));

const ok = (body: unknown) => Promise.resolve({ json: async () => body });

beforeEach(async () => { adminFetch.mockReset(); setSwrScope(1); await clearSwrCache(); });

describe("swr-cache", () => {
  it("relit ce qui a été écrit, jusqu'à expiration", async () => {
    writeSwr("/api/x", [1], 1000);
    expect((await readSwr("/api/x", 1000 + 1))?.data).toEqual([1]);
    expect(await readSwr("/api/x", 1000 + SWR_MAX_AGE_MS)).toBeNull();
  });

  it("cloisonne par admin : un autre compte ne voit jamais la copie du précédent", async () => {
    writeSwr("/api/x", ["secret"]);
    setSwrScope(2);
    expect(await readSwr("/api/x")).toBeNull();
  });

  it("clearSwrCache vide tout (déconnexion)", async () => {
    writeSwr("/api/x", [1]);
    await clearSwrCache();
    expect(await readSwr("/api/x")).toBeNull();
  });

  describe("swrJson", () => {
    it("statut attendu (404) : adminFetch le traite lui-même (pas de toast), aucune donnée appliquée", async () => {
      adminFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({ error: "Panier introuvable" }) });
      const apply = vi.fn();
      expect(await swrJson("t", "/api/gone", apply, { quietStatuses: [404] })).toBe(false);
      expect(adminFetch).toHaveBeenCalledWith("t", "/api/gone", { handleStatuses: [404] });
      expect(apply).not.toHaveBeenCalled();
    });

    it("deux lectures simultanées de la même URL = une seule requête", async () => {
      adminFetch.mockResolvedValue(ok({ a: 1 }));
      await Promise.all([swrJson("t", "/api/same", vi.fn()), swrJson("t", "/api/same", vi.fn())]);
      expect(adminFetch).toHaveBeenCalledTimes(1);
    });

    it("sert la copie locale (stale) puis la réponse fraîche, et réécrit le cache", async () => {
      writeSwr("/api/x", ["vieux"]);
      let release: (v: unknown) => void = () => {};
      adminFetch.mockReturnValue(new Promise((r) => { release = r; }));
      const seen: [unknown, boolean][] = [];
      const p = swrJson<string[]>("t", "/api/x", (d, stale) => seen.push([d, stale]));
      await vi.waitFor(() => expect(seen).toEqual([[["vieux"], true]]));
      release(ok(["frais"]));
      expect(await p).toBe(true);
      expect(seen[1]).toEqual([["frais"], false]);
      expect((await readSwr("/api/x"))?.data).toEqual(["frais"]);
    });

    it("hors-ligne (fetch → null) : garde la copie locale, renvoie false", async () => {
      writeSwr("/api/x", ["vieux"]);
      adminFetch.mockResolvedValue(null);
      const apply = vi.fn();
      expect(await swrJson("t", "/api/x", apply)).toBe(false);
      expect(apply).toHaveBeenCalledTimes(1);
      expect(apply).toHaveBeenCalledWith(["vieux"], true);
    });

    it("n'applique jamais une copie locale arrivée après la réponse fraîche", async () => {
      adminFetch.mockResolvedValue(ok(["frais"]));
      const apply = vi.fn();
      await swrJson("t", "/api/y", apply);
      expect(apply.mock.calls.every(([, stale]) => stale === false)).toBe(true);
    });

    it("useCache:false ignore la copie locale (refetch temps réel)", async () => {
      writeSwr("/api/x", ["vieux"]);
      adminFetch.mockResolvedValue(ok(["frais"]));
      const apply = vi.fn();
      await swrJson("t", "/api/x", apply, { useCache: false });
      expect(apply).toHaveBeenCalledTimes(1);
      expect(apply).toHaveBeenCalledWith(["frais"], false);
    });
  });
});

describe("swrJson — TTL et dédup", () => {
  it("ttlMs : une copie récente est servie fraîche, sans requête réseau", async () => {
    writeSwr("/api/ref", ["ref"]);
    const seen: [unknown, boolean][] = [];
    expect(await swrJson<string[]>("t", "/api/ref", (d, s) => seen.push([d, s]), { ttlMs: 60_000 })).toBe(true);
    expect(seen).toEqual([[["ref"], false]]);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it("ttlMs : une copie plus ancienne que le TTL est revalidée", async () => {
    writeSwr("/api/ref", ["vieux"], Date.now() - 120_000);
    adminFetch.mockReturnValue(ok(["frais"]));
    const seen: [unknown, boolean][] = [];
    await swrJson<string[]>("t", "/api/ref", (d, s) => seen.push([d, s]), { ttlMs: 60_000 });
    expect(adminFetch).toHaveBeenCalledOnce();
    expect(seen[seen.length - 1]).toEqual([["frais"], false]);
  });

  it("sans ttlMs : toujours une requête (un reload après écriture ne lit jamais un TTL)", async () => {
    writeSwr("/api/ref", ["vieux"]);
    adminFetch.mockReturnValue(ok(["frais"]));
    await swrJson<string[]>("t", "/api/ref", () => {}, { ttlMs: 0 });
    expect(adminFetch).toHaveBeenCalledOnce();
  });

  it("dédup : deux appels simultanés sur la même URL partagent une seule requête", async () => {
    let release: (v: unknown) => void = () => {};
    adminFetch.mockReturnValue(new Promise((r) => { release = r; }));
    const a: unknown[] = []; const b: unknown[] = [];
    const p1 = swrJson<string[]>("t", "/api/shared", (d) => a.push(d), { useCache: false });
    const p2 = swrJson<string[]>("t", "/api/shared", (d) => b.push(d), { useCache: false });
    release(ok(["x"]));
    await Promise.all([p1, p2]);
    expect(adminFetch).toHaveBeenCalledOnce();
    expect(a).toEqual([["x"]]); expect(b).toEqual([["x"]]);
  });
});
