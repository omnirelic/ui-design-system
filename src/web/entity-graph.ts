// Graphe d'entités de l'espace admin de CLP (web/src/admin/shell/entity-graph.ts), moteur seul : une entité (commande, client, livreur…)
// s'ouvre dans UNE vue, par UN paramètre d'URL ; une relation relie deux entités et se lit dans les deux sens ; un lien profond vers une fiche
// se fabrique par `entityPath(kind, id)`, jamais à la main. Sans React, sans domaine.
//
// Ce que CLP écrit en dur (ses 23 entités, ses 40 relations, VIEW_TO_PATH, le préfixe `/admin/`) devient ici une DONNÉE injectée par
// l'application : `createEntityGraph({ defs, relations, viewPath })`. Le jeu de CLP sert de référence de test (test/fixtures/clp-entities.ts) ;
// il n'est pas livré dans le paquet. Écart de contrat avec CLP : `view` est une chaîne libre (CLP : le type `View` de son registre) et
// le chemin de la vue vient de `viewPath(view)` (CLP : `/admin/${VIEW_TO_PATH[view]}`).

export interface EntityDef<V extends string = string> {
  /** Libellé singulier (fil d'Ariane, « Ouvrir : … »). */
  label: string;
  /** Vue où la fiche s'ouvre. */
  view: V;
  /** Paramètre d'URL qui porte l'identifiant ; null = la vue n'a pas de fiche par identifiant (lien vers la vue seule). */
  param: string | null;
  /** Paramètres fixes qui accompagnent l'identifiant (onglet interne de la vue). */
  fixed?: Readonly<Record<string, string>>;
  /** Page pleine à identifiant dans le chemin (`/admin/partners/:id`) au lieu d'un paramètre. */
  pathId?: true;
  /** Ce que vaut l'identifiant — pour ne pas confondre id interne, numéro et téléphone. */
  idIs: string;
  /** Le libellé est un nom de personne : `EntityRef` l'affiche en casse de titre (« Bill Somen », jamais « BILL SOMEN ») et lui donne une photo. */
  person?: true;
  /** Nom d'icône du disque de tête d'une chose (registre `Icon`). Donnée de présentation : absent, la pastille prend l'icône générique. */
  icon?: string;
  /** Icône du disque quand la chose est un produit intermédiaire (article de banque, plat de banque). */
  intermediateIcon?: string;
}

/**
 * Une relation relie deux entités et se lit dans les deux sens (`ab` : ce que A voit de B ; `ba` : ce que B voit de A).
 * Symétrique par construction : si on peut aller de A à B, on peut revenir de B à A.
 */
export interface EntityRelation<K extends string = string> { a: K; b: K; ab: string; ba: string; via: string }

export interface EntityLinkInfo<K extends string = string> { to: K; label: string; via: string }

export interface EntityGraphConfig<K extends string, V extends string> {
  defs: Readonly<Record<K, EntityDef<V>>>;
  relations: readonly EntityRelation<K>[];
  /** Chemin de la vue, avec son préfixe et sans barre finale : `orders` → `/admin/orders`. Falsy = vue inconnue (signalée par `checkEntityGraph`). */
  viewPath: (view: V) => string;
}

export interface EntityGraph<K extends string, V extends string> {
  readonly kinds: readonly K[];
  readonly defs: Readonly<Record<K, EntityDef<V>>>;
  readonly relations: readonly EntityRelation<K>[];
  readonly viewPath: (view: V) => string;
  /** Lien profond vers la fiche d'une entité : `/admin/orders?order=…`. Seule fabrique d'URL d'entité — jamais de chaîne écrite à la main. */
  entityPath(kind: K, id: string | number | null | undefined, extra?: Readonly<Record<string, string>>): string;
  /** Ce qu'une fiche d'entité peut proposer comme liens : les deux sens de chaque relation. */
  linksFrom(kind: K): EntityLinkInfo<K>[];
  isEntityKind(value: string): value is K;
}

export function createEntityGraph<K extends string, V extends string>({ defs, relations, viewPath }: EntityGraphConfig<K, V>): EntityGraph<K, V> {
  const kinds = Object.keys(defs) as K[];
  return {
    kinds, defs, relations, viewPath,
    entityPath(kind, id, extra) {
      const def = defs[kind];
      const base = viewPath(def.view);
      if (def.pathId) return id == null || id === "" ? base : `${base}/${encodeURIComponent(String(id))}`;
      const q = new URLSearchParams(def.fixed ?? {});
      if (def.param && id != null && id !== "") q.set(def.param, String(id));
      for (const [k, v] of Object.entries(extra ?? {})) q.set(k, v); // état de vue qui accompagne la fiche (filtre), pas une autre entité
      const qs = q.toString();
      return qs ? `${base}?${qs}` : base;
    },
    linksFrom(kind) {
      const out: EntityLinkInfo<K>[] = [];
      for (const r of relations) {
        if (r.a === kind) out.push({ to: r.b, label: r.ab, via: r.via });
        else if (r.b === kind) out.push({ to: r.a, label: r.ba, via: r.via });
      }
      return out;
    },
    isEntityKind: (value): value is K => (kinds as readonly string[]).includes(value),
  };
}

/**
 * Les règles de cohérence du graphe (le test `entity-graph.test.ts` de CLP, rendu réutilisable). Retourne les violations, une phrase chacune ;
 * l'application l'appelle dans son test et attend `[]`.
 * - toute entité s'ouvre dans une vue qui existe ;
 * - deux entités ne partagent pas le même couple (vue, paramètre) ;
 * - un paramètre n'est ni un onglet ni un état de vue réservé (`reservedParams`) ;
 * - chaque relation relie deux entités connues, distinctes, sans doublon ;
 * - aucune entité orpheline ; le graphe est connexe depuis `root` (la première entité par défaut) ;
 * - une relation se lit dans les deux sens, avec ses deux libellés.
 */
export function checkEntityGraph<K extends string, V extends string>(graph: EntityGraph<K, V>, opts: { reservedParams?: readonly string[]; root?: K } = {}): string[] {
  const out: string[] = [];
  const reserved = opts.reservedParams ?? ["tab", "section", "list", "group"];
  const seen = new Map<string, K>();
  for (const k of graph.kinds) {
    const d = graph.defs[k];
    if (!graph.viewPath(d.view)) out.push(`${k} : la vue « ${d.view} » n'existe pas`);
    if (d.param && reserved.includes(d.param)) out.push(`${k} : le paramètre « ${d.param} » est réservé à un état de vue`);
    if (!d.param) continue;
    const id = `${d.view}?${d.param}`;
    const other = seen.get(id);
    if (other) out.push(`${k} et ${other} ouvrent ${id}`);
    else seen.set(id, k);
  }
  const rel = new Set<string>();
  for (const r of graph.relations) {
    for (const end of [r.a, r.b]) if (!graph.isEntityKind(end)) out.push(`relation ${r.a}-${r.b} : « ${end} » n'est pas une entité`);
    if (r.a === r.b) out.push(`relation ${r.a}-${r.b} : une entité ne se relie pas à elle-même`);
    const key = `${[r.a, r.b].sort().join("|")}|${r.via}`;
    if (rel.has(key)) out.push(`relation en double : ${key}`);
    rel.add(key);
    if (graph.isEntityKind(r.a) && graph.isEntityKind(r.b)) {
      if (!graph.linksFrom(r.a).some(l => l.to === r.b && l.label === r.ab)) out.push(`relation ${r.a}→${r.b} : « ${r.ab} » introuvable depuis ${r.a}`);
      if (!graph.linksFrom(r.b).some(l => l.to === r.a && l.label === r.ba)) out.push(`relation ${r.b}→${r.a} : « ${r.ba} » introuvable depuis ${r.b}`);
    }
  }
  for (const k of graph.kinds) if (graph.linksFrom(k).length === 0) out.push(`${k} : entité orpheline`);
  const root = opts.root ?? graph.kinds[0];
  if (root) {
    const reach = new Set<K>([root]);
    for (let grew = true; grew;) {
      grew = false;
      for (const k of [...reach]) for (const l of graph.linksFrom(k)) if (graph.isEntityKind(l.to) && !reach.has(l.to)) { reach.add(l.to); grew = true; }
    }
    for (const k of graph.kinds) if (!reach.has(k)) out.push(`${k} : inaccessible depuis ${root}`);
  }
  return out;
}

/** Les paramètres d'URL qui portent une entité (sans doublon) : ce que la règle « zéro URL d'entité à la main » traque. */
export function entityParams<K extends string, V extends string>(graph: EntityGraph<K, V>): string[] {
  return [...new Set(graph.kinds.map(k => graph.defs[k].param).filter((p): p is string => !!p))];
}

/** Retire commentaires de ligne et de bloc, ligne par ligne (les explications citent `?order=` sans construire de lien). */
export function codeLines(source: string): string[] {
  return source.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " ")).split("\n").map(l => l.replace(/(^|\s)\/\/.*$/, "$1"));
}

/** Motif d'un lien d'entité écrit à la main : `?order=`, `&client=`… */
export function handWrittenEntityLink<K extends string, V extends string>(graph: EntityGraph<K, V>): RegExp {
  return new RegExp(`[?&](${entityParams(graph).join("|")})=`);
}

/**
 * La règle « zéro URL d'entité à la main » (`entity-links.rules.test.ts` de CLP) : parcourt des sources `{ path, source }` et retourne
 * `chemin:ligne  texte` pour chaque lien `?<param>=` écrit à la main. `allowed` : chemins où ces paramètres s'écrivent légitimement
 * (le graphe lui-même, la fabrique de chemins, les tests). L'application lit ses fichiers et attend `[]` ; pas de baseline.
 */
export function findHandWrittenEntityLinks<K extends string, V extends string>(graph: EntityGraph<K, V>, files: readonly { path: string; source: string }[], allowed: readonly RegExp[] = []): string[] {
  const link = handWrittenEntityLink(graph);
  const offenders: string[] = [];
  for (const f of files) {
    if (allowed.some(re => re.test(f.path))) continue;
    codeLines(f.source).forEach((line, i) => { if (link.test(line)) offenders.push(`${f.path}:${i + 1}  ${line.trim().slice(0, 90)}`); });
  }
  return offenders;
}
