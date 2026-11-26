// @vitest-environment jsdom
// Test miroir de web/src/admin/lib/__tests__/useAdminResource-url-switch.test.tsx de Chez la Petite (mêmes cas, mêmes assertions).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Réponse pilotée à la main, par URL : on décide quand (et dans quel ordre) chaque lecture aboutit.
const replies: Record<string, (data: unknown) => void> = {};
vi.mock("../src/web/state/swr-cache", () => ({
  swrJson: vi.fn((_ctx: string, url: string, apply: (d: unknown, stale: boolean) => void) => new Promise<boolean>(resolve => { replies[url] = d => { apply(d, false); resolve(true); }; })),
}));
import { useAdminResource, type AdminResource } from "../src/web/state/useAdminResource";

let root: Root | null = null;
let latest: AdminResource<string> | null = null;
let seen: (string | undefined)[] = [];
const Probe = ({ url }: { url: string | null }) => { const r = useAdminResource<string>("Test", url); latest = r; seen.push(r.data); return null; };
const render = (url: string | null) => act(() => root!.render(createElement(Probe, { url })));
const reply = (url: string, data: string) => act(async () => { replies[url](data); await Promise.resolve(); });

beforeEach(() => { root = createRoot(document.createElement("div")); latest = null; seen = []; for (const k of Object.keys(replies)) delete replies[k]; });
afterEach(() => { act(() => root?.unmount()); root = null; });

describe("useAdminResource — changement d'URL", () => {
  it("la donnée de l'ANCIENNE url n'est jamais lisible sous la nouvelle, pas même pendant le rendu du changement", async () => {
    render("/api/clients/A");
    await reply("/api/clients/A", "donnée de A");
    expect(latest!.data).toBe("donnée de A");

    seen = [];
    render("/api/clients/B");
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every(d => d === undefined)).toBe(true);
    expect(latest!.loading).toBe(true);

    await reply("/api/clients/B", "donnée de B");
    expect(latest!.data).toBe("donnée de B");
    expect(seen).not.toContain("donnée de A");
  });

  it("la réponse EN RETARD de l'ancienne url ne s'affiche pas sous la nouvelle", async () => {
    render("/api/clients/A");
    render("/api/clients/B");
    await reply("/api/clients/A", "A arrivée trop tard");
    expect(latest!.data).toBeUndefined();
    expect(seen).not.toContain("A arrivée trop tard");
    await reply("/api/clients/B", "donnée de B");
    expect(latest!.data).toBe("donnée de B");
  });

  it("url null : aucune donnée, pas de chargement", async () => {
    render("/api/clients/A");
    await reply("/api/clients/A", "donnée de A");
    render(null);
    expect(latest!.data).toBeUndefined();
    expect(latest!.loading).toBe(false);
  });

  it("setData (mise à jour optimiste) reste fonctionnel, y compris avant la première réponse", async () => {
    render("/api/clients/A");
    act(() => latest!.setData("optimiste"));
    expect(latest!.data).toBe("optimiste");
    await reply("/api/clients/A", "serveur");
    expect(latest!.data).toBe("serveur");
    act(() => latest!.setData(prev => `${prev}+local`));
    expect(latest!.data).toBe("serveur+local");
  });
});
