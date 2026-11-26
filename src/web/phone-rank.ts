// Qui peut voir, copier ou appeler un numéro en clair, d'après le rôle (web/src/admin/lib/phone-actions.ts de Chez la Petite, miroir de `canReveal` de
// son engine). Règle « zéro numéro en clair » : voir = superadmin seul ; appeler et copier = admin ou superadmin ; tout autre rôle ne passe que par un
// accès temporaire accordé sur demande, et c'est le serveur qui le tranche. Ceci ne fait que décider quoi dessiner : le serveur refuse de toute façon.

export type PhoneRankType = "superadmin" | "admin" | "other";
export type PhoneRevealPurposeType = "view" | "call" | "copy";

export interface AdminRolesInterface { role?: string | null; roles?: readonly string[] | null }

/** Tous les rôles d'un admin (`roles[]`, sinon `[role]` pour une session antérieure à la liste). */
export function adminRoles(admin: AdminRolesInterface | null | undefined): string[] {
  if (!admin) return [];
  return admin.roles && admin.roles.length > 0 ? [...admin.roles] : admin.role ? [admin.role] : [];
}

/** Vrai si l'un des rôles figure dans `wanted` (un rôle seul, une liste, ou rien). */
export function hasAnyRole(roles: string | readonly string[] | null | undefined, ...wanted: string[]): boolean {
  const list = typeof roles === "string" ? [roles] : roles ?? [];
  return list.some((r) => wanted.includes(r));
}

/** Le rang le plus haut gagne ; tout autre rôle = `other`. */
export function phoneRank(admin: AdminRolesInterface | null | undefined): PhoneRankType {
  const roles = adminRoles(admin);
  if (hasAnyRole(roles, "superadmin")) return "superadmin";
  return hasAnyRole(roles, "admin") ? "admin" : "other";
}

/** Miroir de `canReveal` de l'engine de CLP. */
export function canRevealPhone(rank: PhoneRankType, purpose: PhoneRevealPurposeType): boolean {
  if (rank === "superadmin") return true;
  return rank === "admin" && purpose !== "view";
}
