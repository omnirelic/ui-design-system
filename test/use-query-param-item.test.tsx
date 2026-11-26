// @vitest-environment jsdom
// Test miroir de web/src/admin/lib/__tests__/useQueryParamItem.test.tsx de Chez la Petite (mêmes cas, mêmes assertions).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { useQueryParamItem } from "../src/web/state/query-params";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface Row { id: number; name: string }
let api: { item: Row | null; open: (r: Row | null) => void; search: string };

function Probe({ items, legacy }: { items: Row[]; legacy?: boolean }) {
  const [item, open] = useQueryParamItem("agent", items, r => String(r.id), legacy ? r => [r.name] : undefined);
  api = { item, open, search: useLocation().search };
  return null;
}

let root: Root; let host: HTMLElement;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = (url: string, items: Row[], legacy?: boolean) =>
  act(() => root.render(createElement(MemoryRouter, { initialEntries: [url] }, createElement(Probe, { items, legacy }))));

const rows: Row[] = [{ id: 1, name: "A" }, { id: 2, name: "B" }];

describe("useQueryParamItem", () => {
  it("rouvre l'élément désigné par l'URL", () => {
    render("/x?agent=2", rows);
    expect(api.item?.name).toBe("B");
  });
  it("ignore un id inconnu sans planter", () => {
    render("/x?agent=999", rows);
    expect(api.item).toBeNull();
  });
  it("ouvrir / fermer fusionne avec les autres paramètres", () => {
    render("/x?section=links", rows);
    act(() => api.open(rows[0]));
    expect(api.item?.id).toBe(1);
    expect(api.search).toBe("?section=links&agent=1");
    act(() => api.open(null));
    expect(api.item).toBeNull();
    expect(api.search).toBe("?section=links");
  });
  it("garde l'instantané quand la liste est rechargée", () => {
    render("/x?agent=1", rows);
    const first = api.item;
    render("/x?agent=1", rows.map(r => ({ ...r })));
    expect(api.item).toBe(first);
  });
  it("reconnaît un ancien identifiant et réécrit l'URL avec l'identifiant courant", () => {
    render("/x?section=links&agent=B", rows, true);
    expect(api.item?.id).toBe(2);
    expect(api.search).toBe("?section=links&agent=2");
  });
  it("sans anciens identifiants déclarés, un id périmé reste inconnu", () => {
    render("/x?agent=B", rows);
    expect(api.item).toBeNull();
    expect(api.search).toBe("?agent=B");
  });
});
