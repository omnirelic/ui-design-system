// Nouveau (pas dans CLP) : branchements injectables (fetch, règles temps réel) et createAdminFetch avec ses dépendances.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CLP_LIVE_RESOURCE_RULES, liveResourceFor, setLiveResourceRules } from "../src/web/state/live-resources";
import { adminFetch, setAdminFetch } from "../src/web/state/resource-config";
import { createAdminFetch, isFromCache } from "../src/web/state/admin-fetch";
import { FROM_CACHE_HEADER, clearSwrCache, setSwrScope } from "../src/web/state/swr-store";

describe("setLiveResourceRules", () => {
  afterEach(() => setLiveResourceRules(null));
  it("remplace les règles de CLP, null les rétablit", () => {
    setLiveResourceRules([[/^\/v1\/dishes(?:[/?]|$)/, "catalog"]]);
    expect(liveResourceFor("/v1/dishes/9")).toBe("catalog");
    expect(liveResourceFor("/api/orders")).toBeNull();
    setLiveResourceRules(null);
    expect(liveResourceFor("/api/orders")).toBe("orders");
    expect(CLP_LIVE_RESOURCE_RULES.length).toBeGreaterThan(10);
  });
});

describe("setAdminFetch", () => {
  afterEach(() => { setAdminFetch(null); vi.unstubAllGlobals(); });
  it("délègue à la fonction injectée", async () => {
    const fn = vi.fn().mockResolvedValue(null);
    setAdminFetch(fn);
    await adminFetch("t", "/x", { handleStatuses: [404] });
    expect(fn).toHaveBeenCalledWith("t", "/x", { handleStatuses: [404] });
  });
  it("défaut : fetch simple, null sur erreur non traitée ou réseau tombé, réponse rendue pour un statut traité", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 404 })));
    expect(await adminFetch("t", "/x")).toBeNull();
    expect((await adminFetch("t", "/x", { handleStatuses: [404] }))?.status).toBe(404);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("off")));
    expect(await adminFetch("t", "/x")).toBeNull();
  });
});

describe("createAdminFetch — dépendances injectées", () => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  const pushError = vi.fn(); const ok = vi.fn(); const ko = vi.fn(); const doFetch = vi.fn();
  const af = createAdminFetch({ pushError, reportNetworkSuccess: ok, reportNetworkFailure: ko, fetch: doFetch });
  beforeEach(async () => { vi.clearAllMocks(); setSwrScope(3); await clearSwrCache(); });

  it("erreur HTTP : toast avec le message métier de NestJS, résultat null", async () => {
    doFetch.mockResolvedValue(json({ statusCode: 409, error: "Conflict", message: "Stock insuffisant" }, 409));
    expect(await af("Stock", "/api/menu/items", { method: "POST" })).toBeNull();
    expect(pushError).toHaveBeenCalledWith({ context: "Stock", status: 409, url: "/api/menu/items", message: "Stock insuffisant" });
  });
  it("statut traité par l'appelant : pas de toast, réponse rendue", async () => {
    doFetch.mockResolvedValue(json({}, 409));
    expect((await af("x", "/api/x", { handleStatuses: [409] }))?.status).toBe(409);
    expect(pushError).not.toHaveBeenCalled();
  });
  it("GET réussi puis réseau tombé : la dernière réponse connue est resservie, marquée", async () => {
    doFetch.mockResolvedValueOnce(json({ a: 1 }));
    await af("x", "/api/things");
    await new Promise(r => setTimeout(r, 0));
    doFetch.mockRejectedValueOnce(new Error("off"));
    const r = await af("x", "/api/things");
    expect(r && isFromCache(r)).toBe(true);
    expect(r?.headers.get(FROM_CACHE_HEADER)).toBe("1");
    expect(await r?.json()).toEqual({ a: 1 });
    expect(ko).toHaveBeenCalledTimes(1);
    expect(pushError).not.toHaveBeenCalled();
  });
  it("écriture dont le réseau tombe : toast, jamais de copie locale", async () => {
    doFetch.mockRejectedValue(new Error("off"));
    expect(await af("Save", "/api/things", { method: "POST" })).toBeNull();
    expect(pushError).toHaveBeenCalledWith({ context: "Save", status: null, url: "/api/things", message: "off" });
  });
  it("URL exclue de la copie locale : réseau tombé = null", async () => {
    doFetch.mockResolvedValueOnce(json({ x: 1 }));
    await af("x", "/api/auth/me");
    doFetch.mockRejectedValueOnce(new Error("off"));
    expect(await af("x", "/api/auth/me")).toBeNull();
  });
  it("les options invalidate et handleStatuses ne partent jamais au fetch", async () => {
    doFetch.mockResolvedValue(json({}));
    await af("x", "/api/x", { method: "POST", invalidate: false, handleStatuses: [409] });
    expect(doFetch.mock.calls[0]?.[1]).toEqual({ method: "POST" });
  });
});
