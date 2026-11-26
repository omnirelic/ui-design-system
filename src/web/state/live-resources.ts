// Même liste que ADMIN_RESOURCES de l'engine de CLP et ADMIN_CHANGED_RESOURCES du relais serverless (test de parité côté CLP, non porté).
export const ADMIN_CHANGE_RESOURCES = [
  "drafts", "devices", "orders", "users", "partners", "stores", "delivery", "support", "documents", "jobs", "influencers", "catalog", "settings", "wa_groups", "samira", "access_grants",
] as const;
export type AdminChangeResource = (typeof ADMIN_CHANGE_RESOURCES)[number];

// URL d'une ressource admin → ressource temps réel qui la fait relire. Source unique : `useAdminResource`
// s'abonne tout seul, aucune vue n'a à brancher `useAdminChanges` à la main. La contrepartie serveur est
// `relayWritesToEngine(req, res, <ressource>)` dans le handler qui sert cette URL (api/*.ts) — les deux
// vont ensemble : une URL ici sans relais côté handler ne se rafraîchirait jamais.
const END = String.raw`(?:[/?]|$)`;
export type LiveResourceRule = readonly [RegExp, AdminChangeResource];
/** Règles de Chez la Petite, reprises telles quelles (défaut). */
export const CLP_LIVE_RESOURCE_RULES: readonly LiveResourceRule[] = [
  [new RegExp(String.raw`^/api/orders/drafts?${END}`), "drafts"], // les paniers notifient `drafts` eux-mêmes
  [new RegExp(String.raw`^/api/orders${END}`), "orders"],
  [new RegExp(String.raw`^/api/(?:users|roles|abuse|agent)${END}`), "users"],
  [new RegExp(String.raw`^/api/(?:stores|kiosks|service-catalog)${END}`), "stores"],
  [new RegExp(String.raw`^/api/partners${END}`), "partners"],
  [new RegExp(String.raw`^/api/devices${END}`), "devices"], // écrites dans l'engine : annoncées par son bus de domaine
  [new RegExp(String.raw`^/api/(?:couriers|locations|bags|vehicles|checkpoints|promo|wallet|package-print-jobs|print)${END}`), "delivery"],
  [new RegExp(String.raw`^/api/support/access-grants${END}`), "access_grants"], // accès temporaires : l'engine pousse l'accord, le refus et le retrait
  // Les fils de la boîte (conversations) ont leur propre événement socket (`conversation_update`) : pas d'abonnement générique, donc pas de filet périodique.
  [new RegExp(String.raw`^/api/support(?!/conversations${END})${END}`), "support"],
  [new RegExp(String.raw`^/api/(?:documents|pages|emails)${END}`), "documents"],
  [new RegExp(String.raw`^/api/jobs${END}`), "jobs"],
  [new RegExp(String.raw`^/api/influencers${END}`), "influencers"],
  // Tout le Catalogue admin (plats, catégories, ingrédients, stock, fiches d'achat, emballages, variations, conformité…) : api/menu.ts relaie TOUTE écriture en `catalog`.
  // Seul `featured` (public, lecture seule) n'a rien à relire. Le menu public a sa propre room `menu_changed`.
  [new RegExp(String.raw`^/api/menu/(?!featured${END})`), "catalog"],
  [/^\/api\/settings$/, "settings"], // les variantes ?health=/?errors= ne sont pas des réglages
];

let rules: readonly LiveResourceRule[] = CLP_LIVE_RESOURCE_RULES;
/** Remplace les règles (autre application) ; `null` rétablit celles de Chez la Petite. */
export function setLiveResourceRules(next: readonly LiveResourceRule[] | null): void { rules = next ?? CLP_LIVE_RESOURCE_RULES; }

export function liveResourceFor(url: string | null): AdminChangeResource | null {
  if (!url) return null;
  for (const [re, resource] of rules) if (re.test(url)) return resource;
  return null;
}
