// Tests miroir de web/src/admin/lib/__tests__/phone-reveal.test.ts de Chez la Petite : révélation superadmin seulement, à la demande ; appeler / copier par rôle.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PhoneAccessRequired, createPhoneReveal } from "../src/web/phone-reveal";

const reply = (phone = "+237690000011", status = 200) => new Response(JSON.stringify({ phone }), { status, headers: { "content-type": "application/json" } });
const make = () => {
  const transport = vi.fn(async (_label: string, _url: string, _init: { method: "POST"; handleStatuses?: number[] }) => reply());
  return { transport, reveal: createPhoneReveal({ transport }) };
};
const urls = (t: ReturnType<typeof make>["transport"]) => t.mock.calls.map((c) => c[1]);

describe("phone-reveal — superadmin seulement, à la demande", () => {
  let k: ReturnType<typeof make>;
  beforeEach(() => { k = make(); });

  it("tout autre rôle : aucun appel, rien à montrer", async () => {
    for (const role of ["admin", "support", "ops", "finance"]) {
      k.reveal.setViewer({ role, roles: [role] });
      expect(await k.reveal.revealPhone("p1")).toBeNull();
    }
    expect(k.transport).not.toHaveBeenCalled();
  });
  it("superadmin : un POST par survol, numéro mis en forme lisible", async () => {
    k.reveal.setViewer({ role: "superadmin", roles: ["superadmin"] });
    expect(await k.reveal.revealPhone("p1")).toBe("+237 690 00 00 11");
    expect(k.transport.mock.calls[0][1]).toBe("/api/support/profiles/p1/phone-reveal");
    expect(k.transport.mock.calls[0][2].method).toBe("POST");
  });
  it("un numéro précis du profil : l'identifiant est relayé", async () => {
    k.reveal.setViewer({ role: "superadmin" });
    await k.reveal.revealPhone("p1", "i 1");
    expect(urls(k.transport)[0]).toBe("/api/support/profiles/p1/phone-reveal?identifier=i%201");
  });
  it("cache court : le second survol ne rappelle pas, au-delà de 30 s oui", async () => {
    k.reveal.setViewer({ role: "superadmin" });
    let t = 1_000;
    await k.reveal.revealPhone("p1", null, () => t);
    t += 10_000;
    await k.reveal.revealPhone("p1", null, () => t);
    expect(k.transport).toHaveBeenCalledTimes(1);
    t += 25_000;
    await k.reveal.revealPhone("p1", null, () => t);
    expect(k.transport).toHaveBeenCalledTimes(2);
  });
  it("deux survols simultanés : un seul appel", async () => {
    k.reveal.setViewer({ role: "superadmin" });
    await Promise.all([k.reveal.revealPhone("p1"), k.reveal.revealPhone("p1")]);
    expect(k.transport).toHaveBeenCalledTimes(1);
  });
  it("refus du serveur : pas de numéro", async () => {
    k.reveal.setViewer({ role: "superadmin" });
    k.transport.mockResolvedValueOnce(new Response("{}", { status: 403 }));
    expect(await k.reveal.revealPhone("p9")).toBeNull();
  });
  it("perdre le rôle superadmin vide le cache", async () => {
    k.reveal.setViewer({ role: "superadmin" });
    await k.reveal.revealPhone("p1");
    k.reveal.setViewer({ role: "admin" });
    k.reveal.setViewer({ role: "superadmin" });
    await k.reveal.revealPhone("p1");
    expect(k.transport).toHaveBeenCalledTimes(2);
  });
});

describe("fetchPhoneFor — appeler / copier", () => {
  let k: ReturnType<typeof make>;
  beforeEach(() => { k = make(); });

  it("autres rôles : « voir » ne part jamais ; appeler et copier partent (seul un accès accordé sur demande les ouvre, le serveur tranche)", async () => {
    for (const role of ["ops", "support", "finance", "marketing", "dev", "stock_manager"]) {
      k.reveal.setViewer({ role, roles: [role] });
      expect(await k.reveal.fetchPhoneFor("view", "p1")).toBeNull();
    }
    expect(k.transport).not.toHaveBeenCalled();
    k.reveal.setViewer({ role: "ops", roles: ["ops"] });
    expect(await k.reveal.fetchPhoneFor("call", "p1")).toBe("+237690000011");
    expect(await k.reveal.fetchPhoneFor("copy", "p1")).toBe("+237690000011");
    expect(urls(k.transport)).toEqual(["/api/support/profiles/p1/phone-reveal?purpose=call", "/api/support/profiles/p1/phone-reveal?purpose=copy"]);
  });
  it("autre rôle sans accès en cours : le 403 lève PhoneAccessRequired (la demande s'ouvre), jamais de numéro", async () => {
    k.reveal.setViewer({ role: "support", roles: ["support"] });
    k.transport.mockResolvedValueOnce(reply("", 403));
    await expect(k.reveal.fetchPhoneFor("call", "p1")).rejects.toBeInstanceOf(PhoneAccessRequired);
    expect(k.transport.mock.calls[0][2].handleStatuses).toEqual([403]);
  });
  it("un 403 pour un admin n'est pas une demande d'accès (il n'en a pas besoin)", async () => {
    k.reveal.setViewer({ role: "admin", roles: ["admin"] });
    k.transport.mockResolvedValueOnce(reply("", 403));
    expect(await k.reveal.fetchPhoneFor("call", "p1")).toBeNull();
  });
  it("admin : call et copy passent (POST avec le motif), view jamais appelé", async () => {
    k.reveal.setViewer({ role: "admin", roles: ["admin"] });
    expect(await k.reveal.fetchPhoneFor("view", "p1")).toBeNull();
    expect(k.transport).not.toHaveBeenCalled();
    expect(await k.reveal.fetchPhoneFor("call", "p1")).toBe("+237690000011");
    expect(urls(k.transport)[0]).toBe("/api/support/profiles/p1/phone-reveal?purpose=call");
  });
  it("superadmin : les trois motifs, jamais de cache (chaque action est journalisée)", async () => {
    k.reveal.setViewer({ role: "superadmin", roles: ["superadmin"] });
    await k.reveal.fetchPhoneFor("copy", "p1");
    await k.reveal.fetchPhoneFor("copy", "p1");
    await k.reveal.fetchPhoneFor("view", "p1");
    expect(k.transport).toHaveBeenCalledTimes(3);
  });
  it("réponse inattendue : null", async () => {
    k.reveal.setViewer({ role: "admin", roles: ["admin"] });
    k.transport.mockResolvedValueOnce(reply("abc"));
    expect(await k.reveal.fetchPhoneFor("call", "p1")).toBeNull();
  });
  it("chemin remplaçable", async () => {
    const transport = vi.fn(async () => reply());
    const reveal = createPhoneReveal({ transport, buildUrl: (id, q) => `/x/${id}?${q}` });
    reveal.setViewer({ role: "admin" });
    await reveal.fetchPhoneFor("call", "p1");
    expect(transport.mock.calls[0]).toEqual(["Révéler le numéro", "/x/p1?purpose=call", { method: "POST", handleStatuses: [403] }]);
  });
  it("sans fournisseur ni transport : rien ne se révèle", async () => {
    const reveal = createPhoneReveal({ transport: async () => null });
    reveal.setViewer({ role: "superadmin" });
    expect(await reveal.revealPhone("p1")).toBeNull();
    expect(await reveal.fetchPhoneFor("copy", "p1")).toBeNull();
  });
});
