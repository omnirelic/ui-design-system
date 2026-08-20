/**
 * Marque omnirelic ANIMÉE (React Native) — le groupe rayons+nœuds tourne
 * (18s, linéaire) autour du centre, anneau + losange + cœur fixes. Port
 * fidèle du mark web (`web/LogoMark.tsx`, anneau + 6 nœuds + losange,
 * dégradé teal→sky) — même identité visuelle, rendu natif (react-native-svg
 * + Animated) au lieu de SVG DOM + CSS keyframes.
 */
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Circle, Defs, G, Line, LinearGradient, Rect, Stop } from "react-native-svg";
import { theme } from "./theme";

const NODES: Array<[number, number]> = [
  [32, 10], [51, 21], [51, 43], [32, 54], [13, 43], [13, 21],
];

const AnimatedG = Animated.createAnimatedComponent(G);

export interface LogoMarkProps {
  size?: number;
  /** Tourne (18s/tour) — jamais sur le logo de header, seulement sur un splash/écran d'attente. */
  animate?: boolean;
}

export function LogoMark({ size = 44, animate = true }: LogoMarkProps) {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;
    const a = Animated.loop(
      Animated.timing(rot, { toValue: 1, duration: 18000, easing: Easing.linear, useNativeDriver: true }),
    );
    a.start();
    return () => a.stop();
  }, [animate, rot]);

  const rotation = rot.interpolate({ inputRange: [0, 1], outputRange: [0, 360] });

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="omx" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={theme.t1} />
          <Stop offset="1" stopColor={theme.t2} />
        </LinearGradient>
      </Defs>

      {/* Anneau fixe */}
      <Circle cx="32" cy="32" r="22" stroke="#3f3f46" strokeWidth="1.25" fill="none" />

      {/* Rayons + nœuds : SEUL ce groupe tourne */}
      <AnimatedG rotation={rotation as unknown as number} originX={32} originY={32}>
        <G opacity={0.45}>
          {NODES.map(([x, y], i) => (
            <Line key={`l${i}`} x1="32" y1="32" x2={x} y2={y} stroke="url(#omx)" strokeWidth="1.25" strokeLinecap="round" />
          ))}
        </G>
        {NODES.map(([x, y], i) => (
          <Circle key={`n${i}`} cx={x} cy={y} r="3" fill="url(#omx)" />
        ))}
      </AnimatedG>

      {/* Losange + cœur fixes */}
      <Rect x="20.5" y="20.5" width="23" height="23" rx="6" transform="rotate(45 32 32)" fill="url(#omx)" />
      <Circle cx="32" cy="32" r="5" fill={theme.bg} />
    </Svg>
  );
}
