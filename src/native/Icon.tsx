/**
 * Registre d'icônes unique de l'app — jamais d'emoji brut dans l'interface
 * (même règle que côté web, `web/src/ui/Icon.tsx`). Tracé SVG direct via
 * `react-native-svg` (déjà une dépendance réelle, utilisée pour les QR) —
 * PAS de police vectorielle (Ionicons/@expo/vector-icons) : une police
 * nécessite `expo prebuild` pour être embarquée côté natif release, ce
 * qu'on ne peut pas relancer sans risquer d'écraser d'autres
 * personnalisations natives déjà en place. Un chemin SVG n'a besoin
 * d'aucun asset natif — fiable dans n'importe quel build.
 */
import Svg, { Path, Rect, Circle } from "react-native-svg";

export type IconName =
  | "printer" | "label" | "package" | "calibrate" | "bluetooth"
  | "settings" | "chevron-right" | "chevron-left" | "copy" | "logout"
  | "refresh" | "warning" | "check" | "edit" | "alert";

export function Icon({ name, size = 16, color = "#e9e9ec" }: { name: IconName; size?: number; color?: string }) {
  const s = { width: size, height: size, viewBox: "0 0 24 24" };
  const stroke = { stroke: color, strokeWidth: 2, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (name) {
    case "printer":
      return (
        <Svg {...s}>
          <Path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" {...stroke} />
        </Svg>
      );
    case "label":
      return (
        <Svg {...s}>
          <Rect x="3" y="3" width="7" height="7" rx="1" {...stroke} />
          <Rect x="14" y="3" width="7" height="7" rx="1" {...stroke} />
          <Rect x="3" y="14" width="7" height="7" rx="1" {...stroke} />
          <Path d="M14 14h3v3h-3zM17 17h4v4h-4zM14 21h1M21 14h.01" {...stroke} />
        </Svg>
      );
    case "package":
      return (
        <Svg {...s}>
          <Path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" {...stroke} />
          <Path d="M3.27 6.96L12 12l8.73-5.04M12 22.08V12" {...stroke} />
        </Svg>
      );
    case "calibrate":
      return (
        <Svg {...s}>
          <Circle cx="12" cy="12" r="8" {...stroke} />
          <Path d="M12 8v4l3 3" {...stroke} />
        </Svg>
      );
    case "bluetooth":
      return (
        <Svg {...s}>
          <Path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11" {...stroke} />
        </Svg>
      );
    case "settings":
      return (
        <Svg {...s}>
          <Circle cx="12" cy="12" r="3" {...stroke} />
          <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...stroke} />
        </Svg>
      );
    case "chevron-right":
      return (
        <Svg {...s}>
          <Path d="M9 18l6-6-6-6" {...stroke} />
        </Svg>
      );
    case "chevron-left":
      return (
        <Svg {...s}>
          <Path d="M15 18l-6-6 6-6" {...stroke} />
        </Svg>
      );
    case "copy":
      return (
        <Svg {...s}>
          <Rect x="9" y="9" width="13" height="13" rx="2" {...stroke} />
          <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" {...stroke} />
        </Svg>
      );
    case "logout":
      return (
        <Svg {...s}>
          <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" {...stroke} />
        </Svg>
      );
    case "refresh":
      return (
        <Svg {...s}>
          <Path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" {...stroke} />
        </Svg>
      );
    case "warning":
      return (
        <Svg {...s}>
          <Path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" {...stroke} />
        </Svg>
      );
    case "check":
      return (
        <Svg {...s}>
          <Path d="M20 6L9 17l-5-5" {...stroke} />
        </Svg>
      );
    case "edit":
      return (
        <Svg {...s}>
          <Path d="M3 3v18h18M7 15l4-6 4 3 4-7" {...stroke} />
        </Svg>
      );
    case "alert":
      return (
        <Svg {...s}>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M12 8v5M12 16h.01" {...stroke} />
        </Svg>
      );
  }
}
