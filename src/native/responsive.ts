/**
 * `rem()` — taille relative basée sur la largeur d'écran, référence 375pt
 * (iPhone standard). Sur un écran de 428pt, `rem(16)` = 18.3 ; sur une
 * tablette 768pt, `rem(16)` = 32.8. Port direct de l'utilitaire de courier
 * (seule app à l'avoir eu jusqu'ici) — canonique pour tout le natif
 * désormais (voir `spacing`/`radius`/`fontSize` dans ce même module, qui
 * en dépendent). `width`/`height` capturés UNE FOIS au chargement du
 * module (comme l'original) — pas de recalcul live à la rotation.
 */
import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const BASE_WIDTH = 375;

export function rem(value: number): number {
  const w = width > 0 ? width : BASE_WIDTH;
  return Math.round((w / BASE_WIDTH) * value);
}

/** Pourcentage de la largeur viewport. */
export function vw(percent: number): number {
  return Math.round(((width || BASE_WIDTH) * percent) / 100);
}

/** Pourcentage de la hauteur viewport. */
export function vh(percent: number): number {
  return Math.round(((height || 667) * percent) / 100);
}

export const SCREEN_W = width;
export const SCREEN_H = height;
