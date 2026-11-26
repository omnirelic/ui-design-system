// @vitest-environment jsdom
// Branchement react-router-dom de la coque : liens du fil d'Ariane, fil d'Ariane de l'URL courante, vue courante, redirection des anciennes URL (effet d'AdminPage de CLP),
// section de rail dans l'URL (`useRailSection` de `/query-params`).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, useNavigationType, useSearchParams } from "react-router-dom";
import { AdminRouterLinks, ViewBreadcrumbs, useAdminLocation, useLegacyRedirect } from "../src/web/admin-shell-router";
import { AdminBreadcrumbs } from "../src/web/AdminBreadcrumbs";
import { useRailSection } from "../src/web/entry-query-params";
import { clpRegistry } from "./fixtures/clp-admin";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const r = clpRegistry();
let root: Root; let host: HTMLElement;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
let seq = 0;
const at = (url: string, el: ReactNode) => act(async () => { root.render(<MemoryRouter key={++seq} initialEntries={[url]}><AdminRouterLinks>{el}</AdminRouterLinks><Where /></MemoryRouter>); });
const Where = () => { const l = useLocation(); return <output data-where>{l.pathname + l.search + l.hash}</output>; };
const where = () => host.querySelector("[data-where]")?.textContent;

describe("liens et fil d'Ariane de l'URL", () => {
  it("un lien du fil d'Ariane navigue sans recharger (Link du routeur)", async () => {
    await at("/admin/orders/queue", <AdminBreadcrumbs crumbs={r.crumbsFor("queue")} visible />);
    const a = host.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("/admin/orders");
    await act(async () => { a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })); });
    expect(where()).toBe("/admin/orders");
  });
  it("ViewBreadcrumbs : fil de la vue de l'URL, avec la fiche ; rien pour une URL inconnue ; masqué par défaut", async () => {
    await at("/admin/orders", <ViewBreadcrumbs registry={r} entity={{ kind: "order", label: "#0726" }} visible />);
    expect(host.querySelector("nav")?.textContent).toBe("Opérations›Commandes›Commande #0726");
    await at("/admin/nimporte", <ViewBreadcrumbs registry={r} visible />);
    expect(host.querySelector("nav")).toBeNull();
    await at("/admin/orders", <ViewBreadcrumbs registry={r} />);
    expect(host.querySelector("nav")).toBeNull();
  });
});

describe("useAdminLocation", () => {
  const Show = ({ fallback }: { fallback: string }) => { const l = useAdminLocation(r, fallback); return <i data-loc>{JSON.stringify(l)}</i>; };
  it("vue, identifiant de page pleine, repli", async () => {
    await at("/admin/partners/p1", <Show fallback="documents" />);
    expect(host.querySelector("[data-loc]")?.textContent).toBe('{"view":"edit","id":"p1"}');
    await at("/admin/inconnu", <Show fallback="documents" />);
    expect(host.querySelector("[data-loc]")?.textContent).toBe('{"view":"documents","id":null}');
  });
});

describe("useLegacyRedirect", () => {
  const seen: boolean[] = []; const types: string[] = [];
  const Probe = () => { const redirecting = useLegacyRedirect(r); seen.push(redirecting); types.push(useNavigationType()); return redirecting ? null : <p data-page>page</p>; };
  const app = (<Routes><Route path="*" element={<Probe />} /></Routes>);
  it("ancienne URL : remplacée par la nouvelle, query et hash conservés, rien affiché le temps du remplacement", async () => {
    await at("/admin/commandes?order=12#haut", app);
    expect(where()).toBe("/admin/orders?order=12#haut");
    expect(host.querySelector("[data-page]")).not.toBeNull();
  });
  it("la query de la cible est fusionnée avec celle de l'URL entrante (l'entrante gagne)", async () => {
    await at("/admin/forfaits-portefeuille?x=1", app);
    expect(where()).toBe("/admin/system/settings?group=wallet&x=1");
  });
  it("le premier rendu signale la redirection en cours (rien à afficher), le suivant plus ; la navigation REMPLACE l'entrée d'historique", async () => {
    seen.length = 0; types.length = 0;
    await at("/admin/commandes", app);
    expect(seen[0]).toBe(true);
    expect(seen[seen.length - 1]).toBe(false);
    expect(types[types.length - 1]).toBe("REPLACE");
  });
  it("chemin actuel : aucune redirection ; remplacement (pas d'entrée d'historique en plus)", async () => {
    await at("/admin/orders?a=1", app);
    expect(where()).toBe("/admin/orders?a=1");
    expect(host.querySelector("[data-page]")).not.toBeNull();
  });
});

describe("useRailSection (sous-chemin /query-params)", () => {
  const items = [{ key: "a" as const, label: "A" }, { key: "b" as const, label: "B" }];
  const Probe = () => {
    const [v, set] = useRailSection("section", items);
    const [params] = useSearchParams();
    return <><i data-v>{v}</i><i data-q>{params.toString()}</i><button onClick={() => set("b")}>b</button><button id="a" onClick={() => set("a")}>a</button></>;
  };
  it("lit `?section=`, valeur inconnue → première section, la première n'écrit rien, les autres s'écrivent en conservant le reste de l'URL", async () => {
    await at("/x?section=zzz&autre=1", <Probe />);
    expect(host.querySelector("[data-v]")?.textContent).toBe("a");
    await act(async () => { host.querySelectorAll("button")[0].dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(host.querySelector("[data-v]")?.textContent).toBe("b");
    expect(host.querySelector("[data-q]")?.textContent).toBe("section=b&autre=1");
    await act(async () => { host.querySelector("#a")!.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(host.querySelector("[data-q]")?.textContent).toBe("autre=1");
  });
});
