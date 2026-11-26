// Le modèle PUR des pastilles d'entités de CLP (web/src/admin/ui/pastille/pastille-model.ts), sans React : disque de tête, segments, qualificatif, stock.
// Grammaire : [disque de tête] Libellé | État | Valeur | Quand — quatre segments au plus, une donnée absente = un segment absent.
// Écarts avec CLP : `leadFor` lit l'icône dans la définition d'entité (`icon`, `intermediateIcon`, `person`) au lieu d'une table figée sur les types de CLP ;
// le montant d'un segment est formaté par le fournisseur (`formatMoney`), pas par le sélecteur de devise de l'admin de CLP ; `segmentsText`, `ClientIdentity`,
// `DIMENSIONS` et `QUALIFIERS` (propres au client et à la commande de CLP) ne sont pas repris.
import type { ReactNode } from "react";
import type { EntityDef } from "./entity-graph";

export type PastilleRole = "label" | "state" | "value" | "when";
export const ROLE_ORDER: readonly PastilleRole[] = ["label", "state", "value", "when"];
export const MAX_SEGMENTS = 4;

/** Vert = argent, or = décompte/remise/code, orange = attente, rouge = échec. Tout le reste est neutre. */
export type SegmentTone = "default" | "muted" | "money" | "gold" | "warn" | "bad";

export type SegmentInput =
  | { role: "label"; text?: string | null; strong?: boolean; tone?: SegmentTone; /** Point d'état resté devant le libellé (pas de mot d'état). */ dot?: string; /** Puce collée au nom (la variation d'un plat). */ after?: ReactNode }
  | { role: "state"; text?: string | null; /** Couleur CSS du point d'état. */ dot?: string; tone?: SegmentTone }
  | { role: "value"; text?: string | null; tone?: SegmentTone }
  | { role: "value"; /** Valeur déjà composée (ex. numéro masqué avec son drapeau) : absente = pas de segment. */ node: ReactNode; tone?: SegmentTone }
  | { role: "value"; /** Montant ; `null`/absent = pas de segment. */ money: number | null | undefined; signed?: boolean; tone?: SegmentTone; /** « Afficher les montants » éteint, ou rôle sans le droit : le segment disparaît. */ hidden?: boolean }
  | { role: "when"; text?: string | null };

export interface PastilleSegment {
  role: PastilleRole;
  /** 1 à 4 : sert aux paliers de compacité (le segment 4 part en premier). */
  pos: number;
  text?: string;
  node?: ReactNode;
  /** Puce collée au libellé (segment « label » seulement). */
  after?: ReactNode;
  money?: { value: number; signed: boolean };
  dot?: string;
  tone: SegmentTone;
  strong: boolean;
}

function normalize(input: SegmentInput): Omit<PastilleSegment, "pos"> | null {
  if ("node" in input) return input.node ? { role: "value", node: input.node, tone: input.tone ?? "muted", strong: false } : null;
  if ("money" in input) {
    const value = input.money;
    if (input.hidden || value == null || !Number.isFinite(Number(value))) return null;
    return { role: "value", money: { value: Number(value), signed: !!input.signed }, tone: input.tone ?? "money", strong: false };
  }
  const text = input.text?.trim();
  if (!text) return null;
  const tone = "tone" in input && input.tone ? input.tone : input.role === "when" ? "muted" : "default";
  return { role: input.role, text, dot: "dot" in input ? input.dot : undefined, tone, strong: "strong" in input ? !!input.strong : false, after: "after" in input ? input.after : undefined };
}

/**
 * Range des segments dans l'ordre de la grammaire et applique ses limites : un libellé, un état et un « quand » au plus ;
 * deux valeurs si la pastille n'a pas d'état, une sinon. Au pire quatre segments, jamais plus. En cas d'excès, le premier gagne.
 */
export function arrangeSegments(inputs: readonly SegmentInput[]): PastilleSegment[] {
  const kept = inputs.map(normalize).filter((s): s is Omit<PastilleSegment, "pos"> => s !== null);
  const sorted = ROLE_ORDER.flatMap(role => kept.filter(s => s.role === role));
  const hasState = sorted.some(s => s.role === "state");
  const limit: Record<PastilleRole, number> = { label: 1, state: 1, value: hasState ? 1 : 2, when: 1 };
  const seen: Record<PastilleRole, number> = { label: 0, state: 0, value: 0, when: 0 };
  return sorted.filter(s => ++seen[s.role] <= limit[s.role]).slice(0, MAX_SEGMENTS).map((s, i) => ({ ...s, pos: i + 1 }));
}

/** Icône de repli quand la définition d'une chose n'en donne pas. */
export const DEFAULT_LEAD_ICON = "ui-tag";
/** Icône d'une personne sans photo (le disque affiche d'abord la photo, puis les initiales : l'icône n'est qu'un nom). */
export const PERSON_LEAD_ICON = "ui-avatar";

/** Le disque de tête : photo (initiales à défaut) pour une personne, icône du type pour une chose. `icon` est un nom du registre `Icon`. */
export interface PastilleLead { kind: "photo" | "icon"; icon: string; /** Couleur propre à la chose (la vraie couleur d'un sac). */ tint?: string }

/** Le disque de tête d'une entité, selon sa définition : une personne a une photo, une chose l'icône de son type ; un produit intermédiaire prend `intermediateIcon` ; un sac ou un véhicule avec une couleur la garde. */
export function leadFor(def: Pick<EntityDef, "person" | "photo" | "icon" | "intermediateIcon">, opts: { /** Un article ou plat de banque qui est un produit intermédiaire (« porc bouilli »). */ intermediate?: boolean; /** Couleur réelle (sac, véhicule). */ color?: string | null } = {}): PastilleLead {
  if (def.photo ?? def.person) return { kind: "photo", icon: PERSON_LEAD_ICON };
  const icon = opts.intermediate && def.intermediateIcon ? def.intermediateIcon : def.icon ?? DEFAULT_LEAD_ICON;
  return opts.color ? { kind: "icon", icon, tint: opts.color } : { kind: "icon", icon };
}

export type QualifierTone = "green" | "gold" | "orange" | "red" | "violet";
/** Un badge (« Nouveau », « Fidèle »…) est le DERNIER segment de la pastille de ce qu'il qualifie ; faute de place, il ne garde que son icône. `icon` : nom du registre `Icon`. */
export interface Qualifier { label: string; icon: string; tone: QualifierTone }

/**
 * Le stock d'un plat tel que la pastille le montre : un nombre seul (gris si stocké, ambre si bas, rouge si épuisé) ou la marmite
 * (« à la commande »). Absent = stock non suivi, aucun badge.
 */
export type ItemStockBadge = { level: "ok" | "low" | "out"; count: number; derived?: true } | { level: "made_to_order" };
