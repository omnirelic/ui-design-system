// Contexte de la galerie (web/src/admin/ui/useOpenImage.ts de CLP) : ouvre le visualiseur sur une photo ; `opener` = l'élément cliqué, qui reprend le focus à la fermeture.
import { createContext, useContext } from "react";

export type OpenImage = (id: string, opener?: HTMLElement | null) => void;

export const OpenImageContext = createContext<OpenImage | null>(null);

/** `null` hors d'une galerie (aperçu, test) : l'appelant garde alors son comportement par défaut. */
export function useOpenImage(): OpenImage | null {
  return useContext(OpenImageContext);
}
