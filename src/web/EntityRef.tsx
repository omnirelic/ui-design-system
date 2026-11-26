// EntityRef de CLP (web/src/admin/ui/entity/EntityRef.tsx) : toute entité à nom simple (livreur, véhicule, sac, plat, article, cuisine…) — mêmes formes
// (`num | point | compact | chip | row | card | detail`), même clic, mêmes actions. Le chemin du lien vient du graphe de l'application (`EntityRefProvider`).
// Écarts : `kind` est une chaîne du graphe injecté ; l'ouverture sur place (`useLocalItemOpen` de CLP, propre au plat dans la messagerie) devient `openHere(kind, id)` du fournisseur,
// pour toute entité ; le badge de `detail` (`Badge` de CLP) est une puce interne aux mêmes cinq tons, en jetons ; `Text` = `RefText`.
import type { ReactNode } from "react";
import { EntityAvatar } from "./entity-avatar";
import { RefText, type TextTone } from "./entity-text";
import { useEntityRef } from "./entity-context";
import { entityChipModel } from "./entity-chip";
import { LeadDisc } from "./LeadDisc";
import { PastilleCapsule } from "./PastilleCapsule";
import { StockBadge, VariationChip } from "./PastilleBody";
import type { ItemStockBadge } from "./capsule-model";
import { Dot, RefCardShell, RefChipShell, RefDetailShell, RefLink, RefRowShell, Swatch, type RefAction, type RefVariant } from "./RefParts";
import { formatPersonName } from "./person-name";
import { ACCENT, DIM, MONO, rem } from "./theme";
import { toneColor } from "./pastille-model";
import { tint } from "./controls";
import "./entity-css";

export type RefBadgeColor = "gold" | "green" | "orange" | "red" | "gray";
const BADGE_COLOR: Record<RefBadgeColor, string> = { gold: ACCENT, green: toneColor("success"), orange: toneColor("warning"), red: toneColor("danger"), gray: DIM };

/** Puce d'état de `detail` : aux cinq tons du `Badge` de CLP (or, vert, orange, rouge, gris), 20 px d'arrondi, 12 px gras. */
function RefBadge({ label, color = "gray" }: { label: string; color?: RefBadgeColor }) {
  const c = BADGE_COLOR[color];
  return <span style={{ display: "inline-flex", alignItems: "center", background: tint(c, 13), color: c, border: `1px solid ${tint(c, 27)}`, borderRadius: 20, padding: "2px 9px", fontSize: rem(12), fontWeight: 700, letterSpacing: 0.5, fontFamily: MONO, whiteSpace: "nowrap" }}>{label}</span>;
}

export interface EntityRefProps {
  kind: string;
  id: string | number | null | undefined;
  /** Nom affiché (« Marc », « Poulet braisé », « LT-123-AB »). */
  label: string;
  /** Précision courte (« Moto · LT-123-AB », « 2/4 commandes »). */
  sub?: string | null;
  /** Ton de la précision en pastille (`chip`) : « Bas · 3 restants » en orange, « Épuisé » en rouge. Gris par défaut. */
  subTone?: TextTone;
  /** Point d'état (couleur CSS) devant le nom. */
  dot?: string;
  /** Photo ou initiales en tête (personnes). */
  avatar?: { photoUrl?: string | null };
  /** Couleur propre à l'entité (sac) : pastille ronde pleine à la place du point d'état ; `null` = sans couleur (gris). */
  swatch?: string | null;
  /** Visuel de tête propre à l'entité (ex. avatar + canal d'une conversation) : remplace avatar et couleur. */
  lead?: ReactNode;
  variant?: RefVariant;
  /** `detail` : pastille d'état à côté du titre. */
  badge?: { label: string; color?: RefBadgeColor };
  /** `detail` : contrôles de la vue sous l'identité (boutons, sélecteurs). */
  extra?: ReactNode;
  onOpen?: () => void;
  linkless?: boolean;
  noMenu?: boolean;
  /** Article de banque qui est un produit intermédiaire (« porc bouilli ») : sa pastille prend l'icône `intermediateIcon` de la définition. */
  intermediate?: boolean;
  /** `num` : lien discret (atténué, sans gras) pour une mention dans un texte secondaire (« Okok sucré 4 boîtes »). */
  quiet?: boolean;
  /** `chip` d'un plat de commande : quantité « 2× » en accent, dans la pastille, devant le disque. */
  qty?: number;
  /** `chip` : variation du plat, mini-puce bleue collée au nom. */
  variation?: string | null;
  /** `chip` : stock du plat en badge (nombre seul) ; absent = stock non suivi. */
  stock?: ItemStockBadge | null;
}

/** Phrase lue pour la pastille d'un plat : « 1× Jus de Foléré, M, 7 restants ». */
function pillLabel(qty: number | undefined, name: string, variation: string | null | undefined, stock: ItemStockBadge | null | undefined): string {
  const stockText = !stock ? null : stock.level === "made_to_order" ? "à la commande" : stock.level === "out" ? "épuisé" : `${stock.level === "low" ? "stock bas : " : ""}${stock.count} restant${stock.count > 1 ? "s" : ""}`;
  return [`${qty ? `${qty}× ` : ""}${name}`, variation, stockText].filter(Boolean).join(", ");
}

export function EntityRef({ kind, id, label: rawLabel, sub, subTone, dot, avatar, swatch, lead: customLead, intermediate, qty, variation, stock, variant = "chip", onOpen: onOpenProp, linkless, noMenu, badge, extra, quiet }: EntityRefProps) {
  const { graph, openHere } = useEntityRef();
  const def = graph.defs[kind];
  if (!def) throw new Error(`EntityRef : « ${kind} » n'est pas une entité du graphe.`);
  const hasId = id != null && id !== "";
  const openLocal = hasId ? openHere?.(kind, String(id)) : undefined; // dans la vue qui ouvre déjà la fiche : sur place
  const onOpen = onOpenProp ?? openLocal;
  const label = def.person ? formatPersonName(rawLabel) : rawLabel;
  const to = linkless || !hasId ? null : graph.entityPath(kind, id);
  const open = `Ouvrir : ${def.label.toLowerCase()}`;
  const actions: RefAction[] = noMenu || !to ? [] : [openLocal ? { label: open, run: openLocal } : { label: open, to }, { label: "Copier le nom", copy: label }];
  const swatchSize = variant === "detail" ? 28 : variant === "card" ? 20 : 14;
  const lead = customLead ?? (swatch !== undefined ? <Swatch color={swatch} size={swatchSize} /> : avatar ? <EntityAvatar name={label} photoUrl={avatar.photoUrl} size={variant === "detail" ? 56 : variant === "card" ? 44 : variant === "row" ? 28 : 20} /> : null);

  if (variant === "detail") {
    return (
      <RefDetailShell lead={lead ?? (dot ? <Dot color={dot} /> : undefined)} title={<RefText variant="title" strong truncate>{label}</RefText>}
        badge={badge && <RefBadge label={badge.label} color={badge.color} />} lines={sub && <RefText variant="small" tone="muted">{sub}</RefText>} extra={extra} />
    );
  }
  if (variant === "num") return <RefLink to={to} onOpen={onOpen} className="omni-ref-num">{quiet ? <RefText variant="caption" tone="muted">{label}</RefText> : <RefText variant="small" strong>{label}</RefText>}</RefLink>;
  if (variant === "chip" || variant === "compact" || variant === "point") {
    // La pastille de la grammaire commune : disque de tête (photo d'une personne, icône du type, couleur du sac), libellé, état/précision.
    const model = entityChipModel({
      def, label, sub, subTone, dot, swatch, intermediate,
      labelAfter: variation ? <VariationChip label={variation} /> : undefined,
      badge: stock ? <StockBadge stock={stock} /> : undefined,
    });
    const disc = customLead ?? <LeadDisc lead={model.lead} name={label} photoUrl={avatar?.photoUrl} size={variant === "point" ? "md" : "sm"} />;
    return <RefChipShell to={to} onOpen={onOpen} actions={actions} capsule={<PastilleCapsule form={variant === "chip" ? "pill" : variant} lead={disc} segments={model.segments} stateDot={dot} dim={stock?.level === "out"} label={qty || variation || stock ? pillLabel(qty, label, variation, stock) : undefined} prefix={qty ? <RefText variant="small" tone="accent" strong>{qty}×</RefText> : undefined} />} />;
  }
  if (variant === "row") {
    return (
      <RefRowShell>
        {lead}
        <span className="omni-ref-fill"><RefLink to={to} onOpen={onOpen} className="omni-ref-num"><RefText variant="body" strong>{label}</RefText></RefLink>{sub && <RefText variant="small" tone="muted">{` · ${sub}`}</RefText>}</span>
      </RefRowShell>
    );
  }
  return (
    <RefCardShell band={<>{lead}<span className="omni-ref-stack"><RefLink to={to} onOpen={onOpen} className="omni-ref-num"><RefText variant="body" strong>{label}</RefText></RefLink>{sub && <RefText variant="small" tone="muted">{sub}</RefText>}</span></>} />
  );
}

/**
 * Une `EntityRef` figée sur un type : l'équivalent de `export const VehicleRef = (p) => <EntityRef kind="vehicle" {...p} />` de CLP
 * (`entity/refs.tsx`), `defaults` pour les props fixes (`AgentRef` = `{ avatar: {} }`).
 */
export function entityRefFor(kind: string, defaults: Partial<Omit<EntityRefProps, "kind">> = {}) {
  const Typed = (p: Omit<EntityRefProps, "kind">) => <EntityRef kind={kind} {...defaults} {...p} />;
  Typed.displayName = `EntityRef(${kind})`;
  return Typed;
}
