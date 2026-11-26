// Avatar de l'admin de CLP (web/src/admin/ui/Avatar.tsx) : photo, sinon initiales, sinon silhouette. Distinct de l'`Avatar` omnirelic (initiales + image carrée arrondie).
// Écart : bord et fond en jetons (BORDER, BG2, ACCENT), `tint` mélangé par `color-mix` au lieu du suffixe hexadécimal de CLP. Interne au paquet, exporté sous `EntityAvatar`.
import { Icon } from "./Icon";
import { ACCENT, BG2, BORDER, rem } from "./theme";
import { RefText } from "./entity-text";
import { tint as mix } from "./controls";

/** « Joel Kamga » → « JK » ; vide pour un nom absent ou « Anonyme ». */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length || name.trim().toLowerCase() === "anonyme") return "";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Taille du texte des initiales : proportionnelle à l'avatar. */
export function initialsVariant(size: number): "caption" | "title" {
  return size >= 48 ? "title" : "caption";
}

export function EntityAvatar({ name, photoUrl = null, size = 40, tint }: { name: string; photoUrl?: string | null; size?: number; /** Couleur propre à la personne (une teinte par client) ; sinon l'accent. */ tint?: string }) {
  const box = { width: rem(size), height: rem(size), borderRadius: "50%", flexShrink: 0, border: `1px solid ${tint ? mix(tint, 33) : BORDER}`, background: tint ? mix(tint, 13) : BG2 } as const;
  if (photoUrl) return <img src={photoUrl} alt={name} style={{ ...box, objectFit: "cover", display: "block" }} />;
  const initials = initialsOf(name);
  return (
    <span style={{ ...box, display: "inline-flex", alignItems: "center", justifyContent: "center", color: tint ?? ACCENT }}>
      {initials ? <RefText variant={initialsVariant(size)} strong tone="accent" color={tint}>{initials}</RefText> : <Icon name="ui-avatar" size={Math.round(size * 0.6)} />}
    </span>
  );
}
