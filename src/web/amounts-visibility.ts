// Bouton « Afficher les montants » : un seul état pour toute l'application (vue Commandes, cartes de notification…), mémorisé sur l'appareil
// (web/src/admin/lib/amounts-visibility.ts de Chez la Petite). Éteint tant qu'on ne l'a pas allumé ; un stockage indisponible (navigation privée) ne
// casse rien : l'état tient alors jusqu'au rechargement. Un autre onglet qui change le réglage : celui-ci suit.
// CLP écrit sous la clé « clp_admin_show_amounts » : `createAmountsVisibility({ storageKey })` la reprend ; la clé par défaut est celle d'omnirelic.
import { useSyncExternalStore } from "react";

export const AMOUNTS_STORAGE_KEY = "omni_admin_show_amounts";

export interface AmountsVisibility {
  setShowAmounts: (value: boolean) => void;
  useShowAmounts: () => [boolean, (value: boolean) => void];
  getShowAmounts: () => boolean;
}

export function createAmountsVisibility({ storageKey = AMOUNTS_STORAGE_KEY }: { storageKey?: string } = {}): AmountsVisibility {
  const readStored = (): boolean => {
    try { return localStorage.getItem(storageKey) === "1"; } catch { return false; }
  };
  let shown = readStored();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());

  const setShowAmounts = (value: boolean): void => {
    shown = value;
    try { localStorage.setItem(storageKey, value ? "1" : "0"); } catch { /* stockage indisponible */ }
    notify();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => { if (e.key === storageKey) { shown = readStored(); notify(); } });
  }

  const subscribe = (l: () => void): (() => void) => {
    listeners.add(l);
    return () => { listeners.delete(l); };
  };

  return {
    setShowAmounts,
    getShowAmounts: () => shown,
    useShowAmounts: () => [useSyncExternalStore(subscribe, () => shown, () => false), setShowAmounts],
  };
}

/** Instance partagée de l'application (clé par défaut). */
export const { setShowAmounts, useShowAmounts, getShowAmounts } = createAmountsVisibility();
