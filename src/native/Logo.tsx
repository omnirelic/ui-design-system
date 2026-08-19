/**
 * LogoMark + badges de contexte dans les coins bas — remplace les 3 copies
 * quasi-identiques qui existaient par app (courier/producer/packager, avant
 * ce package). Volontairement générique : le mark ne connaît AUCUN acteur
 * ni bibliothèque d'icônes (courier utilisait Phosphor, producer/packager
 * de l'emoji brut) — l'appelant passe son propre badge en `ReactNode`
 * (icône, emoji, ce qu'il veut), ce composant ne fait que le positionner.
 *
 * Badges :
 *   - bas-GAUCHE = nature de l'appareil (ex. maison si STATIQUE, rattaché à un lieu).
 *   - bas-DROITE = acteur (ex. moto livreur, marmite producer, colis packager).
 */
import type { ReactNode } from "react";
import { View } from "react-native";
import { LogoMark, type LogoMarkProps } from "./LogoMark";
import { theme } from "./theme";

/** Badge statique, ou fonction du diamètre réel du badge (pour dimensionner soi-même un emoji/icône, comme l'ancien `Math.round(b * 0.58)` par app). */
export type LogoBadge = ReactNode | ((badgeDiameter: number) => ReactNode);

export interface LogoProps extends LogoMarkProps {
  bottomLeftBadge?: LogoBadge;
  bottomRightBadge?: LogoBadge;
}

export function Logo({ size = 44, animate = true, bottomLeftBadge, bottomRightBadge }: LogoProps) {
  const b = Math.round(size * 0.44); // diamètre badge
  const off = -Math.round(b * 0.12);

  const badge = (value: LogoBadge, side: "left" | "right") => {
    const content = typeof value === "function" ? value(b) : value;
    return badgeView(content, side);
  };

  const badgeView = (content: ReactNode, side: "left" | "right") => (
    <View
      style={{
        position: "absolute", bottom: off, [side]: off,
        width: b, height: b, borderRadius: b / 2,
        backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.line,
        alignItems: "center", justifyContent: "center",
      }}
    >
      {content}
    </View>
  );

  return (
    <View style={{ width: size, height: size }}>
      <LogoMark size={size} animate={animate} />
      {bottomLeftBadge != null && badge(bottomLeftBadge, "left")}
      {bottomRightBadge != null && badge(bottomRightBadge, "right")}
    </View>
  );
}
