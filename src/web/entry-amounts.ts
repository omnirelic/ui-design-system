// Sous-export `@omnirelic/ui-design-system/amounts` : visibilité des montants de Chez la Petite — bouton « Afficher les montants » (un état pour toute l'application,
// mémorisé sur l'appareil, éteint par défaut), qui le voit selon le rôle, montants retirés d'un texte libre.
export { AMOUNTS_STORAGE_KEY, createAmountsVisibility, getShowAmounts, setShowAmounts, useShowAmounts } from "./amounts-visibility";
export type { AmountsVisibility } from "./amounts-visibility";
export { ordersAmountsAccess } from "./amounts-access";
export { maskAmounts } from "./mask-amounts";
