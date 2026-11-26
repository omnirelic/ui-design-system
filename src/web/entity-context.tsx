// Ce que l'application injecte aux composants d'entités : son graphe (entités, relations, chemins), le formatage d'un montant et l'ouverture « sur place »
// d'une entité. CLP câble ces trois choses en dur (entity-graph.ts, `<Money>` + sélecteur de devise, `useLocalItemOpen` de la messagerie).
import { createContext, useContext, type ReactNode } from "react";
import type { EntityGraph } from "./entity-graph";

export interface EntityRefContextValue {
  /** Le graphe de l'application (`createEntityGraph`), typé ou non : `kind` est relu comme une chaîne. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graph: EntityGraph<any, any>;
  /** Montant d'un segment de pastille (valeur, `signed` : « + » devant un positif). Défaut : XAF entier arrondi par excès, « 1 550 XAF » avec espaces insécables, comme `fmtMoney` de CLP. */
  formatMoney?: (value: number, signed: boolean) => ReactNode;
  /** Ouverture sur place d'une entité (CLP : le plat dans Commandes s'ouvre dans le tiroir, sans changer de vue). Rend la fonction d'ouverture, ou `undefined` pour le lien profond. */
  openHere?: (kind: string, id: string) => (() => void) | undefined;
}

const EntityRefContext = createContext<EntityRefContextValue | null>(null);

export function EntityRefProvider({ value, children }: { value: EntityRefContextValue; children: ReactNode }) {
  return <EntityRefContext.Provider value={value}>{children}</EntityRefContext.Provider>;
}

export function useEntityRef(): EntityRefContextValue {
  const ctx = useContext(EntityRefContext);
  if (!ctx) throw new Error("EntityRef : entourer l'application d'un <EntityRefProvider value={{ graph }}>.");
  return ctx;
}

/** Comme `useEntityRef`, sans erreur hors fournisseur : la pastille seule n'a pas besoin du graphe (seul `formatMoney` y est lu). */
export function useOptionalEntityRef(): EntityRefContextValue | null {
  return useContext(EntityRefContext);
}

/** Défaut de `formatMoney` : XAF entier arrondi par excès, espaces insécables. */
export function defaultFormatMoney(value: number, signed: boolean): string {
  const text = `${Math.ceil(value).toLocaleString("fr-CM").replace(/[   ]/g, " ")} XAF`;
  return `${signed && value > 0 ? "+" : ""}${text}`;
}
