// Contrat du manifeste de catalogue : ce que la vue /design-system lit pour montrer le paquet réel.
import type { ReactNode } from 'react';

export type CatalogKindType = 'component' | 'hook' | 'class' | 'function' | 'constant' | 'module' | 'rule';

export interface CatalogGroupInterface {
  id: string;
  label: string;
}

export interface CatalogChoiceInterface {
  id: string;
  label: string;
}

/** Décors injectés dans chaque exemple : aucune horloge globale, aucun réseau, aucun aléa. */
export interface CatalogFixturesInterface {
  /** Horloge injectée (ms) : jamais `Date.now()`. */
  now: number;
  timeZone: string;
  locale: string;
  person: { name: string; phone: string; email: string; dob: string };
  /** Chemin de livraison : statut et décalage en minutes depuis `now`. */
  order: { steps: { status: string; offsetMin: number }[] };
  providers: string[];
}

export interface CatalogExampleInterface {
  /** Appel écrit tel quel. */
  call: string;
  /** Résultat calculé à l'exécution, jamais écrit à la main. */
  result: string;
}

export interface CatalogEntryInterface {
  /** Nom exporté, identique à src/index.ts. */
  name: string;
  /** Identifiant d'un groupe du manifeste. */
  group: string;
  kind: CatalogKindType;
  /** `planned` : à créer, sans rendu ni fixture (le manifeste n'en contient aucun tant que rien n'est prévu dans le code). */
  status: 'exists' | 'planned';
  /** Une ligne, générée depuis les types au build. */
  signature: string;
  variants?: CatalogChoiceInterface[];
  states?: CatalogChoiceInterface[];
  /** Carte pleine largeur (tableaux, listes). */
  wide?: boolean;
  /** Un clic déclenche un appel réseau : la vue montre l'exemple sans le rendre actif. */
  inert?: boolean;
  /** Exemple vivant : composant réel, fixtures sans réseau. */
  render?: (variant: string, state: string, fixtures: CatalogFixturesInterface) => ReactNode;
  /** Exemples calculés pour les fonctions, classes et constantes. */
  examples?: (fixtures: CatalogFixturesInterface) => CatalogExampleInterface[];
}

/** Entrée telle qu'écrite dans un fichier de groupe : statut et signature sont posés par le manifeste. */
export type CatalogEntrySourceInterface = Omit<CatalogEntryInterface, 'status' | 'signature'>;

export interface CatalogExclusionInterface {
  export: string;
  reason: string;
}

export interface CatalogManifestInterface {
  package: string;
  /** Lue dans package.json au build, jamais écrite à la main. */
  version: string;
  groups: CatalogGroupInterface[];
  entries: CatalogEntryInterface[];
  /** Exports de valeur sans entrée, chacun avec son motif. Les types (`*Interface`, `*Props`, `*Type`) sont exclus en bloc. */
  excluded: CatalogExclusionInterface[];
}
