import { checkEntityGraph, codeLines, createEntityGraph, entityParams, findHandWrittenEntityLinks, handWrittenEntityLink } from "../web/entry-entity-graph";
import type { CatalogEntrySourceInterface } from "./types";

// Mini-graphe d'exemple (commande, client, livreur) : les exemples sont calculés, pas écrits. Le jeu complet de CLP sert de référence de test (test/fixtures).
const graph = createEntityGraph({
  defs: {
    order: { label: "Commande", view: "orders", param: "order", idIs: "id interne" },
    client: { label: "Client", view: "clients", param: "client", idIs: "id du profil", person: true },
    kitchen: { label: "Cuisine", view: "kitchens", param: null, pathId: true, idIs: "id du site" },
  },
  relations: [
    { a: "order", b: "client", ab: "Client", ba: "Commandes", via: "téléphone de la commande" },
    { a: "order", b: "kitchen", ab: "Cuisine", ba: "Commandes de la cuisine", via: "site de la commande" },
  ],
  viewPath: (view: string) => `/admin/${view}`,
});

export const ENTITES_ENTRIES: CatalogEntrySourceInterface[] = [
  {
    name: "createEntityGraph",
    group: "entites",
    kind: "function",
    examples: () => [
      { call: "entityPath('order', 'o-1')", result: graph.entityPath("order", "o-1") },
      { call: "entityPath('client', '+237686033861')", result: graph.entityPath("client", "+237686033861") },
      { call: "entityPath('kitchen', 's9')", result: graph.entityPath("kitchen", "s9") },
      { call: "entityPath('order', null)", result: graph.entityPath("order", null) },
      { call: "entityPath('order', 'o-1', { filter: 'late' })", result: graph.entityPath("order", "o-1", { filter: "late" }) },
      { call: "linksFrom('order').map(l => l.label)", result: graph.linksFrom("order").map((l) => l.label).join(", ") },
      { call: "linksFrom('client').map(l => l.label)", result: graph.linksFrom("client").map((l) => l.label).join(", ") },
    ],
  },
  {
    name: "checkEntityGraph",
    group: "entites",
    kind: "function",
    examples: () => [
      { call: "checkEntityGraph(graph)", result: JSON.stringify(checkEntityGraph(graph)) },
      { call: "checkEntityGraph(graph, { reservedParams: ['order'] })", result: JSON.stringify(checkEntityGraph(graph, { reservedParams: ["order"] })) },
    ],
  },
  { name: "entityParams", group: "entites", kind: "function", examples: () => [{ call: "entityParams(graph)", result: entityParams(graph).join(", ") }] },
  {
    name: "findHandWrittenEntityLinks",
    group: "entites",
    kind: "function",
    examples: () => [
      { call: "findHandWrittenEntityLinks(graph, [{ path: 'a.tsx', source: 'go(`/admin/orders?order=${id}`)' }])", result: JSON.stringify(findHandWrittenEntityLinks(graph, [{ path: "a.tsx", source: "go(`/admin/orders?order=${id}`)" }])) },
      { call: "findHandWrittenEntityLinks(graph, [{ path: 'a.tsx', source: '// ?order=<id>' }])", result: JSON.stringify(findHandWrittenEntityLinks(graph, [{ path: "a.tsx", source: "// ?order=<id>" }])) },
    ],
  },
  {
    name: "handWrittenEntityLink",
    group: "entites",
    kind: "function",
    examples: () => [{ call: "handWrittenEntityLink(graph)", result: String(handWrittenEntityLink(graph)) }],
  },
  { name: "codeLines", group: "entites", kind: "function", examples: () => [{ call: "codeLines('a // ?order=1\\nb')", result: JSON.stringify(codeLines("a // ?order=1\nb")) }] },
];
