// @vitest-environment jsdom
// Tests miroir de MaskedPhone-copy.test.tsx et phone-ref.test.tsx de Chez la Petite : copie du numéro affiché (superadmin : le numéro en clair, les autres : copie native), PhoneRef.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MaskedPhone } from "../src/web/MaskedPhone";
import { PhoneRef } from "../src/web/PhoneRef";
import { PhoneRevealProvider, createPhoneReveal } from "../src/web/phone-reveal";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root; let host: HTMLElement;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

describe("MaskedPhone — copie du numéro affiché", () => {
  const writeText = vi.fn(() => Promise.resolve());
  const transport = vi.fn(async (_label: string, _url: string, _init: object) => new Response(JSON.stringify({ phone: "+237690000011" }), { status: 200, headers: { "content-type": "application/json" } }));
  beforeEach(() => { Object.assign(navigator, { clipboard: { writeText } }); writeText.mockClear(); transport.mockClear(); });
  const copy = async () => {
    const ev = new Event("copy", { bubbles: true, cancelable: true });
    await act(async () => { host.querySelector("span[tabindex]")!.dispatchEvent(ev); await new Promise((r) => setTimeout(r, 0)); });
    return ev;
  };
  const mount = (role: string) => {
    const reveal = createPhoneReveal({ transport });
    reveal.setViewer({ role });
    act(() => root.render(<PhoneRevealProvider value={reveal}><MaskedPhone phone="+237 ORANGE 11" profileId="p1" /></PhoneRevealProvider>));
  };

  it("superadmin : le presse-papiers reçoit le numéro en clair (un appel « copy »), jamais le masqué", async () => {
    mount("superadmin");
    const ev = await copy();
    expect(ev.defaultPrevented).toBe(true);
    expect(transport.mock.calls[0][1]).toContain("/api/support/profiles/p1/phone-reveal?purpose=copy");
    expect(writeText).toHaveBeenCalledWith("+237690000011");
    expect(host.textContent).not.toContain("690000011");
  });
  it("autre rôle : copie native inchangée, aucun appel", async () => {
    mount("admin");
    expect(host.querySelector("span[tabindex]")).toBeNull(); // pas de survol de révélation : strictement le rendu masqué
    expect(transport).not.toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();
  });
  it("révélation refusée à la copie : rien n'est copié plutôt que le masqué", async () => {
    transport.mockResolvedValueOnce(new Response("{}", { status: 403 }));
    mount("superadmin");
    await copy();
    expect(writeText).not.toHaveBeenCalled();
  });
});

describe("PhoneRef — le numéro d'un client, pastille qui ouvre la conversation", () => {
  const onOpen = vi.fn();
  beforeEach(() => onOpen.mockReset());
  const render = (props: { phone: string | null | undefined; orderId?: string | null; profileId?: string | null }) => act(() => root.render(<PhoneRef {...props} onOpen={onOpen} />));

  it("le numéro masqué (jamais en clair), « Conversation », et aucun lien d'appel", () => {
    render({ phone: "+237691000019" });
    expect(host.textContent).toContain("ORANGE19");
    expect(host.textContent).not.toContain("691 00");
    expect(host.textContent).toContain("Conversation");
    expect(host.querySelector("a")).toBeNull();
    expect(host.innerHTML).not.toContain("tel:");
  });
  it("le clic ouvre la conversation du numéro (jamais un lien wa.me)", () => {
    render({ phone: "691000019", orderId: "742" });
    act(() => { host.querySelector<HTMLButtonElement>("button")!.click(); });
    expect(onOpen).toHaveBeenCalledWith({ phone: "691000019", orderId: "742" });
    expect(host.innerHTML).not.toContain("wa.me");
  });
  it("un profil suffit : le fil s'ouvre sans numéro exploitable", () => {
    render({ phone: "+237 ORANGE 19", profileId: "p7" });
    act(() => { host.querySelector<HTMLButtonElement>("button")!.click(); });
    expect(onOpen).toHaveBeenCalledWith({ phone: "+237 ORANGE 19", profileId: "p7" });
  });
  it("numéro masqué ou inexploitable : du texte, ni bouton ni lien (rien à ouvrir)", () => {
    render({ phone: "+237 6•• •• 12 34" });
    expect(host.querySelector("button")).toBeNull();
    expect(host.querySelector("a")).toBeNull();
  });
  it("sans numéro : rien du tout", () => {
    render({ phone: null });
    expect(host.innerHTML).toBe("");
  });
  it("le bouton est nommé pour les lecteurs d'écran, sans infobulle qui répète « Conversation »", () => {
    render({ phone: "691000019" });
    const b = host.querySelector("button")!;
    expect(b.getAttribute("aria-label")).toBe("Ouvrir la conversation");
    expect(b.getAttribute("title")).toBeNull();
  });
});
