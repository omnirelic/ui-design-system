// Spinner de CLP (web/src/ui/Spinner.tsx) : anneau 2 px, 24 px par défaut, tour en 0,7 s ; couleur = accent du thème.
import { ACCENT } from "./theme";

if (typeof document !== "undefined" && !document.getElementById("omni-spin")) {
  const style = document.createElement("style");
  style.id = "omni-spin";
  style.textContent = "@keyframes omni-spin{to{transform:rotate(360deg)}}";
  document.head.appendChild(style);
}

export type SpinnerProps = { size?: number; color?: string };

export function Spinner({ size = 24, color = ACCENT }: SpinnerProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: size, height: size, border: `2px solid color-mix(in srgb, ${color} 20%, transparent)`, borderTopColor: color, borderRadius: "50%", animation: "omni-spin 0.7s linear infinite" }} />
    </div>
  );
}
