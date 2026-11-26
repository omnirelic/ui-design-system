// Icône sémantique (CLP web/src/ui/Icon.tsx) : `<Icon name="res-couriers" />`, `<Icon name="action-add" size={16} />`.
// `size` 20 par défaut, `weight` "light" par défaut (convention CLP). `color` surcharge la couleur par défaut du registre ;
// sans couleur ni ton de registre, l'icône hérite de `currentColor`. Un ton de registre devient la variable du thème (`toneColor`).
import type { IconProps as PhIconProps } from "@phosphor-icons/react";
import { ICONS, type IconEntry } from "./icon-registry";
import { toneColor } from "./pastille-model";

export type IconName = keyof typeof ICONS;
export type IconProps = Omit<PhIconProps, "ref"> & { name: IconName };

export function Icon({ name, size = 20, weight = "light", color, ...rest }: IconProps) {
  const entry: IconEntry = ICONS[name];
  const Glyph = "icon" in entry ? entry.icon : entry;
  const defaultColor = "icon" in entry ? toneColor(entry.tone) : undefined;
  // flexShrink:0 : sans lui, un parent flex écrase le SVG (non carré, voire invisible).
  return <Glyph size={size} weight={weight} color={color ?? defaultColor} {...rest} style={{ flexShrink: 0, ...rest.style }} />;
}
