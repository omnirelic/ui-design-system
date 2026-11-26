// @vitest-environment jsdom
// Tests miroir de web/src/admin/lib/__tests__/amounts-visibility.test.tsx de Chez la Petite : bouton « Afficher les montants », permanent, mémorisé sur l'appareil.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AMOUNTS_STORAGE_KEY, createAmountsVisibility } from "../src/web/amounts-visibility";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const KEY = "clp_admin_show_amounts"; // clé de CLP, reprise par `storageKey`
let root: Root; let host: HTMLElement;
// Instance neuve à chaque appel : l'état initial est relu depuis le stockage, comme à un rechargement de page.
const load = () => createAmountsVisibility({ storageKey: KEY });
function mount(mod: ReturnType<typeof load>) {
  const Probe = () => { const [v] = mod.useShowAmounts(); return createElement("span", { id: "v" }, String(v)); };
  act(() => { root.render(createElement(Probe)); });
}
const shown = () => host.querySelector("#v")!.textContent;

beforeEach(() => { localStorage.clear(); host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); });

describe("bouton « Afficher les montants » — permanent, mémorisé sur l'appareil", () => {
  it("éteint tant qu'on ne l'a jamais allumé", () => { mount(load()); expect(shown()).toBe("false"); });

  it("allumé : mémorisé, et retrouvé allumé après un rechargement", () => {
    const a = load();
    mount(a);
    act(() => a.setShowAmounts(true));
    expect(shown()).toBe("true");
    expect(localStorage.getItem(KEY)).toBe("1");
    act(() => root.unmount()); root = createRoot(host);
    mount(load());
    expect(shown()).toBe("true");
  });

  it("éteint de nouveau : mémorisé aussi", () => {
    const a = load();
    act(() => a.setShowAmounts(true));
    act(() => a.setShowAmounts(false));
    expect(localStorage.getItem(KEY)).toBe("0");
    mount(load());
    expect(shown()).toBe("false");
  });

  it("tous les écrans abonnés suivent le même état", () => {
    const a = load();
    mount(a);
    const other = document.createElement("div"); document.body.appendChild(other);
    const root2 = createRoot(other);
    act(() => { root2.render(createElement(() => createElement("b", { id: "w" }, String(a.useShowAmounts()[0])))); });
    act(() => a.setShowAmounts(true));
    expect(shown()).toBe("true");
    expect(other.querySelector("#w")!.textContent).toBe("true");
    act(() => root2.unmount()); other.remove();
  });

  it("un autre onglet change le réglage : celui-ci suit", () => {
    const a = load();
    mount(a);
    localStorage.setItem(KEY, "1");
    act(() => { window.dispatchEvent(new StorageEvent("storage", { key: KEY })); });
    expect(shown()).toBe("true");
  });

  it("stockage indisponible : aucune erreur, l'état tient jusqu'au rechargement", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const a = load();
    mount(a);
    expect(shown()).toBe("false");
    act(() => a.setShowAmounts(true));
    expect(shown()).toBe("true");
  });

  it("clé par défaut d'omnirelic distincte de celle de CLP", () => {
    expect(AMOUNTS_STORAGE_KEY).toBe("omni_admin_show_amounts");
    const a = createAmountsVisibility();
    act(() => a.setShowAmounts(true));
    expect(localStorage.getItem(AMOUNTS_STORAGE_KEY)).toBe("1");
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
