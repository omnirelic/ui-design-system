// Modèle pur des pastilles (aucun React) : tons sémantiques, compteur, statuts du réseau.
// Les tons viennent des jetons sémantiques omnirelic (success / warning / danger / info) : une cuisine ne les surcharge jamais.
// Seul le ton « brand » suit l'accent du thème (--o-accent), c'est là que cuisines.cm pose sa teinte verte.
import { semantic } from "../tokens";

export type PastilleTone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";
export const PASTILLE_TONES: readonly PastilleTone[] = ["success", "warning", "danger", "info", "neutral", "brand"];

/** Couleur CSS d'un ton : variable du thème avec repli sur le jeton brut. */
export const toneColor = (tone: PastilleTone): string => ({
  success: `var(--o-success, ${semantic.success})`,
  warning: `var(--o-warning, ${semantic.warning})`,
  danger: `var(--o-danger, ${semantic.danger})`,
  info: `var(--o-info, ${semantic.info})`,
  neutral: "var(--o-dim, #a1a1aa)",
  brand: "var(--o-accent, #5eead4)",
})[tone];

/** Texte d'un compteur : « 7 », « 99+ ». `null` quand il n'y a rien à montrer (0, absent, négatif, non fini) : jamais une pastille à zéro ni inventée. */
export function formatCount(value: number | null | undefined, max = 99): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  const n = Math.floor(value);
  return n > max ? `${max}+` : String(n);
}

/**
 * Statuts de commande du réseau (OrderFsm de @omnirelic/kit) et de paiement → ton. Le libellé vient du registre réseau
 * (STEP_LABEL de @omnirelic/components) : ici seulement la couleur, pour que toute cuisine affiche un statut de la même teinte.
 */
export const STATUS_TONE: Readonly<Record<string, PastilleTone>> = {
  created: "neutral", pending_payment: "warning", confirmed: "info", queued: "info", processing: "info",
  ready_for_pickup: "success", assigned_courier: "info", picked_up: "info", on_the_way: "info", arrived: "success",
  delivered: "success", cancelled: "danger",
  // Paiement
  pending: "warning", authorized: "info", paid: "success", settled: "success", failed: "danger", refunded: "neutral", voided: "neutral",
  // Disponibilité et stock
  available: "success", unavailable: "danger", sold_out: "danger", low_stock: "warning", in_stock: "success",
};

/** Ton d'un statut réseau ; un statut inconnu reste neutre (jamais une couleur devinée). */
export const statusTone = (status: string): PastilleTone => STATUS_TONE[status] ?? "neutral";
