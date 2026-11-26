// Disque de tête d'une pastille (web/src/admin/ui/pastille/LeadDisc.tsx de CLP) : photo de profil (initiales à défaut) pour une personne, icône du type pour une chose.
// 22 px dans une pastille de 30 px (3 px d'écart partout, donc concentrique avec l'arrondi) ; `size="md"` (28 px) pour la forme « point ».
import type { CSSProperties } from "react";
import { Icon, type IconName } from "./Icon";
import { EntityAvatar } from "./entity-avatar";
import { legibleColor, tintedDiscBackground } from "./legible-color";
import type { PastilleLead } from "./capsule-model";
import "./entity-css";

export function LeadDisc({ lead, name = "", photoUrl = null, size = "sm", label }: { lead: PastilleLead; name?: string; photoUrl?: string | null; size?: "sm" | "md" | "lg"; /** Ce que dit l'icône quand elle porte un sens (« Adresse par défaut ») : lu par les lecteurs d'écran, sans infobulle. */ label?: string }) {
  const px = size === "lg" ? 40 : size === "md" ? 28 : 22;
  // <EntityAvatar> ajoute son bord de 1 px autour de `size` : on retire 2 px pour que le disque mesure bien 22 (ou 28) px au total.
  if (lead.kind === "photo") return <EntityAvatar name={name} photoUrl={photoUrl} size={px - 2} />;
  const style = lead.tint ? ({ "--omni-lead-tint": lead.tint, "--omni-lead-ink": legibleColor(lead.tint, tintedDiscBackground(lead.tint)) } as CSSProperties) : undefined;
  return (
    <span {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })} className={`omni-pst-lead omni-pst-lead--${size}${lead.tint ? " omni-pst-lead--tint" : ""}`} style={style}>
      <Icon name={lead.icon as IconName} size={size === "lg" ? 20 : size === "md" ? 16 : 13} weight="regular" />
    </span>
  );
}
