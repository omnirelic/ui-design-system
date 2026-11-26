// @vitest-environment jsdom
// Nouveau (pas dans CLP) : les hooks fonctionnent avec un adaptateur injecté, sans routeur ni react-router-dom.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement, useSyncExternalStore } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createQueryParamHooks, type QueryParamsAdapter, type SetQueryParams } from "../src/web/state/query-params-core";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Adaptateur de test : l'URL est un petit store partagé par tous les appels du hook (comme l'URL du navigateur), le setter reçoit
// la fonction « à partir de la précédente » comme celui de react-router.
function memoryParams(initial: string): QueryParamsAdapter {
  let search = initial;
  const listeners = new Set<() => void>();
  const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
  const set: SetQueryParams = (update) => { search = update(new URLSearchParams(search)).toString(); listeners.forEach(l => l()); };
  return () => [new URLSearchParams(useSyncExternalStore(subscribe, () => search, () => search)), set] as const;
}

interface Row { id: number; name: string }
const rows: Row[] = [{ id: 1, name: "A" }, { id: 2, name: "B" }];
let api: { tab: string | null; setTab: (v: string | null) => void; patch: (p: Record<string, string | null>) => void; item: Row | null; open: (r: Row | null) => void; search: string };

let root: Root; let host: HTMLElement;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

function mount(initial: string) {
  const useParams = memoryParams(initial);
  const { useQueryParam, useSetQueryParams, useQueryParamItem } = createQueryParamHooks(useParams);
  const Probe = () => {
    const [tab, setTab] = useQueryParam("tab");
    const patch = useSetQueryParams();
    const [item, open] = useQueryParamItem("item", rows, r => String(r.id));
    const [params] = useParams();
    api = { tab, setTab, patch, item, open, search: params.toString() };
    return null;
  };
  act(() => root.render(createElement(Probe)));
}

describe("createQueryParamHooks — adaptateur injecté", () => {
  it("lit la valeur de l'URL ; une clé absente donne null", () => {
    mount("tab=b");
    expect(api.tab).toBe("b");
    expect(api.item).toBeNull();
  });
  it("écrire une clé fusionne avec les autres paramètres, null la retire", () => {
    mount("section=links");
    act(() => api.setTab("b"));
    expect(api.search).toBe("section=links&tab=b");
    act(() => api.setTab(null));
    expect(api.search).toBe("section=links");
  });
  it("useSetQueryParams : plusieurs clés en une seule mise à jour, aucune n'écrase l'autre", () => {
    mount("keep=1&tab=old");
    act(() => api.patch({ tab: "new", item: "2", gone: null }));
    expect(api.search).toBe("keep=1&tab=new&item=2");
    expect(api.item?.name).toBe("B");
  });
  it("valeur inconnue = défaut : l'élément reste null, l'URL n'est pas touchée", () => {
    mount("item=999");
    expect(api.item).toBeNull();
    expect(api.search).toBe("item=999");
  });
});
