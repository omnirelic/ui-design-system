// Actions d'un numéro de téléphone dans un fil : UNE définition, partagée par la pastille et le menu de bulle (web/src/admin/lib/phone-actions.ts de Chez la Petite).
// Copier / appeler restent cliquables pour tous : sans accès en cours, un clic ouvre la demande à l'admin (accès temporaire). « Révéler » n'existe que pour le
// superadmin (jamais octroyable : retiré pour les autres). Le serveur refuse de toute façon les rôles non autorisés : ceci ne fait que dessiner.
import type { IconName } from "./Icon";
import { canRevealPhone, type PhoneRankType } from "./phone-rank";

export type PhoneActionId = "open" | "associate" | "copy" | "call" | "reveal";

export interface PhoneAction { id: PhoneActionId; label: string; icon: IconName; enabled: boolean; /** Raison du grisé : 6 mots au plus. */ reason?: string }

export function phoneActions(rank: PhoneRankType): PhoneAction[] {
  const supers = canRevealPhone(rank, "view");
  const all: PhoneAction[] = [
    { id: "open", label: "Ouvrir la conversation", icon: "action-chat", enabled: true },
    { id: "associate", label: "Associer", icon: "action-link", enabled: true },
    { id: "copy", label: "Copier", icon: "action-copy", enabled: true },
    { id: "call", label: "Appeler", icon: "action-phone", enabled: true },
    { id: "reveal", label: "Révéler", icon: "action-preview", enabled: true },
  ];
  return supers ? all : all.filter((a) => a.id !== "reveal"); // jamais octroyable : une entrée grisée ne mènerait à aucune demande, elle disparaît
}
