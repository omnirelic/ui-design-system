import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { CATALOG, CATALOG_FIXTURES } from "../src/catalog";

describe("catalogue — exemples", () => {
  const calls: string[] = [];
  const realFetch = globalThis.fetch;
  beforeAll(() => {
    globalThis.fetch = ((url: string) => {
      calls.push(String(url));
      return Promise.reject(new Error("réseau interdit"));
    }) as typeof fetch;
  });
  afterAll(() => {
    globalThis.fetch = realFetch;
  });

  it("chaque variante × état se rend sans erreur, sans réseau ni horloge globale", () => {
    const dateNow = vi.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("Date.now");
    });
    const failures: string[] = [];
    for (const e of CATALOG.entries) {
      if (!e.render) continue;
      for (const v of e.variants ?? [{ id: "" }]) {
        for (const s of e.states ?? [{ id: "" }]) {
          try {
            const html = renderToStaticMarkup(<div>{e.render(v.id, s.id, CATALOG_FIXTURES)}</div>);
            if (html.length < 12) failures.push(`${e.name} ${v.id}/${s.id} : rendu vide`);
          } catch (err) {
            failures.push(`${e.name} ${v.id}/${s.id} : ${(err as Error).message}`);
          }
        }
      }
    }
    dateNow.mockRestore();
    expect(failures).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("les exemples calculés répondent, sont non vides et déterministes", () => {
    const failures: string[] = [];
    for (const e of CATALOG.entries) {
      if (!e.examples) continue;
      const out = e.examples(CATALOG_FIXTURES);
      if (!out.length || out.some((x) => !x.call || x.result === undefined)) failures.push(e.name);
      expect(e.examples(CATALOG_FIXTURES)).toEqual(out);
    }
    expect(failures).toEqual([]);
  });

  it("tokens introspectés : les couleurs rendues sont celles du paquet", () => {
    const entry = CATALOG.entries.find((e) => e.name === "colors")!;
    const html = renderToStaticMarkup(<div>{entry.render!("", "", CATALOG_FIXTURES)}</div>);
    expect(html).toContain("#5eead4");
    expect(html).toContain("accent");
  });

  it("valeurs connues : compteur plafonné et statut inconnu neutre", () => {
    const get = (n: string) => CATALOG.entries.find((e) => e.name === n)!.examples!(CATALOG_FIXTURES);
    expect(get("formatCount").find((x) => x.call === "formatCount(100)")!.result).toBe("99+");
    expect(get("statusTone").find((x) => x.call.includes("inconnu"))!.result).toBe("neutral");
  });
});
