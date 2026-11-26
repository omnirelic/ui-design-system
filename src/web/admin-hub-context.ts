// Contextes de la coque (web/src/admin/shell/HubContext.ts de Chez la Petite).
import { createContext, useContext, type ReactNode } from "react";

/** Vrai quand la vue est rendue sous la barre d'onglets d'un hub : l'onglet actif porte déjà le titre. */
export const HubContext = createContext(false);
export const useInHub = () => useContext(HubContext);

/** Sélecteur de vue d'un onglet de hub à groupe (Menu : Plats, Catégories…) : l'en-tête de la vue l'affiche à gauche, sur sa ligne d'actions. */
export const HubSwitcherContext = createContext<ReactNode>(null);
export const useHubSwitcher = () => useContext(HubSwitcherContext);
