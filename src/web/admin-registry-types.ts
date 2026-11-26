// Types du registre d'admin (web/src/admin/shell/registry.ts de Chez la Petite) : le MOTEUR est générique, les DONNÉES (vues, hubs, ressources, rôles)
// viennent de l'application. Identifiants, chemins et clés en anglais ; seuls les libellés sont en français.
import type { IconName } from "./Icon";

/** Visibilité dans le menu qui ne vient pas de la permission de la ressource : le nom d'un contrôle que l'application sait évaluer (`gateOk`). */
export type AdminNavGate = string;

export interface AdminViewDef {
  id: string;
  /** Chemin sous /admin/, en anglais (slug ASCII minuscule). */
  path: string;
  label: string;
  /** Libellé du menu si différent de `label`. */
  navLabel?: string;
  /** Libellé de l'onglet quand la vue est un onglet de hub (défaut : navLabel puis label). */
  tabLabel?: string;
  /** Groupe du menu (utilisé aussi pour ouvrir le bon groupe quand la vue n'a pas d'entrée de menu). */
  group: string;
  /** Absent du menu (page ouverte depuis une autre vue). */
  inNav?: false;
  /** Clé de permission (page Rôles) ; null = réservé par `gate`/rôle en dur. */
  resource: string | null;
  /** L'entrée de menu suit la permission d'une AUTRE vue (ex. Pages HTML suit Documents). */
  visibleWith?: string;
  gate?: AdminNavGate;
  /** Clé d'un compteur (`badges[badge]` à la construction du menu). */
  badge?: string;
  /** Mots-clés de la palette ⌘K. */
  keywords?: readonly string[];
  /** Rôles qui y ont accès par défaut (repli quand les permissions en base ne sont pas chargées). */
  roles: readonly string[];
}

/** Onglet de hub à rail : `views` sont des ids de vues du hub, dans l'ordre du rail ; la première est la vue d'entrée. */
export interface AdminHubGroup { id: string; label: string; views: readonly string[] }

/** Menu à onglets : plusieurs vues regroupées sous une seule entrée de menu. */
export interface AdminHubDef {
  id: string;
  label: string;
  icon: IconName;
  group: string;
  /** Premier segment commun des chemins du hub (absent : chemins historiques conservés). */
  root?: string;
  /** Onglets, dans l'ordre d'affichage (ids de vues). Le premier est l'onglet par défaut. */
  tabs: readonly string[];
  /** Vues d'un même sujet regroupées sous UN onglet (barre du haut), listées à part (sélecteur de vue). Chaque vue garde son chemin et sa permission. */
  groups?: readonly AdminHubGroup[];
  /** Vues qui appartiennent au hub sans être un onglet (ex. « Prise de commande », ouverte par un bouton). */
  extras?: readonly string[];
  /** Bouton d'action principal affiché à droite des onglets. */
  action?: { view: string; label: string; icon?: IconName };
}

/** Ressource de permission (page Rôles). `apiOnly` : permission sans vue (endpoints seulement). */
export interface AdminResourceDef { key: string; label: string; apiOnly?: boolean }

export interface NavItem { key: string; label: string; badge?: number; hidden?: boolean; keywords?: string[] }
export interface NavGroup { label: string; items: NavItem[] }

export interface SidebarEntry {
  key: string;
  label: string;
  icon?: IconName;
  hidden?: boolean;
  badge?: number;
  /** Vues couvertes par l'entrée (pour la surbrillance) ; une seule pour une vue simple. */
  members: string[];
}

export interface HubTabEntry { key: string; label: string; /** Vue ouverte au clic (la première vue visible d'un groupe). */ target: string; active: boolean }
export interface RailEntry { key: string; label: string }
export interface Crumb { label: string; /** null = page courante. */ to: string | null }

/** Page pleine à identifiant : `/admin/<prefix>/:id` ouvre la vue `view` (sauf pour les segments de `except`, chemins fixes). */
export interface AdminIdPage { prefix: string; view: string; except?: readonly string[] }

export interface AdminRegistryConfig {
  views: readonly AdminViewDef[];
  hubs: readonly AdminHubDef[];
  resources?: readonly AdminResourceDef[];
  /** Ordre des groupes du menu. */
  groupOrder: readonly string[];
  /** Anciennes URL (sans « /admin/ ») → chemin actuel, éventuellement avec sa query. Rien ne s'y ajoute plus. */
  legacyPaths?: Readonly<Record<string, string>>;
  /** Anciens préfixes de pages à identifiant (`partenaires` → `partners` : `partenaires/:id` → `partners/:id`). */
  legacyIdPrefixes?: Readonly<Record<string, string>>;
  /** Pages pleines à identifiant (fiche d'un partenaire, d'une cuisine). */
  idPages?: readonly AdminIdPage[];
  /** Libellé de chaque type de fiche pour le fil d'Ariane (« Commande » + « #0726 »). */
  entityLabels?: Readonly<Record<string, { label: string }>>;
}
