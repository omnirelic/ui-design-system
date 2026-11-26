// ── Règle stricte : un lien vers une entité passe par le graphe (zéro tolérance) ──
// Reprise de web/src/rules/entity-links.rules.test.ts de CLP : le détecteur est `findHandWrittenEntityLinks` (rendu réutilisable : l'application
// lit ses propres fichiers et attend `[]`). Ici : (1) le détecteur sur les cas de CLP, (2) la règle appliquée au code du paquet avec les paramètres du jeu de CLP.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { codeLines, findHandWrittenEntityLinks, handWrittenEntityLink } from "../src/web/entity-graph";
import { clpGraph } from "./fixtures/clp-entities";

// Catalogue : exemples de `withQueryParam` (texte affiché, aucun lien) ; le graphe lui-même : seul endroit où le motif apparaît.
const ROOT = join(__dirname, "..");
const LINK = handWrittenEntityLink(clpGraph);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return files(p);
    return /\.tsx?$/.test(n) ? [p] : [];
  });
}

describe("règles strictes — liens d'entités", () => {
  it("aucun lien `?<param>=` écrit à la main dans le code du paquet : entityPath() ou un composant d'entité", () => {
    const sources = files(join(ROOT, "src")).map((f) => ({ path: f.slice(ROOT.length + 1), source: readFileSync(f, "utf8") }));
    const offenders = findHandWrittenEntityLinks(clpGraph, sources, [/src\/web\/entity-graph\.ts$/, /src\/catalog\//]);
    expect(offenders, `liens à remplacer par graph.entityPath(kind, id) :\n${offenders.join("\n")}`).toEqual([]);
  });

  it("le détecteur reconnaît un lien écrit à la main, pas un commentaire", () => {
    const hit = (src: string) => codeLines(src).some((l) => LINK.test(l));
    expect(hit("navigate(`/admin/orders?order=${id}`);")).toBe(true);
    expect(hit("const u = '/admin/clients?client=' + key;")).toBe(true);
    expect(hit("// ouvre ?order=<id>")).toBe(false);
    expect(hit("/* ?client=x */ const a = 1;")).toBe(false);
  });

  it("findHandWrittenEntityLinks : chemin:ligne, fichiers autorisés ignorés", () => {
    const f = [{ path: "src/a.tsx", source: "ok\nconst u = `/admin/orders?order=${id}`;" }, { path: "src/__tests__/a.test.ts", source: "'?order=1'" }, { path: "src/shell/entity-graph.ts", source: "'?order='" }];
    expect(findHandWrittenEntityLinks(clpGraph, f, [/\/__tests__\//, /entity-graph\.ts$/])).toEqual(["src/a.tsx:2  const u = `/admin/orders?order=${id}`;"]);
    expect(findHandWrittenEntityLinks(clpGraph, f)).toHaveLength(3);
  });
});
