// Moteur du registre d'admin (web/src/admin/shell/registry.ts, hubs.ts, hub-groups.ts, navGroups.ts, breadcrumbs.ts, routes.ts, lib/role-views.ts de Chez la Petite).
// Une vue = une ligne ; le menu, les URL, les libellés, les ressources de permission et les accès par rôle en sont DÉDUITS. Les fonctions sont celles de CLP,
// paramétrées par les données de l'application (`AdminRegistryConfig`) au lieu des constantes du module.
import type {
  AdminHubDef, AdminRegistryConfig, AdminViewDef, Crumb, HubTabEntry, NavGroup, RailEntry, SidebarEntry, NavItem,
} from "./admin-registry-types";

export interface NavContext {
  /** La vue est-elle permise au rôle ? */
  canSee: (view: string) => boolean;
  /** Évalue un `gate` du registre (rôle en dur, droit de gérer l'équipe…). */
  gateOk: (gate: string) => boolean;
  /** Valeur de chaque compteur (`ViewDef.badge`). */
  badges?: Readonly<Record<string, number>>;
}

/** Table de recherche sans prototype : `constructor` ou `toString` ne sont jamais pris pour une clé (chez CLP, `/admin/constructor` donne une fonction et plante l'admin). */
const table = <T,>(entries: Iterable<readonly [string, T]>): Record<string, T> => Object.assign(Object.create(null) as Record<string, T>, Object.fromEntries(entries));

export function createAdminRegistry(config: AdminRegistryConfig) {
  const DEFS: readonly AdminViewDef[] = config.views;
  const HUBS: readonly AdminHubDef[] = config.hubs;
  const legacy = table(Object.entries(config.legacyPaths ?? {}));
  const idPages = config.idPages ?? [];
  const legacyIdPrefixes = table(Object.entries(config.legacyIdPrefixes ?? {}));

  const VIEW_TO_PATH = table(DEFS.map(d => [d.id, d.path] as const));
  const PATH_TO_VIEW = table(DEFS.map(d => [d.path, d.id] as const));
  const VIEW_LABEL = table(DEFS.map(d => [d.id, d.label] as const));
  const NAV_GROUP_MAP = table(DEFS.map(d => [d.id, d.group] as const));
  const VIEW_TAB_LABEL = table(DEFS.map(d => [d.id, d.tabLabel ?? d.navLabel ?? d.label] as const));

  /** Ressource (permission) → vues qu'elle contrôle. */
  const RESOURCE_VIEWS = table<string[]>([]);
  for (const d of DEFS) if (d.resource) (RESOURCE_VIEWS[d.resource] ??= []).push(d.id);
  /** Accès par défaut de chaque rôle (repli). */
  const ROLE_VIEWS = table<string[]>([]);
  for (const d of DEFS) for (const r of d.roles) (ROLE_VIEWS[r] ??= []).push(d.id);
  /** Vue → hub auquel elle appartient (onglet ou extra). */
  const HUB_OF_VIEW = table<AdminHubDef>([]);
  for (const h of HUBS) for (const v of [...h.tabs, ...(h.extras ?? [])]) HUB_OF_VIEW[v] = h;

  const hubOf = (key: string) => HUBS.find(h => [...h.tabs, ...(h.extras ?? [])].includes(key));
  /** Rang du hub d'une entrée : fixe l'ordre du menu de gauche, indépendamment des groupes. */
  const hubRank = (key: string): number => {
    const i = HUBS.findIndex(h => [...h.tabs, ...(h.extras ?? [])].includes(key));
    return i === -1 ? HUBS.length : i;
  };

  /** Menu déduit du registre : groupes dans l'ordre, entrées dans l'ordre du registre, visibilité par permission ou `gate`. */
  function buildNavGroups({ canSee, gateOk, badges = {} }: NavContext): NavGroup[] {
    return config.groupOrder.map(label => ({
      label,
      items: DEFS.filter(d => d.group === label && d.inNav !== false).map(d => ({
        key: d.id,
        label: d.navLabel ?? d.label,
        hidden: d.gate ? !gateOk(d.gate) : !canSee(d.visibleWith ?? d.id),
        badge: d.badge ? badges[d.badge] || undefined : undefined,
        keywords: d.keywords ? [...d.keywords] : undefined,
      })),
    }));
  }

  /**
   * Entrées du panneau de menu d'un groupe : une vue = une entrée, un hub = UNE entrée (à la place de ses vues).
   * L'entrée d'un hub s'ouvre sur son onglet par défaut, ou sur le premier onglet visible si le rôle n'a pas le premier.
   */
  function sidebarEntries(items: NavItem[]): SidebarEntry[] {
    const entries: SidebarEntry[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      const hub = hubOf(item.key);
      if (!hub) { entries.push({ key: item.key, label: item.label, hidden: item.hidden, badge: item.badge, members: [item.key] }); continue; }
      if (seen.has(hub.id)) continue;
      seen.add(hub.id);
      const members = items.filter(i => hubOf(i.key)?.id === hub.id);
      const visible = members.filter(m => !m.hidden);
      const target = visible.find(m => m.key === hub.tabs[0]) ?? visible.find(m => hub.tabs.includes(m.key)) ?? visible[0];
      entries.push({
        key: target?.key ?? members[0].key, label: hub.label, icon: hub.icon, hidden: visible.length === 0,
        badge: members.reduce((n, m) => n + (m.badge ?? 0), 0) || undefined, members: members.map(m => m.key),
      });
    }
    return entries;
  }

  /** Onglets de la barre du haut : un onglet par vue visible, un seul par groupe. */
  function hubTabEntries(hub: AdminHubDef, view: string, canSee: (v: string) => boolean): HubTabEntry[] {
    const entries: HubTabEntry[] = [];
    for (const v of hub.tabs.filter(canSee)) {
      const group = hub.groups?.find(g => g.views.includes(v));
      if (!group) { entries.push({ key: v, label: VIEW_TAB_LABEL[v], target: v, active: view === v }); continue; }
      if (entries.some(e => e.key === group.id)) continue;
      const members = group.views.filter(canSee);
      entries.push({ key: group.id, label: group.label, target: members[0], active: members.includes(view) });
    }
    return entries;
  }

  /** Sélecteur de la vue ouverte : null hors groupe, ou quand le rôle ne voit qu'une vue du groupe (rien à choisir). */
  function railOfView(hub: AdminHubDef, view: string, canSee: (v: string) => boolean): { title: string; items: RailEntry[] } | null {
    const group = hub.groups?.find(g => g.views.includes(view));
    if (!group) return null;
    const items = group.views.filter(canSee).map(v => ({ key: v, label: VIEW_TAB_LABEL[v] }));
    return items.length > 1 ? { title: group.label, items } : null;
  }

  const adminPath = (v: string) => `/admin/${VIEW_TO_PATH[v]}`;

  /** Vue affichée pour un chemin `/admin/...` (pages pleines à identifiant comprises) ; null si inconnue. */
  function viewFromPathname(pathname: string): string | null {
    const seg = pathname.replace(/^\/admin\/?/, "").replace(/\/+$/, "");
    const [head, id] = seg.split("/");
    for (const p of idPages) if (head === p.prefix && id && !(p.except ?? []).includes(id)) return p.view;
    return PATH_TO_VIEW[seg] ?? null;
  }

  /**
   * Vue affichée et identifiant de page pleine pour l'URL courante (AdminPage de CLP : le chemin n'est PAS purgé de son slash final, une URL inconnue
   * retombe sur `fallback`). `/admin/partners/:id` → vue d'édition + id, `/admin/kitchens/:siteId` → vue Cuisines + id.
   */
  function locate(pathname: string, fallback: string): { view: string; id: string | null } {
    const seg = pathname.replace(/^\/admin\/?/, "");
    const [head, id] = seg.split("/");
    for (const p of idPages) if (head === p.prefix && id && !(p.except ?? []).includes(id)) return { view: p.view, id };
    return { view: PATH_TO_VIEW[seg] ?? fallback, id: null };
  }

  /** Miettes d'une vue : menu (hub), rubrique de groupe si la vue en a une, onglet. `entity` ajoute la fiche ouverte (« Commande #0726 »). */
  function crumbsFor(view: string, entity?: { kind: string; label: string }): Crumb[] {
    const hub = HUB_OF_VIEW[view];
    const out: Crumb[] = [];
    if (hub) {
      out.push({ label: hub.label, to: adminPath(hub.tabs[0]) });
      const group = hub.groups?.find(g => g.views.includes(view));
      if (group) out.push({ label: group.label, to: adminPath(group.views[0]) });
    }
    out.push({ label: VIEW_TAB_LABEL[view], to: adminPath(view) });
    if (entity) out.push({ label: `${config.entityLabels?.[entity.kind]?.label ?? entity.kind} ${entity.label}`, to: null });
    else out[out.length - 1] = { ...out[out.length - 1], to: null };
    return out;
  }

  /** Chemin (sans « /admin/ ») → chemin actuel si c'est une ancienne URL, sinon null. */
  function resolveLegacyPath(seg: string): string | null {
    const clean = seg.replace(/\/+$/, "");
    if (legacy[clean]) return legacy[clean];
    const [head, id, ...rest] = clean.split("/");
    const next = legacyIdPrefixes[head];
    if (id && !rest.length && next) return `${next}/${id}`;
    return null;
  }

  /** Vues lisibles par l'union des rôles, d'après la matrice des permissions. */
  function viewsFromPermissions(all: Record<string, Record<string, { read: boolean }>>, roles: string[]): string[] {
    const views = new Set<string>();
    for (const role of roles) for (const [resource, a] of Object.entries(all[role] ?? {})) if (a.read) for (const v of RESOURCE_VIEWS[resource] ?? []) views.add(v);
    return [...views];
  }

  /** Repli codé en dur (matrice indisponible) : union des accès par défaut des rôles. */
  const viewsFromHardcodedRoles = (roles: string[]): string[] => [...new Set(roles.flatMap(r => ROLE_VIEWS[r] ?? []))];

  return {
    config, VIEW_TO_PATH, PATH_TO_VIEW, VIEW_LABEL, VIEW_TAB_LABEL, NAV_GROUP_MAP, RESOURCE_VIEWS, ROLE_VIEWS, HUB_OF_VIEW,
    legacyPaths: legacy, hubRank, buildNavGroups, sidebarEntries, hubTabEntries, railOfView, viewFromPathname, locate, crumbsFor, resolveLegacyPath,
    viewsFromPermissions, viewsFromHardcodedRoles,
  };
}

export type AdminRegistry = ReturnType<typeof createAdminRegistry>;
