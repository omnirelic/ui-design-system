// Thème de nuit de l'admin (web/src/admin/lib/use-admin-night.ts + admin-night.css de Chez la Petite) : une classe posée sur <html> tant que le mode nuit est actif, retirée au démontage
// (le reste du site n'hérite jamais du thème admin). Chez CLP, la classe réécrit les dorés en blanc par sélecteurs d'attribut sur les couleurs en dur ; ici les couleurs sont des jetons,
// la feuille de la coque (`html.omni-admin-night`) bascule donc simplement l'accent du thème vers un blanc. Le signal (CLP : cuisine fermée) vient de l'application.
import { useEffect } from "react";

export const ADMIN_NIGHT_CLASS = "omni-admin-night";

export function useAdminNightTheme(active: boolean, className: string = ADMIN_NIGHT_CLASS): void {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    root.classList.add(className);
    return () => { root.classList.remove(className); };
  }, [active, className]);
}
