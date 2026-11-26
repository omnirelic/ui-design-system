// Manifeste de catalogue de @omnirelic/ui-design-system (sous-chemin `@omnirelic/ui-design-system/catalog`).
// Une entrée par export public (racine et sous-chemin /phone), ou une exclusion motivée : test/catalog-rules.test.ts l'impose.
// Le sous-chemin /native (React Native) n'a pas de rendu DOM : hors catalogue.
import { BRIQUES_ENTRIES } from "./entries-briques";
import { BOUTONS_ENTRIES } from "./entries-boutons";
import { CHAMPS_ENTRIES } from "./entries-champs";
import { MARQUE_ENTRIES } from "./entries-marque";
import { PASTILLES_ENTRIES } from "./entries-pastilles";
import { SURFACES_ENTRIES } from "./entries-surfaces";
import { TOKENS_ENTRIES } from "./entries-tokens";
import { CATALOG_EXCLUDED } from "./excluded";
import { PACKAGE_VERSION, SIGNATURES } from "./generated";
import type { CatalogEntryInterface, CatalogManifestInterface } from "./types";

export { CATALOG_FIXTURES } from "./fixtures";
export type * from "./types";

const GROUPS = [
  { id: "tokens", label: "Tokens" },
  { id: "boutons", label: "Boutons" },
  { id: "pastilles", label: "Pastilles" },
  { id: "champs", label: "Champs" },
  { id: "surfaces", label: "Surfaces" },
  { id: "marque", label: "Marque" },
  { id: "retours", label: "Retours" },
  { id: "icones", label: "Icônes" },
];

const entries: CatalogEntryInterface[] = [
  ...TOKENS_ENTRIES,
  ...BOUTONS_ENTRIES,
  ...PASTILLES_ENTRIES,
  ...CHAMPS_ENTRIES,
  ...SURFACES_ENTRIES,
  ...MARQUE_ENTRIES,
  ...BRIQUES_ENTRIES,
].map((e) => ({ ...e, status: "exists", signature: SIGNATURES[e.name] ?? "" }));

export const CATALOG: CatalogManifestInterface = {
  package: "@omnirelic/ui-design-system",
  version: PACKAGE_VERSION,
  groups: GROUPS,
  entries,
  excluded: CATALOG_EXCLUDED,
};
