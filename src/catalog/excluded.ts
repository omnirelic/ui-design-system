import type { CatalogExclusionInterface } from "./types";

const ROUTER = "Exige un routeur (react-router-dom) : montré via createQueryParamHooks, même logique avec un adaptateur en mémoire.";
const STORE = "État global du cache (IndexedDB, mémoire, cloisonnement par admin) : aucun rendu ni résultat pur à montrer ; couvert par test/swr-cache.test.ts.";
const NETWORK = "Appelle le réseau ou un branchement injecté par l'application : pas d'exemple sans réseau ; couvert par les tests miroir de Chez la Petite.";

/** Exports de valeur sans exemple possible. Un nouvel export doit avoir une entrée ou venir ici avec son motif. */
export const CATALOG_EXCLUDED: CatalogExclusionInterface[] = [
  { export: "useQueryParam", reason: ROUTER },
  { export: "useSetQueryParams", reason: ROUTER },
  { export: "useQueryParamItem", reason: ROUTER },
  { export: "setSwrScope", reason: STORE },
  { export: "readSwr", reason: STORE },
  { export: "writeSwr", reason: STORE },
  { export: "writeSwrThrottled", reason: STORE },
  { export: "clearSwrCache", reason: STORE },
  { export: "isFromCache", reason: "Lit l'en-tête d'une Response : sans réponse réelle, aucun exemple utile ; couvert par test/state-config.test.ts." },
  { export: "swrJson", reason: NETWORK },
  { export: "registerResource", reason: "Registre global des ressources montées : effet de bord sans rendu ; couvert par test/invalidation.test.ts." },
  { export: "invalidateAdminResource", reason: "Relit les ressources montées (réseau) : pas d'exemple sans ressource montée." },
  { export: "invalidateAfterWrite", reason: "Relit les ressources montées (réseau) : pas d'exemple sans ressource montée." },
  { export: "setLiveResourceRules", reason: "Réglage global injecté au démarrage de l'application : sans résultat propre." },
  { export: "createAdminFetch", reason: NETWORK },
  { export: "setAdminFetch", reason: "Branchement injecté au démarrage de l'application : sans résultat propre." },
  { export: "setAdminChangesHook", reason: "Branchement injecté au démarrage de l'application : sans résultat propre." },
  { export: "useAdminChanges", reason: NETWORK },
  { export: "useAdminResource", reason: NETWORK },
  { export: "useAdminData", reason: NETWORK },
  { export: "useSeededForm", reason: "Hook de formulaire alimenté par une ressource réseau : pas d'exemple sans ressource ; sémantique reprise de CLP." },
];
