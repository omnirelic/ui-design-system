// @vitest-environment jsdom
// Adapté de web/src/admin/lib/__tests__/useAdminResource-live.test.tsx de Chez la Petite.
// CLP simule le socket (`connectRealtime`) et le debounce de `useAdminChanges` ; ici l'abonnement temps réel est injecté
// (`setAdminChangesHook`) : on vérifie ce que `useAdminResource` en dit (quelle ressource, relecture au signal), pas le socket.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const swrJson = vi.fn(async (_ctx: string, _url: string, cb: (d: unknown, stale: boolean) => void) => { cb([], false); return true; });
vi.mock("../src/web/state/swr-cache", () => ({ swrJson: (...a: Parameters<typeof swrJson>) => swrJson(...a) }));

import { useAdminResource } from "../src/web/state/useAdminResource";
import { setAdminChangesHook } from "../src/web/state/resource-config";

let subscribed: unknown[] = [];
let signal: (id?: string) => void = () => {};
beforeEach(() => {
  vi.clearAllMocks(); subscribed = [];
  setAdminChangesHook((resource, onChange) => { subscribed.push(resource); signal = onChange; });
});
afterEach(() => setAdminChangesHook(null));

function mount(url: string | null) {
  const root = createRoot(document.createElement("div"));
  const Probe = () => { useAdminResource("Test", url); return null; };
  act(() => root.render(createElement(Probe)));
  return () => act(() => root.unmount());
}

describe("useAdminResource — relecture en direct", () => {
  it("URL d'un domaine diffusé : abonnement à sa ressource, relecture au signal (sans le TTL)", async () => {
    const unmount = mount("/api/users");
    expect(subscribed.at(-1)).toBe("users");
    swrJson.mockClear();
    await act(async () => { signal("7"); });
    expect(swrJson).toHaveBeenCalledTimes(1);
    expect(swrJson.mock.calls[0]?.[3]).toMatchObject({ ttlMs: 0, useCache: false });
    unmount();
  });

  it("URL hors périmètre (analytics) : aucune ressource temps réel (null)", () => {
    mount("/api/analytics/summary");
    expect(subscribed.at(-1)).toBeNull();
  });

  it("sans hook injecté : aucun abonnement, aucune erreur (pas de poll de secours)", async () => {
    setAdminChangesHook(null);
    const unmount = mount("/api/users");
    expect(subscribed).toEqual([]);
    unmount();
  });
});
