/**
 * Remplacement direct de `Pressable` (react-native) : ajoute un retour tactile
 * systématique (ripple Android + baisse d'opacité au press) — aucun bouton de
 * l'app ne doit jamais sembler ignorer le toucher, même sans state visuel
 * dédié par écran. Un appelant peut toujours passer son propre `android_ripple`
 * ou une fonction de `style` pour surcharger.
 */
import { Pressable as RNPressable, PressableProps, StyleProp, ViewStyle } from "react-native";

export function Pressable({ style, ...rest }: PressableProps) {
  return (
    <RNPressable
      android_ripple={{ color: "rgba(255,255,255,0.18)" }}
      style={(state) => [
        typeof style === "function" ? (style as (s: { pressed: boolean }) => StyleProp<ViewStyle>)(state) : style,
        state.pressed && { opacity: 0.7 },
      ]}
      {...rest}
    />
  );
}
