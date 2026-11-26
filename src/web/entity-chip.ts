// La pastille d'une entité à nom simple (web/src/admin/ui/pastille/entity-chip.ts de CLP) : son disque de tête et ses segments. Pur.
// Écart : prend la DÉFINITION de l'entité (`def`, du graphe de l'application) au lieu de son type figé.
import type { ReactNode } from "react";
import type { EntityDef } from "./entity-graph";
import type { TextTone } from "./entity-text";
import { arrangeSegments, leadFor, type PastilleLead, type PastilleSegment, type SegmentTone } from "./capsule-model";

const TONE: Record<TextTone, SegmentTone> = { default: "default", muted: "muted", accent: "gold", success: "money", warning: "warn", danger: "bad" };

export interface EntityChipInput {
  def: Pick<EntityDef, "person" | "photo" | "icon" | "intermediateIcon">;
  label: string;
  /** Précision courte (« Moto · LT-123-AB », « Bas · 3 restants »). */
  sub?: string | null;
  subTone?: TextTone;
  /** Couleur d'état. Avec une précision : « point + mot » (l'état) ; seule : le point reste devant le libellé. */
  dot?: string;
  /** Couleur propre à l'entité (sac) ; `null` = sans couleur. */
  swatch?: string | null;
  /** Article de banque qui est un produit intermédiaire. */
  intermediate?: boolean;
  /** Puce collée au nom (variation du plat). */
  labelAfter?: ReactNode;
  /** Badge de stock déjà composé : segment de valeur, séparé du nom par la barre. */
  badge?: ReactNode;
}

export function entityChipModel({ def, label, sub, subTone, dot, swatch, intermediate, labelAfter, badge }: EntityChipInput): { lead: PastilleLead; segments: PastilleSegment[] } {
  const hasSub = !!sub?.trim();
  const tone = TONE[subTone ?? "muted"];
  const segments = arrangeSegments([
    { role: "label", text: label, dot: hasSub ? undefined : dot, after: labelAfter },
    hasSub && dot ? { role: "state", text: sub, dot, tone } : { role: "value", text: sub, tone },
    { role: "value", node: badge },
  ]);
  return { lead: leadFor(def, { intermediate, color: swatch }), segments };
}
