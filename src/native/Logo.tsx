/**
 * LogoMark + badges de contexte dans les coins bas — mutualisé pour les 3
 * apps mobiles omnirelic (courier/producer/packager, voir
 * omnirelic/engine docs/identity.html pour la taxonomie des rôles). Chaque
 * app ne fait que déclarer QUI elle est (`actor`) — le choix d'icône et son
 * dimensionnement sont décidés UNE fois ici, jamais réimplémentés par app
 * (Phosphor, comme courier l'utilisait déjà — plus cohérent qu'un emoji
 * brut par app, cf. règle web "jamais d'emoji brut en UI").
 *
 * Badges :
 *   - bas-GAUCHE = nature de l'appareil (maison si `staticLocation`, rattaché à un lieu fixe).
 *   - bas-DROITE = acteur (moto livreur, marmite producer, colis packager).
 */
import { View } from "react-native";
import { CookingPotIcon, HouseIcon, MotorcycleIcon, PackageIcon } from "phosphor-react-native";
import { LogoMark, type LogoMarkProps } from "./LogoMark";
import { theme } from "./theme";

export type LogoActor = "courier" | "producer" | "packager";

const ACTOR_ICON: Record<LogoActor, typeof MotorcycleIcon> = {
  courier: MotorcycleIcon,
  producer: CookingPotIcon,
  packager: PackageIcon,
};

export interface LogoProps extends LogoMarkProps {
  actor?: LogoActor;
  /** Appareil rattaché à un lieu fixe (ex. tablette cuisine) — badge maison en bas-gauche. */
  staticLocation?: boolean;
}

export function Logo({ size = 44, animate = true, actor, staticLocation = false }: LogoProps) {
  const b = Math.round(size * 0.44); // diamètre badge
  const off = -Math.round(b * 0.12);
  const iconSize = Math.round(b * 0.56);
  const ActorIcon = actor ? ACTOR_ICON[actor] : null;

  const badge = (icon: React.ReactNode, side: "left" | "right") => (
    <View
      style={{
        position: "absolute", bottom: off, [side]: off,
        width: b, height: b, borderRadius: b / 2,
        backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.line,
        alignItems: "center", justifyContent: "center",
      }}
    >
      {icon}
    </View>
  );

  return (
    <View style={{ width: size, height: size }}>
      <LogoMark size={size} animate={animate} />
      {staticLocation && badge(<HouseIcon weight="fill" size={iconSize} color={theme.dim} />, "left")}
      {ActorIcon && badge(<ActorIcon weight="fill" size={iconSize} color={theme.accent} />, "right")}
    </View>
  );
}
