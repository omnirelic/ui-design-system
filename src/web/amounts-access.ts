import { hasAnyRole } from "./phone-rank";

/**
 * Bouton « Afficher les montants » de la vue Commandes de Chez la Petite (web/src/admin/lib/orders-amounts.ts) : qui voit les montants selon le rôle.
 * admin / superadmin : bouton sur tous les onglets. Autres rôles : le bouton n'existe que sur l'onglet « En cours » (`active`) ; ailleurs, ni bouton ni montants.
 * `toggled` = état du bouton (mémorisé sur l'appareil, éteint tant qu'on ne l'a pas allumé). Les montants sont donc masqués par défaut, pour tous.
 */
export function ordersAmountsAccess(roles: readonly string[], tabKey: string, toggled: boolean): { showToggle: boolean; showMoney: boolean } {
  if (hasAnyRole(roles, "superadmin", "admin")) return { showToggle: true, showMoney: toggled };
  const showToggle = tabKey === "active";
  return { showToggle: showToggle, showMoney: showToggle && toggled };
}
