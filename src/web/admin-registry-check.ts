// Garde-fous d'un registre d'admin : les invariants des tests de CLP (admin/shell/__tests__/registry.test.ts, routes.test.ts, hubs.test.ts) en une fonction,
// que chaque application rejoue sur SES données. Renvoie la liste des écarts, vide si le registre est sain.
import type { AdminRegistry } from "./admin-registry";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$/;

export function checkAdminRegistry(r: AdminRegistry, opts: { allowedNoNav?: readonly string[] } = {}): string[] {
  const { views, hubs, resources = [], groupOrder } = r.config;
  const out: string[] = [];
  const ids = views.map(v => v.id);
  const dup = (list: readonly string[]) => list.filter((x, i) => list.indexOf(x) !== i);
  for (const x of dup(ids)) out.push(`identifiant en double : ${x}`);
  for (const x of dup(views.map(v => v.path))) out.push(`chemin en double : ${x}`);

  for (const d of views) {
    if (!d.label.length) out.push(`${d.id} : libellé vide`);
    if (!groupOrder.includes(d.group)) out.push(`${d.id} : groupe inconnu « ${d.group} »`);
    if (!SLUG.test(d.path)) out.push(`${d.id} : chemin non slug ASCII « ${d.path} »`);
    if (d.resource === null && d.gate === undefined) out.push(`${d.id} : sans ressource ni gate (ouverte à tous)`);
    if (d.visibleWith && !ids.includes(d.visibleWith)) out.push(`${d.id} : visibleWith inconnu « ${d.visibleWith} »`);
  }

  const declared = resources.map(x => x.key);
  for (const x of dup(declared)) out.push(`ressource en double : ${x}`);
  if (resources.length) {
    for (const d of views) if (d.resource && !declared.includes(d.resource)) out.push(`${d.id} : ressource non déclarée « ${d.resource} »`);
    for (const { key, apiOnly } of resources) if (!apiOnly && !(key in r.RESOURCE_VIEWS)) out.push(`ressource sans vue : ${key}`);
  }

  for (const [role, list] of Object.entries(r.ROLE_VIEWS)) for (const v of list) if (!ids.includes(v)) out.push(`rôle ${role} : vue inconnue ${v}`);

  const paths = new Set(views.map(v => v.path));
  for (const [old, next] of Object.entries(r.legacyPaths)) {
    if (!paths.has(next.split("?")[0])) out.push(`ancienne URL ${old} : cible inconnue ${next}`);
  }
  for (const p of paths) if (r.resolveLegacyPath(p) !== null) out.push(`chemin actuel pris pour une ancienne URL (boucle) : ${p}`);

  const hubViews = hubs.flatMap(h => [...h.tabs, ...(h.extras ?? [])]);
  for (const x of dup(hubViews)) out.push(`vue dans plusieurs hubs : ${x}`);
  for (const h of hubs) {
    for (const id of [...h.tabs, ...(h.extras ?? [])]) {
      const d = views.find(v => v.id === id);
      if (!d) { out.push(`hub ${h.id} : vue inconnue ${id}`); continue; }
      if (d.group !== h.group) out.push(`hub ${h.id} : ${id} est du groupe ${d.group}`);
      if (h.root && !(d.path === h.root || d.path.startsWith(`${h.root}/`))) out.push(`hub ${h.id} : ${id} (${d.path}) hors de la racine ${h.root}`);
    }
    if (h.action && r.HUB_OF_VIEW[h.action.view]?.id !== h.id) out.push(`hub ${h.id} : l'action pointe hors du hub`);
    for (const g of h.groups ?? []) for (const v of g.views) if (!h.tabs.includes(v)) out.push(`hub ${h.id} : groupe ${g.id} vise ${v}, qui n'est pas un onglet`);
  }
  const allowed = opts.allowedNoNav ?? [];
  for (const d of views) if (d.inNav !== false && !r.HUB_OF_VIEW[d.id] && !allowed.includes(d.id)) out.push(`${d.id} : entrée de menu hors de tout hub`);
  return out;
}
