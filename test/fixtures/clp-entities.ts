// Le jeu d'entités de Chez la Petite, transcrit de web/src/admin/shell/entity-graph.ts (ENTITY_KINDS, ENTITY_DEFS, ENTITY_RELATIONS, clientEntityKey)
// et de VIEW_TO_PATH (registry.ts) : la RÉFÉRENCE de test du moteur, et l'exemple de ce qu'une application fournit. Pas livré dans le paquet.
// Écarts avec CLP : `viewPath` vient d'une table ici (CLP : VIEW_TO_PATH de son registre) ; chaque entité-chose porte son `icon` (CLP : THING_ICON de
// pastille-model.ts) ; `res-intermediate` (icône maison MeatCut de CLP) est absente du registre du paquet : `action-produce` la remplace.
import { createEntityGraph, type EntityDef, type EntityRelation } from "../../src/web/entity-graph";

export const ENTITY_KINDS = [
  "order", "client", "courier", "vehicle", "bag", "item", "category", "recipe", "ingredient", "purchase_list",
  "kitchen", "partner", "store", "promo", "agent", "employee", "admin_user", "transaction", "wallet_tier",
  "support_thread", "conversation", "draft", "asset",
] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

export const VIEW_TO_PATH = {
  orders: "orders", clients: "clients", couriers: "delivery/couriers", vehicles: "delivery/vehicles", bags: "delivery/bags", menu: "catalog/menu",
  "menu-categories": "catalog/categories", "menu-recipes": "catalog/recipes", "menu-stock": "catalog/stock", cuisines: "kitchens", list: "partners",
  stores: "stores", promo: "clients/promo-codes", agents: "clients/influencers", users: "team", payments: "orders/transactions",
  settings: "system/settings", support: "messages/support", whatsapp: "messages/whatsapp", drafts: "orders/carts", assets: "assets",
} as const;
export type View = keyof typeof VIEW_TO_PATH;

export const ENTITY_DEFS: Record<EntityKind, EntityDef<View>> = {
  order:          { label: "Commande",        view: "orders",       param: "order",    idIs: "id interne de la commande (pas son numéro, qui repart à zéro chaque jour)", icon: "res-orders" },
  client:         { label: "Client",          view: "clients",      param: "client",   idIs: "ID du profil du client ; à défaut (profil pas encore créé) téléphone canonique (+237…), ou « name:<nom> » sans téléphone — cf. clientEntityKey", person: true },
  courier:        { label: "Livreur",         view: "couriers",     param: "courier",  idIs: "id du livreur", person: true },
  vehicle:        { label: "Véhicule",        view: "vehicles",     param: "vehicle",  idIs: "id du véhicule", icon: "res-vehicles" },
  bag:            { label: "Sac",             view: "bags",         param: "bag",      idIs: "id du sac", icon: "res-bags" },
  item:           { label: "Plat",            view: "menu",         param: "item",     idIs: "id du plat", icon: "res-dish", intermediateIcon: "action-produce" },
  category:       { label: "Catégorie",       view: "menu-categories", param: "cat",   idIs: "id de la catégorie", icon: "res-menu" },
  recipe:         { label: "Recette",         view: "menu-recipes", param: "recipe",   idIs: "id du plat dont c'est la recette", icon: "action-produce" },
  ingredient:     { label: "Article",         view: "menu-stock",   param: "bank_focus", fixed: { stock_tab: "ingredients" }, idIs: "id de l'article de la banque (ingrédient, contenant ou consommable)", icon: "res-ingredient", intermediateIcon: "action-produce" },
  purchase_list:  { label: "Fiche d'achat",   view: "menu-stock",   param: "purchase", fixed: { stock_tab: "purchases" }, idIs: "id de la fiche", icon: "action-package" },
  kitchen:        { label: "Cuisine",         view: "cuisines",     param: null, pathId: true, idIs: "id du site (`/admin/kitchens/:siteId`)", icon: "service-kitchen" },
  partner:        { label: "Partenaire",      view: "list",         param: null, pathId: true, idIs: "id du partenaire (`/admin/partners/:id`)", icon: "res-partners" },
  store:          { label: "Établissement",   view: "stores",       param: "store",    idIs: "id de l'établissement", icon: "res-stores" },
  promo:          { label: "Code promo",      view: "promo",        param: null,       idIs: "— (la vue liste les codes ; pas de fiche par identifiant)", icon: "res-promo" },
  agent:          { label: "Influenceur",     view: "agents",       param: "influencer", idIs: "id de l'agent", person: true },
  employee:       { label: "Employé",         view: "users",        param: "emp",      fixed: { team: "employees" }, idIs: "id de l'employé", person: true },
  admin_user:     { label: "Administrateur",  view: "users",        param: "user",     idIs: "uuid du compte admin", person: true },
  transaction:    { label: "Transaction",     view: "payments",     param: "tx",       idIs: "« <type>:<id> » (ex. order:123)", icon: "res-payments" },
  wallet_tier:    { label: "Forfait",         view: "settings",     param: "tier",     fixed: { group: "wallet" }, idIs: "id du forfait (palier) — ouvre sa fiche d'édition dans Paramètres > Portefeuille", icon: "ui-wallet" },
  support_thread: { label: "Conversation",    view: "support",      param: "thread",   idIs: "id de la conversation", person: true, photo: false, icon: "res-support" },
  conversation:   { label: "Conversation WhatsApp", view: "whatsapp", param: "thread",   idIs: "id (nanoid) de la conversation WhatsApp — jamais le numéro, masqué côté serveur ; `?order=<id>` filtre le fil sur une commande", person: true },
  draft:          { label: "Panier",          view: "drafts",       param: "draft",    idIs: "id du panier", icon: "res-drafts" },
  asset:          { label: "Équipement",      view: "assets",       param: "asset",    idIs: "id (nanoid) de l'équipement", icon: "res-assets" },
};

export const ENTITY_RELATIONS: readonly EntityRelation<EntityKind>[] = [
  // Commande
  { a: "order", b: "client",         ab: "Client",            ba: "Commandes",              via: "téléphone de la commande" },
  { a: "order", b: "bag",            ab: "Sac",               ba: "Commandes du sac",       via: "sac qui porte la commande" },
  { a: "order", b: "kitchen",        ab: "Cuisine",           ba: "Commandes de la cuisine", via: "site de la commande" },
  { a: "order", b: "item",           ab: "Plats commandés",   ba: "Commandes du plat",      via: "lignes de la commande" },
  { a: "order", b: "transaction",    ab: "Paiements",         ba: "Commande",               via: "paiements rattachés" },
  { a: "order", b: "support_thread", ab: "Conversation",      ba: "Commande liée",          via: "numéro de commande dans la conversation" },
  { a: "order", b: "conversation",   ab: "Conversation WhatsApp", ba: "Commande liée",      via: "numéro du client : le fil, filtré sur la commande" },
  { a: "order", b: "promo",          ab: "Code promo",        ba: "Commandes du code",      via: "code appliqué" },
  { a: "order", b: "draft",          ab: "Panier d'origine",  ba: "Commande créée",         via: "panier converti" },
  // Client
  { a: "client", b: "transaction",    ab: "Mouvements",       ba: "Client",                 via: "portefeuille et paiements" },
  { a: "client", b: "wallet_tier",    ab: "Forfaits",         ba: "Clients du forfait",     via: "recharges de forfait" },
  { a: "client", b: "support_thread", ab: "Conversations",    ba: "Client",                 via: "téléphone de la conversation" },
  { a: "client", b: "conversation",   ab: "Conversation WhatsApp", ba: "Client",             via: "numéro WhatsApp de la conversation" },
  { a: "client", b: "draft",          ab: "Paniers",          ba: "Client",                 via: "téléphone du panier" },
  { a: "conversation", b: "draft",     ab: "Paniers",           ba: "Conversation WhatsApp",  via: "rattaché par l'engine : réf. panier du message d'aide, sinon numéro" },
  // Logistique
  { a: "courier", b: "vehicle",     ab: "Véhicule",          ba: "Livreur",                via: "véhicule assigné" },
  { a: "courier", b: "bag",         ab: "Sacs",              ba: "Livreur",                via: "sac en cours" },
  { a: "courier", b: "employee",    ab: "Fiche employé",     ba: "Livreur",                via: "courier_id de l'employé" },
  { a: "courier", b: "order",       ab: "Livraisons",        ba: "Livreur",                via: "livreur du sac (dérivé, jamais stocké sur la commande)" },
  { a: "bag", b: "courier",         ab: "Livreur",           ba: "Sacs",                   via: "porteur du sac" },
  // Catalogue
  { a: "item", b: "category",       ab: "Catégorie",         ba: "Plats",                  via: "catégorie du plat" },
  { a: "item", b: "recipe",         ab: "Recette",           ba: "Plat",                   via: "la recette est identifiée par son plat" },
  { a: "recipe", b: "ingredient",   ab: "Ingrédients",       ba: "Recettes qui l'utilisent", via: "lignes de recette" },
  { a: "recipe", b: "item",         ab: "Produits intermédiaires", ba: "Utilisé dans",     via: "composants de recette (plat dans plat)" },
  { a: "ingredient", b: "purchase_list", ab: "Fiches d'achat", ba: "Lignes de la fiche",   via: "lignes d'achat" },
  { a: "item", b: "ingredient",     ab: "Contenants",        ba: "Plats qui l'utilisent",  via: "contenants du plat" },
  { a: "item", b: "kitchen",        ab: "Cuisines",          ba: "Menu de la cuisine",     via: "plat lié à une cuisine" },
  { a: "purchase_list", b: "item",  ab: "Plats à produire",  ba: "Fiches d'achat",         via: "plats de la fiche" },
  // Lieux
  { a: "order", b: "store",         ab: "Établissement",     ba: "Commandes de l'établissement", via: "établissement de la commande (store_id)" },
  { a: "partner", b: "kitchen",     ab: "Cuisines",          ba: "Partenaire",             via: "partenaire de la succursale" },
  { a: "asset", b: "store",         ab: "Établissement",     ba: "Équipements",            via: "lieu de l'équipement (store_id)" },
  { a: "asset", b: "kitchen",       ab: "Cuisine",           ba: "Équipements",            via: "site de l'équipement (site_id)" },
  { a: "partner", b: "order",       ab: "Commandes",         ba: "Partenaire",             via: "commandes passées sur le site du partenaire" },
  // Ventes
  { a: "promo", b: "agent",         ab: "Influenceur",       ba: "Codes",                  via: "agent propriétaire du code" },
  { a: "agent", b: "transaction",   ab: "Paiements",         ba: "Influenceur",            via: "paiements d'influenceur" },
  // Équipe
  { a: "employee", b: "admin_user", ab: "Compte admin",      ba: "Employé",                via: "user_id de l'employé" },
  // Paiement
  { a: "transaction", b: "wallet_tier", ab: "Forfait",       ba: "Transactions",           via: "recharge d'un forfait" },
];

export const clpGraph = createEntityGraph<EntityKind, View>({ defs: ENTITY_DEFS, relations: ENTITY_RELATIONS, viewPath: v => `/admin/${VIEW_TO_PATH[v]}` });
export const { entityPath, linksFrom } = clpGraph;

/**
 * Clé de la fiche client dans l'URL (`?client=`) : l'ID du profil quand on le connaît (le numéro ne circule plus dans les liens),
 * sinon le téléphone canonique, comme le calcule le serveur (api/_lib/client-aggregate.ts), ou « name:<nom> » sans téléphone.
 */
export function clientEntityKey(phone: string | null | undefined, name?: string | null, profileId?: string | null): string {
  if (profileId) return profileId;
  const raw = (phone ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (digits && !/[A-Za-z•]/.test(raw)) { // un numéro masqué (« +237 ORANGE 56 », lettres ou •) n'est pas une clé de fiche ; pas d'import de mask-phone ici (cycle)
    if (digits.length === 9 && digits.startsWith("6")) return `+237${digits}`;
    if (digits.length === 12 && digits.startsWith("237")) return `+${digits}`;
    return `+${digits}`;
  }
  return `name:${(name ?? "").trim().toLowerCase() || "anonyme"}`;
}
