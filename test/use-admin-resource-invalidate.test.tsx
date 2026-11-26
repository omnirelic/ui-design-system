// @vitest-environment jsdom
// Test miroir de web/src/admin/lib/__tests__/useAdminResource-invalidate.test.tsx de Chez la Petite (mêmes cas, mêmes assertions).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const swrJson = vi.fn(async (_ctx: string, _url: string, cb: (d: unknown, stale: boolean) => void, _opts?: { ttlMs?: number }) => { cb([], false); return true; });
vi.mock("../src/web/state/swr-cache", () => ({ swrJson: (...a: Parameters<typeof swrJson>) => swrJson(...a) }));

import { useAdminResource, invalidateAdminResource } from "../src/web/state/useAdminResource";
import { invalidateAfterWrite } from "../src/web/state/invalidation";

function mount(url: string | null) {
  const root = createRoot(document.createElement("div"));
  const Probe = () => { useAdminResource("Test", url); return null; };
  act(() => root.render(createElement(Probe)));
  return () => act(() => root.unmount());
}
beforeEach(() => { swrJson.mockClear(); }); // pas de retour : vitest le prendrait pour une fonction de nettoyage

describe("useAdminResource — relecture après écriture", () => {
  it("invalidateAdminResource(prefixe) relit la ressource montée (c'était un no-op : la liste restait périmée)", async () => {
    const unmount = mount("/api/menu/purchase-lists");
    expect(swrJson).toHaveBeenCalledTimes(1);
    await act(async () => { invalidateAdminResource("/api/menu/purchase-lists"); });
    expect(swrJson).toHaveBeenCalledTimes(2);
    expect(swrJson.mock.calls[1]?.[3]).toMatchObject({ ttlMs: 0 }); // ignore le TTL : lecture réelle
    unmount();
  });
  it("une écriture sur la fiche relit la liste ; un autre domaine non", async () => {
    const unmount = mount("/api/menu/purchase-lists");
    await act(async () => { invalidateAfterWrite("/api/menu/purchase-lists/pl1?action=publish"); });
    expect(swrJson).toHaveBeenCalledTimes(2);
    await act(async () => { invalidateAfterWrite("/api/menu/items/i1"); });
    expect(swrJson).toHaveBeenCalledTimes(2);
    unmount();
  });
  it("démontée, la ressource ne se relit plus ; url null : jamais", async () => {
    mount("/api/menu/purchase-lists")();
    mount(null);
    swrJson.mockClear();
    await act(async () => { invalidateAdminResource("/api"); });
    expect(swrJson).not.toHaveBeenCalled();
  });
});
