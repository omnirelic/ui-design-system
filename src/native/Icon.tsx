/**
 * Registre d'icônes unique des apps mobiles omnirelic — Phosphor partout
 * (même bibliothèque que les badges de `Logo`), jamais d'emoji brut (même
 * règle que côté web, `web/src/ui/Icon.tsx`) ni de tracé SVG dessiné à la
 * main par app (l'ancienne version de ce composant, avant unification —
 * voir omnirelic/mobile). Poids `regular` (contour fin) : le style le plus
 * proche des anciennes icônes tracées à la main ; les badges de `Logo`
 * restent en `fill` (plein), une distinction déjà établie, pas remise en
 * cause ici.
 */
import {
  ArrowClockwiseIcon,
  BluetoothIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  CopyIcon,
  GaugeIcon,
  GearSixIcon,
  PackageIcon,
  PencilSimpleIcon,
  PrinterIcon,
  SignOutIcon,
  TagIcon,
  WarningCircleIcon,
  WarningIcon,
} from "phosphor-react-native";

export type IconName =
  | "printer" | "label" | "package" | "calibrate" | "bluetooth"
  | "settings" | "chevron-right" | "chevron-left" | "copy" | "logout"
  | "refresh" | "warning" | "check" | "edit" | "alert";

const ICONS: Record<IconName, typeof PrinterIcon> = {
  printer: PrinterIcon,
  label: TagIcon,
  package: PackageIcon,
  calibrate: GaugeIcon,
  bluetooth: BluetoothIcon,
  settings: GearSixIcon,
  "chevron-right": CaretRightIcon,
  "chevron-left": CaretLeftIcon,
  copy: CopyIcon,
  logout: SignOutIcon,
  refresh: ArrowClockwiseIcon,
  warning: WarningIcon,
  check: CheckIcon,
  edit: PencilSimpleIcon,
  alert: WarningCircleIcon,
};

export function Icon({ name, size = 16, color = "#e9e9ec" }: { name: IconName; size?: number; color?: string }) {
  const PhosphorIcon = ICONS[name];
  return <PhosphorIcon weight="regular" size={size} color={color} />;
}
